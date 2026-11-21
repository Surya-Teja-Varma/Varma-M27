import type { Tone } from "./types";

export type SkillLevel = 0 | 1 | 2 | 3 | 4;

export const SKILL_LEVELS = [
  { level: 0, label: "Not started" },
  { level: 1, label: "Learning" },
  { level: 2, label: "Practicing" },
  { level: 3, label: "Project applied" },
  { level: 4, label: "Confident" },
] as const;

export interface SkillCategory {
  id: string;
  name: string;
  tone: Tone;
  skills: string[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "prog",
    name: "Programming & Python",
    tone: "orange",
    skills: ["Python", "JavaScript", "TypeScript"],
  },
  {
    id: "backend",
    name: "Backend Engineering",
    tone: "cyan",
    skills: [
      "FastAPI",
      "REST APIs",
      "PostgreSQL",
      "SQL",
      "Redis fundamentals",
      "Async Python",
      "Pytest",
    ],
  },
  {
    id: "aiml",
    name: "AI & Machine Learning Foundations",
    tone: "violet",
    skills: [
      "Supervised & unsupervised learning",
      "Classification & regression",
      "Model evaluation metrics",
    ],
  },
  {
    id: "dl",
    name: "Deep Learning Fundamentals",
    tone: "violet",
    skills: ["Neural networks", "Tokenization", "Transformers & attention"],
  },
  {
    id: "llm",
    name: "LLM Engineering",
    tone: "orange",
    skills: ["LLM APIs", "Structured Outputs", "Function Calling", "Streaming responses"],
  },
  {
    id: "genai",
    name: "Generative AI",
    tone: "violet",
    skills: ["Prompt Engineering", "Context engineering", "Model selection", "Embeddings"],
  },
  {
    id: "vector",
    name: "Embeddings & Vector Search",
    tone: "cyan",
    skills: ["Semantic similarity", "Vector Search", "pgvector or Qdrant", "Metadata filtering"],
  },
  {
    id: "rag",
    name: "RAG Engineering",
    tone: "cyan",
    skills: ["Document Ingestion", "Chunking", "Hybrid Retrieval", "Reranking", "Citations"],
  },
  {
    id: "agents",
    name: "AI Agents & LangGraph",
    tone: "orange",
    skills: ["Tool Calling", "LangGraph", "MCP", "Workflow Orchestration", "Human-in-the-Loop"],
  },
  {
    id: "prodai",
    name: "Production AI & Evaluation",
    tone: "lime",
    skills: ["LLM Evaluation", "Langfuse", "Observability"],
  },
  {
    id: "security",
    name: "AI Security & Reliability",
    tone: "lime",
    skills: ["Guardrails", "Security", "Reliability", "Prompt injection defence"],
  },
  {
    id: "cloud",
    name: "Deployment & Cloud",
    tone: "cyan",
    skills: ["Docker", "GitHub Actions", "AWS or Azure", "Linux", "CI/CD"],
  },
  {
    id: "dsa",
    name: "DSA & Problem Solving",
    tone: "orange",
    skills: ["DSA", "Python problem solving", "SQL problems"],
  },
  {
    id: "sysdesign",
    name: "System Design & Engineering Fundamentals",
    tone: "violet",
    skills: ["OOP", "Testing", "System Design"],
  },
  {
    id: "career",
    name: "Career & Interview Preparation",
    tone: "navy",
    skills: [
      "Project walkthrough",
      "Technical communication",
      "Mock interviews",
      "Resume & applications",
    ],
  },
];

export const skillKey = (catId: string, skill: string) => `${catId}:${skill}`;
