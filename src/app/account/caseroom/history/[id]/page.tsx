import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CasePlayer } from "@/components/caseroom/CasePlayer";

/**
 * One finished case, read back.
 *
 * The case screen itself, in its read-only mode — the same three columns a
 * doctor worked in, with nothing left to send or lock in.
 */
export const metadata: Metadata = {
  title: "Caseroom — case history",
  robots: { index: false, follow: false },
};

export default function CaseroomHistoryPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  return <CasePlayer reviewId={id} />;
}
