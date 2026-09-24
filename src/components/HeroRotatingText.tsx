"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "To earn your place in the top 1%",
  "To become the doctor other doctors refer to",
  "To build the practice others benchmark",
];

const INTERVAL_MS = 3200;

/**
 * The hero pre-title, cycling through the three promises.
 *
 * All three sit in the same grid cell so the line is always as tall as the
 * longest one — the button below does not jump when a shorter phrase wraps
 * onto fewer lines. Only the active one is visible; the others are hidden from
 * screen readers so the line is read once rather than announced on every turn.
 */
export function HeroRotatingText() {
  const [index, setIndex] = useState(0);

  // Runs for everyone, including prefers-reduced-motion: the change is an
  // opacity cross-fade in place, with nothing moving on screen. (Windows
  // reports reduced motion whenever "Animation effects" is off.)
  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % PHRASES.length), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="grid">
      {PHRASES.map((phrase, i) => (
        <span
          key={phrase}
          aria-hidden={i !== index}
          className={`[grid-area:1/1] transition-opacity duration-500 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          {phrase}
        </span>
      ))}
    </span>
  );
}
