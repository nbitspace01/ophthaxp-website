"use client";

import { useEffect, useRef } from "react";

/**
 * The animated line drawing at the top of each "Making of a Legend." card.
 *
 * Ported from the LoM_Making_of_a_Legend_Tech_Handoff reference
 * (assets/script.js): the same five canvas scenes, colours, timing and hover
 * response. Each card's drawing is offset in time so the five do not move in
 * step, drawn at ~30fps, and paused while the section is off screen or the
 * tab is hidden.
 */

export type LegendArtKind = "access" | "months" | "live" | "practice" | "clinic";

type State = {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  heat: number;
  targetHeat: number;
};

const tau = Math.PI * 2;

function stroke(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opacity: number,
  weight = 1,
  warm = true,
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  const light = Math.min(0.98, 0.075 + opacity * 1.17);
  ctx.strokeStyle = warm ? `rgba(224,105,77,${light})` : `rgba(252,249,243,${light})`;
  ctx.lineWidth = weight * 1.1;
  ctx.stroke();
}

function point(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, opacity: number, warm = true) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, tau);
  const light = Math.min(0.98, 0.055 + opacity * 1.13);
  ctx.fillStyle = warm ? `rgba(229,114,84,${light})` : `rgba(252,249,243,${light})`;
  ctx.fill();
}

const wave = (t: number, speed: number, offset = 0) => (Math.sin(t * speed + offset) + 1) / 2;

function access(s: State, t: number) {
  const { ctx, w, h } = s;
  const cy = h * 0.48 + (s.y - 0.5) * h * 0.06;
  const first = w * (0.32 + Math.sin(t * 0.36) * 0.034);
  const second = w * (0.68 - Math.sin(t * 0.36) * 0.034);
  [first, second].forEach((cx, side) => {
    for (let k = 0; k < 36; k++) {
      const angle = (k * tau) / 36 + t * (side ? -0.045 : 0.045);
      const r = Math.min(w, h) * (0.25 + 0.046 * Math.sin(k * 0.8 + t * 0.65));
      const inner = r + ((k + side * 4) % 5 === 0 ? -5 : 0);
      stroke(
        ctx,
        cx + Math.cos(angle) * inner,
        cy + Math.sin(angle) * inner,
        cx + Math.cos(angle) * (r + 8),
        cy + Math.sin(angle) * (r + 8),
        (k % 4 === 0 ? 0.18 : 0.075) + s.heat * 0.055,
        k % 6 === 0 ? 1.3 : 0.8,
        k % 5 !== 0,
      );
    }
  });
  for (let i = 0; i < 9; i++) {
    const f = i / 9;
    const pulse = wave(t, 1.4, -i * 0.7);
    stroke(
      ctx,
      first + 9 + (second - first - 18) * f,
      cy,
      first + 9 + (second - first - 18) * (f + 0.065),
      cy,
      0.12 + pulse * 0.55,
      1.3,
      i % 3 !== 0,
    );
  }
  point(ctx, first, cy, 3.7, 0.93, false);
  point(ctx, second, cy, 3.7, 0.93, true);
}

function months(s: State, t: number) {
  const { ctx, w, h } = s;
  const left = w * 0.1;
  const width = w * 0.8;
  for (let i = 0; i < 12; i++) {
    const x = left + (i * width) / 11;
    const y = h * (0.34 + 0.05 * Math.sin(i * 0.65));
    const duration = 16 + wave(t, 0.75, -i * 0.48) * 39;
    stroke(ctx, x, y, x, y + duration, 0.12 + wave(t, 1, -i * 0.55) * 0.22, i % 3 === 0 ? 1.2 : 0.8, i % 4 !== 0);
    point(ctx, x, y + duration, i % 3 === 0 ? 1.9 : 1.2, 0.22 + wave(t, 1.2, -i * 0.48) * 0.4, i % 3 !== 0);
  }
  for (let lane = 0; lane < 3; lane++) {
    const y = h * (0.54 + lane * 0.115);
    for (let i = 0; i < 13; i++) {
      const x = left + (i * width) / 13;
      stroke(ctx, x, y, x + width / 20, y, 0.12 + 0.35 * wave(t, 1.05, -(i + lane * 3) * 0.43), lane === 1 ? 1.3 : 1, lane !== 1);
    }
  }
  const progress = (t * 0.075) % 1;
  const markerY = h * (0.655 + (s.y - 0.5) * 0.07 * s.heat);
  point(ctx, left + progress * width, markerY, 3.5, 0.93, false);
  point(ctx, left + progress * width, markerY, 8, 0.12 + s.heat * 0.08, true);
}

function live(s: State, t: number) {
  const { ctx, w, h } = s;
  const cx = w * (0.5 + (s.x - 0.5) * 0.045);
  const cy = h * 0.49;
  for (let ring = 0; ring < 4; ring++) {
    const count = 12 + ring * 12;
    const radius = Math.min(w, h) * (0.13 + ring * 0.1);
    for (let k = 0; k < count; k++) {
      const angle = (k * tau) / count + t * (ring % 2 ? -0.07 : 0.07);
      const pulse = wave(t, 1.25, -k * 0.25 - ring);
      const start = radius + pulse * 4;
      const length = 3 + pulse * (ring === 3 ? 9 : 15);
      stroke(
        ctx,
        cx + Math.cos(angle) * start,
        cy + Math.sin(angle) * start,
        cx + Math.cos(angle) * (start + length),
        cy + Math.sin(angle) * (start + length),
        0.09 + pulse * (ring === 0 ? 0.68 : 0.37) + s.heat * 0.07,
        pulse > 0.76 ? 1.3 : 0.85,
        (k + ring) % 4 !== 0,
      );
    }
  }
  const r = 4 + wave(t, 2.1) * 1.5;
  point(ctx, cx, cy, r, 0.9, false);
  ctx.beginPath();
  ctx.arc(cx, cy, 17 + wave(t, 1.6) * 12, 0, tau);
  ctx.strokeStyle = `rgba(224,105,77,${0.18 + 0.19 * wave(t, 1.6)})`;
  ctx.lineWidth = 1.1;
  ctx.stroke();
}

