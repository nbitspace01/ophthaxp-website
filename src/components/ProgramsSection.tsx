"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import {
  AllSpecialtiesIcon,
  CataractIcon,
  CorneaIcon,
  GlaucomaIcon,
  PracticeManagementIcon,
  RefractiveSurgeryIcon,
  RetinaIcon,
} from "@/components/SpecialtyIcons";
import { DOCTORS } from "@/lib/data";
import type { Doctor, Program, Specialty } from "@/types";
import { UpdatingNotice } from "@/components/UpdatingNotice";
import { byFeaturedStamp, cn, featuredStamp } from "@/lib/utils";

/**
 * The filter chips, in display order, each with its mark from the Figma icon
 * family and the backend specialties it shows.
 *
 * The backend has no separate cataract specialty — cataract (phaco) and
 * refractive share "phaco-refractive-surgery" — so both chips match it.
 */
const FILTERS: {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Empty for "All". */
  specialties: Specialty[];
}[] = [
  { key: "all", label: "All", icon: AllSpecialtiesIcon, specialties: [] },
  // "phaco-refractive-surgery" is the old combined value: it still shows under
  // both Cataract and Refractive until the admin re-picks.
  { key: "cataract", label: "Cataract", icon: CataractIcon, specialties: ["cataract", "phaco-refractive-surgery"] },
  { key: "cornea", label: "Cornea", icon: CorneaIcon, specialties: ["cornea-ocular-surface"] },
  { key: "glaucoma", label: "Glaucoma", icon: GlaucomaIcon, specialties: ["glaucoma"] },
  { key: "retina", label: "Retina", icon: RetinaIcon, specialties: ["retina-vitreo-retinal-surgery"] },
  { key: "refractive", label: "Refractive", icon: RefractiveSurgeryIcon, specialties: ["refractive", "phaco-refractive-surgery"] },
  {
    key: "practice-mastery",
    label: "Practice Mastery",
    icon: PracticeManagementIcon,
    specialties: ["ophthalmology-practice-mastery"],
  },
];

