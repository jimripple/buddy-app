"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    toast.error(error.message ?? "Something went wrong");
  }, [error]);

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-slate-200">
      <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
      <p className="text-sm text-slate-400">
        We couldn&apos;t load this page. Try again and if the issue persists, contact support.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </div>
  );
}
