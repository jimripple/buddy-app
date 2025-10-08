import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getProjectTreeWithClient } from "@/lib/db/projects";
import { getActionSupabase } from "@/lib/supabase/actions";

export async function POST(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  const supabase = await getActionSupabase();
  const chapterId = params.chapterId;

  const {
    data: chapter,
    error: chapterError,
  } = await supabase
    .from("chapters")
    .select("project_id, order_index")
    .eq("id", chapterId)
    .maybeSingle();

  if (chapterError || !chapter) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  const { data: scenes } = await supabase
    .from("scenes")
    .select("id")
    .eq("chapter_id", chapterId);

  const nextOrder = (scenes?.length ?? 0) + 1;
  const title = `Scene ${nextOrder}`;

  const { data: scene, error } = await supabase
    .from("scenes")
    .insert({
      chapter_id: chapterId,
      title,
      order_index: nextOrder,
      content: "",
      word_count: 0,
    })
    .select("id, title, order_index, word_count, updated_at")
    .single();

  if (error || !scene) {
    return NextResponse.json({ error: error?.message ?? "Unable to add scene" }, { status: 400 });
  }

  const project = await getProjectTreeWithClient(supabase, chapter.project_id);

  return NextResponse.json({
    scene,
    chapters: project?.chapters ?? [],
  });
}
