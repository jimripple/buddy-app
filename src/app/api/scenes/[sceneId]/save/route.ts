import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { addDays } from "date-fns";

import { getActionSupabase } from "@/lib/supabase/actions";
import { sceneSaveSchema } from "@/lib/validation/editor";
import {
  calculateDailyUpdate,
  countWords,
  type DailyStat,
} from "@/lib/streak";

export async function POST(
  request: NextRequest,
  { params }: { params: { sceneId: string } }
) {
  const supabase = await getActionSupabase();
  const sceneId = params.sceneId;
  const body = await request.json();
  const parsed = sceneSaveSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
  }

  const { data: sceneRecord, error: sceneError } = await supabase
    .from("scenes")
    .select(
      `id, chapter_id, word_count,
       chapters!inner(
         project_id,
         projects!inner(id, goal_words_per_day)
       )`
    )
    .eq("id", sceneId)
    .eq("chapters.projects.id", parsed.data.projectId)
    .maybeSingle();

  if (sceneError || !sceneRecord) {
    return NextResponse.json({ ok: false, message: "Scene not found" }, { status: 404 });
  }

  const record = sceneRecord as unknown as {
    chapter_id: string;
    word_count: number | null;
    chapters: {
      project_id: string;
      projects: { id: string; goal_words_per_day: number | null } | null;
    } | null;
  };

  const projectId = record.chapters?.projects?.id;
  if (!projectId) {
    return NextResponse.json({ ok: false, message: "Scene does not belong to project" }, { status: 400 });
  }

  const newWordCount = countWords(parsed.data.content ?? "");
  const delta = newWordCount - (record.word_count ?? 0);

  const { error: updateError } = await supabase
    .from("scenes")
    .update({
      content: parsed.data.content,
      word_count: newWordCount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sceneId);

  if (updateError) {
    return NextResponse.json({ ok: false, message: updateError.message }, { status: 400 });
  }

  const today = new Date();
  const todayDate = today.toISOString().slice(0, 10);
  const previousDate = addDays(today, -1).toISOString().slice(0, 10);

  const { data: todayStat } = await supabase
    .from("stats_daily")
    .select("id, words_written, streak")
    .eq("project_id", projectId)
    .eq("date", todayDate)
    .maybeSingle();

  const { data: previousStat } = await supabase
    .from("stats_daily")
    .select("date, words_written, streak")
    .eq("project_id", projectId)
    .eq("date", previousDate)
    .maybeSingle();

  const streakResult = calculateDailyUpdate({
    currentWords: todayStat?.words_written ?? 0,
    delta,
    todayDate,
    goal: record.chapters?.projects?.goal_words_per_day ?? null,
    previousStat: previousStat as DailyStat | null | undefined,
  });

  if (todayStat) {
    const { error: statsError } = await supabase
      .from("stats_daily")
      .update({
        words_written: streakResult.words,
        streak: streakResult.streak,
      })
      .eq("id", todayStat.id);

    if (statsError) {
      return NextResponse.json({ ok: false, message: statsError.message }, { status: 400 });
    }
  } else {
    const { error: insertError } = await supabase.from("stats_daily").insert({
      project_id: projectId,
      date: todayDate,
      words_written: streakResult.words,
      streak: streakResult.streak,
    });

    if (insertError) {
      return NextResponse.json({ ok: false, message: insertError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
