import type { SupabaseClient } from "@supabase/supabase-js";

import { getRscSupabase } from "@/lib/supabase/rsc";
import type { Database } from "@/lib/supabase/types";

export type Project = Database["public"]["Tables"]["projects"]["Row"];

export type ChapterWithScenes = Database["public"]["Tables"]["chapters"]["Row"] & {
  scenes: Array<
    Pick<
      Database["public"]["Tables"]["scenes"]["Row"],
      "id" | "title" | "order_index" | "word_count" | "updated_at"
    >
  >;
};

export async function getProjects(): Promise<Project[]> {
  const supabase = await getRscSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function fetchProjectTree(
  supabase: SupabaseClient<Database>,
  projectId: string
) {
  const { data, error } = await supabase
    .from("projects")
    .select(
      `id, title, goal_words_per_day, deadline, created_at,
        chapters:chapters(
          id,
          title,
          order_index,
          created_at,
          scenes:scenes(
            id,
            title,
            order_index,
            word_count,
            updated_at
          )
        )`
    )
    .eq("id", projectId)
    .order("order_index", { referencedTable: "chapters", ascending: true })
    .order("order_index", {
      referencedTable: "chapters.scenes",
      ascending: true,
    })
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    goal_words_per_day: data.goal_words_per_day,
    deadline: data.deadline,
    created_at: data.created_at,
    chapters: (data.chapters as unknown as ChapterWithScenes[]) ?? [],
  };
}

export async function getProjectTree(projectId: string) {
  const supabase = await getRscSupabase();
  return fetchProjectTree(supabase, projectId);
}

export async function getProjectTreeWithClient(
  supabase: SupabaseClient<Database>,
  projectId: string
) {
  return fetchProjectTree(supabase, projectId);
}

export async function getSceneWithContent(sceneId: string) {
  const supabase = await getRscSupabase();
  const { data, error } = await supabase
    .from("scenes")
    .select("id, title, content, word_count, updated_at, chapter_id")
    .eq("id", sceneId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getDailyStats(projectId: string, date: string) {
  const supabase = await getRscSupabase();
  const { data, error } = await supabase
    .from("stats_daily")
    .select("id, words_written, streak")
    .eq("project_id", projectId)
    .eq("date", date)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
