export type Specialty =
  | "all"
  | "cornea-ocular-surface"
  | "phaco-refractive-surgery"
  | "retina-vitreo-retinal-surgery"
  | "glaucoma"
  | "pediatric-ophthalmology"
  | "oculoplasty"
  | "ophthalmology-practice-mastery";

export interface Doctor {
  id: string;
  slug: string;
  name: string;
  title: string;
  specialty: Specialty[];
  city: string;
  experienceYears: number;
  imageUrl: string;
  bio: string;
  // Optional extras populated when sourced from the merged nocode `doctors` module
  heroImages?: string[];
  showInHeroSection?: boolean;
  /* Where the face sits in this portrait, as a percentage down the photo, and
     how much to enlarge it. Both exist only so the hero band can line every
     head up on one eye-line: the photos are framed differently, and nothing in
     CSS can find a face. Unset means the old behaviour - crop from the top,
     no zoom. */
  heroFocusY?: number;
  heroZoom?: number;
  trailerVideoUrl?: string;
  /* Profile page hero, all optional. The portrait shown there, the two-part
     subtitle ("A Legend in" + the highlighted words), the intro paragraph,
     and the three boxes of the strip under it. */
  profileImage?: string;
  profileTagline?: string;
  profileTaglineHighlight?: string;
  profileHighlight1?: string;
  profileHighlight2Title?: string;
  profileHighlight2Text?: string;
  profileHighlight3Title?: string;
  profileHighlight3Text?: string;
  /** "The Master at Work" films, in admin order. Empty slots are dropped. */
  films?: { title: string; image?: string; video?: string }[];
  /* "Making of the Legend": column 1, a quote heading column 2, then column 3
     with a highlight box between its two parts. Paragraphs are separated by
     a blank line. */
  storyColumn1?: string;
  storyQuote?: string;
  storyColumn2?: string;
  storyColumn3?: string;
  storyHighlight?: string;
  storyColumn3After?: string;
  /** "From the Legend, directly.": the intro paragraph, and the programme card's image and hover video. */
  programmeIntro?: string;
  programmeImage?: string;
  programmeVideo?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  // Course-side fields (1:1 doctor↔course in the merged module)
  qualification?: string;
  email?: string;
  phone?: string;
  courseName?: string;
  courseSlug?: string;
  specialistTitle?: string;
  doctorImage?: string;
  description?: string;
  lessonsCount?: number;
  durationMinutes?: number;
  durationWeeks?: number;
  cohortSize?: number;
  startDate?: string;
  priceInr?: number;
  pricePerDayInr?: number;
  billingPeriod?: "annual" | "monthly" | "onetime";
  moneyBackDays?: number;
  highlights?: string[];
  learningOutcomes?: string[];
  brochureUrl?: string;
  relatedDoctorSlugs?: string[];
  isActive?: boolean;
}

export interface CourseFormatPhase {
  phase: string;
  description: string;
}

/**
 * One roadmap module. `outcomes` backs the "By the end of this module, you'll
 * be able to" checklist that the expanded accordion row reveals; a module with
 * none simply renders its description and nothing else.
 */
export interface CourseModule {
  title: string;
  /** Secondary line shown under the title in the sidebar */
  subtitle?: string;
  description: string;
  /** Badge shown in the top-right of the detail panel, e.g. "Opening encounter · In person" */
  phase?: string;
  /** Dot-legend category */
  type?: "legend-edge" | "technical-core";
  /** Four quadrant card content */
  judgement?: string;
  insideTheWork?: string;
  appliedInPractice?: string;
  whatChanges?: string;
  outcomes: string[];
}

export interface CourseFaq {
  question: string;
  answer: string;
}

/** Compact doctor projection embedded into a Program as `faculty`. */
export interface Faculty {
  slug: string;
  name: string;
  title: string;
  /**
   * The Legend's login address. Not shown to anyone - it is the join between
   * three otherwise unrelated things: this doctor record, their account in the
   * console, and the Google Calendar they connected. Booking looks them up by
   * it, so a blank one means no slots.
   */
  email?: string;
  city?: string;
  imageUrl?: string;
  qualification?: string;
  bio?: string;
  experienceYears?: number;
}

export interface Program {
  id: string;
  slug: string;
  name: string;
  specialty: Specialty;
  /** Every specialty the course is filed under (multi-select). `specialty` is the first. */
  specialties?: Specialty[];
  description: string;
  durationWeeks: number;
  cohortSize: number;
  startDate: string; // ISO
  priceInr: number;
  highlights: string[];
  // Detail page presentation
  headline?: string;
  tagline?: string;
  heroImage?: string;
  cardImage?: string;
  doctorImage?: string;
  specialistTitle?: string;
  city?: string;
  experienceYears?: number;
  bio?: string;
  lessonsCount?: number;
  durationMinutes?: number;
  durationMonths?: number;
  launchMonth?: string;
  launchYear?: number;
  trailerVideoUrl?: string;
  filmThumbnailUrl?: string;
  pricePerDayInr?: number;
  billingPeriod?: "annual" | "monthly" | "onetime";
  moneyBackDays?: number;
  relatedDoctorSlugs?: string[];
  // Rich content sections
  eligibility?: string;
  whatYouWillLearn?: string[];
  curriculumHighlights?: string[];
  courseFormat?: CourseFormatPhase[];
  modules?: CourseModule[];
  faqs?: CourseFaq[];
  format?: string;
  admissionText?: string;
  certificateNote?: string;
  sampleCertificateImage?: string;
  // CTA / flags
  ctaLabel?: string;
  brochureUrl?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  // Faculty resolved from `doctorSlug` reference
  doctorSlug?: string;
  faculty?: Faculty;
  // Doctor/mentor name carried on the course row itself. Used as a fallback for
  // the hero credit line ("with Dr. …") in merged-module rows where the linked
  // doctor record can't be resolved (doctor-side slug/name left blank).
  mentorName?: string;
  /** The Legend's login address, for booking. See Faculty.email. */
  mentorEmail?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

export interface LeadPayload {
  fullName: string;
  email: string;
  phone?: string;
  qualification: "MBBS" | "MS" | "MD" | "DNB" | "FELLOW" | "OTHER";
  yearOfCompletion?: number;
  interestedIn?: Specialty;
  message?: string;
  source?: string;
}