export function ProgramsSection({
  doctors,
  programs,
}: {
  doctors?: Doctor[];
  programs?: Program[];
}) {
  // When the parent passes `doctors` (even an empty array), use it as the source of truth.
  // Only fall back to static data when the prop is omitted entirely (e.g. preview mode).
  const data: Doctor[] = doctors !== undefined ? doctors : DOCTORS;

  const [active, setActive] = useState<string>("all");
  const [pageCount, setPageCount] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const railRef = useRef<HTMLDivElement | null>(null);

  /**
   * One entry per programme, not one per Legend.
   *
   * A card here is a programme with the Legend who teaches it credited
   * underneath. A Legend with nothing linked to them has no programme to put
   * on the card, so they used to fall back to their own name and specialty -
   * a person card sitting in a row of programme cards, under a heading that
   * promised programmes, linking off to a profile. They belong on /doctors,
   * which the second button under this rail already goes to.
   *
   * The course reference is resolved once, here, rather than again inside the
   * map below: what is filtered on and what is rendered cannot then disagree.
   */
  const entries = useMemo(() => {
    const out: {
      doctor: Doctor;
      courseName: string;
      courseSlug: string;
      isNew?: boolean;
      isFeatured?: boolean;
      featuredAt?: string;
      /** What the filter chips match: the course's own Specialty. */
      specialties: string[];
      /** Card photo, in the same order as the Programmes page cards. */
      image?: string;
    }[] = [];
    // `p.doctorSlug` is the Legend's row id (reference field) or slug.
    const doctorByRef = new Map<string, Doctor>();
    for (const d of data) {
      doctorByRef.set(String(d.id), d);
      doctorByRef.set(d.slug, d);
    }
    // Split schema: every course row that points at a Legend is a card, so a
    // Legend with two programmes has two cards.
    const withCourse = new Set<Doctor>();
    for (const p of programs ?? []) {
      const d = p.doctorSlug ? doctorByRef.get(String(p.doctorSlug)) : undefined;
      if (!d || !p.name || !p.slug) continue;
      withCourse.add(d);
      const own = p.specialties?.length ? p.specialties : p.specialty ? [p.specialty] : [];
      out.push({
        doctor: d,
        courseName: p.name,
        courseSlug: p.slug,
        isNew: p.isNew,
        isFeatured: p.isFeatured,
        featuredAt: p.featuredAt,
        // The course's Specialty decides its filters; the Legend's is only
        // a fallback for a course with none.
        specialties: own.length ? own : d.specialty,
        // Course Card Image first, as on /programmes, so one course shows the
        // same photo in both places; the Legend's photo is the last fallback.
        image: p.cardImage || p.heroImage || p.doctorImage || d.imageUrl,
      });
    }
    // Merged schema: the Legend row carries the course itself.
    for (const d of data) {
      if (withCourse.has(d) || !d.courseName || !d.courseSlug) continue;
      out.push({ doctor: d, courseName: d.courseName, courseSlug: d.courseSlug, specialties: d.specialty, image: d.imageUrl });
    }
    // A featured course leads the rail; otherwise the Legends' order stays.
    const legendOrder = new Map(data.map((d, i) => [d, i]));
    return out
      .map((e, i) => ({ e, i }))
      .sort(
        (a, b) =>
          Number(Boolean(b.e.isFeatured)) - Number(Boolean(a.e.isFeatured)) ||
          byFeaturedStamp(featuredStamp(a.e.isFeatured, a.e.featuredAt), featuredStamp(b.e.isFeatured, b.e.featuredAt)) ||
          (legendOrder.get(a.e.doctor) ?? 0) - (legendOrder.get(b.e.doctor) ?? 0) ||
          a.i - b.i,
      )
      .map(({ e }) => e);
  }, [data, programs]);

  const filtered = useMemo(() => {
    const filter = FILTERS.find((f) => f.key === active);
    if (!filter || filter.specialties.length === 0) return entries;
    return entries.filter((e) => e.specialties.some((sp) => (filter.specialties as string[]).includes(sp)));
  }, [active, entries]);

  // Track scroll position so the bottom pagination reflects the reader's place
  // in the rail. Recomputes on scroll, on filter change, and when the rail resizes.
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;

    const update = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 1) {
        setPageCount(1);
        setActivePage(0);
        return;
      }
      const pages = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
      setPageCount(pages);
      const ratio = el.scrollLeft / maxScroll;
      setActivePage(Math.min(pages - 1, Math.round(ratio * (pages - 1))));
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [filtered.length]);

  const scroll = (dir: "left" | "right") => {
    const el = railRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const goToPage = (i: number) => {
    const el = railRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const target = pageCount > 1 ? (i / (pageCount - 1)) * maxScroll : 0;
    el.scrollTo({ left: target, behavior: "smooth" });
  };

  // Auto-advance the carousel every 4s. Pauses while the user hovers the rail
  // (so they can read), and skips entirely when the document tab is hidden.
  useEffect(() => {
    if (pageCount <= 1 || isPaused) return;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      const next = (activePage + 1) % pageCount;
      goToPage(next);
    }, 4000);

    return () => window.clearInterval(id);
    // goToPage is stable for current refs; intentionally omitting it from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageCount, activePage, isPaused]);

  return (
    <section
      id="programs"
      aria-labelledby="programs-title"
      className="mx-auto max-w-[1440px] px-5 py-10 sm:px-10 sm:py-14 lg:px-14"
    >
      <h2
        id="programs-title"
        className="text-center text-[clamp(1.75rem,3.1vw,2.6rem)] font-extrabold leading-tight tracking-[-0.015em] text-white"
      >
        Legacy Transfer Programmes
      </h2>
      <p className="mx-auto mt-4 text-center text-[15px] leading-relaxed text-white/45 sm:text-[17px] lg:ml-[133px] lg:mr-[180px]">
        Each programme is a methodical, months-long hybrid journey with the Legend, built around the high-stakes realities of the specialty and your practice. The programme’s architecture starts and ends in your practice: every engagement with the Legend returns to practice; every return deepens the next, transforming how you think, decide, perform, and grow.
      </p>

      {/* Specialty tabs. Seven chips wrap to four rows on a phone, so there they
          are one scrolling row instead, bled to both edges like the rail below.
          Wrapped and centred from sm up, as designed. */}
      <div
        role="tablist"
        aria-label="Specialty filters"
        className="no-scrollbar -mx-5 mt-8 flex max-w-5xl gap-2.5 overflow-x-auto px-5 pb-1 sm:mx-auto sm:mt-14 sm:flex-wrap sm:justify-center sm:gap-3 sm:overflow-x-visible sm:px-0 sm:pb-0"
      >
        {FILTERS.map((tab) => {
          const selected = active === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.key)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-[10px] border px-4 py-2.5 text-[14px] transition sm:px-5 sm:py-3 sm:text-[15px]",
                selected
                  ? "border-spark bg-transparent font-medium text-spark"
                  : "border-transparent bg-ink-800 text-white/70 hover:bg-ink-700 hover:text-white",
              )}
            >
              <Icon className="h-[22px] w-[22px]" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Mentor rail. .rail-bleed breaks the track out to both viewport edges so
          cards run off-canvas instead of stopping at the section padding —
          scrolled-past cards slide off the left exactly the way upcoming ones
          bleed off the right — while keeping the first card on the content
          column. Body has overflow-x: clip, so it adds no page scrollbar. */}
      <div className="relative mt-10 sm:mt-14">
        {/* Only where there is somewhere to go. pageCount is 1 whenever the
            track already fits, so a rail holding one or two cards shows no
            arrows rather than a pair of buttons that do nothing — the same
            test the pagination dots below this already use. */}
        {pageCount > 1 && (
        <div className="absolute right-0 top-0 z-10 hidden -translate-y-14 items-center gap-2.5 sm:flex">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll programs left"
            className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-full bg-ink-800 text-white transition hover:bg-ink-700"
          >
            <ChevronsLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll programs right"
            className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white text-black transition hover:bg-white/85"
          >
            <ChevronsRight className="h-5 w-5" />
          </button>
        </div>
        )}

        <div
          ref={railRef}
          role="region"
          aria-label="Featured programs"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          className="no-scrollbar rail-bleed flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 pr-5 sm:pr-10"
          style={{ "--rail-inset": "calc(max(0px, (100vw - 1440px) / 2) + 3.5rem)" } as React.CSSProperties}
        >
          {entries.length === 0 ? (
            <UpdatingNotice
              title="Our programmes are"
              accent="being updated."
              body="New cohorts with the Legends are being prepared. Please check back shortly, or talk to us about the next intake."
              secondary={null}
              // Centred in the rail: the rail pads its left by --rail-inset but its
              // right by only pr-5 / sm:pr-10, so the notice evens that out.
              className="!w-auto min-w-0 flex-1 mr-[calc(var(--rail-inset)-1.25rem)] sm:mr-[calc(var(--rail-inset)-2.5rem)]"
            />
          ) : filtered.length === 0 ? (
            <div className="w-full rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/55">
              No programmes in this specialty yet.
            </div>
          ) : (
            filtered.map(({ doctor: d, courseName, courseSlug, isNew, image }) => {
              return (
                <Link
                  key={courseSlug}
                  href={`/programmes/${courseSlug}`}
                  className="group relative aspect-[306/482] w-[248px] shrink-0 snap-start overflow-hidden rounded-xl border border-white/15 bg-ink-850 transition duration-300 hover:-translate-y-1 hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:w-[306px]"
                >
                  {isNew && (
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-black">
                      New
                    </span>
                  )}
                  {image ? (
                    <Image
                      src={image}
                      alt={`${d.name}${courseName ? `, ${courseName}` : ""}${d.city ? ` — ${d.city}` : ""}`}
                      fill
                      sizes="(max-width: 640px) 248px, 306px"
                      className="object-cover object-top transition duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-deep/50 to-black" />
                  )}
                  {/* Bottom-up scrim so the title stays readable over any portrait. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-[linear-gradient(to_top,rgba(0,0,0,0.95)_0%,rgba(0,0,0,0.72)_38%,rgba(0,0,0,0)_100%)]"
                  />
                  {/* Title is the programme; the mentor is the credit line under
                      it. Every card in the rail has both - one without a
                      programme never got this far. */}
                  <div className="absolute inset-x-0 bottom-0 px-5 pb-6 pt-12 text-center">
                    <p className="font-serif text-[26px] font-medium leading-[1.12] text-white text-center">
                      {courseName.split("|").map((line, i) => (
                        <span key={i}>{i > 0 && <br />}{line}</span>
                      ))}
                    </p>
                    <span className="mx-auto mt-3 block h-px w-5 bg-white/70 transition-all duration-300 group-hover:w-10" aria-hidden />
                    <p className="mt-3 text-[13px] text-white/70">
                      with <span className="font-semibold text-white">{d.name}</span>
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        {/* Rail pagination — the active page reads as a bar, the rest as dots. */}
        {pageCount > 1 && (
          <div
            role="tablist"
            aria-label="Program list pages"
            className="mt-8 flex items-center justify-center gap-2"
          >
            {Array.from({ length: pageCount }).map((_, i) => {
              const selected = i === activePage;
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-label={`Go to page ${i + 1} of ${pageCount}`}
                  onClick={() => goToPage(i)}
                  className={cn(
                    "relative h-1.5 rounded-full transition-all duration-300 after:absolute after:-inset-x-1 after:-inset-y-3 after:content-['']",
                    selected ? "w-7 bg-white" : "w-1.5 bg-white/25 hover:bg-white/50",
                  )}
                />
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-9 flex flex-wrap justify-center gap-3 sm:mt-12">
        <Link
          href="/programmes"
          className="rounded-[10px] bg-accent px-7 py-3.5 text-[15px] font-semibold text-white transition hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Explore Programmes
        </Link>
        <Link
          href="/legends"
          className="rounded-[10px] bg-ink-700 px-7 py-3.5 text-[15px] font-medium text-white/85 transition hover:bg-ink-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Explore Legends
        </Link>
      </div>
    </section>
  );
}
