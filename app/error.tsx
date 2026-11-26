"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-20">
      <div className="max-w-md rounded-lg border border-line bg-surface p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Something went wrong
        </p>
        <h1 className="mt-3 font-serif text-3xl">We could not load this page</h1>
        <p className="mt-3 text-sm text-muted">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-deep"
          >
            Try again
          </button>
          <Link
            href="/browse"
            className="rounded-md border border-line px-4 py-2.5 text-sm font-semibold hover:border-ink"
          >
            Browse courses
          </Link>
        </div>
      </div>
    </main>
  );
}
