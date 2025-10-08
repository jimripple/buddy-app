import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getActionSupabase } from "@/lib/supabase/actions";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId");
  const supabase = await getActionSupabase();

  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select(
      `title,
       chapters:chapters(
         title,
         order_index,
         scenes:scenes(
           title,
           order_index,
           content
         )
       )`
    )
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const chapters = (project.chapters ?? []).sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
  );

  const lines: string[] = [];

  chapters.forEach((chapter) => {
    lines.push(`# ${chapter.title}`);
    lines.push("");
    const scenes = (chapter.scenes ?? []).sort(
      (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
    );

    scenes.forEach((scene) => {
      lines.push(`## ${scene.title}`);
      lines.push("");
      lines.push(scene.content ?? "");
      lines.push("");
    });
  });

  const markdown = lines.join("\n");
  const filename = `${project.title.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase() || "project"}.md`;

  const response = new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });

  return response;
}
