/**
 * Who the API key is.
 *
 * Almost nothing needs to ask. The platform's authentication middleware reads
 * `x-api-key`, looks the key row up and fills in the organisation and the user
 * that created it, so every authenticated call already runs as the right
 * identity without being told what that identity is.
 *
 * The exception is `/api/payments/checkout`, which is mounted *above* that
 * middleware — deliberately, so a QR code can open a payment page with no
 * credentials at all. Nothing authenticates there, so nothing is injected, and
 * the organisation has to travel in the body. This module is how it gets there
 * without an environment variable: ask the platform once, and remember.
 *
 * Server-only. Never reachable from the browser.
 */

const BASE = process.env.NOCODE_API_BASE_URL || "";
const API_KEY = process.env.NOCODE_API_KEY || "";

/** The org id does not change under a key. One lookup per process is plenty. */
let cachedOrgId: string | null = null;

/** Long enough for one small read, short enough not to hold up a checkout. */
const TIMEOUT_MS = 5000;

/**
 * The organisation this key belongs to, or null if it cannot be established.
 *
 * Only successes are cached. A failure here is usually the platform being
 * briefly unreachable, and remembering that for the life of the process would
 * turn a blip into an outage.
 */
export async function resolveOrgId(): Promise<string | null> {
  if (cachedOrgId) return cachedOrgId;
  if (!BASE || !API_KEY) return null;

  const controller = new AbortController();
  const deadline = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE}/api/organizations`, {
      headers: { "content-type": "application/json", "x-api-key": API_KEY },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`[identity] org lookup failed status=${res.status}`);
      return null;
    }

    const body = (await res.json().catch(() => ({}))) as {
      data?: { organization?: { id?: unknown } };
    };
    const id = body?.data?.organization?.id;

    if (typeof id !== "string" || !id) {
      console.error("[identity] org lookup returned no organisation id");
      return null;
    }

    cachedOrgId = id;
    return id;
  } catch (err) {
    const reason = (err as Error)?.name === "AbortError" ? "timed out" : (err as Error)?.message;
    console.error(`[identity] org lookup failed — ${reason}`);
    return null;
  } finally {
    clearTimeout(deadline);
  }
}
