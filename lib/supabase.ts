import { createClient } from "@supabase/supabase-js";
import type { Person } from "@/types/person";
import type { AnalysisResult } from "@/utils/file-utils";

// ตรวจสอบว่า environment variables มีอยู่จริง
const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are missing");
    throw new Error("Supabase environment variables are missing");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
};

// Singleton pattern to avoid multiple instances
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export const getSupabaseBrowserClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
};

// ปรับปรุงฟังก์ชัน getSupabaseServerClient เพื่อตรวจสอบ environment variables
export const getSupabaseServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase server environment variables are missing");
    throw new Error("Supabase server environment variables are missing");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};

// Database types
export type Database = {
  public: {
    Tables: {
      seedcamp_people: {
        Row: Person;
        Insert: Omit<Person, "id">;
        Update: Partial<Omit<Person, "id">>;
      };
    };
  };
};

// API functions
export async function fetchPeople(): Promise<Person[]> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await supabase
      .from("seedcamp_people")
      .select("*")
      .order("nick_name");

    if (error) {
      console.error("Error fetching people:", error);
      throw error;
    }

    if (!data) {
      return [];
    }

    return data.map(transformPersonFromDB);
  } catch (error) {
    console.error("Failed to fetch people data:", error);
    throw error;
  }
}

export async function updatePerson(
  id: string,
  person: Partial<Person>
): Promise<Person | null> {
  const supabase = getSupabaseBrowserClient();

  try {
    console.log("🔄 Updating person in Supabase:", { id, person });

    // Transform the data for database
    const dbData = transformPersonToDB(person);
    console.log("📝 Transformed data for DB:", dbData);

    const { data, error } = await supabase
      .from("seedcamp_people")
      .update(dbData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase update error:", error);
      throw new Error(`Failed to update person: ${error.message}`);
    }

    if (!data) {
      throw new Error("No data returned from update");
    }

    console.log("✅ Successfully updated person in Supabase:", data);
    return transformPersonFromDB(data);
  } catch (error) {
    console.error("❌ Error updating person:", error);
    throw error;
  }
}

// Helper functions to transform data between app and DB formats
function transformPersonFromDB(dbPerson: any): Person {
  return {
    id: dbPerson.id,
    nick_name: dbPerson.nick_name || "",
    first_name: dbPerson.first_name || "",
    last_name: dbPerson.last_name || "",
    gender: mapGender(dbPerson.gender),
    phone: dbPerson.phone || "",
    shirt_size: mapShirtSize(dbPerson.shirt_size),
    payment_status: mapPaymentStatus(dbPerson.payment_status),
    payment_amount: dbPerson.payment_amount || 0,
    payment_slip: dbPerson.payment_slip,
    can_go: dbPerson.can_go === null ? true : dbPerson.can_go,
    remark: dbPerson.remark || "",
    group_care: dbPerson.group_care || "ungroup",
    congenital_disease: dbPerson.congenital_disease,
    created_at: dbPerson.created_at,
    updated_at: dbPerson.updated_at,
  };
}

function transformPersonToDB(person: Partial<Person>): any {
  const dbPerson: any = {};

  // Only include fields that are provided
  if (person.nick_name !== undefined) dbPerson.nick_name = person.nick_name;
  if (person.first_name !== undefined) dbPerson.first_name = person.first_name;
  if (person.last_name !== undefined) dbPerson.last_name = person.last_name;
  if (person.gender !== undefined)
    dbPerson.gender = person.gender.toLowerCase();
  if (person.phone !== undefined) dbPerson.phone = person.phone;
  if (person.shirt_size !== undefined) dbPerson.shirt_size = person.shirt_size;
  if (person.payment_status !== undefined)
    dbPerson.payment_status = person.payment_status.toLowerCase();
  if (person.payment_amount !== undefined)
    dbPerson.payment_amount = person.payment_amount;
  // if (person.payment_slip !== undefined) dbPerson.payment_slip = person.payment_slip
  if (person.can_go !== undefined) dbPerson.can_go = person.can_go;
  if (person.remark !== undefined) dbPerson.remark = person.remark;
  if (person.group_care !== undefined) dbPerson.group_care = person.group_care;
  if (person.congenital_disease !== undefined)
    dbPerson.congenital_disease = person.congenital_disease;

  // Always update the updated_at timestamp
  dbPerson.updated_at = new Date().toISOString();

  return dbPerson;
}

// Mapping functions to ensure data consistency
function mapGender(gender: string | null): "Male" | "Female" | "Other" {
  if (!gender) return "Other";

  const lowerGender = gender.toLowerCase();
  if (lowerGender === "male") return "Male";
  if (lowerGender === "female") return "Female";
  return "Other";
}

function mapShirtSize(
  size: string | null
): "XS" | "S" | "M" | "L" | "XL" | "XXL" {
  if (!size) return "M";

  const upperSize = size.toUpperCase();
  if (upperSize === "XS") return "XS";
  if (upperSize === "S") return "S";
  if (upperSize === "M") return "M";
  if (upperSize === "L") return "L";
  if (upperSize === "XL") return "XL";
  if (upperSize === "XXL" || upperSize === "2XL") return "XXL";

  return "M"; // Default
}

function mapPaymentStatus(
  status: string | null
): "Paid" | "Pending" | "Unpaid" {
  if (!status) return "Unpaid";

  const lowerStatus = status.toLowerCase();
  if (lowerStatus === "paid") return "Paid";
  if (lowerStatus === "pending") return "Pending";
  return "Unpaid";
}

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
 * Fetches group payment analysis data
 */
export async function fetchGroupPaymentAnalysis(): Promise<Array<{
  group_care: string;
  total_extracted_amount: number;
  payment_slip_count: number;
}>> {
  const supabase = getSupabaseBrowserClient();

  try {
    // Try to use a direct SQL query with proper joins
    const { data, error } = await supabase
      .from('payment_slips')
      .select(`
        extracted_amount,
        seedcamp_people!inner(group_care)
      `);
    
    if (error) {
      console.error("Error fetching group payment analysis:", error);
      throw error;
    }

    // Group the data manually
    const groupedData = (data || []).reduce((acc, item) => {
      const groupCare = (item.seedcamp_people as any)?.group_care || 'ungroup';
      if (!acc[groupCare]) {
        acc[groupCare] = {
          group_care: groupCare,
          total_extracted_amount: 0,
          payment_slip_count: 0
        };
      }
      acc[groupCare].total_extracted_amount += item.extracted_amount || 0;
      acc[groupCare].payment_slip_count += 1;
      return acc;
    }, {} as Record<string, {group_care: string; total_extracted_amount: number; payment_slip_count: number}>);

    return Object.values(groupedData).sort((a, b) => b.total_extracted_amount - a.total_extracted_amount);
  } catch (error) {
    console.error("Failed to fetch group payment analysis:", error);
    return [];
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
