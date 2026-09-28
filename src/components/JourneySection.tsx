import { LegendArt, type LegendArtKind } from "./LegendArt";

/**
 * "Making of a Legend." — the LoM philosophy in five cards.
 *
 * Each card opens with an animated line drawing (see LegendArt), in the white
 * and terracotta of the rest of the site. Decoration only, hidden from screen
 * readers.
 */

const CARDS: { title: string; subtitle: string; body: string; art: LegendArtKind }[] = [
  {
    title: "Exclusive Access.",
    subtitle: "To the Legends.",
    body: "LoM is the world’s first institution created to give ophthalmologists direct access to the Legends who shaped their field.",
    art: "access",
  },
  {
    title: "Not Minutes.",
    subtitle: "Months with a Legend.",
    body: "The Legend comes to know your practice. Each encounter builds on the last, returning to your questions and the decisions you face in your clinic.",
    art: "months",
  },
  {
    title: "Every Session.",
    subtitle: "Live.",
    body: "Every session is with the Legend, live. Bring your questions, discuss cases and hear their thinking in the moment.",
    art: "live",
  },
  {
    title: "Stay",
    subtitle: "in Practice.",
    body: "The journey runs alongside your clinic. You continue caring for patients and building your practice as you learn.",
    art: "practice",
  },
  {
    title: "Your Clinic. Your Patients.",
    subtitle: "The Legendary Way.",
    body: "What you develop with a Legend returns to the cases you see, the decisions you make and the patients in your care.",
    art: "clinic",
  },
];

export function JourneySection() {
  return (
    <section
      aria-labelledby="journey-title"
      className="mx-auto max-w-[1440px] px-5 py-12 sm:px-10 sm:py-14 lg:px-14"
    >


      <h2
        id="journey-title"
        className="mx-auto max-w-3xl text-center text-[clamp(1.5rem,2.6vw,2.25rem)] font-extrabold leading-[1.3] tracking-[-0.01em] text-white"
      >
        Making of a Legend.
      </h2>

      <ul className="mt-10 grid grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {CARDS.map((card, i) => (
          <li
            key={card.title}
            className="flex flex-col border border-white/10 bg-ink-900 transition-colors duration-300 hover:border-accent/70"
          >
            <LegendArt kind={card.art} index={i} className="mx-auto block aspect-square w-full max-w-[320px]" />

            <div className="mx-6 border-t border-white/10" />

            <div className="flex flex-1 flex-col px-6 pb-8 pt-7">
              <h3 className="text-[clamp(1.25rem,1.7vw,1.5rem)] font-bold leading-tight text-white">
                {card.title}
              </h3>
              <p className="mt-1 text-[clamp(1.25rem,1.7vw,1.5rem)] font-bold leading-[0.98] text-accent">
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
