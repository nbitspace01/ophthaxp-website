import Image from "next/image";

/**
 * The four-step path from browsing to enrolment. Each card is a portrait photo
 * with the step badge pinned top-left and the outcome line over a scrim at the
 * bottom; a couple of the cards carry floating chips that hint at what the
 * step actually involves.
 *
 * Geometry follows the Figma card export, which is 292x521 — the same size the
 * card lands at on a 1440 canvas — so the chip stack, the specialty rail and
 * the badge are positioned as percentages of that box and hold their
 * proportions when the grid reflows to one or two columns.
 */
const STEPS: {
  n: number;
  label: string;
  title: string;
  description: string;
  src: string;
  position?: string;
}[] = [
  {
    n: 1,
    label: "Apply",
    title: "The Pursuit Starts Here.",
    description:
      "Share your clinical background and what draws you to the programme. Schedule your Dialogue with the Legend.",
    src: "/your-path/apply.png",
    position: "50% 45%",
  },
  {
    n: 2,
    label: "Dialogue",
    title: "Where the Fit Becomes Clear.",
    description:
      "Discuss your goals directly with the Legend, understand the programme’s expectations and see whether it is right for you.",
    src: "/your-path/dialogue.png",
    position: "50% 42%",
  },
  {
    n: 3,
    label: "Journey",
    title: "The Making Begins.",
    description:
      "From here, the programme’s structured journey unfolds, guided throughout by the Legend.",
    src: "/your-path/journey-roundtable.png",
    position: "50% 48%",
  },
];

/**
 * One wavelength is 20 user units and the path spans -5..65, so a sibling copy
 * shifted by -20 covers the badge at every point of the loop.
 */
const WAVE_PATH =
  "M-5 5 Q0 0 5 5 T15 5 T25 5 T35 5 T45 5 T55 5 T65 5 L65 40 L-5 40 Z";

/**
 * The step number sits in a hollow terracotta ring with liquid rising inside
 * it, so read left to right the four badges fill up like a gauge of how far
 * along the journey you are. The last step is the journey completed, so its
 * badge is solid to the brim — no surface left to move.
 */
function StepBadge({ n, total }: { n: number; total: number }) {
  const clipId = `how-badge-clip-${n}`;
  const full = n === total;
  const surface = 15 - (n - 1) * 4;
  return (
    <span className="relative inline-flex h-[28px] w-[28px] shrink-0 items-center justify-center">
      <svg
        viewBox="0 0 30 30"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx="15" cy="15" r="14" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {full ? (
            <circle cx="15" cy="15" r="14" fill="#B75A44" />
          ) : (
            <g className="how-wave-body">
              {/* Back swell runs the other way at a different phase — without
                  it the surface reads as one rigid sawtooth rather than
                  water. */}
              <g transform={`translate(-7 ${surface + 1.8})`}>
                <path
                  className="how-wave-back"
                  d={WAVE_PATH}
                  fill="#B75A44"
                  fillOpacity="0.5"
                />
              </g>
              <g transform={`translate(0 ${surface})`}>
                <path className="how-wave-front" d={WAVE_PATH} fill="#B75A44" />
              </g>
            </g>
          )}
        </g>
        <circle cx="15" cy="15" r="14.5" fill="none" stroke="#B75A44" />
      </svg>
      <span className="relative text-[11px] font-bold leading-none text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
        {n}
      </span>
    </span>
  );
}

/**
 * Lit orb for the "Visualize your Future" chip. The sphere is an animated GIF
 * that carries its own light, so all that is added here is the halo it throws
 * onto the chip behind it. Unoptimized because Next's image pipeline would
 * otherwise flatten the animation to a single frame.
 */
function VisualizeOrb() {
  return (
    <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center">
      <span
        aria-hidden
        className="how-orb-halo absolute inset-0 rounded-full bg-spark/50 blur-[7px]"
      />
      <Image
        src="/visualize-orb.gif"
        alt=""
        width={150}
        height={150}
        unoptimized
        aria-hidden
        className="relative h-6 w-6 object-contain [filter:drop-shadow(0_0_5px_rgba(0,192,232,0.7))]"
      />
    </span>
  );
}

/**
 * The LOMA mark: a terracotta infinity loop. Path and its 2px stroke are
 * verbatim from the Figma export — it reads as a drawn logo rather than a UI
 * icon, so it deliberately does not thin out to match lucide glyphs.
 */
function LomaMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path
        d="M6 16C11 16 13 8 18 8C19.0609 8 20.0783 8.42143 20.8284 9.17157C21.5786 9.92172 22 10.9391 22 12C22 13.0609 21.5786 14.0783 20.8284 14.8284C20.0783 15.5786 19.0609 16 18 16C13 16 11 8 6 8C4.93913 8 3.92172 8.42143 3.17157 9.17157C2.42143 9.92172 2 10.9391 2 12C2 13.0609 2.42143 14.0783 3.17157 14.8284C3.92172 15.5786 4.93913 16 6 16Z"
        stroke="#B75A44"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The same mark with stacked case files above it, for "Access LOMA Cases". */
function LomaCasesMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M14.5127 3C14.7371 2.99972 14.9597 3.04395 15.167 3.12988C15.3744 3.2159 15.5632 3.34187 15.7217 3.50098H15.7207L17.5186 5.29883L17.6318 5.42285C17.7387 5.55252 17.826 5.69774 17.8906 5.85352C17.9768 6.06133 18.0209 6.28478 18.0205 6.50977V6.51172L18 10.5029C17.9984 10.7789 17.7731 11.0014 17.4971 11C17.2211 10.9984 16.9986 10.7731 17 10.4971L17.0176 7.00879H15.0137C14.7482 7.00871 14.4933 6.9035 14.3057 6.71582C14.1179 6.52801 14.0127 6.27236 14.0127 6.00684V4H10.5029C10.3697 4 10.2417 4.05316 10.1475 4.14746C10.0532 4.24176 10 4.36951 10 4.50293V6C9.99997 6.27612 9.77612 6.5 9.5 6.5C9.22388 6.5 9.00003 6.27612 9 6V4.50293C9 4.1044 9.15868 3.7223 9.44043 3.44043C9.72219 3.15863 10.1044 3 10.5029 3H14.5127ZM15.0127 6.00879H16.8145L15.0127 4.20703V6.00879Z" fill="white" />
      <path d="M11.5127 6C11.7371 5.99972 11.9597 6.04399 12.167 6.12988C12.3744 6.21589 12.5632 6.3419 12.7217 6.50098H12.7207L14.5186 8.29883L14.6318 8.42285C14.7387 8.55253 14.826 8.69773 14.8906 8.85352C14.9768 9.06134 15.0209 9.28476 15.0205 9.50977V9.5127L15 12.5039C14.9996 12.5609 14.9866 12.6156 14.9678 12.668C14.9639 12.6788 14.9607 12.6897 14.9561 12.7002C14.9475 12.7197 14.9367 12.7376 14.9258 12.7559C14.9188 12.7675 14.9122 12.7791 14.9043 12.79C14.8937 12.8048 14.8823 12.8185 14.8701 12.832C14.8581 12.8455 14.8455 12.8581 14.832 12.8701C14.8251 12.8763 14.8198 12.8848 14.8125 12.8906L12.3125 14.8906C12.1366 15.0312 11.8882 15.0367 11.7061 14.9043L6.20605 10.9043C6.07676 10.8102 6.00003 10.6599 6 10.5V7.50293C6 7.10446 6.15876 6.72228 6.44043 6.44043C6.72214 6.15868 7.1045 6.00006 7.50293 6H11.5127ZM7.50293 7C7.36977 7.00006 7.24168 7.05321 7.14746 7.14746C7.05329 7.24175 7 7.36956 7 7.50293V10.2451L11.9844 13.8711L14 12.2578V10.0088H12.0137C11.7483 10.0087 11.4933 9.90335 11.3057 9.71582C11.1179 9.52802 11.0127 9.27235 11.0127 9.00684V7H7.50293ZM12.0127 9.00879H13.8145L12.0127 7.20703V9.00879Z" fill="white" />
      <path
        d="M6 19C11 19 13 11 18 11C19.0609 11 20.0783 11.4214 20.8284 12.1716C21.5786 12.9217 22 13.9391 22 15C22 16.0609 21.5786 17.0783 20.8284 17.8284C20.0783 18.5786 19.0609 19 18 19C13 19 11 11 6 11C4.93913 11 3.92172 11.4214 3.17157 12.1716C2.42143 12.9217 2 13.9391 2 15C2 16.0609 2.42143 17.0783 3.17157 17.8284C3.92172 18.5786 4.93913 19 6 19Z"
        stroke="#B75A44"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The crossing-paths glyph on the Hybrid Immersions card — two routes that
 * split and rejoin, which is the point of a hybrid format. Paths are verbatim
 * from the Figma export; the translate reframes them from their position on the
 * 176x69 card onto a 0-based viewBox so the proportions stay exact.
 */
