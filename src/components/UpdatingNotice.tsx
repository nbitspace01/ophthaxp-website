import Link from "next/link";

/**
 * Shown where a list has nothing to show yet (programmes, Legends), most often
 * because the content is being updated or the platform is briefly
 * unreachable. Designed as part of the page rather than a placeholder: the
 * LoM mark in a soft terracotta glow, a serif headline with an italic accent,
 * and two ways onward, so a visitor is never left at a dead end.
 */
export function UpdatingNotice({
  eyebrow = "Coming back shortly",
  title,
  accent,
  body,
  primary = { href: "/contact", label: "Talk to us" },
  secondary = { href: "/", label: "Back home" },
  className = "",
}: {
  eyebrow?: string;
  /** Headline before the accent, e.g. "Our Legends are". */
  title: string;
  /** The italic terracotta end of the headline, e.g. "being updated". */
  accent: string;
  body: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string } | null;
  className?: string;
}) {
  return (
    <section
      aria-live="polite"
      className={`relative isolate w-full overflow-hidden rounded-[20px] border border-white/10 bg-[#0d0d0d] px-6 py-14 text-center sm:px-12 sm:py-20 ${className}`}
    >
      {/* Soft terracotta glow behind the mark, and a faint top sheen. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-30%] -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(183,90,68,0.28)_0%,rgba(183,90,68,0.08)_45%,transparent_70%)] blur-2xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent"
      />

      {/* The LoM mark in a ring. */}
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-accent/40 bg-black/60 shadow-[0_0_40px_rgba(183,90,68,0.25)] sm:h-20 sm:w-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/lom-icon-loading.svg" alt="" className="h-7 w-auto opacity-90 sm:h-8" />
      </div>

      <p className="mt-7 text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">{eyebrow}</p>
      <h2 className="mx-auto mt-3 max-w-2xl font-serif text-[clamp(1.75rem,3.4vw,2.75rem)] font-normal leading-[1.15] text-white">
        {title} <em className="whitespace-nowrap text-accent">{accent}</em>
      </h2>
      <span aria-hidden className="mx-auto mt-6 block h-px w-10 bg-white/25" />
      <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-white/60">{body}</p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={primary.href}
          className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          {primary.label}
          <span aria-hidden>→</span>
        </Link>
        {secondary && (
          <Link
            href={secondary.href}
            className="inline-flex items-center rounded-[10px] border border-white/20 px-6 py-3 text-[15px] font-semibold text-white transition hover:border-white/40 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            {secondary.label}
          </Link>
        )}
      </div>
    </section>
  );
}
