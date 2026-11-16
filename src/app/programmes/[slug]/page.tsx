import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LegendTrailer } from "@/components/LegendTrailer";
import { CourseMastery } from "@/components/CourseMastery";
import { CourseRoadmap } from "@/components/CourseRoadmap";
import { PracticeGrowthCalculator } from "@/components/PracticeGrowthCalculator";
import { HowItWorks } from "@/components/HowItWorks";
import { FaqGrid } from "@/components/FaqGrid";
import { CourseStickyFooter } from "@/components/CourseStickyFooter";
import { CourseApplyButton } from "@/components/CourseApplyButton";
import {
  certificateName,
  HOUSE_SIGNATORY,
} from "@/components/CertificatePlate";
import { getSessionUser } from "@/lib/session";
import { plainName } from "@/lib/utils";
import {
  fetchCourseFromBackend,
  fetchCourseSlugsFromBackend,
  fetchAllDoctorsFromBackend,
  fetchRelatedDoctors,
} from "@/lib/courses";
import type { CourseModule, Doctor, Faculty } from "@/types";
import { buildMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";

export const dynamic = "force-dynamic";

/* The page column, shared with every section on the home page: 1200px of
   content inside 120px gutters at the 1440 design width. */
const SHELL = "mx-auto max-w-[1600px] px-8 sm:px-16 lg:px-24";
const SECTION = `${SHELL} py-16 sm:py-24`;
/* Figma sets the section headings at 46px — a step above the home page's 41.6,
   which is why this is spelled out rather than reusing the shared clamp. */
const HEADING =
  "text-[clamp(1.75rem,3.4vw,2.875rem)] font-extrabold leading-tight tracking-[-0.015em] text-white";


/* Shown when the course row carries no highlights of its own. */
const DEFAULT_INCLUSIONS = [
  "Legend Mentorship",
  "Hands-on Clinical Exposure",
  "Programme Certification",
  "Lifetime Professional Network",
];

export async function generateStaticParams() {
  const slugs = await fetchCourseSlugsFromBackend();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const p = await fetchCourseFromBackend(params.slug);
  if (!p) return buildMetadata({ title: "Programme not found" });
  return buildMetadata({
    title: p.headline ? `${plainName(p.name)} — ${p.headline}` : plainName(p.name),
    description: p.tagline || p.description,
    alternates: { canonical: `/programmes/${p.slug}` },
  });
}

function formatDuration(minutes?: number): string | null {
  if (!minutes || minutes <= 0) return null;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs && mins) return `${hrs}hr ${mins}mins`;
  if (hrs) return `${hrs}hr`;
  return `${mins}mins`;
}

function formatLaunch(p: {
  launchMonth?: string;
  launchYear?: number;
  startDate?: string;
  startDateSet?: boolean;
}) {
  if (p.launchMonth && p.launchYear) return `${p.launchMonth} ${p.launchYear}`;
  if (p.launchMonth) return `${p.launchMonth}`;
  // Only a start date that was entered: an empty one is today's placeholder,
  // which made "Starting From" show the current month for every course.
  if (p.startDate && p.startDateSet !== false) {
    const d = new Date(p.startDate);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    }
  }
  return null;
}

/**
 * A role short enough to set under a signature.
 *
 * `faculty.title` is a biography line - "Director, Darshan Eye Care, Chennai |
 * Internationally Acclaimed Cornea & Cataract Specialist" - and the plate has
 * 146px of rule to caption. Squeezed to fit, that is a pixel and a half a
 * letter, which reads as a smudge rather than as a credential.
 *
 * So the first segment is taken where the title is written in parts, and
 * anything still too long gives way to the role this person holds on this
 * programme - shorter, and the truer caption for a signature on its
 * certificate either way.
 */
/** Shown wherever a programme value has not been entered yet. */
const COMING_SOON = "Coming soon";

