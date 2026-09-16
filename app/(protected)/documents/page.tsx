import type { Metadata } from 'next'
import { requireUser } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { DocumentCenterView } from '@/components/documents/document-center-view'

export const metadata: Metadata = {
  title: 'Document Center | ระบบบริหารงานเช่าและเปิดสาขา',
  description: 'ศูนย์กลางจัดการเอกสารทั้งหมดในระบบ',
}

export default async function DocumentsPage() {
  const user = await requireUser()
  const supabase = await createClient()

  // Fetch active profiles for uploader filter
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <DocumentCenterView
        userRole={user.profile.role}
        uploaderProfiles={profiles ?? []}
      />
    </div>
  )
}
