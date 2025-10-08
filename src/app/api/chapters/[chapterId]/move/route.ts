import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getProjectTreeWithClient } from "@/lib/db/projects";
import { getActionSupabase } from "@/lib/supabase/actions";
import { moveSchema } from "@/lib/validation/editor";

export async function POST(
  request: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  const supabase = await getActionSupabase();
  const chapterId = params.chapterId;
  const parsed = moveSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

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

  const direction = parsed.data.direction === "up" ? -1 : 1;
  const targetOrder = chapter.order_index + direction;

  if (targetOrder < 1) {
    const project = await getProjectTreeWithClient(supabase, chapter.project_id);
    return NextResponse.json({ chapters: project?.chapters ?? [] });
  }

  const { data: sibling } = await supabase
    .from("chapters")
    .select("id, order_index")
    .eq("project_id", chapter.project_id)
    .eq("order_index", targetOrder)
    .maybeSingle();

  if (!sibling) {
    const project = await getProjectTreeWithClient(supabase, chapter.project_id);
    return NextResponse.json({ chapters: project?.chapters ?? [] });
  }

  const { error: firstUpdateError } = await supabase
    .from("chapters")
    .update({ order_index: sibling.order_index })
    .eq("id", chapterId);

  const { error: secondUpdateError } = await supabase
    .from("chapters")
    .update({ order_index: chapter.order_index })
    .eq("id", sibling.id);

  if (firstUpdateError || secondUpdateError) {
    return NextResponse.json(
      { error: firstUpdateError?.message ?? secondUpdateError?.message ?? "Unable to reorder" },
      { status: 400 }
    );
  }

  const project = await getProjectTreeWithClient(supabase, chapter.project_id);
  return NextResponse.json({ chapters: project?.chapters ?? [] });
}
