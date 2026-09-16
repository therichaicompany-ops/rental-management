import { createClient } from '@/lib/supabase/server'
import type { CurrentUser, UserProfile } from '@/lib/types/auth'

/**
 * Get the currently authenticated user with their profile.
 * Returns null if no session, no profile, or profile is inactive.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()

  // 1. Get auth session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return null
  }

  // 2. Fetch profile from public.profiles — cast to UserProfile explicitly
  const { data, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !data) {
    return null
  }

  const profile = data as UserProfile

  // 3. Check active status
  if (!profile.is_active) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    profile,
  }
}
