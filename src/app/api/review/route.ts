import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getReviewer } from "@/lib/ai";
import { getActionSupabase } from "@/lib/supabase/actions";
import { reviewRequestSchema, reviewResponseSchema } from "@/lib/validation/review";

export async function POST(request: NextRequest) {
  const supabase = await getActionSupabase();

  const body = await request.json();
  const parsed = reviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { projectId, sceneId } = parsed.data;

  const { data: scene, error: sceneError } = await supabase
    .from("scenes")
    .select("content, title, chapter_id")
    .eq("id", sceneId)
    .maybeSingle();

  if (sceneError || !scene) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }

  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("project_id")
    .eq("id", scene.chapter_id)
    .maybeSingle();

  if (chapterError || !chapter || chapter.project_id !== projectId) {
    return NextResponse.json({ error: "Scene does not belong to project" }, { status: 400 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("title")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const reviewer = getReviewer();
  const review = await reviewer.review({
    projectId,
    sceneId,
    sceneText: scene.content ?? "",
    projectTitle: project.title,
  });

  const parsedReview = reviewResponseSchema.parse(review);

  const { error: insertError } = await supabase.from("reviews").insert({
    project_id: projectId,
    scene_id: sceneId,
    summary: parsedReview.summary,
    strengths: parsedReview.strengths,
    critiques: parsedReview.critiques,
    challenge: parsedReview.challenge,
    model_used: "mock",
    scope: "scene",
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({
    review: parsedReview,
  });
}
