export type Tone = "orange" | "lime" | "cyan" | "violet" | "navy";

export interface MissionTask {
  id: string;
  label: string;
}

export interface TaskSection {
  id: string;
  title: string;
  tasks: MissionTask[];
}

export type WeekKind = "mission" | "buffer";

export interface Week {
  id: string;
  phaseId: string;
  milestoneId: string;
  /** e.g. "FEB 2027 · WEEK 01" */
  label: string;
  kind: WeekKind;
  title: string;
  objective?: string;
  tags: string[];
  difficulty?: string;
  hours: number;
  /** Core sections — every task here is required for completion. */
  sections: TaskSection[];
  /** Optional extra learning — never blocks completion. */
  stretch: MissionTask[];
  deliverable: string;
  /** Marks the fully art-directed reference mission. */
  featured?: boolean;
}

export interface Milestone {
  id: string;
  phaseId: string;
  label: string;
  title: string;
  goal: string;
  outcome: string;
  tags: string[];
  frontend?: string[];
  notes?: string[];
  weeks: Week[];
}

export interface Phase {
  id: string;
  code: string;
  name: string;
  period: string;
  heading: string;
  description: string;
  milestones: Milestone[];
}
