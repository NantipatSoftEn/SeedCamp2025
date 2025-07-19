import { createClient } from "@supabase/supabase-js";
import type { AnalysisResult } from "./file-utils";

// Initialize Supabase client for server-side operations
const getSupabaseServerClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

/**
 * Verifies if a person exists in the database
 */
export async function verifyPersonExists(firstName: string): Promise<{
  exists: boolean;
  data?: { id: string; first_name: string };
  error?: string;
}> {
  try {
    const supabase = getSupabaseServerClient();

    const { data: personCheck, error: personError } = await supabase
      .from("seedcamp_people")
      .select("id, first_name")
      .like("first_name", `%${firstName}%`)
      .single();

    if (personError || !personCheck) {
      return {
        exists: false,
        error: `Person with name ${firstName} not found`,
      };
    }

    return { exists: true, data: personCheck };
  } catch (error) {
    return {
      exists: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Inserts payment slip record into database
 */
export async function insertPaymentSlipRecord(
  user_id: string,
  filePath: string,
  file: File,
  person_id: string,
  analysisResult: AnalysisResult | null
): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = getSupabaseServerClient();

  const insertData = {
    user_id,
    path: filePath,
    original_name: file.name,
    file_size: file.size,
    mime_type: file.type,
    uploaded_at: new Date().toISOString(),
    extracted_amount: analysisResult?.amount || null,
    person_id,
    // analysis_text: analysisResult?.itemName || null,
  };

  console.log(`💾 Inserting payment slip record for ${file.name}...`);

  const { data: insertResult, error: insertError } = await supabase
    .from("payment_slips")
    .insert(insertData)
    .select()
    .single();

  if (insertError) {
    console.error(`❌ Database insert failed for ${file.name}:`, insertError);
    return { success: false, error: insertError.message };
  }

  console.log(`✅ Database record created for ${file.name}:`, insertResult);
  return { success: true, data: insertResult };
}
