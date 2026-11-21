export type AuditLevel = "confident" | "revision" | "practice" | "notdone";

export const AUDIT_LEVELS: {
  id: AuditLevel;
  label: string;
  tone: "lime" | "orange" | "cyan" | "navy";
}[] = [
  { id: "confident", label: "Confident", tone: "lime" },
  { id: "revision", label: "Needs revision", tone: "orange" },
  { id: "practice", label: "Needs practice", tone: "cyan" },
  { id: "notdone", label: "Not completed", tone: "navy" },
];

export interface AuditItem {
  id: string;
  label: string;
  /** Diagnostic week (1–3) where this topic is assessed. */
  week: 1 | 2 | 3;
}

export interface AuditGroup {
  id: string;
  name: string;
  /** Portal-provided reference figure — not a verified personal completion state. */
  reference: number;
  items: AuditItem[];
}

export const AUDIT_GROUPS: AuditGroup[] = [
  {
    id: "fund",
    name: "Fundamentals",
    reference: 100,
    items: [
      { id: "fund-intro", label: "Intro to Intensive", week: 3 },
      { id: "fund-static", label: "Build Your Own Static Website — HTML, CSS, Bootstrap", week: 2 },
      {
        id: "fund-responsive",
        label: "Build Your Own Responsive Website — HTML, CSS, Bootstrap",
        week: 2,
      },
      { id: "fund-python", label: "Programming Foundations — Python", week: 1 },
      { id: "fund-db", label: "Introduction to Databases", week: 3 },
      { id: "fund-track", label: "Choose Your Job Track", week: 3 },
    ],
  },
  {
    id: "gc2",
    name: "Growth Cycle 2",
    reference: 84,
    items: [
      { id: "gc2-python", label: "Programming Foundations — Python", week: 1 },
      { id: "gc2-git", label: "Developer Foundations — Git", week: 3 },
      { id: "gc2-cli", label: "Developer Foundations — Command Line", week: 3 },
      {
        id: "gc2-dynamic",
        label: "Build Your Own Dynamic Web Application — HTML, CSS, JavaScript",
        week: 1,
      },
      { id: "gc2-js", label: "JavaScript Essentials", week: 1 },
      { id: "gc2-flex", label: "Responsive Web Design using Flexbox", week: 2 },
    ],
  },
  {
    id: "gc3",
    name: "Growth Cycle 3",
    reference: 58,
    items: [
      { id: "gc3-node", label: "Node.js", week: 2 },
      { id: "gc3-react", label: "React JS — Getting Started", week: 2 },
      { id: "gc3-hooks", label: "React Hooks", week: 2 },
    ],
  },
  {
    id: "place",
    name: "Placement Preparation",
    reference: 77,
    items: [
      { id: "pl-orient", label: "Placement Orientation — MERN 2.0", week: 3 },
      { id: "pl-guide", label: "Placement Support Guide", week: 3 },
      { id: "pl-fundq", label: "Fundamentals — Interview Questions", week: 3 },
      { id: "pl-mernq", label: "MERN — Interview Questions", week: 2 },
      { id: "pl-mock", label: "Mock Tests", week: 3 },
      { id: "pl-intro", label: "Self Introduction and Project Explanation", week: 3 },
      { id: "pl-drills", label: "Mock Interview Drills", week: 3 },
      { id: "pl-essentials", label: "Interview Essentials", week: 3 },
      { id: "pl-mini", label: "React JS Mini Project", week: 2 },
    ],
  },
];

export const AUDIT_ITEMS = AUDIT_GROUPS.flatMap((g) => g.items);

export const AUDIT_WEEKS = [
  {
    week: 1,
    title: "Python, JavaScript & problem-solving",
    focus: "Python · JavaScript · Basic programming",
  },
  {
    week: 2,
    title: "React, TypeScript, Node & MERN",
    focus: "React · TypeScript · Node.js · Express · APIs",
  },
  {
    week: 3,
    title: "SQL, Git, CLI & placement",
    focus: "SQL · Databases · Git · CLI · Project explanation",
  },
] as const;
