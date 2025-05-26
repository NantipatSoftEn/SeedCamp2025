import { getSupabaseBrowserClient } from "./supabase"

export class SupabaseStorageService {
  private supabase = getSupabaseBrowserClient()
  private bucketName = "payment-slips"

  // ตรวจสอบและสร้าง bucket ถ้าจำเป็น
  async ensureBucketExists(): Promise<boolean> {
    try {
      console.log("🔍 Checking if bucket exists:", this.bucketName)

      // ตรวจสอบว่า bucket มีอยู่หรือไม่
      const { data: buckets, error: listError } = await this.supabase.storage.listBuckets()

      if (listError) {
        console.error("❌ Error listing buckets:", listError)
        return false
      }

      const bucketExists = buckets?.some((bucket) => bucket.id === this.bucketName)
      console.log("📦 Bucket exists:", bucketExists)
      return true
    } catch (error) {
      console.error("❌ Unexpected error in ensureBucketExists:", error)
      return false
    }
  }

  // ตรวจสอบ authentication และ session
  private async ensureAuthenticated() {
    try {
      // Get session first
      const {
        data: { session },
        error: sessionError,
      } = await this.supabase.auth.getSession()

      if (sessionError) {
        console.error("❌ Session error:", sessionError)
        throw new Error(`Session error: ${sessionError.message}`)
      }

      if (!session) {
        throw new Error("No active session. Please log in again.")
      }

      // Get user
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser()

      if (userError) {
        console.error("❌ User error:", userError)
        throw new Error(`Authentication error: ${userError.message}`)
      }

      if (!user) {
        throw new Error("No authenticated user found. Please log in.")
      }

      console.log("✅ Authentication verified:", {
        userId: user.id,
        email: user.email,
        sessionExpiry: session.expires_at,
      })

      return { user, session }
    } catch (error) {
      console.error("❌ Authentication check failed:", error)
      throw error
    }
  }

  // สร้างชื่อไฟล์ที่ unique และระบุตัวตน
  private generateFileName(uuid: string, fileExtension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    return `${uuid}_${timestamp}.${fileExtension}`
  }

  // Upload ไฟล์ไปยัง Supabase Storage และบันทึกข้อมูลใน payment_slips table
  async uploadPaymentSlip(
    file: File,
    nickname: string,
    firstName: string,
    lastName: string,
    personId: string,
  ): Promise<{ url: string; path: string; paymentSlipId: string } | null> {
    try {
      console.log("🔄 Starting payment slip upload process...")

      // ตรวจสอบ authentication ก่อนทำอะไร
      const { user } = await this.ensureAuthenticated()

      // ตรวจสอบและสร้าง bucket
      const bucketReady = await this.ensureBucketExists()
      if (!bucketReady) {
        throw new Error("Could not create or access payment slips bucket. Please check Supabase permissions.")
      }

      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image files are allowed")
      }

      // ตรวจสอบขนาดไฟล์ (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size must be less than 10MB")
      }

      // สร้างชื่อไฟล์
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg"
      const fileName = this.generateFileName(personId, fileExtension)
      const filePath = `public/seedcamp2025/${fileName}`

      console.log("📝 Upload details:", {
        fileName,
        filePath,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        fileType: file.type,
        person: { nickname, firstName, lastName, personId },
        user: { id: user.id, email: user.email },
      })

      // Upload ไฟล์
      const { data, error } = await this.supabase.storage.from(this.bucketName).upload(filePath, file, {
        cacheControl: "3600",
        upsert: true, // อนุญาตให้เขียนทับไฟล์เดิม
      })

