import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  ChevronRight,
  Clock,
  Cloud,
  Flame,
  Layers,
  Loader2,
  Rocket,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";
import type { CSSProperties } from "react";

import illustration from "@/assets/vx-illustration.jpg";
import { Button } from "@/components/ui/button";
import { NextMissionSpotlight } from "@/components/vx/mission-card";
import { useMissionDrawer } from "@/components/vx/mission-drawer";
import {
  AnimatedNumber,
  ProgressBar,
  RadialProgress,
  SectionHeading,
  Tag,
  TONE_DOT,
} from "@/components/vx/primitives";
import { StreakChain } from "@/components/vx/streak-chain";
import { AUDIT_LEVELS } from "@/data/audit";
import { FEATURED_WEEK_ID, getMilestone, getPhase } from "@/data/roadmap";
import { skillKey } from "@/data/skills";
import { summarizeAudit } from "@/lib/audit-summary";
import { useCloudSync, useMission } from "@/lib/mission-store";
import {
  computeProjectStatus,
  computeStats,
  getAllWeeks,
  getMergedPhases,
  getMergedProjects,
  getMergedSkillCategories,
  milestoneCleared,
} from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mission Control — VARMA 27" },
      {
        name: "description",
        content:
          "Your Applied AI Engineer mission control: next mission, live progress, streaks and career targets for 2027.",
      },
      { property: "og:title", content: "Mission Control — VARMA 27" },
      {
        property: "og:description",
        content: "2027 is your build year. See your next mission, progress and streak at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MissionControl,
});

function MissionControl() {
  const state = useMission();
  const sync = useCloudSync();
  const allWeeks = getAllWeeks(state);
  const phases = getMergedPhases(state);
  const stats = computeStats(allWeeks, state);
  const next = stats.nextMission;
  const activePhase = next ? getPhase(next.phaseId) : phases[phases.length - 1];
  const nextIdx = next ? allWeeks.findIndex((w) => w.id === next.id) : allWeeks.length - 1;
  const chainStart = Math.max(0, Math.min(nextIdx - 2, allWeeks.length - 9));
  const chain = allWeeks.slice(chainStart, chainStart + 9);

  return (
    <div className="space-y-8">
      <Hero
        activePhaseLabel={
          activePhase ? `${activePhase.code} · ${activePhase.name}` : "Mission Complete"
        }
      />

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <NextMissionSpotlight week={next} />
        </div>
        <div className="panel relative overflow-hidden p-5 sm:p-6 lg:col-span-5">
          <div className="hud-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(circle_at_50%_30%,black,transparent_75%)]" />
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-cyan/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan via-violet to-transparent opacity-70" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="hud-label">Mission telemetry</p>
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                  sync.user && sync.status === "synced"
                    ? "border-lime-ink/20 bg-lime-soft text-lime-ink"
                    : sync.status === "syncing" || sync.status === "loading"
                      ? "border-primary/25 bg-primary-soft text-primary-deep"
                      : "border-lime-ink/20 bg-lime-soft text-lime-ink",
                )}
              >
                {sync.status === "syncing" || sync.status === "loading" ? (
                  <Loader2 className="size-2.5 animate-spin" />
                ) : sync.user ? (
                  <Cloud className="size-2.5" />
                ) : (
                  <span className="relative flex size-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-lime-ink/60 [animation-iteration-count:3]" />
                    <span className="relative size-1.5 rounded-full bg-lime-ink" />
                  </span>
                )}
                {sync.status === "syncing"
                  ? "Syncing"
                  : sync.status === "loading"
                    ? "Loading"
                    : sync.user
                      ? "Cloud Live"
                      : "Live"}
              </span>
            </div>
            <div className="mt-3 flex flex-col items-center gap-5 sm:flex-row lg:flex-col">
              <RadialProgress
                value={stats.completion}
                size={188}
                label="Roadmap"
                sublabel={`${stats.completedWeeks} done · ${stats.pendingWeeks} remaining`}
              />
              <dl className="grid w-full flex-1 grid-cols-2 gap-2 lg:grid-cols-3">
                <Stat i={0} icon={Trophy} label="Missions done" value={stats.completedWeeks} />
                <Stat
                  i={1}
                  icon={Layers}
                  label="Active phase"
                  value={activePhase?.code.replace("PHASE ", "P") ?? "—"}
                />
                <Stat
                  i={2}
                  icon={Flame}
                  label="Current streak"
                  value={stats.currentStreak}
                  accent
                />
                <Stat i={3} icon={TrendingUp} label="Best streak" value={stats.bestStreak} />
                <Stat i={4} icon={Clock} label="Est. hours" value={stats.hours} />
                <Stat i={5} icon={Target} label="Tasks done" value={stats.tasksDone} />
              </dl>
            </div>
            {stats.completedWeeks === 0 ? (
              <p className="mt-4 rounded-lg bg-surface p-3 text-xs text-muted-foreground">
                Day zero. Every number here moves only when you complete real tasks.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section>
        <SectionHeading
          eyebrow="Weekly streak chain"
          title={
            <span className="flex items-center gap-3">
              {stats.currentStreak} week streak
              <Flame
                className={cn("size-6", stats.currentStreak ? "text-primary" : "text-subtle")}
              />
            </span>
          }
          action={
            <Button variant="hud" size="sm" asChild>
              <Link to="/achievements">
                Achievements <ArrowRight />
              </Link>
            </Button>
          }
        />
        <StreakChain weeks={chain} />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <AuditPreview />
        <JourneyPreview />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SkillPreview />
        <ProjectPreview />
      </section>
    </div>
  );
}

