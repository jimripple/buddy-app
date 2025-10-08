"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-950 p-6 text-slate-200">
      <div className="max-w-md space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-slate-400">{error.message ?? "Unexpected error"}</p>
        <button
          onClick={reset}
          className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
