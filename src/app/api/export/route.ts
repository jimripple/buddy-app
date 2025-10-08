import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getActionSupabase } from "@/lib/supabase/actions";

const FALLBACK_ID = "00000000-0000-0000-0000-000000000000";

function sanitizeFilename(name: string, extension: "md" | "txt") {
  const safe = name.replace(/[^a-z0-9-_]+/gi, "-").replace(/-{2,}/g, "-");
  const base = safe.length ? safe.toLowerCase() : "project";
  return `${base}.${extension}`;
}

function stripHeading(line: string) {
  return line.replace(/^#+\s*/, "");
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const formatParam = (url.searchParams.get("format") ?? "md").toLowerCase();
  const format = formatParam === "txt" ? "txt" : "md";

  if (!projectId) {
    return NextResponse.json({ ok: false, message: "projectId is required" }, { status: 400 });
  }

  const supabase = await getActionSupabase();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, title")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ ok: false, message: "Project not found" }, { status: 404 });
  }

  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("id, title, order_index")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true });

  if (chaptersError) {
    return NextResponse.json({ ok: false, message: chaptersError.message }, { status: 400 });
  }

  const chapterIds = (chapters ?? []).map((chapter) => chapter.id);

  const { data: scenes, error: scenesError } = await supabase
    .from("scenes")
    .select("id, title, order_index, chapter_id, content")
    .in("chapter_id", chapterIds.length ? chapterIds : [FALLBACK_ID])
    .order("order_index", { ascending: true });

  if (scenesError) {
    return NextResponse.json({ ok: false, message: scenesError.message }, { status: 400 });
  }

  const contentLines: string[] = [];
  contentLines.push(`# ${project.title}`);
  contentLines.push("");

  (chapters ?? []).forEach((chapter, chapterIndex) => {
    const chapterNumber = chapterIndex + 1;
    contentLines.push(`## Chapter ${chapterNumber} — ${chapter.title}`);
    contentLines.push("");

    const chapterScenes = (scenes ?? []).filter((scene) => scene.chapter_id === chapter.id);

    chapterScenes.forEach((scene, sceneIndex) => {
      const sceneNumber = `${chapterNumber}.${sceneIndex + 1}`;
      contentLines.push(`### Scene ${sceneNumber} — ${scene.title}`);
      contentLines.push("");
      if (scene.content) {
        contentLines.push(scene.content);
      }
      contentLines.push("");
    });
  });

  let output = contentLines.join("\n");

  if (format === "txt") {
    const stripped = contentLines.map((line) => stripHeading(line));
    output = stripped.join("\n");
  }

  const filename = sanitizeFilename(project.title, format);

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(output));
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": format === "txt" ? "text/plain; charset=utf-8" : "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
