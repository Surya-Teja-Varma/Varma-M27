import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, Wrench } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { announceAchievements } from "@/components/vx/celebrate";
import { WeekRow } from "@/components/vx/mission-card";
import { useMissionDrawer } from "@/components/vx/mission-drawer";
import {
  AnimatedNumber,
  PageHeader,
  ProgressBar,
  SectionHeading,
  StatusPill,
  TONE_CHIP,
  TONE_DOT,
} from "@/components/vx/primitives";
import { AUDIT_GROUPS, AUDIT_LEVELS, AUDIT_WEEKS } from "@/data/audit";
import { getMilestone, PHASES } from "@/data/roadmap";
import { summarizeAudit } from "@/lib/audit-summary";
import { actions, useMission } from "@/lib/mission-store";
import { getMergedMilestones, weekStatus } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/foundation-audit")({
  head: () => ({
    meta: [
      { title: "Foundation Audit — VARMA 27" },
      {
        name: "description",
        content:
          "Phase 0: audit existing full-stack knowledge, classify every topic and repair only the real gaps.",
      },
      { property: "og:title", content: "Foundation Audit — VARMA 27" },
      {
        property: "og:description",
        content:
          "Rebuild only what needs rebuilding. A three-week diagnostic and targeted revision phase.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FoundationAudit,
});

type WeekFilter = 0 | 1 | 2 | 3;
type StatusFilter = "all" | "unassessed" | "gaps" | "ready";

function FoundationAudit() {
  const state = useMission();
  const summary = summarizeAudit(state);
  const { openMission } = useMissionDrawer();
  const phase = PHASES[0]!;
  const audit = getMergedMilestones(state).find((m) => m.id === "audit") ?? getMilestone("audit")!;
  const [weekFilter, setWeekFilter] = useState<WeekFilter>(0);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filterItem = (id: string, week: 1 | 2 | 3) => {
    if (weekFilter !== 0 && week !== weekFilter) return false;
    const a = state.audit[id];
    if (statusFilter === "unassessed") return !a?.level;
    if (statusFilter === "gaps") return Boolean(a?.level && a.level !== "confident" && !a.revised);
    if (statusFilter === "ready")
      return Boolean(a?.level === "confident" || (a?.level && a.revised));
    return true;
  };

  return (
    <div className="space-y-8">
      <PageHeader
        code={`${phase.code} · ${phase.period}`}
        title={phase.heading}
        description={phase.description}
        aside={
          <div className="panel-glass lift w-full p-4 lg:w-64">
            <p className="hud-label !text-[9px]">Foundation readiness</p>
            <p className="mt-1 font-display text-4xl font-bold tabular">
              <AnimatedNumber value={Math.round(summary.readiness * 100)} />%
            </p>
            <ProgressBar
              value={summary.readiness}
              tone={summary.readiness >= 1 ? "lime" : "orange"}
              className="mt-2"
            />
            <p className="mt-2 text-[11px] text-muted-foreground tabular">
              {summary.assessed}/{summary.total} topics assessed · {summary.repaired} repaired
            </p>
          </div>
        }
      />

      <section>
        <SectionHeading eyebrow="Diagnostic schedule" title="Three diagnostic weeks" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {AUDIT_WEEKS.map((w) => {
            const missionWeek = audit.weeks[w.week - 1];
            const status = missionWeek
              ? weekStatus(missionWeek, state.weeks[missionWeek.id])
              : "upcoming";
            return (
              <button
                key={w.week}
                type="button"
                onClick={() => missionWeek && openMission(missionWeek.id)}
                className={cn(
                  "panel interactive group flex flex-col p-4 text-left",
                  status === "completed" && "glow-lime border-lime-ink/25 bg-lime-soft/50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="hud-label text-primary-deep">
                    Week {String(w.week).padStart(2, "0")}
                  </p>
                  <StatusPill status={status} />
                </div>
                <p className="mt-2 font-display font-semibold transition-colors group-hover:text-primary-deep">
                  {w.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{w.focus}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary-deep">
                  Open diagnostic mission <ArrowRight className="size-3.5" />
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {audit.weeks.map((w) => (
            <WeekRow key={w.id} week={w} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="NxtWave learning material"
          title="Assess every topic honestly"
          action={
            <div className="flex flex-wrap gap-1.5">
              {AUDIT_LEVELS.map((l) => (
                <span
                  key={l.id}
                  className={cn(
                    "rounded-md border px-2 py-0.5 text-[11px] font-medium",
                    TONE_CHIP[l.tone],
                  )}
                >
                  {l.label}
                </span>
              ))}
            </div>
          }
        />
        <p className="-mt-2 mb-4 text-xs text-muted-foreground">
          Reference % values are portal-provided figures, not verified personal completion. Skip
          anything you can already demonstrate confidently.
        </p>

        {/* Week & status filters */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card/80 p-2.5">
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter by diagnostic week">
            {([0, 1, 2, 3] as WeekFilter[]).map((wk) => (
              <button
                key={wk}
                type="button"
                aria-pressed={weekFilter === wk}
                onClick={() => setWeekFilter(wk)}
                className={cn(
                  "press h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors",
                  weekFilter === wk
                    ? "border-primary/30 bg-primary-soft text-primary-deep"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-surface hover:text-foreground",
                )}
              >
                {wk === 0 ? "All weeks" : `Week ${wk}`}
              </button>
            ))}
          </div>
          <div
            className="flex flex-wrap gap-1"
            role="group"
            aria-label="Filter by assessment status"
          >
            {(
              [
                { id: "all", label: "All topics" },
                { id: "unassessed", label: "Unassessed" },
                { id: "gaps", label: "Open gaps" },
                { id: "ready", label: "Ready" },
              ] as const
            ).map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={statusFilter === s.id}
                onClick={() => setStatusFilter(s.id)}
                className={cn(
                  "press h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors",
                  statusFilter === s.id
                    ? "border-cyan/35 bg-cyan-soft text-cyan-ink"
                    : "border-transparent text-muted-foreground hover:border-border hover:bg-surface hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {AUDIT_GROUPS.map((g) => {
            const visibleItems = g.items.filter((i) => filterItem(i.id, i.week));
            if (visibleItems.length === 0) return null;
            const assessed = g.items.filter((i) => state.audit[i.id]?.level).length;
            return (
              <div
                key={g.id}
                className="panel overflow-hidden transition-[border-color,box-shadow] duration-300 hover:border-primary/30 hover:shadow-hover"
              >
                <div className="flex items-center justify-between gap-3 border-b bg-surface/60 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold">{g.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <ProgressBar
                        value={g.items.length ? assessed / g.items.length : 0}
                        tone={assessed === g.items.length ? "lime" : "orange"}
                        className="h-1 max-w-28"
                      />
                      <p className="text-[11px] text-muted-foreground tabular">
                        {assessed}/{g.items.length} assessed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold tabular">{g.reference}%</p>
                    <p className="hud-label !text-[8px]">Portal reference</p>
                  </div>
                </div>
                <ul className="divide-y">
                  {visibleItems.map((item) => {
                    const a = state.audit[item.id];
                    const needsWork = a?.level && a.level !== "confident";
                    return (
                      <li
                        key={item.id}
                        id={`audit-item-${item.id}`}
                        className="p-4 transition-colors duration-200 hover:bg-surface/35"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium leading-snug">{item.label}</p>
                          <span className="shrink-0 rounded border border-border/80 bg-surface px-1.5 py-0.5 font-display text-[10px] font-semibold text-muted-foreground">
                            W{item.week}
                          </span>
                        </div>
                        <div
                          className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4"
                          role="radiogroup"
                          aria-label={`Assessment for ${item.label}`}
                        >
                          {AUDIT_LEVELS.map((l) => {
                            const on = a?.level === l.id;
                            return (
                              <button
                                key={l.id}
                                type="button"
                                role="radio"
                                aria-checked={on}
                                onClick={() =>
                                  announceAchievements(actions.setAuditLevel(item.id, l.id))
                                }
                                className={cn(
                                  "press flex min-h-10 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 text-[11px] font-semibold uppercase tracking-wide transition-[border-color,background-color,box-shadow,transform] duration-200 ease-vx",
                                  on
                                    ? cn(TONE_CHIP[l.tone], "shadow-panel ring-2 ring-primary/15")
                                    : "border-border bg-card text-muted-foreground hover:-translate-y-px hover:border-primary/35 hover:text-foreground",
                                )}
                              >
                                <span
                                  className={cn(
                                    "size-1.5 rounded-full",
                                    on ? TONE_DOT[l.tone] : "bg-border",
                                  )}
                                />
                                {l.label}
                              </button>
                            );
                          })}
                        </div>
                        {needsWork ? (
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={a.revised}
                            onClick={() => actions.toggleRevised(item.id)}
                            className={cn(
                              "press mt-2.5 flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-xs transition-[background-color,border-color] duration-200",
                              a.revised
                                ? "border-lime-ink/30 bg-lime-soft text-lime-ink"
                                : "border-border bg-surface/70 text-muted-foreground hover:border-primary/35 hover:text-foreground",
                            )}
                          >
                            <span
                              className={cn(
                                "grid size-5 shrink-0 place-items-center rounded border-2 transition-colors duration-200",
                                a.revised
                                  ? "border-lime-ink bg-lime text-ink"
                                  : "border-subtle bg-card",
                              )}
                            >
                              {a.revised ? <Check className="size-3.5" strokeWidth={3} /> : null}
                            </span>
                            <span className={a.revised ? "font-semibold" : ""}>
                              {a.revised
                                ? "Revised — gap repaired"
                                : "Mark as revised once the gap is repaired"}
                            </span>
                          </button>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel hud-corners relative overflow-hidden p-6 sm:p-8">
        <div className="hud-grid pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <p className="hud-label text-primary-deep">End of Phase 0</p>
            <h2 className="mt-2 text-2xl font-bold">Foundation readiness summary</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Confident topics plus repaired gaps, out of every audited topic.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              {AUDIT_LEVELS.map((l) => (
                <div
                  key={l.id}
                  className={cn(
                    "lift rounded-lg border p-3 transition-transform duration-200",
                    TONE_CHIP[l.tone],
                  )}
                >
                  <p className="font-display text-2xl font-bold tabular">
                    <AnimatedNumber value={summary.counts[l.id]} />
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider">{l.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="hud-label flex items-center gap-2">
              <Wrench className="size-3.5 text-primary" /> Repair list
            </p>
            {summary.assessed === 0 ? (
              <p className="mt-3 rounded-lg bg-surface p-4 text-sm text-muted-foreground">
                Start assessing topics above — weak spots will appear here.
              </p>
            ) : summary.weak.length === 0 ? (
              <p className="mt-3 flex items-center gap-2 rounded-lg border border-lime-ink/25 bg-lime-soft p-4 text-sm font-medium text-lime-ink">
                <CheckCircle2 className="size-4" /> No open gaps among assessed topics.
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {summary.weak.map((w) => (
                  <li
                    key={w.id}
                    className="group flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2 text-sm transition-[border-color,transform] duration-200 hover:-translate-y-px hover:border-primary/35"
                  >
                    <AlertTriangle className="size-3.5 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1 truncate">{w.label}</span>
                    <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                      W{w.week}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        actions.toggleRevised(w.id);
                        toast.success("Gap repaired", { description: w.label });
                      }}
                      className="press shrink-0 rounded-md border border-lime-ink/30 bg-lime-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-lime-ink transition-colors hover:bg-lime hover:text-ink"
                    >
                      Mark revised
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
