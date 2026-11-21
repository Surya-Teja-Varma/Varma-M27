import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ExternalLink,
  FolderGit2,
  Globe,
  Package,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMissionDrawer } from "@/components/vx/mission-drawer";
import {
  AnimatedNumber,
  PageHeader,
  ProgressBar,
  StatusPill,
  Tag,
} from "@/components/vx/primitives";
import { getMilestone, getWeek } from "@/data/roadmap";
import { actions, useMission } from "@/lib/mission-store";
import {
  computeProjectStatus,
  emptyProjectMeta,
  getMergedProjects,
  milestoneCleared,
  PROJECT_STATUSES,
  safeExternalUrl,
  weekStatus,
  type CustomProject,
  type ProjectStatus,
  type UnifiedProject,
} from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects & Portfolio — VARMA 27" },
      {
        name: "description",
        content:
          "Six portfolio projects, from a first LLM app to the evolving Enterprise AI Operations Copilot capstone.",
      },
      { property: "og:title", content: "Projects & Portfolio — VARMA 27" },
      {
        property: "og:description",
        content: "Full-stack AI products with real frontends, evaluations and deployments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Projects,
});

function Projects() {
  const state = useMission();
  const projects = getMergedProjects(state);
  const [selected, setSelected] = useState<UnifiedProject | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCustom, setEditingCustom] = useState<CustomProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomProject | null>(null);

  const capstone = projects.find((p) => p.capstone)!;
  const rest = projects.filter((p) => !p.capstone);
  const shippedCount = projects.filter(
    (p) => computeProjectStatus(p, state).status === "Shipped",
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        code="Portfolio"
        title="PROJECTS THAT PROVE IT."
        description="Every AI project ships with a real React/TypeScript frontend — streaming UIs, citations, tool status and approvals. Progress moves with real missions or tracked custom builds."
        aside={
          <div className="panel-glass lift w-full p-4 lg:w-64">
            <div className="flex items-center justify-between gap-2">
              <p className="hud-label !text-[9px]">Portfolio shipped</p>
              <Button
                variant="mission"
                size="sm"
                className="h-7 px-2.5 text-[10px]"
                onClick={() => {
                  setEditingCustom(null);
                  setEditorOpen(true);
                }}
              >
                <Plus className="size-3.5" /> Add
              </Button>
            </div>
            <p className="mt-1 font-display text-4xl font-bold tabular">
              <AnimatedNumber value={shippedCount} />
              <span className="ml-1 text-base font-medium text-muted-foreground">
                / {projects.length}
              </span>
            </p>
            <ProgressBar
              value={projects.length ? shippedCount / projects.length : 0}
              tone={shippedCount === projects.length ? "lime" : "orange"}
              className="mt-2"
            />
            <p className="mt-2 text-[11px] text-muted-foreground">
              Attach real repo &amp; demo links as you ship.
            </p>
          </div>
        }
      />

      <CapstoneCard p={capstone} onInspect={() => setSelected(capstone)} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rest.map((p, i) => (
          <ProjectCard
            key={p.id}
            p={p}
            index={i + 1}
            onInspect={() => setSelected(p)}
            onEditCustom={
              p.custom
                ? () => {
                    setEditingCustom(p.custom!);
                    setEditorOpen(true);
                  }
                : undefined
            }
            onDeleteCustom={p.custom ? () => setDeleteTarget(p.custom!) : undefined}
          />
        ))}
      </div>

      <ProjectDetailDialog project={selected} onClose={() => setSelected(null)} />

      <CustomProjectDialog
        open={editorOpen}
        initial={editingCustom}
        onClose={() => {
          setEditorOpen(false);
          setEditingCustom(null);
        }}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete custom project?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{deleteTarget?.name}</strong> from your portfolio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTarget) return;
                const ok = await actions.deleteCustomProject(deleteTarget.id);
                if (!ok) toast.error("Deleted locally — cloud sync failed");
                else toast("Project deleted", { description: deleteTarget.name });
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.14em]",
        status === "Shipped"
          ? "border-lime-ink/25 bg-lime text-ink"
          : status === "In progress"
            ? "border-primary/25 bg-primary-soft text-primary-deep"
            : "border-border bg-surface text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

