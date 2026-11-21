import * as Collapsible from "@radix-ui/react-collapsible";
import { createFileRoute } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Info,
  MonitorSmartphone,
  Plus,
  Search,
  Target,
  X,
} from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";

import illustration from "@/assets/vx-illustration.jpg";
import { Button } from "@/components/ui/button";
import { WeekRow } from "@/components/vx/mission-card";
import { useMissionDrawer } from "@/components/vx/mission-drawer";
import { MissionEditorDialog } from "@/components/vx/mission-editor";
import { PageHeader, ProgressBar, Tag } from "@/components/vx/primitives";
import type { Milestone, Week } from "@/data/types";
import { useMission } from "@/lib/mission-store";
import {
  computeStats,
  getAllWeeks,
  getMergedMilestones,
  getMergedPhases,
  isWeekOverdue,
  milestoneCleared,
  weekStatus,
} from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/roadmap")({
  head: () => ({
    meta: [
      { title: "Learning Roadmap — VARMA 27" },
      {
        name: "description",
        content:
          "From software developer to Applied AI Engineer: monthly milestones and weekly missions from Nov 2026 to Nov 2027.",
      },
      { property: "og:title", content: "Learning Roadmap — VARMA 27" },
      {
        property: "og:description",
        content:
          "Backend, LLMs, RAG, agents, production AI, deployment and interviews — one mission at a time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Roadmap,
});

type FilterMode = "all" | "active" | "upcoming" | "overdue" | "completed";

const FILTERS: { id: FilterMode; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active & in progress" },
  { id: "upcoming", label: "Upcoming" },
  { id: "overdue", label: "Overdue" },
  { id: "completed", label: "Completed" },
];

function Roadmap() {
  const state = useMission();
  const { openMission } = useMissionDrawer();
  const phases = getMergedPhases(state);
  const milestones = getMergedMilestones(state);
  const allWeeks = getAllWeeks(state);
  const stats = computeStats(allWeeks, state);
  const next = stats.nextMission;

  const [open, setOpen] = useState<string[]>(() => [next?.milestoneId ?? "audit", "feb27"]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [creatingFor, setCreatingFor] = useState<string | null>(null);

  const toggle = (id: string) =>
    setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  const allExpanded = open.length === milestones.length;
  const toggleAll = () => setOpen(allExpanded ? [] : milestones.map((m) => m.id));

  const jumpToMilestone = (id: string) => {
    setOpen((o) => (o.includes(id) ? o : [...o, id]));
    setFilter("all");
    setQuery("");
    window.requestAnimationFrame(() => {
      document
        .getElementById(`milestone-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const normalizedQuery = query.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0 || filter !== "all";

  const visiblePhases = useMemo(() => {
    return phases
      .map((phase) => {
        const matchedMilestones = phase.milestones
          .map((m) => {
            const matchingWeeks = m.weeks.filter((w) => {
              const ws = state.weeks[w.id];
              const st = weekStatus(w, ws);
              if (filter === "completed" && st !== "completed") return false;
              if (filter === "upcoming" && st !== "upcoming") return false;
              if (filter === "overdue" && !isWeekOverdue(w, ws)) return false;
              if (filter === "active") {
                const isNext = w.id === next?.id;
                if (st !== "in-progress" && !isNext) return false;
              }
              if (normalizedQuery) {
                const haystack = [
                  m.label,
                  m.title,
                  w.label,
                  w.title,
                  w.deliverable,
                  ...w.tags,
                  ...w.sections.flatMap((s) => s.tasks.map((t) => t.label)),
                ]
                  .join(" ")
                  .toLowerCase();
                return haystack.includes(normalizedQuery);
              }
              return true;
            });
            return { milestone: m, weeks: matchingWeeks };
          })
          .filter((entry) => !isFiltering || entry.weeks.length > 0);
        return { phase, milestones: matchedMilestones };
      })
      .filter((entry) => entry.milestones.length > 0);
  }, [filter, isFiltering, next?.id, normalizedQuery, phases, state.weeks]);

  return (
    <div className="space-y-8">
      <PageHeader
        code="Phase 0 → Phase 1 · Nov 2026 – Nov 2027"
        title="FROM SOFTWARE DEVELOPER TO APPLIED AI ENGINEER."
        description="Monthly milestones, weekly missions, and planned buffer blocks. Every major AI project ships with a real React/TypeScript frontend."
        aside={
          <div className="hidden flex-col items-end gap-2 lg:flex">
            <span className="hud-label !text-[9px]">Jump to milestone</span>
            <div className="flex items-end gap-1.5" role="group" aria-label="Jump to milestone">
              {milestones.map((m) => {
                const cleared = milestoneCleared(m, state.weeks);
                const isActive = m.id === next?.milestoneId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => jumpToMilestone(m.id)}
                    title={`${m.label} — ${m.title}`}
                    aria-label={`Jump to ${m.label}: ${m.title}`}
                    className={cn(
                      "press w-2.5 rounded-full transition-[height,background-color,transform] duration-300 ease-vx hover:scale-y-110",
                      cleared
                        ? "h-14 bg-lime shadow-glow-lime"
                        : isActive
                          ? "h-16 bg-gradient-primary shadow-glow"
                          : "h-11 bg-border hover:bg-primary/50",
                    )}
                  />
                );
              })}
            </div>
          </div>
        }
      />

      {/* Search, filter, create & expand controls */}
      <div className="panel flex flex-col gap-3 p-3.5 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search weeks, skills, tags…"
            aria-label="Search roadmap missions"
            className="h-9 w-full rounded-lg border bg-background pl-9 pr-8 text-sm placeholder:text-subtle transition-[border-color,box-shadow] duration-200 hover:border-primary/35 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-subtle hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter missions by status">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "press h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors duration-200",
                    active
                      ? "border-primary/30 bg-primary-soft text-primary-deep"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <Button variant="hud" size="sm" onClick={toggleAll} className="ml-auto sm:ml-1">
            {allExpanded ? <ChevronsDownUp /> : <ChevronsUpDown />}
            {allExpanded ? "Collapse" : "Expand"}
          </Button>
          <Button
            variant="mission"
            size="sm"
            onClick={() => setCreatingFor(next?.milestoneId ?? milestones[0]!.id)}
          >
            <Plus /> Add mission
          </Button>
        </div>
      </div>

      {visiblePhases.length === 0 ? (
        <div className="panel grid place-items-center p-10 text-center">
          <p className="font-display text-base font-semibold">
            No missions match your current filter
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try clearing your search or switching back to all roadmap missions.
          </p>
          <Button
            variant="soft"
            size="sm"
            className="mt-4"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            Reset filters
          </Button>
        </div>
      ) : (
        visiblePhases.map(({ phase, milestones: phaseMilestones }) => {
          let phaseClearedRun = 0;
          for (const entry of phaseMilestones) {
            if (milestoneCleared(entry.milestone, state.weeks)) phaseClearedRun += 1;
            else break;
          }
          const railPct =
            phaseMilestones.length <= 1
              ? phaseClearedRun > 0
                ? 100
                : 0
              : Math.min(100, (phaseClearedRun / (phaseMilestones.length - 1)) * 100);

          return (
            <section key={phase.id} aria-labelledby={`${phase.id}-h`}>
              <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="rounded-md bg-ink px-2 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-card">
                  {phase.code}
                </span>
                <h2 id={`${phase.id}-h`} className="text-xl font-bold sm:text-2xl">
                  {phase.heading}
                </h2>
                <span className="text-xs text-muted-foreground">{phase.period}</span>
              </div>

              {/* Connected vertical timeline for this phase */}
              <div className="relative pl-7 sm:pl-10">
                <span
                  aria-hidden
                  className="animate-rail absolute bottom-6 left-[11px] top-6 w-0.5 rounded-full bg-border sm:left-[15px]"
                />
                <span
                  aria-hidden
                  className="absolute left-[10px] top-6 w-[4px] origin-top rounded-full bg-lime shadow-[0_0_12px_var(--glow-lime)] transition-[height] duration-700 ease-vx sm:left-[14px]"
                  style={{
                    height: railPct === 0 ? "0px" : `calc(${railPct / 100} * (100% - 3rem))`,
                  }}
                />
                <div className="space-y-4">
                  {phaseMilestones.map(({ milestone: m, weeks }, idx) => (
                    <MilestoneCard
                      key={m.id}
                      m={m}
                      visibleWeeks={weeks}
                      index={idx}
                      open={isFiltering || open.includes(m.id)}
                      onToggle={() => toggle(m.id)}
                      onAddWeek={() => setCreatingFor(m.id)}
                      active={m.id === next?.milestoneId}
                    />
                  ))}
                </div>
              </div>
            </section>
          );
        })
      )}

      <MissionEditorDialog
        open={creatingFor !== null}
        defaultMilestoneId={creatingFor ?? undefined}
        onClose={() => setCreatingFor(null)}
        onSaved={(weekId) => {
          if (creatingFor && !open.includes(creatingFor)) {
            setOpen((o) => [...o, creatingFor]);
          }
          openMission(weekId);
        }}
      />
    </div>
  );
}

function MilestoneCard({
  m,
  visibleWeeks,
  index,
  open,
  onToggle,
  onAddWeek,
  active,
}: {
  m: Milestone;
  visibleWeeks: Week[];
  index: number;
  open: boolean;
  onToggle: () => void;
  onAddWeek: () => void;
  active: boolean;
}) {
  const state = useMission();
  const missions = m.weeks.filter((w) => w.kind === "mission");
  const buffers = m.weeks.filter((w) => w.kind === "buffer").length;
  const done = missions.filter((w) => state.weeks[w.id]?.completedAt).length;
  const started = missions.some((w) => weekStatus(w, state.weeks[w.id]) === "in-progress");
  const cleared = milestoneCleared(m, state.weeks);

  return (
    <div
      id={`milestone-${m.id}`}
      className="reveal relative scroll-mt-24"
      style={{ "--i": index } as CSSProperties}
    >
      {/* Connected timeline node */}
      <span
        aria-hidden
        className={cn(
          "absolute -left-7 top-6 z-10 grid size-6 place-items-center rounded-full border-2 transition-[transform,background-color,border-color,box-shadow] duration-300 ease-vx-spring sm:-left-10 sm:size-8",
          cleared
            ? "border-lime-ink bg-lime text-ink shadow-glow-lime"
            : active
              ? "animate-pulse-ring border-primary bg-gradient-primary text-primary-foreground shadow-glow"
              : started || done > 0
                ? "border-primary bg-primary-soft text-primary-deep"
                : "border-border bg-card text-subtle",
        )}
      >
        {cleared ? (
          <Check className="size-3.5 sm:size-4" strokeWidth={3} />
        ) : active ? (
          <span className="size-2 rounded-full bg-card" />
        ) : (
          <span className="font-display text-[9px] font-bold tabular sm:text-[10px]">
            {String(index + 1).padStart(2, "0")}
          </span>
        )}
      </span>

      <Collapsible.Root
        open={open}
        onOpenChange={onToggle}
        className={cn(
          "panel overflow-hidden transition-[border-color,box-shadow,transform] duration-300 ease-vx",
          "hover:border-primary/35 hover:shadow-hover",
          active && "border-primary/30 ring-2 ring-primary/15",
          cleared && "border-lime-ink/25",
        )}
      >
        <Collapsible.Trigger className="group relative flex w-full cursor-pointer items-stretch text-left transition-colors duration-200 hover:bg-surface/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
          <div className="relative hidden w-40 shrink-0 overflow-hidden sm:block">
            <img
              src={illustration}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-[70%_50%] transition-transform duration-700 ease-vx group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card" />
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="hud-label text-primary-deep">{m.label}</span>
                {active ? (
                  <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary-foreground">
                    Active
                  </span>
                ) : null}
                {cleared ? (
                  <span className="rounded bg-lime px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-ink">
                    Cleared
                  </span>
                ) : null}
              </div>
              <h3 className="mt-1 text-lg font-bold transition-colors duration-200 group-hover:text-primary-deep">
                {m.title}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{m.goal}</p>
            </div>
            <div className="flex items-center gap-4 sm:w-52">
              <div className="flex-1">
                <ProgressBar
                  value={missions.length ? done / missions.length : 0}
                  tone={cleared ? "lime" : "orange"}
                  className="h-1.5"
                />
                <p className="mt-1.5 text-[11px] tabular text-muted-foreground">
                  {done}/{missions.length} missions
                  {buffers > 0 ? ` · ${buffers} buffer${buffers > 1 ? "s" : ""}` : ""}
                </p>
              </div>
              <ChevronDown className="size-5 shrink-0 text-subtle transition-[transform,color] duration-300 ease-vx group-hover:text-primary group-data-[state=open]:rotate-180" />
            </div>
          </div>
        </Collapsible.Trigger>

        <Collapsible.Content className="data-[state=open]:animate-collapse-down data-[state=closed]:animate-collapse-up">
          <div className="grid grid-cols-1 gap-5 border-t bg-surface/40 p-4 sm:p-5 lg:grid-cols-[1fr_300px]">
            <div className="space-y-2">
              {visibleWeeks.map((w) => (
                <WeekRow key={w.id} week={w} />
              ))}
              <button
                type="button"
                onClick={onAddWeek}
                className="press flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card/60 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft/30 hover:text-primary-deep"
              >
                <Plus className="size-3.5" /> Add custom mission to {m.label}
              </button>
            </div>
            <aside className="space-y-3">
              <div className="rounded-xl border bg-card p-4 transition-colors duration-200 hover:border-primary/30">
                <p className="hud-label flex items-center gap-1.5">
                  <Target className="size-3.5 text-primary" /> Outcome
                </p>
                <p className="mt-1.5 text-sm">{m.outcome}</p>
              </div>
              {m.frontend ? (
                <div className="rounded-xl border border-cyan/30 bg-cyan-soft p-4">
                  <p className="hud-label flex items-center gap-1.5 !text-cyan-ink">
                    <MonitorSmartphone className="size-3.5" /> Full-stack layer
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {m.frontend.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-cyan-ink" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {m.notes?.map((n) => (
                <p
                  key={n}
                  className="flex gap-2 rounded-xl border border-primary/20 bg-primary-soft/60 p-3 text-xs leading-relaxed"
                >
                  <Info className="mt-0.5 size-3.5 shrink-0 text-primary" /> {n}
                </p>
              ))}
              <div className="flex flex-wrap gap-1.5">
                {m.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
            </aside>
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
}
