import { NextResponse } from "next/server";
import { findCourseByIdOrSlug } from "@/lib/courses";
import {
  getApplicationById,
  getLeadSummary,
  STEP,
  updateApplication,
  updateLeadFields,
} from "@/lib/applyApi";
import { getSessionUser } from "@/lib/session";

/**
 * PDF 1.2 — the Prospect submits the case(s) their Legend assigned.
 *
 * Only for a submitted application whose course requires Caseroom. Every
 * assigned case needs an answer; the answers go on the lead (where the Legend
 * reviews them) and Caseroom becomes `complete`, which is what opens slot
 * booking. Submitting again replaces the answers until a slot is booked.
 */
const MAX_ANSWER = 6000;

export async function POST(req: Request) {
  const user = getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { id?: unknown; answers?: unknown } | null;
  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "id is required" }, { status: 422 });
  }

  const application = await getApplicationById(id, user.email);
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  const leadId = Number(application.lead_id);
  if (application.status !== "submitted" || !Number.isInteger(leadId) || leadId <= 0) {
    return NextResponse.json({ error: "Please submit your application first." }, { status: 409 });
  }

  const course = await findCourseByIdOrSlug(application.course_id).catch(() => null);
  const cases = course?.caseroomCases ?? [];
  if (!course?.caseroomRequired || cases.length === 0) {
    return NextResponse.json({ ok: true, skipped: true, nextStep: STEP.booking });
  }

  const answers = Array.isArray(body?.answers) ? body!.answers.map((a) => String(a ?? "").trim()) : [];
  const missing = cases.findIndex((_, i) => !answers[i]);
  if (missing >= 0) {
    return NextResponse.json(
      { error: `Please answer ${cases[missing].title || `case ${missing + 1}`} before continuing.` },
      { status: 422 },
    );
  }

  const lead = await getLeadSummary(leadId).catch(() => null);
  if (lead?.status && lead.status !== "new") {
    return NextResponse.json(
      { error: "Your Dialogue is already booked, so your case answers can no longer change." },
      { status: 409 },
    );
  }

  const text = cases
    .map((c, i) => `${c.title}\n${c.prompt}\n\nAnswer:\n${answers[i].slice(0, MAX_ANSWER)}`)
    .join("\n\n────────\n\n");

  const ok = await updateLeadFields(leadId, { caseroom_answers: text, caseroom_status: "complete" });
  if (!ok) {
    return NextResponse.json(
      { error: "We could not save your cases just now. Please try again." },
      { status: 502 },
    );
  }

  await updateApplication(id, { current_step: STEP.booking, last_seen_at: new Date().toISOString() });
  return NextResponse.json({ ok: true, nextStep: STEP.booking });
}
