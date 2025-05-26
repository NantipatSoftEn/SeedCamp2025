import type { SupabaseClient } from "@supabase/supabase-js"

export class SupabaseStorageService {
  private supabaseClient: SupabaseClient
  private bucketName: string

  constructor(supabaseClient: SupabaseClient, bucketName: string) {
    this.supabaseClient = supabaseClient
    this.bucketName = bucketName
  }

  async uploadPaymentSlip(file: File, personId: number): Promise<string | null> {
    try {
      const filePath = `payment-slips/${personId}/${file.name}`
      const { data, error } = await this.supabaseClient.storage.from(this.bucketName).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("Error uploading file:", error)
        return null
      }

      const publicURL = this.supabaseClient.storage.from(this.bucketName).getPublicUrl(filePath).data.publicUrl

      // Insert the URL into the database, using the person's database ID
      const { error: dbError } = await this.supabaseClient.from("payment_slips").insert([
        {
          person_id: personId, // Use the person's database ID
          file_path: filePath,
          file_url: publicURL,
        },
      ])

      if (dbError) {
        console.error("Error inserting into database:", dbError)
        // Optionally delete the file from storage if DB insertion fails
        await this.supabaseClient.storage.from(this.bucketName).remove([filePath])
        return null
      }

      console.log(`Payment slip uploaded and database record created for person ID: ${personId}`) // Log the person's database ID
      return publicURL
    } catch (error) {
      console.error("Unexpected error uploading payment slip:", error)
      return null
    }
  }

  async deletePaymentSlip(filePath: string, personId: number): Promise<boolean> {
    try {
      const { error } = await this.supabaseClient.storage.from(this.bucketName).remove([filePath])

      if (error) {
        console.error("Error deleting file:", error)
        return false
      }

      const { error: dbError } = await this.supabaseClient
        .from("payment_slips")
        .delete()
        .eq("file_path", filePath)
        .eq("person_id", personId)

      if (dbError) {
        console.error("Error deleting database record:", dbError)
        return false
      }

      console.log(`Payment slip deleted: ${filePath}`)
      return true
    } catch (error) {
      console.error("Unexpected error deleting payment slip:", error)
      return false
    }
  }

  async getPersonPaymentSlips(personId: number): Promise<any[]> {
    try {
      const { data, error } = await this.supabaseClient.from("payment_slips").select("*").eq("person_id", personId)

      if (error) {
        console.error("Error fetching payment slips:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Unexpected error fetching payment slips:", error)
      return []
    }
  }
}
\`\`\`