function Hero({ activePhaseLabel }: { activePhaseLabel: string }) {
  return (
    <section className="hud-corners relative isolate overflow-hidden rounded-2xl border bg-gradient-hero shadow-panel">
      {/* Layered orbit rings — quiet 3D depth behind the illustration */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 -z-20 hidden size-[640px] rounded-full border border-primary/10 lg:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 -z-20 hidden size-[440px] rounded-full border border-dashed border-cyan/20 lg:block"
      />
      <div
        aria-hidden
        className="hud-grid pointer-events-none absolute inset-0 -z-20 opacity-40 [mask-image:linear-gradient(90deg,black,transparent_55%)]"
      />
      <img
        src={illustration}
        alt="Abstract glass geometry lit in orange, lime and cyan"
        className="animate-float absolute -right-24 top-0 -z-10 h-full w-[85%] object-cover object-right opacity-40 sm:opacity-70 lg:-right-10 lg:w-[62%] lg:opacity-100"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-card via-card/85 to-transparent lg:via-card/60" />
      <div className="p-6 sm:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <p className="hud-label inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/80 px-3 py-1 text-primary-deep backdrop-blur">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_20%,transparent)]" />{" "}
            VARMA 27 · Mission 2027 · Learn. Build. Evolve.
          </p>
          <span className="hud-label inline-flex items-center gap-1.5 rounded-full border border-cyan/30 bg-cyan-soft/90 px-3 py-1 !text-[10px] !text-cyan-ink backdrop-blur">
            {activePhaseLabel}
          </span>
        </div>
        <h1 className="mt-4 max-w-2xl text-[2.5rem] font-bold leading-[0.95] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
          2027 IS YOUR{" "}
          <span className="relative inline-block">
            <span className="bg-gradient-primary bg-clip-text text-transparent">BUILD</span>
            <span
              aria-hidden
              className="animate-line absolute -bottom-1 left-0 h-1.5 w-full rounded-full bg-lime/80 sm:h-2"
              style={{ animationDelay: "500ms" }}
            />
          </span>{" "}
          YEAR.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Every skill you develop and every project you complete takes you one step closer to
          becoming an Applied AI Engineer.
        </p>

        <div className="mt-7 inline-flex flex-col rounded-xl border bg-card/80 px-4 py-3 shadow-panel backdrop-blur">
          <span className="hud-label !text-[9px]">Destination</span>
          <span className="mt-1 flex items-center gap-2 font-display text-xl font-bold tracking-tight sm:text-2xl">
            <Rocket className="size-5 text-primary" /> APPLIED AI ENGINEER
          </span>
          <span className="text-xs text-muted-foreground">
            Specialization · Full-Stack AI Product Engineering
          </span>
        </div>

        <div className="mt-6 grid max-w-2xl gap-2.5 sm:grid-cols-3">
          <TargetCard i={0} label="Primary target" value="₹12–15 LPA" tone="orange" />
          <TargetCard i={1} label="Stretch target" value="₹15–17 LPA" tone="violet" />
          <TargetCard i={2} label="Target transition" value="Nov 2027" tone="cyan" icon />
        </div>
        <p className="mt-3 text-[11px] text-subtle">
          Personal career goals to aim for — not guaranteed outcomes.
        </p>
      </div>
    </section>
  );
}

function TargetCard({
  label,
  value,
  tone,
  icon,
  i,
}: {
  label: string;
  value: string;
  tone: "orange" | "violet" | "cyan";
  icon?: boolean;
  i: number;
}) {
  return (
    <div
      className={cn(
        "reveal panel-glass lift relative overflow-hidden p-4",
        tone === "cyan" && "glow-cyan",
        tone === "violet" && "glow-violet",
      )}
      style={{ "--i": i + 3 } as CSSProperties}
    >
      <span className={cn("absolute inset-x-0 top-0 h-0.5", TONE_DOT[tone])} />
      <p className="hud-label !text-[9px]">{label}</p>
      <p className="mt-1.5 flex items-center gap-2 font-display text-xl font-bold tabular">
        {icon ? <CalendarClock className="size-4 text-cyan-ink" /> : null}
        {value}
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
  i,
}: {
  icon: typeof Clock;
  label: string;
  value: number | string;
  accent?: boolean;
  i: number;
}) {
  return (
    <div
      className={cn(
        "reveal group rounded-lg border p-3 transition-[border-color,transform,box-shadow] duration-200 ease-vx hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-panel",
        accent && Number(value) > 0 ? "border-lime-ink/25 bg-lime-soft" : "bg-card",
      )}
      style={{ "--i": i + 2 } as CSSProperties}
    >
      <dt className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon
          className={cn(
            "size-3.5 transition-transform duration-200 group-hover:scale-110",
            accent ? "text-primary" : "text-subtle",
          )}
        />{" "}
        {label}
      </dt>
      <dd className="mt-1 font-display text-2xl font-bold tabular leading-none">
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </dd>
    </div>
  );
}

function AuditPreview() {
  const state = useMission();
  const a = summarizeAudit(state);
  return (
    <div className="panel lift relative overflow-hidden p-5 sm:p-6 lg:col-span-5">
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-primary" aria-hidden />
      <div
        className="pointer-events-none absolute -bottom-20 -right-20 size-56 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <p className="hud-label text-primary-deep">Phase 0 · 21 Nov – 15 Dec 2026</p>
      <h3 className="mt-2 text-xl font-bold leading-tight">Rebuild only what needs rebuilding.</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Audit your NxtWave foundations and repair just the gaps.
      </p>
      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="font-display text-4xl font-bold tabular">
            <AnimatedNumber value={Math.round(a.readiness * 100)} />%
          </p>
          <p className="hud-label !text-[9px]">Foundation readiness</p>
        </div>
        <p className="text-right text-xs text-muted-foreground tabular">
          {a.assessed}/{a.total} assessed
          <br />
          {a.repaired} repaired
        </p>
      </div>
      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-surface">
        {AUDIT_LEVELS.map((l) => (
          <span
            key={l.id}
            className={cn(
              "animate-grow-x h-full transition-[width] duration-700 ease-vx",
              TONE_DOT[l.tone],
            )}
            style={{ width: `${(a.counts[l.id] / a.total) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {AUDIT_LEVELS.map((l) => (
          <span key={l.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={cn("size-2 rounded-full", TONE_DOT[l.tone])} /> {l.label} ·{" "}
            {a.counts[l.id]}
          </span>
        ))}
      </div>
      <Button variant="soft" className="mt-5 w-full sm:w-auto" asChild>
        <Link to="/foundation-audit">
          Run the foundation audit <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}

function JourneyPreview() {
  const state = useMission();
  const { openMission } = useMissionDrawer();
  const milestones = getMergedPhases(state).flatMap((p) => p.milestones);
  let consecutiveCleared = 0;
  for (const m of milestones) {
    if (milestoneCleared(m, state.weeks)) consecutiveCleared += 1;
    else break;
  }
  const railRatio =
    consecutiveCleared === 0
      ? 0
      : Math.min(1, consecutiveCleared / Math.max(1, milestones.length - 1));

  return (
    <div className="panel p-5 sm:p-6 lg:col-span-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="hud-label">Mission route · Nov 2026 → Nov 2027</p>
        <Link
          to="/roadmap"
          className="group/link inline-flex items-center gap-1 rounded text-xs font-medium text-primary-deep underline-offset-4 transition-colors hover:underline"
        >
          Full roadmap →
        </Link>
      </div>
      <ol className="relative mt-5 space-y-0.5">
        <span
          aria-hidden
          className="animate-rail absolute bottom-3 left-[11px] top-3 w-px bg-border"
        />
        <span
          aria-hidden
          className="absolute left-[10px] top-3 w-[3px] origin-top rounded-full bg-lime transition-[height] duration-700 ease-vx"
          style={{
            height: railRatio === 0 ? "0px" : `calc(${railRatio} * (100% - 1.5rem))`,
          }}
        />
        {milestones.map((m, i) => {
          const missions = m.weeks.filter((w) => w.kind === "mission");
          const done = missions.filter((w) => state.weeks[w.id]?.completedAt).length;
          const cleared = milestoneCleared(m, state.weeks);
          const nextInMilestone =
            missions.find((w) => !state.weeks[w.id]?.completedAt) ?? missions[0];
          return (
            <li key={m.id} className="reveal" style={{ "--i": i } as CSSProperties}>
              <button
                type="button"
                onClick={() => nextInMilestone && openMission(nextInMilestone.id)}
                className="group relative flex w-full items-center gap-3.5 rounded-lg px-1 py-1.5 text-left transition-colors duration-200 hover:bg-surface/75"
              >
                <span
                  className={cn(
                    "relative z-10 size-[15px] shrink-0 rounded-full border-2 transition-[transform,background-color,border-color] duration-300 ease-vx-spring group-hover:scale-125",
                    cleared
                      ? "border-lime-ink bg-lime"
                      : done
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-card group-hover:border-primary/60",
                  )}
                />
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="hud-label !text-[9px]">{m.label}</p>
                    <p className="truncate font-display text-sm font-semibold transition-colors duration-200 group-hover:text-primary-deep">
                      {m.title}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs tabular text-muted-foreground">
                    {done}/{missions.length}
                    <ChevronRight className="size-3.5 text-subtle transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
      <button
        type="button"
        onClick={() => openMission(FEATURED_WEEK_ID)}
        className="interactive mt-5 flex w-full items-center justify-between rounded-lg border border-primary/25 bg-primary-soft/60 px-4 py-3 text-left text-sm hover:bg-primary-soft"
      >
        <span>
          <span className="hud-label !text-[9px] text-primary-deep">
            Reference mission · {getMilestone("feb27")?.label}
          </span>
          <span className="block font-display font-semibold">Build Your First FastAPI Backend</span>
        </span>
        <ArrowRight className="size-4 text-primary" />
      </button>
    </div>
  );
}

function SkillPreview() {
  const state = useMission();
  const categories = getMergedSkillCategories(state);
  const top = categories.slice(0, 6);
  const allVals = categories.flatMap((c) =>
    c.skills.map((s) => state.skills[skillKey(c.id, s)] ?? 0),
  );
  const startedCount = allVals.filter((v) => v > 0).length;
  const confidentCount = allVals.filter((v) => v === 4).length;

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="hud-label">Skill matrix</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground tabular">
            {startedCount} active · {confidentCount} confident · {allVals.length} total
          </p>
        </div>
        <Link
          to="/skills"
          className="group/link inline-flex items-center gap-1 rounded text-xs font-medium text-primary-deep underline-offset-4 transition-colors hover:underline"
        >
          All {categories.length} tracks →
        </Link>
      </div>
      <ul className="mt-4 space-y-1">
        {top.map((c) => {
          const vals = c.skills.map((s) => state.skills[skillKey(c.id, s)] ?? 0);
          const pct = vals.length ? vals.reduce<number>((a, b) => a + b, 0) / (vals.length * 4) : 0;
          return (
            <li key={c.id}>
              <Link
                to="/skills"
                className="group -mx-2 block rounded-lg px-2 py-1.5 transition-colors duration-200 hover:bg-surface/80"
              >
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-medium transition-colors group-hover:text-primary-deep">
                    <span
                      className={cn(
                        "size-2 rounded-full transition-transform duration-200 group-hover:scale-150",
                        TONE_DOT[c.tone],
                      )}
                    />{" "}
                    {c.name}
                  </span>
                  <span className="text-xs tabular text-muted-foreground">
                    {Math.round(pct * 100)}%
                  </span>
                </div>
                <ProgressBar value={pct} className="h-1.5" />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[11px] text-subtle">
        Levels are self-assessed. Nothing is claimed until you set it.
      </p>
    </div>
  );
}

function ProjectPreview() {
  const state = useMission();
  const { openMission } = useMissionDrawer();
  const projects = getMergedProjects(state);
  const shippedCount = projects.filter(
    (p) => computeProjectStatus(p, state).status === "Shipped",
  ).length;

  return (
    <div className="panel p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="hud-label">Portfolio pipeline</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground tabular">
            {shippedCount} shipped · {projects.length} total projects
          </p>
        </div>
        <Link
          to="/projects"
          className="group/link inline-flex items-center gap-1 rounded text-xs font-medium text-primary-deep underline-offset-4 transition-colors hover:underline"
        >
          Projects →
        </Link>
      </div>
      <ul className="mt-4 divide-y">
        {projects.slice(0, 7).map((p) => {
          const { pct } = computeProjectStatus(p, state);
          const nextWeekId = p.weekIds.find((id) => !state.weeks[id]?.completedAt) ?? p.weekIds[0];
          const inner = (
            <>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-display text-sm font-semibold transition-colors group-hover:text-primary-deep">
                  {p.name}
                  {p.capstone ? <Tag tone="orange">Capstone</Tag> : null}
                  {p.custom ? <Tag tone="violet">Custom</Tag> : null}
                </p>
                <p className="text-[11px] text-muted-foreground">{p.period}</p>
              </div>
              <div className="w-20 shrink-0 sm:w-28">
                <ProgressBar value={pct} className="h-1.5" />
              </div>
              <span className="w-9 shrink-0 text-right text-xs tabular text-muted-foreground">
                {Math.round(pct * 100)}%
              </span>
            </>
          );

          return (
            <li key={p.id}>
              {nextWeekId ? (
                <button
                  type="button"
                  onClick={() => openMission(nextWeekId)}
                  className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors duration-200 hover:bg-surface/80"
                >
                  {inner}
                </button>
              ) : (
                <Link
                  to="/projects"
                  className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors duration-200 hover:bg-surface/80"
                >
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
