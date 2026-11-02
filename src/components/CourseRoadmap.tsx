"use client";

import { useState } from "react";
import { Check, ChevronDown, ArrowLeft, ArrowRight } from "lucide-react";
import type { CourseModule } from "@/types";

const VISIBLE = 5;

type Item = CourseModule & {
  badge?: "check";
  outcomesLabel?: string;
};

/* ─── CSS injected once at section level ────────────────────────────────── */
const ARC_CSS = `
  @keyframes panelin { from{opacity:.4;transform:translateX(8px)} to{opacity:1;transform:none} }
  @keyframes phaseEdgeReveal { 0%{opacity:0;transform:rotate(-7deg)} 60%{opacity:.72} 100%{opacity:.58;transform:rotate(0)} }

  .phase-wire {
    position:absolute; z-index:2; right:-2px; bottom:2px;
    width:56%; height:92%; opacity:.25;
    mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.26) 18%,#000 48%,#000 100%);
    -webkit-mask-image:linear-gradient(90deg,transparent 0%,rgba(0,0,0,.26) 18%,#000 48%,#000 100%);
    transition:opacity .5s,transform .65s cubic-bezier(.22,.61,.36,1),filter .5s;
  }
  .phase-tile-blue  .phase-wire { color:#4b96db }
  .phase-tile-orange .phase-wire { color:#c8644b }
  .phase-wire path, .phase-wire circle { vector-effect:non-scaling-stroke }
  .phase-wire .wire-grid            { opacity:.20; stroke-width:.34; stroke-dasharray:1 4 }
  .phase-wire .wire-grid-perspective { opacity:.24; stroke-dasharray:1 3.2 }
  .phase-wire .wire-rays            { opacity:.25; stroke-width:.42 }
  .phase-wire .wire-surface,
  .phase-wire .wire-layers,
  .phase-wire .wire-blocks,
  .phase-wire .wire-curves          { opacity:.72; stroke-width:.62 }
  .phase-wire .wire-detail          { opacity:.48; stroke-width:.46 }
  .phase-wire .wire-guides          { opacity:.24; stroke-width:.40; stroke-dasharray:2 4.5 }

  .phase-tile:hover .phase-wire {
    opacity:.52;
    filter:drop-shadow(0 0 5px color-mix(in srgb,currentColor 28%,transparent));
    transform:scale(1.018) translate(-2px,-1px);
  }

  .phase-tile {
    --tile-accent:#666;
    position:relative; overflow:hidden; min-width:0; isolation:isolate;
    height:145px; padding:17px 14px;
    border:1px solid rgba(111,115,118,.25); border-radius:4px;
    background:radial-gradient(circle at 83% 51%,rgba(255,255,255,.025),transparent 43%),
               linear-gradient(145deg,rgba(19,22,23,.97),rgba(10,12,13,.99));
    box-shadow:inset 0 1px 0 rgba(255,255,255,.018);
    transition:transform .38s cubic-bezier(.22,.61,.36,1),
               border-color .45s, background .45s, box-shadow .45s;
  }
  .phase-tile-blue   { --tile-accent:#4b96db }
  .phase-tile-orange { --tile-accent:#c8644b }

  .phase-tile:before {
    content:""; position:absolute; z-index:5; inset:-1px; border-radius:5px; padding:1px;
    background:conic-gradient(from 220deg,transparent 0 22%,var(--tile-accent) 34%,transparent 48% 72%,var(--tile-accent) 84%,transparent 96%);
    opacity:0; pointer-events:none;
    -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
    -webkit-mask-composite:xor;
    mask-composite:exclude;
    transition:opacity .5s ease;
  }
  .phase-tile:after {
    content:""; position:absolute; inset:0;
    background:linear-gradient(90deg,rgba(10,12,13,.94) 0%,rgba(10,12,13,.76) 47%,rgba(10,12,13,.19) 72%,transparent 100%);
    pointer-events:none; z-index:1;
  }

  .phase-tile:hover {
    transform:translateY(-2px);
    border-color:rgba(116,118,120,.18);
    background:radial-gradient(circle at 83% 51%,color-mix(in srgb,var(--tile-accent) 6%,transparent),transparent 45%),
               linear-gradient(145deg,rgba(23,27,29,.99),rgba(12,14,15,.99));
    box-shadow:0 14px 28px rgba(0,0,0,.24),inset 0 0 22px color-mix(in srgb,var(--tile-accent) 4%,transparent);
  }
  .phase-tile:hover:before {
    opacity:.62;
    animation:phaseEdgeReveal 1.1s cubic-bezier(.22,.61,.36,1) both;
  }
`;

