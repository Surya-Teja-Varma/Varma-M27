import { useSyncExternalStore } from "react";

import { AUDIT_ITEMS, type AuditLevel } from "@/data/audit";
import type { SkillLevel } from "@/data/skills";
import type { Week } from "@/data/types";

import { isFirebaseConfigured } from "./firebase";
import {
  describeFirebaseError,
  fetchCloudMissionState,
  saveCloudMissionState,
  signInGoogleAccount,
  signOutAccount,
  subscribeAuth,
  subscribeCloudMissionState,
  upsertUserProfile,
  type CloudUser,
} from "./firebase-service";
import {
  canCompleteWeek,
  emptyProjectMeta,
  emptyWeekState,
  getAllWeeks,
  getWeekById,
  habitWeekKey,
  hasMeaningfulState,
  initialState,
  kolkataDateKey,
  sanitizeState,
  unlockedAchievements,
  type CustomProject,
  type CustomSkill,
  type Job,
  type MissionState,
  type ProjectMeta,
  type WeekPriority,
  type WeekState,
} from "./progress";

const KEY = "varma-27:v1";
const LEGACY_KEY = "varmax-mission-2027:v1";
const SERVER_STATE = initialState();

export type CloudSyncStatus = "local" | "loading" | "syncing" | "synced" | "offline" | "error";

export interface CloudSyncState {
  configured: boolean;
  authReady: boolean;
  user: CloudUser | null;
  status: CloudSyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
}

const SERVER_SYNC: CloudSyncState = {
  configured: false,
  authReady: false,
  user: null,
  status: "local",
  lastSyncedAt: null,
  error: null,
};

let state: MissionState = SERVER_STATE;
let syncState: CloudSyncState = SERVER_SYNC;

let loaded = false;
let initialized = false;
let unsubscribeDoc: (() => void) | null = null;
let debounceTimer: number | null = null;
let writeChain: Promise<boolean> = Promise.resolve(true);

const listeners = new Set<() => void>();
const syncListeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function notifySync() {
  syncListeners.forEach((l) => l());
}

function patchSync(patch: Partial<CloudSyncState>) {
  syncState = { ...syncState, ...patch };
  notifySync();
}

function readFromStorage(): MissionState {
  try {
    const raw = window.localStorage.getItem(KEY) ?? window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return initialState();
    return sanitizeState(JSON.parse(raw));
  } catch {
    return initialState();
  }
}

function writeToStorage(next: MissionState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — keep in memory */
  }
}

function enqueueCloudWrite(snapshot: MissionState): Promise<boolean> {
  const uid = syncState.user?.uid;
  if (!uid) return Promise.resolve(true);
  patchSync({ status: "syncing", error: null });
  writeChain = writeChain.then(async () => {
    if (syncState.user?.uid !== uid) return false;
    try {
      await saveCloudMissionState(uid, snapshot);
      if (syncState.user?.uid === uid) {
        patchSync({ status: "synced", lastSyncedAt: Date.now(), error: null });
      }
      return true;
    } catch (err) {
      const msg = describeFirebaseError(err);
      if (syncState.user?.uid === uid) {
        patchSync({
          status: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error",
          error: msg,
        });
      }
      return false;
    }
  });
  return writeChain;
}

