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
    title: p.headline ? `${p.name} — ${p.headline}` : p.name,
    description: p.tagline || p.description,
    alternates: { canonical: `/programs/${p.slug}` },
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

function formatLaunch(p: { launchMonth?: string; launchYear?: number; startDate?: string }) {
  if (p.launchMonth && p.launchYear) return `${p.launchMonth} ${p.launchYear}`;
  if (p.launchMonth) return `${p.launchMonth}`;
  if (p.startDate) {
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
    name: p.name,
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
          url: `${SITE_URL}/programs/${p.slug}`,
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
        <section aria-labelledby="program-title" className="relative overflow-hidden bg-black">
          {/* Mobile: image as full-bleed backdrop with bottom scrim */}
          {heroImage && (
            <div className="absolute inset-0 lg:hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroImage} alt="" className="h-full w-full object-cover" aria-hidden />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40" />
            </div>
          )}

          {/* Desktop: two-column grid — image left, content right */}
          <div className="lg:grid lg:grid-cols-[52%_48%] lg:gap-2 lg:h-[calc(100vh-80px)] lg:max-h-[740px]">
            {/* Image column — desktop only, hover zoom */}
            <div className="hidden lg:flex lg:items-center lg:justify-center relative overflow-hidden group bg-black">
              {heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage}
                  alt={legendName}
                  className="h-full w-full object-contain transition-transform duration-700 ease-in-out group-hover:scale-[1.03]"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-accent/15 via-ink-900 to-black" />
              )}
              {/* Subtle right edge blend into content column */}
              <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-[15%] bg-gradient-to-r from-transparent to-black" />
              {/* Subtle bottom fade */}
              <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
            </div>

            {/* Content column */}
            <div className="relative flex min-h-[calc(100vh-80px)] items-center justify-center px-5 pb-16 pt-32 sm:px-10 lg:min-h-0 lg:items-center lg:justify-start lg:py-10 lg:px-10">
              <div className="w-full max-w-none lg:max-w-[520px] text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                {p.specialty ? `PROGRAMME / ${specialtyLabel(p.specialty)}` : "LEGACY TRANSFER PROGRAMME"}
              </p>
              <h1
                id="program-title"
                className="mt-3 font-serif text-[clamp(1.9rem,3.2vw,2.75rem)] font-normal leading-[1.1] text-white"
              >
                {p.headline || p.name}
              </h1>

              {faculty?.name ? (
                <Link
                  href={`/doctors/${faculty.slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-sm text-[#A5A5A5] transition hover:text-white"
                >
                  with{" "}
                  <span className="font-semibold text-white">
                    Dr. {faculty.name.replace(/^Dr\.?\s+/i, "")}
                  </span>
                  <span className="text-[10px] text-accent" aria-hidden>↗</span>
                </Link>
              ) : mentorName ? (
                <p className="mt-4 text-sm text-[#A5A5A5]">
                  with{" "}
                  <span className="font-semibold text-white">
                    Dr. {mentorName.replace(/^Dr\.?\s+/i, "")}
                  </span>
                </p>
              ) : null}

              {p.tagline && (
                <p className="mt-4 text-[14px] leading-[1.65] text-[#A5A5A5]">{p.tagline}</p>
              )}

              {p.trailerVideoUrl && (
                <a
                  href="#legend-video"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white no-underline transition hover:opacity-80"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/30">
                    <svg className="h-2.5 w-2.5 translate-x-[1px]" viewBox="0 0 8 10" fill="currentColor" aria-hidden>
                      <path d="M0 0l8 5-8 5V0z" />
                    </svg>
                  </span>
                  Watch Programme Film
                </a>
              )}

              {/* Stat strip — duration · cohort · launch */}
              {(heroDuration || p.cohortSize || launchLabel) && (
                <div className="mt-5 flex items-stretch justify-between border-b border-t border-white/10 py-4 text-left">
                  {[
                    heroDuration && { value: heroDuration, label: "Duration" },
                    p.cohortSize
                      ? {
                          value: String(p.cohortSize).padStart(2, "0"),
                          label: "Cohort Size",
                        }
                      : null,
                    launchLabel && { value: launchLabel, label: "Starting From" },
                  ]
                    .filter(Boolean)
                    .map((stat) => {
                      const s = stat as { value: string; label: string };
                      return (
                        <div key={s.label} className="flex-1 border-r border-white/15 px-3 last:border-r-0 first:pl-0 last:pr-0">
                          <p className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.1em] text-[#A5A5A5]">
                            {s.label}
                          </p>
                          <p className="mt-1 whitespace-nowrap text-[1rem] font-bold text-white sm:text-[1.05rem]">
                            {s.value}
                          </p>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Enrollment card */}
              <div className="mt-4 w-full rounded-[14px] border border-[#3A3A3A] bg-[#161616] px-5 py-4">
                <div>
                  <CourseApplyButton
                    courseId={p.id}
                    courseSlug={p.slug}
                    courseName={p.name}
                    mentorName={faculty?.name}
                    brochureUrl={p.brochureUrl}
                    label={enrollLabel}
                    variant="accent"
                    block
                  />
                </div>
                <p className="mt-3 text-[12px] leading-[1.5] text-[#717171]">
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
            <div className="mt-5 sm:mt-7 mx-auto max-w-[85%]">
              <LegendTrailer
                src={p.trailerVideoUrl}
                poster={p.filmThumbnailUrl || heroImage}
                name={legendName}
              />
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
            courseName={p.name}
            courseSlug={p.slug}
            defaultSpecialty={p.specialty}
          />
        </div>

        {/* § 5 — THE ROADMAP */}
        <CourseRoadmap
          items={roadmapItems}
          subtitle={
            p.eligibility ||
            "A structured journey from foundational knowledge to surgical confidence."
          }
        />

        {/* § 6 — YOUR PATH INTO THE PROGRAMME */}
        <HowItWorks heading="Your Path into the Programme" align="left" />

        {/* ══════════════════════════════════════════════════════════════
            § 7 — INVESTMENT
        ══════════════════════════════════════════════════════════════ */}
        {priceText && (
          <section aria-labelledby="investment-title" className={SECTION}>
            <div className="rounded-[16px] border border-[#2A2A2A] bg-[#0F0F0F] lg:flex">
              {/* Left — fee + description */}
              <div className="flex flex-col border-b border-[#2A2A2A] p-6 sm:p-8 lg:w-[52%] lg:border-b-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent">
                  Programme Fee
                </p>
                <div className="flex flex-1 flex-col justify-center">
                  <p className="mt-2 text-[clamp(1.9rem,3.8vw,3rem)] font-bold leading-none text-white">
                    ₹{priceText}
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
                  {heroDuration && (
                    <div className="py-5 pr-8">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#666]">Duration</p>
                      <p className="mt-1.5 text-[14px] font-medium text-white">{heroDuration}</p>
                      <div className="mt-4 h-px bg-[#2A2A2A]" />
                    </div>
                  )}
                  <div className="py-5 pl-8">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#666]">Format</p>
                    <p className="mt-1.5 text-[14px] font-medium text-white">{p.format ?? "Hybrid · Live virtual & in-person"}</p>
                    <div className="mt-4 h-px bg-[#2A2A2A]" />
                  </div>
                  {p.cohortSize && (
                    <div className="py-5 pr-8">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#666]">Cohort</p>
                      <p className="mt-1.5 text-[14px] font-medium text-white">{p.cohortSize} doctors</p>
                      <div className="mt-4 h-px bg-[#2A2A2A]" />
                    </div>
                  )}
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
                    courseName={p.name}
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
        {faqItems.length > 0 && (
          <section aria-labelledby="course-faq-title" className={SECTION}>
            <h2 id="course-faq-title" className={`text-center ${HEADING}`}>
              Frequently asked questions
            </h2>
            <div className="mt-10 sm:mt-16">
              <FaqGrid key={p.slug} items={faqItems} label={p.name} />
            </div>
          </section>
        )}

        {/* The plate is ours and it is drawn live, so it carries the reader's
            own name and this programme's mentor. It replaces the flat
            `sampleCertificateImage` the course row used to supply: one picture
            for everybody, soft wherever it was scaled, and made out to nobody.
            The column it sits in is the wider of the two because the name has
            to be legible - the frame is under a third of the photograph's
            width, so a 280px thumbnail printed it at about eight pixels tall. */}
        <section aria-labelledby="cert-title" className={SHELL + " py-16 sm:py-24"}>
          {/* Beige recognition card */}
          <div className="rounded-[20px] bg-[#DED0BB] py-12 sm:py-14 lg:flex lg:items-center lg:gap-0 lg:pl-16 lg:pr-12">
            {/* Left — text */}
            <div className="px-8 sm:px-0 lg:w-[42%]">
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
            {/* Right — dark certificate card (flat card design, floating) */}
            <div className="mt-10 flex justify-center px-8 sm:px-0 lg:mt-0 lg:w-[58%] lg:justify-end">
              {/* cert-float applies the continuous floating animation — straight, no rotation */}
              <div
                className="cert-float relative w-[340px] sm:w-[500px]"
                style={{ filter: "none" }}
              >
                {/* Second card behind (stacked depth) */}
                <div
                  className="absolute inset-0 rounded-[16px] bg-black"
                  style={{ transform: "translate(14px, 14px)", opacity: 1 }}
                />
                {/* Main dark card */}
                <div
                  className="relative rounded-[16px] bg-[#1A1716] px-10 py-10 text-center"
                  style={{ border: "1.5px solid #FF6B2B" }}
                >
                  {/* Inner border inset */}
                  <div
                    className="pointer-events-none absolute inset-[10px] rounded-[10px]"
                    style={{ border: "1px solid #FF6B2B", opacity: 0.4 }}
                  />
                  {/* LOM mark — two vertical bars */}
                  <div className="mb-5 flex justify-center gap-[7px]">
                    <div className="h-[24px] w-[3.5px] rounded-full bg-[#C97B50]" />
                    <div className="h-[24px] w-[3.5px] rounded-full bg-[#C97B50]" />
                  </div>
                  {/* "LEGENDS OF MEDICINE" */}
                  <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#C97B50]">
                    Legends of Medicine
                  </p>
                  {/* Recipient name — white, bold */}
                  <p className="mt-6 text-[1.05rem] font-bold uppercase tracking-[0.08em] text-white sm:text-[1.25rem]">
                    {recipientName}
                  </p>
                  {/* Programme name — light white */}
                  <p className="mt-2 text-[11px] leading-[1.6] text-white/60">{p.name}</p>
                  <p className="mt-0.5 text-[10px] text-white/40">Guided by {signatory.name}</p>
                  {/* Signature in script — copper */}
                  <p
                    className="mt-6 text-[1.35rem] leading-none text-[#C97B50]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic" }}
                  >
                    {signatory.name}
                  </p>
                  {/* Cohort year */}
                  {(p.launchYear || p.startDate) && (
                    <p className="mt-4 text-[8px] font-semibold uppercase tracking-[0.26em] text-white/30">
                      Cohort {p.launchYear ?? new Date(p.startDate).getFullYear()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section aria-labelledby="related-title" className={SECTION}>
            <h2 id="related-title" className={HEADING}>
              From Here, Go Anywhere
            </h2>
            <p className="mt-3 text-[15px] text-[#A5A5A5]">
              Included with a membership. And {related.length}+ more
            </p>
            <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
              {related.map((d) => (
                <li key={d.id}>
                  <Link
                    href={`/doctors/${d.slug}`}
                    className="group block overflow-hidden rounded-[12px] border border-[#4A4A4A] bg-ink-800 transition hover:border-white/25"
                  >
                    <div className="aspect-[3/4] w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={d.imageUrl}
                        alt={d.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                    <div className="p-4">
                      <p className="text-sm font-semibold text-white">{d.name}</p>
                      <p className="mt-0.5 text-xs text-[#A5A5A5]">{d.title}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className={`${SHELL} pb-24`}>
          <Link
            href="/programs"
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
        courseName={p.name}
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
