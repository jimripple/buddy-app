import { redirect } from 'next/navigation'

import { getActionSupabase } from '@/lib/supabase/actions'

export async function GET() {
  const supabase = await getActionSupabase()
  const { error } = await supabase.auth.exchangeCodeForSession()

  if (error) {
    redirect('/login?error=auth')
  }

  redirect('/projects')
}
