"use client";

import { useState, useRef, useEffect } from "react";
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

/** Row divider: "WITH THE LEGEND ────────── THE EXPERIENCE" */
function RowDivider({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#777] shrink-0">{left}</span>
      <span className="flex-1 h-px bg-[#2A2A2A]" />
      <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#777] shrink-0">{right}</span>
    </div>
  );
}

function BlueCubeDecor() {
  const vx = 10, vy = 60;
  const cols = [70, 82, 94, 106, 118];
  const rows = [20, 33, 46, 60, 73, 86, 100];
  return (
    <svg viewBox="0 0 130 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 right-0 w-[130px] h-[120px] opacity-[0.18] group-hover:opacity-[0.38] transition-opacity duration-500 pointer-events-none">
      <style>{`
        @keyframes grid-scan { 0%{opacity:0.2} 50%{opacity:1} 100%{opacity:0.2} }
        @keyframes vp-pulse { 0%,100%{r:2;opacity:0.8} 50%{r:5;opacity:1} }
        .grid-scan { animation: grid-scan 2.5s ease-in-out infinite; animation-play-state: paused; }
        .vp-pulse { animation: vp-pulse 2s ease-in-out infinite; animation-play-state: paused; }
        .group:hover .grid-scan, .group:hover .vp-pulse { animation-play-state: running; }
      `}</style>
      {rows.map((y, i) => (
        <line key={`r${i}`} className="grid-scan" style={{ animationDelay: `${i * 0.12}s` }} x1={vx} y1={vy} x2={118} y2={y} stroke="#6EA8D8" strokeWidth="0.5"/>
      ))}
      {cols.map((x, i) => (
        <line key={`c${i}`} className="grid-scan" style={{ animationDelay: `${i * 0.15}s` }} x1={vx} y1={vy} x2={x} y2={rows[0]} stroke="#6EA8D8" strokeWidth="0.4"/>
      ))}
      {cols.map((x, i) => {
        const topY = vy + (rows[0] - vy) * (x - vx) / (118 - vx);
        const botY = vy + (rows[rows.length-1] - vy) * (x - vx) / (118 - vx);
        return <line key={`v${i}`} className="grid-scan" style={{ animationDelay: `${i * 0.1}s` }} x1={x} y1={topY} x2={x} y2={botY} stroke="#6EA8D8" strokeWidth="0.6"/>;
      })}
      {rows.map((y, i) => (
        <line key={`h${i}`} className="grid-scan" style={{ animationDelay: `${i * 0.08}s` }} x1={cols[0]} y1={vy + (y - vy) * (cols[0]-vx)/(118-vx)} x2={118} y2={y} stroke="#6EA8D8" strokeWidth="0.6"/>
      ))}
      <circle className="vp-pulse" cx={vx} cy={vy} r="2" fill="#6EA8D8" opacity="0.8"/>
    </svg>
  );
}

