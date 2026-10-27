import { LegendArt, type LegendArtKind } from "./LegendArt";

/**
 * "Making of a Legend." — the LoM philosophy in five cards.
 *
 * Each card opens with an animated line drawing (see LegendArt), in the white
 * and terracotta of the rest of the site. Decoration only, hidden from screen
 * readers.
 *
 * On a phone the five cards are a swipe rail rather than a stack. Stacked, each
 * card is a square drawing plus two headings plus a paragraph — around 500px —
 * so the section alone ran to five screens of scrolling before the page even
 * reached the programmes. The rail keeps all five cards and all of their copy;
 * it just spends the horizontal axis instead of the vertical one. It bleeds to
 * both viewport edges (-mx-5 against the section's px-5) so the next card peeks
 * in at the right edge and the swipe is discoverable. From `sm` up it is the
 * grid it always was.
 */

const CARDS: { title: string; subtitle: string; body: string; art: LegendArtKind }[] = [
  {
    title: "Exclusive Access,",
    subtitle: "To the Legends.",
    body: "LoM is the world’s first institution created to give ophthalmologists direct access to the Legends who shaped their field.",
    art: "access",
  },
  {
    title: "Not Minutes,",
    subtitle: "Months with a Legend.",
    body: "The Legend comes to know your practice. Each encounter builds on the last, returning to your questions and the decisions you face in your clinic.",
    art: "months",
  },
  {
    title: "Every Session,",
    subtitle: "Live.",
    body: "Every session is with the Legend, live. Bring your questions, discuss cases and hear their thinking in the moment.",
    art: "live",
  },
  {
    title: "Stay,",
    subtitle: "in Practice.",
    body: "The journey runs alongside your clinic. You continue caring for patients and building your practice as you learn.",
    art: "practice",
  },
  {
    title: "Your Clinic, Your Patients,",
    subtitle: "The Legendary Way.",
    body: "What you develop with a Legend returns to the cases you see, the decisions you make and the patients in your care.",
    art: "clinic",
  },
];

export function JourneySection() {
  return (
    <section
      aria-labelledby="journey-title"
      className="mx-auto max-w-[1440px] px-5 py-10 sm:px-10 sm:py-14 lg:px-14"
    >


      <h2
        id="journey-title"
        className="mx-auto max-w-3xl text-center text-[clamp(1.5rem,2.6vw,2.25rem)] font-extrabold leading-[1.3] tracking-[-0.01em] text-white"
      >
        Making of a Legend
      </h2>

      {/* scroll-pl-5 matches the px-5: without it snap-start pulls each card
          flush against the viewport edge and eats the gutter. */}
      <ul className="no-scrollbar -mx-5 mt-8 flex snap-x snap-mandatory scroll-pl-5 gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:mt-12 sm:grid sm:grid-cols-2 sm:overflow-x-visible sm:px-0 sm:pb-0 lg:grid-cols-3 xl:grid-cols-5">
        {CARDS.map((card, i) => (
          <li
            key={card.title}
            className="flex w-[80vw] max-w-[320px] shrink-0 snap-start flex-col border border-white/10 bg-ink-900 transition-colors duration-300 hover:border-accent/70 sm:w-auto sm:max-w-none sm:shrink"
          >
            <LegendArt kind={card.art} index={i} className="mx-auto block aspect-square w-full max-w-[320px]" />

            <div className="mx-5 border-t border-white/10 sm:mx-6" />

            <div className="flex flex-1 flex-col px-5 pb-6 pt-6 sm:px-6 sm:pb-8 sm:pt-7">
<div className="sm:min-h-[120px]">
  <h3 className="text-[clamp(1.1rem,1.6vw,1.5rem)] font-semibold leading-tight text-white">
    {card.art === "clinic" ? (
      <>
        Your Clinic,
        <br />
        Your Patients,
      </>
    ) : (
      /* nowrap only once the card is a grid cell wide enough to hold the
         line — in the phone rail it would push the card out of its own box. */
      <span className="sm:whitespace-nowrap">{card.title}</span>
    )}
  </h3>

  <p className="mt-1 text-[clamp(1.1rem,1.6vw,1.5rem)] font-semibold leading-tight text-accent">
    {card.subtitle}
  </p>
</div>
<p className="mt-4 text-[15px] leading-relaxed text-white/60 sm:mt-6">
  {card.body}
</p>
            </div>
          </li>
        ))}
      </ul>

      {/* Says out loud what the peeking card only hints at. Rail only. */}
      <p className="mt-4 text-center text-[12px] uppercase tracking-[0.18em] text-white/35 sm:hidden">
        Swipe to see all five
      </p>
    </section>
  );
}
