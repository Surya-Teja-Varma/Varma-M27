import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Gauge,
  ListChecks,
  Pencil,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import illustration from "@/assets/vx-illustration.jpg";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { getMilestone } from "@/data/roadmap";
import type { Week } from "@/data/types";
import { actions, useMission } from "@/lib/mission-store";
import {
  canCompleteWeek,
  computeStreaks,
  coreTaskIds,
  effectiveWeekHours,
  emptyWeekState,
  getAllWeeks,
  getMergedMilestones,
  getWeekById,
  isCustomWeek,
  WEEK_PRIORITIES,
  weekProgress,
  weekStatus,
  type WeekPriority,
} from "@/lib/progress";
import { cn } from "@/lib/utils";

import { announceAchievements, markRecentlyCompleted } from "./celebrate";
import { MissionCompleteOverlay, type Celebration } from "./mission-complete";
import { MissionEditorDialog } from "./mission-editor";
import { BigCheck, ProgressBar, StatusPill, Tag } from "./primitives";

const Ctx = createContext<{ openMission: (id: string) => void }>({ openMission: () => {} });
export const useMissionDrawer = () => useContext(Ctx);

export function MissionDrawerProvider({ children }: { children: ReactNode }) {
  const state = useMission();
  const [weekId, setWeekId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const openMission = useCallback((id: string) => setWeekId(id), []);
  const closeDrawer = useCallback(() => setWeekId(null), []);
  const closeCelebration = useCallback(() => setCelebration(null), []);
  const week = weekId ? getWeekById(state, weekId) : undefined;
  return (
    <Ctx.Provider value={{ openMission }}>
      {children}
      <Dialog.Root open={Boolean(week)} onOpenChange={(o) => !o && setWeekId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[3px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-200" />
          <Dialog.Content
            className="fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-background shadow-lift outline-none ease-vx sm:max-w-[680px] sm:border-l data-[state=open]:animate-in data-[state=open]:slide-in-from-right-1/3 data-[state=open]:fade-in-0 data-[state=open]:duration-[320ms] data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=closed]:duration-[240ms]"
            aria-describedby={undefined}
            onInteractOutside={(e) => {
              if (celebration) e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              if (celebration) {
                e.preventDefault();
                setCelebration(null);
              }
            }}
          >
            {week ? (
              <MissionDetail
                key={week.id}
                week={week}
                onCelebrate={setCelebration}
                onNavigate={openMission}
                onDeleted={closeDrawer}
              />
            ) : null}
            {celebration ? (
              <MissionCompleteOverlay info={celebration} onClose={closeCelebration} />
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Ctx.Provider>
  );
}

function Banner({
  week,
  onNavigate,
  onEdit,
  onDelete,
}: {
  week: Week;
  onNavigate: (id: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const state = useMission();
  const allWeeks = getAllWeeks(state);
  const status = weekStatus(week, state.weeks[week.id]);
  const milestone = getMilestone(week.milestoneId);
  const ratio = week.kind === "mission" ? weekProgress(week, state.weeks[week.id]).ratio : 0;
  const idx = allWeeks.findIndex((w) => w.id === week.id);
  const prevWeek = idx > 0 ? allWeeks[idx - 1] : undefined;
  const nextWeek = idx >= 0 && idx < allWeeks.length - 1 ? allWeeks[idx + 1] : undefined;
  const custom = isCustomWeek(state, week.id);

  return (
    <div className="relative overflow-hidden border-b bg-card">
      <img
        src={illustration}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-right opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/10" />
      <div className="hud-grid absolute inset-0 opacity-30 [mask-image:linear-gradient(90deg,black,transparent)]" />
      <div className="relative p-5 pr-14 sm:p-7 sm:pr-16">
        <div className="flex flex-wrap items-center gap-2">
          <span className="hud-label text-primary-deep">{week.label}</span>
          <StatusPill status={status} />
          {custom ? (
            <span className="rounded-full border border-violet/30 bg-violet-soft px-2 py-0.5 font-display text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-ink">
              Custom
            </span>
          ) : null}
        </div>
        <Dialog.Title className="mt-3 max-w-md font-display text-2xl font-bold leading-tight sm:text-3xl">
          {week.title}
        </Dialog.Title>
        {milestone ? (
          <p className="mt-1.5 text-xs text-muted-foreground">{milestone.title}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {week.tags.map((t, i) => (
            <span key={t} className="reveal" style={{ "--i": i + 3 } as CSSProperties}>
              <Tag>{t}</Tag>
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!prevWeek}
            onClick={() => prevWeek && onNavigate(prevWeek.id)}
            aria-label={prevWeek ? `Previous: ${prevWeek.title}` : "No previous week"}
            className="press inline-flex items-center gap-1 rounded-md border bg-card/85 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-primary-deep disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="size-3.5" /> Prev
          </button>
          <button
            type="button"
            disabled={!nextWeek}
            onClick={() => nextWeek && onNavigate(nextWeek.id)}
            aria-label={nextWeek ? `Next: ${nextWeek.title}` : "No next week"}
            className="press inline-flex items-center gap-1 rounded-md border bg-card/85 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-primary-deep disabled:pointer-events-none disabled:opacity-40"
          >
            Next <ChevronRight className="size-3.5" />
          </button>
          {custom && onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="press inline-flex items-center gap-1 rounded-md border bg-card/85 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-primary-deep"
            >
              <Pencil className="size-3" /> Edit
            </button>
          ) : null}
          {custom && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="press inline-flex items-center gap-1 rounded-md border bg-card/85 px-2.5 py-1 text-[11px] font-medium text-muted-foreground backdrop-blur transition-colors hover:border-destructive/40 hover:text-destructive"
            >
              <Trash2 className="size-3" /> Delete
            </button>
          ) : null}
        </div>
      </div>
      {week.kind === "mission" ? (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-surface" aria-hidden>
          <div
            className={cn(
              "h-full transition-[width] duration-700 ease-vx",
              ratio >= 1 ? "bg-lime" : "bg-gradient-primary",
            )}
            style={{ width: `${Math.round(ratio * 100)}%` }}
          />
        </div>
      ) : null}
      <Dialog.Close className="press absolute right-4 top-4 grid size-10 place-items-center rounded-full border bg-card/90 text-muted-foreground backdrop-blur transition-[color,border-color,transform] duration-200 hover:rotate-90 hover:border-primary/40 hover:text-foreground">
        <X className="size-4" />
        <span className="sr-only">Close mission</span>
      </Dialog.Close>
    </div>
  );
}

function MissionDetail({
  week,
  onCelebrate,
  onNavigate,
  onDeleted,
}: {
  week: Week;
  onCelebrate: (c: Celebration) => void;
  onNavigate: (id: string) => void;
  onDeleted: () => void;
}) {
  return week.kind === "buffer" ? (
    <BufferDetail week={week} onNavigate={onNavigate} />
  ) : (
    <WeekMissionDetail
      week={week}
      onCelebrate={onCelebrate}
      onNavigate={onNavigate}
      onDeleted={onDeleted}
    />
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="panel flex items-center gap-3 p-3 transition-colors duration-200 hover:border-primary/30">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-deep">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <div className="hud-label !text-[9px]">{label}</div>
        <div className="truncate font-display text-sm font-semibold tabular">{value}</div>
      </div>
    </div>
  );
}

function WeekMissionDetail({
  week,
  onCelebrate,
  onNavigate,
  onDeleted,
}: {
  week: Week;
  onCelebrate: (c: Celebration) => void;
  onNavigate: (id: string) => void;
  onDeleted: () => void;
}) {
  const state = useMission();
  const ws = state.weeks[week.id] ?? emptyWeekState();
  const p = weekProgress(week, ws);
  const check = canCompleteWeek(week, ws);
  const completed = Boolean(ws.completedAt);
  const hours = effectiveWeekHours(week, ws);
  const [celebrate, setCelebrate] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const busy = useRef(false);

  const complete = () => {
    if (busy.current || completed) return;
    if (!check.ok) {
      const parts = [];
      if (check.missingCore)
        parts.push(`${check.missingCore} core task${check.missingCore > 1 ? "s" : ""}`);
      if (check.missingDeliverable) parts.push("the deliverable confirmation");
      toast.error("Almost there", {
        description: `Still needed: ${parts.join(" and ")}. Stretch tasks are optional.`,
      });
      return;
    }
    busy.current = true;
    const unlocked = actions.completeWeek(week.id);
    busy.current = false;
    if (unlocked === null) return;
    setCelebrate(true);
    markRecentlyCompleted(week.id);
    const fresh = computeStreaks(getAllWeeks(state), {
      ...state.weeks,
      [week.id]: { ...ws, completedAt: "now" },
    });
    onCelebrate({
      weekLabel: week.label,
      title: week.title,
      streak: fresh.current,
      best: fresh.best,
    });
    announceAchievements(unlocked);
  };

  let n = 0;
  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <Banner
          week={week}
          onNavigate={onNavigate}
          onEdit={() => setEditOpen(true)}
          onDelete={() => setConfirmDelete(true)}
        />
        <div className="space-y-6 p-5 sm:p-7">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Meta icon={ListChecks} label="Core tasks" value={`${p.coreDone} / ${p.coreTotal}`} />
            <Meta icon={Gauge} label="Progress" value={`${Math.round(p.ratio * 100)}%`} />
            <Meta icon={Clock} label="Est. effort" value={`${hours} hrs`} />
            <Meta icon={Flag} label="Difficulty" value={week.difficulty ?? "Core"} />
          </div>
          <ProgressBar value={p.ratio} />

          {/* Configurable mission schedule & effort */}
          <Collapsible.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
            <Collapsible.Trigger className="press inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-primary-deep">
              <SlidersHorizontal className="size-3.5 text-primary" />
              <span>Schedule, priority &amp; effort</span>
              {ws.targetDate || ws.priority || ws.customHours ? (
                <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              ) : null}
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  settingsOpen && "rotate-180",
                )}
              />
            </Collapsible.Trigger>
            <Collapsible.Content className="data-[state=open]:animate-collapse-down data-[state=closed]:animate-collapse-up">
              <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-3">
                <label className="block">
                  <span className="hud-label !text-[9px]">Target date</span>
                  <input
                    type="date"
                    value={ws.targetDate ?? ""}
                    onChange={(e) => actions.setWeekMeta(week.id, { targetDate: e.target.value })}
                    className="mt-1.5 h-9 w-full rounded-lg border bg-background px-2.5 text-xs focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="block">
                  <span className="hud-label !text-[9px]">Priority</span>
                  <select
                    value={ws.priority ?? "Standard"}
                    onChange={(e) =>
                      actions.setWeekMeta(week.id, { priority: e.target.value as WeekPriority })
                    }
                    className="mt-1.5 h-9 w-full rounded-lg border bg-background px-2.5 text-xs focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {WEEK_PRIORITIES.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="hud-label !text-[9px]">
                    Effort hours (default {week.hours}h)
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={ws.customHours ?? week.hours}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      actions.setWeekMeta(week.id, {
                        customHours: !e.target.value || val === week.hours ? null : val,
                      });
                    }}
                    className="mt-1.5 h-9 w-full rounded-lg border bg-background px-2.5 text-xs tabular focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              </div>
            </Collapsible.Content>
          </Collapsible.Root>

          {week.objective ? (
            <div className="relative flex gap-3.5 overflow-hidden rounded-xl border border-primary/20 bg-primary-soft/60 p-4">
              <div className="hud-grid pointer-events-none absolute inset-0 opacity-30 [mask-image:linear-gradient(270deg,black,transparent)]" />
              <span className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
                <Target className="size-4" />
              </span>
              <div className="relative">
                <p className="hud-label text-primary-deep">Mission objective</p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground">{week.objective}</p>
              </div>
            </div>
          ) : null}

          {week.sections.map((s) => {
            const done = s.tasks.filter((t) => ws.tasks[t.id]).length;
            return (
              <TaskGroup
                key={s.id}
                id={s.id}
                index={++n}
                title={s.title}
                done={done}
                total={s.tasks.length}
                badge={
                  <span className="rounded bg-ink px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-card">
                    Core
                  </span>
                }
              >
                {s.tasks.map((t) => (
                  <BigCheck
                    key={t.id}
                    label={t.label}
                    checked={Boolean(ws.tasks[t.id])}
                    onChange={() => actions.toggleTask(week.id, t.id)}
                    disabled={completed}
                  />
                ))}
              </TaskGroup>
            );
          })}

          {week.stretch.length ? (
            <TaskGroup
              id={`${week.id}-stretch`}
              icon={<Sparkles className="size-4 text-violet" />}
              title="Stretch tasks"
              done={week.stretch.filter((t) => ws.tasks[t.id]).length}
              total={week.stretch.length}
              optional
              badge={
                <span className="rounded border border-violet/30 bg-violet-soft px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-violet-ink">
                  Optional
                </span>
              }
            >
              {week.stretch.map((t) => (
                <BigCheck
                  key={t.id}
                  label={t.label}
                  checked={Boolean(ws.tasks[t.id])}
                  onChange={() => actions.toggleTask(week.id, t.id)}
                  disabled={completed}
                />
              ))}
            </TaskGroup>
          ) : null}

          <section
            className={cn(
              "panel relative overflow-hidden p-4 transition-[border-color,box-shadow] duration-300 sm:p-5",
              ws.deliverable && "border-lime-ink/30 shadow-glow-lime",
            )}
          >
            <div
              className={cn(
                "absolute inset-y-0 left-0 w-1 transition-colors duration-300",
                ws.deliverable ? "bg-lime" : "bg-gradient-primary",
              )}
            />
            <p className="hud-label flex items-center gap-2 text-primary-deep">
              <Flag className="size-3.5" /> Final weekly deliverable
            </p>
            <p className="mt-1.5 font-display text-base font-semibold">{week.deliverable}</p>
            <div className="mt-3">
              <BigCheck
                label="I confirm the deliverable works and I can explain it."
                checked={ws.deliverable}
                onChange={() => actions.setDeliverable(week.id, !ws.deliverable)}
                disabled={completed}
              />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="hud-label">Learning notes</span>
              <textarea
                value={ws.notes}
                onChange={(e) => actions.setNotes(week.id, e.target.value)}
                rows={5}
                placeholder="Commands, links, gotchas, ideas…"
                className="mt-2 w-full resize-y rounded-lg border bg-card p-3 text-sm placeholder:text-subtle transition-[border-color,box-shadow] duration-200 hover:border-primary/30 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block">
              <span className="hud-label">What did I learn this week?</span>
              <textarea
                value={ws.reflection}
                onChange={(e) => actions.setReflection(week.id, e.target.value)}
                rows={5}
                placeholder="Explain it as if teaching someone else."
                className="mt-2 w-full resize-y rounded-lg border bg-card p-3 text-sm placeholder:text-subtle transition-[border-color,box-shadow] duration-200 hover:border-primary/30 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
        </div>
      </div>

      <footer className="relative border-t bg-card/95 p-4 backdrop-blur sm:px-7">
        {!completed ? (
          <div className="absolute inset-x-0 -top-px h-0.5 overflow-hidden" aria-hidden>
            <div
              className={cn(
                "h-full transition-[width] duration-700 ease-vx",
                check.ok ? "bg-lime" : "bg-gradient-primary",
              )}
              style={{ width: `${Math.round(p.ratio * 100)}%` }}
            />
          </div>
        ) : null}
        {completed ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "grid size-11 place-items-center rounded-full bg-lime shadow-glow-lime",
                  celebrate && "animate-pop",
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-6"
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12.5 10 17 19 7.5" className={celebrate ? "animate-draw" : ""} />
                </svg>
              </span>
              <div>
                <p className="font-display text-sm font-bold uppercase tracking-[0.12em]">
                  Mission complete
                </p>
                <p className="text-xs text-muted-foreground">
                  Completed{" "}
                  {new Date(ws.completedAt!).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const ok = await actions.reopenWeek(week.id);
                if (!ok) {
                  toast.error("Reopened locally — cloud sync failed");
                } else {
                  toast("Mission reopened", { description: `${week.label} is editable again.` });
                }
              }}
            >
              <RotateCcw /> Reopen
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p
              className={cn(
                "text-xs transition-colors",
                check.ok ? "font-medium text-lime-ink" : "text-muted-foreground",
              )}
            >
              {check.ok
                ? "All core tasks and the deliverable are done. Lock it in."
                : `${check.missingCore} core task${check.missingCore === 1 ? "" : "s"} left${check.missingDeliverable ? " · deliverable unconfirmed" : ""}`}
            </p>
            <Button
              variant="mission"
              size="xl"
              onClick={complete}
              aria-disabled={!check.ok}
              className={cn("overflow-hidden", check.ok && "ring-4 ring-primary/15")}
            >
              {check.ok ? (
                <span
                  aria-hidden
                  className="animate-scan pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-card/25 to-transparent"
                />
              ) : null}
              <span className="relative">Complete week mission</span>
            </Button>
          </div>
        )}
      </footer>

      <MissionEditorDialog open={editOpen} initialWeek={week} onClose={() => setEditOpen(false)} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete custom mission?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{week.title}</strong> and recalculates your roadmap
              progress and streaks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                const ok = await actions.deleteCustomWeek(week.id);
                setConfirmDelete(false);
                onDeleted();
                if (!ok) toast.error("Deleted locally — cloud sync failed");
                else toast("Custom mission deleted", { description: week.title });
              }}
            >
              Delete mission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TaskGroup({
  id,
  index,
  icon,
  title,
  badge,
  done,
  total,
  optional,
  children,
}: {
  id: string;
  index?: number;
  icon?: ReactNode;
  title: string;
  badge?: ReactNode;
  done: number;
  total: number;
  optional?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const full = total > 0 && done === total;
  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} asChild>
      <section
        aria-labelledby={`${id}-h`}
        className={cn(
          "rounded-xl border bg-card/60 transition-colors duration-300",
          full && "border-lime-ink/25",
        )}
      >
        <Collapsible.Trigger className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors duration-200 hover:bg-surface/70 focus-visible:ring-2 focus-visible:ring-primary">
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg font-display text-xs font-bold tabular transition-colors duration-300",
              full ? "bg-lime text-ink" : "bg-primary-soft text-primary-deep",
            )}
          >
            {icon ?? String(index ?? 0).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1">
            <span
              id={`${id}-h`}
              className="flex flex-wrap items-center gap-2 font-display text-[15px] font-semibold"
            >
              {title} {badge}
            </span>
            <span className="mt-1.5 flex items-center gap-2">
              <ProgressBar
                value={total ? done / total : 0}
                className="h-1 max-w-40"
                tone={full ? "lime" : "orange"}
              />
              <span
                className={cn(
                  "text-[11px] tabular",
                  full ? "font-semibold text-lime-ink" : "text-muted-foreground",
                )}
              >
                {done}/{total}
                {optional ? " · never blocks completion" : ""}
              </span>
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-subtle transition-transform duration-300 ease-vx group-data-[state=open]:rotate-180" />
        </Collapsible.Trigger>
        <Collapsible.Content className="data-[state=open]:animate-collapse-down data-[state=closed]:animate-collapse-up">
          <div className="grid grid-cols-1 gap-2 px-3 pb-3">{children}</div>
        </Collapsible.Content>
      </section>
    </Collapsible.Root>
  );
}

