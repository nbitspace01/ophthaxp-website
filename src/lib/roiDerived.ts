/**
 * The two figures the ROI panel works out for itself.
 *
 * The backend model prices a single "patients treated" number at one average
 * selling price per specialty. It has no notion of an outpatient/inpatient
 * split and no fee inputs at all, so it cannot answer the question the panel
 * actually asks the reader — four numbers: how many of each, and what each is
 * worth. Population and disease burden stay the backend's; revenue and impact
 * are derived from the reader's own profile.
 *
 * The formulas live here, on their own, because three places need the same
 * answer: the panel that draws it, the browser copy of the outlook, and the
 * account copy written server-side. They used to be written once in the panel
 * and nowhere else, so the dashboard showed the backend's figures instead —
 * the same outlook reading ₹2.40 Cr on one screen and ₹1.50 Cr on the next.
 */

export interface PracticeProfile {
  annualOutpatients: number;
  opFeeInr: number;
  annualInpatients: number;
  ipFeeInr: number;
  /**
   * Running costs as a share of what the practice bills, 0–90.
   *
   * A share rather than a rupee figure because it is the only one of the five a
   * reader can answer about a practice they have not opened yet. Costs scale
   * with volume — more clinics means more consumables, more staff hours, more
   * chair time — so a percentage survives moving the volume sliders, where a
   * fixed annual figure would quietly become wrong the moment they did.
   */
  operatingCostPct: number;
}

/**
 * What an ophthalmology practice keeps, before tax, as a share of billings.
 *
 * Doctors told us a gross figure on its own was misleading, and they were
 * right — but the honest fix is not to invent a cost model for a practice we
 * know nothing about. This is a starting position the reader is expected to
 * move, and the panel says as much next to it.
 */
export const DEFAULT_OPERATING_COST_PCT = 60;

/** What the practice bills in a year: consultations plus admissions. */
export function practiceRevenue(profile: PracticeProfile): number {
  return (
    profile.annualOutpatients * profile.opFeeInr +
    profile.annualInpatients * profile.ipFeeInr
  );
}

/**
 * What running the practice costs in a year — staff, rent, consumables,
 * equipment upkeep, utilities, administration.
 *
 * Not the full picture of what a doctor takes home, and the panel labels it so:
 * tax, depreciation, loan interest and the doctor's own drawings all sit below
 * this line.
 */
export function practiceOperatingExpenses(profile: PracticeProfile): number {
  return practiceRevenue(profile) * (profile.operatingCostPct / 100);
}

/** Billings less running costs. Still before tax, interest and depreciation. */
export function practiceOperatingProfit(profile: PracticeProfile): number {
  return practiceRevenue(profile) - practiceOperatingExpenses(profile);
}

/**
 * Share of the local disease burden this practice volume could reach.
 *
 * Uses max(outpatients, inpatients) rather than their sum: procedure patients
 * are typically first seen as outpatients, so adding both would count the same
 * person twice. Capped at 100%.
 */
export function practiceImpactPct(
  profile: PracticeProfile,
  prevalenceCount: number,
): number {
  if (!prevalenceCount) return 0;
  const uniquePatients = Math.max(
    profile.annualOutpatients,
    profile.annualInpatients,
  );
  return Math.min(100, (uniquePatients / prevalenceCount) * 100);
}

/** The panel's own slider ceilings, which are also what the route will accept. */
const LIMITS: Record<keyof PracticeProfile, number> = {
  annualOutpatients: 40_000,
  opFeeInr: 5_000,
  annualInpatients: 20_000,
  ipFeeInr: 200_000,
  /** A practice spending every rupee it bills is not a projection worth
      drawing, so the slider stops short of 100 and so does this. */
  operatingCostPct: 90,
};

function clamp(value: unknown, max: number): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(n, max);
}

/**
 * Read a profile off a request body, or null.
 *
 * These four numbers reach the server from the browser, so they are checked
 * rather than trusted — but note what they are for: a record of what this
 * doctor was shown, on their own dashboard. Nothing is priced off them and
 * nobody else reads them. A missing or malformed profile is not an error; it
 * means an older client, and the caller falls back to the backend's figures.
 */
export function parsePracticeProfile(value: unknown): PracticeProfile | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;

  const annualOutpatients = clamp(raw.annualOutpatients, LIMITS.annualOutpatients);
  const opFeeInr = clamp(raw.opFeeInr, LIMITS.opFeeInr);
  const annualInpatients = clamp(raw.annualInpatients, LIMITS.annualInpatients);
  const ipFeeInr = clamp(raw.ipFeeInr, LIMITS.ipFeeInr);

  if (
    annualOutpatients === null ||
    opFeeInr === null ||
    annualInpatients === null ||
    ipFeeInr === null
  ) {
    return null;
  }

  // Absent rather than invalid, for a client from before the cost slider
  // existed. Those four above are the profile; this one has a defensible
  // default, so a missing value falls back instead of voiding the whole
  // profile and sending the dashboard back to the backend's figures.
  const operatingCostPct =
    raw.operatingCostPct === undefined || raw.operatingCostPct === null
      ? DEFAULT_OPERATING_COST_PCT
      : clamp(raw.operatingCostPct, LIMITS.operatingCostPct);

  if (operatingCostPct === null) return null;

  return {
    annualOutpatients,
    opFeeInr,
    annualInpatients,
    ipFeeInr,
    operatingCostPct,
  };
}
