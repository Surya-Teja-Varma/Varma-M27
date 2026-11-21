import { Check, Coffee } from "lucide-react";
import type { CSSProperties } from "react";

import type { Week } from "@/data/types";
import { useMission } from "@/lib/mission-store";
import { weekStatus } from "@/lib/progress";
import { cn } from "@/lib/utils";

import { useRecentCompletion } from "./celebrate";
import { useMissionDrawer } from "./mission-drawer";

function chainLabel(w: Week) {
  const [head = "", tail = ""] = w.label.split(" · ");
  const month = head.split(" ")[0];
  return w.kind === "buffer" ? `${month} · Buffer` : `${month} · W${tail.slice(-2)}`;
}

const BURST = Array.from({ length: 8 }, (_, i) => ({ a: `${i * 45}deg`, d: "26px" }));

/** Connected 3D-style weekly blocks. Buffers sit in the chain without breaking it. */
export function StreakChain({ weeks, className }: { weeks: Week[]; className?: string }) {
  const state = useMission();
  const recent = useRecentCompletion();
  const { openMission } = useMissionDrawer();
  return (
    <div className={cn("-mx-1 overflow-x-auto px-1 pb-3 pt-1 scrollbar-none", className)}>
      <ol className="flex min-w-max items-stretch">
        {weeks.map((w, i) => {
          const status = weekStatus(w, state.weeks[w.id]);
          const prevDone =
            i > 0 && weekStatus(weeks[i - 1]!, state.weeks[weeks[i - 1]!.id]) === "completed";
          const linked = prevDone && (status === "completed" || status === "buffer");
          const justDone = recent === w.id && status === "completed";
          return (
            <li
              key={w.id}
              className="reveal flex items-center"
              style={{ "--i": i } as CSSProperties}
            >
              {i > 0 ? (
                <span
                  aria-hidden
                  className="relative h-1.5 w-4 overflow-hidden rounded-full bg-border sm:w-6"
                >
                  <span
                    className={cn(
                      "absolute inset-0 origin-left rounded-full bg-lime transition-transform duration-500 ease-vx",
                      linked ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => openMission(w.id)}
                aria-label={`${w.label}: ${w.title} — ${status.replace("-", " ")}`}
                className={cn(
                  "interactive group relative flex min-h-28 w-36 flex-col rounded-xl border p-3 text-left sm:w-40",
                  status === "completed" && "glow-lime block-3d-lime border-lime-ink/30 bg-lime",
                  status === "in-progress" &&
                    "block-3d border-primary/45 bg-card ring-2 ring-primary/15",
                  status === "upcoming" && "block-3d border-border bg-card/80",
                  status === "buffer" && "glow-cyan border-dashed border-cyan/50 bg-cyan-soft",
                  justDone && "animate-complete",
                )}
              >
                {status === "in-progress" ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 top-0 h-0.5 rounded-b-full bg-gradient-primary"
                  />
                ) : null}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "font-display text-[10px] font-semibold uppercase tracking-[0.14em]",
                      status === "completed"
                        ? "text-ink"
                        : status === "in-progress"
                          ? "text-primary-deep"
                          : "text-muted-foreground",
                    )}
                  >
                    {chainLabel(w)}
                  </span>
                  <span
                    className={cn(
                      "relative grid size-6 place-items-center rounded-full transition-colors duration-300",
                      status === "completed" && "bg-ink text-lime",
                      status === "in-progress" &&
                        "animate-pulse-ring bg-primary text-primary-foreground",
                      status === "upcoming" && "border border-border bg-surface",
                      status === "buffer" && "bg-card text-cyan-ink",
                    )}
                  >
                    {justDone
                      ? BURST.map((b, k) => (
                          <span
                            key={k}
                            aria-hidden
                            className="vx-burst-dot !size-1"
                            style={
                              {
                                background: k % 2 ? "var(--ink)" : "var(--primary)",
                                "--a": b.a,
                                "--d": b.d,
                                animationDelay: "250ms",
                              } as CSSProperties
                            }
                          />
                        ))
                      : null}
                    {status === "completed" ? (
                      justDone ? (
                        <svg
                          viewBox="0 0 24 24"
                          className="size-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3.4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12.5 10 17 19 7.5" className="animate-draw" />
                        </svg>
                      ) : (
                        <Check className="size-3.5" strokeWidth={3} />
                      )
                    ) : null}
                    {status === "buffer" ? <Coffee className="size-3" /> : null}
                    {status === "in-progress" ? (
                      <span className="size-1.5 rounded-full bg-card" />
                    ) : null}
                  </span>
                </div>
                <span
                  className={cn(
                    "mt-2 line-clamp-2 text-xs font-medium leading-snug",
                    status === "completed"
                      ? "text-ink"
                      : status === "upcoming"
                        ? "text-muted-foreground"
                        : "text-foreground",
                  )}
                >
                  {w.title}
                </span>
                <span
                  className={cn(
                    "mt-auto pt-2 text-[10px] font-semibold uppercase tracking-wider",
                    status === "completed"
                      ? "text-ink/70"
                      : status === "in-progress"
                        ? "text-primary-deep"
                        : "text-subtle",
                  )}
                >
                  {status === "buffer" ? "Catch-up · never breaks" : status.replace("-", " ")}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
