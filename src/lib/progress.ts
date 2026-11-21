import type { AuditLevel } from "@/data/audit";
import { JOB_STATUSES, type JobStatus } from "@/data/habits";
import { PROJECTS, type Project } from "@/data/projects";
import { PHASES } from "@/data/roadmap";
import { SKILL_CATEGORIES, type SkillCategory, type SkillLevel } from "@/data/skills";
import type { Milestone, MissionTask, Phase, TaskSection, Week } from "@/data/types";

export const APP_TIMEZONE = "Asia/Kolkata";

export type WeekPriority = "Standard" | "High" | "Critical";

export const WEEK_PRIORITIES: readonly WeekPriority[] = ["Standard", "High", "Critical"] as const;

export type ProjectStatus = "Not started" | "In progress" | "Shipped";

export const PROJECT_STATUSES: readonly ProjectStatus[] = [
  "Not started",
  "In progress",
  "Shipped",
] as const;

export interface WeekState {
  tasks: Record<string, boolean>;
  deliverable: boolean;
  notes: string;
  reflection: string;
  completedAt?: string;
  targetDate?: string;
  priority?: WeekPriority;
  customHours?: number;
}

export interface ProjectMeta {
  demoUrl: string;
  repoUrl: string;
  notes: string;
}

export interface CustomSkill {
  id: string;
  categoryId: string;
  name: string;
  targetDate?: string;
  notes?: string;
}

export interface CustomProject {
  id: string;
  name: string;
  period: string;
  description: string;
  categories: string[];
  tech: string[];
  deliverable: string;
  status: ProjectStatus;
  progress: number;
  demoUrl: string;
  repoUrl: string;
  notes: string;
  weekIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  company: string;
  role: string;
  url: string;
  location: string;
  experience: string;
  salary: string;
  appliedOn: string;
  resume: string;
  status: JobStatus;
  round: string;
  recruiter: string;
  feedback: string;
  followUp: string;
}

export interface MissionState {
  version: 1;
  weeks: Record<string, WeekState>;
  customWeeks: Week[];
  audit: Record<string, { level?: AuditLevel; revised: boolean }>;
  skills: Record<string, SkillLevel>;
  customSkills: CustomSkill[];
  habitWeek: string;
  habits: Record<string, boolean[]>;
  habitHistory: Record<string, Record<string, boolean[]>>;
  dsa: { problems: number; sql: number };
  jobs: Job[];
  projects: Record<string, ProjectMeta>;
  customProjects: CustomProject[];
  dsaTopics: Record<string, boolean>;
  interviewTracks: Record<string, boolean>;
  completionHistory: Record<string, string>;
  clientUpdatedAt: number;
}

export const initialState = (): MissionState => ({
  version: 1,
  weeks: {},
  customWeeks: [],
  audit: {},
  skills: {},
  customSkills: [],
  habitWeek: "",
  habits: {},
  habitHistory: {},
  dsa: { problems: 0, sql: 0 },
  jobs: [],
  projects: {},
  customProjects: [],
  dsaTopics: {},
  interviewTracks: {},
  completionHistory: {},
  clientUpdatedAt: 0,
});

export const emptyWeekState = (): WeekState => ({
  tasks: {},
  deliverable: false,
  notes: "",
  reflection: "",
});

export const emptyProjectMeta = (): ProjectMeta => ({
  demoUrl: "",
  repoUrl: "",
  notes: "",
});