function OrangeRadialDecor() {
  const cx = 65, cy = 60, rays = 16;
  const lines = Array.from({ length: rays }, (_, i) => {
    const angle = (i / rays) * Math.PI * 2;
    const r1 = 18, r2 = i % 2 === 0 ? 52 : 40;
    return {
      x1: cx + Math.cos(angle) * r1, y1: cy + Math.sin(angle) * r1,
      x2: cx + Math.cos(angle) * r2, y2: cy + Math.sin(angle) * r2,
      op: i % 2 === 0 ? 1 : 0.5,
    };
  });
  return (
    <svg viewBox="0 0 130 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 right-0 w-[130px] h-[120px] opacity-[0.18] group-hover:opacity-[0.38] transition-opacity duration-500 pointer-events-none">
      <style>{`
        @keyframes radial-spin { to { transform: rotate(360deg); } }
        @keyframes core-beat { 0%,100%{opacity:0.9} 50%{opacity:1;r:8} }
        .radial-spin { transform-origin: 65px 60px; transform-box: fill-box; animation: radial-spin 10s linear infinite; animation-play-state: paused; }
        .core-beat { animation: core-beat 1.8s ease-in-out infinite; animation-play-state: paused; }
        .group:hover .radial-spin, .group:hover .core-beat { animation-play-state: running; }
      `}</style>
      <g className="radial-spin">
        <circle cx={cx} cy={cy} r="52" stroke="#C65F49" strokeWidth="0.5" opacity="0.35"/>
        <circle cx={cx} cy={cy} r="38" stroke="#C65F49" strokeWidth="0.5" opacity="0.4"/>
        <circle cx={cx} cy={cy} r="26" stroke="#C65F49" strokeWidth="0.6" opacity="0.5"/>
        <circle cx={cx} cy={cy} r="14" stroke="#C65F49" strokeWidth="0.7" opacity="0.6"/>
        {lines.map((l, i) => (
          <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#C65F49" strokeWidth="0.6" opacity={l.op}/>
        ))}
      </g>
      <circle className="core-beat" cx={cx} cy={cy} r="5" stroke="#C65F49" strokeWidth="1" opacity="0.9"/>
      <circle cx={cx} cy={cy} r="2" fill="#C65F49"/>
    </svg>
  );
}

function OrangeCircuitDecor() {
  return (
    <svg viewBox="0 0 130 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 right-0 w-[130px] h-[120px] opacity-[0.18] group-hover:opacity-[0.38] transition-opacity duration-500 pointer-events-none">
      <style>{`
        @keyframes trace-in { from { stroke-dashoffset: 300; } to { stroke-dashoffset: 0; } }
        @keyframes node-ping { 0%,100%{r:3.5;opacity:1} 50%{r:6;opacity:0.4} }
        .circuit-trace { stroke-dasharray: 300; stroke-dashoffset: 300; animation: trace-in 1.4s ease forwards; animation-play-state: paused; }
        .node-ping { animation: node-ping 2s ease-in-out infinite; animation-play-state: paused; }
        .group:hover .circuit-trace, .group:hover .node-ping { animation-play-state: running; }
      `}</style>
      <path className="circuit-trace" d="M10,30 L50,30 L60,20 L120,20" stroke="#C65F49" strokeWidth="0.8" style={{ animationDelay: '0s' }}/>
      <path className="circuit-trace" d="M10,55 L40,55 L50,45 L80,45 L90,55 L120,55" stroke="#C65F49" strokeWidth="0.8" style={{ animationDelay: '0.2s' }}/>
      <path className="circuit-trace" d="M10,80 L35,80 L45,70 L65,70 L75,80 L120,80" stroke="#C65F49" strokeWidth="0.8" style={{ animationDelay: '0.4s' }}/>
      <path className="circuit-trace" d="M10,100 L30,100 L40,90 L120,90" stroke="#C65F49" strokeWidth="0.6" style={{ animationDelay: '0.6s' }}/>
      <line className="circuit-trace" x1="50" y1="20" x2="50" y2="45" stroke="#C65F49" strokeWidth="0.7" style={{ animationDelay: '0.3s' }}/>
      <line className="circuit-trace" x1="80" y1="45" x2="80" y2="80" stroke="#C65F49" strokeWidth="0.7" style={{ animationDelay: '0.5s' }}/>
      <line className="circuit-trace" x1="35" y1="55" x2="35" y2="80" stroke="#C65F49" strokeWidth="0.7" style={{ animationDelay: '0.4s' }}/>
      <line className="circuit-trace" x1="100" y1="20" x2="100" y2="55" stroke="#C65F49" strokeWidth="0.5" style={{ animationDelay: '0.2s' }}/>
      {[[60,20],[90,55],[75,80],[50,45],[35,80],[80,45],[100,20],[40,90]].map(([x,y],i) => (
        <g key={i}>
          <circle className="node-ping" cx={x} cy={y} r="3.5" stroke="#C65F49" strokeWidth="0.8" fill="none" style={{ animationDelay: `${i * 0.2}s` }}/>
          <circle cx={x} cy={y} r="1.2" fill="#C65F49"/>
        </g>
      ))}
    </svg>
  );
}

