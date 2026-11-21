import { Flame, Trophy } from "lucide-react";
import { useEffect, type CSSProperties } from "react";

import { Button } from "@/components/ui/button";

export type Celebration = { weekLabel: string; title: string; streak: number; best: number };

const CONFETTI_TONES = [
  "var(--primary)",
  "var(--lime)",
  "var(--cyan)",
  "var(--violet)",
  "var(--primary-deep)",
];
// Deterministic spread so the burst looks designed, not noisy. 24 nodes, one shot.
const CONFETTI = Array.from({ length: 24 }, (_, i) => {
  const angle = (i / 24) * Math.PI * 2 + (i % 2 ? 0.18 : -0.12);
  const dist = 170 + ((i * 37) % 90);
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist * 0.8 + 60,
    r: ((i * 83) % 360) - 180,
    color: CONFETTI_TONES[i % CONFETTI_TONES.length]!,
    delay: (i % 6) * 25,
  };
});
const BURST = Array.from({ length: 10 }, (_, i) => ({
  a: `${i * 36}deg`,
  d: `${46 + (i % 3) * 8}px`,
}));

/** Short, restrained "Mission completed" moment shown once after a week is locked in. */
export function MissionCompleteOverlay({
  info,
  onClose,
}: {
  info: Celebration;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="animate-overlay-in fixed inset-0 z-[60] grid place-items-center overflow-hidden bg-background/75 p-5 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="vx-confetti"
            style={
              {
                background: c.color,
                "--x": `${c.x}px`,
                "--y": `${c.y}px`,
                "--r": `${c.r}deg`,
                animationDelay: `${150 + c.delay}ms`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div
        className="animate-card-in panel relative w-full max-w-sm overflow-hidden p-7 text-center shadow-lift"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hud-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(circle_at_50%_25%,black,transparent_70%)]" />
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-energy" />
        <div className="relative mx-auto grid size-20 place-items-center">
          {BURST.map((b, i) => (
            <span
              key={i}
              aria-hidden
              className="vx-burst-dot"
              style={
                {
                  background: i % 2 ? "var(--lime-ink)" : "var(--primary)",
                  "--a": b.a,
                  "--d": b.d,
                  animationDelay: "380ms",
                } as CSSProperties
              }
            />
          ))}
          <span className="animate-pop grid size-20 place-items-center rounded-full bg-lime shadow-glow-lime">
            <svg
              viewBox="0 0 24 24"
              className="size-10"
              fill="none"
              stroke="var(--ink)"
              strokeWidth={2.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12.5 10 17 19 7.5" className="animate-draw" />
            </svg>
          </span>
        </div>
        <p
          className="animate-rise hud-label relative mt-5 !tracking-[0.3em] text-lime-ink"
          style={{ animationDelay: "250ms" }}
        >
          Mission completed
        </p>
        <h2
          className="animate-rise relative mt-2 font-display text-2xl font-bold leading-tight"
          style={{ animationDelay: "320ms" }}
        >
          Another step closer to your 2027 goal.
        </h2>
        <p
          className="animate-rise relative mt-2 text-sm text-muted-foreground"
          style={{ animationDelay: "380ms" }}
        >
          {info.weekLabel} · {info.title}
        </p>
        <div
          className="animate-rise relative mt-5 grid grid-cols-2 gap-2"
          style={{ animationDelay: "450ms" }}
        >
          <div className="rounded-xl border border-primary/25 bg-primary-soft p-3">
            <p className="hud-label flex items-center justify-center gap-1.5 !text-[9px] text-primary-deep">
              <Flame className="size-3.5" /> Current streak
            </p>
            <p className="mt-1 font-display text-2xl font-bold tabular">
              {info.streak}{" "}
              <span className="text-sm font-medium text-muted-foreground">
                wk{info.streak === 1 ? "" : "s"}
              </span>
            </p>
          </div>
          <div className="rounded-xl border bg-surface p-3">
            <p className="hud-label flex items-center justify-center gap-1.5 !text-[9px]">
              <Trophy className="size-3.5" /> Best streak
            </p>
            <p className="mt-1 font-display text-2xl font-bold tabular">
              {info.best}{" "}
              <span className="text-sm font-medium text-muted-foreground">
                wk{info.best === 1 ? "" : "s"}
              </span>
            </p>
          </div>
        </div>
        <Button
          variant="mission"
          size="xl"
          className="animate-rise relative mt-6 w-full"
          style={{ animationDelay: "520ms" }}
          onClick={onClose}
          autoFocus
        >
          Keep building
        </Button>
      </div>
    </div>
  );
}