/* ─── Exact SVG wires from sample site ──────────────────────────────────── */

function WireJudgement() {
  return (
    <svg className="phase-wire" viewBox="0 0 240 140" aria-hidden="true">
      <defs>
        <linearGradient id="judgementPlane" x1="0" x2="1">
          <stop stopColor="currentColor" stopOpacity=".03"/>
          <stop offset="1" stopColor="currentColor" stopOpacity=".2"/>
        </linearGradient>
      </defs>
      <g className="wire-grid" fill="none" stroke="currentColor">
        <path d="M8 18h210M8 38h210M8 58h210M8 78h210M8 98h210M8 118h210"/>
        <path d="M24 6v128M48 6v128M72 6v128M96 6v128M120 6v128M144 6v128M168 6v128M192 6v128M216 6v128"/>
      </g>
      <g className="wire-rays" fill="none" stroke="currentColor">
        <path d="M6 12 154 70M6 25 154 70M6 39 154 70M6 54 154 70M6 70h148M6 86 154 70M6 101 154 70M6 115 154 70M6 128 154 70"/>
        <path d="M28 8 154 70M52 8l102 62M78 8l76 62M28 132l126-62M52 132l102-62M78 132l76-62"/>
      </g>
      <path className="wire-surface" d="m162 41 60-31v120l-60-27Z" fill="url(#judgementPlane)" stroke="currentColor"/>
      <g className="wire-detail" fill="none" stroke="currentColor">
        <path d="M162 57 222 31M162 73l60-20M162 88l60-13M178 33v77M194 25v92M210 17v106"/>
        <circle cx="154" cy="70" r="2.5" fill="currentColor" stroke="none"/>
      </g>
    </svg>
  );
}

function WireWork() {
  return (
    <svg className="phase-wire" viewBox="0 0 240 140" aria-hidden="true">
      <defs>
        <linearGradient id="workLayer" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="currentColor" stopOpacity=".16"/>
          <stop offset="1" stopColor="currentColor" stopOpacity=".02"/>
        </linearGradient>
      </defs>
      <g className="wire-grid wire-grid-perspective" fill="none" stroke="currentColor">
        <path d="M20 127h205M35 112h174M50 97h143M65 82h112M80 67h81M95 52h50"/>
        <path d="M20 127 120 43M55 127l65-84M90 127l30-84M125 127l-5-84M160 127l-40-84M195 127l-75-84M225 127 120 43"/>
      </g>
      <g className="wire-layers" stroke="currentColor">
        <path d="m120 13 70 27-70 27-70-27Z" fill="url(#workLayer)"/>
        <path d="m120 34 70 27-70 27-70-27Z" fill="url(#workLayer)"/>
        <path d="m120 55 70 27-70 27-70-27Z" fill="url(#workLayer)"/>
        <path d="m120 76 70 27-70 27-70-27Z" fill="url(#workLayer)"/>
      </g>
      <g className="wire-guides" fill="none" stroke="currentColor">
        <path d="M50 40v63M190 40v63M120 13v117"/>
        <path d="M73 31v63M167 31v63M96 22v63M144 22v63"/>
      </g>
      <g className="wire-detail" fill="none" stroke="currentColor">
        <path d="m80 40 40-15 40 15-40 15Z"/>
        <path d="M100 33v14m40-14v14M80 40h80"/>
      </g>
    </svg>
  );
}

