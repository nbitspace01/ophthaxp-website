"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TrailerPlayer } from "@/components/TrailerPlayer";
import { ImageBackdrop } from "@/components/ImageBackdrop";
import { useShowWhole } from "@/components/SmartFitImage";
import type { Doctor, Program } from "@/types";
import "./legend-profile.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const SPECIALTY_LABELS: Record<string, string> = {
  "cornea-ocular-surface": "Cornea & Ocular Surface",
  "phaco-refractive-surgery": "Phaco & Refractive Surgery",
  "retina-vitreo-retinal-surgery": "Vitreo-Retinal Surgery",
  glaucoma: "Glaucoma",
  "pediatric-ophthalmology": "Paediatric Ophthalmology",
  oculoplasty: "Oculoplasty",
  "ophthalmology-practice-mastery": "Practice Mastery",
};

/* The breadcrumb uses the same names as the specialty filter buttons on the
   Legends page, so the word matches the filter it links back to. */
const CRUMB_LABELS: Record<string, string> = {
  "cornea-ocular-surface": "Cornea",
  "phaco-refractive-surgery": "Refractive Surgery",
  "retina-vitreo-retinal-surgery": "Retina",
  glaucoma: "Glaucoma",
  "pediatric-ophthalmology": "Paediatric",
  oculoplasty: "Oculoplasty",
  "ophthalmology-practice-mastery": "Practice Management",
};

/** The short word the breadcrumb uses, e.g. "Cornea" from "Cornea & Ocular Surface". */
function shortSpecialty(label: string): string {
  return label.split(/\s*[&/]\s*|\s+-\s+/)[0];
}

/**
 * The biography as paragraphs, dealt into the three newspaper columns of the
 * "Making of the Legend" spread in reading order. A biography stored as one
 * long block is split at sentence ends so the columns still fill evenly.
 */
