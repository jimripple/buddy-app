import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getProjectTreeWithClient } from "@/lib/db/projects";
import { getActionSupabase } from "@/lib/supabase/actions";

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const supabase = await getActionSupabase();
  const projectId = params.projectId;

  if (!projectId) {
    return NextResponse.json({ error: "Missing project id" }, { status: 400 });
  }

  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("id")
    .eq("project_id", projectId);

  if (chaptersError) {
    return NextResponse.json({ error: chaptersError.message }, { status: 400 });
  }

  const nextOrder = (chapters?.length ?? 0) + 1;

  const { data: inserted, error } = await supabase
    .from("chapters")
    .insert({
      project_id: projectId,
      title: `Chapter ${nextOrder}`,
      order_index: nextOrder,
    })
    .select("id, title, order_index, created_at")
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message ?? "Unable to add chapter" }, { status: 400 });
  }

  const project = await getProjectTreeWithClient(supabase, projectId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    chapter: inserted,
    chapters: project.chapters,
  });
}
