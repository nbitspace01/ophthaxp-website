"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loma } from "@/lib/lomaClient";
import { ErrorNote, TypingDots } from "./atoms";
import { StudentDashboard } from "./StudentDashboard";
import type { HealthReport, LomaProfile } from "./types";

/**
 * Loads the doctor's LoMa profile, then hands off to the right screen.
 *
 * The profile is fetched in the browser rather than on the server, even though
 * this page is already behind the session gate. Two reasons, both practical:
 * the case player writes to it and needs to re-read it without a full page
 * load, and a doctor whose platform token has lapsed gets sent to sign in by
 * the client, which cannot happen from inside a server render.
 *
 * A 401 needs no handling here — `lomaClient` sends them to `/login?next=…`
 * before the error reaches this component.
 */

type State =
  | { status: "loading" }
  | { status: "ready"; profile: LomaProfile }
  | { status: "failed"; message: string };

export function CaseroomShell() {
  const [state, setState] = useState<State>({ status: "loading" });
  /* Whether the platform can currently write a case. Its own call, and a
     failure here is not fatal: the logbook still reads, so a doctor is told
     what they cannot do rather than shown an error page. */
  const [aiReady, setAiReady] = useState(true);

  useEffect(() => {
    let cancelled = false;

    loma
      .getProfile()
      .then((profile: LomaProfile) => !cancelled && setState({ status: "ready", profile }))
      .catch((err: Error) => !cancelled && setState({ status: "failed", message: err.message }));

    loma
      .health()
      .then((health: HealthReport) => !cancelled && setAiReady(Boolean(health.ai_ready)))
      .catch(() => {
        /* The profile call is the one that decides whether this screen can be
           drawn. If the backend is unreachable it fails too and says so there;
           a second copy of the same message helps nobody. */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div className="grid place-items-center py-32 text-center">
        <TypingDots label="Opening Caseroom" />
        <p className="mt-5 font-serif text-lg text-white">Caseroom</p>
      </div>
    );
  }

  if (state.status === "failed") {
    return (
      <div className="mx-auto grid max-w-md gap-5 py-24 text-center">
        <h1 className="font-serif text-lg text-white">Caseroom is not answering</h1>
        <ErrorNote>{state.message}</ErrorNote>
        <Link
          href="/account"
          className="mx-auto rounded-full bg-white/[0.06] px-6 py-3 text-sm font-medium text-white/80 ring-1 ring-white/10 transition hover:text-white"
        >
          Back to your dashboard
        </Link>
      </div>
    );
  }

  const { profile } = state;

  // Every role (trainee, legend, admin) gets the same Caseroom. The platform
  // lets any signed-in user work cases; only the mentor tools are role-gated.
  return <StudentDashboard profile={profile} aiReady={aiReady} />;
}
