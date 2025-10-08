'use server'

import { redirect } from 'next/navigation'

import { getActionSupabase } from '@/lib/supabase/actions'

export async function signOutAction() {
  const supabase = await getActionSupabase()

  await supabase.auth.signOut()
  redirect('/login')
}