function WirePractice() {
  return (
    <svg className="phase-wire" viewBox="0 0 240 140" aria-hidden="true">
      <defs>
        <linearGradient id="practiceFace" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="currentColor" stopOpacity=".18"/>
          <stop offset="1" stopColor="currentColor" stopOpacity=".025"/>
        </linearGradient>
      </defs>
      <g className="wire-grid wire-grid-perspective" fill="none" stroke="currentColor">
        <path d="M10 128h220M28 112h184M46 96h148M64 80h112M82 64h76M100 48h40"/>
        <path d="M10 128 120 42M45 128l75-86M80 128l40-86M115 128l5-86M150 128l-30-86M185 128l-65-86M220 128 120 42"/>
      </g>
      <g className="wire-blocks" stroke="currentColor">
        <path d="m27 105 27-14 27 14-27 14Z" fill="url(#practiceFace)"/>
        <path d="M27 86v19l27 14V100ZM54 100l27-14v19l-27 14Z" fill="url(#practiceFace)"/>
        <path d="m76 85 34-18 34 18-34 18Z" fill="url(#practiceFace)"/>
        <path d="M76 48v37l34 18V67ZM110 67l34-19v37l-34 18Z" fill="url(#practiceFace)"/>
        <path d="m132 50 40-21 40 21-40 21Z" fill="url(#practiceFace)"/>
        <path d="M132 7v43l40 21V29ZM172 29l40-22v43l-40 21Z" fill="url(#practiceFace)"/>
      </g>
      <g className="wire-guides" fill="none" stroke="currentColor">
        <path d="M27 86V36M81 86V26M76 48V15M144 48V8M132 7h80"/>
      </g>
      <g className="wire-detail" fill="none" stroke="currentColor">
        <path d="M54 91V61M110 67V30M172 29V3"/>
        <path d="m49 68 5-7 5 7M105 37l5-7 5 7M167 10l5-7 5 7"/>
      </g>
    </svg>
  );
}

function WireChange() {
  return (
    <svg className="phase-wire" viewBox="0 0 240 140" aria-hidden="true">
      <defs>
        <linearGradient id="changeWash" x1="0" y1="1" x2="1" y2="0">
          <stop stopColor="currentColor" stopOpacity="0"/>
          <stop offset="1" stopColor="currentColor" stopOpacity=".14"/>
        </linearGradient>
      </defs>
      <g className="wire-grid" fill="none" stroke="currentColor">
        <path d="M12 124h218M12 104h218M12 84h218M12 64h218M12 44h218M12 24h218"/>
        <path d="M34 12v112M62 12v112M90 12v112M118 12v112M146 12v112M174 12v112M202 12v112M230 12v112"/>
      </g>
      <path d="M12 124c45 0 64-2 89-27 25-25 42-70 129-87v114Z" fill="url(#changeWash)"/>
      <g className="wire-curves" fill="none" stroke="currentColor">
        <path d="M12 120c42 0 61-1 88-20 34-24 48-67 130-86"/>
        <path d="M12 112c39 0 59 1 86-16 35-22 57-55 132-75"/>
        <path d="M12 103c36 0 55 3 83-11 39-19 65-43 135-64"/>
        <path d="M12 94c31 0 51 5 80-6 42-16 73-33 138-53"/>
        <path d="M12 84c29 1 48 6 77-1 45-11 81-23 141-41"/>
        <path d="M41 118v-20M70 111V86M100 99V68M130 77V48M160 52V31M190 31V18M220 18V9"/>
        <path d="M25 117c44-1 61-3 85-25 29-27 46-61 118-78" opacity=".56"/>
        <path d="M25 108c39 0 58-1 84-20 31-23 53-51 119-68" opacity=".48"/>
      </g>
    </svg>
  );
}

