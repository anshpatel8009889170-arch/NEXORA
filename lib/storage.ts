import { supabase } from "@/lib/supabase/client";

export interface StorageUploadResult {
  url: string;
  path?: string;
  storage: "supabase-direct" | "supabase-api" | "local-preview";
  error?: string;
}

/**
 * Uploads a food image file to Supabase Storage bucket 'menu-images'
 * Returns the public CDN URL to store in menu_items.image
 */
export async function uploadDishImage(
  file: File,
  bucketName = "menu-images"
): Promise<StorageUploadResult> {
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const cleanBase = file.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase();
  const filePath = `dishes/${Date.now()}_${cleanBase}.${fileExt}`;

  // 1. Try Direct Supabase Client Upload
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (!error && data) {
      const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return {
        url: publicUrlData.publicUrl,
        path: filePath,
        storage: "supabase-direct",
      };
    }
  } catch (clientErr) {
    console.warn("Direct Supabase Storage upload note:", clientErr);
  }

  // 2. Fallback to Server API Route (/api/upload)
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucketName);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const json = await res.json();
      if (json.url) {
        return {
          url: json.url,
          path: json.path || filePath,
          storage: "supabase-api",
        };
      }
    }
  } catch (apiErr) {
    console.warn("API route upload note:", apiErr);
  }

  // 3. Fallback to FileReader base64/data URL for 100% offline resilience
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        url: (reader.result as string) || URL.createObjectURL(file),
        path: filePath,
        storage: "local-preview",
      });
    };
    reader.onerror = () => {
      resolve({
        url: URL.createObjectURL(file),
        path: filePath,
        storage: "local-preview",
        error: "Fallback to local preview",
      });
    };
    reader.readAsDataURL(file);
  });
}
