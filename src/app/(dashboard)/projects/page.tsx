import Link from "next/link";

import { getRscSupabase } from "@/lib/supabase/rsc";

import NewProjectModal from "./new-project-modal";
import { createProject } from "./actions";

export default async function ProjectsPage() {
  const supabase = await getRscSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold text-white">Projects</h1>
        <p className="text-slate-400">Sign in to manage your projects.</p>
      </div>
    );
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, created_at, goal_words_per_day, deadline")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Your projects</h1>
          <p className="text-sm text-slate-400">
            Create a project to set goals and draft chapters with Buddy guiding you.
          </p>
        </div>
        {projects?.length ? <NewProjectModal action={createProject} /> : null}
      </div>

      {projects?.length ? (
        <div className="grid gap-8 sm:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/project/${project.id}`}
              className="group rounded-2xl ring-1 ring-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/30 transition hover:ring-sky-500/50 hover:bg-slate-900/80"
            >
              <h2 className="text-xl font-semibold text-white group-hover:text-sky-300">
                {project.title}
              </h2>
              <dl className="mt-4 space-y-1 text-sm text-slate-400">
                {project.goal_words_per_day ? (
                  <div className="flex items-center gap-2">
                    <dt className="font-medium text-slate-500">Daily goal:</dt>
                    <dd>{project.goal_words_per_day} words</dd>
                  </div>
                ) : null}
                {project.deadline ? (
                  <div className="flex items-center gap-2">
                    <dt className="font-medium text-slate-500">Deadline:</dt>
                    <dd>{new Date(project.deadline).toLocaleDateString()}</dd>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <dt className="font-medium text-slate-500">Created:</dt>
                  <dd>{new Date(project.created_at as string).toLocaleDateString()}</dd>
                </div>
              </dl>
            </Link>
          ))}
          <div className="flex flex-col justify-between gap-6 rounded-2xl border border-dashed border-white/15 bg-slate-900/20 p-6 shadow-xl shadow-slate-950/25">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-white">Start something new</h2>
              <p className="text-sm text-slate-400">
                Set up a fresh project to track your chapters, scenes, and daily writing streaks.
              </p>
            </div>
            <NewProjectModal action={createProject} />
          </div>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-white/15 bg-slate-900/30 p-12 text-center shadow-xl shadow-slate-950/25">
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-white">Buddy is ready to help you write your first chapter</h2>
              <img src="/buddy.svg" alt="Buddy mascot" className="mx-auto mb-4 h-10 w-10 opacity-80" />
              <p className="mx-auto max-w-sm text-sm text-slate-400">
                Create your first project to start organizing chapters and scenes. Buddy will keep track of your daily progress.
              </p>
            </div>
            <NewProjectModal action={createProject} />
          </div>
        </div>
      )}
    </div>
  );
}
