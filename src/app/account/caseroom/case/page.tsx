import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CasePlayer } from "@/components/caseroom/CasePlayer";

/**
 * One case, being worked.
 *
 * Its own route rather than a mode of the dashboard, so the browser's back
 * button means "leave this case" — which is what a doctor pressing it intends.
 *
 * `?history=<id>` opens the same screen on a finished case from the logbook,
 * read-only. A `history` that is not an id is refused rather than ignored:
 * ignoring it would fall through to writing a new patient nobody asked for.
 */
export const metadata: Metadata = {
  title: "Caseroom — case in progress",
  robots: { index: false, follow: false },
};

export default function CaseroomCasePage({
  searchParams,
}: {
  searchParams: { history?: string | string[] };
}) {
  if (searchParams.history === undefined) return <CasePlayer />;

  const id = Number(searchParams.history);
  if (!Number.isInteger(id) || id <= 0) notFound();

  return <CasePlayer reviewId={id} />;
}
