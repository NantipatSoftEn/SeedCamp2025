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

      // ตรวจสอบว่า person มีอยู่ใน seedcamp_people table หรือไม่
      const { data: personCheck, error: personCheckError } = await this.supabase
        .from("seedcamp_people")
        .select("id")
        .eq("id", personId)
        .single()

      if (personCheckError || !personCheck) {
        console.error("❌ Person not found in seedcamp_people:", personCheckError)
        // ลบไฟล์ที่อัปโหลดแล้ว
        await this.supabase.storage.from(this.bucketName).remove([filePath])
        throw new Error(`Person with ID ${personId} not found in database`)
      }

      console.log("✅ Person verified in database:", personCheck)

      // บันทึกข้อมูลใน payment_slips table - ใช้ personId เป็น person_id
      const insertData = {
        user_id: user.id,
        person_id: personId, // ส่ง personId ที่เป็น id ของ seedcamp_people table
        path: filePath,
        original_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        uploaded_at: new Date().toISOString(),
      }

      console.log("💾 Inserting payment slip record:", insertData)

      // ลองบันทึกข้อมูลใน payment_slips table
      let paymentSlipData = null
      try {
        const { data: insertResult, error: dbError } = await this.supabase
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
          } else if (dbError.message.includes("foreign key")) {
            throw new Error(`Foreign key constraint error: ${dbError.message}\n\nPerson ID ${personId} may not exist.`)
          } else {
            throw new Error(`Failed to save payment slip record: ${dbError.message}`)
          }
        }

        paymentSlipData = insertResult
        console.log("✅ Payment slip record saved:", paymentSlipData)
      } catch (dbError) {
        console.warn("⚠️ Could not save to payment_slips table, continuing with person update:", dbError)
        // ถ้าบันทึก payment_slips ไม่ได้ ให้ทำต่อด้วยการอัปเดต person
      }

      // อัปเดต payment_slip เป็น path ของ image และ payment_status เป็น paid ใน seedcamp_people table
      console.log("💾 Updating seedcamp_people table...")

      const updateData = {
        payment_status: "paid", // เปลี่ยนเป็น paid
        payment_slip: filePath, // เก็บเฉพาะ path ของ image
        updated_at: new Date().toISOString(),
      }

      console.log("📝 Update data for seedcamp_people:", updateData)

      const { data: updateResult, error: updateError } = await this.supabase
        .from("seedcamp_people")
        .update(updateData)
        .eq("id", personId)
        .select()
        .single()

      if (updateError) {
        console.error("❌ Failed to update payment status:", updateError)
        console.error("❌ Update data was:", updateData)
        console.error("❌ Person ID was:", personId)

        // ลบไฟล์และ payment_slips record ถ้าอัปเดต person ล้มเหลว
        await this.supabase.storage.from(this.bucketName).remove([filePath])
        if (paymentSlipData) {
          await this.supabase.from("payment_slips").delete().eq("id", paymentSlipData.id)
        }

        throw new Error(`Failed to update person payment status: ${updateError.message}`)
      } else {
        console.log("✅ Payment status updated to 'paid' and payment_slip path saved:", filePath)
        console.log("✅ Updated person data:", updateResult)
      }

      console.log("✅ Upload completed successfully:", {
        path: data.path,
        url: urlData.publicUrl,
        paymentSlipId: paymentSlipData?.id || "not-saved",
        savedPath: filePath, // path ที่เก็บใน database
      })

      return {
        url: urlData.publicUrl,
        path: filePath, // return path แทน data.path
        paymentSlipId: paymentSlipData?.id || "not-saved",
      }
    } catch (error) {
      console.error("❌ Error uploading payment slip:", error)
      throw error
    }
  }

  // ลบไฟล์เก่า (ถ้ามี) และข้อมูลใน database
  async deletePaymentSlip(fileUrl: string, personId?: string): Promise<boolean> {
    try {
      // ตรวจสอบ authentication
      const { user } = await this.ensureAuthenticated()

      let filePath: string

      // ถ้าเป็น full URL ให้แยกเอา path
      if (fileUrl.includes("supabase.co")) {
        const urlParts = fileUrl.split("/")
        const pathIndex = urlParts.findIndex((part) => part === "payment-slips")
        if (pathIndex === -1) {
          console.warn("⚠️ Could not extract path from URL:", fileUrl)
          return false
        }
        filePath = urlParts.slice(pathIndex + 1).join("/")
      } else {
        // ถ้าเป็น path อยู่แล้ว
        filePath = fileUrl
      }

      console.log("🗑️ Deleting payment slip:", filePath)

      // อัปเดต seedcamp_people table ก่อน - เซ็ต payment_status เป็น unpaid และลบ payment_slip
      if (personId) {
        console.log("💾 Updating seedcamp_people table to unpaid...")

        const { error: updateError } = await this.supabase
          .from("seedcamp_people")
          .update({
            payment_status: "unpaid", // เปลี่ยนเป็น unpaid
            payment_slip: null, // ลบ payment_slip path
            updated_at: new Date().toISOString(),
          })
          .eq("id", personId)

        if (updateError) {
          console.error("❌ Failed to update payment status after deletion:", updateError)
          throw new Error(`Failed to update person payment status: ${updateError.message}`)
        } else {
          console.log("✅ Payment status updated to 'unpaid' and payment_slip cleared")
        }

        // ลบข้อมูลจาก payment_slips table
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

  // ลบข้อมูล payment slip ทั้งหมดของ person_id (เมื่อกดปิดรูป)
  async deleteAllPaymentSlipsForPerson(personId: string): Promise<boolean> {
    try {
      console.log("🗑️ Deleting all payment slips for person:", personId)

      // ตรวจสอบ authentication
      const { user } = await this.ensureAuthenticated()

      // ดึงข้อมูล payment slips ทั้งหมดของ person นี้
      const { data: paymentSlips, error: fetchError } = await this.supabase
        .from("payment_slips")
        .select("*")
        .eq("person_id", personId)

      if (fetchError) {
        console.error("❌ Error fetching payment slips:", fetchError)
        return false
      }

      if (!paymentSlips || paymentSlips.length === 0) {
        console.log("ℹ️ No payment slips found for person:", personId)
        // ยังคงอัปเดต person record เพื่อให้แน่ใจ
      } else {
        console.log(`📁 Found ${paymentSlips.length} payment slip(s) to delete:`, paymentSlips)

        // ลบไฟล์ทั้งหมดจาก storage
        const filePaths = paymentSlips.map((slip) => slip.path)
        if (filePaths.length > 0) {
          const { error: storageError } = await this.supabase.storage.from(this.bucketName).remove(filePaths)

          if (storageError) {
            console.warn("⚠️ Could not delete some files from storage:", storageError.message)
          } else {
            console.log("✅ All files deleted from storage:", filePaths)
          }
        }

        // ลบข้อมูลทั้งหมดจาก payment_slips table
        const { error: dbError } = await this.supabase.from("payment_slips").delete().eq("person_id", personId)

        if (dbError) {
          console.error("❌ Could not delete payment slip records:", dbError.message)
        } else {
          console.log("✅ All payment slip records deleted from database")
        }
      }

      // อัปเดต seedcamp_people table - เซ็ต payment_status เป็น unpaid และลบ payment_slip
      console.log("💾 Updating seedcamp_people table to unpaid...")

      const { error: updateError } = await this.supabase
        .from("seedcamp_people")
        .update({
          payment_status: "unpaid", // เปลี่ยนเป็น unpaid
          payment_slip: null, // ลบ payment_slip path
          updated_at: new Date().toISOString(),
        })
        .eq("id", personId)

      if (updateError) {
        console.error("❌ Failed to update payment status after deletion:", updateError)
        return false
      } else {
        console.log("✅ Payment status updated to 'unpaid' and payment_slip cleared")
      }

      console.log("✅ Successfully deleted all payment slips for person:", personId)
      return true
    } catch (error) {
      console.error("❌ Error deleting all payment slips for person:", error)
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

  // ดึง URL ที่ถูกต้องจาก path สำหรับแสดงรูป preview
  getPublicUrl(path: string): string {
    const { data } = this.supabase.storage.from(this.bucketName).getPublicUrl(path)
    return data.publicUrl
  }

  // ฟังก์ชันสำหรับแปลง payment_slip path เป็น public URL สำหรับแสดงรูป
  getPaymentSlipPreviewUrl(paymentSlipPath: string | null): string | null {
    if (!paymentSlipPath) return null

    // ถ้า path เป็น full URL อยู่แล้ว ให้ return ตรงๆ
    if (paymentSlipPath.startsWith("http")) {
      return paymentSlipPath
    }

    // ถ้าเป็น path ให้แปลงเป็น public URL
    return this.getPublicUrl(paymentSlipPath)
  }

  // ฟังก์ชันทดสอบการเชื่อมต่อ database
  async testDatabaseConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { user } = await this.ensureAuthenticated()

      // ทดสอบการอ่านข้อมูลจาก seedcamp_people
      const { data: peopleData, error: peopleError } = await this.supabase
        .from("seedcamp_people")
        .select("id, nick_name")
        .limit(1)

      if (peopleError) {
        return {
          success: false,
          message: `Cannot read seedcamp_people table: ${peopleError.message}`,
        }
      }

      // ทดสอบการอ่านข้อมูลจาก payment_slips
      const { data: slipsData, error: slipsError } = await this.supabase.from("payment_slips").select("id").limit(1)

      if (slipsError) {
        return {
          success: false,
          message: `Cannot read payment_slips table: ${slipsError.message}`,
        }
      }

      return {
        success: true,
        message: `Database connection successful. User: ${user.email}, People: ${peopleData?.length || 0}, Slips: ${slipsData?.length || 0}`,
      }
    } catch (error) {
      return {
        success: false,
        message: `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }
    }
  }
}

// Export singleton instance
export const supabaseStorage = new SupabaseStorageService()
