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
      // if (bucketExists) {
      //   console.log("✅ Bucket already exists:", this.bucketName)
      //   return true
      // }

      // console.log("📁 Creating bucket:", this.bucketName)

      // // สร้าง bucket ใหม่
      // const { data: newBucket, error: createError } = await this.supabase.storage.createBucket(this.bucketName, {
      //   public: true,
      //   allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      //   fileSizeLimit: 10485760, // 10MB
      // })

      // if (createError) {
      //   console.error("❌ Error creating bucket:", createError)
      //   // ถ้าเป็น error ที่บอกว่า bucket มีอยู่แล้ว ให้ถือว่าสำเร็จ
      //   if (createError.message.includes("already exists")) {
      //     console.log("✅ Bucket already exists (from error message)")
      //     return true
      //   }
      //   return false
      // }

      // console.log("✅ Bucket created successfully:", newBucket)
      // return true
    } catch (error) {
      console.error("❌ Unexpected error in ensureBucketExists:", error)
      return false
    }
  }

  // สร้างชื่อไฟล์ที่ unique และระบุตัวตน
  private generateFileName(uuid:string, fileExtension: string): string {

    return `${uuid}.${fileExtension}`
  }

  // ทำความสะอาดชื่อไฟล์
  private cleanString(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9ก-๙]/g, "") // เอาเฉพาะตัวอักษรและตัวเลข
      .substring(0, 20) // จำกัดความยาว
  }

  // Upload ไฟล์ไปยัง Supabase Storage
  async uploadPaymentSlip(
    file: File,
    nickname: string,
    firstName: string,
    lastName: string,
    uuid: string
  ): Promise<{ url: string; path: string } | null> {
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
      const fileName = this.generateFileName(uuid, fileExtension)
      const filePath =`public/seedcamp2025/${fileName}`;

      console.log("📝 Upload details:", {
        fileName,
        filePath,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        fileType: file.type,
        person: { nickname, firstName, lastName },
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

      console.log("✅ Upload successful:", {
        path: data.path,
        url: urlData.publicUrl,
      })

      return {
        url: urlData.publicUrl,
        path: data.path,
      }
    } catch (error) {
      console.error("❌ Error uploading payment slip:", error)
      throw error
    }
  }

  // ลบไฟล์เก่า (ถ้ามี)
  async deletePaymentSlip(fileUrl: string): Promise<boolean> {
    try {
      if (!fileUrl || !fileUrl.includes(this.bucketName)) {
        console.log("🔍 Not a Supabase storage file, skipping deletion")
        return true // ไม่ใช่ไฟล์ใน storage ของเรา
      }

      // แยกเอาเฉพาะ path ใน storage
      const urlParts = fileUrl.split("/")
      const fileName = urlParts[urlParts.length - 1]

      if (!fileName) {
        console.warn("⚠️ Could not extract filename from URL:", fileUrl)
        return false
      }

      console.log("🗑️ Deleting payment slip:", fileName)

      const { error } = await this.supabase.storage.from(this.bucketName).remove([fileName])

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

  // ดึงรายการไฟล์ของบุคคลนั้น
  async getPersonPaymentSlips(nickname: string, firstName: string, lastName: string): Promise<string[]> {
    try {
      const cleanNickname = this.cleanString(nickname)
      const cleanFirstName = this.cleanString(firstName)
      const cleanLastName = this.cleanString(lastName)

      const prefix = `${cleanNickname}_${cleanFirstName}_${cleanLastName}_`

      console.log("🔍 Searching for files with prefix:", prefix)

      const { data, error } = await this.supabase.storage.from(this.bucketName).list("", {
        search: prefix,
      })

      if (error) {
        console.error("❌ Error listing files:", error)
        return []
      }

      const urls =
        data?.map((file) => {
          const { data: urlData } = this.supabase.storage.from(this.bucketName).getPublicUrl(file.name)
          return urlData.publicUrl
        }) || []

      console.log("📁 Found files:", urls)
      return urls
    } catch (error) {
      console.error("❌ Error getting person payment slips:", error)
      return []
    }
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
