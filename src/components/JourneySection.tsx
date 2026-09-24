import type { ReactNode } from "react";

/**
 * "Making of a Legend." — the LoM philosophy in five cards.
 *
 * Each card opens with a line drawing in the white and terracotta of the rest
 * of the site. They are drawn here as static SVG rather than shipped as images:
 * they are decoration, hidden from screen readers, and stay crisp at any size.
 */

/** Deterministic 0–1 noise, so the drawings are identical on every render. */
const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const WHITE = "rgba(255,255,255,0.55)";
const WHITE_DIM = "rgba(255,255,255,0.22)";
const ACCENT = "#B75A44";
const ACCENT_DIM = "rgba(183,90,68,0.55)";

/** Short strokes pointing outward from (cx, cy), scattered across a ring. */
function radialTicks(cx: number, cy: number, r0: number, r1: number, count: number, seed: number) {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2 + rand(seed + i) * 0.25;
    const r = r0 + rand(seed + i * 7) * (r1 - r0);
    const len = 4 + rand(seed + i * 3) * 10;
    return (
      <line
        key={`${seed}-${i}`}
        x1={cx + Math.cos(a) * r}
        y1={cy + Math.sin(a) * r}
        x2={cx + Math.cos(a) * (r + len)}
        y2={cy + Math.sin(a) * (r + len)}
        stroke={rand(seed + i * 5) > 0.72 ? ACCENT_DIM : WHITE_DIM}
        strokeWidth={1.2}
      />
    );
  });
}

/** Two fields meeting: the ophthalmologist and the Legend, joined. */
function AccessArt() {
  return (
    <>
      {radialTicks(105, 150, 30, 95, 70, 1)}
      {radialTicks(200, 150, 30, 95, 70, 2)}
      <line x1={105} y1={150} x2={200} y2={150} stroke={ACCENT} strokeWidth={1.2} strokeDasharray="6 4" />
      <circle cx={105} cy={150} r={4} fill="#fff" />
      <circle cx={200} cy={150} r={4} fill={ACCENT} />
    </>
  );
}

/** Encounters accumulating over time along a shared line. */
function MonthsArt() {
  const xs = Array.from({ length: 14 }, (_, i) => 50 + i * 15.4);
  return (
    <>
      {xs.map((x, i) => {
        const h = 20 + rand(i + 20) * 70;
        return (
          <g key={x}>
            <line x1={x} y1={170} x2={x} y2={170 - h} stroke={i % 3 === 0 ? WHITE : ACCENT_DIM} strokeWidth={1.2} />
            {rand(i + 40) > 0.6 && <circle cx={x} cy={170 - h * 0.4} r={1.8} fill={WHITE} />}
          </g>
        );
      })}
      <line x1={50} y1={170} x2={250} y2={170} stroke={ACCENT_DIM} strokeWidth={1.2} strokeDasharray="8 5" />
      <line x1={50} y1={205} x2={250} y2={205} stroke={WHITE_DIM} strokeWidth={1.2} strokeDasharray="8 5" />
      <line x1={50} y1={240} x2={250} y2={240} stroke={ACCENT_DIM} strokeWidth={1.2} strokeDasharray="8 5" />
      <circle cx={82} cy={205} r={7} fill={ACCENT_DIM} />
      <circle cx={82} cy={205} r={3} fill="#fff" />
    </>
  );
}

/** A single moment, radiating outward. */
function LiveArt() {
  return (
    <>
      {[40, 70, 100, 130].map((r, ring) => {
        const count = 24 + ring * 10;
        return Array.from({ length: count }, (_, i) => {
          const a = (i / count) * Math.PI * 2 + ring * 0.13;
          const len = 6 + rand(ring * 100 + i) * 12;
          return (
            <line
              key={`${ring}-${i}`}
              x1={150 + Math.cos(a) * r}
              y1={150 + Math.sin(a) * r}
              x2={150 + Math.cos(a) * (r + len)}
              y2={150 + Math.sin(a) * (r + len)}
              stroke={rand(ring * 50 + i) > 0.55 ? ACCENT_DIM : WHITE_DIM}
              strokeWidth={1.4}
            />
          );
        });
      })}
      <circle cx={150} cy={150} r={22} fill="none" stroke={ACCENT_DIM} strokeWidth={1.2} />
      <circle cx={150} cy={150} r={4.5} fill="#fff" />
    </>
  );
}

