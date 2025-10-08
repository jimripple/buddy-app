import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getProjectTreeWithClient } from "@/lib/db/projects";
import { getActionSupabase } from "@/lib/supabase/actions";
import { renameSchema } from "@/lib/validation/editor";

export async function GET(
  request: NextRequest,
  { params }: { params: { sceneId: string } }
) {
  const supabase = await getActionSupabase();
  const sceneId = params.sceneId;

  const { data: scene, error } = await supabase
    .from("scenes")
    .select("id, title, content, word_count, updated_at, chapter_id")
    .eq("id", sceneId)
    .maybeSingle();

  if (error || !scene) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }

  return NextResponse.json({ scene });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sceneId: string } }
) {
  const supabase = await getActionSupabase();
  const sceneId = params.sceneId;
  const body = await request.json();

  const parsed = renameSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: sceneRecord, error: sceneError } = await supabase
    .from("scenes")
    .select("chapter_id")
    .eq("id", sceneId)
    .maybeSingle();

  if (sceneError || !sceneRecord) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }

  const { data: chapterRecord, error: chapterError } = await supabase
    .from("chapters")
    .select("project_id")
    .eq("id", sceneRecord.chapter_id)
    .maybeSingle();

  if (chapterError || !chapterRecord) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("scenes")
    .update({ title: parsed.data.title })
    .eq("id", sceneId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const project = await getProjectTreeWithClient(supabase, chapterRecord.project_id);

  return NextResponse.json({
    chapters: project?.chapters ?? [],
  });
}
