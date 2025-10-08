import { getRscSupabase } from '@/lib/supabase/rsc'
import ProjectEditor from '@/components/editor/project-editor'

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const sp = await searchParams
  const sceneQuery = typeof sp.scene === 'string' ? sp.scene : undefined

  const supabase = await getRscSupabase()

  const { data: project, error: pErr } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', id)
    .single()

  if (pErr || !project) {
    return (
      <div className="p-6 text-slate-300">
        <h1 className="text-xl font-semibold text-slate-100">Project not found</h1>
      </div>
    )
  }

  const { data: chapters } = await supabase
    .from('chapters')
    .select('id, title, order_index')
    .eq('project_id', id)
    .order('order_index', { ascending: true })

  const chapterIds = (chapters ?? []).map((c) => c.id)
  const { data: scenes } = await supabase
    .from('scenes')
    .select('id, title, order_index, chapter_id')
    .in('chapter_id', chapterIds.length ? chapterIds : ['00000000-0000-0000-0000-000000000000'])
    .order('order_index', { ascending: true })

  const initialSceneId = sceneQuery ?? scenes?.[0]?.id ?? null

  return (
    <ProjectEditor
      project={{ id: project.id, title: project.title }}
      chapters={chapters ?? []}
      scenes={scenes ?? []}
      initialSceneId={initialSceneId}
    />
  )
}