/** Learning and practice running side by side, tied together throughout. */
function PracticeArt() {
  const xs = Array.from({ length: 11 }, (_, i) => 45 + i * 21);
  return (
    <>
      {xs.map((x, i) => (
        <line key={x} x1={x} y1={112} x2={x} y2={188} stroke={i % 2 ? ACCENT_DIM : WHITE_DIM} strokeWidth={1.2} />
      ))}
      <line x1={35} y1={112} x2={265} y2={112} stroke={WHITE} strokeWidth={1.2} strokeDasharray="10 3" />
      <line x1={35} y1={188} x2={265} y2={188} stroke={ACCENT} strokeWidth={1.2} strokeDasharray="10 3" />
      <circle cx={66} cy={112} r={3.5} fill="#fff" />
      <circle cx={66} cy={188} r={3.5} fill={ACCENT} />
    </>
  );
}

/** Many cases, all returning to one point of practice. */
function ClinicArt() {
  const cols = 9;
  const rows = 6;
  const focus = { x: 212, y: 135 };
  const dots: ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = 40 + c * 27;
      const y = 60 + r * 36;
      dots.push(<circle key={`${r}-${c}`} cx={x} cy={y} r={1.8} fill={(r + c) % 3 ? ACCENT_DIM : WHITE} />);
    }
  }
  const sources = [
    [40, 60],
    [40, 96],
    [67, 240],
    [121, 240],
  ];
  return (
    <>
      {dots}
      {sources.map(([x, y]) => (
        <line key={`${x}-${y}`} x1={x} y1={y} x2={focus.x} y2={focus.y} stroke={ACCENT_DIM} strokeWidth={1} />
      ))}
      <circle cx={focus.x} cy={focus.y} r={4.5} fill="#fff" />
    </>
  );
}

const CARDS: { title: string; subtitle: string; body: string; art: () => ReactNode }[] = [
  {
    title: "Exclusive Access.",
    subtitle: "To the Legends.",
    body: "LoM is the world’s first institution created to give ophthalmologists direct access to the Legends who shaped their field.",
    art: AccessArt,
  },
  {
    title: "Not Minutes.",
    subtitle: "Months with a Legend.",
    body: "The Legend comes to know your practice. Each encounter builds on the last, returning to your questions and the decisions you face in your clinic.",
    art: MonthsArt,
  },
  {
    title: "Every Session.",
    subtitle: "Live.",
    body: "Every session is with the Legend, live. Bring your questions, discuss cases and hear their thinking in the moment.",
    art: LiveArt,
  },
  {
    title: "Stay",
    subtitle: "in Practice.",
    body: "The journey runs alongside your clinic. You continue caring for patients and building your practice as you learn.",
    art: PracticeArt,
  },
  {
    title: "Your Clinic. Your Patients.",
    subtitle: "The Legendary Way.",
    body: "What you develop with a Legend returns to the cases you see, the decisions you make and the patients in your care.",
    art: ClinicArt,
  },
];

export function JourneySection() {
  return (
    <section
      aria-labelledby="journey-title"
      className="mx-auto max-w-[1440px] px-5 py-12 sm:px-10 sm:py-14 lg:px-[120px]"
    >
      <p className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-accent-soft">
        <span aria-hidden className="h-px w-8 bg-accent" />
        The LoM Philosophy
      </p>

      <h2
        id="journey-title"
        className="mt-5 text-[clamp(2rem,4.4vw,3.5rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-white"
      >
        Making of <span className="font-serif font-normal italic text-accent-soft">a Legend.</span>
      </h2>

      <ul className="mt-10 grid grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {CARDS.map((card) => (
          <li
            key={card.title}
            className="flex flex-col border border-white/10 bg-ink-900 transition-colors duration-300 hover:border-accent/70"
          >
            <svg
              aria-hidden
              viewBox="0 0 300 300"
              className="mx-auto block aspect-square w-full max-w-[320px]"
            >
              {card.art()}
            </svg>

            <div className="mx-6 border-t border-white/10" />

            <div className="flex flex-1 flex-col px-6 pb-8 pt-7">
              <h3 className="text-[clamp(1.25rem,1.7vw,1.5rem)] font-semibold leading-tight text-white">
                {card.title}
              </h3>
              <p className="mt-1 font-serif text-[clamp(1.25rem,1.7vw,1.5rem)] italic leading-tight text-accent-soft">
                {card.subtitle}
              </p>
              <p className="mt-6 text-[15px] leading-relaxed text-white/60">{card.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