function ProjectCard({
  p,
  index,
  onInspect,
  onEditCustom,
  onDeleteCustom,
}: {
  p: UnifiedProject;
  index: number;
  onInspect: () => void;
  onEditCustom?: (() => void) | undefined;
  onDeleteCustom?: (() => void) | undefined;
}) {
  const state = useMission();
  const { pct, status, done, total } = computeProjectStatus(p, state);
  const { openMission } = useMissionDrawer();
  const meta = p.custom
    ? { demoUrl: p.custom.demoUrl, repoUrl: p.custom.repoUrl, notes: p.custom.notes }
    : (state.projects[p.id] ?? emptyProjectMeta());
  const demoHref = safeExternalUrl(meta.demoUrl);
  const repoHref = safeExternalUrl(meta.repoUrl);
  const nextWeekId = p.weekIds.find((id) => !state.weeks[id]?.completedAt) ?? p.weekIds[0];

  return (
    <article
      className={cn(
        "panel lift group flex flex-col overflow-hidden transition-[border-color,box-shadow,transform] duration-300 ease-vx hover:border-primary/35",
        status === "Shipped" && "glow-lime border-lime-ink/25",
      )}
    >
      <button
        type="button"
        onClick={onInspect}
        aria-label={`Inspect ${p.name} details`}
        className="relative h-32 w-full cursor-pointer overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <img
          src={illustration}
          alt=""
          className="h-full w-full object-cover object-[75%_45%] transition-transform duration-700 ease-vx group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent" />
        <span className="absolute left-4 top-4 rounded-md bg-card/90 px-2 py-0.5 font-display text-[10px] font-bold tabular backdrop-blur">
          {p.custom ? "CUSTOM" : `P${String(index).padStart(2, "0")}`}
        </span>
        <span className="absolute right-4 top-4">
          <StatusBadge status={status} />
        </span>
      </button>
      <div className="flex flex-1 flex-col p-5 pt-1">
        <p className="hud-label !text-[9px]">{p.period}</p>
        <h3 className="mt-1 text-lg font-bold leading-tight transition-colors duration-200 group-hover:text-primary-deep">
          {p.name}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
        {p.categories.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {p.categories.map((c) => (
              <Tag key={c}>{c}</Tag>
            ))}
          </div>
        ) : null}
        {p.tech.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {p.tech.map((t) => (
              <span
                key={t}
                className="rounded border bg-surface px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
        <div className="mt-auto pt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 truncate text-muted-foreground">
              <Package className="size-3.5 shrink-0 text-primary" />{" "}
              {p.deliverable || "Custom build"}
            </span>
            <span className="shrink-0 tabular font-semibold">
              {p.weekIds.length > 0 ? `${done}/${total} · ` : ""}
              {Math.round(pct * 100)}%
            </span>
          </div>
          <ProgressBar
            value={pct}
            tone={status === "Shipped" ? "lime" : "orange"}
            className="h-1.5"
          />
          <div className="mt-3 flex flex-wrap items-center gap-1">
            {nextWeekId ? (
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 text-primary-deep"
                onClick={() => openMission(nextWeekId)}
              >
                {done > 0 && done < p.weekIds.length ? "Continue mission" : "Open mission"}{" "}
                <ArrowRight />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={onInspect}
              className={cn("text-muted-foreground", !nextWeekId && "-ml-2 text-primary-deep")}
            >
              <SlidersHorizontal /> Details
            </Button>
            {onEditCustom ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEditCustom}
                aria-label={`Edit ${p.name}`}
                className="text-muted-foreground"
              >
                <Pencil />
              </Button>
            ) : null}
            {onDeleteCustom ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteCustom}
                aria-label={`Delete ${p.name}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 />
              </Button>
            ) : null}
            {repoHref ? (
              <Button variant="ghost" size="sm" asChild className="ml-auto text-muted-foreground">
                <a
                  href={repoHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${p.name} repository`}
                >
                  <FolderGit2 />
                </a>
              </Button>
            ) : null}
            {demoHref ? (
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                <a
                  href={demoHref}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${p.name} live demo`}
                >
                  <Globe />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function CapstoneCard({ p, onInspect }: { p: UnifiedProject; onInspect: () => void }) {
  const state = useMission();
  const { openMission } = useMissionDrawer();
  const { pct, status, done } = computeProjectStatus(p, state);
  const meta = state.projects[p.id] ?? emptyProjectMeta();
  const demoHref = safeExternalUrl(meta.demoUrl);
  const repoHref = safeExternalUrl(meta.repoUrl);

  return (
    <article className="hud-corners group/cap relative isolate overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-lift transition-[border-color,box-shadow] duration-300 ease-vx hover:border-primary/40 hover:shadow-[var(--elev-hover),0_20px_44px_-24px_var(--glow-orange)]">
      <img
        src={illustration}
        alt=""
        className="absolute inset-0 -z-10 h-full w-full object-cover object-right opacity-60 transition-transform duration-[1200ms] ease-vx group-hover/cap:scale-[1.03] md:opacity-100"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-card via-card/92 to-card/20" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-energy" />
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-ink px-2 py-1 font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-card">
            Capstone
          </span>
          <StatusBadge status={status} />
          <span className="text-xs text-muted-foreground">{p.period}</span>
        </div>
        <h2 className="mt-4 max-w-xl text-3xl font-bold leading-tight sm:text-4xl">{p.name}</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {p.description}
        </p>
        <div className="mt-4 flex max-w-xl flex-wrap gap-1">
          {p.tech.map((t) => (
            <span
              key={t}
              className="rounded border bg-card/85 px-2 py-0.5 text-[11px] text-foreground backdrop-blur transition-colors hover:border-primary/35"
            >
              {t}
            </span>
          ))}
        </div>
        <p className="hud-label mt-7">Evolution · built incrementally, never from zero</p>
        <ol className="mt-3 grid max-w-3xl gap-2 sm:grid-cols-5">
          {p.stages!.map((s, i) => {
            const m = getMilestone(s.milestoneId)!;
            const cleared = milestoneCleared(m, state.weeks);
            const firstMission =
              m.weeks.find((w) => w.kind === "mission" && !state.weeks[w.id]?.completedAt) ??
              m.weeks[0];
            return (
              <li key={s.label}>
                <button
                  type="button"
                  onClick={() => firstMission && openMission(firstMission.id)}
                  className={cn(
                    "interactive flex h-full w-full flex-col rounded-xl border p-3 text-left backdrop-blur",
                    cleared ? "glow-lime border-lime-ink/25 bg-lime" : "bg-card/85",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "font-display text-[10px] font-bold uppercase tracking-wider",
                        cleared ? "text-ink" : "text-muted-foreground",
                      )}
                    >
                      {m.label.split(" ")[0]?.slice(0, 3)}
                      {m.label.includes("–") ? "–AUG" : ""}
                    </span>
                    {cleared ? (
                      <Check className="size-3.5 text-ink" strokeWidth={3} />
                    ) : (
                      <span className="font-display text-[10px] tabular text-subtle">0{i + 1}</span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs font-medium leading-snug">{s.label}</p>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full max-w-md">
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-muted-foreground">
                Capstone milestones shipped ({done}/{p.weekIds.length})
              </span>
              <span className="font-semibold tabular">{Math.round(pct * 100)}%</span>
            </div>
            <ProgressBar value={pct} tone={status === "Shipped" ? "lime" : "orange"} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="mission" onClick={onInspect}>
              Project details <ArrowRight />
            </Button>
            {repoHref ? (
              <Button variant="hud" asChild>
                <a href={repoHref} target="_blank" rel="noreferrer">
                  <FolderGit2 /> Repo <ExternalLink />
                </a>
              </Button>
            ) : null}
            {demoHref ? (
              <Button variant="hud" asChild>
                <a href={demoHref} target="_blank" rel="noreferrer">
                  <Globe /> Live demo <ExternalLink />
                </a>
              </Button>
            ) : null}
          </div>
        </div>
        <p className="mt-4 max-w-xl text-[11px] text-subtle">
          Use permitted workflows or safe mock data. Metrics are recorded from the real system —
          never invented.
        </p>
      </div>
    </article>
  );
}

function ProjectDetailDialog({
  project,
  onClose,
}: {
  project: UnifiedProject | null;
  onClose: () => void;
}) {
  const state = useMission();
  const { openMission } = useMissionDrawer();
  const meta = project
    ? project.custom
      ? {
          demoUrl: project.custom.demoUrl,
          repoUrl: project.custom.repoUrl,
          notes: project.custom.notes,
        }
      : (state.projects[project.id] ?? emptyProjectMeta())
    : emptyProjectMeta();

  const [draftDemo, setDraftDemo] = useState("");
  const [draftRepo, setDraftRepo] = useState("");
  const [draftNotes, setDraftNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (project && editingId !== project.id) {
    setEditingId(project.id);
    setDraftDemo(meta.demoUrl);
    setDraftRepo(meta.repoUrl);
    setDraftNotes(meta.notes);
  }
  if (!project && editingId !== null) {
    setEditingId(null);
  }

  if (!project) return null;

  const { pct, done, total } = computeProjectStatus(project, state);
  const validDemo = safeExternalUrl(draftDemo);
  const validRepo = safeExternalUrl(draftRepo);
  const demoInvalid = draftDemo.trim().length > 0 && !validDemo;
  const repoInvalid = draftRepo.trim().length > 0 && !validRepo;

  const saveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (demoInvalid || repoInvalid) {
      toast.error("Check project URLs", {
        description: "Enter a valid http(s) URL (for example https://github.com/user/repo).",
      });
      return;
    }
    setSaving(true);
    let ok = true;
    if (project.custom) {
      ok = await actions.saveCustomProject({
        ...project.custom,
        demoUrl: validDemo ?? "",
        repoUrl: validRepo ?? "",
        notes: draftNotes,
        updatedAt: new Date().toISOString(),
      });
    } else {
      ok = await actions.saveProjectMeta(project.id, {
        demoUrl: validDemo ?? "",
        repoUrl: validRepo ?? "",
        notes: draftNotes,
      });
    }
    setSaving(false);
    if (!ok) {
      toast.error("Saved locally — cloud sync failed");
    } else {
      toast.success("Project links saved", { description: project.name });
    }
  };

  return (
    <Dialog open={Boolean(project)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <p className="hud-label text-primary-deep">{project.period}</p>
          <DialogTitle className="font-display text-2xl font-bold">{project.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm leading-relaxed text-muted-foreground">{project.description}</p>

        {project.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {project.categories.map((c) => (
              <Tag key={c}>{c}</Tag>
            ))}
          </div>
        ) : null}

        <div className="rounded-xl border bg-surface/60 p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">
              Deliverable: {project.deliverable || "Custom build"}
            </span>
            <span className="font-semibold tabular text-primary-deep">
              {project.weekIds.length > 0 ? `${done}/${total} missions · ` : ""}
              {Math.round(pct * 100)}%
            </span>
          </div>
          <ProgressBar value={pct} tone={pct >= 1 ? "lime" : "orange"} />
        </div>

        {project.weekIds.length > 0 ? (
          <div>
            <p className="hud-label mb-2">Linked weekly missions</p>
            <div className="space-y-1.5">
              {project.weekIds.map((wid) => {
                const week = getWeek(wid);
                if (!week) return null;
                const status = weekStatus(week, state.weeks[wid]);
                return (
                  <button
                    key={wid}
                    type="button"
                    onClick={() => {
                      onClose();
                      openMission(wid);
                    }}
                    className="interactive flex w-full items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2.5 text-left"
                  >
                    <div className="min-w-0">
                      <p className="hud-label !text-[9px] text-primary-deep">{week.label}</p>
                      <p className="truncate font-display text-sm font-semibold">{week.title}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusPill status={status} />
                      <ArrowUpRight className="size-4 text-subtle" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <form onSubmit={(e) => void saveLinks(e)} className="space-y-3 border-t pt-4">
          <p className="hud-label">Repository, live demo &amp; build notes</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">
                GitHub Repository URL
              </span>
              <input
                type="url"
                value={draftRepo}
                onChange={(e) => setDraftRepo(e.target.value)}
                placeholder="https://github.com/username/repo"
                className={cn(
                  "mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                  repoInvalid && "border-destructive",
                )}
              />
              {repoInvalid ? (
                <span className="mt-1 block text-[11px] text-destructive">
                  Enter a valid http(s) URL.
                </span>
              ) : null}
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Live Demo URL</span>
              <input
                type="url"
                value={draftDemo}
                onChange={(e) => setDraftDemo(e.target.value)}
                placeholder="https://your-demo.example.com"
                className={cn(
                  "mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                  demoInvalid && "border-destructive",
                )}
              />
              {demoInvalid ? (
                <span className="mt-1 block text-[11px] text-destructive">
                  Enter a valid http(s) URL.
                </span>
              ) : null}
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Architecture &amp; benchmark notes
            </span>
            <textarea
              rows={3}
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              placeholder="Record real latency, evaluation scores, deployment notes, or architecture trade-offs…"
              className="mt-1 w-full resize-y rounded-lg border bg-card p-3 text-sm placeholder:text-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap gap-2">
              {validRepo ? (
                <Button type="button" variant="hud" size="sm" asChild>
                  <a href={validRepo} target="_blank" rel="noreferrer">
                    <FolderGit2 /> Open repo <ExternalLink />
                  </a>
                </Button>
              ) : null}
              {validDemo ? (
                <Button type="button" variant="hud" size="sm" asChild>
                  <a href={validDemo} target="_blank" rel="noreferrer">
                    <Globe /> Open demo <ExternalLink />
                  </a>
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Close
              </Button>
              <Button type="submit" variant="mission" disabled={saving}>
                {saving ? "Saving…" : "Save details"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CustomProjectDialog({
  open,
  initial,
  onClose,
}: {
  open: boolean;
  initial: CustomProject | null;
  onClose: () => void;
}) {
  const [hydratedKey, setHydratedKey] = useState("");
  const [name, setName] = useState("");
  const [period, setPeriod] = useState("2027");
  const [description, setDescription] = useState("");
  const [deliverable, setDeliverable] = useState("");
  const [categoriesText, setCategoriesText] = useState("");
  const [techText, setTechText] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("Not started");
  const [progress, setProgress] = useState("0");
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const key = open ? (initial?.id ?? "new") : "";
  if (open && hydratedKey !== key) {
    setHydratedKey(key);
    if (initial) {
      setName(initial.name);
      setPeriod(initial.period);
      setDescription(initial.description);
      setDeliverable(initial.deliverable);
      setCategoriesText(initial.categories.join(", "));
      setTechText(initial.tech.join(", "));
      setStatus(initial.status);
      setProgress(String(initial.progress));
      setRepoUrl(initial.repoUrl);
      setDemoUrl(initial.demoUrl);
      setNotes(initial.notes);
    } else {
      setName("");
      setPeriod("2027");
      setDescription("");
      setDeliverable("");
      setCategoriesText("Full-Stack AI");
      setTechText("React, TypeScript, FastAPI");
      setStatus("Not started");
      setProgress("0");
      setRepoUrl("");
      setDemoUrl("");
      setNotes("");
    }
  }
  if (!open && hydratedKey !== "") setHydratedKey("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    if (repoUrl.trim() && !safeExternalUrl(repoUrl)) {
      toast.error("Invalid Repository URL");
      return;
    }
    if (demoUrl.trim() && !safeExternalUrl(demoUrl)) {
      toast.error("Invalid Demo URL");
      return;
    }
    const now = new Date().toISOString();
    const pct = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));
    const payload: CustomProject = {
      id: initial?.id ?? `proj-${crypto.randomUUID().slice(0, 8)}`,
      name: cleanName,
      period: period.trim() || "2027",
      description: description.trim(),
      categories: categoriesText
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      tech: techText
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      deliverable: deliverable.trim() || "Working full-stack app",
      status,
      progress: status === "Shipped" ? 100 : pct,
      repoUrl: repoUrl.trim() ? (safeExternalUrl(repoUrl) ?? "") : "",
      demoUrl: demoUrl.trim() ? (safeExternalUrl(demoUrl) ?? "") : "",
      notes: notes.trim(),
      weekIds: initial?.weekIds ?? [],
      createdAt: initial?.createdAt || now,
      updatedAt: now,
    };
    setSaving(true);
    const ok = await actions.saveCustomProject(payload);
    setSaving(false);
    if (!ok) toast.error("Saved locally — cloud sync failed");
    else toast.success(initial ? "Project updated" : "Project added", { description: cleanName });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <p className="hud-label text-primary-deep">Portfolio</p>
          <DialogTitle className="font-display text-xl font-bold">
            {initial ? "Edit custom project" : "Add portfolio project"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Project name *</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., AI SQL Analytics Copilot"
              className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Timeline / period</span>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="e.g., May 2027"
              className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Deliverable</span>
            <input
              type="text"
              value={deliverable}
              onChange={(e) => setDeliverable(e.target.value)}
              placeholder="e.g., Live app + eval suite"
              className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Description</span>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What problem does this product solve?"
              className="mt-1 w-full resize-y rounded-lg border bg-card p-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Status</span>
            <select
              value={status}
              onChange={(e) => {
                const next = e.target.value as ProjectStatus;
                setStatus(next);
                if (next === "Shipped") setProgress("100");
                if (next === "Not started") setProgress("0");
              }}
              className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Progress (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm tabular focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Categories (comma-separated)
            </span>
            <input
              type="text"
              value={categoriesText}
              onChange={(e) => setCategoriesText(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">
              Tech stack (comma-separated)
            </span>
            <input
              type="text"
              value={techText}
              onChange={(e) => setTechText(e.target.value)}
              className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">GitHub Repository URL</span>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repo"
              className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Live Demo URL</span>
            <input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://your-demo.example.com"
              className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">
              Build &amp; metric notes
            </span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full resize-y rounded-lg border bg-card p-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="mission" disabled={saving}>
              {saving ? "Saving…" : initial ? "Save changes" : "Add project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
