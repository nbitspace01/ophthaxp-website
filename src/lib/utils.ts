/** Strip pipe-break markers for use in plain-string contexts (alt text, page titles, sentences). */
export function plainName(name: string): string {
  return name.replace(/\|/g, " ");
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * How a signed-in clinician is addressed across the dashboard.
 *
 * Everybody who applies here is a doctor, so the honorific is the right default
 * — but it is only added when they have not already typed it into their own
 * name, which people often do.
 */
export function doctorName(first?: string, last?: string): string {
  const full = [first, last].map((part) => part?.trim()).filter(Boolean).join(" ");
  if (!full) return "Doctor";
  return /^dr\b\.?/i.test(full) ? full : `Dr. ${full}`;
}

/**
 * Head-counts the way an Indian reader scans them: 1.4 L, 2.6 Cr.
 *
 * Crores and lakhs rather than millions because every number this site shows a
 * doctor is about their own district, and that is the register those are
 * discussed in locally.
 */
export function formatPeopleShort(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(1)} Cr`;
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(1)} L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

/** Money on the same scale, to two places — ₹50.20 Cr reads as a figure, ₹50.2 Cr as a rounding. */
export function formatINRShort(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "₹0";
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/**
 * Sort key for "Featured" rows: the time Featured was last switched on
 * (`featuredAt`, stamped by the admin), so the newest-featured leads. A row
 * that is not featured, or was featured before stamping existed, gets
 * -Infinity and keeps its place behind the stamped ones.
 */
export function featuredStamp(isFeatured?: boolean, featuredAt?: string): number {
  const t = isFeatured && featuredAt ? Date.parse(featuredAt) : NaN;
  return Number.isNaN(t) ? -Infinity : t;
}

/** Compare two featured stamps, newest first; equal (incl. both unstamped) is 0. */
export function byFeaturedStamp(a: number, b: number): number {
  return a === b ? 0 : b > a ? 1 : -1;
}
