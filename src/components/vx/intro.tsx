import { useCallback, useEffect, useState } from "react";

import { VxEmblem } from "./emblem";

const SEEN_KEY = "vx-intro-seen";
const PLAYING_CLASS = "vx-intro-playing";
const SEEN_CLASS = "vx-intro-seen";

/** Visual sequence length before the hand-off to the dashboard (ms). */
const SEQUENCE_MS = 2900;
const REDUCED_MS = 650;
const EXIT_MS = 560;

const LETTERS: { ch: string; accent?: boolean; gap?: boolean }[] = [
  { ch: "V" },
  { ch: "A" },
  { ch: "R" },
  { ch: "M" },
  { ch: "A" },
  { ch: "2", accent: true, gap: true },
  { ch: "7", accent: true },
];

function releaseApp() {
  document.documentElement.classList.remove(PLAYING_CLASS);
}

/**
 * Launch sequence — plays on the first entry of a browser session, never on page changes.
 * Brand emergence → typography → mission loader → dashboard glides in as the overlay lifts.
 */
export function MissionIntro() {
  const [phase, setPhase] = useState<"show" | "leaving" | "gone">("show");

  const leave = useCallback(() => {
    setPhase((p) => (p === "show" ? "leaving" : p));
    releaseApp();
  }, []);

  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      /* ignore */
    }
    if (seen) {
      releaseApp();
      setPhase("gone");
      return;
    }
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(leave, reduced ? REDUCED_MS : SEQUENCE_MS);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") leave();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [leave]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const t = window.setTimeout(() => {
      setPhase("gone");
      document.documentElement.classList.add(SEEN_CLASS);
    }, EXIT_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "gone") return null;
  const leaving = phase === "leaving";

  return (
    <div
      className={`vx-intro fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-card ${leaving ? "animate-intro-out" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="VARMA 27 Mission 2027 launch"
    >
      {/* Ambient light */}
      <div className="animate-ambient pointer-events-none absolute inset-0 bg-gradient-hero" />
      <div className="hud-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_center,black,transparent_65%)]" />
      <div className="animate-ambient pointer-events-none absolute left-1/2 top-1/2 size-[min(560px,120vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div
        className={`relative flex w-full max-w-md flex-col items-center px-6 text-center ${leaving ? "animate-intro-content-out" : ""}`}
      >
        {/* Stage 1 — brand emergence */}
        <div className="animate-emblem drop-shadow-[0_18px_30px_color-mix(in_oklab,var(--primary)_32%,transparent)]">
          <VxEmblem className="size-20 sm:size-24" />
        </div>

        {/* Stage 2 — brand typography */}
        <h1
          className="mt-6 flex font-display text-5xl font-bold leading-none tracking-[-0.03em] [perspective:600px] sm:text-6xl"
          aria-label="VARMA 27"
        >
          {LETTERS.map((item, i) => (
            <span
              key={i}
              aria-hidden
              className={`animate-letter inline-block ${item.accent ? "text-primary" : "text-foreground"} ${item.gap ? "ml-3" : ""}`}
              style={{ animationDelay: `${380 + i * 50}ms` }}
            >
              {item.ch}
            </span>
          ))}
        </h1>
        <div className="animate-rise relative mt-3" style={{ animationDelay: "820ms" }}>
          <p className="font-display text-sm font-semibold uppercase tracking-[0.48em] text-primary-deep sm:text-base">
            Mission 2027
          </p>
          <span
            className="animate-line absolute -bottom-1.5 left-1/2 h-[3px] w-10 -translate-x-1/2 rounded-full bg-lime"
            style={{ animationDelay: "1050ms", transformOrigin: "center" }}
            aria-hidden
          />
        </div>

        {/* Stage 3 — mission loader */}
        <p
          className="animate-rise mt-8 text-sm text-muted-foreground sm:text-base"
          style={{ animationDelay: "1150ms" }}
        >
          Your next level starts with today&apos;s mission.
        </p>
        <div className="animate-rise mt-5 w-56 sm:w-72" style={{ animationDelay: "1250ms" }}>
          <div className="relative h-[3px] rounded-full bg-surface">
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div
                className="animate-line absolute inset-0 rounded-full bg-gradient-primary"
                style={{ animationDelay: "1300ms" }}
              />
            </div>
            <div
              className="animate-travel absolute inset-0"
              style={{ animationDelay: "1300ms" }}
              aria-hidden
            >
              <span className="absolute -right-1 top-1/2 size-2.5 -translate-y-1/2 rounded-full bg-lime shadow-[0_0_0_3px_color-mix(in_oklab,var(--lime)_35%,transparent),0_0_14px_var(--lime)]" />
            </div>
          </div>
          <div className="relative mt-3 h-4">
            <p
              className="animate-fade-out absolute inset-x-0 font-display text-[10px] font-semibold uppercase tracking-[0.3em] text-subtle"
              style={{ animationDelay: "2200ms" }}
            >
              Initializing your mission…
            </p>
            <p
              className="animate-rise absolute inset-x-0 font-display text-[10px] font-bold uppercase tracking-[0.3em] text-primary-deep"
              style={{ animationDelay: "2300ms" }}
            >
              Ready to build?
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={leave}
        className="press absolute bottom-6 right-6 rounded-full border border-border bg-card/90 px-4 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur transition-colors duration-200 hover:border-primary/40 hover:text-primary-deep"
      >
        Skip intro <span className="ml-1 hidden text-[10px] text-subtle sm:inline">· Esc</span>
      </button>
    </div>
  );
}

export const IntroSequence = MissionIntro;
