import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { OpeningDetailView } from '@/components/opening/opening-detail-view'
import { ensureWorkflowStagesAction } from '@/lib/actions/opening'
import type { OpeningProjectWithRelations } from '@/lib/types/opening'
import type { UserProfile } from '@/lib/types/auth'

export const metadata: Metadata = {
  title: 'รายละเอียดบ้าน/สาขา | ระบบบริหารงานเช่าและเปิดสาขา',
}

interface OpeningDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OpeningDetailPage({ params }: OpeningDetailPageProps) {
  const { id } = await params
  const user = await requireUser()
  const supabase = await createClient()

  // Ensure standard stages exist
  const stages = await ensureWorkflowStagesAction()

  // Fetch Project with all relations
  const [projectRes, profilesRes] = await Promise.all([
    supabase
      .from('opening_projects')
      .select(
        `
        *,
        rental_contracts (
          id,
          contract_no,
          status,
          need_branch_registration,
          need_vat_registration,
          need_employer_change,
          need_signboard,
          locations (id, location_name, location_code, province, district)
        ),
        workflow_stages (*),
        profiles!opening_projects_assigned_to_fkey (id, full_name, email),
        opening_tasks (
          *,
          task_checklists (
            *,
            profiles!task_checklists_checked_by_fkey (id, full_name, email)
          ),
          workflow_stages (*),
          profiles!opening_tasks_assigned_to_fkey (id, full_name, email)
        )
      `
      )
      .eq('id', id)
      .single(),

    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
  ])

  if (projectRes.error || !projectRes.data) {
    notFound()
  }

  // Sort tasks by stage sequence then created_at
  if (Array.isArray(projectRes.data.opening_tasks)) {
    projectRes.data.opening_tasks.sort(
      (
        a: { workflow_stages?: { sequence?: number } | null; created_at: string },
        b: { workflow_stages?: { sequence?: number } | null; created_at: string }
      ) => {
        const seqA = a.workflow_stages?.sequence ?? 99
        const seqB = b.workflow_stages?.sequence ?? 99
        if (seqA !== seqB) return seqA - seqB
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
    )
  }

  const project: OpeningProjectWithRelations =
    projectRes.data as unknown as OpeningProjectWithRelations

  const staffProfiles: Pick<UserProfile, 'id' | 'full_name' | 'email'>[] =
    profilesRes.data ?? []

  return (
    <OpeningDetailView
      project={project}
      stages={stages}
      staffProfiles={staffProfiles}
      userRole={user.profile.role}
    />
  )
}
