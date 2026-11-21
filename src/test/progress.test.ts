import { serverTimestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import { AUDIT_ITEMS } from "@/data/audit";
import { ALL_WEEKS, getWeek } from "@/data/roadmap";
import type { Week } from "@/data/types";
import { stripUndefined } from "@/lib/firebase-service";
import {
  achievementProgress,
  canCompleteWeek,
  computeProjectStatus,
  computeStats,
  computeStreaks,
  coreTaskIds,
  getAllWeeks,
  getMergedProjects,
  getMergedSkillCategories,
  habitWeekKey,
  hasMeaningfulState,
  initialState,
  isWeekOverdue,
  kolkataDateKey,
  kolkataDayIndex,
  safeExternalUrl,
  sanitizeState,
  unlockedAchievements,
  type WeekState,
} from "@/lib/progress";

const done = (): WeekState => ({
  tasks: {},
  deliverable: true,
  notes: "",
  reflection: "",
  completedAt: "2027-01-01T10:00:00.000Z",
});
const missions = ALL_WEEKS.filter((w) => w.kind === "mission");

describe("weekly mission rules", () => {
  const feb = getWeek("feb27-w1")!;
  const allCore = Object.fromEntries(coreTaskIds(feb).map((id) => [id, true]));

  it("starts at zero progress with no fabricated completions", () => {
    const s = initialState();
    const stats = computeStats(ALL_WEEKS, s);
    expect(stats.completedWeeks).toBe(0);
    expect(stats.pendingWeeks).toBe(missions.length);
    expect(stats.completion).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.hours).toBe(0);
    expect(hasMeaningfulState(s)).toBe(false);
  });

  it("requires every core task and the deliverable, but never stretch tasks", () => {
    expect(
      canCompleteWeek(feb, { tasks: allCore, deliverable: false, notes: "", reflection: "" }).ok,
    ).toBe(false);
    expect(
      canCompleteWeek(feb, {
        tasks: { ...allCore, [coreTaskIds(feb)[0]!]: false },
        deliverable: true,
        notes: "",
        reflection: "",
      }).ok,
    ).toBe(false);
    expect(
      canCompleteWeek(feb, { tasks: allCore, deliverable: true, notes: "", reflection: "" }).ok,
    ).toBe(true);
  });

  it("blocks duplicate completion of an already completed week", () => {
    expect(
      canCompleteWeek(feb, {
        tasks: allCore,
        deliverable: true,
        notes: "",
        reflection: "",
        completedAt: "x",
      }).ok,
    ).toBe(false);
  });

  it("respects custom effort hours in stats calculation", () => {
    const s = initialState();
    s.weeks[feb.id] = {
      tasks: allCore,
      deliverable: true,
      notes: "",
      reflection: "",
      customHours: 20,
    };
    expect(computeStats(ALL_WEEKS, s).hours).toBe(20);
  });

  it("detects overdue missions using Asia/Kolkata dates", () => {
    expect(
      isWeekOverdue(
        feb,
        { tasks: {}, deliverable: false, notes: "", reflection: "", targetDate: "2026-11-20" },
        "2026-11-21",
      ),
    ).toBe(true);
    expect(
      isWeekOverdue(
        feb,
        {
          tasks: {},
          deliverable: true,
          notes: "",
          reflection: "",
          targetDate: "2026-11-20",
          completedAt: "2026-11-20T12:00:00Z",
        },
        "2026-11-21",
      ),
    ).toBe(false);
  });
});

