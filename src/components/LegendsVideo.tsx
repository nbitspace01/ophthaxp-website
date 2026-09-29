"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Sparkle, X } from "lucide-react";
import { HERO_VIDEO_POSTER } from "@/lib/data";

/** The featured programme. Swap these to feature another programme or Legend. */
const FEATURED = {
  programme: "Building a Modern Cornea Practice",
  legend: "Dr. Srinivas K. Rao",
  cta: "What Becomes Possible",
};

/**
 * Section 3's video comes from NEXT_PUBLIC_FEATURED_VIDEO_SRC, not from the
 * course video set in the admin panel. NEXT_PUBLIC_ because this is a client
 * component: Next inlines the value at build time, so a change needs a
 * rebuild/redeploy. Without it the play button is left out.
 */
const VIDEO_SRC = process.env.NEXT_PUBLIC_FEATURED_VIDEO_SRC || "";

export function LegendsVideo() {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  /** When fullscreen was last left, so the Esc that left it is not reused. */

  useEffect(() => {
    if (!playing) return;
    const isFullscreen = () =>
      Boolean(
        document.fullscreenElement ||
          (document as Document & { webkitFullscreenElement?: Element | null })
            .webkitFullscreenElement ||
          (videoRef.current as (HTMLVideoElement & { webkitDisplayingFullscreen?: boolean }) | null)
            ?.webkitDisplayingFullscreen,
      );

    // downSeen: the current Esc press was seen going down, so its keyup is
    // already accounted for.
    // ignoreNextKeyUp: fullscreen was just left, so a keyup from the Esc that
    // left it must not close the video. It expires after a short moment so it
    // can never swallow the second Esc.
    let downSeen = false;
    let ignoreNextKeyUp = false;
    let ignoreTimer: ReturnType<typeof setTimeout> | undefined;

const onFullscreenChange = () => {
  if (!isFullscreen()) {
    ignoreNextKeyUp = true;

    if (ignoreTimer) clearTimeout(ignoreTimer);

    ignoreTimer = setTimeout(() => {
      ignoreNextKeyUp = false;

      // Remove focus from the native video control
      // so the next Esc reaches the modal.
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }, 300);
  }
};

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (e.repeat) return;
      downSeen = true;
      ignoreNextKeyUp = false;
      if (isFullscreen()) {
        // Esc in fullscreen only leaves fullscreen.
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        return;
      }
      // Esc in the normal view closes the video, even if the native
      // controls / fullscreen button currently hold focus.
      e.preventDefault();
      e.stopPropagation();
      close();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;

      if (downSeen) {
        downSeen = false;
        return;
      }

      // Keyup with no keydown seen: the browser swallowed the keydown.
      // If it belongs to the Esc that just left fullscreen, ignore it.
      if (ignoreNextKeyUp) {
        ignoreNextKeyUp = false;
        return;
      }
      if (isFullscreen()) return;

      close();
    };

    // On the window and in the capture phase, so the key is seen before
    // anything inside the page (e.g. the video's own controls) can stop it.
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    videoRef.current?.play().catch(() => {});
    return () => {
      if (ignoreTimer) clearTimeout(ignoreTimer);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp, true);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, [playing]);

  const close = () => {
    videoRef.current?.pause();
    setPlaying(false);
    triggerRef.current?.focus();
  };

  return (
    <section
      aria-labelledby="legends-title"
      className="mx-auto max-w-[1440px] px-5 py-12 sm:px-10 sm:py-14 lg:px-14"
    >
      <h2
        id="legends-title"
        className="text-center text-[clamp(1.5rem,2.6vw,2.25rem)] font-extrabold leading-[1.3] tracking-[-0.01em] text-white"
      >
        Now, the Legends are closer than they appear.
      </h2>

      <div
        className={`relative mt-10 w-full overflow-hidden rounded-[20px] bg-ink-850 sm:mt-14 sm:aspect-[1200/648] ${
          /* Taller on phones so the badge and the copy each have room. */
          playing ? "aspect-[16/10]" : "aspect-[4/5]"
        }`}
      >
        {playing ? (
          <>
            <video
              ref={videoRef}
              src={VIDEO_SRC}
              controls
              playsInline
              autoPlay
              className="legends-video h-full w-full bg-black object-contain"
            />
            <button
              type="button"
              onClick={close}
              aria-label="Close video"
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white backdrop-blur transition hover:border-accent hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
          </>
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_VIDEO_POSTER}
              alt="Senior ophthalmology consultant introducing the Legends of Medicine mentorship cohorts"
              className="h-full w-full object-cover"
            />

            {/* Scrim — heaviest on the right so the overlay copy stays legible;
                from the bottom on phones, where the copy sits there. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.97)_0%,rgba(0,0,0,0.9)_30%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.12)_78%,rgba(0,0,0,0)_92%)] sm:bg-[linear-gradient(to_left,rgba(0,0,0,0.97)_0%,rgba(0,0,0,0.9)_20%,rgba(0,0,0,0.55)_45%,rgba(0,0,0,0.12)_75%,rgba(0,0,0,0)_92%)]"
            />

            <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-black sm:right-8 sm:top-8">
              <Sparkle className="h-3.5 w-3.5 fill-black" aria-hidden />
              Featured Programme
            </span>

            <div className="absolute inset-0 flex w-full flex-col items-center justify-end px-6 pb-8 text-center sm:left-auto sm:max-w-[26rem] sm:justify-center sm:px-10 sm:pb-0">
              <h3 className="font-serif text-[clamp(1.5rem,2.6vw,2.25rem)] font-medium leading-[1.25] text-white">
                {FEATURED.programme}
              </h3>
              <span className="mt-5 block h-px w-6 bg-white/70" aria-hidden />
              <p className="mt-5 text-sm text-white/70">
                with <span className="font-semibold text-white">{FEATURED.legend}</span>
              </p>
              {VIDEO_SRC && (
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={`Play ‘${FEATURED.cta}’ for ${FEATURED.programme} with ${FEATURED.legend}.`}
                className="mt-6 inline-flex items-center gap-2.5 whitespace-nowrap rounded-[10px] border border-white/25 bg-black/40 px-5 py-3 sm:px-6text-[15px] font-medium text-white backdrop-blur-sm transition hover:border-accent hover:bg-accent"
              >
                <Play className="h-4 w-4" aria-hidden />
                {FEATURED.cta}
              </button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
