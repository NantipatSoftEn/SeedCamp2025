import { createClient } from "@supabase/supabase-js"
import type { Person } from "@/types/person"

// ตรวจสอบว่า environment variables มีอยู่จริง
const createBrowserClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase environment variables are missing")
    throw new Error("Supabase environment variables are missing")
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Singleton pattern to avoid multiple instances
let browserClient: ReturnType<typeof createBrowserClient> | null = null

export const getSupabaseBrowserClient = () => {
  if (!browserClient) {
    browserClient = createBrowserClient()
  }
  return browserClient
}

// ปรับปรุงฟังก์ชัน getSupabaseServerClient เพื่อตรวจสอบ environment variables
export const getSupabaseServerClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase server environment variables are missing")
    throw new Error("Supabase server environment variables are missing")
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Database types
export type Database = {
  public: {
    Tables: {
      seedcamp_people: {
        Row: Person
        Insert: Omit<Person, "id">
        Update: Partial<Omit<Person, "id">>
      }
    }
  }
}

// API functions
// ปรับปรุงฟังก์ชัน fetchPeople
export async function fetchPeople(): Promise<Person[]> {
  const supabase = getSupabaseBrowserClient()

  try {
    const { data, error } = await supabase.from("seedcamp_people").select("*").order("nick_name")

    if (error) {
      console.error("Error fetching people:", error)
      throw error
    }

    if (!data) {
      return []
    }

    return data.map(transformPersonFromDB)
  } catch (error) {
    console.error("Failed to fetch people data:", error)
    throw error
  }
}

export async function updatePerson(id: string, person: Partial<Person>): Promise<Person | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("seedcamp_people")
    .update(transformPersonToDB(person))
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating person:", error)
    return null
  }

  return transformPersonFromDB(data)
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
  }
}

function transformPersonToDB(person: Partial<Person>): any {
  const dbPerson: any = { ...person }

  // Transform gender to lowercase for DB
  if (person.gender) {
    dbPerson.gender = person.gender.toLowerCase()
  }

  return dbPerson
}

// Mapping functions to ensure data consistency
function mapGender(gender: string | null): "Male" | "Female" | "Other" {
  if (!gender) return "Other"

  const lowerGender = gender.toLowerCase()
  if (lowerGender === "male") return "Male"
  if (lowerGender === "female") return "Female"
  return "Other"
}

function mapShirtSize(size: string | null): "XS" | "S" | "M" | "L" | "XL" | "XXL" {
  if (!size) return "M"

  const upperSize = size.toUpperCase()
  if (upperSize === "XS") return "XS"
  if (upperSize === "S") return "S"
  if (upperSize === "M") return "M"
  if (upperSize === "L") return "L"
  if (upperSize === "XL") return "XL"
  if (upperSize === "XXL" || upperSize === "2XL") return "XXL"

  return "M" // Default
}

function mapPaymentStatus(status: string | null): "Paid" | "Pending" | "Unpaid" {
  if (!status) return "Unpaid"

  const lowerStatus = status.toLowerCase()
  if (lowerStatus === "paid") return "Paid"
  if (lowerStatus === "pending") return "Pending"
  return "Unpaid"
}
