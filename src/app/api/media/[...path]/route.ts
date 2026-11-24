import type { NextRequest } from "next/server";

const NOCODE_BASE = (process.env.NOCODE_API_BASE_URL || "").replace(/\/$/, "");

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  // Visitors only ever see a plain message; the details (including the
  // backend's address) go to the server log.
  if (!NOCODE_BASE) {
    console.error("[media] NOCODE_API_BASE_URL is not set on this deployment");
    return new Response("File unavailable", { status: 500 });
  }

  const { path } = await ctx.params;
  if (!path?.length) return new Response("File not found", { status: 400 });
  // A file name, never a way up into other backend routes.
  if (path.some((seg) => !seg || seg === "." || seg === ".." || /[\\/\u0000-\u001f]/.test(seg))) {
    return new Response("File not found", { status: 400 });
  }

  const target = `${NOCODE_BASE}/api/public/files/${path
    .map(encodeURIComponent)
    .join("/")}`;

  const range = req.headers.get("range");
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      headers: range ? { range } : undefined,
      cache: "no-store",
      redirect: "follow",
    });
  } catch (err) {
    console.error(`[media] fetch failed for ${target} — ${(err as Error).message}`);
    return new Response("File unavailable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    console.error(`[media] upstream ${upstream.status} for ${target}`);
    return new Response(upstream.status === 404 ? "File not found" : "File unavailable", {
      status: upstream.status || 502,
    });
  }

  const headers = new Headers();
  for (const h of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "last-modified",
    "etag",
  ]) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("cache-control", "public, max-age=31536000, immutable");

  return new Response(upstream.body, { status: upstream.status, headers });
}
