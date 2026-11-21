import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MILESTONES } from "@/data/roadmap";
import type { Week } from "@/data/types";
import { actions, useMission } from "@/lib/mission-store";
import { WEEK_PRIORITIES, type WeekPriority } from "@/lib/progress";

interface MissionEditorProps {
  open: boolean;
  initialWeek?: Week | null;
  defaultMilestoneId?: string | undefined;
  onClose: () => void;
  onSaved?: (weekId: string) => void;
}

export function MissionEditorDialog({
  open,
  initialWeek,
  defaultMilestoneId,
  onClose,
  onSaved,
}: MissionEditorProps) {
  const state = useMission();
  const [hydratedKey, setHydratedKey] = useState<string>("");

  const [milestoneId, setMilestoneId] = useState(defaultMilestoneId ?? MILESTONES[0]!.id);
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [deliverable, setDeliverable] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [hours, setHours] = useState("8");
  const [difficulty, setDifficulty] = useState("Custom");
  const [targetDate, setTargetDate] = useState("");
  const [priority, setPriority] = useState<WeekPriority>("Standard");
  const [coreItems, setCoreItems] = useState<string[]>([""]);
  const [stretchItems, setStretchItems] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const key = open ? (initialWeek?.id ?? `new:${defaultMilestoneId ?? ""}`) : "";
  if (open && hydratedKey !== key) {
    setHydratedKey(key);
    if (initialWeek) {
      const ws = state.weeks[initialWeek.id];
      setMilestoneId(initialWeek.milestoneId);
      setTitle(initialWeek.title);
      setObjective(initialWeek.objective ?? "");
      setDeliverable(initialWeek.deliverable);
      setTagsText(initialWeek.tags.join(", "));
      setHours(String(ws?.customHours ?? initialWeek.hours));
      setDifficulty(initialWeek.difficulty ?? "Custom");
      setTargetDate(ws?.targetDate ?? "");
      setPriority(ws?.priority ?? "Standard");
      const core = initialWeek.sections.flatMap((s) => s.tasks.map((t) => t.label));
      setCoreItems(core.length ? core : [""]);
      setStretchItems(initialWeek.stretch.map((t) => t.label));
    } else {
      setMilestoneId(defaultMilestoneId ?? MILESTONES[0]!.id);
      setTitle("");
      setObjective("");
      setDeliverable("");
      setTagsText("");
      setHours("8");
      setDifficulty("Custom");
      setTargetDate("");
      setPriority("Standard");
      setCoreItems([""]);
      setStretchItems([]);
    }
  }
  if (!open && hydratedKey !== "") {
    setHydratedKey("");
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const cleanDeliverable = deliverable.trim();
    const cleanCore = coreItems.map((c) => c.trim()).filter(Boolean);
    if (!cleanTitle || !cleanDeliverable || cleanCore.length === 0) {
      toast.error("Missing required fields", {
        description: "Add a title, at least one core task, and a deliverable.",
      });
      return;
    }

    const milestone = MILESTONES.find((m) => m.id === milestoneId) ?? MILESTONES[0]!;
    const id = initialWeek?.id ?? `custom-${crypto.randomUUID().slice(0, 8)}`;
    const existingTasks = initialWeek?.sections.flatMap((s) => s.tasks) ?? [];
    const existingStretch = initialWeek?.stretch ?? [];

    const coreTasks = cleanCore.map((label, i) => ({
      id: existingTasks[i]?.id ?? `${id}-c${i + 1}`,
      label,
    }));
    const stretchTasks = stretchItems
      .map((s) => s.trim())
      .filter(Boolean)
      .map((label, i) => ({
        id: existingStretch[i]?.id ?? `${id}-x${i + 1}`,
        label,
      }));

    const parsedHours = Math.max(1, Math.min(100, Math.round(Number(hours) || 8)));
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const shortMonth = milestone.label.split(" ")[0] ?? "CUSTOM";
    const week: Week = {
      id,
      phaseId: milestone.phaseId,
      milestoneId: milestone.id,
      label: initialWeek?.label ?? `${shortMonth} · CUSTOM`,
      kind: "mission",
      title: cleanTitle,
      tags: tags.length ? tags : ["Custom"],
      hours: parsedHours,
      sections: [{ id: `${id}-s1`, title: "Core tasks", tasks: coreTasks }],
      stretch: stretchTasks,
      deliverable: cleanDeliverable,
      ...(objective.trim() ? { objective: objective.trim() } : {}),
      ...(difficulty.trim() ? { difficulty: difficulty.trim() } : {}),
    };

    setSaving(true);
    const synced = await actions.saveCustomWeek(week, { targetDate, priority });
    setSaving(false);

    if (!synced) {
      toast.error("Saved locally — cloud sync failed", {
        description: "Check your connection and retry sync.",
      });
    } else {
      toast.success(initialWeek ? "Mission updated" : "Mission created", {
        description: cleanTitle,
      });
    }
    onClose();
    onSaved?.(id);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <p className="hud-label text-primary-deep">Weekly Mission</p>
          <DialogTitle className="font-display text-xl font-bold">
            {initialWeek ? "Edit custom mission" : "Create weekly mission"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Mission title *</span>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Build a FastAPI Streaming SSE Endpoint"
                className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Roadmap milestone</span>
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {MILESTONES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {m.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Priority</span>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as WeekPriority)}
                className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {WEEK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Target date</span>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Est. hours</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm tabular focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Difficulty</span>
                <input
                  type="text"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  placeholder="Core / Intermediate"
                  className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">
                Category tags (comma-separated)
              </span>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="FastAPI, Python, LLM Engineering"
                className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Mission objective</span>
              <textarea
                rows={2}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="What should you be able to build and explain by the end of this mission?"
                className="mt-1 w-full resize-y rounded-lg border bg-card p-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-muted-foreground">Final deliverable *</span>
              <input
                type="text"
                required
                value={deliverable}
                onChange={(e) => setDeliverable(e.target.value)}
                placeholder="e.g., Deployed service with unit tests and README write-up"
                className="mt-1 h-10 w-full rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>

          {/* Core tasks */}
          <div>
            <div className="flex items-center justify-between">
              <span className="hud-label !text-[9px]">Core tasks (required to complete) *</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCoreItems((items) => [...items, ""])}
              >
                <Plus /> Add task
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {coreItems.map((val, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    required={i === 0}
                    value={val}
                    onChange={(e) =>
                      setCoreItems((items) =>
                        items.map((x, idx) => (idx === i ? e.target.value : x)),
                      )
                    }
                    placeholder={`Core task ${i + 1}`}
                    className="h-9 flex-1 rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {coreItems.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove core task ${i + 1}`}
                      onClick={() => setCoreItems((items) => items.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="size-4 text-muted-foreground" />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Stretch tasks */}
          <div>
            <div className="flex items-center justify-between">
              <span className="hud-label !text-[9px]">Optional stretch tasks</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStretchItems((items) => [...items, ""])}
              >
                <Plus /> Add stretch
              </Button>
            </div>
            {stretchItems.length > 0 ? (
              <div className="mt-2 space-y-2">
                {stretchItems.map((val, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={val}
                      onChange={(e) =>
                        setStretchItems((items) =>
                          items.map((x, idx) => (idx === i ? e.target.value : x)),
                        )
                      }
                      placeholder={`Stretch task ${i + 1}`}
                      className="h-9 flex-1 rounded-lg border bg-card px-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove stretch task ${i + 1}`}
                      onClick={() =>
                        setStretchItems((items) => items.filter((_, idx) => idx !== i))
                      }
                    >
                      <Trash2 className="size-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="mission" disabled={saving}>
              {saving ? "Saving…" : initialWeek ? "Save changes" : "Create mission"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
