import { ArrowRight, ArrowUpRight, Calendar, Clock, Coffee, Flag, ListChecks } from "lucide-react";
import type { CSSProperties } from "react";

import illustration from "@/assets/vx-illustration.jpg";
import { Button } from "@/components/ui/button";
import { getMilestone, getPhase } from "@/data/roadmap";
import type { Week } from "@/data/types";
import { useMission } from "@/lib/mission-store";
import {
  effectiveWeekHours,
  isWeekOverdue,
  weekProgress,
  weekStatus,
  type WeekPriority,
} from "@/lib/progress";
import { cn } from "@/lib/utils";

import { useMissionDrawer } from "./mission-drawer";
import { ProgressBar, StatusPill, Tag } from "./primitives";

function formatTargetDate(iso: string) {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return iso;
  const d = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function PriorityBadge({ priority }: { priority: WeekPriority }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 font-display text-[9px] font-semibold uppercase tracking-[0.14em]",
        priority === "Critical"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-violet/30 bg-violet-soft text-violet-ink",
      )}
    >
      {priority}
    </span>
  );
}

/** Hero-scale spotlight for the active mission. */
export function NextMissionSpotlight({ week }: { week: Week | undefined }) {
  const state = useMission();
  const { openMission } = useMissionDrawer();
  if (!week) {
    return (
      <div className="panel hud-corners grid min-h-72 place-items-center bg-gradient-hero p-8 text-center">
        <div>
          <p className="hud-label text-lime-ink">All missions complete</p>
          <h3 className="mt-2 text-2xl font-bold">You did it. Applied AI Engineer.</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Every weekly mission in VARMA 27 · Mission 2027 is locked in. Keep sharpening and
            shipping.
          </p>
        </div>
      </div>
    );
  }
  const ws = state.weeks[week.id];
  const p = weekProgress(week, ws);
  const status = weekStatus(week, ws);
  const overdue = isWeekOverdue(week, ws);
  const phase = getPhase(week.phaseId);
  const hours = effectiveWeekHours(week, ws);

  return (
    <article className="hud-corners group/spot relative isolate h-full overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-lift transition-[box-shadow,border-color] duration-300 ease-vx hover:border-primary/40 hover:shadow-[var(--elev-hover),0_20px_44px_-24px_var(--glow-orange)]">
      <img
        src={illustration}
        alt=""
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[80%_50%] transition-transform duration-[1200ms] ease-vx group-hover/spot:scale-[1.04] sm:object-right"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-card via-card/92 to-card/0 sm:via-card/82" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-energy" />
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-ink px-2 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-card">
            <span className="size-1.5 rounded-full bg-lime" aria-hidden /> Your next mission
          </span>
          <StatusPill status={status} />
          {ws?.priority && ws.priority !== "Standard" ? (
            <PriorityBadge priority={ws.priority} />
          ) : null}
          {ws?.targetDate ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium backdrop-blur",
                overdue
                  ? "border-destructive/35 bg-destructive/10 text-destructive"
                  : "border-border bg-card/90 text-muted-foreground",
              )}
            >
              <Calendar className={cn("size-3", overdue ? "text-destructive" : "text-primary")} />{" "}
              {overdue ? "Overdue · " : "Due "}
              {formatTargetDate(ws.targetDate)}
            </span>
          ) : null}
        </div>
        <p className="hud-label mt-5 text-primary-deep">
          {phase?.code} · {week.label}
        </p>
        <h3 className="mt-2 max-w-md text-3xl font-bold leading-[1.05] sm:text-4xl">
          {week.title}
        </h3>
        <p className="mt-2.5 flex max-w-md items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Flag className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span>{week.deliverable}</span>
        </p>
        <div className="mt-4 flex max-w-md flex-wrap gap-1.5">
          {week.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
        <div className="mt-6 grid max-w-md grid-cols-3 gap-2">
          <MiniStat i={0} icon={Clock} label="Est. hours" value={`${hours}h`} />
          <MiniStat
            i={1}
            icon={ListChecks}
            label="Core tasks"
            value={`${p.coreDone}/${p.coreTotal}`}
          />
          <MiniStat
            i={2}
            icon={ArrowUpRight}
            label="Progress"
            value={`${Math.round(p.ratio * 100)}%`}
          />
        </div>
        <ProgressBar value={p.ratio} className="mt-4 max-w-md" />
        <Button variant="mission" size="xl" className="mt-6" onClick={() => openMission(week.id)}>
          {status === "in-progress" ? "Continue mission" : "Open mission"} <ArrowRight />
        </Button>
      </div>
    </article>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  i,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  i: number;
}) {
  return (
    <div
      className="reveal rounded-lg border bg-card/80 p-2.5 backdrop-blur transition-colors duration-200 hover:border-primary/35"
      style={{ "--i": i + 4 } as CSSProperties}
    >
      <Icon className="size-3.5 text-primary" />
      <div className="mt-1.5 font-display text-lg font-bold tabular leading-none">{value}</div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

/** Compact, reusable week row for roadmap milestones. */
export function WeekRow({ week }: { week: Week }) {
  const state = useMission();
  const { openMission } = useMissionDrawer();
  const ws = state.weeks[week.id];
  const status = weekStatus(week, ws);
  const overdue = isWeekOverdue(week, ws);
  const p = weekProgress(week, ws);
  const isBuffer = week.kind === "buffer";
  const hours = effectiveWeekHours(week, ws);

  return (
    <button
      type="button"
      onClick={() => openMission(week.id)}
      className={cn(
        "interactive group relative flex min-h-14 w-full items-center gap-3 overflow-hidden rounded-xl border p-3 text-left sm:gap-4 sm:p-3.5",
        isBuffer && "glow-cyan border-dashed border-cyan/40 bg-cyan-soft/60",
        !isBuffer && status === "upcoming" && "border-border/80 bg-card/70",
        status === "in-progress" &&
          "border-primary/40 bg-card shadow-[0_10px_24px_-16px_var(--glow-orange)]",
        status === "completed" && "glow-lime border-lime-ink/25 bg-lime-soft",
        week.featured &&
          status === "upcoming" &&
          "border-primary/30 bg-card ring-1 ring-primary/10",
      )}
    >
      {status === "in-progress" ? (
        <span
          aria-hidden
          className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-gradient-primary"
        />
      ) : null}
      {status === "completed" ? (
        <span
          aria-hidden
          className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-lime-ink"
        />
      ) : null}
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-lg font-display text-xs font-bold tabular transition-transform duration-300 ease-vx-spring group-hover:scale-105",
          isBuffer
            ? "bg-card text-cyan-ink"
            : status === "completed"
              ? "bg-lime text-ink shadow-glow-lime"
              : status === "in-progress"
                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                : "bg-surface text-muted-foreground",
        )}
      >
        {isBuffer ? <Coffee className="size-4" /> : week.label.slice(-2)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "min-w-0 truncate font-display text-sm font-semibold",
              status === "upcoming" && !week.featured && "text-foreground/85",
            )}
          >
            {week.title}
          </span>
          {week.featured ? (
            <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-primary-deep">
              Reference mission
            </span>
          ) : null}
          {ws?.priority && ws.priority !== "Standard" ? (
            <PriorityBadge priority={ws.priority} />
          ) : null}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>
            {isBuffer
              ? "Carry-forward · revision · recovery"
              : `${p.coreDone}/${p.coreTotal} core · ${hours}h`}
          </span>
          {ws?.targetDate ? (
            <span
              className={cn(
                "inline-flex items-center gap-1",
                overdue ? "font-semibold text-destructive" : "text-primary-deep",
              )}
            >
              <Calendar className="size-3" /> {overdue ? "Overdue · " : ""}
              {formatTargetDate(ws.targetDate)}
            </span>
          ) : null}
          {!isBuffer ? (
            <span className="hidden sm:inline">{week.tags.slice(0, 2).join(" · ")}</span>
          ) : null}
        </span>
      </span>
      <span className="hidden shrink-0 sm:block">
        <StatusPill status={status} />
      </span>
      <ArrowRight className="size-4 shrink-0 text-subtle" />
    </button>
  );
}

export function milestoneOf(week: Week) {
  return getMilestone(week.milestoneId);
}
