export interface ProjectStage {
  label: string;
  milestoneId: string;
}

export interface Project {
  id: string;
  name: string;
  period: string;
  description: string;
  categories: string[];
  tech: string[];
  deliverable: string;
  /** Weeks whose completion drives this project's progress. */
  weekIds: string[];
  stages?: ProjectStage[];
  capstone?: boolean;
}

export const PROJECTS: Project[] = [
  {
    id: "first-llm",
    name: "First LLM Application",
    period: "Dec 2026 – Jan 2027",
    description:
      "A small, working LLM-powered app with server-side credentials, evaluation and tracing.",
    categories: ["LLM Engineering", "Evaluation"],
    tech: ["Python", "LLM API", "React", "TypeScript", "Langfuse"],
    deliverable: "Demo + GitHub write-up",
    weekIds: ["jan27-w5", "jan27-w6"],
  },
  {
    id: "fastapi",
    name: "FastAPI Backend Application",
    period: "February 2027",
    description: "An authenticated, tested and deployed API with a React/TS frontend.",
    categories: ["Backend Engineering"],
    tech: ["FastAPI", "Pydantic", "PostgreSQL", "Pytest", "React"],
    deliverable: "Deployed backend + frontend",
    weekIds: ["feb27-w1", "feb27-w2", "feb27-w3", "feb27-w4"],
  },
  {
    id: "tools",
    name: "Structured Output & Tool Calling App",
    period: "March 2027",
    description: "Typed LLM responses, real tool integrations and a streaming chat interface.",
    categories: ["LLM Engineering", "Streaming UI"],
    tech: ["Structured Outputs", "Tool Calling", "SSE", "React", "TypeScript"],
    deliverable: "Interactive streaming app",
    weekIds: ["mar27-w1", "mar27-w2", "mar27-w3", "mar27-w4"],
  },
  {
    id: "rag",
    name: "RAG Document Assistant",
    period: "April 2027",
    description: "Document Q&A with grounded, cited answers and measured retrieval quality.",
    categories: ["RAG", "Vector Search"],
    tech: ["Embeddings", "pgvector / Qdrant", "Reranking", "Citations UI"],
    deliverable: "Q&A feature + retrieval eval",
    weekIds: ["apr27-w1", "apr27-w2", "apr27-w3", "apr27-w4"],
  },
  {
    id: "agent",
    name: "AI Workflow Agent",
    period: "May 2027",
    description: "A controlled business workflow agent with approved tool execution.",
    categories: ["AI Agents", "Security"],
    tech: ["LangGraph", "MCP", "RBAC", "Approval UI"],
    deliverable: "Human-in-the-loop agent",
    weekIds: ["may27-w1", "may27-w2", "may27-w3", "may27-w4"],
  },
  {
    id: "capstone",
    name: "Enterprise AI Operations Copilot",
    period: "Evolving · Mar → Aug 2027",
    description:
      "A full-stack AI product — not a chatbot. RAG, agents, approvals, audit history, evaluation, observability and cloud deployment, built incrementally from March.",
    categories: ["Full-Stack AI", "Production AI", "Deployment"],
    tech: [
      "React/TS",
      "FastAPI",
      "PostgreSQL",
      "RAG",
      "LangGraph",
      "Langfuse",
      "Docker",
      "AWS / Azure",
    ],
    deliverable: "Deployed product + architecture docs",
    capstone: true,
    weekIds: [
      "mar27-w1",
      "mar27-w4",
      "apr27-w4",
      "may27-w4",
      "jun27-w4",
      "julaug27-w3",
      "julaug27-w6",
      "julaug27-w7",
    ],
    stages: [
      { label: "Repo + first LLM feature", milestoneId: "mar27" },
      { label: "RAG + citations", milestoneId: "apr27" },
      { label: "Agents + approvals", milestoneId: "may27" },
      { label: "Evals + monitoring", milestoneId: "jun27" },
      { label: "Docker + cloud ship", milestoneId: "julaug27" },
    ],
  },
];
