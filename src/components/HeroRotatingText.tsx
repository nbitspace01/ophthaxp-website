"use client";

import { useEffect, useRef, useState } from "react";

const PHRASES = [
  "To earn your place in the top 1%",
  "To become the doctor other doctors refer to",
  "To build the practice others benchmark",
];

const INTERVAL_MS = 2500;

export function HeroRotatingText() {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState(-1);
  const [started, setStarted] = useState(false);
  const indexRef = useRef(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const rotate = () => {
      setStarted(true);
      setLeaving(indexRef.current);
      indexRef.current = (indexRef.current + 1) % PHRASES.length;
      setIndex(indexRef.current);
    };

    const first = window.setTimeout(() => {
      rotate();
      timer.current = window.setInterval(rotate, INTERVAL_MS);
    }, 2000);

    return () => {
      window.clearTimeout(first);
      if (timer.current) window.clearInterval(timer.current);
    };
  }, []);

  return (
    <span className="relative inline-grid overflow-hidden align-top">
      {PHRASES.map((phrase, i) => {
        const isCurrent = i === index;
        const isLeaving = i === leaving;

        let cls = "hero-rotate-hidden";
        if (isCurrent) cls = started ? "hero-rotate-enter" : "";
        else if (isLeaving) cls = "hero-rotate-exit";

        return (
          <span
            key={phrase}
            aria-hidden={!isCurrent}
            className={`[grid-area:1/1] ${cls}`}
          >
            {phrase}
          </span>
        );
      })}
    </span>
  );
}
