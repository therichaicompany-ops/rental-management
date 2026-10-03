import type { Metadata } from 'next'
import { requireRole } from '@/lib/auth/route-guard'
import { createClient } from '@/lib/supabase/server'
import { OpeningListView } from '@/components/opening/opening-list-view'
import { ensureWorkflowStagesAction } from '@/lib/actions/opening'
import type { OpeningProjectWithRelations } from '@/lib/types/opening'
import type { UserProfile } from '@/lib/types/auth'
import { isHouseRecord } from '@/lib/utils/lead-metadata'

export const metadata: Metadata = {
  title: 'บ้าน/สาขา | ระบบบริหารงานเช่าและเปิดสาขา',
}

export default async function OpeningProjectsPage() {
  const user = await requireRole('opening')
  const supabase = await createClient()

  // 1. Fetch all opening projects, contracts, and profiles in parallel
  const [, projectsRes, contractsRes, profilesRes] = await Promise.all([
    ensureWorkflowStagesAction(),
    supabase
      .from('opening_projects')
      .select(
        `
        *,
        rental_contracts (
          id,
          contract_no,
          note,
          status,
          need_branch_registration,
          need_vat_registration,
          need_employer_change,
          need_signboard,
          need_excise_permit,
          locations (id, location_name, location_code, province, district)
        ),
        workflow_stages (id, stage_code, stage_name, sequence),
        profiles!opening_projects_assigned_to_fkey (id, full_name, email),
        opening_tasks (id, status)
      `
      )
      .order('created_at', { ascending: false }),

    // Fetch contracts eligible to create an opening project (branch contracts only)
    supabase
      .from('rental_contracts')
      .select('id, contract_no, note, rental_leads(note), status, locations(location_name, province)')
      .in('status', ['agreed', 'active'])
      .order('created_at', { ascending: false }),

    // Fetch active staff profiles
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
  ])

  let projects: OpeningProjectWithRelations[] =
    (projectsRes.data as unknown as OpeningProjectWithRelations[]) ?? []

  if (user.profile.role === 'operation') {
    projects = projects.filter((p) => !isHouseRecord(p.rental_contracts))
  }

  // Filter out contracts that already have an opening project
  const existingContractIds = new Set(projects.map((p) => p.contract_id))
  const eligibleContracts = (contractsRes.data ?? [])
    .filter((c: { id: string }) => !existingContractIds.has(c.id))
    .map((c: { id: string; contract_no: string; status: string; locations?: unknown }) => ({
      id: c.id,
      contract_no: c.contract_no,
      status: c.status,
      locations: Array.isArray(c.locations)
        ? (c.locations[0] as { location_name: string; province: string } | undefined) ?? null
        : (c.locations as { location_name: string; province: string } | null) ?? null,
    }))

  const staffProfiles: Pick<UserProfile, 'id' | 'full_name' | 'email'>[] =
    profilesRes.data ?? []

  return (
    <OpeningListView
      projects={projects}
      eligibleContracts={eligibleContracts}
      staffProfiles={staffProfiles}
      userRole={user.profile.role}
    />
  )
}
