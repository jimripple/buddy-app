import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getActionSupabase } from "@/lib/supabase/actions";
import { sceneMemoryResponseSchema } from "@/lib/validation/editor";

export async function GET(
  request: NextRequest,
  { params }: { params: { sceneId: string } }
) {
  const supabase = await getActionSupabase();
  const sceneId = params.sceneId;

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

  const { data: review } = await supabase
    .from("reviews")
    .select("summary, strengths, critiques, challenge")
    .eq("scene_id", sceneId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: entities, error: entitiesError } = await supabase
    .from("entities")
    .select("id, kind, name, occurrences, last_seen_chapter, details")
    .eq("project_id", chapterRecord.project_id)
    .order("occurrences", { ascending: false });

  if (entitiesError) {
    return NextResponse.json({ error: entitiesError.message }, { status: 400 });
  }

  const payload = sceneMemoryResponseSchema.parse({
    review: review ?? null,
    entities: entities ?? [],
  });

  return NextResponse.json(payload);
}
