"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Eye, Lock, Send, TriangleAlert } from "lucide-react";
import { LomaError, loma } from "@/lib/lomaClient";
import { ErrorNote, Eyebrow, Panel, TypingDots } from "./atoms";
import { LockInModal, ResultCard } from "./CaseDebrief";
import { formatTime, prettyKey } from "./scoring";
import { Caret, useMotionAllowed, useTypewriter } from "./typing";
import type {
  CaseResult,
  CaseSession,
  CaseTurn,
  HistoryEntry,
  LomaProfile,
  RevealedFinding,
} from "./types";

/**
 * Working a case.
 *
 * Three things at once: the brief that does not change, the conversation with
 * the attending, and the evidence uncovered so far. On a wide screen they sit
 * side by side; below that they become tabs over one column, because a
 * three-column layout folded into a phone becomes a very long scroll in which
 * the chat — the only part being used — is in the middle.
 *
 * On a wide screen the whole thing is pinned to the viewport and each column
 * scrolls inside itself, the way a chat client does. The page scrolling as one
 * was wrong here: reading down a long history carried the reply box off the
 * bottom of the screen, and reading the chat carried the brief away — and the
 * brief is what a doctor keeps glancing back at while they work. Three short
 * columns that hold their own place beat one tall page.
 *
 * Nothing clinical is decided here. The findings, the reveals and the grading
 * all come from the platform; this draws what it is told.
 */

type Pane = "brief" | "evidence";

/**
 * A finished case, kept so it can be read back.
 *
 * The platform saves every turn, but the only route that hands them out is the
 * mentor's — a doctor asking for their own gets a 403. So the case is also kept
 * here, in the browser it was worked in, at the moment it is locked in. That
 * makes the read-back exactly the screen the doctor worked on, and it means a
 * case worked on another device, or before this existed, has no conversation
 * to show.
 */
interface SavedCase {
  session: CaseSession;
  thread: CaseTurn[];
  revealed: RevealedFinding[];
  result: Pick<
    CaseResult,
    "before" | "after" | "duration_sec" | "final_diagnosis" | "final_reasoning"
  >;
}

const SAVED_CASES_KEY = "caseroom:finished-cases:v1";
/** Enough to cover a logbook; old ones fall off the end. */
const SAVED_CASES_MAX = 60;

