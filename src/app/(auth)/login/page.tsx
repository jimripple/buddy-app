import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { getRscSupabase } from "@/lib/supabase/rsc";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in | Buddy",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const supabase = await getRscSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rawRedirect = Array.isArray(sp.redirect) ? sp.redirect[0] : sp.redirect;
  const redirectTo =
    typeof rawRedirect === "string" && rawRedirect.startsWith("/")
      ? rawRedirect
      : undefined;

  if (user) {
    redirect(redirectTo ?? "/projects");
  }

  const rawSuccess = Array.isArray(sp.success) ? sp.success[0] : sp.success;
  const rawError = Array.isArray(sp.error) ? sp.error[0] : sp.error;
  const success =
    typeof rawSuccess === "string" && rawSuccess
      ? decodeURIComponent(rawSuccess)
      : undefined;
  const error =
    typeof rawError === "string" && rawError ? decodeURIComponent(rawError) : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-slate-900/60 border border-white/10 p-10 shadow-xl">
        <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">
          Welcome back to Buddy
        </h1>
        <p className="text-slate-400 mb-8 text-sm">
          Enter your email and we&apos;ll send a magic link to get you writing.
        </p>
        <LoginForm redirectTo={redirectTo} initialSuccess={success} initialError={error} />
      </div>
    </div>
  );
}