function BlueConstellationDecor() {
  const nodes = [[105,18],[85,35],[115,50],[70,22],[95,65],[118,80],[75,55],[60,75],[110,95],[80,90]];
  const edges = [[0,1],[0,3],[1,2],[1,6],[2,4],[3,6],[4,5],[4,6],[5,8],[6,7],[7,9],[8,9],[2,5]];
  return (
    <svg viewBox="0 0 130 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 right-0 w-[130px] h-[120px] opacity-[0.18] group-hover:opacity-[0.38] transition-opacity duration-500 pointer-events-none">
      <style>{`
        @keyframes edge-flash { 0%{opacity:0.1} 50%{opacity:0.9} 100%{opacity:0.1} }
        @keyframes star-twinkle { 0%,100%{opacity:0.6} 50%{opacity:1;r:4} }
        @keyframes ripple { 0%{r:6;opacity:0.5} 100%{r:14;opacity:0} }
        .edge-flash { animation: edge-flash 2.5s ease-in-out infinite; animation-play-state: paused; }
        .star-twinkle { animation: star-twinkle 2s ease-in-out infinite; animation-play-state: paused; }
        .ripple { animation: ripple 1.8s ease-out infinite; animation-play-state: paused; }
        .group:hover .edge-flash, .group:hover .star-twinkle, .group:hover .ripple { animation-play-state: running; }
      `}</style>
      {edges.map(([a,b],i) => (
        <line key={i} className="edge-flash" style={{ animationDelay: `${i * 0.15}s` }} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#6EA8D8" strokeWidth="0.5"/>
      ))}
      {nodes.map(([x,y],i) => (
        <g key={i}>
          {i < 3 && <circle className="ripple" style={{ animationDelay: `${i * 0.5}s` }} cx={x} cy={y} r="6" stroke="#6EA8D8" strokeWidth="0.6" fill="none"/>}
          <circle className="star-twinkle" style={{ animationDelay: `${i * 0.2}s` }} cx={x} cy={y} r={i < 3 ? 3 : 1.8} fill="#6EA8D8" opacity={i < 3 ? 0.9 : 0.6}/>
        </g>
      ))}
    </svg>
  );
}

const decorMap = {
  judgement: <BlueCubeDecor />,
  insideTheWork: <OrangeRadialDecor />,
  appliedInPractice: <OrangeCircuitDecor />,
  whatChanges: <BlueConstellationDecor />,
};

