"use client";

import Image from "next/image";

/**
 * Animated LoMa icon: a doctor's coat that opens three times to reveal
 * Answer (globe), Guide (prism) and Workflow (quadrant), then loops.
 *
 * Timing follows the LoMa Gemini Animation Handoff — 5.4 s total at 24 fps.
 * Each reveal crossfades from the closed-coat frame to the open-coat-with-object
 * frame, holds while the object is visible, then crossfades back.
 */

const DURATION = "5.4s";

const layers = [
  { src: "/Loma icon/01_Closed_Coat.png", cls: "loma-coat" },
  { src: "/Loma icon/02_Answer_Globe.png", cls: "loma-answer" },
  { src: "/Loma icon/03_Guide_Prism.png", cls: "loma-guide" },
  { src: "/Loma icon/04_Workflow_Quadrant.png", cls: "loma-workflow" },
] as const;

export function LoMaAnimatedIcon() {
  return (
    <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center loma-float">
      {/* Cyan glow halo — intensifies during reveals */}
      <span
        aria-hidden
        className="loma-glow absolute inset-0 rounded-full blur-[5px]"
        style={{ background: "rgba(0, 192, 232, 0.35)" }}
      />

      {layers.map(({ src, cls }) => (
        <Image
          key={cls}
          src={src}
          alt=""
          width={170}
          height={170}
          unoptimized
          aria-hidden
          className={`${cls} absolute inset-0 h-full w-full object-contain`}
        />
      ))}
    </span>
  );
}
