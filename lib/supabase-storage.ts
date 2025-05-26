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
      console.log("📦 Buckets found:", bucketExists)
      return true
    } catch (error) {
      console.error("❌ Unexpected error in ensureBucketExists:", error)
      return false
    }
  }

  // สร้างชื่อไฟล์ที่ unique และระบุตัวตน
  private generateFileName(uuid: string, fileExtension: string): string {
    return `${uuid}.${fileExtension}`
  }

  // ทำความสะอาดชื่อไฟล์
  private cleanString(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9ก-๙]/g, "") // เอาเฉพาะตัวอักษรและตัวเลข
      .substring(0, 20) // จำกัดความยาว
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

      // Get current user
      const {
        data: { user },
      } = await this.supabase.auth.getUser()
      if (!user) {
        console.warn("⚠️ No authenticated user found, proceeding without user_id")
      }

      // บันทึกข้อมูลใน payment_slips table
      const { data: paymentSlipData, error: dbError } = await this.supabase
        .from("payment_slips")
        .insert({
          user_id: user?.id || null,
          person_id: personId,
          path: filePath,
          original_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single()

      if (dbError) {
        console.error("❌ Database insert error:", dbError)
        // ลบไฟล์ที่อัปโหลดแล้วถ้าบันทึกฐานข้อมูลล้มเหลว
        await this.supabase.storage.from(this.bucketName).remove([filePath])
        throw new Error(`Failed to save payment slip record: ${dbError.message}`)
      }

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
        // ไม่ throw error เพราะไฟล์อัปโหลดสำเร็จแล้ว
        console.warn("⚠️ Payment slip uploaded but payment status not updated")
      } else {
        console.log("✅ Payment status updated to 'paid'")
      }

      console.log("✅ Upload successful:", {
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

  // ทดสอบการเชื่อมต่อ Storage
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🧪 Testing Supabase Storage connection...")

      // ทดสอบการ list buckets
      const { data: buckets, error } = await this.supabase.storage.listBuckets()

      if (error) {
        return {
          success: false,
          message: `Storage connection failed: ${error.message}`,
        }
      }

      const bucketExists = buckets?.some((bucket) => bucket.id === this.bucketName)

      return {
        success: true,
        message: `Storage connection successful. Bucket '${this.bucketName}' ${
          bucketExists ? "exists" : "will be created when needed"
        }. Found ${buckets?.length || 0} total buckets.`,
      }
    } catch (error) {
      return {
        success: false,
        message: `Storage test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }
}

// Export singleton instance
export const supabaseStorage = new SupabaseStorageService()
