export const HABITS = [
  { id: "dsa", label: "DSA problem" },
  { id: "python", label: "Python coding" },
  { id: "sql", label: "SQL practice" },
  { id: "english", label: "Technical English" },
  { id: "github", label: "GitHub update" },
  { id: "docs", label: "Project docs" },
  { id: "revision", label: "Weekly revision" },
] as const;

export type HabitId = (typeof HABITS)[number]["id"];

export const DSA_PROGRESSION = [
  { period: "Nov 2026 – Jan 2027", label: "Initial learning", target: "2–3 / week" },
  { period: "Feb – May 2027", label: "Backend & LLM months", target: "3–4 / week" },
  { period: "June 2027", label: "Production AI", target: "4–5 / week" },
  { period: "Jul – Oct 2027", label: "Interview focus", target: "Consistent daily" },
] as const;

export const DSA_TOPICS = [
  "Arrays & strings",
  "Hash maps & sets",
  "Two pointers",
  "Sliding window",
  "Stacks & queues",
  "Linked lists",
  "Binary search",
  "Trees & recursion",
  "Basic DP",
  "SQL",
  "Python problem-solving",
  "OOP",
  "REST API design",
  "Backend fundamentals",
  "AI architecture",
  "RAG architecture",
  "Agent workflows",
  "System design",
] as const;

export const INTERVIEW_TRACKS = [
  "Python technical",
  "Backend engineering",
  "SQL",
  "LLM fundamentals",
  "RAG & vector search",
  "AI agents",
  "System design",
  "Project walkthrough",
  "Technical communication",
] as const;

export const TARGET_ROLES = [
  "Applied AI Engineer",
  "Applied AI Engineer II",
  "GenAI Engineer",
  "AI Software Engineer",
  "Full Stack AI Engineer",
  "AI Integration Engineer",
  "LLM Engineer",
] as const;

export const TARGET_LOCATIONS = ["Hyderabad", "Bengaluru", "Remote · India"] as const;

export const JOB_STATUSES = [
  "Saved",
  "Applied",
  "Screening",
  "Interviewing",
  "Offer",
  "Rejected",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];
