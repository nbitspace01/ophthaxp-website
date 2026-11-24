"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Shown when a page fails to render (e.g. the backend is slow or down), in
 * place of the framework's plain error screen. Same look as not-found.tsx.
 * "Try again" re-renders the page; the visitor keeps their place on the site.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[page error]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
      <p className="text-xs uppercase tracking-widest text-white/40">Something went wrong</p>
      <h1 className="mt-2 font-serif text-4xl text-white">This page could not load</h1>
      <p className="mt-3 text-white/60">
        Please try again in a moment. If it keeps happening, contact us and we&rsquo;ll sort it out.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink-950"
        >
          Try again
        </button>
        <Link href="/" className="rounded-full border border-white/25 px-5 py-2 text-sm font-semibold text-white">
          Back home
        </Link>
      </div>
    </main>
  );
}
