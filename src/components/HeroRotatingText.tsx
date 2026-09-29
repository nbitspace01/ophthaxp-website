"use client";

import { useEffect, useRef, useState } from "react";

const PHRASES = [
  "To earn your place in the top 1%",
  "To become the doctor other doctors refer to",
  "To build the practice others benchmark",
];

const INTERVAL_MS = 10500; // erase + clean pause + slow write + reading time
const ERASE_MS = 2200; // how long the duster works (keep <= 2800, when the new line starts writing)
const RUBS = 6; // up-and-down rubs while it travels along the line
const DUSTER_H = 1.1; // full height, so no part of a letter is missed
const DUSTER_W = 2.2; // a little wider, so letters are wiped cleanly
const PAD = 24; // extra canvas room around the text (px)

export function HeroRotatingText() {
  const [index, setIndex] = useState(0);
  const [hasChanged, setHasChanged] = useState(false);
  const indexRef = useRef(0);
  const wrapRef = useRef<HTMLSpanElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phraseRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const rafRef = useRef(0);

  function eraseWithDuster(i: number) {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const el = phraseRefs.current[i];
    if (!wrap || !canvas || !el) return;

    const node = el.firstChild;
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const text = node.textContent ?? "";

    // 1. size the canvas over the text
    const wr = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const cw = wr.width + PAD * 2;
    const chh = wr.height + PAD * 2;
    canvas.width = Math.ceil(cw * dpr);
    canvas.height = Math.ceil(chh * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${chh}px`;
    canvas.style.left = `${-PAD}px`;
    canvas.style.top = `${-PAD}px`;
    canvas.style.transition = "none";
    canvas.style.opacity = "1";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 2. draw the old text exactly where the real text is
    const cs = getComputedStyle(el);
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    ctx.fillStyle = cs.color === "rgba(0, 0, 0, 0)" ? "#ffffff" : cs.color;
    ctx.textBaseline = "alphabetic";
    const ascent =
      ctx.measureText("M").fontBoundingBoxAscent ?? parseFloat(cs.fontSize) * 0.9;

    const range = document.createRange();
    let minL = Infinity, maxR = -Infinity, minT = Infinity, maxB = -Infinity;
    let letterH = 0;
    for (let k = 0; k < text.length; k++) {
      const chr = text[k];
      if (chr === " ") continue;
      range.setStart(node, k);
      range.setEnd(node, k + 1);
      const r = range.getBoundingClientRect();
      if (!r.width) continue;
      const x = r.left - wr.left + PAD;
      const y = r.top - wr.top + PAD;
      ctx.fillText(chr, x, y + ascent);
      minL = Math.min(minL, x);
      maxR = Math.max(maxR, x + r.width);
      minT = Math.min(minT, y);
      maxB = Math.max(maxB, y + r.height);
      letterH = r.height;
    }
    if (!isFinite(minL)) return;

    // 3. the invisible duster: a soft oval that erases whatever it touches
    const rx = (letterH * DUSTER_W) / 2;
    const ry = ((maxB - minT) * DUSTER_H) / 2;
    const step = Math.min(rx, ry) * 0.3;

    ctx.globalCompositeOperation = "destination-out";
    const stamp = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(rx / ry, 1);
const g = ctx.createRadialGradient(0, 0, 0, 0, 0, ry);
g.addColorStop(0, "rgba(0,0,0,1)");
g.addColorStop(0.88, "rgba(0,0,0,1)"); // solid, so no ghost is left
g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, ry, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    let px = NaN;
    let py = 0;

    const frame = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / ERASE_MS));

      // left -> right along the line, rubbing up and down as it goes
      const cx = minL - rx * 0.5 + p * (maxR - minL + rx);
      const tri = Math.abs(((p * RUBS) % 1) * 2 - 1);
      const cy = minT - ry * 0.3 + (1 - tri) * (maxB - minT + ry * 0.6);

      if (Number.isNaN(px)) {
        stamp(cx, cy);
      } else {
        const dist = Math.hypot(cx - px, cy - py);
        const n = Math.max(1, Math.ceil(dist / step));
        for (let k = 1; k <= n; k++) {
          stamp(px + ((cx - px) * k) / n, py + ((cy - py) * k) / n);
        }
      }
      px = cx;
      py = cy;

      if (p < 1) {
        rafRef.current = requestAnimationFrame(frame);
     } else {
        // clear everything at once, so no faint text is left behind
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.opacity = "0";
      }
    };
    rafRef.current = requestAnimationFrame(frame);
  }

  useEffect(() => {
    const id = window.setInterval(() => {
      const outgoing = indexRef.current;
      eraseWithDuster(outgoing); // draws the old text on the canvas and starts erasing
      indexRef.current = (outgoing + 1) % PHRASES.length;
      setHasChanged(true);
      setIndex(indexRef.current);
    }, INTERVAL_MS);
    return () => {
      window.clearInterval(id);
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span ref={wrapRef} className="relative inline-grid align-top">
      {PHRASES.map((phrase, i) => {
        const isCurrent = i === index;
        const state = isCurrent ? (hasChanged ? "hero-chalk-write" : "") : "opacity-0";
        return (
          <span
            key={phrase}
            ref={(el) => {
              phraseRefs.current[i] = el;
            }}
            aria-hidden={!isCurrent}
            className={`[grid-area:1/1] ${state}`}
          >
            {phrase}
          </span>
        );
      })}

      {/* The erasing happens here. The old line is drawn on this canvas,
          then the invisible duster wipes it away. */}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-0 w-0"
      />
    </span>
  );
}