function scheduleCloudWrite(snapshot: MissionState, immediate: boolean): Promise<boolean> {
  if (!syncState.user) return Promise.resolve(true);
  if (debounceTimer !== null && typeof window !== "undefined") {
    window.clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (immediate) return enqueueCloudWrite(snapshot);
  return new Promise((resolve) => {
    debounceTimer = window.setTimeout(() => {
      debounceTimer = null;
      void enqueueCloudWrite(state).then(resolve);
    }, 450);
  });
}

async function attachCloudUser(user: CloudUser) {
  if (unsubscribeDoc) {
    unsubscribeDoc();
    unsubscribeDoc = null;
  }
  patchSync({ user, authReady: true, status: "loading", error: null });

  void upsertUserProfile(user).catch(() => {
    /* non-blocking profile metadata refresh */
  });

  try {
    const remote = await fetchCloudMissionState(user.uid);
    if (syncState.user?.uid !== user.uid) return;

    if (remote) {
      state = remote;
      writeToStorage(state);
      notify();
      patchSync({ status: "synced", lastSyncedAt: Date.now(), error: null });
    } else if (hasMeaningfulState(state)) {
      // First sign-in with local progress: migrate local state cleanly to Firestore without loss.
      const stamped: MissionState = { ...state, clientUpdatedAt: Date.now() };
      state = stamped;
      writeToStorage(state);
      await saveCloudMissionState(user.uid, stamped);
      if (syncState.user?.uid !== user.uid) return;
      patchSync({ status: "synced", lastSyncedAt: Date.now(), error: null });
    } else {
      patchSync({ status: "synced", lastSyncedAt: Date.now(), error: null });
    }

    // Attach real-time Firestore listener for multi-device / multi-tab instant updates.
    unsubscribeDoc = subscribeCloudMissionState(
      user.uid,
      (incoming, fromCache) => {
        if (syncState.user?.uid !== user.uid) return;
        if (incoming) {
          if (incoming.clientUpdatedAt >= state.clientUpdatedAt || !hasMeaningfulState(state)) {
            state = incoming;
            writeToStorage(state);
            notify();
          }
        }
        patchSync({
          status:
            fromCache && typeof navigator !== "undefined" && !navigator.onLine
              ? "offline"
              : "synced",
          lastSyncedAt: Date.now(),
          error: null,
        });
      },
      (err) => {
        if (syncState.user?.uid !== user.uid) return;
        patchSync({ status: "error", error: describeFirebaseError(err) });
      },
    );
  } catch (err) {
    if (syncState.user?.uid !== user.uid) return;
    patchSync({
      status: typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error",
      error: describeFirebaseError(err),
    });
  }
}

function detachCloudUser() {
  if (debounceTimer !== null && typeof window !== "undefined") {
    window.clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  if (unsubscribeDoc) {
    unsubscribeDoc();
    unsubscribeDoc = null;
  }
  patchSync({
    user: null,
    authReady: true,
    status: "local",
    error: null,
  });
}

function ensureInitialized() {
  if (typeof window === "undefined") return;
  if (!loaded) {
    loaded = true;
    state = readFromStorage();
  }
  if (initialized) return;
  initialized = true;

  const configured = isFirebaseConfigured();
  syncState = {
    configured,
    authReady: !configured,
    user: null,
    status: "local",
    lastSyncedAt: null,
    error: null,
  };

  window.addEventListener("storage", (e) => {
    if (e.key !== KEY && e.key !== null) return;
    if (syncState.user) return; // Firestore listener owns cross-tab sync when signed in
    state = readFromStorage();
    notify();
  });

  window.addEventListener("online", () => {
    if (syncState.user && (syncState.status === "offline" || syncState.status === "error")) {
      void enqueueCloudWrite(state);
    }
  });

  window.addEventListener("offline", () => {
    if (syncState.user) {
      patchSync({ status: "offline" });
    }
  });

  if (configured) {
    subscribeAuth((user) => {
      if (user) {
        if (syncState.user?.uid === user.uid && unsubscribeDoc) return;
        void attachCloudUser(user);
      } else {
        detachCloudUser();
      }
    });
  }
}

function commit(next: MissionState, immediate = true): Promise<boolean> {
  const stamped: MissionState = { ...next, clientUpdatedAt: Date.now() };
  state = stamped;
  writeToStorage(stamped);
  notify();
  return scheduleCloudWrite(stamped, immediate);
}

function subscribe(l: () => void) {
  ensureInitialized();
  listeners.add(l);
  return () => listeners.delete(l);
}

function subscribeSync(l: () => void) {
  ensureInitialized();
  syncListeners.add(l);
  return () => syncListeners.delete(l);
}

export function useMission(): MissionState {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureInitialized();
      return state;
    },
    () => SERVER_STATE,
  );
}

export function useCloudSync(): CloudSyncState {
  return useSyncExternalStore(
    subscribeSync,
    () => {
      ensureInitialized();
      return syncState;
    },
    () => SERVER_SYNC,
  );
}

const getWeekState = (id: string): WeekState => state.weeks[id] ?? emptyWeekState();

function patchWeek(id: string, patch: Partial<WeekState>, immediate = true): Promise<boolean> {
  return commit(
    { ...state, weeks: { ...state.weeks, [id]: { ...getWeekState(id), ...patch } } },
    immediate,
  );
}

