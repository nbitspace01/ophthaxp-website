"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqItem = {
  q: string;
  a: string;
  cta?: { label: string; href: string };
  tag?: string;
  isPrompt?: boolean;
};

type PopupPosition = {
  top: number;
  left: number;
  width: number;
  above: boolean;
};

export function FaqGrid({ items, label }: { items: FaqItem[]; label: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [pos, setPos] = useState<PopupPosition | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const popupRef = useRef<HTMLDivElement | null>(null);

  const reposition = useCallback(
    (index: number) => {
      const card = cardRefs.current[index];
      const container = containerRef.current;
      if (!card || !container) return null;

      const cardRect = card.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      const spaceBelow = window.innerHeight - cardRect.bottom;
      const above = spaceBelow < 280 && cardRect.top > 280;

      const relTop = above
        ? cardRect.top - containerRect.top
        : cardRect.bottom - containerRect.top + 10;

      const maxW = cardRect.width;
      let relLeft = cardRect.left - containerRect.left;
      if (relLeft + maxW > containerRect.width) {
        relLeft = containerRect.width - maxW;
      }
      if (relLeft < 0) relLeft = 0;

      const p: PopupPosition = {
        top: relTop,
        left: relLeft,
        width: maxW,
        above,
      };
      setPos(p);
      return p;
    },
    [],
  );

  const open = useCallback(
    (index: number) => {
      reposition(index);
      setOpenIndex(index);
    },
    [reposition],
  );

  const close = useCallback(() => {
    setOpenIndex(null);
    setPos(null);
  }, []);

  const toggle = useCallback(
    (index: number) => {
      if (openIndex === index) {
        close();
      } else {
        open(index);
      }
    },
    [openIndex, open, close],
  );

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, close]);

  useEffect(() => {
    if (openIndex === null) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popupRef.current?.contains(target)) return;
      for (const btn of cardRefs.current) {
        if (btn?.contains(target)) return;
      }
      close();
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [openIndex, close]);

  useEffect(() => {
    if (openIndex !== null) {
      popupRef.current?.focus({ preventScroll: true });
    }
  }, [openIndex]);

  if (items.length === 0) return null;

  const card = openIndex !== null ? items[openIndex] : null;

  return (
    <div ref={containerRef} className="relative scroll-mt-28">
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {items.map((item, i) => (
          <div key={item.q} className="flex">
            <button
              type="button"
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              aria-expanded={i === openIndex}
              onClick={() => toggle(i)}
              className={cn(
                "group flex min-h-[112px] w-full flex-col justify-start gap-4 rounded-[18px] border p-5 text-left transition-colors duration-300 ease-out motion-reduce:transition-none sm:min-h-[128px] sm:p-6",
                item.isPrompt
                  ? "border-accent/40 bg-accent/10 hover:bg-accent/20"
                  : i === openIndex
                    ? "border-accent/50 bg-ink-700 ring-1 ring-accent/20"
                    : "border-white/10 bg-ink-800 hover:border-white/25 hover:bg-ink-700",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              )}
            >
              {item.tag ? (
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/35">
                  {item.tag}
                </span>
              ) : (
                <span aria-hidden className="h-[13px]" />
              )}

              <span className="flex w-full items-start justify-between gap-4">
                <span className="text-[15px] font-semibold leading-[24px] text-white sm:text-base sm:leading-[26px]">
                  {item.q}
                </span>

                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition",
                    i === openIndex
                      ? "border-accent/50 bg-accent/10 text-white"
                      : "border-white/15 text-white/60 group-hover:border-white/35 group-hover:text-white",
                  )}
                >
                  {i === openIndex ? (
                    <X className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </span>
              </span>
            </button>
          </div>
        ))}
      </div>

      {openIndex !== null && pos && card && (
        <div
          ref={popupRef}
          tabIndex={-1}
          role="region"
          aria-label={card.q}
          className={cn(
            "absolute z-50 overflow-hidden rounded-[18px] border border-accent/30 bg-gradient-to-b from-[#221C1A] via-[#171514] to-[#121111] shadow-2xl ring-1 ring-accent/15 focus:outline-none",
            "animate-fadeUp",
          )}
          style={{
            top: pos.above ? undefined : pos.top,
            bottom: pos.above
              ? `calc(100% - ${pos.top}px + 10px)`
              : undefined,
            left: pos.left,
            width: pos.width,
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -top-[100px] left-1/2 h-[200px] w-[320px] -translate-x-1/2 rounded-full bg-accent/25 blur-[90px]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"
          />

          <div className="relative max-h-[60vh] overflow-y-auto p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <span className="truncate rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-soft ring-1 ring-accent/25">
                {card.tag ?? "Question"}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Close answer"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-accent/10 text-white transition hover:border-accent hover:bg-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <X aria-hidden className="h-3.5 w-3.5" />
              </button>
            </div>

            <h3 className="mt-3.5 text-[17px] font-bold leading-[26px] text-white sm:text-[19px] sm:leading-[28px]">
              {card.q}
            </h3>

            <p className="mt-2.5 text-justify text-[14.5px] leading-[25px] text-white/75 sm:text-[15px] sm:leading-[26px]">
  {card.a}
</p>

            {card.cta && (
              <Link
                href={card.cta.href}
                className="mt-4 inline-flex w-fit items-center rounded-[10px] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep"
              >
                {card.cta.label}
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="sr-only">
        <h3>{label} — all questions and answers</h3>
        <dl>
          {items.map((entry) => (
            <div key={entry.q}>
              <dt>{entry.q}</dt>
              <dd>{entry.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
