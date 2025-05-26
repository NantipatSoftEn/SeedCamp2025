import { v4 as uuidv4 } from "uuid"
import { supabase } from "./supabase"

const BUCKET_NAME = "avatars"

export async function uploadAvatar(image: File): Promise<{ publicUrl: string; error: any }> {
  const imageName = uuidv4()
  const imagePath = `public/seedcamp2025/${imageName}`

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(imagePath, image, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    console.error("Error uploading image:", error)
    return { publicUrl: "", error }
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imagePath)
  return { publicUrl: data.publicUrl, error: null }
}
