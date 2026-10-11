import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/security/requireAdmin";
import { enforceRateLimit } from "@/lib/security/rateLimiter";

// Allowed storage buckets for assets
const ALLOWED_BUCKETS = new Set(["menu-images", "restaurant-assets"]);

// Maximum file size: 5 MB
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

// Extension mapping from verified MIME
const EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/**
 * Validates binary magic bytes (file signature) to prevent MIME-type spoofing
 */
function validateFileSignature(
  buffer: Buffer,
  declaredMime: string
): { valid: boolean; detectedFormat?: string } {
  if (buffer.length < 12) {
    return { valid: false };
  }

  // 1. JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    const isJpeg = declaredMime === "image/jpeg" || declaredMime === "image/jpg";
    return { valid: isJpeg, detectedFormat: "image/jpeg" };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: declaredMime === "image/png", detectedFormat: "image/png" };
  }

  // 3. GIF: 47 49 46 38 (GIF87a / GIF89a)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return { valid: declaredMime === "image/gif", detectedFormat: "image/gif" };
  }

  // 4. WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: declaredMime === "image/webp", detectedFormat: "image/webp" };
  }

  // 5. AVIF: bytes 4..11 have 'ftypavif' or 'ftypavis'
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70 &&
    buffer[8] === 0x61 &&
    buffer[9] === 0x76 &&
    buffer[10] === 0x69 &&
    (buffer[11] === 0x66 || buffer[11] === 0x73)
  ) {
    return { valid: declaredMime === "image/avif", detectedFormat: "image/avif" };
  }

  return { valid: false };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce Administrator / Owner Only Authorization
    const auth = await requireAdmin(request, ["owner", "admin"]);
    if (!auth.authorized) {
      return auth.response;
    }

    // Rate limiting: 20 uploads per minute per admin IP
    const rateLimitRes = enforceRateLimit(request, "admin_upload", {
      limit: 20,
      windowMs: 60 * 1000,
    });
    if (rateLimitRes) return rateLimitRes;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const requestedBucket = ((formData.get("bucket") as string) || "menu-images").trim();

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided for upload." },
        { status: 400 }
      );
    }

    // 2. Fixed allow-list validation for storage bucket
    if (!ALLOWED_BUCKETS.has(requestedBucket)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid storage bucket: '${requestedBucket}'. Allowed buckets: ${Array.from(ALLOWED_BUCKETS).join(", ")}.`,
        },
        { status: 400 }
      );
    }
    const bucketName = requestedBucket;

    // 3. File size limit enforcement (Max 5 MB)
    if (file.size <= 0) {
      return NextResponse.json(
        { success: false, error: "Uploaded file is empty (0 bytes)." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the 5 MB limit. Provided file size is ${sizeMb} MB.`,
        },
        { status: 400 }
      );
    }

    // 4. Validate declared MIME type
    const normalizedMime = file.type?.toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(normalizedMime)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type: '${file.type}'. Allowed formats: JPG, PNG, WebP, GIF, AVIF.`,
        },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Validate binary magic bytes signature (Prevents MIME spoofing)
    const signatureCheck = validateFileSignature(buffer, normalizedMime);
    if (!signatureCheck.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file content signature. The file binary header does not match a genuine image format.",
        },
        { status: 400 }
      );
    }

    // 5. Generate secure server-side UUID filename
    const extension = EXTENSION_MAP[signatureCheck.detectedFormat || normalizedMime] || "jpg";
    const uniqueFileId = crypto.randomUUID();
    const filePath = `dishes/${uniqueFileId}.${extension}`;

    const supabase = createServerClient({ admin: true });

    // 6. Upload to Supabase Storage with strict failure handling
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: normalizedMime,
        cacheControl: "31536000, immutable",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage upload failure:", uploadError.message);
      // Return actual 502/500 failure; NEVER return fake/projected URL
      return NextResponse.json(
        {
          success: false,
          error: `Storage upload failed: ${uploadError.message}`,
        },
        { status: 502 }
      );
    }

    // 7. Retrieve Public CDN URL for the uploaded asset
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      bucket: bucketName,
      size: file.size,
      contentType: normalizedMime,
      uploadedAt: new Date().toISOString(),
      uploadedBy: {
        email: auth.user.email,
        role: auth.user.role,
      },
    });
  } catch (error: any) {
    console.error("Upload API unhandled error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error during upload" },
      { status: 500 }
    );
  }
}
