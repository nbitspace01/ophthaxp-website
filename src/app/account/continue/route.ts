import { NextResponse } from "next/server";
import { findOpenApplication, getApplicationById, isConfigured } from "@/lib/applyApi";
import { resolveCourseSlug } from "@/lib/courses";
import { getSessionUser } from "@/lib/session";

/**
 * "Continue where you left off".
 *
 * Resolved on the server at click time so the link can never land on a 404:
 * the course is looked up by id against the live catalogue, and anything that
 * no longer exists falls back to the account page instead.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const go = (path: string) => NextResponse.redirect(new URL(path, req.url));

  const user = getSessionUser();
  if (!user) return go("/login");
  if (!isConfigured()) return go("/account");

  // ?id= resumes one particular application (the dashboard cards); without it,
  // the newest open draft (the header menu).
  const id = Number(new URL(req.url).searchParams.get("id"));
  const app = await (Number.isInteger(id) && id > 0
    ? getApplicationById(id, user.email)
    : findOpenApplication(user.email)
  ).catch(() => null);
  if (!app) return go("/account");

  const saved = typeof app.return_path === "string" ? app.return_path.split("?")[0] : "";
  const slugHint = saved.match(/^\/(?:apply|programmes|programs)\/([^/]+)/)?.[1] ?? null;

  const slug = await resolveCourseSlug(app.course_id, slugHint).catch(() => null);
  if (!slug) return go("/account");

  const step = Number(app.current_step) || 1;
  return go(`/apply/${encodeURIComponent(slug)}?step=${step}`);
}