function readSavedCases(): SavedCase[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_CASES_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* Never allowed to throw: this runs right after a case is graded, and a full
   or blocked store must not come between a doctor and their result. */
function saveFinishedCase(saved: SavedCase): void {
  try {
    const next = [saved, ...readSavedCases()].slice(0, SAVED_CASES_MAX);
    window.localStorage.setItem(SAVED_CASES_KEY, JSON.stringify(next));
  } catch {
    /* Nothing to do. The case is graded and logged either way. */
  }
}

/**
 * The saved case behind a logbook row.
 *
 * Grading does not return the attempt's id, so the two are matched on what the
 * platform sent back at lock-in and then stored on the row: the XP either side,
 * the time taken and the answer given. Newest first, so the first match wins.
 */
function findSavedCase(entry: HistoryEntry): SavedCase | null {
  const same = (a: unknown, b: unknown) => String(a ?? "").trim() === String(b ?? "").trim();

  return (
    readSavedCases().find(
      (saved) =>
        saved?.session &&
        Array.isArray(saved.thread) &&
        Number(saved.result?.before) === Number(entry.before) &&
        Number(saved.result?.after) === Number(entry.after) &&
        Number(saved.result?.duration_sec) === Number(entry.duration_sec) &&
        same(saved.result?.final_diagnosis, entry.final_diagnosis) &&
        same(saved.result?.final_reasoning, entry.final_reasoning),
    ) ?? null
  );
}

/**
 * The case being worked, kept so a refresh does not throw it away.
 *
 * Without this, reloading the page asked the platform for a new patient while
 * the one being worked was still open there — the conversation gone from the
 * screen, and a second model call for a case nobody asked for.
 *
 * `sessionStorage`, not `localStorage`: the case belongs to the tab it is open
 * in. It survives a reload and a trip through the login page, and it is dropped
 * on leaving the case screen, so "Back to Caseroom" still means a new patient
 * next time.
 */
interface OpenCase {
  session: CaseSession;
  thread: CaseTurn[];
  revealed: RevealedFinding[];
  showObjectives: boolean;
  /** When the clock started, so it carries on rather than starting over. */
  startedAt: number;
  savedAt: number;
}

const OPEN_CASE_KEY = "caseroom:open-case:v1";
/** As long as the platform keeps an untouched case. Older than this, it is gone. */
const OPEN_CASE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

function readOpenCase(): OpenCase | null {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(OPEN_CASE_KEY) ?? "null");
    if (
      !saved?.session?.session_id ||
      !saved.session.brief ||
      !Array.isArray(saved.session.withheld_keys) ||
      !Array.isArray(saved.session.objectives) ||
      !Array.isArray(saved.thread) ||
      !Array.isArray(saved.revealed) ||
      typeof saved.startedAt !== "number" ||
      typeof saved.savedAt !== "number" ||
      Date.now() - saved.savedAt > OPEN_CASE_MAX_AGE_MS
    ) {
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

/* Neither of these may throw: a blocked or full store must cost the doctor a
   resumed case at worst, never the case they are working. */
function saveOpenCase(open: OpenCase): void {
  try {
    window.sessionStorage.setItem(OPEN_CASE_KEY, JSON.stringify(open));
  } catch {
    /* Nothing to do. The case carries on; it just will not survive a refresh. */
  }
}

function clearOpenCase(): void {
  try {
    window.sessionStorage.removeItem(OPEN_CASE_KEY);
  } catch {
    /* Nothing to do. */
  }
}

/** A reply is a couple of sentences, so it gets a shorter run than Iris's whole
 *  analysis — long enough to read as speech, short enough not to be a wait. */
const REPLY_TYPING_MS = 1800;

/** Air left under the columns, so they do not sit flush on the bottom edge. */
const BOTTOM_GAP = 24;

/** Below this there is not enough screen to work a case in three columns, and
 *  pinning the page would do more harm than the scrolling it prevents. */
const MIN_COLUMN_HEIGHT = 480;

/**
 * How many times a question is quietly asked again before the doctor is told.
 *
 * The platform answers a turn the model provider dropped with a 502, and the
 * same question asked a moment later almost always comes back. So the second
 * and third go are made here, behind the typing dots, rather than by a doctor
 * pressing "Ask again" on an error they should never have seen.
 */
const ASK_RETRIES = 2;
const ASK_RETRY_DELAY_MS = 800;

/** The model provider failed the turn — the one failure worth asking again. */
function providerFailed(err: unknown): boolean {
  return err instanceof LomaError && err.status === 502;
}

/** The platform no longer holds this case. Asking again cannot bring it back. */
function caseExpired(err: unknown): boolean {
  return err instanceof LomaError && err.status === 404;
}

async function sendWithRetry(sessionId: string, text: string) {
  for (let tries = 0; ; tries += 1) {
    try {
      return await loma.sendMessage(sessionId, text);
    } catch (err) {
      if (!providerFailed(err) || tries >= ASK_RETRIES) throw err;
      console.warn(`Caseroom: the attending did not answer, asking again (${tries + 1})`, err);
      await new Promise((resolve) => setTimeout(resolve, ASK_RETRY_DELAY_MS));
    }
  }
}

/** The site stopped waiting. The platform may well still be working on it. */
function gaveUpWaiting(err: unknown): boolean {
  return err instanceof LomaError && err.status === 504;
}

async function lockInWithRetry(
  sessionId: string,
  diagnosis: string,
  reasoning: string,
  seconds: number,
): Promise<CaseResult> {
  for (let tries = 0; ; tries += 1) {
    try {
      return await loma.lockIn(sessionId, diagnosis, reasoning, seconds);
    } catch (err) {
      if (!providerFailed(err) || tries >= ASK_RETRIES) throw err;
      console.warn(`Caseroom: the grader did not answer, submitting again (${tries + 1})`, err);
      await new Promise((resolve) => setTimeout(resolve, ASK_RETRY_DELAY_MS));
    }
  }
}

/**
 * How long to keep looking for a grade the site gave up waiting for.
 *
 * Grading that outlasts the site's own timeout is not a failed grading — the
 * platform finishes it, saves it to the logbook and closes the case. Submitting
 * again at that point can only be told "this case has expired", or worse, land
 * while the first is still running and grade the case twice. So the logbook is
 * watched for the result instead.
 */
const GRADE_POLLS = 12;
const GRADE_POLL_DELAY_MS = 5000;

/**
 * The grade for this answer, if the platform has logged one.
 *
 * Matched on the answer itself: grading does not hand back an id to look for,
 * and nobody types the same diagnosis and the same paragraph of reasoning twice.
 * The logbook row carries everything the debrief shows except the two lists of
 * what went well and what was missed.
 */
async function findLoggedResult(diagnosis: string, reasoning: string): Promise<CaseResult | null> {
  const same = (a: unknown, b: string) => String(a ?? "").trim() === b.trim();

  const profile: LomaProfile = await loma.getProfile();
  const entry = (profile.history ?? []).find(
    (h) => same(h.final_diagnosis, diagnosis) && same(h.final_reasoning, reasoning),
  );
  if (!entry) return null;

  return {
    correct: entry.correct,
    reasoning_quality: entry.reasoning_quality,
    headline: entry.headline ?? "",
    overall: entry.overall,
    graded: entry.graded,
    metrics: entry.metrics,
    before: entry.before,
    after: entry.after,
    xp_reason: entry.xp_reason,
    final_diagnosis: entry.final_diagnosis,
    final_reasoning: entry.final_reasoning,
    correct_diagnosis: entry.correct_diagnosis,
    note: entry.note,
    duration_sec: entry.duration_sec,
  };
}

async function waitForLoggedResult(diagnosis: string, reasoning: string): Promise<CaseResult | null> {
  for (let poll = 0; poll < GRADE_POLLS; poll += 1) {
    try {
      const found = await findLoggedResult(diagnosis, reasoning);
      if (found) return found;
    } catch (err) {
      console.warn("Caseroom: the logbook could not be read while waiting for a grade", err);
    }
    await new Promise((resolve) => setTimeout(resolve, GRADE_POLL_DELAY_MS));
  }
  return null;
}

/**
 * What to say when a question does not come back.
 *
 * Never the server's own words. A failed turn arrives carrying whatever the
 * model provider said about it — "400 Failed to generate JSON. Please adjust
 * your prompt" — which is addressed to whoever wired the thing up, not to a
 * doctor mid-case. It tells them nothing they can act on, and it reads as if
 * they broke something by asking. The raw text goes to the console, where the
 * person it is written for can find it.
 *
 * What a doctor needs is only ever the same two facts: nothing was lost, and
 * asking again is worth a try. Which is true — a turn that fails to come back
 * as JSON almost always succeeds on the next attempt.
 */
function askFailureMessage(err: unknown): string {
  if (caseExpired(err)) {
    return "This case is no longer open, so it cannot answer. Start a new case to carry on.";
  }

  if (err instanceof LomaError && err.status === 429) {
    return "That was a lot of questions in a row. Give it a few seconds and ask again.";
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "You appear to be offline. Check your connection and ask again.";
  }

  return "That question did not come back. Ask it again — it usually works the second time.";
}

/**
 * One turn of the conversation.
 *
 * The attending's newest reply is written out rather than pasted in — the same
 * treatment Iris's analysis gets, for the same reason: this is a person
 * answering a question, and an answer that lands whole reads as a record being
 * displayed. Older replies never retype. Nobody wants to sit through a
 * conversation they have already had because they scrolled.
 */
function Turn({
  turn,
  typing,
  onDone,
}: {
  turn: CaseTurn;
  typing: boolean;
  onDone?: () => void;
}) {
  const motionOk = useMotionAllowed();
  const trainee = turn.role === "trainee";

  const { shown, done, finish } = useTypewriter(turn.content, {
    animate: typing && motionOk && !trainee,
    durationMs: REPLY_TYPING_MS,
  });

  const ref = useRef<HTMLDivElement>(null);

  /* Tell the case screen the reply is finished — it holds the next question
     until this is said, whether the writing ran its course or was cut short by
     a click. */
  useEffect(() => {
    if (typing && done) onDone?.();
  }, [typing, done, onDone]);

  /* Follow the words down as they arrive — but only if the reader is already at
     the bottom. Dragging them back down mid-sentence because a reply is growing
     somewhere below is worse than letting it grow off-screen. */
  useEffect(() => {
    if (done) return;
    const box = ref.current?.closest<HTMLElement>("[data-chat-scroll]");
    if (!box) return;
    if (box.scrollHeight - box.scrollTop - box.clientHeight < 120) {
      box.scrollTop = box.scrollHeight;
    }
  }, [shown, done]);

  return (
    <div
      ref={ref}
      onClick={done ? undefined : finish}
      title={done ? undefined : "Show the whole reply"}
      aria-busy={!done}
      className={`max-w-[85%] rounded-2xl px-4 py-3 ${
        trainee ? "ml-auto bg-accent/15 ring-1 ring-accent/25" : "bg-white/[0.04] ring-1 ring-white/[0.06]"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
        {trainee ? "You" : "Attending"}
      </p>
      <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-white/85">
        {shown}
        {done ? null : <Caret />}
      </p>
    </div>
  );
}

/**
 * `reviewId` turns this into the read-back of a finished case: the same three
 * columns, with nothing that can be typed into, sent or locked in.
 */
export function CasePlayer({ reviewId }: { reviewId?: number } = {}) {
  const router = useRouter();
  const review = typeof reviewId === "number";
  /* Said in the conversation column when a finished case has nothing to replay. */
  const [reviewNote, setReviewNote] = useState<string | null>(null);

  const [session, setSession] = useState<CaseSession | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  /* Bumped to ask for another patient after a failed one. */
  const [attempt, setAttempt] = useState(0);
  const [thread, setThread] = useState<CaseTurn[]>([]);
  const [input, setInput] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [typingLast, setTypingLast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* A question that did not come back, and what to say about it. Kept apart
     from `error` above, which is for the lock-in — one belongs in the
     conversation, the other does not. */
  const [askFailure, setAskFailure] = useState<{
    message: string;
    question: string;
    /** The case is gone from the platform, so the way on is a new one. */
    expired: boolean;
  } | null>(null);
  const [revealed, setRevealed] = useState<RevealedFinding[]>([]);
  const [showObjectives, setShowObjectives] = useState(false);
  const [lockInOpen, setLockInOpen] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<CaseResult | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [pane, setPane] = useState<Pane>("brief");

  /* The platform has let go of the case, found out at lock-in. */
  const [lockInExpired, setLockInExpired] = useState(false);
  /* A lock-in the site gave up waiting for, which the platform may yet finish. */
  const gradingOutstanding = useRef(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const startedAt = useRef<number | null>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const [fitHeight, setFitHeight] = useState<number | null>(null);

  /* Ask the platform to write a patient when the screen opens.
     `cancelled` guards the double-invoke of React's development strict mode —
     without it a case is generated, thrown away and generated again, which is
     two model calls for one case. */
  useEffect(() => {
    let cancelled = false;

    /* Reading a finished case back: nothing is generated and nothing is sent.
       The logbook row comes from the profile, the conversation from this
       browser's own copy. */
    if (review) {
      loma
        .getProfile()
        .then((profile: LomaProfile) => {
          if (cancelled) return;

          const entry = (profile.history ?? []).find((h) => h.id === reviewId);
          if (!entry) {
            setStartError("That case is not in your logbook.");
            return;
          }

          const saved = findSavedCase(entry);
          setElapsed(entry.duration_sec ?? 0);

          if (saved) {
            setSession(saved.session);
            setThread(saved.thread);
            setRevealed(Array.isArray(saved.revealed) ? saved.revealed : []);
            setReviewNote("No questions were asked in this case.");
            return;
          }

          setSession({
            session_id: "",
            title: entry.title,
            blurb: entry.title,
            source: "",
            brief: { presenting_complaint: entry.presenting_complaint, history: "", exam_visible: "" },
            withheld_keys: [],
            objectives: [],
          });
          setReviewNote(
            "The conversation for this case is not saved on this device. Cases you finish here from now on can be read back in full.",
          );
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          console.error("Caseroom: the finished case could not be opened", err);
          setStartError("This case could not be opened. Please try again.");
        });

      return () => {
        cancelled = true;
      };
    }

    /* A case already open in this tab — the page was refreshed mid-case. Put it
       back as it was rather than asking for another patient. */
    const open = readOpenCase();
    if (open) {
      startedAt.current = open.startedAt;
      setSession(open.session);
      setThread(open.thread);
      setRevealed(open.revealed);
      setShowObjectives(Boolean(open.showObjectives));

      /* A question that was still waiting for its answer when the page went.
         Whether the platform answered it is unknowable from here, so it is
         offered again rather than left hanging with nothing under it. */
      const last = open.thread[open.thread.length - 1];
      if (last?.role === "trainee") {
        setAskFailure({
          message: "The page was refreshed before this question was answered. Ask it again.",
          question: last.content,
          expired: false,
        });
      }

      return () => {
        cancelled = true;
      };
    }

    loma
      .startCase()
      .then((data: CaseSession) => !cancelled && setSession(data))
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("Caseroom: the case could not be started", err);
        setStartError(
          err instanceof LomaError && err.status === 429
            ? "Caseroom is busy writing patients right now. Try again in a moment."
            : "The patient could not be written. This is usually a hiccup rather than a fault — try again.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [attempt, review, reviewId]);

  // The session clock. Shown to the doctor, never used in scoring.
  useEffect(() => {
    if (!session || result || review) return;
    if (startedAt.current === null) startedAt.current = Date.now();

    const tick = setInterval(
      () => setElapsed(Math.floor((Date.now() - (startedAt.current ?? Date.now())) / 1000)),
      500,
    );
    return () => clearInterval(tick);
  }, [session, result]);

  /* Keep the open case up to date in this tab, for a refresh to find. Below the
     clock on purpose: that effect is what sets `startedAt` for a new case. Once
     the case is graded there is nothing left to resume. */
  useEffect(() => {
    if (review || !session) return;

    if (result) {
      clearOpenCase();
      return;
    }

    saveOpenCase({
      session,
      thread,
      revealed,
      showObjectives,
      startedAt: startedAt.current ?? Date.now(),
      savedAt: Date.now(),
    });
  }, [session, thread, revealed, showObjectives, result, review]);

  /* Leaving the case screen lets go of the case; a refresh does not, because a
     page being torn down never runs this. The drop is deferred a tick so that
     React's development strict mode — which unmounts and remounts at once —
     cancels it instead of wiping the case it is about to restore. */
  const leaveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (review) return;

    if (leaveTimer.current !== null) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    return () => {
      leaveTimer.current = window.setTimeout(clearOpenCase, 0);
    };
  }, [review]);

  /**
   * Give this screen the window, the way the standalone app had it.
   *
   * Two earlier goes at this tried to make the columns fit inside a page that
   * is built to scroll — first with a `calc(100vh - …)`, then by measuring the
   * same sum in JavaScript. Both lost to whatever piece of the shell the sum
   * got wrong, and being wrong by even a few pixels hands the scroll back to
   * the page, which then moves all three columns as one.
   *
   * So the page does not scroll here at all. While a case is open the document
   * is locked, and the columns are given exactly the room between where they
   * start and the bottom of the screen. Nothing is lost to the lock, because
   * everything inside those columns scrolls on its own.
   *
   * The lock is dropped on the way out, and never taken on a screen too short
   * to hold a workable case — under that floor the page goes back to scrolling
   * normally, which is worse than this but far better than a chat squeezed into
   * a slot with the rest cut off below the fold.
   */
  useEffect(() => {
    const el = columnsRef.current;
    if (!el) return;

    const root = document.documentElement;
    const previous = root.style.overflow;

    const fit = () => {
      const wide = window.matchMedia("(min-width: 1024px)").matches;

      /* Measured from the top of the screen, so the page has to be at the top
         for the reading to mean anything. It is about to be pinned there. */
      if (wide) window.scrollTo(0, 0);

      const room = Math.floor(window.innerHeight - el.getBoundingClientRect().top - BOTTOM_GAP);

      if (!wide || room < MIN_COLUMN_HEIGHT) {
        root.style.overflow = previous;
        setFitHeight(null);
        return;
      }

      root.style.overflow = "hidden";
      setFitHeight(room);
    };

    fit();
    window.addEventListener("resize", fit);

    return () => {
      window.removeEventListener("resize", fit);
      root.style.overflow = previous;
    };
    // The columns do not exist until the case does — before that this screen is
    // the "writing a patient" splash.
  }, [session]);

  /* Keep the newest turn in view. `nearest` so it moves the chat column and
     nothing else — the default walks every scrollable ancestor, which now
     includes the page itself. */
  useEffect(() => {
    // A finished case is read from the top, not from where it ended.
    if (review) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [thread, waiting, review]);

  /* Put a question to the attending. Separate from `send` below so a retry can
     ask the same question again without writing it into the case a second
     time — the doctor asked once, and the transcript should say so once. */
  const ask = useCallback(
    async (text: string) => {
      if (!session) return;

      setAskFailure(null);
      setWaiting(true);

      try {
        const data = await sendWithRetry(session.session_id, text);
        setThread((t) => [...t, { role: "attending", content: data.reply }]);
        setTypingLast(true);
        setRevealed(data.revealed);
      } catch (err) {
        // The real error, for whoever is debugging this rather than using it.
        console.error("Caseroom: the attending could not answer", err);
        setAskFailure({
          message: askFailureMessage(err),
          question: text,
          expired: caseExpired(err),
        });
      } finally {
        setWaiting(false);
      }
    },
    [session],
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || waiting || typingLast || !session) return;

    setThread((t) => [...t, { role: "trainee", content: text }]);
    setInput("");
    await ask(text);
  }, [input, waiting, typingLast, session, ask]);

  async function submitDiagnosis(diagnosis: string, reasoning: string) {
    if (!session) return;

    setEvaluating(true);
    setError(null);

    const finish = (data: CaseResult) => {
      setResult(data);
      setLockInOpen(false);
      saveFinishedCase({
        session,
        thread,
        revealed,
        result: {
          before: data.before,
          after: data.after,
          duration_sec: data.duration_sec,
          final_diagnosis: data.final_diagnosis,
          final_reasoning: data.final_reasoning,
        },
      });
    };

    try {
      const seconds = startedAt.current
        ? Math.floor((Date.now() - startedAt.current) / 1000)
        : 0;
      finish(await lockInWithRetry(session.session_id, diagnosis, reasoning, seconds));
    } catch (err) {
      /* Same rule as a failed question: the provider's words go to the console,
         and the doctor is told what is true and what to do about it. Their
         diagnosis and reasoning are still in the fields behind this. */
      console.error("Caseroom: the case could not be graded", err);

      /* The site stopped waiting, or an earlier go did and this one found the
         case closed. Either way the grade may be sitting in the logbook. */
      if (gaveUpWaiting(err) || (caseExpired(err) && gradingOutstanding.current)) {
        gradingOutstanding.current = true;
        const logged = gaveUpWaiting(err)
          ? await waitForLoggedResult(diagnosis, reasoning)
          : await findLoggedResult(diagnosis, reasoning).catch(() => null);
        if (logged) {
          finish(logged);
          return;
        }
      }

      if (caseExpired(err)) {
        setLockInExpired(true);
        setError(
          "This case is no longer open, so it cannot be graded. Start a new case to carry on.",
        );
        return;
      }

      setError(
        err instanceof LomaError && err.status === 429
          ? "The grader is busy right now. Give it a few seconds and submit again."
          : gaveUpWaiting(err)
            ? "Grading is taking much longer than usual. Your answer is still here — submit it again in a minute."
            : "That did not go through. Your answer is still here — submit it again.",
      );
    } finally {
      setEvaluating(false);
    }
  }

  /* Clear the desk and ask for another patient. For a case the platform has let
     go of — nothing on this screen can be sent to it any more. */
  function startNewCase() {
    // First, or the start effect would find the dead case and put it back.
    clearOpenCase();
    setSession(null);
    setThread([]);
    setRevealed([]);
    setInput("");
    setAskFailure(null);
    setError(null);
    setTypingLast(false);
    setShowObjectives(false);
    setLockInOpen(false);
    setLockInExpired(false);
    gradingOutstanding.current = false;
    setElapsed(0);
    startedAt.current = null;
    setAttempt((n) => n + 1);
  }

  const replyFinished = useCallback(() => setTypingLast(false), []);

  /* Answering is in progress: the attending is either thinking or still
     speaking. The next question waits for both. */
  const answering = waiting || typingLast;

  /* Back to the dashboard, refreshed. `refresh` matters: the dashboard is a
     server component holding the profile from before this case, so without it
     a doctor returns to their old XP and an empty row where the case they just
     finished should be. */
  const exit = useCallback(() => {
    router.push("/account/caseroom");
    router.refresh();
  }, [router]);

  if (startError) {
    return (
      <div className="mx-auto grid max-w-md gap-5 py-24 text-center">
        <p className="font-serif text-lg text-white">
          {review ? "Could not open the case" : "Could not start the case"}
        </p>
        <ErrorNote>{startError}</ErrorNote>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setStartError(null);
              setAttempt((n) => n + 1);
            }}
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-accent-soft"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={exit}
            className="rounded-full px-6 py-3 text-sm font-medium text-white/60 transition hover:text-white"
          >
            Back to Caseroom
          </button>
        </div>
      </div>
    );
  }

  if (!session && review) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <TypingDots label="Opening the case" />
        <p className="mt-5 font-serif text-lg text-white">Opening the case…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="grid place-items-center py-32 text-center">
        <TypingDots label="Writing a fresh patient" />
        <p className="mt-5 font-serif text-lg text-white">Writing a fresh patient…</p>
        <p className="mt-2 text-sm text-white/40">Grounded in a real published case report.</p>
      </div>
    );
  }

  const revealedKeys = revealed.map((r) => r.key);
  const foundCritical = revealed.some((r) => r.critical);
  const total = session.withheld_keys.length;

  /* Which objectives are done. The four are fixed by the platform, in this
     order, so the checks are positional. */
  const objectiveDone = [
    thread.some((m) => m.role === "trainee"),
    revealedKeys.length >= 3,
    foundCritical,
    Boolean(result) || review,
  ];

  const brief = (
    <Panel as="aside" className="quiet-scroll lg:h-full lg:overflow-y-auto">
      <Eyebrow>The patient</Eyebrow>
      {session.blurb ? (
        <p className="mt-3 font-serif text-base leading-snug text-white/90">{session.blurb}</p>
      ) : null}

      <div className="mt-6 grid gap-5">
        {[
          { title: "Presenting complaint", body: session.brief.presenting_complaint },
          { title: "History", body: session.brief.history },
          { title: "Examination", body: session.brief.exam_visible },
        ]
          // Only a read-back can be missing a block; a live case has all three.
          .filter((block) => !review || Boolean(block.body))
          .map((block) => (
            <section key={block.title}>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                {block.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-white/70">{block.body}</p>
            </section>
          ))}
      </div>

      <p className="mt-6 border-t border-white/[0.06] pt-4 text-[11px] uppercase tracking-[0.14em] text-white/30">
        AI-generated patient
      </p>
    </Panel>
  );

  const evidence = (
    <Panel as="aside" className="quiet-scroll lg:h-full lg:overflow-y-auto">
      <div className="flex items-baseline justify-between gap-4">
        <Eyebrow>Evidence</Eyebrow>
        <p className="text-sm tabular-nums text-white/45">
          <strong className="font-semibold text-white">{revealedKeys.length}</strong>/{total}
        </p>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: total ? `${(revealedKeys.length / total) * 100}%` : "0%" }}
        />
      </div>

      {/* Objectives are covered until asked for. They are a strong hint about
          where to look, and a doctor who wants to work the case cold should not
          have to avoid reading them. */}
      <div className="mt-6">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Objectives
        </h2>

        {showObjectives || review ? (
          <ul className="mt-3 grid gap-2">
            {session.objectives.map((label, i) => (
              <li
                key={label}
                className={`flex gap-2.5 text-sm leading-relaxed ${
                  objectiveDone[i] ? "text-white/70" : "text-white/40"
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-[0.3rem] grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full text-[9px] ${
                    objectiveDone[i] ? "bg-accent text-white" : "ring-1 ring-white/20"
                  }`}
                >
                  {objectiveDone[i] ? "✓" : ""}
                </span>
                {label}
              </li>
            ))}
          </ul>
        ) : (
          <button
            type="button"
            onClick={() => setShowObjectives(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-4 py-2 text-[13px] text-white/55 ring-1 ring-white/10 transition hover:text-white/80"
          >
            <Eye className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
            Need direction? Reveal objectives
          </button>
        )}
      </div>

      <ul className="mt-6 grid gap-2">
        {session.withheld_keys.map((key) => {
          const found = revealed.find((r) => r.key === key);
          return (
            <li
              key={key}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm ring-1 transition ${
                found
                  ? found.critical
                    ? "bg-[#CF7A70]/[0.08] text-white/85 ring-[#CF7A70]/25"
                    : "bg-white/[0.04] text-white/80 ring-white/10"
                  : "text-white/30 ring-white/[0.06]"
              }`}
            >
              {found ? (
                found.critical ? (
                  <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-[#CF7A70]" strokeWidth={1.8} aria-hidden />
                ) : (
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                )
              ) : (
                <Lock className="h-3.5 w-3.5 shrink-0 text-white/20" strokeWidth={1.8} aria-hidden />
              )}
              {/* The name of a finding is itself a clue, so a locked one is not
                  named — only counted. */}
              {found ? prettyKey(key) : "Locked finding"}
            </li>
          );
        })}
      </ul>
    </Panel>
  );

  return (
    /* Pulled up under the nav. The shell's top padding is set for pages that
       scroll, and on a screen that cannot, every pixel above the columns is a
       pixel taken off the case being read. */
    <div className="flex flex-col gap-4 lg:-mt-8">
      {/* Tabs only exist below the three-column breakpoint. */}
      <div className="flex gap-1 rounded-full bg-white/[0.04] p-1 ring-1 ring-white/[0.06] lg:hidden">
        {(
          [
            { id: "brief" as const, label: "The patient" },
            { id: "evidence" as const, label: `Evidence ${revealedKeys.length}/${total}` },
          ]
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPane(item.id)}
            aria-pressed={pane === item.id}
            className={`flex-1 rounded-full px-4 py-2 text-[13px] font-medium transition ${
              pane === item.id ? "bg-accent/15 text-accent" : "text-white/45"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* The measured height lands here as an inline style; the `calc` under it
          is only the first paint, deliberately a little short so that frame can
          leave a gap rather than clip. No `min-height` — with the page pinned,
          a floor taller than the screen would put the bottom of the columns
          somewhere nobody can scroll to.

          `min-h-0` is not a tweak, it is what makes the height above mean
          anything. A flex or grid child's default `min-height: auto` is its own
          content, so a height smaller than the content is quietly ignored and
          the box grows anyway — which is exactly what was happening every time
          this looked like a bad measurement. Every child that has to give way
          to the box carries it. */}
      <div
        ref={columnsRef}
        style={fitHeight ? { height: fitHeight } : undefined}
        className="grid min-h-0 gap-6 lg:h-[calc(100vh-20rem)] lg:grid-cols-[19rem_minmax(0,1fr)_19rem]"
      >
        <div className={`lg:min-h-0 ${pane === "brief" ? "" : "hidden lg:block"}`}>{brief}</div>

        <Panel className="flex min-h-[32rem] flex-col p-0 lg:min-h-0">
          {/* Same reason as above: without `min-h-0` a long conversation makes
              this box refuse to shrink, and it pushes the reply field off the
              bottom instead of scrolling. */}
          <div
            data-chat-scroll
            className="quiet-scroll min-h-0 flex-1 overflow-y-auto p-5 sm:p-6"
          >
            <div className="grid gap-4">
              {thread.length === 0 ? (
                <p className="max-w-md rounded-2xl bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white/60 ring-1 ring-white/[0.06]">
                  {review
                    ? reviewNote
                    : "Go ahead — ask about the history, request an examination or a test, or reason out loud. Lock in your diagnosis whenever you are ready."}
                </p>
              ) : null}

              {thread.map((turn, i) => (
                <Turn
                  key={i}
                  turn={turn}
                  typing={typingLast && i === thread.length - 1}
                  onDone={replyFinished}
                />
              ))}

              {waiting ? (
                <div className="max-w-[85%] rounded-2xl bg-white/[0.04] px-4 py-3.5 ring-1 ring-white/[0.06]">
                  <TypingDots label="The attending is replying" />
                </div>
              ) : null}

              {/* A failed turn sits where the answer would have been, and offers
                  the one thing that fixes it. The question above it stays put —
                  it was asked, and it is about to be asked again. */}
              {askFailure ? (
                <div className="max-w-[85%] rounded-2xl bg-[#CF7A70]/[0.08] px-4 py-3 ring-1 ring-[#CF7A70]/20">
                  <p className="text-sm leading-relaxed text-[#E0A49D]">{askFailure.message}</p>
                  <button
                    type="button"
                    onClick={() =>
                      askFailure.expired ? startNewCase() : void ask(askFailure.question)
                    }
                    className="mt-2 text-[13px] font-semibold text-accent transition hover:text-accent-soft"
                  >
                    {askFailure.expired ? "Start a new case" : "Ask again"}
                  </button>
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* A finished case has no reply box at all — not a disabled one. There
              is nothing left to ask, and a dead field invites trying. */}
          <div className={review ? "hidden" : "border-t border-white/[0.06] p-4 sm:p-5"}>
            <div className="flex items-end gap-3">
              {/* Never disabled. Disabling a field the doctor is typing in
                  hands focus back to the page, and they have to click into it
                  again to write the next question — so the box stays live and
                  writable throughout, and it is only *sending* that waits. */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends, Shift+Enter breaks the line. This is a chat,
                  // and a chat that needs a mouse to send is a form. While the
                  // attending is still answering, Enter holds rather than
                  // queues — one question at a time is how the case reads back.
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!answering) void send();
                  }
                }}
                placeholder={
                  answering
                    ? "The attending is answering…"
                    : "Ask about history, exam, or request a test…"
                }
                rows={2}
                aria-label="Your message to the attending"
                className="min-h-[3rem] flex-1 resize-none rounded-2xl bg-ink-800 px-4 py-3 text-sm leading-relaxed text-white/90 outline-none ring-1 ring-white/10 transition placeholder:text-white/25 focus:ring-accent/50"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={answering || !input.trim()}
                aria-label="Send"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:bg-white/[0.06] disabled:text-white/30"
              >
                <Send className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              </button>
            </div>
          </div>

          {/* The case controls, at the foot of the conversation rather than in a
              band of their own above the columns. That band cost about a
              hundred and twenty pixels of height on every screen and earned
              none of it, and this is where a doctor is already looking when
              they are ready to commit. */}
          {/* Wraps rather than squashes: "Back to Caseroom", the clock and
              "Lock in diagnosis" together need more than a 360px phone has, and
              nowrap turned the two buttons into slivers. Wrapped, the back link
              keeps the first line and the clock and the commit button take the
              second. */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5 border-t border-white/[0.06] px-4 py-3 sm:flex-nowrap sm:px-5">
            <button
              type="button"
              onClick={exit}
              className="inline-flex items-center gap-2 text-[13px] text-white/45 transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
              Back to Caseroom
            </button>

            {/* w-full on a phone, so this group always takes the second line
                whole and the clock and the button sit at its two ends rather
                than wherever the wrap happened to leave them. */}
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
              <span
                className="inline-flex items-center gap-1.5 text-[13px] tabular-nums text-white/40"
                title="Session time — does not affect your score"
              >
                <Clock className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
                {formatTime(elapsed)}
              </span>

              {review ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-white/50 ring-1 ring-white/10">
                  <Lock className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
                  Read-only
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setLockInOpen(true)}
                  className="rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  Lock in diagnosis
                </button>
              )}
            </div>
          </div>
        </Panel>

        <div className={`lg:min-h-0 ${pane === "evidence" ? "" : "hidden lg:block"}`}>
          {evidence}
        </div>
      </div>

      {lockInOpen ? (
        <LockInModal
          failure={error}
          onCancel={() => {
            setError(null);
            setLockInOpen(false);
          }}
          onSubmit={submitDiagnosis}
          onStartNew={lockInExpired ? startNewCase : undefined}
          submitting={evaluating}
        />
      ) : null}

      {result ? <ResultCard result={result} onClose={exit} /> : null}
    </div>
  );
}