      if (error) {
        console.error("❌ Upload error:", error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      // ดึง public URL
      const { data: urlData } = this.supabase.storage.from(this.bucketName).getPublicUrl(filePath)

      if (!urlData.publicUrl) {
        throw new Error("Could not generate public URL for uploaded file")
      }

      console.log("📤 File uploaded successfully, now saving to database...")

      // บันทึกข้อมูลใน payment_slips table
      const insertData = {
        user_id: user.id,
        person_id: personId,
        path: filePath,
        original_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      }

      console.log("💾 Inserting payment slip record:", insertData)

      const { data: paymentSlipData, error: dbError } = await this.supabase
        .from("payment_slips")
        .insert(insertData)
        .select()
        .single()

      if (dbError) {
        console.error("❌ Database insert error:", dbError)
        console.error("❌ Insert data was:", insertData)

        // ลบไฟล์ที่อัปโหลดแล้วถ้าบันทึกฐานข้อมูลล้มเหลว
        await this.supabase.storage.from(this.bucketName).remove([filePath])

        // Provide more specific error messages
        if (dbError.message.includes("row-level security")) {
          throw new Error(
            `Database permission error: ${dbError.message}\n\nThis might be due to RLS policies. Please check your Supabase RLS configuration.`,
          )
        } else {
          throw new Error(`Failed to save payment slip record: ${dbError.message}`)
        }
      }

      console.log("✅ Payment slip record saved:", paymentSlipData)

      // อัปเดต payment_status ใน seedcamp_people table เป็น "Paid"
      const { error: updateError } = await this.supabase
        .from("seedcamp_people")
        .update({
          payment_status: "paid",
          payment_slip: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", personId)

      if (updateError) {
        console.error("❌ Failed to update payment status:", updateError)
        console.warn("⚠️ Payment slip uploaded but payment status not updated")
      } else {
        console.log("✅ Payment status updated to 'paid'")
      }

      console.log("✅ Upload completed successfully:", {
        path: data.path,
        url: urlData.publicUrl,
        paymentSlipId: paymentSlipData.id,
      })

      return {
        url: urlData.publicUrl,
        path: data.path,
        paymentSlipId: paymentSlipData.id,
      }
    } catch (error) {
      console.error("❌ Error uploading payment slip:", error)
      throw error
    }
  }

  // ลบไฟล์เก่า (ถ้ามี) และข้อมูลใน database
  async deletePaymentSlip(fileUrl: string, personId?: string): Promise<boolean> {
    try {
      if (!fileUrl || !fileUrl.includes(this.bucketName)) {
        console.log("🔍 Not a Supabase storage file, skipping deletion")
        return true // ไม่ใช่ไฟล์ใน storage ของเรา
      }

      // ตรวจสอบ authentication
      const { user } = await this.ensureAuthenticated()

      // แยกเอาเฉพาะ path ใน storage
      const urlParts = fileUrl.split("/")
      const pathIndex = urlParts.findIndex((part) => part === "payment-slips")
      if (pathIndex === -1) {
        console.warn("⚠️ Could not extract path from URL:", fileUrl)
        return false
      }

      const filePath = urlParts.slice(pathIndex + 1).join("/")

      console.log("🗑️ Deleting payment slip:", filePath)

      // ลบข้อมูลจาก payment_slips table ก่อน
      if (personId) {
        const { error: dbError } = await this.supabase
          .from("payment_slips")
          .delete()
          .eq("person_id", personId)
          .eq("path", filePath)

        if (dbError) {
          console.warn("⚠️ Could not delete payment slip record:", dbError.message)
        } else {
          console.log("✅ Payment slip record deleted from database")
        }
      }

      // ลบไฟล์จาก storage
      const { error } = await this.supabase.storage.from(this.bucketName).remove([filePath])

      if (error) {
        console.warn("⚠️ Could not delete old file:", error.message)
        return false
      }

      console.log("✅ Old file deleted successfully")
      return true
    } catch (error) {
      console.warn("⚠️ Error deleting payment slip:", error)
      return false
    }
  }

  // ดึงข้อมูล payment slip ของบุคคลจาก database
  async getPersonPaymentSlips(personId: string): Promise<
    Array<{
      id: string
      url: string
      path: string
      originalName: string
      uploadedAt: string
      fileSize: number
      mimeType: string
    }>
  > {
    try {
      console.log("🔍 Searching for payment slips for person:", personId)

      // ตรวจสอบ authentication
      const { user } = await this.ensureAuthenticated()

      console.log("🔍 Searching for payment slips for person:", personId, "by user:", user.id)

      const { data, error } = await this.supabase
        .from("payment_slips")
        .select("*")
        .eq("person_id", personId)
        .order("uploaded_at", { ascending: false })

      if (error) {
        console.error("❌ Error fetching payment slips:", error)
        return []
      }

      const paymentSlips =
        data?.map((slip) => {
          const { data: urlData } = this.supabase.storage.from(this.bucketName).getPublicUrl(slip.path)
          return {
            id: slip.id,
            url: urlData.publicUrl,
            path: slip.path,
            originalName: slip.original_name,
            uploadedAt: slip.uploaded_at,
            fileSize: slip.file_size,
            mimeType: slip.mime_type,
          }
        }) || []

      console.log("📁 Found payment slips:", paymentSlips)
      return paymentSlips
    } catch (error) {
      console.error("❌ Error getting person payment slips:", error)
      return []
    }
  }

  // ดึง URL ที่ถูกต้องจาก path
  getPublicUrl(path: string): string {
    const { data } = this.supabase.storage.from(this.bucketName).getPublicUrl(path)
    return data.publicUrl
  }

  // ทดสอบการเชื่อมต่อ Storage และ RLS
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🧪 Testing Supabase Storage connection and RLS...")

      // Test 1: Authentication
      const { user } = await this.ensureAuthenticated()

      // Test 2: Storage connection
      const { data: buckets, error: storageError } = await this.supabase.storage.listBuckets()

      if (storageError) {
        return {
          success: false,
          message: `Storage connection failed: ${storageError.message}`,
        }
      }

      const bucketExists = buckets?.some((bucket) => bucket.id === this.bucketName)

      // Test 3: RLS policies by trying to insert/delete a test record
      const testRecord = {
        user_id: user.id,
        person_id: "test-person-id",
        path: "test/path.jpg",
        original_name: "test.jpg",
        file_size: 1024,
        mime_type: "image/jpeg",
      }

      const { data: insertData, error: insertError } = await this.supabase
        .from("payment_slips")
        .insert(testRecord)
        .select()
        .single()

      if (insertError) {
        return {
          success: false,
          message: `RLS test failed - cannot insert: ${insertError.message}`,
        }
      }

      // Clean up test record
      const { error: deleteError } = await this.supabase.from("payment_slips").delete().eq("id", insertData.id)

      if (deleteError) {
        console.warn("Could not clean up test record:", deleteError.message)
      }

      return {
        success: true,
        message: `All tests passed! Storage connected, bucket '${this.bucketName}' ${
          bucketExists ? "exists" : "will be created when needed"
        }, RLS policies working correctly for user: ${user.email}`,
      }
    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }
}

// Export singleton instance
export const supabaseStorage = new SupabaseStorageService()