export const actions = {
  toggleTask(weekId: string, taskId: string) {
    const ws = getWeekState(weekId);
    if (ws.completedAt) return;
    void patchWeek(weekId, { tasks: { ...ws.tasks, [taskId]: !ws.tasks[taskId] } });
  },
  setDeliverable(weekId: string, value: boolean) {
    if (getWeekState(weekId).completedAt) return;
    void patchWeek(weekId, { deliverable: value });
  },
  setNotes(weekId: string, notes: string) {
    void patchWeek(weekId, { notes }, false);
  },
  setReflection(weekId: string, reflection: string) {
    void patchWeek(weekId, { reflection }, false);
  },
  setWeekMeta(
    weekId: string,
    meta: { targetDate?: string; priority?: WeekPriority; customHours?: number | null },
  ) {
    const ws = { ...getWeekState(weekId) };
    if (meta.targetDate !== undefined) {
      const cleaned = meta.targetDate.trim();
      if (cleaned) ws.targetDate = cleaned;
      else delete ws.targetDate;
    }
    if (meta.priority !== undefined) {
      if (meta.priority === "Standard") delete ws.priority;
      else ws.priority = meta.priority;
    }
    if (meta.customHours !== undefined) {
      if (
        meta.customHours !== null &&
        Number.isFinite(meta.customHours) &&
        meta.customHours >= 1 &&
        meta.customHours <= 100
      ) {
        ws.customHours = Math.round(meta.customHours);
      } else {
        delete ws.customHours;
      }
    }
    void commit({ ...state, weeks: { ...state.weeks, [weekId]: ws } });
  },
  /** Returns newly unlocked achievement ids, or null when the week can't be completed (incl. duplicates). */
  completeWeek(weekId: string): string[] | null {
    const allWeeks = getAllWeeks(state);
    const week = getWeekById(state, weekId);
    if (!week) return null;
    const check = canCompleteWeek(week, state.weeks[weekId]);
    if (!check.ok) return null;
    const auditIds = AUDIT_ITEMS.map((i) => i.id);
    const before = unlockedAchievements(allWeeks, state, auditIds);
    const nextWeeks = {
      ...state.weeks,
      [weekId]: { ...getWeekState(weekId), completedAt: new Date().toISOString() },
    };
    const nextHistory = { ...state.completionHistory, [weekId]: kolkataDateKey() };
    void commit({ ...state, weeks: nextWeeks, completionHistory: nextHistory });
    const after = unlockedAchievements(allWeeks, state, auditIds);
    return [...after].filter((a) => !before.has(a));
  },
  reopenWeek(weekId: string): Promise<boolean> {
    const ws = getWeekState(weekId);
    const { completedAt: _c, ...rest } = ws;
    const nextHistory = { ...state.completionHistory };
    delete nextHistory[weekId];
    return commit({
      ...state,
      weeks: { ...state.weeks, [weekId]: rest },
      completionHistory: nextHistory,
    });
  },
  saveCustomWeek(
    week: Week,
    meta?: { targetDate?: string; priority?: WeekPriority },
  ): Promise<boolean> {
    const exists = state.customWeeks.some((w) => w.id === week.id);
    const customWeeks = exists
      ? state.customWeeks.map((w) => (w.id === week.id ? week : w))
      : [...state.customWeeks, week];
    const ws = { ...getWeekState(week.id) };
    if (meta?.targetDate !== undefined) {
      if (meta.targetDate.trim()) ws.targetDate = meta.targetDate.trim();
      else delete ws.targetDate;
    }
    if (meta?.priority !== undefined) {
      if (meta.priority === "Standard") delete ws.priority;
      else ws.priority = meta.priority;
    }
    return commit({
      ...state,
      customWeeks,
      weeks: { ...state.weeks, [week.id]: ws },
    });
  },
  deleteCustomWeek(weekId: string): Promise<boolean> {
    const nextWeeks = { ...state.weeks };
    delete nextWeeks[weekId];
    const nextHistory = { ...state.completionHistory };
    delete nextHistory[weekId];
    return commit({
      ...state,
      customWeeks: state.customWeeks.filter((w) => w.id !== weekId),
      weeks: nextWeeks,
      completionHistory: nextHistory,
    });
  },
  setAuditLevel(itemId: string, level: AuditLevel): string[] {
    const allWeeks = getAllWeeks(state);
    const auditIds = AUDIT_ITEMS.map((i) => i.id);
    const before = unlockedAchievements(allWeeks, state, auditIds);
    const cur = state.audit[itemId] ?? { revised: false };
    const nextLevel = cur.level === level ? undefined : level;
    const entry = nextLevel ? { ...cur, level: nextLevel } : { revised: cur.revised };
    void commit({ ...state, audit: { ...state.audit, [itemId]: entry } });
    const after = unlockedAchievements(allWeeks, state, auditIds);
    return [...after].filter((a) => !before.has(a));
  },
  toggleRevised(itemId: string) {
    const cur = state.audit[itemId] ?? { revised: false };
    void commit({
      ...state,
      audit: { ...state.audit, [itemId]: { ...cur, revised: !cur.revised } },
    });
  },
  setSkill(key: string, level: SkillLevel) {
    void commit({ ...state, skills: { ...state.skills, [key]: level } });
  },
  saveCustomSkill(skill: CustomSkill, initialLevel?: SkillLevel): Promise<boolean> {
    const exists = state.customSkills.some((s) => s.id === skill.id);
    const customSkills = exists
      ? state.customSkills.map((s) => (s.id === skill.id ? skill : s))
      : [...state.customSkills, skill];
    const nextSkills =
      initialLevel !== undefined
        ? { ...state.skills, [`${skill.categoryId}:${skill.name}`]: initialLevel }
        : state.skills;
    return commit({ ...state, customSkills, skills: nextSkills });
  },
  deleteCustomSkill(skill: CustomSkill): Promise<boolean> {
    const nextSkills = { ...state.skills };
    delete nextSkills[`${skill.categoryId}:${skill.name}`];
    return commit({
      ...state,
      customSkills: state.customSkills.filter((s) => s.id !== skill.id),
      skills: nextSkills,
    });
  },
  toggleHabit(habitId: string, day: number) {
    const wk = habitWeekKey();
    const isSameWeek = state.habitWeek === wk;
    const nextHistory = { ...state.habitHistory };
    if (
      !isSameWeek &&
      state.habitWeek &&
      Object.values(state.habits).some((r) => r.some(Boolean))
    ) {
      nextHistory[state.habitWeek] = state.habits;
    }
    const habits = isSameWeek ? state.habits : {};
    const row = [...(habits[habitId] ?? Array<boolean>(7).fill(false))];
    row[day] = !row[day];
    const nextHabits = { ...habits, [habitId]: row };
    nextHistory[wk] = nextHabits;
    void commit({
      ...state,
      habitWeek: wk,
      habits: nextHabits,
      habitHistory: nextHistory,
    });
  },
  bumpDsa(kind: "problems" | "sql", delta: number) {
    void commit({
      ...state,
      dsa: { ...state.dsa, [kind]: Math.max(0, state.dsa[kind] + delta) },
    });
  },
  toggleDsaTopic(topic: string) {
    void commit({
      ...state,
      dsaTopics: { ...state.dsaTopics, [topic]: !state.dsaTopics[topic] },
    });
  },
  toggleInterviewTrack(track: string) {
    void commit({
      ...state,
      interviewTracks: { ...state.interviewTracks, [track]: !state.interviewTracks[track] },
    });
  },
  saveProjectMeta(projectId: string, patch: Partial<ProjectMeta>): Promise<boolean> {
    const cur = state.projects[projectId] ?? emptyProjectMeta();
    return commit({
      ...state,
      projects: { ...state.projects, [projectId]: { ...cur, ...patch } },
    });
  },
  saveCustomProject(project: CustomProject): Promise<boolean> {
    const exists = state.customProjects.some((p) => p.id === project.id);
    const customProjects = exists
      ? state.customProjects.map((p) => (p.id === project.id ? project : p))
      : [project, ...state.customProjects];
    return commit({ ...state, customProjects });
  },
  deleteCustomProject(id: string): Promise<boolean> {
    return commit({
      ...state,
      customProjects: state.customProjects.filter((p) => p.id !== id),
    });
  },
  saveJob(job: Job): Promise<boolean> {
    const exists = state.jobs.some((j) => j.id === job.id);
    return commit({
      ...state,
      jobs: exists ? state.jobs.map((j) => (j.id === job.id ? job : j)) : [job, ...state.jobs],
    });
  },
  deleteJob(id: string): Promise<boolean> {
    return commit({ ...state, jobs: state.jobs.filter((j) => j.id !== id) });
  },
  exportSnapshot(): string {
    ensureInitialized();
    return JSON.stringify(state, null, 2);
  },
  async importSnapshot(rawJson: string): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      const parsed: unknown = JSON.parse(rawJson);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return { ok: false, error: "Backup file must contain a JSON object." };
      }
      const synced = await commit(sanitizeState(parsed));
      if (!synced && syncState.user) {
        return { ok: false, error: syncState.error ?? "Imported locally, but cloud sync failed." };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Invalid JSON file. Could not restore backup." };
    }
  },
  reset(): Promise<boolean> {
    return commit(initialState());
  },
  async signInWithGoogle(): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      await signInGoogleAccount();
      return { ok: true };
    } catch (err) {
      const msg = describeFirebaseError(err);
      patchSync({ error: msg });
      return { ok: false, error: msg };
    }
  },
  async signOut(): Promise<void> {
    await signOutAccount();
    detachCloudUser();
  },
  async retrySync(): Promise<boolean> {
    if (!syncState.user) return false;
    return enqueueCloudWrite(state);
  },
  async flushSync(): Promise<boolean> {
    if (!syncState.user) return true;
    if (debounceTimer !== null && typeof window !== "undefined") {
      window.clearTimeout(debounceTimer);
      debounceTimer = null;
      return enqueueCloudWrite(state);
    }
    return writeChain;
  },
};

export function currentHabits(s: MissionState) {
  return s.habitWeek === habitWeekKey() ? s.habits : {};
}
