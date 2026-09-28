"use client";

import { useEffect, useState } from "react";

const PHRASES = [
  "To earn your place in the top 1%",
  "To become the doctor other doctors refer to",
  "To build the practice others benchmark",
];

/** Time between changes: ~4.5s readable plus the cascade. */
const INTERVAL_MS = 5600;
/** Delay between one word and the next in the cascade. */
const WORD_STAGGER_MS = 70;
/** The incoming words start once the outgoing wave is under way. */
const ENTER_DELAY_MS = 220;

/* Where each word sits: in place, floated up and away, or waiting below.
   Each word moves on its own delay, so a change reads as a wave rolling
   across the line — the old words lift off and dissolve left to right while
   the new ones rise into focus behind them. */
const STATE = {
  current: "translate-y-0 opacity-100 blur-0",
  previous: "-translate-y-[0.5em] opacity-0 blur-[5px]",
  next: "translate-y-[0.7em] opacity-0 blur-[5px]",
};

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

  // Runs for everyone, including prefers-reduced-motion. (Windows reports
  // reduced motion whenever "Animation effects" is off.)
  useEffect(() => {
    const id = window.setInterval(() => setIndex((i) => (i + 1) % PHRASES.length), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const previous = (index - 1 + PHRASES.length) % PHRASES.length;

  return (
    <span className="grid">
      {PHRASES.map((phrase, i) => {
        const isCurrent = i === index;
        const state = isCurrent ? STATE.current : i === previous ? STATE.previous : STATE.next;
        const words = phrase.split(" ");
        return (
          <span key={phrase} aria-hidden={!isCurrent} className="[grid-area:1/1]">
            {words.map((word, w) => (
              <span key={w}>
                <span
                  className={`inline-block transition-[transform,opacity,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${state}`}
                  style={{
                    transitionDelay: `${(isCurrent ? ENTER_DELAY_MS : 0) + w * WORD_STAGGER_MS}ms`,
                  }}
                >
                  {word}
                </span>
                {w < words.length - 1 ? " " : null}
              </span>
            ))}
          </span>
        );
      })}
    </span>
  );
}