const VALID_AUDIT_LEVELS = new Set<AuditLevel>(["confident", "revision", "practice", "notdone"]);
const VALID_JOB_STATUSES = new Set<string>(JOB_STATUSES);
const VALID_PRIORITIES = new Set<string>(WEEK_PRIORITIES);
const VALID_PROJECT_STATUSES = new Set<string>(PROJECT_STATUSES);

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Returns YYYY-MM-DD in Asia/Kolkata regardless of browser/server timezone. */
export function kolkataDateKey(d = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value ?? "2026";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

/** Returns 0 = Monday .. 6 = Sunday in Asia/Kolkata. */
export function kolkataDayIndex(d = new Date()): number {
  const [y, m, dd] = kolkataDateKey(d).split("-").map(Number);
  const utcDay = new Date(Date.UTC(y!, m! - 1, dd!)).getUTCDay();
  return (utcDay + 6) % 7;
}

/** Monday calendar key (YYYY-MM-DD) in Asia/Kolkata — timezone & DST safe. */
export function habitWeekKey(d = new Date()): string {
  const [y, m, dd] = kolkataDateKey(d).split("-").map(Number);
  const utc = new Date(Date.UTC(y!, m! - 1, dd!));
  const offset = (utc.getUTCDay() + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - offset);
  const yy = utc.getUTCFullYear();
  const mm = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utc.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${day}`;
}

/** Validates and normalizes an external http(s) URL; returns null for empty or unsafe schemes. */
export function safeExternalUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const candidate = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (!parsed.hostname || !parsed.hostname.includes(".")) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function sanitizeTasks(raw: unknown): MissionTask[] {
  if (!Array.isArray(raw)) return [];
  const out: MissionTask[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const id = typeof item["id"] === "string" ? item["id"].trim() : "";
    const label = typeof item["label"] === "string" ? item["label"].trim() : "";
    if (id && label) out.push({ id, label });
  }
  return out;
}

function sanitizeSections(raw: unknown): TaskSection[] {
  if (!Array.isArray(raw)) return [];
  const out: TaskSection[] = [];
  for (const sec of raw) {
    if (!isRecord(sec)) continue;
    const id = typeof sec["id"] === "string" ? sec["id"].trim() : "";
    const title = typeof sec["title"] === "string" ? sec["title"].trim() : "";
    const tasks = sanitizeTasks(sec["tasks"]);
    if (id && title && tasks.length > 0) out.push({ id, title, tasks });
  }
  return out;
}

function sanitizeCustomWeek(entry: unknown): Week | null {
  if (!isRecord(entry)) return null;
  const id = typeof entry["id"] === "string" ? entry["id"].trim() : "";
  const phaseId = typeof entry["phaseId"] === "string" ? entry["phaseId"].trim() : "";
  const milestoneId = typeof entry["milestoneId"] === "string" ? entry["milestoneId"].trim() : "";
  const label = typeof entry["label"] === "string" ? entry["label"].trim() : "";
  const title = typeof entry["title"] === "string" ? entry["title"].trim() : "";
  const deliverable = typeof entry["deliverable"] === "string" ? entry["deliverable"].trim() : "";
  const sections = sanitizeSections(entry["sections"]);
  if (!id || !phaseId || !milestoneId || !title || !deliverable || sections.length === 0)
    return null;
  const hoursRaw = Number(entry["hours"]);
  const hours =
    Number.isFinite(hoursRaw) && hoursRaw >= 1 && hoursRaw <= 100 ? Math.round(hoursRaw) : 8;
  const tags = Array.isArray(entry["tags"])
    ? entry["tags"]
        .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
        .map((t) => t.trim())
    : [];
  const week: Week = {
    id,
    phaseId,
    milestoneId,
    label: label || "CUSTOM · MISSION",
    kind: "mission",
    title,
    tags,
    hours,
    sections,
    stretch: sanitizeTasks(entry["stretch"]),
    deliverable,
  };
  if (typeof entry["objective"] === "string" && entry["objective"].trim()) {
    week.objective = entry["objective"].trim();
  }
  if (typeof entry["difficulty"] === "string" && entry["difficulty"].trim()) {
    week.difficulty = entry["difficulty"].trim();
  }
  return week;
}

/** Safely reconstructs a valid MissionState from untrusted / persisted JSON. */
export function sanitizeState(raw: unknown): MissionState {
  const base = initialState();
  if (!isRecord(raw)) return base;

  if (isRecord(raw["weeks"])) {
    for (const [id, entry] of Object.entries(raw["weeks"])) {
      if (!isRecord(entry)) continue;
      const tasks: Record<string, boolean> = {};
      if (isRecord(entry["tasks"])) {
        for (const [tid, val] of Object.entries(entry["tasks"])) {
          if (typeof val === "boolean") tasks[tid] = val;
        }
      }
      const ws: WeekState = {
        tasks,
        deliverable: Boolean(entry["deliverable"]),
        notes: typeof entry["notes"] === "string" ? entry["notes"] : "",
        reflection: typeof entry["reflection"] === "string" ? entry["reflection"] : "",
      };
      if (typeof entry["completedAt"] === "string" && entry["completedAt"].trim()) {
        ws.completedAt = entry["completedAt"];
      }
      if (typeof entry["targetDate"] === "string" && entry["targetDate"].trim()) {
        ws.targetDate = entry["targetDate"];
      }
      if (typeof entry["priority"] === "string" && VALID_PRIORITIES.has(entry["priority"])) {
        ws.priority = entry["priority"] as WeekPriority;
      }
      if (
        typeof entry["customHours"] === "number" &&
        Number.isFinite(entry["customHours"]) &&
        entry["customHours"] >= 1 &&
        entry["customHours"] <= 100
      ) {
        ws.customHours = Math.round(entry["customHours"]);
      }
      base.weeks[id] = ws;
    }
  }

  if (Array.isArray(raw["customWeeks"])) {
    const seen = new Set<string>();
    for (const entry of raw["customWeeks"]) {
      const w = sanitizeCustomWeek(entry);
      if (w && !seen.has(w.id)) {
        seen.add(w.id);
        base.customWeeks.push(w);
      }
    }
  }

  if (isRecord(raw["audit"])) {
    for (const [id, entry] of Object.entries(raw["audit"])) {
      if (!isRecord(entry)) continue;
      const revised = Boolean(entry["revised"]);
      const lvl = entry["level"];
      if (typeof lvl === "string" && VALID_AUDIT_LEVELS.has(lvl as AuditLevel)) {
        base.audit[id] = { level: lvl as AuditLevel, revised };
      } else {
        base.audit[id] = { revised };
      }
    }
  }

  if (isRecord(raw["skills"])) {
    for (const [key, val] of Object.entries(raw["skills"])) {
      if (typeof val === "number" && Number.isInteger(val) && val >= 0 && val <= 4) {
        base.skills[key] = val as SkillLevel;
      }
    }
  }

  if (Array.isArray(raw["customSkills"])) {
    const seen = new Set<string>();
    for (const entry of raw["customSkills"]) {
      if (!isRecord(entry)) continue;
      const id = typeof entry["id"] === "string" ? entry["id"].trim() : "";
      const categoryId = typeof entry["categoryId"] === "string" ? entry["categoryId"].trim() : "";
      const name = typeof entry["name"] === "string" ? entry["name"].trim() : "";
      if (!id || !categoryId || !name || seen.has(id)) continue;
      seen.add(id);
      const item: CustomSkill = { id, categoryId, name };
      if (typeof entry["targetDate"] === "string" && entry["targetDate"].trim()) {
        item.targetDate = entry["targetDate"].trim();
      }
      if (typeof entry["notes"] === "string" && entry["notes"].trim()) {
        item.notes = entry["notes"].trim();
      }
      base.customSkills.push(item);
    }
  }

  if (typeof raw["habitWeek"] === "string") {
    base.habitWeek = raw["habitWeek"];
  }

  if (isRecord(raw["habits"])) {
    for (const [id, row] of Object.entries(raw["habits"])) {
      if (!Array.isArray(row)) continue;
      base.habits[id] = Array.from({ length: 7 }, (_, i) => Boolean(row[i]));
    }
  }

  if (isRecord(raw["habitHistory"])) {
    for (const [wk, map] of Object.entries(raw["habitHistory"])) {
      if (!isRecord(map)) continue;
      const weekHabits: Record<string, boolean[]> = {};
      for (const [hid, row] of Object.entries(map)) {
        if (Array.isArray(row)) {
          weekHabits[hid] = Array.from({ length: 7 }, (_, i) => Boolean(row[i]));
        }
      }
      base.habitHistory[wk] = weekHabits;
    }
  }

  if (isRecord(raw["dsa"])) {
    const problems = Number(raw["dsa"]["problems"]);
    const sql = Number(raw["dsa"]["sql"]);
    base.dsa = {
      problems: Number.isFinite(problems) && problems > 0 ? Math.floor(problems) : 0,
      sql: Number.isFinite(sql) && sql > 0 ? Math.floor(sql) : 0,
    };
  }

  if (Array.isArray(raw["jobs"])) {
    for (const entry of raw["jobs"]) {
      if (!isRecord(entry)) continue;
      const id = typeof entry["id"] === "string" && entry["id"].trim() ? entry["id"] : "";
      const company = typeof entry["company"] === "string" ? entry["company"].trim() : "";
      if (!id || !company) continue;
      const statusRaw = typeof entry["status"] === "string" ? entry["status"] : "Saved";
      base.jobs.push({
        id,
        company,
        role: typeof entry["role"] === "string" ? entry["role"] : "",
        url: typeof entry["url"] === "string" ? entry["url"] : "",
        location: typeof entry["location"] === "string" ? entry["location"] : "",
        experience: typeof entry["experience"] === "string" ? entry["experience"] : "",
        salary: typeof entry["salary"] === "string" ? entry["salary"] : "",
        appliedOn: typeof entry["appliedOn"] === "string" ? entry["appliedOn"] : "",
        resume: typeof entry["resume"] === "string" ? entry["resume"] : "",
        status: (VALID_JOB_STATUSES.has(statusRaw) ? statusRaw : "Saved") as JobStatus,
        round: typeof entry["round"] === "string" ? entry["round"] : "",
        recruiter: typeof entry["recruiter"] === "string" ? entry["recruiter"] : "",
        feedback: typeof entry["feedback"] === "string" ? entry["feedback"] : "",
        followUp: typeof entry["followUp"] === "string" ? entry["followUp"] : "",
      });
    }
  }

  if (isRecord(raw["projects"])) {
    for (const [id, entry] of Object.entries(raw["projects"])) {
      if (!isRecord(entry)) continue;
      base.projects[id] = {
        demoUrl: typeof entry["demoUrl"] === "string" ? entry["demoUrl"] : "",
        repoUrl: typeof entry["repoUrl"] === "string" ? entry["repoUrl"] : "",
        notes: typeof entry["notes"] === "string" ? entry["notes"] : "",
      };
    }
  }

  if (Array.isArray(raw["customProjects"])) {
    const seen = new Set<string>();
    for (const entry of raw["customProjects"]) {
      if (!isRecord(entry)) continue;
      const id = typeof entry["id"] === "string" ? entry["id"].trim() : "";
      const name = typeof entry["name"] === "string" ? entry["name"].trim() : "";
      if (!id || !name || seen.has(id)) continue;
      seen.add(id);
      const statusRaw = typeof entry["status"] === "string" ? entry["status"] : "Not started";
      const progressRaw = Number(entry["progress"]);
      const progress = Number.isFinite(progressRaw)
        ? Math.max(0, Math.min(100, Math.round(progressRaw)))
        : 0;
      const toList = (v: unknown) =>
        Array.isArray(v)
          ? v
              .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
              .map((x) => x.trim())
          : [];
      base.customProjects.push({
        id,
        name,
        period: typeof entry["period"] === "string" ? entry["period"] : "2027",
        description: typeof entry["description"] === "string" ? entry["description"] : "",
        categories: toList(entry["categories"]),
        tech: toList(entry["tech"]),
        deliverable: typeof entry["deliverable"] === "string" ? entry["deliverable"] : "",
        status: (VALID_PROJECT_STATUSES.has(statusRaw)
          ? statusRaw
          : "Not started") as ProjectStatus,
        progress,
        demoUrl: typeof entry["demoUrl"] === "string" ? entry["demoUrl"] : "",
        repoUrl: typeof entry["repoUrl"] === "string" ? entry["repoUrl"] : "",
        notes: typeof entry["notes"] === "string" ? entry["notes"] : "",
        weekIds: toList(entry["weekIds"]),
        createdAt: typeof entry["createdAt"] === "string" ? entry["createdAt"] : "",
        updatedAt: typeof entry["updatedAt"] === "string" ? entry["updatedAt"] : "",
      });
    }
  }

  if (isRecord(raw["dsaTopics"])) {
    for (const [topic, val] of Object.entries(raw["dsaTopics"])) {
      if (typeof val === "boolean") base.dsaTopics[topic] = val;
    }
  }

  if (isRecord(raw["interviewTracks"])) {
    for (const [track, val] of Object.entries(raw["interviewTracks"])) {
      if (typeof val === "boolean") base.interviewTracks[track] = val;
    }
  }

  if (isRecord(raw["completionHistory"])) {
    for (const [wid, dateStr] of Object.entries(raw["completionHistory"])) {
      if (typeof dateStr === "string" && dateStr.trim()) {
        base.completionHistory[wid] = dateStr.trim();
      }
    }
  }

  if (typeof raw["clientUpdatedAt"] === "number" && Number.isFinite(raw["clientUpdatedAt"])) {
    base.clientUpdatedAt = raw["clientUpdatedAt"];
  }

  return base;
}

/** True when the state contains any real user progress, custom records, or notes. */
export function hasMeaningfulState(s: MissionState): boolean {
  if (s.customWeeks.length > 0 || s.customSkills.length > 0 || s.customProjects.length > 0)
    return true;
  if (s.jobs.length > 0 || s.dsa.problems > 0 || s.dsa.sql > 0) return true;
  if (Object.values(s.dsaTopics).some(Boolean) || Object.values(s.interviewTracks).some(Boolean))
    return true;
  if (Object.values(s.skills).some((v) => v > 0)) return true;
  if (Object.values(s.audit).some((a) => Boolean(a.level) || a.revised)) return true;
  if (Object.values(s.habits).some((row) => row.some(Boolean))) return true;
  if (Object.keys(s.habitHistory).length > 0) return true;
  if (Object.values(s.projects).some((p) => Boolean(p.demoUrl || p.repoUrl || p.notes.trim())))
    return true;
  if (
    Object.values(s.weeks).some(
      (ws) =>
        Boolean(ws.completedAt) ||
        ws.deliverable ||
        Boolean(ws.targetDate) ||
        Boolean(ws.priority) ||
        Boolean(ws.customHours) ||
        ws.notes.trim().length > 0 ||
        ws.reflection.trim().length > 0 ||
        Object.values(ws.tasks).some(Boolean),
    )
  ) {
    return true;
  }
  return false;
}

/* ---------- Single Source of Truth Selectors (Built-in + User Custom Records) ---------- */

export function getMergedPhases(state: MissionState): Phase[] {
  if (state.customWeeks.length === 0) return PHASES;
  return PHASES.map((phase) => ({
    ...phase,
    milestones: phase.milestones.map((m) => {
      const extras = state.customWeeks.filter((w) => w.milestoneId === m.id);
      if (extras.length === 0) return m;
      const firstBufferIdx = m.weeks.findIndex((w) => w.kind === "buffer");
      if (firstBufferIdx === -1) return { ...m, weeks: [...m.weeks, ...extras] };
      return {
        ...m,
        weeks: [...m.weeks.slice(0, firstBufferIdx), ...extras, ...m.weeks.slice(firstBufferIdx)],
      };
    }),
  }));
}

export function getMergedMilestones(state: MissionState): Milestone[] {
  return getMergedPhases(state).flatMap((p) => p.milestones);
}

export function getAllWeeks(state: MissionState): Week[] {
  return getMergedMilestones(state).flatMap((m) => m.weeks);
}

export function getWeekById(state: MissionState, id: string): Week | undefined {
  return getAllWeeks(state).find((w) => w.id === id);
}

export function isCustomWeek(state: MissionState, id: string): boolean {
  return state.customWeeks.some((w) => w.id === id);
}

export function getMergedSkillCategories(state: MissionState): SkillCategory[] {
  if (state.customSkills.length === 0) return SKILL_CATEGORIES;
  return SKILL_CATEGORIES.map((c) => {
    const extras = state.customSkills
      .filter((s) => s.categoryId === c.id && !c.skills.includes(s.name))
      .map((s) => s.name);
    return extras.length ? { ...c, skills: [...c.skills, ...extras] } : c;
  });
}

export type UnifiedProject = Project & {
  custom?: CustomProject;
};

export function getMergedProjects(state: MissionState): UnifiedProject[] {
  if (state.customProjects.length === 0) return PROJECTS;
  const extras: UnifiedProject[] = state.customProjects.map((cp) => ({
    id: cp.id,
    name: cp.name,
    period: cp.period,
    description: cp.description,
    categories: cp.categories,
    tech: cp.tech,
    deliverable: cp.deliverable,
    weekIds: cp.weekIds,
    custom: cp,
  }));
  return [...PROJECTS, ...extras];
}

export function computeProjectStatus(p: UnifiedProject, state: MissionState) {
  if (p.custom) {
    if (p.custom.weekIds.length > 0) {
      const done = p.custom.weekIds.filter((id) => state.weeks[id]?.completedAt).length;
      const pct = done / p.custom.weekIds.length;
      const status: ProjectStatus =
        pct >= 1 ? "Shipped" : done > 0 || p.custom.progress > 0 ? "In progress" : p.custom.status;
      return { pct, status, done, total: p.custom.weekIds.length };
    }
    const pct = p.custom.status === "Shipped" ? 1 : p.custom.progress / 100;
    return { pct, status: p.custom.status, done: Math.round(pct * 100), total: 100 };
  }
  const done = p.weekIds.filter((id) => state.weeks[id]?.completedAt).length;
  const started = p.weekIds.some((id) => {
    const ws = state.weeks[id];
    return ws && (ws.completedAt || Object.values(ws.tasks).some(Boolean));
  });
  const pct = p.weekIds.length ? done / p.weekIds.length : 0;
  const status: ProjectStatus = pct >= 1 ? "Shipped" : started ? "In progress" : "Not started";
  return { pct, status, done, total: p.weekIds.length };
}

export const coreTaskIds = (w: Week) => w.sections.flatMap((s) => s.tasks.map((t) => t.id));

export type WeekStatus = "upcoming" | "in-progress" | "completed" | "buffer";

export function weekStatus(w: Week, ws: WeekState | undefined): WeekStatus {
  if (w.kind === "buffer") return "buffer";
  if (ws?.completedAt) return "completed";
  if (
    ws &&
    (Object.values(ws.tasks).some(Boolean) ||
      ws.deliverable ||
      ws.notes.trim() ||
      ws.reflection.trim())
  ) {
    return "in-progress";
  }
  return "upcoming";
}

export function isWeekOverdue(
  w: Week,
  ws: WeekState | undefined,
  todayKey = kolkataDateKey(),
): boolean {
  if (w.kind === "buffer" || ws?.completedAt || !ws?.targetDate) return false;
  return ws.targetDate < todayKey;
}

export interface WeekProgress {
  coreDone: number;
  coreTotal: number;
  stretchDone: number;
  stretchTotal: number;
  /** 0–1, core tasks + deliverable only — stretch never counts. */
  ratio: number;
}

export function weekProgress(w: Week, ws: WeekState | undefined): WeekProgress {
  const core = coreTaskIds(w);
  const coreDone = core.filter((id) => ws?.tasks[id]).length;
  const stretchDone = w.stretch.filter((t) => ws?.tasks[t.id]).length;
  const units = core.length + 1;
  const done = coreDone + (ws?.deliverable ? 1 : 0);
  return {
    coreDone,
    coreTotal: core.length,
    stretchDone,
    stretchTotal: w.stretch.length,
    ratio: w.kind === "buffer" ? 0 : ws?.completedAt ? 1 : done / units,
  };
}

export interface CompletionCheck {
  ok: boolean;
  missingCore: number;
  missingDeliverable: boolean;
  alreadyCompleted: boolean;
}

/** A week completes only with every core task + the deliverable confirmed. Stretch tasks never block. */
export function canCompleteWeek(w: Week, ws: WeekState | undefined): CompletionCheck {
  const core = coreTaskIds(w);
  const missingCore = core.filter((id) => !ws?.tasks[id]).length;
  const missingDeliverable = !ws?.deliverable;
  const alreadyCompleted = Boolean(ws?.completedAt);
  return {
    ok: w.kind === "mission" && missingCore === 0 && !missingDeliverable && !alreadyCompleted,
    missingCore,
    missingDeliverable,
    alreadyCompleted,
  };
}

/** Buffer weeks are skipped: they never break nor extend a streak. */
export function computeStreaks(weeks: Week[], state: Record<string, WeekState>) {
  const seq = weeks.filter((w) => w.kind === "mission");
  let best = 0;
  let run = 0;
  for (const w of seq) {
    if (state[w.id]?.completedAt) {
      run += 1;
      best = Math.max(best, run);
    } else run = 0;
  }
  let lastIdx = -1;
  seq.forEach((w, i) => {
    if (state[w.id]?.completedAt) lastIdx = i;
  });
  let current = 0;
  for (let i = lastIdx; i >= 0; i--) {
    if (state[seq[i]!.id]?.completedAt) current += 1;
    else break;
  }
  return { current, best };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  tone: "orange" | "lime" | "cyan" | "violet";
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-mission",
    name: "First Mission",
    description: "Complete your first weekly mission.",
    tone: "orange",
  },
  {
    id: "consistency",
    name: "Consistency",
    description: "Complete three consecutive missions.",
    tone: "cyan",
  },
  {
    id: "momentum",
    name: "Momentum",
    description: "Complete five consecutive missions.",
    tone: "violet",
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Complete ten consecutive missions.",
    tone: "lime",
  },
  {
    id: "foundation-ready",
    name: "Foundation Ready",
    description: "Assess every foundation audit topic.",
    tone: "cyan",
  },
  {
    id: "ai-builder",
    name: "AI Builder",
    description: "Ship your first AI project (January Week 06).",
    tone: "orange",
  },
  {
    id: "ship-it",
    name: "Ship It",
    description: "Deploy the capstone (August Week 07).",
    tone: "lime",
  },
];

export const AI_BUILDER_WEEK = "jan27-w6";
export const SHIP_IT_WEEK = "julaug27-w7";

export function unlockedAchievements(
  weeks: Week[],
  state: MissionState,
  auditItemIds: string[],
): Set<string> {
  const set = new Set<string>();
  const completed = weeks.filter(
    (w) => w.kind === "mission" && state.weeks[w.id]?.completedAt,
  ).length;
  const { best } = computeStreaks(weeks, state.weeks);
  if (completed >= 1) set.add("first-mission");
  if (best >= 3) set.add("consistency");
  if (best >= 5) set.add("momentum");
  if (best >= 10) set.add("unstoppable");
  if (auditItemIds.length > 0 && auditItemIds.every((id) => state.audit[id]?.level)) {
    set.add("foundation-ready");
  }
  if (state.weeks[AI_BUILDER_WEEK]?.completedAt) set.add("ai-builder");
  if (state.weeks[SHIP_IT_WEEK]?.completedAt) set.add("ship-it");
  return set;
}

export interface AchievementProgressInfo {
  current: number;
  target: number;
  label: string;
}

export function achievementProgress(
  weeks: Week[],
  state: MissionState,
  auditItemIds: string[],
): Record<string, AchievementProgressInfo> {
  const completed = weeks.filter(
    (w) => w.kind === "mission" && state.weeks[w.id]?.completedAt,
  ).length;
  const { best } = computeStreaks(weeks, state.weeks);
  const assessed = auditItemIds.filter((id) => Boolean(state.audit[id]?.level)).length;
  const aiWeek = weeks.find((w) => w.id === AI_BUILDER_WEEK);
  const shipWeek = weeks.find((w) => w.id === SHIP_IT_WEEK);
  const aiRatio = aiWeek
    ? Math.round(weekProgress(aiWeek, state.weeks[AI_BUILDER_WEEK]).ratio * 100)
    : 0;
  const shipRatio = shipWeek
    ? Math.round(weekProgress(shipWeek, state.weeks[SHIP_IT_WEEK]).ratio * 100)
    : 0;

  return {
    "first-mission": {
      current: Math.min(1, completed),
      target: 1,
      label: `${Math.min(1, completed)}/1 mission`,
    },
    consistency: {
      current: Math.min(3, best),
      target: 3,
      label: `${Math.min(3, best)}/3 streak`,
    },
    momentum: {
      current: Math.min(5, best),
      target: 5,
      label: `${Math.min(5, best)}/5 streak`,
    },
    unstoppable: {
      current: Math.min(10, best),
      target: 10,
      label: `${Math.min(10, best)}/10 streak`,
    },
    "foundation-ready": {
      current: assessed,
      target: Math.max(1, auditItemIds.length),
      label: `${assessed}/${auditItemIds.length} assessed`,
    },
    "ai-builder": {
      current: aiRatio,
      target: 100,
      label: `${aiRatio}% of Jan W06`,
    },
    "ship-it": {
      current: shipRatio,
      target: 100,
      label: `${shipRatio}% of Aug W07`,
    },
  };
}

export function milestoneCleared(m: Milestone, state: Record<string, WeekState>) {
  const missions = m.weeks.filter((w) => w.kind === "mission");
  return missions.length > 0 && missions.every((w) => state[w.id]?.completedAt);
}

export function effectiveWeekHours(w: Week, ws: WeekState | undefined): number {
  return ws?.customHours ?? w.hours;
}

export function computeStats(weeks: Week[], state: MissionState) {
  const missions = weeks.filter((w) => w.kind === "mission");
  const completedWeeks = missions.filter((w) => state.weeks[w.id]?.completedAt).length;
  let tasksDone = 0;
  let tasksTotal = 0;
  let hours = 0;
  for (const w of missions) {
    const ws = state.weeks[w.id];
    const p = weekProgress(w, ws);
    tasksDone += p.coreDone + p.stretchDone;
    tasksTotal += p.coreTotal;
    hours += effectiveWeekHours(w, ws) * (p.coreTotal ? p.coreDone / p.coreTotal : 0);
  }
  const { current, best } = computeStreaks(weeks, state.weeks);
  return {
    completedWeeks,
    pendingWeeks: missions.length - completedWeeks,
    totalWeeks: missions.length,
    completion: missions.length ? completedWeeks / missions.length : 0,
    tasksDone,
    tasksTotal,
    hours: Math.round(hours * 10) / 10,
    currentStreak: current,
    bestStreak: best,
    nextMission: missions.find((w) => !state.weeks[w.id]?.completedAt),
  };
}