/* ─── Engagement icon (dynamic — flight for in-person, video for online) ─── */

function TypeIcon({ phase }: { phase?: string }) {
  const p = (phase ?? "").toLowerCase();
  const isInPerson = p.includes("in person") || p.includes("in-person") || p.includes("clinic") || p.includes("hands-on");
  if (isInPerson) {
    // Flight / airplane icon — in-person session
    return (
      <svg viewBox="0 0 24 24" style={{ width: 11, height: 11 }} fill="currentColor">
        <path transform="rotate(90 12 12)" d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    );
  }
  // Video / play icon — online / recorded session
  return (
    <svg viewBox="0 0 24 24" style={{ width: 11, height: 11 }} fill="currentColor">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
    </svg>
  );
}

/* ─── Phase tile ─────────────────────────────────────────────────────────── */

function ArcCard({
  heading,
  body,
  accent,
  wire,
}: {
  heading: string;
  body?: string;
  accent: "blue" | "orange";
  wire: React.ReactNode;
}) {
  const cls = accent === "blue" ? "phase-tile phase-tile-blue" : "phase-tile phase-tile-orange";
  const headColor = accent === "blue" ? "#5f9ddd" : "#cf725b";
  return (
    <article className={cls}>
      {wire}
      <div className="phase-tile-copy absolute z-[3] left-[14px] top-0 bottom-0 flex flex-col justify-center" style={{ width: "64%" }}>
        <h4 className="font-serif leading-[1.12] m-0 mb-[9px] whitespace-nowrap"
          style={{ fontSize: 16.5, fontWeight: 550, color: headColor }}>
          {heading}
        </h4>
        {body && (
          <p className="m-0 leading-[1.48] text-[#b3b3b7]" style={{ fontSize: 10.5 }}>{body}</p>
        )}
      </div>
    </article>
  );
}

/* ─── Phase axis divider ────────────────────────────────────────────────── */

function PhaseAxis({ left, right }: { left: string; right: string }) {
  return (
    <div className="phase-axis grid items-center" style={{
      gridTemplateColumns: "auto minmax(28px,1fr) auto",
      gap: 12, color: "#b8b8bb", fontSize: 8, fontWeight: 650,
      letterSpacing: ".24em", whiteSpace: "nowrap",
    }}>
      <span>{left}</span>
      <i className="block h-px" style={{ background: "linear-gradient(90deg,#57575b,#252527)" }}/>
      <span>{right}</span>
    </div>
  );
}

/* ─── Right detail panel (desktop — sticky 570 px) ─────────────────────── */