describe("dynamic custom missions, skills, and projects", () => {
  it("merges custom weekly missions into stats and streaks dynamically", () => {
    const s = initialState();
    const custom: Week = {
      id: "custom-1",
      phaseId: "p0",
      milestoneId: "audit",
      label: "AUDIT · CUSTOM",
      kind: "mission",
      title: "Custom Diagnostics Sprint",
      tags: ["Python"],
      hours: 6,
      sections: [{ id: "s1", title: "Core tasks", tasks: [{ id: "t1", label: "Build script" }] }],
      stretch: [],
      deliverable: "Working script",
    };
    s.customWeeks = [custom];
    const all = getAllWeeks(s);
    expect(all.length).toBe(ALL_WEEKS.length + 1);
    expect(computeStats(all, s).totalWeeks).toBe(missions.length + 1);
    expect(hasMeaningfulState(s)).toBe(true);
  });

  it("merges custom skills and custom projects into selectors", () => {
    const s = initialState();
    s.customSkills = [{ id: "cs-1", categoryId: "llm", name: "vLLM Serving" }];
    s.customProjects = [
      {
        id: "cp-1",
        name: "AI SQL Analyst",
        period: "May 2027",
        description: "Text-to-SQL with evals",
        categories: ["LLM Engineering"],
        tech: ["FastAPI", "React"],
        deliverable: "Live web app",
        status: "In progress",
        progress: 45,
        demoUrl: "",
        repoUrl: "",
        notes: "",
        weekIds: [],
        createdAt: "2027-05-01T00:00:00Z",
        updatedAt: "2027-05-01T00:00:00Z",
      },
    ];
    const cats = getMergedSkillCategories(s);
    expect(cats.find((c) => c.id === "llm")?.skills).toContain("vLLM Serving");
    const projects = getMergedProjects(s);
    const customProj = projects.find((p) => p.id === "cp-1")!;
    expect(computeProjectStatus(customProj, s)).toEqual({
      pct: 0.45,
      status: "In progress",
      done: 45,
      total: 100,
    });
  });
});

describe("streaks", () => {
  it("does not break across buffer weeks", () => {
    const ids = ["dec26-w1", "dec26-w2", "dec26-w3", "jan27-w4"];
    const state = Object.fromEntries(ids.map((id) => [id, done()]));
    expect(computeStreaks(ALL_WEEKS, state)).toEqual({ current: 4, best: 4 });
  });

  it("resets current streak after a skipped mission but keeps best", () => {
    const state = Object.fromEntries(
      [missions[0]!.id, missions[1]!.id, missions[2]!.id, missions[4]!.id].map((id) => [
        id,
        done(),
      ]),
    );
    expect(computeStreaks(ALL_WEEKS, state)).toEqual({ current: 1, best: 3 });
  });
});

describe("achievements", () => {
  it("awards Consistency at three consecutive missions, Momentum only at five", () => {
    const s = initialState();
    missions.slice(0, 3).forEach((w) => (s.weeks[w.id] = done()));
    const a = unlockedAchievements(ALL_WEEKS, s, []);
    expect(a.has("first-mission")).toBe(true);
    expect(a.has("consistency")).toBe(true);
    expect(a.has("momentum")).toBe(false);
  });

  it("reports real progress toward locked achievements", () => {
    const auditIds = AUDIT_ITEMS.map((i) => i.id);
    const prog = achievementProgress(ALL_WEEKS, initialState(), auditIds);
    expect(prog["consistency"]).toEqual({ current: 0, target: 3, label: "0/3 streak" });
    expect(prog["foundation-ready"]).toEqual({
      current: 0,
      target: auditIds.length,
      label: `0/${auditIds.length} assessed`,
    });
  });
});

