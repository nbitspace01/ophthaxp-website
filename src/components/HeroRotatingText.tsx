"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "To earn your place in the top 1%",
  "To become the doctor other doctors refer to",
  "To build the practice others benchmark",
];

/** How long each phrase stays readable. */
const HOLD_MS = 4500;
/** How long the incoming phrase shows as a shimmering skeleton before its text. */
const SKELETON_MS = 1000;

/**
 * The hero pre-title, cycling through the three promises.
 *
 * Each change is a skeleton load: the next phrase first appears as shimmering
 * placeholder bars the shape of its own lines (see .skeleton-text in
 * globals.css), then its text fades in over them.
 *
 * All three sit in the same grid cell so the line is always as tall as the
 * longest one — the button below does not jump when a shorter phrase wraps
 * onto fewer lines. Only the active one is visible; the others are hidden from
 * screen readers so the line is read once rather than announced on every turn.
 */
export function HeroRotatingText() {
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  // Runs for everyone, including prefers-reduced-motion. (Windows reports
  // reduced motion whenever "Animation effects" is off.)
  useEffect(() => {
    const id = window.setTimeout(
      () => {
        if (loading) {
          setLoading(false);
        } else {
          setIndex((i) => (i + 1) % PHRASES.length);
          setLoading(true);
        }
      },
      loading ? SKELETON_MS : HOLD_MS,
    );
    return () => window.clearTimeout(id);
  }, [index, loading]);

  return (
    <span className="grid">
      {PHRASES.map((phrase, i) => {
        const active = i === index;
        return (
          <span
            key={phrase}
            aria-hidden={!active}
            className={`[grid-area:1/1] transition-opacity duration-500 ${active ? "opacity-100" : "opacity-0"}`}
          >
            {/* The fade applies only on the way out of the skeleton, so the text
                vanishes at once when the bars arrive and eases in after them. */}
            <span className={active && loading ? "skeleton-text" : "transition-colors duration-500"}>
              {phrase}
            </span>
          </span>
        );
      })}
    </span>
  );
}
