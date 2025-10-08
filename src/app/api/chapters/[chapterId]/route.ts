import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getProjectTreeWithClient } from "@/lib/db/projects";
import { getActionSupabase } from "@/lib/supabase/actions";
import { renameSchema } from "@/lib/validation/editor";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  const supabase = await getActionSupabase();
  const chapterId = params.chapterId;

  const body = await request.json();
  const parsed = renameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: chapterRecord, error: chapterError } = await supabase
    .from("chapters")
    .select("project_id")
    .eq("id", chapterId)
    .maybeSingle();

  if (chapterError || !chapterRecord) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("chapters")
    .update({ title: parsed.data.title })
    .eq("id", chapterId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const project = await getProjectTreeWithClient(supabase, chapterRecord.project_id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    chapters: project.chapters,
  });
}