function HybridIcon() {
  return (
    <svg
      viewBox="0 0 14.84 19.25"
      className="h-[19px] w-[14.6px]"
      fill="none"
      aria-hidden
    >
      <g
        transform="translate(-82.25 -12.5)"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M96.333 16.583L92.9997 13.2497L89.6663 16.583" />
        <path d="M96 28L92 31L88 28" />
        <path d="M83.0001 14V15.5784C82.9968 16.0956 83.111 16.6059 83.3331 17.0657C83.5551 17.5255 83.8783 17.921 84.2751 18.2184L90.7249 22.5816C91.1217 22.879 91.4449 23.2745 91.6669 23.7343C91.889 24.1941 92.0032 24.7044 91.9999 25.2216V30" />
        <path d="M83.0001 30V27.5226C82.9931 26.5861 83.2702 25.6664 83.8002 24.8673C84.3303 24.0682 85.0922 23.4214 86 23" />
        <path d="M93 15V18.1139C92.997 18.4518 92.9225 18.7836 92.783 19.0802C92.6435 19.3768 92.4433 19.6291 92.2 19.8149L92 20" />
      </g>
    </svg>
  );
}

/**
 * A chip is a single mark. The ones that are doorways into sections further
 * down the page render as anchors — `html` already carries `scroll-behavior:
 * smooth` and an 88px `scroll-padding-top`, so the target lands below the
 * sticky navbar with no script of its own. Every glyph inside is aria-hidden,
 * so `label` is what actually names the control.
 */
function Chip({
  label,
  href,
  children,
  className = "",
}: {
  label: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const base = `inline-flex h-[42px] w-[42px] items-center justify-center rounded-lg border-[0.5px] border-[#4A4A4A] bg-black/60 text-white backdrop-blur-[4px] ${className}`;

  if (!href) {
    return (
      <span role="img" aria-label={label} className={base}>
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      aria-label={label}
      className={`${base} transition hover:border-white/45 hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black`}
    >
      {children}
    </a>
  );
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-title"
      className="mx-auto max-w-[1440px] px-5 py-12 sm:px-10 sm:py-14 lg:px-14"
    >
      <p className="mb-2 text-center text-[0.72rem] font-bold uppercase tracking-[0.22em] text-accent">
        The Way In
      </p>
      <h2
        id="how-title"
        className="mx-auto max-w-2xl text-center text-[clamp(1.75rem,3.1vw,2.6rem)] font-extrabold leading-[1.3] tracking-[-0.015em] text-white"
      >
        Your Path into LoM
      </h2>

      <ol className="mt-12 grid grid-cols-1 gap-3.5 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step, i) => {
          return (
            <li
              key={step.n}
              className="group/card relative isolate aspect-[4/3] overflow-hidden rounded-[10px] border border-[#4A4A4A] bg-ink-850 transition-[border-color,transform,box-shadow] duration-500 hover:border-accent/30 hover:-translate-y-0.5 hover:shadow-[0_30px_84px_rgba(0,0,0,.34)]"
            >
              <Image
                src={step.src}
                alt=""
                fill
                priority={i === 0}
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                style={{ objectPosition: step.position ?? "center" }}
                className="object-cover transition-[filter,transform] duration-[1.2s] ease-[cubic-bezier(.2,.75,.2,1)] group-hover/card:scale-[1.026]"
              />

              <div aria-hidden className="absolute inset-0 bg-black/25" />
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-[18%] bg-[linear-gradient(to_bottom,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0)_100%)]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(44,44,44,0)_44%,rgba(0,0,0,0.87)_100%)]"
              />

              {/* Step label — left, badge — right */}
              <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">{step.label}</span>
                <StepBadge n={step.n} total={STEPS.length} />
              </div>

              <div className="absolute inset-x-0 bottom-[6%] z-10 px-5 text-center">
                <p className="text-[22px] font-bold leading-[1.25] text-white">
                  {step.title}
                </p>
                <p className="mt-0 max-h-0 overflow-hidden text-[13px] leading-relaxed text-white/70 opacity-0 transition-[max-height,opacity,margin] duration-500 ease-[cubic-bezier(.2,.75,.2,1)] group-hover/card:mt-2.5 group-hover/card:max-h-28 group-hover/card:opacity-100">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
