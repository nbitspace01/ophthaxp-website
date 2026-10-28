"use client";

import { useState } from "react";
import { Check, ChevronDown, ArrowLeft, ArrowRight } from "lucide-react";
import type { CourseModule } from "@/types";

/** Rows shown before the fade cuts the list off (legacy accordion mode). */
const VISIBLE = 5;

type Item = CourseModule & {
  badge?: "check";
  outcomesLabel?: string;
};

/** Detect whether a module has the new arc-style quadrant content. */
function hasArcContent(item: Item) {
  return !!(item.judgement || item.insideTheWork || item.appliedInPractice || item.whatChanges);
}

/* ─── Arc design (new) ──────────────────────────────────────────────────── */

function ArcCard({
  label,
  side,
  heading,
  body,
  accent,
}: {
  label: string;
  side: string;
  heading: string;
  body?: string;
  accent: "blue" | "orange";
}) {
  const headColor = accent === "blue" ? "text-[#6EA8D8]" : "text-accent";
  return (
    <div className="flex flex-col gap-2 rounded-[10px] border border-[#2A2A2A] bg-[#111] p-5">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#555]">{label}</p>
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#555]">{side}</p>
      </div>
      <p className={`text-[15px] font-semibold leading-snug ${headColor}`}>{heading}</p>
      {body && <p className="mt-1 text-[13px] leading-[1.6] text-[#888]">{body}</p>}
    </div>
  );
}

