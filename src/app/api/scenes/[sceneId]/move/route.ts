import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getProjectTreeWithClient } from "@/lib/db/projects";
import { getActionSupabase } from "@/lib/supabase/actions";
import { moveSchema } from "@/lib/validation/editor";

export async function POST(
  request: NextRequest,
  { params }: { params: { sceneId: string } }
) {
  const supabase = await getActionSupabase();
  const sceneId = params.sceneId;

  const parsed = moveSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    data: scene,
    error: sceneError,
  } = await supabase
    .from("scenes")
    .select("chapter_id, order_index")
    .eq("id", sceneId)
    .maybeSingle();

  if (sceneError || !scene) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }

  const direction = parsed.data.direction === "up" ? -1 : 1;
  const targetOrder = scene.order_index + direction;

  const { data: chapterRecord, error: chapterError } = await supabase
    .from("chapters")
    .select("project_id")
    .eq("id", scene.chapter_id)
    .maybeSingle();

  if (chapterError || !chapterRecord) {
    return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
  }

  if (targetOrder < 1) {
    const project = await getProjectTreeWithClient(supabase, chapterRecord.project_id);
    return NextResponse.json({ chapters: project?.chapters ?? [] });
  }

  const { data: sibling } = await supabase
    .from("scenes")
    .select("id, order_index")
    .eq("chapter_id", scene.chapter_id)
    .eq("order_index", targetOrder)
    .maybeSingle();

  if (!sibling) {
    const project = await getProjectTreeWithClient(supabase, chapterRecord.project_id);
    return NextResponse.json({ chapters: project?.chapters ?? [] });
  }

  const { error: firstUpdateError } = await supabase
    .from("scenes")
    .update({ order_index: sibling.order_index })
    .eq("id", sceneId);

  const { error: secondUpdateError } = await supabase
    .from("scenes")
    .update({ order_index: scene.order_index })
    .eq("id", sibling.id);

  if (firstUpdateError || secondUpdateError) {
    return NextResponse.json(
      { error: firstUpdateError?.message ?? secondUpdateError?.message ?? "Unable to reorder scene" },
      { status: 400 }
    );
  }

  const project = await getProjectTreeWithClient(supabase, chapterRecord.project_id);
  return NextResponse.json({ chapters: project?.chapters ?? [] });
}
