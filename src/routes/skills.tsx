import * as Collapsible from "@radix-ui/react-collapsible";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  Calendar,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
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
import { useMissionDrawer } from "@/components/vx/mission-drawer";
import { AnimatedNumber, PageHeader, TONE_CHIP, TONE_DOT } from "@/components/vx/primitives";
import { getWeek } from "@/data/roadmap";
import { SKILL_CATEGORIES, SKILL_LEVELS, skillKey, type SkillLevel } from "@/data/skills";
import { actions, useMission } from "@/lib/mission-store";
import { getMergedSkillCategories, type CustomSkill } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/skills")({
  head: () => ({
    meta: [
      { title: "Skill Matrix — VARMA 27" },
      {
        name: "description",
        content:
          "Fifteen Applied AI Engineering skill tracks, self-assessed from Not Started to Confident.",
      },
      { property: "og:title", content: "Skill Matrix — VARMA 27" },
      {
        property: "og:description",
        content:
          "Python, backend, LLMs, RAG, agents, production AI, cloud, DSA and career — honestly tracked.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Skills,
});

const LEVEL_STYLE = [
  "bg-surface text-muted-foreground border-border",
  "bg-cyan-soft text-cyan-ink border-cyan/30",
  "bg-violet-soft text-violet-ink border-violet/30",
  "bg-primary-soft text-primary-deep border-primary/25",
  "bg-lime text-ink border-lime-ink/25",
];

const RELATED_WEEK_BY_CATEGORY: Record<string, string> = {
  prog: "dec26-w1",
  backend: "feb27-w1",
  aiml: "dec26-w3",
  dl: "jan27-w4",
  llm: "mar27-w1",
  genai: "mar27-w4",
  vector: "apr27-w1",
  rag: "apr27-w2",
  agents: "may27-w1",
  prodai: "jun27-w1",
  security: "jun27-w2",
  cloud: "julaug27-w1",
  dsa: "sepnov27-w1",
  sysdesign: "julaug27-w5",
  career: "sepnov27-w8",
};

const TONE_GLOW: Record<string, string> = {
  orange: "",
  lime: "glow-lime",
  cyan: "glow-cyan",
  violet: "glow-violet",
  navy: "",
};

function Skills() {
  const state = useMission();
  const { openMission } = useMissionDrawer();
  const categories = getMergedSkillCategories(state);

  const [open, setOpen] = useState<string[]>(["prog"]);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<SkillLevel | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomSkill | null>(null);

  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState(SKILL_CATEGORIES[0]!.id);
  const [newLevel, setNewLevel] = useState<SkillLevel>(0);
  const [newTargetDate, setNewTargetDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [savingSkill, setSavingSkill] = useState(false);

  const all = categories.flatMap((c) => c.skills.map((s) => state.skills[skillKey(c.id, s)] ?? 0));
  const dist = SKILL_LEVELS.map((l) => all.filter((v) => v === l.level).length);
  const overallPct = all.length ? all.reduce<number>((a, b) => a + b, 0) / (all.length * 4) : 0;

  const normalizedQuery = query.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0 || levelFilter !== "all";
  const allExpanded = open.length === categories.length;

  const visibleCategories = useMemo(() => {
    return categories
      .map((c, idx) => {
        const skills = c.skills.filter((s) => {
          const v = (state.skills[skillKey(c.id, s)] ?? 0) as SkillLevel;
          if (levelFilter !== "all" && v !== levelFilter) return false;
          if (normalizedQuery) {
            return `${c.name} ${s}`.toLowerCase().includes(normalizedQuery);
          }
          return true;
        });
        return { category: c, idx, skills };
      })
      .filter((entry) => !isFiltering || entry.skills.length > 0);
  }, [categories, isFiltering, levelFilter, normalizedQuery, state.skills]);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newName.trim();
    if (!clean) return;
    const cat = categories.find((c) => c.id === newCategoryId);
    if (cat?.skills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      toast.error("Skill already exists", { description: `${clean} is already in ${cat.name}.` });
      return;
    }
    const item: CustomSkill = {
      id: `skill-${crypto.randomUUID().slice(0, 8)}`,
      categoryId: newCategoryId,
      name: clean,
      ...(newTargetDate ? { targetDate: newTargetDate } : {}),
      ...(newNotes.trim() ? { notes: newNotes.trim() } : {}),
    };
    setSavingSkill(true);
    const ok = await actions.saveCustomSkill(item, newLevel);
    setSavingSkill(false);
    if (!ok) {
      toast.error("Saved locally — cloud sync failed");
    } else {
      toast.success("Skill added", { description: `${clean} added to ${cat?.name ?? "track"}` });
    }
    if (!open.includes(newCategoryId)) setOpen((o) => [...o, newCategoryId]);
    setNewName("");
    setNewLevel(0);
    setNewTargetDate("");
    setNewNotes("");
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        code={`${categories.length} learning tracks`}
        title="SKILL MATRIX"
        description="Rate each skill yourself or add custom skills to track. Nothing is claimed automatically — a skill only moves when you move it."
        aside={
          <div className="panel-glass lift w-full p-4 lg:w-80">
            <div className="flex items-baseline justify-between">
              <p className="hud-label !text-[9px]">Distribution · {all.length} skills</p>
              <p className="font-display text-lg font-bold tabular text-primary-deep">
                <AnimatedNumber value={Math.round(overallPct * 100)} />%
              </p>
            </div>
            <div className="mt-2.5 flex h-3 overflow-hidden rounded-full bg-surface">
              {dist.map((n, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-full border-r border-card transition-[width] duration-700 ease-vx last:border-0",
                    LEVEL_STYLE[i]!.split(" ")[0],
                  )}
                  style={{ width: `${all.length ? (n / all.length) * 100 : 0}%` }}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
              {SKILL_LEVELS.map((l, i) => (
                <span
                  key={l.level}
                  className="flex items-center justify-between text-[11px] text-muted-foreground"
                >
                  <span className="flex items-center gap-1.5">
                    <span className={cn("size-2 rounded-full border", LEVEL_STYLE[i])} /> {l.label}
                  </span>
                  <span className="tabular font-medium">{dist[i]}</span>
                </span>
              ))}
            </div>
          </div>
        }
      />

      {/* Search, level filter, add skill & expand controls */}
      <div className="panel flex flex-col gap-3 p-3.5 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills or tracks…"
            aria-label="Search skill matrix"
            className="h-9 w-full rounded-lg border bg-background pl-9 pr-8 text-sm placeholder:text-subtle transition-[border-color,box-shadow] duration-200 hover:border-primary/35 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear skill search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-subtle hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex flex-wrap gap-1" role="group" aria-label="Filter skills by level">
            <button
              type="button"
              aria-pressed={levelFilter === "all"}
              onClick={() => setLevelFilter("all")}
              className={cn(
                "press h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors",
                levelFilter === "all"
                  ? "border-primary/30 bg-primary-soft text-primary-deep"
                  : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              All
            </button>
            {SKILL_LEVELS.map((l) => (
              <button
                key={l.level}
                type="button"
                aria-pressed={levelFilter === l.level}
                onClick={() => setLevelFilter(l.level)}
                className={cn(
                  "press h-8 rounded-lg border px-2.5 text-xs font-medium transition-colors",
                  levelFilter === l.level
                    ? LEVEL_STYLE[l.level]
                    : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
          <Button
            variant="hud"
            size="sm"
            onClick={() => setOpen(allExpanded ? [] : categories.map((c) => c.id))}
            className="ml-auto sm:ml-1"
          >
            {allExpanded ? <ChevronsDownUp /> : <ChevronsUpDown />}
            {allExpanded ? "Collapse" : "Expand"}
          </Button>
          <Button variant="mission" size="sm" onClick={() => setAddOpen(true)}>
            <Plus /> Add skill
          </Button>
        </div>
      </div>

      {visibleCategories.length === 0 ? (
        <div className="panel grid place-items-center p-10 text-center">
          <p className="font-display text-base font-semibold">No skills match your filter</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Clear your filter to view all {categories.length} engineering tracks.
          </p>
          <Button
            variant="soft"
            size="sm"
            className="mt-4"
            onClick={() => {
              setQuery("");
              setLevelFilter("all");
            }}
          >
            Reset filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
          {visibleCategories.map(({ category: c, idx, skills }) => {
            const vals = c.skills.map((s) => state.skills[skillKey(c.id, s)] ?? 0);
            const pct = vals.length
              ? vals.reduce<number>((a, b) => a + b, 0) / (vals.length * 4)
              : 0;
            const isOpen = isFiltering || open.includes(c.id);
            const relatedId = RELATED_WEEK_BY_CATEGORY[c.id];
            const relatedWeek = relatedId ? getWeek(relatedId) : undefined;

            return (
              <Collapsible.Root
                key={c.id}
                open={isOpen}
                onOpenChange={() =>
                  setOpen((o) => (o.includes(c.id) ? o.filter((x) => x !== c.id) : [...o, c.id]))
                }
                style={{ "--i": idx % 6 } as CSSProperties}
                className={cn(
                  "panel self-start overflow-hidden transition-[border-color,box-shadow,transform] duration-300 ease-vx",
                  "hover:border-primary/35 hover:shadow-hover",
                  TONE_GLOW[c.tone],
                  pct >= 1 && "border-lime-ink/30",
                )}
              >
                <Collapsible.Trigger className="group flex w-full cursor-pointer items-center gap-4 p-4 text-left transition-colors duration-200 hover:bg-surface/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary">
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-xl border font-display text-sm font-bold tabular transition-transform duration-300 ease-vx-spring group-hover:scale-105",
                      TONE_CHIP[c.tone],
                    )}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display font-semibold transition-colors duration-200 group-hover:text-primary-deep">
                      {c.name}
                    </span>
                    <span className="mt-1.5 flex gap-1">
                      {vals.map((v, i) => (
                        <span
                          key={i}
                          className="flex h-1.5 flex-1 gap-px overflow-hidden rounded-full bg-surface"
                        >
                          <span
                            className={cn(
                              "h-full rounded-full transition-[width] duration-500 ease-vx",
                              TONE_DOT[c.tone],
                            )}
                            style={{ width: `${(v / 4) * 100}%` }}
                          />
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="font-display text-sm font-bold tabular text-muted-foreground">
                    {Math.round(pct * 100)}%
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-subtle transition-[transform,color] duration-300 ease-vx group-hover:text-primary group-data-[state=open]:rotate-180" />
                </Collapsible.Trigger>
                <Collapsible.Content className="data-[state=open]:animate-collapse-down data-[state=closed]:animate-collapse-up">
                  {relatedWeek ? (
                    <div className="flex items-center justify-between gap-2 border-t bg-surface/50 px-4 py-2 text-xs">
                      <span className="truncate text-muted-foreground">
                        Linked mission:{" "}
                        <span className="font-medium text-foreground">{relatedWeek.title}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => openMission(relatedWeek.id)}
                        className="press inline-flex shrink-0 items-center gap-1 font-medium text-primary-deep hover:underline"
                      >
                        Open <ArrowUpRight className="size-3.5" />
                      </button>
                    </div>
                  ) : null}
                  <ul className="divide-y border-t">
                    {skills.map((s) => {
                      const key = skillKey(c.id, s);
                      const v = (state.skills[key] ?? 0) as SkillLevel;
                      const customMeta = state.customSkills.find(
                        (cs) => cs.categoryId === c.id && cs.name === s,
                      );
                      return (
                        <li
                          key={s}
                          className="p-4 transition-colors duration-200 hover:bg-surface/35"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <span className="text-sm font-medium">{s}</span>
                              {customMeta ? (
                                <span className="rounded bg-violet-soft px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-ink">
                                  Custom
                                </span>
                              ) : null}
                              {customMeta?.targetDate ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Calendar className="size-3 text-primary" />{" "}
                                  {customMeta.targetDate}
                                </span>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 items-center gap-1.5">
                              <span
                                className={cn(
                                  "rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                                  LEVEL_STYLE[v],
                                )}
                              >
                                {SKILL_LEVELS[v]!.label}
                              </span>
                              {customMeta ? (
                                <button
                                  type="button"
                                  aria-label={`Delete custom skill ${s}`}
                                  onClick={() => setDeleteTarget(customMeta)}
                                  className="press rounded p-1 text-subtle transition-colors hover:bg-surface hover:text-destructive"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                          {customMeta?.notes ? (
                            <p className="mt-1 text-xs text-muted-foreground">{customMeta.notes}</p>
                          ) : null}
                          <div
                            className="mt-2.5 grid grid-cols-2 gap-1.5 sm:grid-cols-5"
                            role="radiogroup"
                            aria-label={`${s} level`}
                          >
                            {SKILL_LEVELS.map((l) => (
                              <button
                                key={l.level}
                                type="button"
                                role="radio"
                                aria-checked={v === l.level}
                                aria-label={l.label}
                                title={l.label}
                                onClick={() => actions.setSkill(key, l.level)}
                                className={cn(
                                  "press flex min-h-10 cursor-pointer flex-col items-center justify-center rounded-lg border text-[10px] font-semibold uppercase leading-tight tracking-wide transition-[border-color,background-color,box-shadow,transform] duration-200 ease-vx",
                                  l.level <= v && v > 0
                                    ? LEVEL_STYLE[v]
                                    : "border-border bg-card text-subtle hover:-translate-y-px hover:border-primary/35 hover:text-foreground",
                                  v === l.level && "ring-2 ring-primary/20 shadow-panel",
                                )}
                              >
                                <span className="px-1.5 text-center">{l.label}</span>
                              </button>
                            ))}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Collapsible.Content>
              </Collapsible.Root>
            );
          })}
        </div>
      )}

      {/* Add custom skill modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <p className="hud-label text-primary-deep">Skill Matrix</p>
            <DialogTitle className="font-display text-xl font-bold">Add custom skill</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleAddSkill(e)} className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Skill name *</span>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Pydantic AI, Redis Streams, vLLM"
                className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Learning track</span>
              <select
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {SKILL_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Current level</span>
                <select
                  value={newLevel}
                  onChange={(e) => setNewLevel(Number(e.target.value) as SkillLevel)}
                  className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {SKILL_LEVELS.map((l) => (
                    <option key={l.level} value={l.level}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Target date</span>
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Notes</span>
              <textarea
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Resource link or benchmark goal…"
                className="mt-1 w-full resize-y rounded-lg border bg-card p-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="mission" disabled={savingSkill}>
                {savingSkill ? "Saving…" : "Add skill"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Remove custom skill?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes <strong>{deleteTarget?.name}</strong> and its saved rating.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleteTarget) return;
                const ok = await actions.deleteCustomSkill(deleteTarget);
                if (!ok) toast.error("Removed locally — cloud sync failed");
                else toast("Skill removed", { description: deleteTarget.name });
                setDeleteTarget(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