function ArcPanel({ item, index, total, onPrev, onNext }: {
  item: Item;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col h-full rounded-[14px] border border-[#2A2A2A] bg-[#0D0D0D] p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          Phase {String(index + 1).padStart(2, "0")}
        </p>
        {item.phase && (
          <span className="rounded-full border border-[#3A3A3A] px-3 py-1 text-[11px] text-[#888]">
            {item.phase}
          </span>
        )}
      </div>

      <h3 className="mt-3 text-[clamp(1.25rem,2.2vw,1.75rem)] font-extrabold leading-tight tracking-tight text-white">
        {item.title}{item.subtitle ? ` ${item.subtitle}` : ""}
      </h3>

      {item.description && (
        <p className="mt-2 text-[14px] italic text-[#888] leading-[1.6]">{item.description}</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 flex-1">
        <ArcCard
          label="With the Legend"
          side="The Experience"
          heading="The Judgement"
          body={item.judgement}
          accent="blue"
        />
        <ArcCard
          label="With the Legend"
          side="The Experience"
          heading="Inside the Work"
          body={item.insideTheWork}
          accent="blue"
        />
        <ArcCard
          label="In Your Practice"
          side="The Transformation"
          heading="Applied in Your Practice"
          body={item.appliedInPractice}
          accent="orange"
        />
        <ArcCard
          label="In Your Practice"
          side="The Transformation"
          heading="What Changes"
          body={item.whatChanges}
          accent="orange"
        />
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[#2A2A2A] pt-4">
        <p className="text-[12px] tabular-nums text-[#555]">
          {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onPrev}
            disabled={index === 0}
            className="flex items-center gap-1.5 text-[13px] text-[#888] transition hover:text-white disabled:opacity-30"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Previous Phase
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={index === total - 1}
            className="flex items-center gap-1.5 text-[13px] text-[#888] transition hover:text-white disabled:opacity-30"
          >
            Next Phase <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ArcRoadmap({ items, title, subtitle }: { items: Item[]; title: string; subtitle: string }) {
  const [active, setActive] = useState(0);

  const hasLegendEdge = items.some((m) => m.type === "legend-edge");
  const hasTechnicalCore = items.some((m) => m.type === "technical-core");

  return (
    <section
      aria-labelledby="roadmap-title"
      className="mx-auto max-w-[1440px] px-5 py-16 sm:px-10 sm:py-24 lg:px-[120px]"
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-10 sm:mb-14">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent mb-2">
            Roadmap to Mastery
          </p>
          <h2
            id="roadmap-title"
            className="text-[clamp(1.75rem,3.4vw,2.875rem)] font-extrabold leading-tight tracking-[-0.015em] text-white"
          >
            {title}
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          <p className="max-w-[340px] text-[14px] leading-[1.6] text-[#888]">{subtitle}</p>
          {(hasLegendEdge || hasTechnicalCore) && (
            <div className="flex items-center gap-4 mt-1">
              {hasLegendEdge && (
                <span className="flex items-center gap-1.5 text-[12px] text-[#888]">
                  <span className="h-2 w-2 rounded-full bg-[#6EA8D8]" /> The Legend&apos;s Edge
                </span>
              )}
              {hasTechnicalCore && (
                <span className="flex items-center gap-1.5 text-[12px] text-[#888]">
                  <span className="h-2 w-2 rounded-full bg-accent" /> Technical Core
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Left sidebar */}
        <div className="lg:w-[38%] flex flex-col gap-0 border border-[#2A2A2A] rounded-[14px] overflow-hidden">
          {items.map((item, i) => {
            const isActive = i === active;
            const typeColor =
              item.type === "technical-core" ? "bg-accent" : "bg-[#6EA8D8]";
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`flex items-center gap-4 px-5 py-4 text-left transition border-b border-[#2A2A2A] last:border-b-0 ${
                  isActive
                    ? "bg-[#1D1D1D] border-l-[3px] border-l-accent"
                    : "bg-[#0D0D0D] hover:bg-[#161616] border-l-[3px] border-l-transparent"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold text-white ${
                    isActive ? "bg-accent" : typeColor + " opacity-60"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[14px] font-semibold leading-snug ${isActive ? "text-white" : "text-[#888]"}`}>
                    {item.title}
                  </span>
                  {item.subtitle && (
                    <span className="block text-[12px] text-[#555] mt-0.5">{item.subtitle}</span>
                  )}
                </span>
                {isActive && <ArrowRight className="h-4 w-4 shrink-0 text-accent" />}
              </button>
            );
          })}
        </div>

        {/* Right panel */}
        <div className="lg:flex-1">
          <ArcPanel
            item={items[active]}
            index={active}
            total={items.length}
            onPrev={() => setActive((v) => Math.max(0, v - 1))}
            onNext={() => setActive((v) => Math.min(items.length - 1, v + 1))}
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Legacy accordion design (fallback) ───────────────────────────────── */

function AccordionRoadmap({ items, title, subtitle }: { items: Item[]; title: string; subtitle: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(
    items[0]?.outcomes.length ? 0 : null,
  );
  const [showAll, setShowAll] = useState(false);

  const collapsible = items.length > VISIBLE;
  const collapsed = collapsible && !showAll;
  const rows = collapsed ? items.slice(0, VISIBLE) : items;
  let moduleNo = 0;

  return (
    <section
      aria-labelledby="roadmap-title"
      className="mx-auto max-w-[1440px] px-5 py-16 sm:px-10 sm:py-24 lg:px-[120px]"
    >
      <h2
        id="roadmap-title"
        className="text-[clamp(1.75rem,3.4vw,2.875rem)] font-extrabold leading-tight tracking-[-0.015em] text-white"
      >
        {title}
      </h2>
      <p className="mt-3 max-w-[420px] text-[15px] font-semibold leading-[1.45] text-[#A5A5A5]">
        {subtitle}
      </p>

      <div className="relative mt-10 sm:mt-14">
        <ul className="flex flex-col gap-[18px]">
          {rows.map((item, i) => {
            const expandable = item.outcomes.length > 0;
            const open = expandable && openIndex === i;
            const isCheck = item.badge === "check";
            if (!isCheck) moduleNo += 1;
            const label = isCheck ? null : String(moduleNo).padStart(2, "0");
            const panelId = `roadmap-panel-${i}`;
            const buttonId = `roadmap-button-${i}`;

            const head = (
              <>
                <span
                  aria-hidden
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-base font-semibold text-white sm:h-[49px] sm:w-[49px] sm:text-lg"
                >
                  {isCheck ? <Check className="h-5 w-5" /> : label}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold leading-snug text-white sm:text-2xl">
                    {item.title}
                  </span>
                  {item.description && (
                    <span className={`mt-2 block text-sm leading-[1.6] tracking-[0.01em] text-[#A5A5A5] sm:text-[15px] ${open || !expandable ? "" : "line-clamp-1"}`}>
                      {item.description}
                    </span>
                  )}
                </span>
                {expandable && (
                  <span
                    aria-hidden
                    className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/50 text-white transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </span>
                )}
              </>
            );

            const headCls = "flex w-full items-center gap-4 px-5 py-5 text-left sm:gap-[22px] sm:px-6 sm:py-6";

            return (
              <li
                key={`${item.title}-${i}`}
                className={`rounded-[12px] border-[1.5px] border-ink-700 transition-colors ${open ? "bg-ink-800" : "bg-[#1A1A1A]"}`}
              >
                <h3>
                  {expandable ? (
                    <button type="button" id={buttonId} aria-expanded={open} aria-controls={panelId} onClick={() => setOpenIndex(open ? null : i)} className={headCls}>
                      {head}
                    </button>
                  ) : (
                    <span className={headCls}>{head}</span>
                  )}
                </h3>
                {expandable && (
                  <div id={panelId} role="region" aria-labelledby={buttonId} className={`grid overflow-hidden transition-[grid-template-rows] duration-500 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="min-h-0">
                      <div className="px-5 pb-6 sm:pl-[95px] sm:pr-6">
                        <p className="text-sm text-[#A5A5A5] sm:text-[15px]">
                          {item.outcomesLabel ?? "By the end of this module, you'll be able to"}
                        </p>
                        <ul className="mt-4 flex flex-col gap-3">
                          {item.outcomes.map((o, j) => (
                            <li key={`${o}-${j}`} className="flex items-center gap-4 rounded-lg border border-[#4A4A4A] bg-ink-600 px-4 py-3 text-sm leading-snug text-white sm:min-h-12 sm:px-[25px] sm:py-2.5">
                              <Check aria-hidden className="h-4 w-4 shrink-0 text-white" />
                              {o}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {collapsed && (
          <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[280px] rounded-b-[12px] bg-[linear-gradient(to_top,#000_0%,#000_5.8%,rgba(0,0,0,0.5)_42.3%,rgba(76,76,76,0.07)_68.75%,rgba(255,255,255,0)_100%)]" />
        )}

        {collapsible && (
          <div className={collapsed ? "absolute inset-x-0 bottom-[30px] z-10 flex justify-center" : "mt-8 flex justify-center"}>
            <button type="button" onClick={() => setShowAll((v) => !v)} className="inline-flex h-12 items-center gap-2.5 rounded-[12px] bg-accent px-6 text-sm font-medium text-white transition hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950">
              {showAll ? "Show Less" : "Read More"}
              <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/60">
                <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${showAll ? "rotate-180" : ""}`} />
              </span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── Public export ─────────────────────────────────────────────────────── */

export function CourseRoadmap({
  items,
  title = "The Programme Arc",
  subtitle = "A structured journey from foundational knowledge to surgical confidence.",
}: {
  items: Item[];
  title?: string;
  subtitle?: string;
}) {
  if (items.length === 0) return null;

  return <ArcRoadmap items={items} title={title} subtitle={subtitle} />;
}
