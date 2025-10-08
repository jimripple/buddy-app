'use server'

import { redirect } from 'next/navigation'

import { getActionSupabase } from '@/lib/supabase/actions'

export async function createProject(formData: FormData) {
  const supabase = await getActionSupabase()

  const rawTitle = (formData.get('title') ?? '').toString().trim()
  const rawGoal = (formData.get('goal') ?? '500').toString().trim()

  if (!rawTitle || rawTitle.length < 1 || rawTitle.length > 80) {
    throw new Error('Title must be 1–80 characters')
  }

  let goal = Number.parseInt(rawGoal, 10)
  if (!Number.isFinite(goal)) goal = 500
  goal = Math.min(5000, Math.max(100, goal))

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()
  if (userErr || !user) throw new Error('Not authenticated')

  const {
    data: proj,
    error: pErr,
  } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      title: rawTitle,
      goal_words_per_day: goal,
    })
    .select('id')
    .single()

  if (pErr || !proj) throw new Error(pErr?.message ?? 'Failed to create project')

  const {
    data: chap,
    error: cErr,
  } = await supabase
    .from('chapters')
    .insert({
      project_id: proj.id,
      title: 'Chapter 1',
      order_index: 0,
    })
    .select('id')
    .single()
  if (cErr || !chap) throw new Error(cErr?.message ?? 'Failed to create chapter')

  const { error: sErr } = await supabase.from('scenes').insert({
    chapter_id: chap.id,
    title: 'Scene 1',
    order_index: 0,
    content: '',
  })
  if (sErr) throw new Error(sErr.message ?? 'Failed to create scene')

  redirect(`/project/${proj.id}`)
}
