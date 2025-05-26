import type { SupabaseClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

interface UploadFileParams {
  supabaseClient: SupabaseClient
  bucketName: string
  file: File
  userId: string
  folderPath?: string // Optional folder path within the bucket
}

interface DeleteFileParams {
  supabaseClient: SupabaseClient
  bucketName: string
  filePath: string // Full path to the file in the bucket
}

export async function uploadFile({
  supabaseClient,
  bucketName,
  file,
  userId,
  folderPath = "",
}: UploadFileParams): Promise<{ data: { path: string } | null; error: any }> {
  try {
    const fileExt = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = folderPath ? `${folderPath}/${fileName}` : fileName
    const fullPath = `${userId}/${filePath}` // Include userId in the path

    const { data, error } = await supabaseClient.storage.from(bucketName).upload(fullPath, file, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      console.error("Error uploading file:", error)
      return { data: null, error }
    }

    return { data: { path: fullPath }, error: null } // Return the full path
  } catch (error: any) {
    console.error("Unexpected error uploading file:", error)
    return { data: null, error: { message: error.message } }
  }
}

export async function deleteFile({
  supabaseClient,
  bucketName,
  filePath,
}: DeleteFileParams): Promise<{ data: any; error: any }> {
  try {
    const { data, error } = await supabaseClient.storage.from(bucketName).remove([filePath])

    if (error) {
      console.error("Error deleting file:", error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error("Unexpected error deleting file:", error)
    return { data: null, error: { message: error.message } }
  }
}
