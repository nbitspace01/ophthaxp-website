"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import NextImage from "next/image";
import { ImageBackdrop } from "@/components/ImageBackdrop";

/**
 * The same rule for a `next/image` that fills a card (`fill`): it covers the
 * card when that keeps at least `minCoverShown` of the picture, and is shown
 * whole over a blurred copy of itself otherwise. Put it inside a positioned,
 * overflow-hidden box; it fills that box.
 */
export function SmartFitFill({
  src,
  alt = "",
  sizes,
  priority,
  className = "",
  coverPosition = "center",
  minCoverShown = 0.7,
}: {
  src: string;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  coverPosition?: string;
  minCoverShown?: number;
}) {
  const boxRef = useRef<HTMLSpanElement | null>(null);
  const whole = useShowWhole(src, boxRef, minCoverShown);
  return (
    <span ref={boxRef} className="absolute inset-0 block">
      {whole && <ImageBackdrop src={src} />}
      <NextImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        style={{ objectPosition: whole ? "center" : coverPosition }}
        className={`${whole ? "object-contain" : "object-cover"} ${className}`}
      />
    </span>
  );
}

/**
 * Whether a picture should be shown whole (true) or may fill its box (false):
 * it fills when at least `minCoverShown` of it stays visible. Watches the box
 * so the answer follows the screen size. Starts at false (fill) until the
 * picture's size is known.
 */
export function useShowWhole(
  src: string | undefined | null,
  boxRef: React.RefObject<HTMLElement | null>,
  minCoverShown = 0.7,
): boolean {
  const [whole, setWhole] = useState(false);
  useEffect(() => {
    const box = boxRef.current;
    if (!src || !box) return;
    let natural: { w: number; h: number } | null = null;
    const decide = () => {
      const { width, height } = box.getBoundingClientRect();
      if (!natural || !width || !height) return;
      const photo = natural.w / natural.h;
      const frame = width / height;
      setWhole(Math.min(photo, frame) / Math.max(photo, frame) < minCoverShown);
    };
    const probe = new Image();
    probe.onload = () => {
      natural = { w: probe.naturalWidth, h: probe.naturalHeight };
      decide();
    };
    probe.src = src;
    const ro = new ResizeObserver(decide);
    ro.observe(box);
    return () => {
      probe.onload = null;
      ro.disconnect();
    };
  }, [src, boxRef, minCoverShown]);
  return whole;
}

/**
 * An image that fills its box when it can, and shows whole when it cannot.
 *
 * Filling (`object-cover`) suits a photo shaped like its box: a wide photo in a
 * wide box loses only a sliver. A photo of a very different shape (a tall
 * portrait in a wide box) would be cut down to a zoomed face, so it is shown
 * whole instead, over a blurred copy of itself that fills the spare room.
 *
 * The choice is made from the loaded photo and the box it is drawn in, and is
 * made again when the box changes size (tablet vs desktop).
 *
 * `minCoverShown`: fill only if at least this share of the photo stays visible.
 */
export function SmartFitImage({
  src,
  alt,
  className = "",
  style,
  coverPosition = "50% 20%",
  minCoverShown = 0.7,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  coverPosition?: string;
  minCoverShown?: number;
}) {
  const ref = useRef<HTMLImageElement | null>(null);
  const [whole, setWhole] = useState(false);

  useEffect(() => {
    const img = ref.current;
    if (!img) return;
    const decide = () => {
      const { width, height } = img.getBoundingClientRect();
      if (!img.naturalWidth || !img.naturalHeight || !width || !height) return;
      const photo = img.naturalWidth / img.naturalHeight;
      const box = width / height;
      // Share of the photo still visible when it fills the box.
      const shown = Math.min(photo, box) / Math.max(photo, box);
      setWhole(shown < minCoverShown);
    };
    // A cached photo can finish loading before this effect runs.
    if (img.complete) decide();
    img.addEventListener("load", decide);
    const ro = new ResizeObserver(decide);
    ro.observe(img);
    return () => {
      img.removeEventListener("load", decide);
      ro.disconnect();
    };
  }, [src, minCoverShown]);

  return (
    <>
      {whole && <ImageBackdrop src={src} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={className}
        style={{
          ...style,
          objectFit: whole ? "contain" : "cover",
          objectPosition: whole ? "center" : coverPosition,
        }}
      />
    </>
  );
}
