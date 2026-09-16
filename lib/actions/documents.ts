'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { hasFullAccess } from '@/lib/auth/permissions'
import {
  uploadDocumentSchema,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  type DocumentWithUploader,
  type DocumentListFilters,
} from '@/lib/types/documents'
import type { ActionResponse } from './customers'

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function buildStoragePath(
  entityType: string,
  entityId: string,
  fileName: string
): string {
  const ts = Date.now()
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${entityType}/${entityId}/${ts}_${safe}`
}

// ----------------------------------------------------------------
// Upload document
// ----------------------------------------------------------------
export async function uploadDocumentAction(
  formData: FormData
): Promise<ActionResponse<{ id: string }>> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) return { success: false, error: 'กรุณาเลือกไฟล์' }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { success: false, error: 'รองรับเฉพาะ PDF, JPG, PNG, WEBP เท่านั้น' }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { success: false, error: 'ไฟล์ต้องไม่เกิน 10 MB' }
  }

  const parsed = uploadDocumentSchema.safeParse({
    entity_type: formData.get('entity_type'),
    entity_id: formData.get('entity_id'),
    document_type: formData.get('document_type'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? 'ข้อมูลไม่ถูกต้อง' }
  }

  const { entity_type, entity_id, document_type } = parsed.data
  const storagePath = buildStoragePath(entity_type, entity_id, file.name)
  const supabase = await createClient()

  // Upload to storage
  const { error: storageErr } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (storageErr) {
    console.error('Storage upload error:', storageErr)
    return { success: false, error: `อัปโหลดไม่สำเร็จ: ${storageErr.message}` }
  }

  // Insert DB record
  const { data, error: dbErr } = await supabase
    .from('documents')
    .insert({
      entity_type,
      entity_id,
      document_type,
      file_name: file.name,
      storage_bucket: 'documents',
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
    })
    .select('id')
    .single()

  if (dbErr || !data) {
    // Rollback storage on DB failure
    await supabase.storage.from('documents').remove([storagePath])
    console.error('DB insert error:', dbErr)
    return { success: false, error: 'บันทึกข้อมูลไม่สำเร็จ' }
  }

  revalidatePath(`/documents`)

  return { success: true, data: { id: data.id } }
}

// ----------------------------------------------------------------
// List documents for a specific entity
// ----------------------------------------------------------------
export async function listDocumentsAction(
  entityType: string,
  entityId: string
): Promise<ActionResponse<DocumentWithUploader[]>> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('documents')
    .select(
      `
      *,
      profiles!documents_uploaded_by_fkey (id, full_name, email)
    `
    )
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('listDocumentsAction error:', error)
    return { success: false, error: 'โหลดเอกสารไม่สำเร็จ' }
  }

  return { success: true, data: (data ?? []) as unknown as DocumentWithUploader[] }
}

// ----------------------------------------------------------------
// List ALL documents with optional filters (Document Center)
// ----------------------------------------------------------------
export async function listAllDocumentsAction(
  filters?: DocumentListFilters
): Promise<ActionResponse<DocumentWithUploader[]>> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

  const supabase = await createClient()

  let query = supabase
    .from('documents')
    .select(
      `
      *,
      profiles!documents_uploaded_by_fkey (id, full_name, email)
    `
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (filters?.document_type) {
    query = query.eq('document_type', filters.document_type)
  }
  if (filters?.entity_type) {
    query = query.eq('entity_type', filters.entity_type)
  }
  if (filters?.uploaded_by) {
    query = query.eq('uploaded_by', filters.uploaded_by)
  }
  if (filters?.date_from) {
    query = query.gte('created_at', filters.date_from)
  }
  if (filters?.date_to) {
    // Include full day
    query = query.lte('created_at', filters.date_to + 'T23:59:59')
  }

  const { data, error } = await query

  if (error) {
    console.error('listAllDocumentsAction error:', error)
    return { success: false, error: 'โหลดเอกสารไม่สำเร็จ' }
  }

  return { success: true, data: (data ?? []) as unknown as DocumentWithUploader[] }
}

// ----------------------------------------------------------------
// Get signed URL for a file (60 min expiry)
// ----------------------------------------------------------------
export async function getSignedUrlAction(
  storagePath: string
): Promise<ActionResponse<{ url: string }>> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 60 * 60) // 1 hour

  if (error || !data?.signedUrl) {
    console.error('getSignedUrlAction error:', error)
    return { success: false, error: 'สร้าง URL ไม่สำเร็จ' }
  }

  return { success: true, data: { url: data.signedUrl } }
}

// ----------------------------------------------------------------
// Delete document (full-access only)
// ----------------------------------------------------------------
export async function deleteDocumentAction(
  documentId: string
): Promise<ActionResponse<null>> {
  const user = await getCurrentUser()
  if (!user) return { success: false, error: 'กรุณาเข้าสู่ระบบ' }

  if (!hasFullAccess(user.profile.role)) {
    return { success: false, error: 'ไม่มีสิทธิ์ลบเอกสาร' }
  }

  const supabase = await createClient()

  // Fetch storage_path first
  const { data: doc, error: fetchErr } = await supabase
    .from('documents')
    .select('id, storage_path, entity_type, entity_id')
    .eq('id', documentId)
    .single()

  if (fetchErr || !doc) {
    return { success: false, error: 'ไม่พบเอกสาร' }
  }

  // Delete from storage
  const { error: storageErr } = await supabase.storage
    .from('documents')
    .remove([doc.storage_path])

  if (storageErr) {
    console.error('Storage delete error:', storageErr)
    // Continue to delete DB record even if storage fails (orphan cleanup)
  }

  // Delete DB record
  const { error: dbErr } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)

  if (dbErr) {
    console.error('DB delete error:', dbErr)
    return { success: false, error: 'ลบเอกสารไม่สำเร็จ' }
  }

  revalidatePath('/documents')

  return { success: true, data: null }
}
