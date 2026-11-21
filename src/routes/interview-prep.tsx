import { createFileRoute } from "@tanstack/react-router";
import {
  Briefcase,
  Check,
  ExternalLink,
  Minus,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AnimatedNumber,
  PageHeader,
  ProgressBar,
  SectionHeading,
  Tag,
} from "@/components/vx/primitives";
import {
  DSA_PROGRESSION,
  DSA_TOPICS,
  HABITS,
  INTERVIEW_TRACKS,
  JOB_STATUSES,
  TARGET_LOCATIONS,
  TARGET_ROLES,
  type JobStatus,
} from "@/data/habits";
import { actions, currentHabits, useMission } from "@/lib/mission-store";
import { kolkataDayIndex, safeExternalUrl, type Job } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/interview-prep")({
  head: () => ({
    meta: [
      { title: "DSA & Interview Prep — VARMA 27" },
      {
        name: "description",
        content:
          "Gradual DSA practice, daily engineering habits, interview calibration and a job application tracker.",
      },
      { property: "og:title", content: "DSA & Interview Prep — VARMA 27" },
      {
        property: "og:description",
        content:
          "100–120 DSA questions, 30–40 SQL exercises and a career pipeline for Applied AI roles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InterviewPrep,
});

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

const STATUS_BADGE: Record<JobStatus, string> = {
  Saved: "border-border bg-surface text-muted-foreground",
  Applied: "border-cyan/30 bg-cyan-soft text-cyan-ink",
  Screening: "border-violet/30 bg-violet-soft text-violet-ink",
  Interviewing: "border-primary/25 bg-primary-soft text-primary-deep",
  Offer: "border-lime-ink/25 bg-lime text-ink",
  Rejected: "border-destructive/25 bg-destructive/10 text-destructive",
};

function InterviewPrep() {
  const state = useMission();
  const habits = currentHabits(state);
  const today = kolkataDayIndex();
  const loggedWeeks = Object.keys(state.habitHistory).length;
  const totalHabitChecks = HABITS.reduce(
    (sum, h) => sum + (habits[h.id] ?? []).filter(Boolean).length,
    0,
  );
  const maxHabitChecks = HABITS.length * 7;
  const practicedTopics = DSA_TOPICS.filter((t) => state.dsaTopics[t]).length;
  const calibratedTracks = INTERVIEW_TRACKS.filter((t) => state.interviewTracks[t]).length;

  return (
    <div className="space-y-8">
      <PageHeader
        code="Continuous practice"
        title="SHARPEN EVERY WEEK."
        description="DSA starts early and grows gradually — October is never the first month of problem-solving. Habits support the weekly mission; they don't compete with it."
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Counter
          label="DSA questions solved"
          value={state.dsa.problems}
          target={120}
          targetLabel="Target ~100–120"
          onBump={(d) => actions.bumpDsa("problems", d)}
        />
        <Counter
          label="SQL exercises"
          value={state.dsa.sql}
          target={40}
          targetLabel="Target ~30–40"
          onBump={(d) => actions.bumpDsa("sql", d)}
        />
        <div className="panel lift p-5">
          <p className="hud-label">DSA ramp</p>
          <ol className="mt-3 space-y-2.5">
            {DSA_PROGRESSION.map((s, i) => (
              <li
                key={s.period}
                className="group flex items-center gap-3 rounded-lg px-2 py-1 -mx-2 transition-colors hover:bg-surface/70"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-surface font-display text-[10px] font-bold transition-colors group-hover:bg-primary-soft group-hover:text-primary-deep">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium">{s.label}</span>
                  <span className="text-[10px] text-muted-foreground">{s.period}</span>
                </span>
                <span className="shrink-0 rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary-deep">
                  {s.target}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <SectionHeading
          eyebrow="This week"
          title="Engineering habits"
          className="mb-3"
          action={
            <div className="flex items-center gap-2">
              {loggedWeeks > 1 ? (
                <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium tabular text-muted-foreground">
                  {loggedWeeks} weeks logged
                </span>
              ) : null}
              <span className="rounded-full border border-border bg-surface px-3 py-1 font-display text-xs font-semibold tabular text-muted-foreground">
                {totalHabitChecks} / {maxHabitChecks} checks
              </span>
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr>
                <th className="pb-2 text-left font-normal text-muted-foreground">
                  <span className="sr-only">Habit</span>
                </th>
                {DAYS.map((d, i) => (
                  <th
                    key={i}
                    className={cn(
                      "pb-2 text-center font-display text-[11px] font-semibold",
                      i === today ? "text-primary-deep" : "text-subtle",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-grid size-6 place-items-center rounded-full",
                        i === today && "bg-primary-soft",
                      )}
                    >
                      {d}
                    </span>
                  </th>
                ))}
                <th className="pb-2 text-right font-display text-[11px] font-semibold text-subtle">
                  Days
                </th>
              </tr>
            </thead>
            <tbody>
              {HABITS.map((h) => {
                const row = habits[h.id] ?? [];
                const count = row.filter(Boolean).length;
                return (
                  <tr key={h.id} className="border-t transition-colors hover:bg-surface/40">
                    <td className="py-2 pr-3 text-sm font-medium">{h.label}</td>
                    {DAYS.map((_, i) => {
                      const on = Boolean(row[i]);
                      return (
                        <td key={i} className="py-1.5 text-center">
                          <button
                            type="button"
                            aria-label={`${h.label} day ${i + 1}`}
                            aria-pressed={on}
                            onClick={() => actions.toggleHabit(h.id, i)}
                            className={cn(
                              "press inline-grid size-9 cursor-pointer place-items-center rounded-lg border transition-[background-color,border-color,box-shadow,transform] duration-200 ease-vx",
                              on
                                ? "border-lime-ink/30 bg-lime text-ink shadow-glow-lime"
                                : "bg-card hover:-translate-y-px hover:border-primary/45 hover:bg-primary-soft/30",
                              i === today && !on && "border-primary/45 ring-2 ring-primary/10",
                            )}
                          >
                            {on ? <Check className="size-4" strokeWidth={3} /> : null}
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-2 text-right font-display font-semibold tabular">{count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="panel lift p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="hud-label">DSA &amp; technical topics</p>
            <span className="text-xs font-medium tabular text-muted-foreground">
              {practicedTopics}/{DSA_TOPICS.length} practiced
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Click any topic to toggle whether you have practiced it.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {DSA_TOPICS.map((t, i) => {
              const done = Boolean(state.dsaTopics[t]);
              const tone = i < 9 ? "orange" : i < 13 ? "cyan" : "violet";
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={done}
                  onClick={() => actions.toggleDsaTopic(t)}
                  className={cn(
                    "press inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-[background-color,border-color,transform,box-shadow] duration-200 ease-vx hover:-translate-y-px",
                    done
                      ? "border-lime-ink/30 bg-lime-soft text-lime-ink shadow-panel"
                      : tone === "orange"
                        ? "border-primary/20 bg-primary-soft/50 text-primary-deep hover:border-primary/45"
                        : tone === "cyan"
                          ? "border-cyan/30 bg-cyan-soft/60 text-cyan-ink hover:border-cyan/60"
                          : "border-violet/25 bg-violet-soft/60 text-violet-ink hover:border-violet/50",
                  )}
                >
                  {done ? <Check className="size-3" strokeWidth={3} /> : null}
                  {t}
                </button>
              );
            })}
          </div>
        </div>
        <div className="panel lift p-5 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="hud-label">Interview calibration · from June</p>
            <span className="text-xs font-medium tabular text-muted-foreground">
              {calibratedTracks}/{INTERVIEW_TRACKS.length} calibrated
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Mark tracks once you have drilled them in mock interviews.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {INTERVIEW_TRACKS.map((t) => {
              const done = Boolean(state.interviewTracks[t]);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={done}
                  onClick={() => actions.toggleInterviewTrack(t)}
                  className={cn(
                    "press inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-[background-color,border-color,transform,box-shadow] duration-200 ease-vx hover:-translate-y-px",
                    done
                      ? "border-lime-ink/30 bg-lime-soft text-lime-ink shadow-panel"
                      : "border-border bg-surface text-foreground hover:border-primary/40 hover:text-primary-deep",
                  )}
                >
                  {done ? <Check className="size-3" strokeWidth={3} /> : null}
                  {t}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Goal: explain the capstone architecture independently and discuss security, evaluation
            and deployment decisions.
          </p>
        </div>
      </section>

      <JobTracker />
    </div>
  );
}

function Counter({
  label,
  value,
  target,
  targetLabel,
  onBump,
}: {
  label: string;
  value: number;
  target: number;
  targetLabel: string;
  onBump: (d: number) => void;
}) {
  const pct = Math.min(1, value / target);
  return (
    <div className="panel lift relative overflow-hidden p-5 hover:border-primary/35">
      <div className="hud-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative">
        <p className="hud-label">{label}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="font-display text-5xl font-bold tabular">
            <AnimatedNumber value={value} />
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="hud"
              size="icon"
              onClick={() => onBump(-1)}
              aria-label={`Decrease ${label}`}
              disabled={value === 0}
            >
              <Minus />
            </Button>
            <Button
              variant="mission"
              size="icon"
              onClick={() => onBump(1)}
              aria-label={`Increase ${label} by 1`}
            >
              <Plus />
            </Button>
            <Button
              variant="soft"
              size="sm"
              onClick={() => onBump(5)}
              aria-label={`Increase ${label} by 5`}
              className="h-9 px-2.5 font-display text-xs font-bold"
            >
              +5
            </Button>
          </div>
        </div>
        <ProgressBar value={pct} tone={pct >= 1 ? "lime" : "orange"} className="mt-4" />
        <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{targetLabel}</span>
          <span className="tabular font-medium">{Math.round(pct * 100)}%</span>
        </div>
      </div>
    </div>
  );
}

const blankJob = (): Job => ({
  id: "",
  company: "",
  role: TARGET_ROLES[0],
  url: "",
  location: TARGET_LOCATIONS[0],
  experience: "",
  salary: "",
  appliedOn: "",
  resume: "",
  status: "Saved",
  round: "",
  recruiter: "",
  feedback: "",
  followUp: "",
});

const FIELDS: {
  key: keyof Job;
  label: string;
  type?: string;
  list?: readonly string[];
  wide?: boolean;
}[] = [
  { key: "company", label: "Company" },
  { key: "role", label: "Role", list: TARGET_ROLES },
  { key: "url", label: "Job URL", type: "url", wide: true },
  { key: "location", label: "Location", list: TARGET_LOCATIONS },
  { key: "experience", label: "Experience requirement" },
  { key: "salary", label: "Expected salary" },
  { key: "appliedOn", label: "Application date", type: "date" },
  { key: "resume", label: "Resume version" },
  { key: "round", label: "Interview round" },
  { key: "recruiter", label: "Recruiter details" },
  { key: "followUp", label: "Follow-up date", type: "date" },
  { key: "feedback", label: "Feedback", wide: true },
];

function JobTracker() {
  const state = useMission();
  const [draft, setDraft] = useState<Job | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null);
  const [statusFilter, setStatusFilter] = useState<JobStatus | "All">("All");
  const [search, setSearch] = useState("");

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.jobs.filter((j) => {
      if (statusFilter !== "All" && j.status !== statusFilter) return false;
      if (q && !`${j.company} ${j.role} ${j.location} ${j.round}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [search, state.jobs, statusFilter]);

  const save = async () => {
    if (!draft || !draft.company.trim()) return;
    if (draft.url.trim() && !safeExternalUrl(draft.url)) {
      toast.error("Invalid Job URL", {
        description: "Enter a valid http(s) link or leave it blank.",
      });
      return;
    }
    const normalizedUrl = draft.url.trim() ? (safeExternalUrl(draft.url) ?? "") : "";
    const isEdit = Boolean(draft.id);
    const ok = await actions.saveJob({
      ...draft,
      company: draft.company.trim(),
      url: normalizedUrl,
      id: draft.id || crypto.randomUUID(),
    });
    if (!ok) {
      toast.error("Saved locally — cloud sync failed");
    } else {
      toast.success(isEdit ? "Application updated" : "Application saved", {
        description: draft.company.trim(),
      });
    }
    setDraft(null);
  };

  return (
    <section>
      <SectionHeading
        eyebrow="Career pipeline"
        title="Application tracker"
        action={
          <Button variant="mission" onClick={() => setDraft(blankJob())}>
            <Plus /> Add application
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {TARGET_ROLES.map((r) => (
          <Tag key={r} tone="violet">
            {r}
          </Tag>
        ))}
        {TARGET_LOCATIONS.map((l) => (
          <Tag key={l} tone="cyan">
            {l}
          </Tag>
        ))}
      </div>

      {state.jobs.length > 0 ? (
        <div className="panel mb-4 flex flex-col gap-3 p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, role, location…"
              aria-label="Search job applications"
              className="h-9 w-full rounded-lg border bg-background pl-9 pr-8 text-sm placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear application search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-subtle hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          <div
            className="flex flex-wrap gap-1"
            role="group"
            aria-label="Filter applications by status"
          >
            {(["All", ...JOB_STATUSES] as const).map((st) => {
              const count =
                st === "All" ? state.jobs.length : state.jobs.filter((j) => j.status === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  aria-pressed={statusFilter === st}
                  onClick={() => setStatusFilter(st)}
                  className={cn(
                    "press h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors",
                    statusFilter === st
                      ? "border-primary/30 bg-primary-soft text-primary-deep"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {st} <span className="ml-0.5 opacity-70 tabular">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {state.jobs.length === 0 ? (
        <div className="panel grid place-items-center p-10 text-center">
          <Briefcase className="size-8 text-subtle" />
          <p className="mt-3 font-display font-semibold">No applications yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Regular applications start in June 2027, once the portfolio and foundations are
            credible.
          </p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="panel grid place-items-center p-8 text-center">
          <p className="font-display font-semibold">No applications match this filter</p>
          <Button
            variant="soft"
            size="sm"
            className="mt-3"
            onClick={() => {
              setSearch("");
              setStatusFilter("All");
            }}
          >
            Show all applications
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {filteredJobs.map((j) => {
            const safeUrl = safeExternalUrl(j.url);
            return (
              <article
                key={j.id}
                className="panel lift p-4 transition-[border-color,box-shadow,transform] hover:border-primary/35"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display font-semibold">{j.company}</p>
                    <p className="text-xs text-muted-foreground">
                      {j.role} · {j.location}
                    </p>
                  </div>
                  <select
                    aria-label={`Status for ${j.company}`}
                    value={j.status}
                    onChange={async (e) => {
                      const nextStatus = e.target.value as JobStatus;
                      const ok = await actions.saveJob({ ...j, status: nextStatus });
                      if (!ok) toast.error("Updated locally — cloud sync failed");
                      else toast("Status updated", { description: `${j.company} → ${nextStatus}` });
                    }}
                    className={cn(
                      "shrink-0 cursor-pointer rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/30",
                      STATUS_BADGE[j.status],
                    )}
                  >
                    {JOB_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  {j.appliedOn ? <Row k="Applied" v={j.appliedOn} /> : null}
                  {j.followUp ? <Row k="Follow-up" v={j.followUp} /> : null}
                  {j.round ? <Row k="Round" v={j.round} /> : null}
                  {j.salary ? <Row k="Salary" v={j.salary} /> : null}
                </dl>
                {j.feedback ? (
                  <p className="mt-2.5 rounded-lg bg-surface p-2 text-xs text-muted-foreground">
                    {j.feedback}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-1">
                  {safeUrl ? (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={safeUrl} target="_blank" rel="noreferrer">
                        <ExternalLink /> Posting
                      </a>
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm" onClick={() => setDraft(j)}>
                    <Pencil /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(j)}
                    className="hover:text-destructive"
                  >
                    <Trash2 /> Remove
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(draft)} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">
              {draft?.id ? "Edit application" : "New application"}
            </DialogTitle>
          </DialogHeader>
          {draft ? (
            <form
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                void save();
              }}
            >
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <select
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as Job["status"] })}
                  className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {JOB_STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              {FIELDS.map((f) => (
                <label key={f.key} className={cn("block", f.wide && "sm:col-span-2")}>
                  <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                  {f.list ? (
                    <select
                      value={draft[f.key]}
                      onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                      className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {f.list.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.type ?? "text"}
                      value={draft[f.key]}
                      required={f.key === "company"}
                      onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
                      className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  )}
                </label>
              ))}
              <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
                <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="mission">
                  Save application
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Remove application?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes <strong>{deleteTarget?.company}</strong> ({deleteTarget?.role}) from your
              career tracker.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTarget) return;
                const ok = await actions.deleteJob(deleteTarget.id);
                if (!ok) toast.error("Removed locally — cloud sync failed");
                else toast("Application removed", { description: deleteTarget.company });
                setDeleteTarget(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="truncate text-right font-medium">{v}</dd>
    </>
  );
}
