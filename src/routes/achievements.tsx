import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Flame,
  ListChecks,
  Lock,
  Medal,
  Rocket,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";

import { useMissionDrawer } from "@/components/vx/mission-drawer";
import {
  AnimatedNumber,
  PageHeader,
  ProgressBar,
  SectionHeading,
  TONE_CHIP,
} from "@/components/vx/primitives";
import { DataControls } from "@/components/vx/reset-progress";
import { StreakChain } from "@/components/vx/streak-chain";
import { AUDIT_ITEMS } from "@/data/audit";
import { useMission } from "@/lib/mission-store";
import {
  achievementProgress,
  ACHIEVEMENTS,
  computeStats,
  getAllWeeks,
  getMergedMilestones,
  getMergedPhases,
  kolkataDateKey,
  milestoneCleared,
  unlockedAchievements,
} from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — VARMA 27" },
      {
        name: "description",
        content:
          "Weekly streak chain, best streak, completed missions and achievements earned only when real conditions are met.",
      },
      { property: "og:title", content: "Achievements — VARMA 27" },
      {
        property: "og:description",
        content: "Streaks that motivate, never punish. Buffer weeks never break the chain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Achievements,
});

const ICONS: Record<string, typeof Award> = {
  "first-mission": Rocket,
  consistency: Flame,
  momentum: Zap,
  unstoppable: Trophy,
  "foundation-ready": Medal,
  "ai-builder": Sparkles,
  "ship-it": Rocket,
};

const TONE_GLOW: Record<string, string> = {
  orange: "",
  lime: "glow-lime",
  cyan: "glow-cyan",
  violet: "glow-violet",
};