function practice(s: State, t: number) {
  const { ctx, w, h } = s;
  const left = w * 0.08;
  const right = w * 0.92;
  const lane = [h * 0.39, h * (0.65 + (s.y - 0.5) * 0.035 * s.heat)];
  lane.forEach((y, n) => {
    stroke(ctx, left, y, right, y, 0.12, 1, false);
    for (let i = 0; i < 14; i++) {
      const x = left + ((i + 0.5) * (right - left)) / 14;
      const drift = ((t * (n ? 0.105 : 0.09) + i * 0.071) % 1) * (right - left);
      const movingX = left + drift;
      stroke(ctx, x - 3, y, x + 3, y, 0.2, 1, true);
      stroke(ctx, movingX, y, movingX + 6, y, 0.18 + 0.45 * wave(t, 1.2, i * 0.5), 1.6, i % 4 !== 0);
    }
  });
  for (let i = 0; i < 7; i++) {
    const x = left + ((i + 0.5) * (right - left)) / 7;
    const a = wave(t, 1.15, -i * 0.8);
    stroke(ctx, x, lane[0] + 6, x, lane[1] - 6, 0.055 + a * 0.24, 1, i % 3 !== 0);
  }
  const p = (t * 0.09) % 1;
  point(ctx, left + p * (right - left), lane[0], 3, 0.95, false);
  point(ctx, left + p * (right - left), lane[1], 3, 0.85, true);
}

function clinic(s: State, t: number) {
  const { ctx, w, h } = s;
  const cols = 9;
  const rows = 6;
  const left = w * 0.14;
  const top = h * 0.22;
  const dx = (w * 0.72) / (cols - 1);
  const dy = (h * 0.57) / (rows - 1);
  const focusX = left + dx * 6 + (s.x - 0.5) * 12 * s.heat;
  const focusY = top + dy * 2.5 + (s.y - 0.5) * 10 * s.heat;
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const x = left + col * dx;
      const y = top + row * dy;
      const arrival = wave(t, 1.25, -col * 0.62 - row * 0.24);
      const chosen = Math.abs(col - 6) < 1 && (row === 2 || row === 3);
      const proximity = Math.max(0, 1 - Math.hypot(x / w - s.x, y / h - s.y) * 2.2);
      point(
        ctx,
        x,
        y,
        chosen ? 2.5 : 1.55,
        0.22 + arrival * (chosen ? 0.7 : 0.5) + s.heat * proximity * 0.2,
        chosen ? false : col % 3 !== 0,
      );
      if ((col + row) % 5 === 0) stroke(ctx, x, y + 4, x, y + 12 + arrival * 12, 0.09 + arrival * 0.39, 1, col % 2 === 0);
    }
  }
  for (let i = 0; i < 4; i++) {
    const sx = left + dx * (i + 0.25);
    const sy = top + dy * (i % 2 ? 4 : 1);
    stroke(ctx, sx, sy, focusX - 12, focusY, 0.055 + 0.18 * wave(t, 0.9, i * 1.4), 0.8, i % 2 === 0);
  }
  point(ctx, focusX, focusY, 4, 0.9, false);
}

const SCENES: Record<LegendArtKind, (s: State, t: number) => void> = {
  access,
  months,
  live,
  practice,
  clinic,
};

export function LegendArt({
  kind,
  index,
  className,
}: {
  kind: LegendArtKind;
  /** Position in the row — offsets the timing so the cards do not move in step. */
  index: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const s: State = { ctx, w: 0, h: 0, x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, heat: 0, targetHeat: 0 };

    const size = () => {
      const bounds = canvas.getBoundingClientRect();
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      s.w = bounds.width;
      s.h = bounds.height;
      canvas.width = Math.max(1, Math.round(bounds.width * scale));
      canvas.height = Math.max(1, Math.round(bounds.height * scale));
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };

    const draw = (t: number) => {
      if (!s.w || !s.h) return;
      s.x += (s.targetX - s.x) * 0.07;
      s.y += (s.targetY - s.y) * 0.07;
      s.heat += (s.targetHeat - s.heat) * 0.09;
      ctx.clearRect(0, 0, s.w, s.h);
      ctx.lineCap = "round";
      SCENES[kind](s, t * 1.25);
    };

    size();
    const resize = new ResizeObserver(size);
    resize.observe(canvas);

    // The whole card is the hover target, as in the reference.
    const card = canvas.closest("li") ?? canvas;
    const onMove = (event: Event) => {
      const e = event as PointerEvent;
      const bounds = canvas.getBoundingClientRect();
      s.targetX = Math.max(0, Math.min(1, (e.clientX - bounds.left) / bounds.width));
      s.targetY = Math.max(0, Math.min(1, (e.clientY - bounds.top) / bounds.height));
      s.targetHeat = 1;
    };
    const onLeave = () => {
      s.targetX = 0.5;
      s.targetY = 0.5;
      s.targetHeat = 0;
    };
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);

    // Only animate while the drawing is on screen.
    let visible = false;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    draw(index * 0.36);
    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden || now - last < 32) return;
      last = now;
      draw(now / 1000 + index * 0.36);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      io.disconnect();
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerleave", onLeave);
    };
  }, [kind, index]);

  return <canvas ref={canvasRef} aria-hidden className={className} />;
}