const ROLE_FITS = 32;
function signatureRole(title?: string): string {
  const first = String(title ?? "").split(/[|\u00b7\u2014]/)[0].trim();
  return first && first.length <= ROLE_FITS ? first : "Programme Mentor";
}

const SPECIALTY_LABELS: Record<string, string> = {
  "cornea-ocular-surface": "Cornea",
  "glaucoma": "Glaucoma",
  "retina-vitreo-retinal-surgery": "Retina",
  "phaco-refractive-surgery": "Cataract & Refractive",
  "pediatric-ophthalmology": "Paediatric",
  "oculoplasty": "Oculoplasty",
  "ophthalmology-practice-mastery": "Practice Mastery",
};

function specialtyLabel(specialty: string): string {
  return SPECIALTY_LABELS[specialty.toLowerCase()] ?? specialty.split("-")[0].toUpperCase();
}

function doctorToFaculty(d: Doctor): Faculty {
  return {
    slug: d.slug,
    name: d.name,
    title: d.title,
    city: d.city || undefined,
    imageUrl: d.imageUrl || undefined,
    qualification: d.qualification,
    bio: d.bio || undefined,
    experienceYears: d.experienceYears || undefined,
  };
}

export default async function ProgramDetailPage({ params }: { params: { slug: string } }) {
  const p = await fetchCourseFromBackend(params.slug);
  if (!p) notFound();

  const related = await fetchRelatedDoctors(p.relatedDoctorSlugs ?? []);

  // Resolve a faculty record for the hero, even when the backend course
  // doesn't have a `doctorSlug` reference set. Priority:
  //   1. p.faculty (already attached server-side via doctorSlug)
  //   2. First doctor from relatedDoctorSlugs (already fetched as `related`)
  //   3. Legacy lookup: any doctor whose courseSlug or slug equals p.slug
  let faculty: Faculty | undefined = p.faculty;
  if (!faculty && related[0]) {
    faculty = doctorToFaculty(related[0]);
  }
  if (!faculty) {
    // Unfiltered: a live course keeps its mentor credit even if that Legend
    // has since been switched off the /doctors index.
    const allDoctors = await fetchAllDoctorsFromBackend();
    const match = allDoctors.find(
      (d) => d.courseSlug === p.slug || d.slug === p.slug,
    );
    if (match) faculty = doctorToFaculty(match);
  }

  const durationLabel = formatDuration(p.durationMinutes);
  const launchLabel = formatLaunch(p);
  // Hero stat: prefer whole-month/week fellowship duration, fall back to the
  // lesson-length label so the strip always shows something meaningful.
  const heroDuration = p.durationMonths
    ? `${p.durationMonths} ${p.durationMonths === 1 ? "Month" : "Months"}`
    : p.durationWeeks
      ? `${p.durationWeeks} ${p.durationWeeks === 1 ? "Week" : "Weeks"}`
      : durationLabel;
  const enrollLabel = "Begin your application";
  const heroImage = p.doctorImage || p.heroImage;
  // Fallback mentor name for the hero credit line when no faculty record could
  // be resolved. Skip it if it just duplicates the course title/headline.
  const mentorName =
    p.mentorName && p.mentorName !== p.name && p.mentorName !== p.headline
      ? p.mentorName
      : undefined;
  const legendName = faculty?.name || mentorName || p.name;

  // The roadmap runs off the `modules` field when the admin has filled it in.
  // Courses that predate it still have `courseFormat`, whose phases carry the
  // same shape minus the per-module outcome list.
  const modules: CourseModule[] =
    p.modules && p.modules.length > 0
      ? p.modules
      : (p.courseFormat ?? []).map((f) => ({
          title: f.phase,
          description: f.description,
          outcomes: [],
        }));

  // Programme-wide lists close the roadmap out. They are not modules, so they
  // take a tick rather than a number and don't disturb the 01/02/03 count.
  const roadmapItems: (CourseModule & {
    badge?: "check";
    outcomesLabel?: string;
  })[] = [
    ...modules,
    ...(p.whatYouWillLearn?.length
      ? [
          {
            title: "What You'll Be Able To Do",
            description: "The outcomes the whole programme is built to deliver.",
            outcomes: p.whatYouWillLearn,
            outcomesLabel: "By the end of the programme, you'll be able to",
            badge: "check" as const,
          },
        ]
      : []),
    ...(p.curriculumHighlights?.length
      ? [
          {
            title: "How the Programme Is Taught",
            description: "The teaching approach running through every module.",
            outcomes: p.curriculumHighlights,
            outcomesLabel: "What sets the teaching apart",
            badge: "check" as const,
          },
        ]
      : []),
  ];

  // The roadmap draws itself from the phases, or one step per month when there
  // are none; with neither it has nothing to show, so a "coming soon" note
  // stands in for it.
  const roadmapMonths =
    p.durationMonths ?? (p.durationWeeks ? Math.round(p.durationWeeks / 4.33) : undefined);
  const hasRoadmap = roadmapItems.length > 0 || (!!roadmapMonths && roadmapMonths > 0);

  // The FAQ deck speaks q/a; the `faqs` column on the course row is
  // question/answer, so it is mapped rather than duplicated in two shapes.
  const faqItems = (p.faqs ?? [])
    .filter((f) => f.question && f.answer)
    .map((f) => ({ q: f.question, a: f.answer }));

  const inclusions = p.highlights.length > 0 ? p.highlights.slice(0, 4) : DEFAULT_INCLUSIONS;

  // The certificate is drawn rather than fetched, so it can be made out to
  // whoever is reading it. The page is force-dynamic already, so the session
  // is read here and the right name is in the first HTML - no fetch after
  // hydration and no flash of somebody else's name.
  const viewer = getSessionUser();
  const recipientName = certificateName(viewer?.firstName, viewer?.lastName);
  // Signed by the Legend who teaches this programme, not by the house. The
  // hand above the rule is that name set in roundhand, never a facsimile, so
  // the printed line and the signature can never disagree.
  const signatory = faculty?.name
    ? { name: faculty.name, role: signatureRole(faculty.title) }
    : mentorName
      ? { name: `Dr. ${mentorName.replace(/^Dr\.?\s+/i, "")}`, role: "Programme Mentor" }
      : HOUSE_SIGNATORY;
  const priceText = p.priceInr
    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(p.priceInr)
    : null;

  const courseLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: plainName(p.name),
    description: p.tagline || p.description,
    provider: { "@type": "Organization", name: SITE_NAME, sameAs: SITE_URL },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "blended",
      startDate: p.startDate,
      duration: p.durationMonths ? `P${p.durationMonths}M` : `P${p.durationWeeks}W`,
    },
    instructor: faculty
      ? {
          "@type": "Person",
          name: faculty.name,
          jobTitle: faculty.title,
        }
      : undefined,
    offers: p.priceInr
      ? {
          "@type": "Offer",
          price: p.priceInr,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/programmes/${p.slug}`,
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseLd) }}
      />
      <Navbar />
      <main className="bg-ink-950 text-white">
        {/* ══════════════════════════════════════════════════════════════
            § 1 — HERO   Portrait column left, copy column right
        ══════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="program-title" className="relative bg-black">
          {/* Mobile: image as full-bleed backdrop with bottom scrim */}
          {heroImage && (
            <div className="absolute inset-0 lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt="" className="h-full w-full object-cover" aria-hidden />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
            </div>
          )}

          {/* Desktop: two-column grid — image left, content right */}
          <div className="lg:grid lg:grid-cols-[56%_44%] lg:h-[650px] lg:items-center overflow-hidden border-b border-[#181818]">
            {/* Image column — desktop only */}
            <div className="hidden lg:grid lg:place-items-center relative overflow-hidden group bg-black" style={{ isolation: "isolate" }}>
              {/* Radial glows (::before) — faint at rest, vivid on hover */}
              <span aria-hidden className="pointer-events-none absolute inset-0 z-[1] opacity-[.12] group-hover:opacity-100 transition-opacity duration-[650ms]" style={{ background: "radial-gradient(circle at 31% 43%,rgba(106,165,203,.2),transparent 29%),radial-gradient(circle at 69% 44%,rgba(183,90,68,.18),transparent 28%)" }} />
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage}
                  alt={legendName}
                  className="relative z-0 w-[112%] max-w-none h-auto scale-[1.02] group-hover:scale-[1.095] brightness-[1.01] contrast-[1.025] group-hover:brightness-[1.13] group-hover:contrast-[1.07]"
                  style={{
                    objectFit: "contain",
                    objectPosition: "center",
                    maxHeight: "none",
                    transformOrigin: "50% 48%",
                    transition: "transform .85s cubic-bezier(.22,.61,.36,1), filter .7s ease",
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-ink-900 to-black" />
              )}
              {/* Edge fades (::after) */}
              <span aria-hidden className="pointer-events-none absolute inset-0 z-[2]" style={{ background: "linear-gradient(90deg,transparent 79%,#050505 100%),linear-gradient(0deg,#050505 0%,transparent 15%)" }} />
            </div>

            {/* Content column */}
            <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center px-5 pb-16 pt-32 sm:px-10 lg:min-h-0 lg:items-start lg:justify-start lg:pt-0 lg:pb-0 lg:pr-[62px] lg:pl-[26px]">
              <div className="w-full text-left">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-accent mb-4">
                {p.specialty ? `LEGACY TRANSFER PROGRAMME / ${specialtyLabel(p.specialty)}` : "LEGACY TRANSFER PROGRAMME"}
              </p>
              <h1
                id="program-title"
                className="font-serif text-[46px] pr-14  font-semibold leading-[1.08] tracking-[-0.025em] text-white mb-[14px]"
              >
                {(p.name || p.headline || "").split("|").map((line, i) => (
                  <span key={i}>{i > 0 && <br />}{line}</span>
                ))}
              </h1>

              {faculty?.name ? (
                <Link
                  href={`/legends/${faculty.slug}`}
                  className="inline-flex items-center gap-1 text-[15px] text-[#a7a7aa] transition hover:text-white"
                >
                  with{" "}
                  <span className="font-semibold text-white">
                    Dr. {faculty.name.replace(/^Dr\.?\s+/i, "")}
                  </span>
                  <span className="text-accent" aria-hidden>↗</span>
                </Link>
              ) : mentorName ? (
                <p className="text-[15px] text-[#a7a7aa]">
                  with{" "}
                  <span className="font-semibold text-white">
                    Dr. {mentorName.replace(/^Dr\.?\s+/i, "")}
                  </span>
                </p>
              ) : null}

              <p className="mt-[17px] max-w-[470px] text-[14px] leading-[1.6] text-[#b7b7bb] mb-[14px]">
                {p.tagline || "The full programme details are coming soon."}
              </p>

              {p.trailerVideoUrl && (
                <a
                  href="#legend-video"
                  className="inline-flex items-center gap-[10px] text-[13px] font-bold text-white no-underline transition hover:opacity-80"
                >
                  <span className="flex h-[27px] w-[27px] items-center justify-center rounded-full border border-[#3a3a3a] text-[8px]">▶</span>
                  Watch Programme Film
                </a>
              )}

              {/* Stat strip — duration · cohort · launch */}
              {/* Always all three; a value not entered yet reads "Coming soon". */}
              {(
                <div className="mt-[18px] mb-[16px] grid grid-cols-3 border-t border-b border-[#2b2b2b] py-[16px] text-left">
                  {[
                    { value: heroDuration || COMING_SOON, label: "Duration" },
                    { value: p.cohortSize ? String(p.cohortSize) : COMING_SOON, label: "Cohort Size" },
                    { value: launchLabel || COMING_SOON, label: "Starting From" },
                  ]
                    .map((stat, i) => {
                      const s = stat as { value: string; label: string };
                      return (
                        <div key={s.label} className={i > 0 ? "border-l border-[#2b2b2b] pl-[22px]" : ""}>
                          <p className="text-[10px] uppercase tracking-[0.11em] text-[#717175]">
                            {s.label}
                          </p>
                          <p className="mt-2 text-[13px] font-bold text-white">
                            {s.value}
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Enrollment card */}
              <div className="mt-4 w-full rounded-[12px] border border-[#343434] bg-[#1b1b1b] px-[14px] pt-[12px] pb-[13px]">
                <div>
                  <CourseApplyButton
                    courseId={p.id}
                    courseSlug={p.slug}
                    courseName={plainName(p.name)}
                    mentorName={faculty?.name}
                    brochureUrl={p.brochureUrl}
                    label={enrollLabel}
                    variant="accent"
                    block
                  />
                </div>
                <p className="mt-[10px] text-center text-[12px] leading-[1.45] text-[#929296] lg:whitespace-nowrap">
                  Every phase in the programme is designed to translate into your clinical practice.
                </p>
              </div>
            </div>
          </div>
          </div>{/* end lg:grid */}
        </section>

        {/* ══════════════════════════════════════════════════════════════
            § 2 — MEET YOUR LEGEND   Documentary trailer
        ══════════════════════════════════════════════════════════════ */}
        {(p.trailerVideoUrl || heroImage) && (
          <section
            id="legend-video"
            aria-labelledby="legend-title"
            className={`scroll-mt-24 ${SHELL} py-8 sm:py-10`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              The Programme Film
            </p>
            <h2 id="legend-title" className={`mt-3 ${HEADING}`}>
              What Becomes Possible
            </h2>
            <div className="relative mt-5 sm:mt-7 mx-auto max-w-[85%]">
              <LegendTrailer
                src={p.trailerVideoUrl}
                poster={p.filmThumbnailUrl || heroImage}
                name={legendName}
              />
              {!p.trailerVideoUrl && (
                <div className="pointer-events-none absolute inset-0 flex items-end justify-start rounded-[12px] bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 sm:p-8">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/50 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
                    Programme film coming soon
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* § 4 — THE DIFFERENCE IT MAKES   Shared ROI calculator */}
        <div className={SHELL}>
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
              A Working View of the Future
            </p>
            <h2 className={`mt-3 ${HEADING}`}>
              Your Future in{" "}
              {p.specialty
                ? SPECIALTY_LABELS[p.specialty.toLowerCase()]?.split(" ")[0] ??
                  p.specialty.split("-")[0].charAt(0).toUpperCase() + p.specialty.split("-")[0].slice(1)
                : "Medicine"}
              , Visualised
            </h2>
          </div>
          <PracticeGrowthCalculator
            courseName={plainName(p.name)}
            courseSlug={p.slug}
            defaultSpecialty={p.specialty}
          />
        </div>

        {/* § 5 — THE ROADMAP */}
        {hasRoadmap ? (
          <CourseRoadmap
            items={roadmapItems}
            durationMonths={roadmapMonths}
            subtitle={p.eligibility || undefined}
          />
        ) : (
          <section aria-labelledby="arc-soon-title" className={SECTION}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Roadmap to Mastery
            </p>
            <h2 id="arc-soon-title" className={`mt-3 ${HEADING}`}>
              The Programme Arc
            </h2>
            <p className="mt-4 max-w-[640px] text-[15px] leading-[1.7] text-[#A5A5A5]">
              The phase-by-phase journey of this programme is being finalised and is coming soon.
            </p>
          </section>
        )}

        {/* § 6 — YOUR PATH INTO THE PROGRAMME */}
        <HowItWorks heading="Your Path into the Programme" align="left" />
        <p className={`${SHELL} -mt-8 mb-6 text-center text-[14px] font-sans text-[#888]`}>
          The Dialogue carries a fee. If you join the cohort, it is adjusted in full against the programme fee.
        </p>

        {/* The plate is ours and it is drawn live, so it carries the reader's
            own name and this programme's mentor. */}
        <section aria-labelledby="cert-title" className="mx-auto max-w-[1600px] py-16 sm:py-24">
          {/* Beige recognition card — full-width of the max-width container, padding inside */}
          <div className="overflow-hidden rounded-[20px] bg-[#DED0BB] lg:grid lg:grid-cols-[42%_58%] lg:items-center lg:min-h-[440px]">
            {/* Left — text */}
            <div className="px-8 py-12 sm:px-16 sm:py-14 lg:px-24 lg:py-16">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B05A3A]">
                The Recognition
              </p>
              <h2 id="cert-title" className="mt-3 text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight text-[#1A1410]">
                Among the{" "}
                <em className="font-normal not-italic" style={{ fontFamily: "var(--font-playfair), serif", fontStyle: "italic" }}>Few</em>
              </h2>
              <p className="mt-4 text-[17px] leading-[1.8] text-[#4A3F35]">
                Take your place among a select group of ophthalmologists from around the world, guided directly by {signatory.name} and carry his depth of judgement and clinical standards into your own practice.
              </p>
            </div>
            {/* Right — dark certificate card */}
            <div className="grid place-items-center px-8 pb-12 sm:px-16 sm:pb-14 lg:px-16 lg:py-16">
              <div className="cert-float relative w-full max-w-[460px]" style={{ filter: "none" }}>
                <div className="absolute inset-0 rounded-[16px] bg-black" style={{ transform: "translate(14px, 14px)", opacity: 1 }} />
                <div className="relative rounded-[16px] bg-[#1A1716] px-10 py-10 text-center" style={{ border: "1.5px solid #8B4433" }}>
                  <div className="pointer-events-none absolute inset-[10px] rounded-[10px]" style={{ border: "1px solid #8B4433", opacity: 0.45 }} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/lom-icon-loading.svg" alt="Legends of Medicine" className="mx-auto mb-4 h-7 w-auto" />
                  <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white">Legends of Medicine</p>
                  <p className="mt-6 font-serif text-[1.1rem] font-bold uppercase tracking-[0.06em] text-white sm:text-[1.35rem]">{recipientName}</p>
                  <p className="mt-2 text-[11px] leading-[1.6] text-white/60">{p.headline || plainName(p.name)}</p>
                  <p className="mt-0.5 text-[10px] text-white/40">Guided by {signatory.name}</p>
                  <p className="mt-6 font-serif text-[1.35rem] italic leading-none text-[#C97B50]">{signatory.name}</p>
                  {(p.launchYear || (p.startDate && p.startDateSet !== false)) && (
                    <p className="mt-4 text-[8px] font-semibold uppercase tracking-[0.26em] text-white/30">
                      Cohort {p.launchYear ?? new Date(p.startDate).getFullYear()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            § 7 — INVESTMENT
        ══════════════════════════════════════════════════════════════ */}
        {(
          <section aria-labelledby="investment-title" className={SECTION}>
            <div className="rounded-[16px] border border-[#2A2A2A] bg-[#0F0F0F] lg:flex">
              {/* Left — fee + description */}
              <div className="flex flex-col border-b border-[#2A2A2A] p-6 sm:p-8 lg:w-[52%] lg:border-b-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                  Programme Fee
                </p>
                <div className="flex flex-1 flex-col justify-center">
                  <p className="mt-2 text-[clamp(1.9rem,3.8vw,3rem)] font-bold leading-none text-white">
                    {priceText ? `₹${priceText}` : "Fee announced soon"}
                  </p>
                  <p className="mt-3 text-[13px] leading-[1.6] text-[#888]">
                    Covers the complete {heroDuration ? heroDuration.toLowerCase() + " " : ""}programme journey, including all Legend-led engagements, and access to the LoM learning ecosystem.
                  </p>
                </div>
              </div>

              {/* Inset vertical divider — hidden on mobile, doesn't touch card top/bottom */}
              <div className="hidden lg:block w-px self-stretch my-8 bg-[#2A2A2A]" />
              {/* Right — stats grid + buttons */}
              <div className="flex flex-col justify-between p-5 sm:p-7 lg:w-[48%]">
                <div className="grid grid-cols-2">
                  <div className="py-5 pr-8">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#666]">Duration</p>
                    <p className="mt-1.5 text-[14px] font-medium text-white">{heroDuration || COMING_SOON}</p>
                    <div className="mt-4 h-px bg-[#2A2A2A]" />
                  </div>
                  <div className="py-5 pl-8">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#666]">Format</p>
                    <p className="mt-1.5 text-[14px] font-medium text-white">{p.format ?? "Hybrid · Live virtual & in-person"}</p>
                    <div className="mt-4 h-px bg-[#2A2A2A]" />
                  </div>
                  <div className="py-5 pr-8">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#666]">Cohort</p>
                    <p className="mt-1.5 text-[14px] font-medium text-white">
                      {p.cohortSize ? `${p.cohortSize} doctors` : COMING_SOON}
                    </p>
                    <div className="mt-4 h-px bg-[#2A2A2A]" />
                  </div>
                  <div className="py-5 pl-8">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#666]">Admission</p>
                    <p className="mt-1.5 text-[14px] font-medium text-white">{p.admissionText ?? "Following a Dialogue with the Legend"}</p>
                    <div className="mt-4 h-px bg-[#2A2A2A]" />
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <CourseApplyButton
                    courseId={p.id}
                    courseSlug={p.slug}
                    courseName={plainName(p.name)}
                    mentorName={faculty?.name}
                    brochureUrl={p.brochureUrl}
                    label="Begin your application"
                    variant="accent"
                    block
                  />
                  <Link
                    href="/contact"
                    className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-[12px] border border-[#3A3A3A] bg-transparent px-6 text-sm font-semibold text-white transition hover:border-white/40"
                  >
                    Speak to Concierge
                  </Link>
                </div>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-[#555]">
              Any Dialogue fee already paid will be adjusted in full against the programme fee upon joining the cohort.
            </p>
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            § 7 — SUPPORTING DETAIL   FAQs · Certificate · other Legends
        ══════════════════════════════════════════════════════════════ */}
        <section aria-labelledby="course-faq-title" className={SECTION}>
          <h2 id="course-faq-title" className={`text-center ${HEADING}`}>
            Frequently asked questions
          </h2>
          {faqItems.length > 0 ? (
            <div className="mt-10 sm:mt-16">
              <FaqGrid key={p.slug} items={faqItems} label={plainName(p.name)} />
            </div>
          ) : (
            <p className="mx-auto mt-6 max-w-[560px] text-center text-[15px] leading-[1.7] text-[#A5A5A5]">
              Questions about this programme are coming soon. Until then,{" "}
              <Link href="/contact" className="text-white underline-offset-4 hover:underline">
                speak to our concierge
              </Link>
              .
            </p>
          )}
        </section>

        <div className={`${SHELL} pb-24`}>
          <Link
            href="/programmes"
            className="inline-flex items-center gap-2 text-sm text-[#A5A5A5] transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all courses
          </Link>
        </div>
      </main>
      <Footer />
      <CourseStickyFooter
        courseId={p.id}
        courseName={plainName(p.name)}
        courseSlug={p.slug}
        facultyTitle={p.specialistTitle || faculty?.title}
        facultyName={faculty?.name}
        // Fallback chain: explicit faculty image → the course row's own
        // doctorImage/imageUrl → the hero image. Covers merged-module rows
        // where doctor-side `slug`/`name` were left blank so attachFaculty()
        // couldn't link a faculty record, but the row's portrait was still
        // uploaded against the course-side `imageUrl`/`doctorImage` field.
        facultyImageUrl={faculty?.imageUrl || p.doctorImage || p.heroImage}
        brochureUrl={p.brochureUrl}
      />
    </>
  );
}
