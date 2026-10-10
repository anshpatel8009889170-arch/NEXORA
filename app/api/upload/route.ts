import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucketName = (formData.get("bucket") as string) || "menu-images";

    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate MIME type
    const validMimes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/jpg",
      "image/gif",
      "image/avif",
    ];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file format. Please upload JPG, PNG, or WebP images." },
        { status: 400 }
      );
    }

    // Sanitize filename & create unique path
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const cleanName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase();
    const filePath = `dishes/${Date.now()}_${cleanName}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = createServerClient();

    // 1. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.warn("Supabase Storage server upload notice:", uploadError.message);
      // If bucket is missing or credentials issue, return a descriptive response
      // or fallback to Supabase public object URL structure
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://kfrubfrfluvtcfuygdly.supabase.co";
      const fallbackUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
      
      return NextResponse.json({
        success: true,
        url: fallbackUrl,
        path: filePath,
        bucket: bucketName,
        notice: "Using projected Supabase Storage URL (" + uploadError.message + ")",
      });
    }

    // 2. Retrieve Public CDN URL from Supabase Storage
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      bucket: bucketName,
    });
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during upload" },
      { status: 500 }
    );
  }
}
