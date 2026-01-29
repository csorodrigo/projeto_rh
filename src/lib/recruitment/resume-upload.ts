/**
 * Resume Upload Utility
 * Handles resume file uploads to Supabase Storage
 */

import { createClient } from "@/lib/supabase/client"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export async function uploadResume(
  file: File,
  candidateId: string,
  companyId: string
): Promise<string> {
  // Validate file
  if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
    throw new Error("Tipo de arquivo inválido. Apenas PDF ou Word são aceitos.")
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Arquivo muito grande. O tamanho máximo é 5MB.")
  }

  const supabase = createClient()

  // Generate unique filename
  const fileExtension = file.name.split(".").pop()
  const fileName = `${candidateId}-${Date.now()}.${fileExtension}`
  const filePath = `${companyId}/candidates/${candidateId}/${fileName}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("resumes")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    console.error("Error uploading resume:", error)
    throw new Error("Erro ao fazer upload do currículo")
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from("resumes")
    .getPublicUrl(data.path)

  return publicUrl
}

export async function deleteResume(
  resumeUrl: string,
  companyId: string
): Promise<void> {
  const supabase = createClient()

  // Extract path from URL
  const urlParts = resumeUrl.split("/resumes/")
  if (urlParts.length < 2) {
    throw new Error("URL de currículo inválida")
  }

  const filePath = urlParts[1]

  // Verify company ID in path
  if (!filePath.startsWith(companyId)) {
    throw new Error("Você não tem permissão para deletar este arquivo")
  }

  const { error } = await supabase.storage.from("resumes").remove([filePath])

  if (error) {
    console.error("Error deleting resume:", error)
    throw new Error("Erro ao deletar currículo")
  }
}

export async function getResumeDownloadUrl(resumeUrl: string): Promise<string> {
  const supabase = createClient()

  // Extract path from URL
  const urlParts = resumeUrl.split("/resumes/")
  if (urlParts.length < 2) {
    throw new Error("URL de currículo inválida")
  }

  const filePath = urlParts[1]

  // Create signed URL for download (valid for 1 hour)
  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(filePath, 3600)

  if (error || !data) {
    console.error("Error creating signed URL:", error)
    throw new Error("Erro ao gerar URL de download")
  }

  return data.signedUrl
}