function ArcCard({
  heading,
  body,
  accent,
  variant,
}: {
  heading: string;
  body?: string;
  accent: "blue" | "orange";
  variant: keyof typeof decorMap;
}) {
  const headColor = accent === "blue" ? "text-[#6EA8D8]" : "text-accent";
  return (
    <div className="group relative flex flex-col rounded-[10px] border border-[#2A2A2A] bg-[#111] p-5 min-h-[120px] overflow-hidden hover:border-[#3A3A3A] transition-colors duration-300">
      {decorMap[variant]}
      <p className={`relative z-10 text-[15px] font-semibold leading-snug ${headColor}`}>{heading}</p>
      {body && <p className="relative z-10 mt-2 text-[11px] leading-[1.65] text-[#e0e0e0] font-light">{body}</p>}
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
    <div className="flex flex-col bg-[#141618] p-6 sm:p-8 h-full">
      {/* Phase label + badge */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          Phase {String(index + 1).padStart(2, "0")}
        </p>
        {item.phase && (
          <span className="rounded-full border border-[#3A3A3A] px-3 py-1 text-[11px] text-[#bbb]">
            {item.phase}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="mt-3 text-[clamp(1.2rem,2vw,1.6rem)] font-extrabold leading-tight tracking-tight text-white">
        {item.title}{item.subtitle ? ` ${item.subtitle}` : ""}
      </h3>

      {/* Italic description */}
      {item.description && (
        <p className="mt-2 text-[13px] italic text-[#ccc] leading-[1.6]">{item.description}</p>
      )}

      {/* Top row — With the Legend */}
      <div className="mt-5">
        <RowDivider left="With the Legend" right="The Experience" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ArcCard heading="The Judgement" body={item.judgement} accent="blue" variant="judgement" />
          <ArcCard heading="Inside the Work" body={item.insideTheWork} accent="orange" variant="insideTheWork" />
        </div>
      </div>

      {/* Bottom row — In Your Practice */}
      <div className="mt-4">
        <RowDivider left="In Your Practice" right="The Transformation" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ArcCard heading="Applied in Your Practice" body={item.appliedInPractice} accent="orange" variant="appliedInPractice" />
          <ArcCard heading="What Changes" body={item.whatChanges} accent="blue" variant="whatChanges" />
        </div>
      </div>

      {/* Footer nav */}
      <div className="mt-6 flex items-center justify-between border-t border-[#2A2A2A] pt-4">
        <p className="text-[12px] tabular-nums text-[#888]">
          {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </p>
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={onPrev}
            disabled={index === 0}
            className="flex items-center gap-1.5 text-[13px] text-[#aaa] transition hover:text-white disabled:opacity-30"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-accent" /> Previous Phase
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={index === total - 1}
            className="flex items-center gap-1.5 text-[13px] text-[#aaa] transition hover:text-white disabled:opacity-30"
          >
            Next Phase <ArrowRight className="h-3.5 w-3.5 text-accent" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ArcRoadmap({ items, title, subtitle }: { items: Item[]; title: string; subtitle: string }) {
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => {
      if (panelRef.current && sidebarRef.current) {
        sidebarRef.current.style.maxHeight = `${panelRef.current.offsetHeight}px`;
      }
    };
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [active]);

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
            className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-tight tracking-[-0.02em] text-white"
          >
            {title}
          </h2>
        </div>
        <div className="flex flex-col gap-2">
          <p className="max-w-[340px] text-[14px] leading-[1.6] text-[#bbb]">{subtitle}</p>
          <div className="flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1.5 text-[12px] text-[#bbb]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#4A90D9]" style={{ boxShadow: "0 0 6px 2px rgba(74,144,217,0.55)" }} /> The Legend&apos;s Edge
            </span>
            <span className="flex items-center gap-1.5 text-[12px] text-[#bbb]">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" style={{ boxShadow: "0 0 6px 2px rgba(183,90,68,0.6)" }} /> Technical Core
            </span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row lg:items-start border border-[#1C1C1C] rounded-[4px] overflow-hidden">
        {/* Left sidebar — timeline list, scrollable when many items */}
        <div ref={sidebarRef} className="lg:w-[33%] flex flex-col bg-[#050505] border-r border-[#1C1C1C] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item, i) => {
            const isActive = i === active;
            const isLegend = item.type === "legend-edge";
            const isCore = item.type === "technical-core";
            const isLast = i === items.length - 1;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={`relative flex items-start gap-0 text-left transition-colors ${
                  isActive
                    ? "bg-[#1A100D]"
                    : "bg-transparent hover:bg-[#0D0D0D]"
                } ${!isLast ? "border-b border-[#1A1A1A]" : ""}`}
              >
                {/* Left coral border for active */}
                <span
                  className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all ${
                    isActive ? "bg-[#C65F49]" : "bg-transparent"
                  }`}
                />

                {/* Timeline column: vertical line + circle */}
                <span className="relative flex flex-col items-center self-stretch pl-5 pr-4 py-[18px]">
                  {/* Vertical line above circle */}
                  {i !== 0 && (
                    <span className={`absolute top-0 left-[calc(20px+14px)] w-px bottom-1/2 ${i <= active ? "bg-[#C65F49]" : "bg-[#222]"}`} />
                  )}
                  {/* Vertical line below circle */}
                  {!isLast && (
                    <span className={`absolute top-1/2 left-[calc(20px+14px)] w-px bottom-0 ${i < active ? "bg-[#C65F49]" : "bg-[#222]"}`} />
                  )}
                  {/* Number circle */}
                  <span
                    className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all ${
                      isActive
                        ? "bg-[#C65F49] text-white shadow-[0_0_8px_rgba(198,95,73,0.5)]"
                        : "border border-[#2E2E2E] text-[#484848] bg-[#050505]"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>

                {/* Title + subtitle */}
                <span className="min-w-0 flex-1 py-[18px]">
                  <span
                    className={`block text-[13.5px] leading-snug transition-colors ${
                      isActive
                        ? "font-semibold text-white"
                        : "font-normal text-[#ccc]"
                    }`}
                  >
                    {item.title}
                  </span>
                  {item.subtitle && (
                    <span
                      className={`block text-[12px] mt-[3px] leading-snug transition-colors ${
                        isActive ? "text-[#ddd]" : "text-[#aaa]"
                      }`}
                    >
                      {item.subtitle}
                    </span>
                  )}
                </span>

                {/* Right icon — dynamic from phase text */}
                <span className="shrink-0 flex items-center self-center pr-4 pl-2">
                  {(() => {
                    const p = (item.phase ?? "").toLowerCase();
                    const iconCls = `transition-colors ${isActive ? "text-white" : "text-[#2E2E2E]"}`;
                    if (p.includes("in person") || p.includes("in-person")) {
                      // Airplane — pointing right toward content
                      return (
                        <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] rotate-90 ${iconCls}`} fill="currentColor">
                          <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/>
                        </svg>
                      );
                    }
                    if (p.includes("online") || p.includes("virtual") || p.includes("recorded") || p.includes("video")) {
                      // Video / record icon — online session
                      return (
                        <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] ${iconCls}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.723v6.554a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/>
                        </svg>
                      );
                    }
                    // Default — checkmark tick
                    return (
                      <svg viewBox="0 0 24 24" className={`h-[18px] w-[18px] ${iconCls}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    );
                  })()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right panel */}
        <div ref={panelRef} className="lg:flex-1">
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
  durationMonths,
  title = "The Programme Arc",
  subtitle = "A 12-Month journey that transforms how you observe, decide, operate and build a cornea practice.",
}: {
  items: Item[];
  durationMonths?: number;
  title?: string;
  subtitle?: string;
}) {
  // "Real" modules = at least one item has a description, subtitle, or quadrant content.
  // Titles-only leftover records don't count — fall through to duration-based generation.
  const hasRealModules =
    items.length > 0 &&
    items.some(
      (m) => m.description || m.subtitle || m.judgement || m.insideTheWork || m.appliedInPractice || m.whatChanges,
    );

  // If any module has arc content, drop title-only placeholders that have none.
  const anyArcContent = items.some(
    (m) => m.judgement || m.insideTheWork || m.appliedInPractice || m.whatChanges,
  );
  const filteredItems = anyArcContent
    ? items.filter((m) => m.judgement || m.insideTheWork || m.appliedInPractice || m.whatChanges)
    : items;

  const resolved: Item[] = hasRealModules
    ? filteredItems
    : durationMonths && durationMonths > 0
    ? Array.from({ length: durationMonths }, (_, i) => ({
        title: `Month ${i + 1}`,
        description: "",
        outcomes: [],
      }))
    : [];

  if (resolved.length === 0) return null;

  return <ArcRoadmap items={resolved} title={title} subtitle={subtitle} />;
}
