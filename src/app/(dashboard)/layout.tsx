import Link from "next/link";

import { getRscSupabase } from "@/lib/supabase/rsc";
import { cx } from "@/lib/utils";
import { signOutAction } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getRscSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/projects" className="flex items-center gap-2 text-lg font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-sm font-bold text-white">
              B
            </span>
            Buddy
          </Link>
          <nav className="flex items-center gap-6 text-sm text-slate-300">
            <Link
              href="/projects"
              className={cx(
                "transition hover:text-white",
                "data-[active=true]:text-white"
              )}
              data-active
            >
              Projects
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-full bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
              >
                Sign out
              </button>
            </form>
            {user?.email ? (
              <span className="hidden text-xs text-slate-500 sm:inline">{user.email}</span>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
