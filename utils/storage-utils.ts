import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for server-side operations
const getSupabaseServerClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

/**
 * Uploads a file to Supabase storage
 */
export async function uploadFileToStorage(
  file: File, 
  filePath: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    console.log(`☁️ Uploading ${file.name} to storage...`);
    
    const supabase = getSupabaseServerClient();
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("payment-slips")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error(`❌ Upload failed for ${file.name}:`, uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("payment-slips")
      .getPublicUrl(filePath);

    return { success: true, publicUrl: urlData.publicUrl };
  } catch (error) {
    console.error(`❌ Error uploading ${file.name}:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown upload error" };
  }
}
