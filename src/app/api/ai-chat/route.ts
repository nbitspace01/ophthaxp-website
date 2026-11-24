import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

/** Each visitor's share of the assistant (it runs on the company's API key). */
const PER_IP_LIMIT = 20;
const PER_IP_WINDOW_MS = 10 * 60_000;
/** Only the recent conversation is sent on, each turn short and of a real role. */
const MAX_HISTORY_TURNS = 10;
const MAX_TURN_CHARS = 2000;
const UPSTREAM_TIMEOUT_MS = 20_000;

// POST /api/ai-chat
// Body: { message: string, history?: { role: 'user'|'assistant', content: string }[] }
//
// If ANTHROPIC_API_KEY is set, this forwards to the Claude Messages API.
// Otherwise, it returns a deterministic stub so local development works without keys.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { message?: string; history?: { role: "user" | "assistant"; content: string }[] }
    | null;

  const message = typeof body?.message === "string" ? body.message.trim().slice(0, MAX_TURN_CHARS) : "";
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 422 });
  }

  const limited = rateLimit(`ai-chat:ip:${clientKey(req)}`, PER_IP_LIMIT, PER_IP_WINDOW_MS);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "You have sent a lot of messages. Please wait a few minutes and try again." },
      { status: 429, headers: { "retry-after": String(limited.retryAfter) } },
    );
  }

  // Only user/assistant turns with text, the last few, each kept short.
  const history = (Array.isArray(body?.history) ? body.history : [])
    .filter(
      (m): m is { role: "user" | "assistant"; content: string } =>
        !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
    )
    .slice(-MAX_HISTORY_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_TURN_CHARS) }));

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({ reply: stubReply(message) });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system:
          "You are the Legends of Medicine assistant. Help final-year MBBS students and practising ophthalmologists choose mentorship cohorts (cataract, retina, glaucoma, cornea, paediatric, neuro, refractive, uveitis). Keep replies under 4 sentences. Suggest a relevant program slug when helpful.",
        messages: [...history, { role: "user", content: message }],
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!res.ok) {
      // The provider's own error text stays in the server log, not the reply.
      console.error("[ai-chat] upstream", res.status, (await res.text()).slice(0, 500));
      return NextResponse.json({ error: "The assistant is unavailable right now." }, { status: 502 });
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const reply =
      data.content
        ?.filter((c) => c.type === "text" && c.text)
        .map((c) => c.text)
        .join("\n") ?? "";

    return NextResponse.json({ reply: reply || stubReply(message) });
  } catch (err) {
    console.error("[ai-chat] failed", err);
    return NextResponse.json({ reply: stubReply(message) });
  }
}

function stubReply(message: string) {
  const m = message.toLowerCase();
  if (m.includes("mbbs") || m.includes("student"))
    return "If you've just finished MBBS and want to specialise in ophthalmology, start with the Cornea & Refractive Fellowship Prep cohort or the Cataract Mastery Cohort — both are designed to bridge from MBBS to confident clinical practice.";
  if (m.includes("compare"))
    return "Cataract is best for surgical volume; Retina/Vitreo-Retinal for posterior segment depth; Cornea/Refractive for high-precision day-care surgery; Glaucoma for long-term medical decision-making.";
  // Both names are matched: people will type the old one for a long while.
  if (m.includes("what is") || m.includes("ophthaxp") || m.includes("legends of medicine"))
    return "Legends of Medicine is a live, cohort-based mentorship platform where senior ophthalmologists teach practising clinicians and MBBS graduates through real cases, small groups and a practice-first curriculum.";
  return "Tell me your current qualification and which subspecialty interests you — I'll match you to the right cohort.";
}