function editorialColumns(text: string): string[][] {
  let paragraphs = text
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  // Too little to spread across three columns.
  if (paragraphs.length < 3 && text.length < 700) return [paragraphs];
  if (paragraphs.length < 3) {
    const sentences = text.match(/[^.!?]+[.!?]+["”’]?\s*|[^.!?]+$/g) ?? [text];
    const per = Math.max(1, Math.ceil(sentences.length / 6));
    paragraphs = [];
    for (let i = 0; i < sentences.length; i += per) {
      paragraphs.push(sentences.slice(i, i + per).join("").trim());
    }
  }
  const columns: string[][] = [[], [], []];
  const per = Math.ceil(paragraphs.length / 3);
  paragraphs.forEach((p, i) => columns[Math.min(2, Math.floor(i / per))].push(p));
  return columns.filter((c) => c.length > 0);
}

/** Paragraphs of a story field: split on blank lines, or on single lines. */
function paragraphsOf(text?: string): string[] {
  return (text || "")
    .split(/\n\s*\n|\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DoctorDetailClient({
  doctor,
  programs = [],
  fromSpecialty,
  supportEmail,
}: {
  doctor: Doctor;
  /** Where "Register your interest" writes to when the Legend has no course yet. */
  supportEmail?: string;
  /** Still passed by the page; the "More Legends" rail that used it is gone. */
  otherDoctors?: Doctor[];
  programs?: Program[];
  /** The specialty filter the reader clicked through from on the Legends page. */
  fromSpecialty?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLDivElement>(null);
  const filmVideoRef = useRef<HTMLVideoElement>(null);
  const programmeVideoRef = useRef<HTMLVideoElement>(null);
  const programmeCardRef = useRef<HTMLButtonElement>(null);
  // The programme card plays its video in place, like the featured video on
  // the home page: click to play, × or Esc to close.
  const [programmePlaying, setProgrammePlaying] = useState(false);
  const closeProgrammeVideo = useCallback(() => {
    programmeVideoRef.current?.pause();
    setProgrammePlaying(false);
    programmeCardRef.current?.focus();
  }, []);
  // Esc handling copied from the home page's featured video (LegendsVideo):
  // in fullscreen, Esc only leaves fullscreen; the next Esc closes the video.
  useEffect(() => {
    if (!programmePlaying) return;
    const isFullscreen = () =>
      Boolean(
        document.fullscreenElement ||
          (document as Document & { webkitFullscreenElement?: Element | null })
            .webkitFullscreenElement ||
          (programmeVideoRef.current as (HTMLVideoElement & { webkitDisplayingFullscreen?: boolean }) | null)
            ?.webkitDisplayingFullscreen,
      );

    // downSeen: the current Esc press was seen going down, so its keyup is
    // already accounted for. ignoreNextKeyUp: fullscreen was just left, so a
    // keyup from the Esc that left it must not close the video; it expires
    // after a moment so it can never swallow the second Esc.
    let downSeen = false;
    let ignoreNextKeyUp = false;
    let ignoreTimer: ReturnType<typeof setTimeout> | undefined;

    const onFullscreenChange = () => {
      if (isFullscreen()) return;
      ignoreNextKeyUp = true;
      if (ignoreTimer) clearTimeout(ignoreTimer);
      ignoreTimer = setTimeout(() => {
        ignoreNextKeyUp = false;
        // Take focus off the native video controls so the next Esc reaches us.
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      }, 300);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.repeat) return;
      downSeen = true;
      ignoreNextKeyUp = false;
      if (isFullscreen()) {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      closeProgrammeVideo();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (downSeen) {
        downSeen = false;
        return;
      }
      // Keyup with no keydown seen: the browser swallowed the keydown.
      if (ignoreNextKeyUp) {
        ignoreNextKeyUp = false;
        return;
      }
      if (isFullscreen()) return;
      closeProgrammeVideo();
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    programmeVideoRef.current?.play().catch(() => {});
    return () => {
      if (ignoreTimer) clearTimeout(ignoreTimer);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, [programmePlaying, closeProgrammeVideo]);

  // The selected film plays in place, in the stage, rather than in a popup.
  const [filmPlaying, setFilmPlaying] = useState(false);
  // The selected film (cards and dots move at once) and the one on stage,
  // which follows after the poster has faded out.
  const startFilm = doctor.films && doctor.films.length === 3 ? 1 : 0;
  const [activeFilm, setActiveFilm] = useState(startFilm);
  const [shownFilm, setShownFilm] = useState(startFilm);
  const [filmChanging, setFilmChanging] = useState(false);
  const filmTimer = useRef<number>();
  useEffect(() => () => window.clearTimeout(filmTimer.current), []);
  const selectFilm = (index: number) => {
    if (index === activeFilm) return;
    setFilmPlaying(false);
    setActiveFilm(index);
    window.clearTimeout(filmTimer.current);
    setFilmChanging(true);
    filmTimer.current = window.setTimeout(() => {
      setShownFilm(index);
      setFilmChanging(false);
    }, 320);
  };


  // Sections fade up as they reach the viewport, once.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    root.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // The portrait leans a few pixels toward the pointer and drifts with scroll.
  useEffect(() => {
    const portrait = portraitRef.current;
    if (!portrait || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (event: PointerEvent) => {
      const bounds = portrait.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 4;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 3;
      portrait.style.setProperty("--portrait-x", `${x}px`);
      portrait.style.setProperty("--portrait-y", `${y}px`);
    };
    const onLeave = () => {
      portrait.style.setProperty("--portrait-x", "0px");
      portrait.style.setProperty("--portrait-y", "0px");
    };
    const onScroll = () => {
      const hero = portrait.closest(".legend-hero") as HTMLElement | null;
      if (!hero) return;
      const progress = Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / hero.offsetHeight));
      portrait.style.setProperty("--portrait-scroll-y", `${progress * 18}px`);
    };

    portrait.addEventListener("pointermove", onMove);
    portrait.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      portrait.removeEventListener("pointermove", onMove);
      portrait.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Clicking the stage plays its film right there; closing unmounts the player,
  // which stops playback. Esc closes it too, except in fullscreen, where Esc
  // only leaves fullscreen.
  const openFilm = () => setFilmPlaying(true);
  const closeFilm = useCallback(() => setFilmPlaying(false), []);
  useEffect(() => {
    if (!filmPlaying) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.fullscreenElement) return;
      closeFilm();
    };
    window.addEventListener("keydown", onKey);
    filmVideoRef.current?.play().catch(() => {});
    return () => window.removeEventListener("keydown", onKey);
  }, [filmPlaying, closeFilm]);

  // ─── Computed values ──────────────────────────────────────────────────────

  const portrait = doctor.profileImage || doctor.doctorImage || doctor.imageUrl;
  // Same rule as the programme hero: a photo shaped like the hero fills it
  // (anchored to the top); one of a very different shape (square, tall) is
  // shown whole over a blurred copy of itself instead of a zoomed-in crop.
  const portraitWhole = useShowWhole(portrait, portraitRef);

  // "The Master at Work": the Legend's films from the admin, or, with none
  // set, one film built from the intro video and their portrait.
  // "The Master at Work" shows the Legend's Film 1–3. A Legend with none still
  // gets the section: one "Coming soon" stage built from their portrait, until
  // films are added in the admin.
  const films = useMemo(() => {
    const own = (doctor.films ?? []).map((film, i) => ({
      title: film.title || `Film ${i + 1}`,
      image: film.image || portrait,
      video: film.video,
      isPortrait: !film.image,
    }));
    return own.length > 0
      ? own
      : [{ title: "Coming Soon", image: portrait, video: undefined as string | undefined, isPortrait: true }];
  }, [doctor.films, portrait]);
  const hasFilms = films.length > 0;
  const stage = films[Math.min(shownFilm, films.length - 1)] ?? {
    title: "",
    image: undefined as string | undefined,
    video: undefined as string | undefined,
    isPortrait: true,
  };
  const fullBio = (doctor.description || doctor.bio || "").trim();
  const ownIntro = (doctor.bio || doctor.description || "").trim();
  const columns = useMemo(() => editorialColumns(fullBio), [fullBio]);
  // The story columns from the admin. With none set, the biography is laid out
  // across the columns instead, as before.
  const hasStory = Boolean(
    doctor.storyColumn1 || doctor.storyQuote || doctor.storyColumn2 ||
      doctor.storyColumn3 || doctor.storyHighlight || doctor.storyColumn3After,
  );
  // "Making of the Legend" is always shown. With neither story columns nor a
  // biography, it holds one "being written" line until the admin fills them.
  const storyComingSoon = !hasStory && !fullBio;
  const showStory = true;

  const specialtyLabels = doctor.specialty
    .filter((s) => s !== "all")
    .map((s) => SPECIALTY_LABELS[s] ?? s);
  const mainSpecialty = specialtyLabels[0];

  // The hero intro is the Short Bio. With none set, a short "coming soon" line
  // keeps the hero from looking empty until the admin writes one.
  const intro =
    ownIntro ||
    `${doctor.name} is a Legend of Medicine${mainSpecialty ? ` in ${mainSpecialty}` : ""}. The full profile is coming soon.`;

  // The breadcrumb names the specialty the reader filtered by on the Legends
  // page, when this Legend has it; otherwise their first specialty.
  const crumbKey =
    fromSpecialty && doctor.specialty.includes(fromSpecialty as Doctor["specialty"][number])
      ? fromSpecialty
      : doctor.specialty.find((s) => s !== "all");
  const crumbLabel = crumbKey ? SPECIALTY_LABELS[crumbKey] ?? crumbKey : undefined;

  // The strip under the hero. The admin can write each box; an empty one
  // falls back to specialty, experience and title, then city and qualification.
  // A box with nothing at all to show gets a neutral placeholder, so the strip
  // always has its three boxes instead of a gap.
  const highlight1 =
    doctor.profileHighlight1 || specialtyLabels.slice(0, 2).join(" · ") || "Ophthalmology";
  let highlight2Title =
    doctor.profileHighlight2Title ||
    (doctor.experienceYears > 0 ? `${doctor.experienceYears}+ years` : doctor.qualification || "");
  let highlight2Text = doctor.profileHighlight2Text || doctor.title;
  if (!highlight2Title && !highlight2Text) {
    highlight2Title = "Mentor";
    highlight2Text = "Profile details coming soon";
  }
  let highlight3Title = doctor.profileHighlight3Title || doctor.city || "";
  let highlight3Text =
    doctor.profileHighlight3Text || (doctor.city ? doctor.qualification || "India" : doctor.qualification || "");
  if (!highlight3Title && !highlight3Text) {
    highlight3Title = "Legends of Medicine";
    highlight3Text = "Faculty";
  }

  // A Legend can be linked to the same course more than once; show it once.
  const ownPrograms = programs.filter(
    (p, i) => programs.findIndex((q) => q.slug === p.slug) === i,
  );
  const leadProgram = ownPrograms[0];
  const programHref = leadProgram
    ? `/programmes/${leadProgram.slug}`
    : doctor.courseSlug
      ? `/programmes/${doctor.courseSlug}`
      : null;

  // A Legend with no course yet still gets § 4, as a "Coming Soon" card: the
  // card reads "Programme | Coming Soon", and the call to action asks the
  // visitor to register their interest by email instead of exploring a course.
  // Linking a course to the Legend turns it into the normal card by itself.
  const comingSoon = !programHref;
  const interestHref = supportEmail
    ? `mailto:${supportEmail}?subject=${encodeURIComponent(
        `Interest: Programme with ${doctor.name}`,
      )}&body=${encodeURIComponent(
        `Hello,\n\nI would like to know when the programme with ${doctor.name} opens.\n\nName:\nCity:\nPhone:\n`,
      )}`
    : "/contact";

  // Programme card and film poster: a rectangular picture close to its frame's
  // shape fills the frame; one of a very different shape is shown whole over a
  // blurred copy of itself (same rule as the hero, see useShowWhole).
  const cardImage = doctor.programmeImage || leadProgram?.cardImage || leadProgram?.heroImage || portrait;
  const cardImgRef = useRef<HTMLImageElement>(null);
  // Card, 0.6: any ordinary rectangle (3:2, 16:9) fills it; only a square or
  // tall picture is shown whole.
  const cardWhole = useShowWhole(cardImage, cardImgRef, 0.6);
  const posterImgRef = useRef<HTMLImageElement>(null);
  // Film stage, 0.7: it is very wide, so only a wide film poster (16:9) fills
  // it; a 3:2 headshot filled would lose the head, so it is shown whole.
  const posterWhole = useShowWhole(stage.image, posterImgRef, 0.7);

  const courseName = comingSoon ? "Programme | Coming Soon" : leadProgram?.name || doctor.courseName || "";
  const plainCourseName = courseName.replace(/s*|s*/g, " ");
  const cardInner = (
    <>
      {comingSoon ? (
        <span className="new-pill">Coming Soon</span>
      ) : (
        leadProgram?.isNew && <span className="new-pill">New</span>
      )}
      {cardWhole && <ImageBackdrop src={cardImage} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={cardImgRef} className={cardWhole ? "is-whole" : "is-fill"} src={cardImage} alt={doctor.name} />
      <span className="programme-shade" />
      <span className="programme-card-copy">
        <h3>
          {courseName.split("|").map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line.trim()}
            </span>
          ))}
        </h3>
        <i aria-hidden="true" />
        <p>
          with <strong>{doctor.name}</strong>
        </p>
      </span>
    </>
  );

  return (
      <>
      <Navbar />
      <div ref={rootRef} className="lom-legend">
      <main className="pb-20 text-white">

        {/* § 1 — HERO   Copy column beside the portrait */}
        <section className="legend-hero" aria-labelledby="legend-name">
          <div className="hero-copy reveal">
            <p className="eyebrow">
              <Link href="/legends">Legends</Link>
              {crumbKey && crumbLabel && (
                <>
                  <span>/</span>
                  <Link href={`/legends?specialty=${crumbKey}`}>{CRUMB_LABELS[crumbKey] ?? shortSpecialty(crumbLabel)}</Link>
                </>
              )}
            </p>
            <div className="hero-narrative">
              <h1 id="legend-name">{doctor.name}</h1>
              <p className="hero-subtitle">
                {doctor.profileTagline || doctor.profileTaglineHighlight ? (
                  <>
                    {doctor.profileTagline}{" "}
                    {doctor.profileTaglineHighlight && <em>{doctor.profileTaglineHighlight}</em>}
                  </>
                ) : doctor.specialistTitle ? (
                  doctor.specialistTitle
                ) : mainSpecialty ? (
                  <>
                    A Legend in <em>{mainSpecialty}.</em>
                  </>
                ) : (
                  doctor.title
                )}
              </p>
              {intro && <p className="legend-intro">{intro}</p>}
              <div className="hero-cta-row">
                {/* Always shown: the "Making of the Legend" section below is
                    always rendered (the story, the bio, or a "being written"
                    note), so the link always has somewhere to go. */}
                <a className="story-link" href="#making">
                  The Legend’s Story <span>↓</span>
                </a>
                {(
                  <a className="hero-primary-cta" href="#programmes">
                    Learn from the Legend <span>→</span>
                  </a>
                )}
              </div>
            </div>
            <div className="authority-strip" aria-label={`About ${doctor.name}`}>
              {highlight1 && (
                <article>
                  <p>{highlight1}</p>
                </article>
              )}
              {(highlight2Title || highlight2Text) && (
                <article>
                  {highlight2Title && <strong>{highlight2Title}</strong>}
                  {highlight2Text && <p>{highlight2Text}</p>}
                </article>
              )}
              {(highlight3Title || highlight3Text) && (
                <article>
                  {highlight3Title && <strong>{highlight3Title}</strong>}
                  {highlight3Text && <p>{highlight3Text}</p>}
                </article>
              )}
            </div>
          </div>
          <div className={`hero-portrait reveal${portraitWhole ? " is-whole" : ""}`} ref={portraitRef}>
            <div className="portrait-field" aria-hidden="true" />
            {portraitWhole && <ImageBackdrop src={portrait} className="portrait-backdrop" />}
            {portrait && (
              /* eslint-disable-next-line @next/next/no-img-element -- the
                 reference animates this element's mask and transform. */
              <img
                className="portrait-illustration"
                src={portrait}
                alt={doctor.name}
                fetchPriority="high"
              />
            )}
          </div>
          {hasFilms && (
          <a className="hero-scroll" href="#films" aria-label="Scroll to the Legend’s film">
            <i aria-hidden="true"><b /></i>
            <span>Scroll into the Legend’s genius</span>
          </a>
          )}
        </section>

        {/* § 2 — FILM   The Legend's introduction film */}
        {hasFilms && (
        <section className="films" id="films" aria-labelledby="films-title">
          <div className={`film-showcase reveal${filmPlaying && stage.video ? " is-playing" : ""}`}>
            <header className="section-heading section-heading-centered section-shell film-heading">
              <p className="section-kicker">The Legend Anthology</p>
              <h2 id="films-title">
                The Master <em>at Work</em>
              </h2>
              <p>A lifetime of insight, distilled.</p>
            </header>
            {filmPlaying && stage.video ? (
              <div className="film-feature is-playing">
                {/\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(stage.video) ? (
                  <video
                    ref={filmVideoRef}
                    className="film-inline-video"
                    src={stage.video}
                    poster={stage.image}
                    controls
                    autoPlay
                    playsInline
                  />
                ) : (
                  <TrailerPlayer
                    src={stage.video}
                    poster={stage.image}
                    title={`${doctor.name} — ${stage.title}`}
                    className="film-inline-video"
                  />
                )}
                <button type="button" className="film-inline-close" onClick={closeFilm} aria-label="Close film">
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
            ) : (
              <button
                className={`film-feature${stage.isPortrait ? " is-portrait" : ""}${filmChanging ? " is-changing" : ""}`}
                type="button"
                onClick={openFilm}
                aria-label={`Open film: ${stage.title}`}
              >
                <span className="film-poster-frame">
                  {posterWhole && <ImageBackdrop src={stage.image} className="film-poster-backdrop" />}
                  {stage.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      ref={posterImgRef}
                      className={`film-poster ${posterWhole ? "is-whole" : "is-fill"}`}
                      src={stage.image}
                      alt={`${stage.title} film poster featuring ${doctor.name}`}
                    />
                  )}
                </span>
                <span className="feature-play" aria-hidden="true">
                  <i>▶</i>
                  <b>{stage.video ? "Watch now" : "Coming soon"}</b>
                </span>
              </button>
            )}
            {films.length > 1 && (
              <>
                <div className="film-dots" role="group" aria-label="Choose a film">
                  {films.map((film, i) => (
                    <button
                      key={i}
                      type="button"
                      className={i === activeFilm ? "is-active" : ""}
                      aria-label={film.title}
                      aria-pressed={i === activeFilm}
                      onClick={() => selectFilm(i)}
                    />
                  ))}
                </div>
                <div className="film-rail">
                  <p>The Legend Anthology</p>
                  <div className="film-selectors" role="tablist" aria-label="Choose a film">
                    {films.map((film, i) => (
                      <button
                        key={i}
                        type="button"
                        role="tab"
                        className={`film-selector${i === activeFilm ? " is-active" : ""}`}
                        aria-selected={i === activeFilm}
                        aria-label={film.title}
                        onClick={() => selectFilm(i)}
                      >
                        {film.image && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={film.image} alt="" />
                        )}
                        <span>{String(i + 1).padStart(2, "0")}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
        )}

        {/* § 3 — MAKING   The biography as a three-column spread */}
        {showStory && (
          <section className="making" id="making" aria-labelledby="making-title">
            <div className="section-shell editorial-shell">
              <header className="editorial-heading reveal">
                <p className="section-kicker">The Legend’s Story</p>
                <h2 id="making-title">
                  Making of <em>the Legend</em>
                </h2>
              </header>
              <div className="editorial-rule" aria-hidden="true" />
              {hasStory ? (
              <article className="legend-editorial reveal" aria-label={`The story of ${doctor.name}`}>
                <div className="editorial-column editorial-column-one">
                  {paragraphsOf(doctor.storyColumn1).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <div className="editorial-column editorial-column-two">
                  {doctor.storyQuote && <blockquote>{doctor.storyQuote}</blockquote>}
                  {paragraphsOf(doctor.storyColumn2).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
                <div className="editorial-column editorial-column-three">
                  {paragraphsOf(doctor.storyColumn3).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {doctor.storyHighlight && <p className="editorial-highlight">{doctor.storyHighlight}</p>}
                  {paragraphsOf(doctor.storyColumn3After).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </article>
              ) : storyComingSoon ? (
              <article className="legend-editorial reveal is-single" aria-label={`The story of ${doctor.name}`}>
                <div className="editorial-column editorial-column-one">
                  <p>
                    The story of {doctor.name} is being written. Check back soon to read how this Legend
                    shaped the field.
                  </p>
                </div>
              </article>
              ) : (
              <article
                className={`legend-editorial reveal${columns.length === 1 ? " is-single" : ""}`}
                aria-label={`The story of ${doctor.name}`}
              >
                {columns.map((paragraphs, c) => (
                  <div
                    key={c}
                    className={`editorial-column editorial-column-${["one", "two", "three"][c]}`}
                  >
                    {paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                ))}
              </article>
              )}
              <footer className="editorial-footer">
                <span>The Legend’s Story</span>
                <span>{doctor.name}</span>
              </footer>
            </div>
          </section>
        )}

        {/* § 4 — PROGRAMMES   What the Legend teaches (always shown; "Coming
            Soon" until a course is linked to the Legend) */}
        {(
          <section
            className="programmes section-shell"
            id="programmes"
            aria-labelledby="programmes-title"
          >
            <div className="programme-copy reveal">
              <p className="section-kicker">Legacy Transfer Programmes</p>
              <h2 id="programmes-title">
                From the Legend, <em>directly.</em>
              </h2>
              <p>
                {doctor.programmeIntro ||
                  `A structured journey shaped and led by ${doctor.name}, carrying the judgement, methods and standards built across a lifetime into your practice.`}
              </p>
              {programHref ? (
                <Link className="programme-cta" href={programHref}>
                  Explore the Programme <span>→</span>
                </Link>
              ) : (
                <a className="programme-cta" href={interestHref}>
                  Register Your Interest <span>→</span>
                </a>
              )}
            </div>
            <div className="programme-shelf reveal" aria-label={`Programmes by ${doctor.name}`}>
              {doctor.programmeVideo && programmePlaying ? (
                <div className="programme-card is-playing">
                  <video
                    ref={programmeVideoRef}
                    src={doctor.programmeVideo}
                    controls
                    playsInline
                    autoPlay
                    className="programme-video"
                  />
                  <button
                    type="button"
                    onClick={closeProgrammeVideo}
                    aria-label="Close video"
                    className="programme-video-close"
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              ) : doctor.programmeVideo ? (
                <button
                  ref={programmeCardRef}
                  type="button"
                  className="programme-card"
                  onClick={() => setProgrammePlaying(true)}
                  aria-label={`Play the video for ${plainCourseName} with ${doctor.name}`}
                >
                  {cardInner}
                  <span className="programme-card-play" aria-hidden="true">
                    <Play className="h-4 w-4" />
                  </span>
                </button>
              ) : programHref ? (
                <Link className="programme-card" href={programHref}>
                  {cardInner}
                </Link>
              ) : (
                <a className="programme-card" href={interestHref}>
                  {cardInner}
                </a>
              )}
            </div>
          </section>
        )}

      </main>
      </div>

      <Footer />
    </>
  );
}