function ArcPanel({
  item, index, total, onPrev, onNext, animKey,
}: {
  item: Item; index: number; total: number;
  onPrev: () => void; onNext: () => void; animKey: number;
}) {
  return (
    <div
      key={animKey}
      className="hidden lg:grid overflow-hidden border border-[#292929]"
      style={{
        position: "sticky", top: 104,
        height: 570, minHeight: 570,
        padding: "24px 28px 18px",
        background: "radial-gradient(circle at 84% 16%,rgba(72,116,151,.045),transparent 31%),linear-gradient(145deg,#151718,#101111 72%)",
        gridTemplateRows: "24px 62px 36px 24px 145px 24px 145px 66px",
        animation: "panelin .35s ease both",
      }}
    >
      {/* Row 1 — eyebrow + badge */}
      <div className="flex items-center justify-between">
        <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.18em] text-accent">
          Phase {String(index + 1).padStart(2, "0")}
        </p>
        {item.phase && (
          <span className="text-[10px] text-[#a5a5a8]"
            style={{ border: "1px solid #343434", borderRadius: 20, padding: "7px 11px" }}>
            {item.phase}
          </span>
        )}
      </div>

      {/* Row 2 — phase title */}
      <h3 className="font-serif m-0 flex items-center overflow-hidden"
        style={{ fontSize: 29, lineHeight: 1.08, fontWeight: 550 }}>
        {item.title}{item.subtitle ? ` ${item.subtitle}` : ""}
      </h3>

      {/* Row 3 — italic description */}
      <p className="font-serif italic m-0 p-0 flex items-center overflow-hidden text-[#aaa8aa]"
        style={{ fontSize: 14, lineHeight: 1.35, transform: "translateY(-1.5px)" }}>
        {item.description ?? ""}
      </p>

      {/* Row 4 */}
      <PhaseAxis left="WITH THE LEGEND" right="THE EXPERIENCE" />

      {/* Row 5 — top tiles */}
      <div className="grid grid-cols-2 gap-4">
        <ArcCard heading="The Judgement"   body={item.judgement}      accent="blue"   wire={<WireJudgement/>}/>
        <ArcCard heading="Inside the Work" body={item.insideTheWork}  accent="orange" wire={<WireWork/>}/>
      </div>

      {/* Row 6 */}
      <PhaseAxis left="IN YOUR PRACTICE" right="THE TRANSFORMATION" />

      {/* Row 7 — bottom tiles */}
      <div className="grid grid-cols-2 gap-4">
        <ArcCard heading="Applied in Your Practice" body={item.appliedInPractice} accent="orange" wire={<WirePractice/>}/>
        <ArcCard heading="What Changes"             body={item.whatChanges}       accent="blue"   wire={<WireChange/>}/>
      </div>

      {/* Row 8 — footer */}
      <div className="flex items-center justify-between border-t border-[#303030]"
        style={{ paddingTop: 22, fontSize: 11, color: "#747478" }}>
        <p className="m-0 tabular-nums text-[12px] text-[#888]">
          {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </p>
        <div className="flex items-center gap-5">
          <button type="button" onClick={onPrev} disabled={index === 0}
            className="flex items-center gap-1.5 border-0 bg-transparent text-[13px] font-bold text-[#e8e8ea] transition hover:text-white disabled:opacity-30">
            <ArrowLeft className="h-3.5 w-3.5 text-accent" /> Previous
          </button>
          <button type="button" onClick={onNext} disabled={index === total - 1}
            className="flex items-center gap-1.5 border-0 bg-transparent text-[13px] font-bold text-[#e8e8ea] transition hover:text-white disabled:opacity-30">
            Next <ArrowRight className="h-3.5 w-3.5 text-accent" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Mobile panel ──────────────────────────────────────────────────────── */

function ArcPanelMobile({
  item, index, total, onPrev, onNext,
}: {
  item: Item; index: number; total: number;
  onPrev: () => void; onNext: () => void;
}) {
  return (
    <div className="flex flex-col bg-[#141618] p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.18em] text-accent">
          Phase {String(index + 1).padStart(2, "0")}
        </p>
        {item.phase && (
          <span className="rounded-full border border-[#3A3A3A] px-3 py-1 text-[11px] text-[#bbb]">
            {item.phase}
          </span>
        )}
      </div>
      <h3 className="font-serif mt-3 text-[26px] leading-[1.1] text-white" style={{ fontWeight: 550 }}>
        {item.title}{item.subtitle ? ` ${item.subtitle}` : ""}
      </h3>
      {item.description && (
        <p className="font-serif italic mt-2 text-[13px] text-[#aaa8aa] leading-[1.6]">{item.description}</p>
      )}
      <div className="mt-5">
        <PhaseAxis left="WITH THE LEGEND" right="THE EXPERIENCE" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-3">
          <ArcCard heading="The Judgement"   body={item.judgement}     accent="blue"   wire={<WireJudgement/>}/>
          <ArcCard heading="Inside the Work" body={item.insideTheWork} accent="orange" wire={<WireWork/>}/>
        </div>
      </div>
      <div className="mt-4">
        <PhaseAxis left="IN YOUR PRACTICE" right="THE TRANSFORMATION" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mt-3">
          <ArcCard heading="Applied in Your Practice" body={item.appliedInPractice} accent="orange" wire={<WirePractice/>}/>
          <ArcCard heading="What Changes"             body={item.whatChanges}       accent="blue"   wire={<WireChange/>}/>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-[#2A2A2A] pt-4">
        <p className="m-0 text-[12px] tabular-nums text-[#888]">
          {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
        </p>
        <div className="flex items-center gap-5">
          <button type="button" onClick={onPrev} disabled={index === 0}
            className="flex items-center gap-1.5 text-[13px] text-[#aaa] transition hover:text-white disabled:opacity-30">
            <ArrowLeft className="h-3.5 w-3.5 text-accent" /> Prev
          </button>
          <button type="button" onClick={onNext} disabled={index === total - 1}
            className="flex items-center gap-1.5 text-[13px] text-[#aaa] transition hover:text-white disabled:opacity-30">
            Next <ArrowRight className="h-3.5 w-3.5 text-accent" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Arc roadmap ───────────────────────────────────────────────────────── */

function ArcRoadmap({ items, title, subtitle }: { items: Item[]; title: string; subtitle: string }) {
  const [active, setActive] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  function select(i: number) {
    setActive(i);
    setAnimKey((k) => k + 1);
  }

  return (
    <section aria-labelledby="roadmap-title" className="w-full pt-[42px] pb-[42px]"
      style={{ paddingLeft: "clamp(24px,8.34vw,120px)", paddingRight: "clamp(24px,8.34vw,120px)" }}>
      <style dangerouslySetInnerHTML={{ __html: ARC_CSS }} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10">
        <div style={{ maxWidth: 720 }}>
          <p className="m-0 mb-4 text-[11px] font-extrabold uppercase tracking-[0.18em] text-accent">
            Roadmap to Mastery
          </p>
          <h2 id="roadmap-title" className="font-serif m-0 text-white"
            style={{ fontSize: 46, lineHeight: 1.17, fontWeight: 500, letterSpacing: "-.035em" }}>
            {title}
          </h2>
        </div>
        <div style={{ width: "min(410px,100%)" }} className="mt-6 sm:mt-0">
          <p className="m-0 text-[14px] leading-[1.65] text-[#a9a9ad]">{subtitle}</p>
          <div className="flex items-center gap-[25px] mt-[18px] text-[11px] text-[#b8b8bc]">
            <span className="inline-flex items-center gap-[9px] whitespace-nowrap">
              <i style={{ width:12,height:12,borderRadius:"50%",background:"#469cf2",boxShadow:"0 0 16px #469cf2",display:"inline-block" }}/>
              The Legend&apos;s Edge
            </span>
            <span className="inline-flex items-center gap-[9px] whitespace-nowrap">
              <i style={{ width:12,height:12,borderRadius:"50%",background:"#e66f50",boxShadow:"0 0 16px #e66f50",display:"inline-block" }}/>
              Technical Core
            </span>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:grid lg:items-start lg:min-h-[600px]"
        style={{ gridTemplateColumns: "350px minmax(0,1fr)", gap: "clamp(28px,3vw,46px)" }}>

        {/* Left nav */}
        <div className="relative lg:min-h-[600px] overflow-hidden">
          {/* Vertical progress line */}
          <span className="hidden lg:block absolute"
            style={{ left:32, top:37, width:1, height:814, background:"#292929", zIndex:0 }}>
            <span style={{
              display:"block", width:1,
              height: items.length > 1 ? `${(active / (items.length - 1)) * 100}%` : "0%",
              background:"linear-gradient(#d07a61 0%,#c66b59 62%,#75a9c9 100%)",
              boxShadow:"0 0 10px rgba(183,90,68,.35)",
              transition:"height .5s cubic-bezier(.22,.61,.36,1)",
            }}/>
          </span>

          <div className="relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-t border-[#292929] pl-[8px] lg:max-h-[600px] lg:overflow-y-auto">
            {items.map((item, i) => {
              const isActive = i === active;
              return (
                <button key={i} type="button" onClick={() => select(i)}
                  className="relative w-full text-left grid transition-all"
                  style={{
                    zIndex:1, minHeight:74, padding:12,
                    gridTemplateColumns:"48px 1fr 24px",
                    gridTemplateRows:"auto auto",
                    columnGap:8, rowGap:2,
                    background: isActive
                      ? "linear-gradient(90deg,rgba(183,90,68,.14),rgba(183,90,68,.045) 54%,transparent)"
                      : "transparent",
                    borderTop:    isActive ? "1px solid rgba(145,110,99,.2)"   : "1px solid #292929",
                    borderRight:  isActive ? "1px solid rgba(120,120,120,.16)" : "1px solid transparent",
                    borderBottom: isActive ? "1px solid rgba(145,110,99,.22)"  : "1px solid transparent",
                    borderLeft:   isActive ? "3px solid #cf6c51"               : "3px solid transparent",
                  }}
                >
                  <span className="row-span-2 self-center flex items-center justify-center text-[11px] font-bold transition-all"
                    style={{
                      width:25, height:25, borderRadius:"50%",
                      border: isActive ? "1px solid #b75a44" : "1px solid #3c3d3b",
                      background: isActive ? "#b75a44" : "#050505",
                      color: isActive ? "#fff" : "#777",
                    }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <b className="font-serif self-end leading-[1.34] tracking-[0.002em] not-italic transition-colors"
                    style={{ fontSize:13.5, fontWeight:500, color: isActive ? "#fff" : "#d9d7d2", alignSelf:"end" }}>
                    {item.title}
                  </b>

                  <span className="row-span-2 self-center flex items-center justify-center rounded-full transition-all"
                    style={{
                      width:20, height:20,
                      border: isActive ? "1px solid #684036" : "1px solid #343434",
                      background: isActive ? "#1d1513" : "#101010",
                      color: isActive ? "#c47764" : "#777",
                    }}>
                    <TypeIcon phase={item.phase}/>
                  </span>

                  {item.subtitle && (
                    <small className="font-serif not-italic leading-[1.34] tracking-[0.002em] transition-colors"
                      style={{ fontSize:13.5, fontWeight:500, color: isActive ? "#9a999d" : "#858589", alignSelf:"start" }}>
                      {item.subtitle}
                    </small>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop panel */}
        <ArcPanel
          item={items[active]} index={active} total={items.length}
          onPrev={() => select(Math.max(0, active - 1))}
          onNext={() => select(Math.min(items.length - 1, active + 1))}
          animKey={animKey}
        />

        {/* Mobile panel */}
        <div className="lg:hidden">
          <ArcPanelMobile
            item={items[active]} index={active} total={items.length}
            onPrev={() => select(Math.max(0, active - 1))}
            onNext={() => select(Math.min(items.length - 1, active + 1))}
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Legacy accordion (fallback) ───────────────────────────────────────── */

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
    <section aria-labelledby="roadmap-title"
      className="mx-auto max-w-[1440px] px-5 py-16 sm:px-10 sm:py-24 lg:px-[120px]">
      <h2 id="roadmap-title"
        className="text-[clamp(1.75rem,3.4vw,2.875rem)] font-extrabold leading-tight tracking-[-0.015em] text-white">
        {title}
      </h2>
      <p className="mt-3 max-w-[420px] text-[15px] font-semibold leading-[1.45] text-[#A5A5A5]">{subtitle}</p>

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
                <span aria-hidden
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-base font-semibold text-white sm:h-[49px] sm:w-[49px] sm:text-lg">
                  {isCheck ? <Check className="h-5 w-5"/> : label}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold leading-snug text-white sm:text-2xl">{item.title}</span>
                  {item.description && (
                    <span className={`mt-2 block text-sm leading-[1.6] tracking-[0.01em] text-[#A5A5A5] sm:text-[15px] ${open || !expandable ? "" : "line-clamp-1"}`}>
                      {item.description}
                    </span>
                  )}
                </span>
                {expandable && (
                  <span aria-hidden
                    className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/50 text-white transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
                    <ChevronDown className="h-3.5 w-3.5"/>
                  </span>
                )}
              </>
            );

            const headCls = "flex w-full items-center gap-4 px-5 py-5 text-left sm:gap-[22px] sm:px-6 sm:py-6";

            return (
              <li key={`${item.title}-${i}`}
                className={`rounded-[12px] border-[1.5px] border-ink-700 transition-colors ${open ? "bg-ink-800" : "bg-[#1A1A1A]"}`}>
                <h3>
                  {expandable ? (
                    <button type="button" id={buttonId} aria-expanded={open} aria-controls={panelId}
                      onClick={() => setOpenIndex(open ? null : i)} className={headCls}>
                      {head}
                    </button>
                  ) : (
                    <span className={headCls}>{head}</span>
                  )}
                </h3>
                {expandable && (
                  <div id={panelId} role="region" aria-labelledby={buttonId}
                    className={`grid overflow-hidden transition-[grid-template-rows] duration-500 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="min-h-0">
                      <div className="px-5 pb-6 sm:pl-[95px] sm:pr-6">
                        <p className="text-sm text-[#A5A5A5] sm:text-[15px]">
                          {item.outcomesLabel ?? "By the end of this module, you'll be able to"}
                        </p>
                        <ul className="mt-4 flex flex-col gap-3">
                          {item.outcomes.map((o, j) => (
                            <li key={`${o}-${j}`}
                              className="flex items-center gap-4 rounded-lg border border-[#4A4A4A] bg-ink-600 px-4 py-3 text-sm leading-snug text-white sm:min-h-12 sm:px-[25px] sm:py-2.5">
                              <Check aria-hidden className="h-4 w-4 shrink-0 text-white"/>
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
          <span aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[280px] rounded-b-[12px] bg-[linear-gradient(to_top,#000_0%,#000_5.8%,rgba(0,0,0,0.5)_42.3%,rgba(76,76,76,0.07)_68.75%,rgba(255,255,255,0)_100%)]"/>
        )}

        {collapsible && (
          <div className={collapsed ? "absolute inset-x-0 bottom-[30px] z-10 flex justify-center" : "mt-8 flex justify-center"}>
            <button type="button" onClick={() => setShowAll((v) => !v)}
              className="inline-flex h-12 items-center gap-2.5 rounded-[12px] bg-accent px-6 text-sm font-medium text-white transition hover:bg-accent-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950">
              {showAll ? "Show Less" : "Read More"}
              <span aria-hidden className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/60">
                <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${showAll ? "rotate-180" : ""}`}/>
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
  subtitle,
}: {
  items: Item[];
  durationMonths?: number;
  title?: string;
  subtitle?: string;
}) {
  const anyArcContent = items.some(
    (m) => m.judgement || m.insideTheWork || m.appliedInPractice || m.whatChanges,
  );
  const filteredItems = anyArcContent
    ? items.filter((m) => m.judgement || m.insideTheWork || m.appliedInPractice || m.whatChanges)
    : items;

  const hasRealModules = items.length > 0 &&
    items.some((m) => m.description || m.subtitle || m.judgement || m.insideTheWork || m.appliedInPractice || m.whatChanges);

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

  const months = durationMonths ?? resolved.length;
  const computedSubtitle =
    subtitle ||
    `A ${months}-Month journey that transforms how you observe, decide, operate and build a cornea practice.`;

  return <ArcRoadmap items={resolved} title={title} subtitle={computedSubtitle}/>;
}