function BufferDetail({ week, onNavigate }: { week: Week; onNavigate: (id: string) => void }) {
  const state = useMission();
  const milestone = getMergedMilestones(state).find((m) => m.id === week.milestoneId);
  const ws = state.weeks[week.id] ?? emptyWeekState();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const carry = (milestone?.weeks ?? [])
    .filter((w) => w.kind === "mission" && !state.weeks[w.id]?.completedAt)
    .map((w) => ({
      week: w,
      open: w.sections.flatMap((s) => s.tasks).filter((t) => !state.weeks[w.id]?.tasks[t.id]),
      touched: coreTaskIds(w).some((id) => state.weeks[w.id]?.tasks[id]),
    }))
    .filter((c) => c.open.length);

  return (
    <div className="flex-1 overflow-y-auto">
      <Banner week={week} onNavigate={onNavigate} />
      <div className="space-y-6 p-5 sm:p-7">
        <div className="rounded-xl border border-cyan/30 bg-cyan-soft p-4 text-sm leading-relaxed text-foreground">
          A buffer block is planned breathing room. It never counts as a missed week and never
          breaks your streak. Use it to carry forward unfinished core tasks, revise, debug,
          document, or recover after a hard week.
        </div>
        <section>
          <h3 className="mb-3 font-display text-base font-semibold">
            Carry-forward from {milestone?.label.toLowerCase()}
          </h3>
          {carry.length === 0 ? (
            <p className="panel p-4 text-sm text-muted-foreground">
              Nothing to carry forward. Use this block for revision, refactoring, or extra practice.
            </p>
          ) : (
            <div className="space-y-4">
              {carry.map((c) => {
                const showAll = c.touched || expanded[c.week.id];
                const visible = showAll ? c.open : c.open.slice(0, 3);
                return (
                  <div
                    key={c.week.id}
                    className="panel p-4 transition-colors hover:border-primary/30"
                  >
                    <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="hud-label">{c.week.label}</p>
                        <p className="font-display text-sm font-semibold">{c.week.title}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground tabular">
                          {c.open.length} open
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => onNavigate(c.week.id)}>
                          Open week <ArrowUpRight />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {visible.map((t) => (
                        <BigCheck
                          key={t.id}
                          label={t.label}
                          checked={false}
                          onChange={() => actions.toggleTask(c.week.id, t.id)}
                        />
                      ))}
                    </div>
                    {!showAll && c.open.length > 3 ? (
                      <button
                        type="button"
                        onClick={() => setExpanded((e) => ({ ...e, [c.week.id]: true }))}
                        className="mt-2.5 text-xs font-medium text-primary-deep underline-offset-4 hover:underline"
                      >
                        Show all {c.open.length} open tasks
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
        <label className="block">
          <span className="hud-label">Buffer notes</span>
          <textarea
            value={ws.notes}
            onChange={(e) => actions.setNotes(week.id, e.target.value)}
            rows={4}
            placeholder="What did you catch up on?"
            className="mt-2 w-full rounded-lg border bg-card p-3 text-sm placeholder:text-subtle transition-[border-color,box-shadow] duration-200 hover:border-primary/30 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>
    </div>
  );
}