describe("Asia/Kolkata timezone boundaries, state sanitization, and URL validation", () => {
  it("computes Asia/Kolkata date key and Monday week key accurately across UTC midnight", () => {
    // 2026-11-15T19:00:00Z is Monday 2026-11-16 00:30 IST
    const monEarlyIst = new Date("2026-11-15T19:00:00.000Z");
    // 2026-11-22T18:00:00Z is Sunday 2026-11-22 23:30 IST
    const sunLateIst = new Date("2026-11-22T18:00:00.000Z");
    expect(kolkataDateKey(monEarlyIst)).toBe("2026-11-16");
    expect(kolkataDayIndex(monEarlyIst)).toBe(0);
    expect(kolkataDateKey(sunLateIst)).toBe("2026-11-22");
    expect(kolkataDayIndex(sunLateIst)).toBe(6);
    expect(habitWeekKey(monEarlyIst)).toBe("2026-11-16");
    expect(habitWeekKey(sunLateIst)).toBe("2026-11-16");
  });

  it("recovers safely from malformed persisted payloads", () => {
    expect(sanitizeState(null)).toEqual(initialState());
    expect(sanitizeState("corrupted")).toEqual(initialState());
    const cleaned = sanitizeState({
      weeks: {
        "feb27-w1": {
          tasks: { a: true, b: "not-bool" },
          deliverable: 1,
          notes: 123,
          priority: "Invalid",
          customHours: 999,
        },
      },
      customWeeks: [{ id: "bad-no-tasks", title: "Missing" }],
      audit: {
        "fund-intro": { level: "bogus", revised: true },
        "fund-db": { level: "confident", revised: false },
      },
      skills: { "prog:Python": 3, "prog:JS": 99 },
      customSkills: [
        { id: "s1", categoryId: "prog", name: "Rust" },
        { id: "", name: "Bad" },
      ],
      dsa: { problems: -5, sql: 12.9 },
      jobs: [
        { id: "1", company: "Acme", status: "Unknown" },
        { id: "", company: "Skip" },
      ],
      projects: { capstone: { demoUrl: "https://example.com", repoUrl: 42, notes: "ok" } },
      customProjects: [{ id: "p1", name: "Valid", status: "Bogus", progress: 180 }],
      completionHistory: { "audit-w1": "2026-11-21", bad: 42 },
    });
    expect(cleaned.weeks["feb27-w1"]?.tasks).toEqual({ a: true });
    expect(cleaned.weeks["feb27-w1"]?.notes).toBe("");
    expect(cleaned.weeks["feb27-w1"]?.priority).toBeUndefined();
    expect(cleaned.weeks["feb27-w1"]?.customHours).toBeUndefined();
    expect(cleaned.customWeeks).toHaveLength(0);
    expect(cleaned.audit["fund-intro"]).toEqual({ revised: true });
    expect(cleaned.audit["fund-db"]).toEqual({ level: "confident", revised: false });
    expect(cleaned.skills).toEqual({ "prog:Python": 3 });
    expect(cleaned.customSkills).toEqual([{ id: "s1", categoryId: "prog", name: "Rust" }]);
    expect(cleaned.dsa).toEqual({ problems: 0, sql: 12 });
    expect(cleaned.jobs).toHaveLength(1);
    expect(cleaned.jobs[0]?.status).toBe("Saved");
    expect(cleaned.projects["capstone"]).toEqual({
      demoUrl: "https://example.com",
      repoUrl: "",
      notes: "ok",
    });
    expect(cleaned.customProjects[0]?.status).toBe("Not started");
    expect(cleaned.customProjects[0]?.progress).toBe(100);
    expect(cleaned.completionHistory).toEqual({ "audit-w1": "2026-11-21" });
  });

  it("validates external URLs and blocks unsafe schemes", () => {
    expect(safeExternalUrl("https://github.com/varma27/copilot")).toBe(
      "https://github.com/varma27/copilot",
    );
    expect(safeExternalUrl("github.com/varma27/copilot")).toBe(
      "https://github.com/varma27/copilot",
    );
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("data:text/html,hi")).toBeNull();
    expect(safeExternalUrl("not a url")).toBeNull();
    expect(safeExternalUrl("   ")).toBeNull();
  });

  it("strips undefined keys while preserving Firestore FieldValue sentinels", () => {
    const sentinel = serverTimestamp();
    const cleaned = stripUndefined({
      ok: true,
      dropMe: undefined,
      nested: { keep: "yes", drop: undefined },
      updatedAt: sentinel,
    });
    expect(cleaned).toEqual({
      ok: true,
      nested: { keep: "yes" },
      updatedAt: sentinel,
    });
    expect("dropMe" in cleaned).toBe(false);
    expect(cleaned.updatedAt).toBe(sentinel);
  });
});
