import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getActionSupabase } from "@/lib/supabase/actions";
import { reviewRequestSchema, reviewResponseSchema } from "@/lib/validation/review";

function generateDeterministicScores(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lengthScore = Math.min(10, Math.max(0, Math.floor(words.length / 50)));
  const clarity = Math.max(0, Math.min(10, 6 + (lengthScore % 3) - 1));
  const pacing = Math.max(0, Math.min(10, 5 + ((words.length % 7) - 3)));
  const showVsTell = Math.max(0, Math.min(10, 4 + ((text.match(/\b(describe|tell)\b/gi)?.length ?? 0) * -1 + 6)));

  const suggestions = [
    "Tighten the opening paragraph to clarify the setup",
    "Add a sensory detail to ground the reader in the scene",
    "Consider varying sentence length to improve pacing",
    "Highlight the protagonist's emotional stakes",
    "End the scene with a question or hook for the next chapter",
  ];

  return {
    clarity,
    pacing,
    show_vs_tell: showVsTell,
    summary: words.length
      ? `A ${words.length}-word scene focusing on character development and forward plot movement.`
      : "Short scene—consider expanding to explore character motivations.",
    suggestions,
  };
}

export async function POST(request: NextRequest) {
  const supabase = await getActionSupabase();

  const body = await request.json();
  const parsed = reviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
  }

  const { projectId, sceneId } = parsed.data;

  const { data: scene, error: sceneError } = await supabase
    .from("scenes")
    .select("content, title, chapter_id")
    .eq("id", sceneId)
    .maybeSingle();

  if (sceneError || !scene) {
    return NextResponse.json({ ok: false, message: "Scene not found" }, { status: 404 });
  }

  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("project_id")
    .eq("id", scene.chapter_id)
    .maybeSingle();

  if (chapterError || !chapter || chapter.project_id !== projectId) {
    return NextResponse.json({ ok: false, message: "Scene does not belong to project" }, { status: 400 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json({ ok: false, message: "Project not found" }, { status: 404 });
  }

  const result = generateDeterministicScores(scene.content ?? "");

  const review = reviewResponseSchema.parse(result);

  return NextResponse.json({ ok: true, review });
}