function Achievements() {
  const state = useMission();
  const { openMission } = useMissionDrawer();
  const allWeeks = getAllWeeks(state);
  const phases = getMergedPhases(state);
  const milestones = getMergedMilestones(state);
  const stats = computeStats(allWeeks, state);
  const auditIds = AUDIT_ITEMS.map((i) => i.id);
  const unlocked = unlockedAchievements(allWeeks, state, auditIds);
  const progressMap = achievementProgress(allWeeks, state, auditIds);

  const completedHistory = allWeeks
    .filter((w) => w.kind === "mission" && state.weeks[w.id]?.completedAt)
    .map((w) => {
      const iso = state.weeks[w.id]!.completedAt!;
      const kolkataDay = state.completionHistory[w.id] ?? kolkataDateKey(new Date(iso));
      return { week: w, completedAt: iso, kolkataDay };
    })
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  return (
    <div className="space-y-8">
      <PageHeader
        code="Gamification"
        title="EVERY WEEK, A STRONGER ENGINEER."
        description="Streaks grow only when you complete a mission — never by opening a card. Buffer blocks sit in the chain without breaking it."
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <BigStat
          icon={Flame}
          label="Current streak"
          value={stats.currentStreak}
          unit="weeks"
          highlight
        />
        <BigStat icon={TrendingUp} label="Best streak" value={stats.bestStreak} unit="weeks" />
        <BigStat
          icon={CheckCircle2}
          label="Completed weeks"
          value={stats.completedWeeks}
          unit={`/ ${stats.totalWeeks}`}
        />
        <BigStat icon={ListChecks} label="Completed tasks" value={stats.tasksDone} unit="tasks" />
      </section>

      <section>
        <SectionHeading
          eyebrow="Achievement vault"
          title={`${unlocked.size} of ${ACHIEVEMENTS.length} unlocked`}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const on = unlocked.has(a.id);
            const Icon = ICONS[a.id] ?? Award;
            const prog = progressMap[a.id];
            const ratio = prog && prog.target > 0 ? Math.min(1, prog.current / prog.target) : 0;

            return (
              <div
                key={a.id}
                className={cn(
                  "panel lift group relative flex flex-col overflow-hidden p-5 transition-[border-color,box-shadow,transform,opacity] duration-300 ease-vx",
                  on
                    ? cn(TONE_GLOW[a.tone], "border-lime-ink/25")
                    : "opacity-85 hover:border-primary/30 hover:opacity-100",
                )}
              >
                {on ? (
                  <div className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-lime/40 blur-2xl" />
                ) : null}
                <div className="relative flex items-start gap-3">
                  <span
                    className={cn(
                      "block-3d grid size-12 shrink-0 place-items-center rounded-xl border transition-transform duration-300 ease-vx-spring group-hover:scale-105",
                      on
                        ? cn(TONE_CHIP[a.tone], "animate-pop")
                        : "border-border bg-surface text-subtle",
                    )}
                  >
                    {on ? <Icon className="size-5" /> : <Lock className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold">{a.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>
                  </div>
                </div>
                <div className="relative mt-auto pt-4">
                  <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
                    <span className={on ? "text-lime-ink" : "text-subtle"}>
                      {on ? "Unlocked" : "Locked"}
                    </span>
                    {prog ? (
                      <span className="tabular text-muted-foreground">{prog.label}</span>
                    ) : null}
                  </div>
                  <ProgressBar
                    value={on ? 1 : ratio}
                    tone={on ? "lime" : "orange"}
                    className="h-1"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Monthly achievements" title="Months cleared" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {milestones.map((m) => {
            const on = milestoneCleared(m, state.weeks);
            const missions = m.weeks.filter((w) => w.kind === "mission");
            const done = missions.filter((w) => state.weeks[w.id]?.completedAt).length;
            const targetWeek = missions.find((w) => !state.weeks[w.id]?.completedAt) ?? missions[0];

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => targetWeek && openMission(targetWeek.id)}
                className={cn(
                  "interactive flex flex-col rounded-xl border p-3.5 text-left",
                  on ? "glow-lime border-lime-ink/25 bg-lime shadow-glow-lime" : "bg-card",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("hud-label !text-[9px]", on && "!text-ink")}>{m.label}</p>
                  {on ? (
                    <span className="grid size-4 shrink-0 place-items-center rounded-full bg-ink text-lime">
                      <Check className="size-2.5" strokeWidth={3.5} />
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-snug">{m.title}</p>
                <div className="mt-auto pt-3">
                  <ProgressBar
                    value={missions.length ? done / missions.length : 0}
                    tone={on ? "lime" : "orange"}
                    className={cn("h-1", on && "bg-ink/15")}
                  />
                  <p
                    className={cn(
                      "mt-1 text-[10px] tabular",
                      on ? "font-semibold text-ink/80" : "text-muted-foreground",
                    )}
                  >
                    {done}/{missions.length} missions
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Completion history · Asia/Kolkata" title="Completed mission log" />
        {completedHistory.length === 0 ? (
          <div className="panel flex items-center gap-3 p-5 text-sm text-muted-foreground">
            <CalendarCheck2 className="size-5 shrink-0 text-subtle" />
            <span>
              No missions completed yet. Once you lock in a weekly mission, its verified IST
              completion date appears here.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {completedHistory.map(({ week, kolkataDay }) => (
              <button
                key={week.id}
                type="button"
                onClick={() => openMission(week.id)}
                className="interactive glow-lime flex items-center justify-between gap-3 rounded-xl border border-lime-ink/25 bg-lime-soft/70 px-4 py-3 text-left"
              >
                <div className="min-w-0">
                  <p className="hud-label !text-[9px] text-lime-ink">{week.label}</p>
                  <p className="truncate font-display text-sm font-semibold">{week.title}</p>
                </div>
                <span className="shrink-0 rounded-md border border-lime-ink/20 bg-card px-2 py-0.5 font-display text-[10px] font-semibold tabular text-ink">
                  {kolkataDay}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {phases.map((p) => {
        const weeks = p.milestones.flatMap((m) => m.weeks);
        return (
          <section key={p.id}>
            <SectionHeading eyebrow={`${p.code} · ${p.period}`} title={`${p.name} chain`} />
            <StreakChain weeks={weeks} />
          </section>
        );
      })}

      <section className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="hud-label !text-[9px]">Data &amp; backup</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Export or restore a JSON snapshot of your mission state at any time.
          </p>
        </div>
        <DataControls />
      </section>
    </div>
  );
}

function BigStat({
  icon: Icon,
  label,
  value,
  unit,
  highlight,
}: {
  icon: typeof Flame;
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "panel lift group relative overflow-hidden p-5 hover:border-primary/35",
        highlight && value > 0 && "glow-lime border-lime-ink/25 bg-lime-soft",
      )}
    >
      <p className="hud-label flex items-center gap-1.5 !text-[9px]">
        <Icon
          className={cn(
            "size-3.5 transition-transform duration-200 group-hover:scale-110",
            highlight ? "text-primary" : "text-subtle",
          )}
        />
        {label}
      </p>
      <p className="mt-2 font-display text-4xl font-bold tabular sm:text-5xl">
        <AnimatedNumber value={value} />
        <span className="ml-1.5 text-sm font-medium text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}
