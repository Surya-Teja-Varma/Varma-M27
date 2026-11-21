import type { Milestone, MissionTask, Phase, TaskSection, Week } from "./types";

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);

const tasks = (prefix: string, labels: string[]): MissionTask[] =>
  labels.map((label, i) => ({ id: `${prefix}-t${i + 1}-${slug(label)}`, label }));

interface WeekInput {
  n: number;
  title: string;
  core: string[] | { title: string; items: string[] }[];
  stretch?: string[];
  deliverable: string;
  tags: string[];
  hours?: number;
  difficulty?: string;
  objective?: string;
  featured?: boolean;
}

function mission(phaseId: string, milestoneId: string, short: string, w: WeekInput): Week {
  const id = `${milestoneId}-w${w.n}`;
  const isGrouped = typeof w.core[0] === "object";
  const sections: TaskSection[] = isGrouped
    ? (w.core as { title: string; items: string[] }[]).map((s, i) => ({
        id: `${id}-s${i + 1}`,
        title: s.title,
        tasks: tasks(`${id}-s${i + 1}`, s.items),
      }))
    : [{ id: `${id}-s1`, title: "Core tasks", tasks: tasks(`${id}-s1`, w.core as string[]) }];
  return {
    id,
    phaseId,
    milestoneId,
    label: `${short} · WEEK ${String(w.n).padStart(2, "0")}`,
    kind: "mission",
    title: w.title,
    tags: w.tags,
    hours: w.hours ?? 12,
    sections,
    stretch: tasks(`${id}-x`, w.stretch ?? []),
    deliverable: w.deliverable,
    ...(w.objective ? { objective: w.objective } : {}),
    ...(w.difficulty ? { difficulty: w.difficulty } : {}),
    ...(w.featured ? { featured: true } : {}),
  };
}

function buffer(phaseId: string, milestoneId: string, short: string, n = 1): Week {
  return {
    id: `${milestoneId}-buffer${n}`,
    phaseId,
    milestoneId,
    label: `${short} · BUFFER`,
    kind: "buffer",
    title: "Catch-up & recovery block",
    tags: ["Buffer"],
    hours: 6,
    sections: [],
    stretch: [],
    deliverable: "Carry forward unfinished core tasks, revise, debug and document.",
  };
}

/* ---------------- PHASE 0 — FOUNDATION AUDIT ---------------- */
const P0 = "p0";
const audit: Milestone = {
  id: "audit",
  phaseId: P0,
  label: "21 NOV – 15 DEC 2026",
  title: "Foundation Audit & Targeted Revision",
  goal: "Diagnose existing full-stack knowledge and repair only the real gaps.",
  outcome: "A foundation readiness summary with every weak spot identified and repaired.",
  tags: ["Foundation", "Revision", "Diagnostics"],
  weeks: [
    mission(P0, "audit", "AUDIT", {
      n: 1,
      title: "Python, JavaScript & Problem-Solving Audit",
      tags: ["Python", "JavaScript", "Problem Solving"],
      hours: 8,
      core: [
        "Solve 5 Python problems without references",
        "Rebuild a small JavaScript DOM feature from memory",
        "Complete a timed basic problem-solving set",
        "Classify Python & JavaScript audit topics",
        "Revise every topic marked Needs Revision",
      ],
      stretch: ["Re-solve one problem in both Python and JavaScript"],
      deliverable: "Audit notes listing confident and weak Python/JS topics.",
    }),
    mission(P0, "audit", "AUDIT", {
      n: 2,
      title: "React, TypeScript, Node & MERN Audit",
      tags: ["React", "TypeScript", "Node.js", "MERN"],
      hours: 9,
      core: [
        "Build a React component with hooks from scratch",
        "Convert a small component to TypeScript",
        "Create a Node.js + Express endpoint",
        "Integrate a frontend with a REST API",
        "Classify React, Node & MERN audit topics",
      ],
      stretch: ["Add loading and error states to the API integration"],
      deliverable: "A tiny MERN slice that proves (or exposes) your current level.",
    }),
    mission(P0, "audit", "AUDIT", {
      n: 3,
      title: "SQL, Git, CLI & Placement Readiness Audit",
      tags: ["SQL", "Git", "Career"],
      hours: 8,
      core: [
        "Write joins, filters and aggregations in SQL",
        "Practise branching, merging and resolving a conflict in Git",
        "Navigate and script basic tasks in the command line",
        "Record a 2-minute project explanation",
        "Generate the foundation readiness summary",
      ],
      stretch: ["Run one mock interview drill and note feedback"],
      deliverable: "Foundation readiness summary with a repair list.",
    }),
  ],
};

/* ---------------- PHASE 0.5 — ENGINEERING CORE ---------------- */
const PC = "pcore";
const dec: Milestone = {
  id: "dec26",
  phaseId: PC,
  label: "DECEMBER 2026",
  title: "Professional Python & ML Concepts",
  goal: "Write Python like an engineer, not a tutorial follower.",
  outcome: "Clean, typed, tested Python and a practical grasp of core ML ideas.",
  tags: ["Python", "Async Python", "AI/ML Foundations"],
  weeks: [
    mission(PC, "dec26", "DEC 2026", {
      n: 1,
      title: "Professional Python Foundations",
      tags: ["Python"],
      core: [
        "Python data structures",
        "Functions and modules",
        "OOP and classes",
        "Exception handling",
        "Type hints",
        "Packages and virtual environments",
        "Debugging and clean code",
        "Independent coding exercises",
      ],
      stretch: ["Refactor an old script with type hints and dataclasses"],
      deliverable: "A small typed Python package with clean modules.",
    }),
    mission(PC, "dec26", "DEC 2026", {
      n: 2,
      title: "Async Python & Engineering Fundamentals",
      tags: ["Async Python", "Testing", "Git"],
      core: [
        "Async and await",
        "Event loop concepts",
        "Asynchronous API calls",
        "HTTP and JSON",
        "Error handling",
        "Basic Pytest",
        "Git and GitHub workflow",
      ],
      stretch: ["Benchmark sync vs async API calls"],
      deliverable: "An async API client with Pytest tests on GitHub.",
    }),
    mission(PC, "dec26", "DEC 2026", {
      n: 3,
      title: "Essential Machine-Learning Concepts",
      tags: ["AI/ML Foundations"],
      hours: 10,
      core: [
        "AI vs ML vs Deep Learning",
        "Supervised and unsupervised learning",
        "Classification and regression",
        "Training, validation and test datasets",
        "Overfitting and underfitting",
        "Basic model evaluation metrics",
      ],
      stretch: ["Train one tiny scikit-learn model end to end"],
      deliverable: "A one-page ML concepts explainer in your own words.",
    }),
    buffer(PC, "dec26", "DEC 2026"),
  ],
};

const jan: Milestone = {
  id: "jan27",
  phaseId: PC,
  label: "JANUARY 2027",
  title: "Transformers & Your First LLM Application",
  goal: "Understand LLMs conceptually and ship a small, working LLM app.",
  outcome: "A demonstrable LLM application with evaluation and tracing — not just tutorials.",
  tags: ["Deep Learning", "LLM Engineering", "Evaluation"],
  frontend: ["React + TypeScript interface", "Loading & error states", "Token and latency display"],
  weeks: [
    mission(PC, "jan27", "JAN 2027", {
      n: 4,
      title: "Deep Learning & Transformer Concepts",
      tags: ["Deep Learning", "Generative AI"],
      hours: 10,
      core: [
        "Neural network fundamentals",
        "Training versus inference",
        "Tokens and tokenization",
        "Transformer architecture at a high level",
        "Attention conceptually",
        "Embeddings",
        "Fine-tuning versus RAG",
      ],
      stretch: ["Visualise tokenization of your own sentences"],
      deliverable: "Concept notes you can explain without slides.",
    }),
    mission(PC, "jan27", "JAN 2027", {
      n: 5,
      title: "Build Your First LLM Application",
      tags: ["LLM Engineering", "React", "TypeScript"],
      hours: 14,
      core: [
        "Choose one LLM provider",
        "Integrate an LLM API",
        "Create a small working LLM-powered application",
        "Keep API credentials server-side",
        "Create a small React and TypeScript interface",
        "Understand token consumption and basic latency",
      ],
      stretch: ["Add streaming output to the UI"],
      deliverable: "A working LLM app with a React/TS frontend.",
    }),
    mission(PC, "jan27", "JAN 2027", {
      n: 6,
      title: "Evaluation & Tracing",
      tags: ["Evaluation", "Observability"],
      core: [
        "Create test prompts and expected behaviours",
        "Learn basic evaluation",
        "Integrate Langfuse or an equivalent tracing tool",
        "Record model calls, latency and token usage",
        "Document the project on GitHub",
        "Write a technical explanation of what was built",
      ],
      stretch: ["Compare two models on the same prompt set"],
      deliverable: "First LLM Application — evaluated, traced and documented.",
    }),
    buffer(PC, "jan27", "JAN 2027"),
  ],
};

/* ---------------- PHASE 1 — APPLIED AI ENGINEERING ---------------- */
const P1 = "p1";

export const FEATURED_WEEK_ID = "feb27-w1";

const feb: Milestone = {
  id: "feb27",
  phaseId: P1,
  label: "FEBRUARY 2027",
  title: "Backend Engineering for AI",
  goal: "Build the backend foundation required to develop AI-powered applications independently.",
  outcome: "A deployed, authenticated backend application with a functional frontend and tests.",
  tags: ["Python", "FastAPI", "Async Python", "PostgreSQL", "SQL", "Authentication", "Testing"],
  frontend: ["React/TS client for the API", "Auth screens", "Loading & error states"],
  weeks: [
    mission(P1, "feb27", "FEB 2027", {
      n: 1,
      featured: true,
      title: "Build Your First FastAPI Backend",
      tags: ["Backend Engineering", "Python", "FastAPI"],
      difficulty: "Foundation → Intermediate",
      hours: 15,
      objective:
        "By the end of the week, I should be able to create a basic FastAPI service, understand its request and response flow, validate input, build a few endpoints and independently explain how the API works.",
      core: [
        {
          title: "Setup",
          items: [
            "Install and configure Python tools",
            "Create a virtual environment",
            "Configure a project structure",
            "Install FastAPI and Uvicorn",
            "Create the first working FastAPI application",
          ],
        },
        {
          title: "API fundamentals",
          items: [
            "Understand route decorators",
            "Create GET and POST endpoints",
            "Understand path and query parameters",
            "Return JSON responses",
            "Understand HTTP status codes",
            "Explore API documentation",
          ],
        },
        {
          title: "Request validation",
          items: [
            "Understand Pydantic",
            "Create request models",
            "Create response models",
            "Validate user input",
            "Handle common errors",
          ],
        },
        {
          title: "Practical implementation",
          items: [
            "Build a small CRUD API",
            "Test endpoints independently",
            "Write basic automated tests",
            "Document the project",
            "Push the code to GitHub",
          ],
        },
      ],
      stretch: [
        "Add dependency injection for a shared service",
        "Containerise the API with a simple Dockerfile",
        "Build a tiny React/TS client that calls one endpoint",
      ],
      deliverable: "A working FastAPI CRUD service that I can demonstrate and explain.",
    }),
    mission(P1, "feb27", "FEB 2027", {
      n: 2,
      title: "Async Python & API Engineering",
      tags: ["Async Python", "FastAPI"],
      core: [
        "Async endpoints",
        "External API calls",
        "HTTPX",
        "Error handling",
        "Middleware fundamentals",
        "API structure and reusable services",
      ],
      stretch: ["Add request timing middleware"],
      deliverable: "A FastAPI service that calls an external API asynchronously.",
    }),
    mission(P1, "feb27", "FEB 2027", {
      n: 3,
      title: "PostgreSQL & SQL",
      tags: ["PostgreSQL", "SQL"],
      core: [
        "Database connections",
        "Tables and relationships",
        "CRUD operations",
        "Joins and filtering",
        "Index fundamentals",
        "Transactions and constraints",
      ],
      stretch: ["Profile a slow query with EXPLAIN"],
      deliverable: "The CRUD API persisted in PostgreSQL.",
    }),
    mission(P1, "feb27", "FEB 2027", {
      n: 4,
      title: "Authentication, Testing & Deployment",
      tags: ["Authentication", "Testing", "React"],
      hours: 15,
      core: [
        "Authentication fundamentals",
        "Secure API access",
        "Password hashing and tokens",
        "Pytest unit and integration tests",
        "Basic API deployment",
        "Connect a React/TypeScript frontend to the backend",
      ],
      stretch: ["Add refresh-token rotation"],
      deliverable: "A deployed, authenticated backend with a functional frontend and tests.",
    }),
    buffer(P1, "feb27", "FEB 2027"),
  ],
};

const mar: Milestone = {
  id: "mar27",
  phaseId: P1,
  label: "MARCH 2027",
  title: "LLM Application Engineering",
  goal: "Build useful, interactive LLM applications.",
  outcome:
    "An interactive LLM application with structured responses, tool integrations and a streaming UI.",
  tags: ["LLM Engineering", "Generative AI", "Structured Outputs", "Tool Calling", "Streaming UI"],
  frontend: ["Streaming chat interface", "Conversation history", "Tool execution status"],
  notes: [
    "Start the permanent capstone repository this month — add the first modular feature now.",
  ],
  weeks: [
    mission(P1, "mar27", "MAR 2027", {
      n: 1,
      title: "Structured Outputs & Schema Validation",
      tags: ["Structured Outputs", "LLM Engineering"],
      core: [
        "Structured outputs",
        "JSON mode and schema validation",
        "Model selection",
        "Create the permanent capstone repository",
      ],
      stretch: ["Compare structured-output reliability across two models"],
      deliverable: "Validated, typed LLM responses inside a FastAPI endpoint.",
    }),
    mission(P1, "mar27", "MAR 2027", {
      n: 2,
      title: "Function & Tool Calling",
      tags: ["Tool Calling", "LLM Engineering"],
      core: ["Function calling", "Tool calling", "Error handling for tool failures"],
      stretch: ["Add parallel tool calls"],
      deliverable: "An LLM that calls two real tools and reports results.",
    }),
    mission(P1, "mar27", "MAR 2027", {
      n: 3,
      title: "Streaming Responses & Conversation History",
      tags: ["Streaming UI", "React", "TypeScript"],
      core: [
        "Streaming responses",
        "Conversation history",
        "Build a React/TS streaming chat interface",
        "Loading and error states",
      ],
      stretch: ["Add message regeneration"],
      deliverable: "A streaming chat UI backed by your API.",
    }),
    mission(P1, "mar27", "MAR 2027", {
      n: 4,
      title: "Prompt & Context Engineering + Capstone Feature 1",
      tags: ["Generative AI", "Full-Stack AI"],
      core: [
        "Prompt and context engineering",
        "Integrate LLM functionality into the React/TS interface",
        "Ship the first modular capstone feature",
      ],
      stretch: ["Write a prompt versioning convention"],
      deliverable: "Structured Output & Tool Calling Application + capstone v0.1.",
    }),
    buffer(P1, "mar27", "MAR 2027"),
  ],
};

const apr: Milestone = {
  id: "apr27",
  phaseId: P1,
  label: "APRIL 2027",
  title: "Embeddings & RAG Engineering",
  goal: "Build knowledge-based AI applications.",
  outcome: "A working document Q&A feature with citations and measurable retrieval quality.",
  tags: ["Embeddings", "Vector Search", "RAG", "Retrieval", "Evaluation"],
  frontend: ["Source citations UI", "Document upload flow", "Answer confidence states"],
  notes: [
    "Start the evaluation dataset on day one. Record examples of poor and successful retrieval.",
  ],
  weeks: [
    mission(P1, "apr27", "APR 2027", {
      n: 1,
      title: "Embeddings & Semantic Similarity",
      tags: ["Embeddings"],
      core: ["Embeddings and semantic similarity", "Start the retrieval evaluation dataset"],
      stretch: ["Plot embeddings in 2D"],
      deliverable: "A semantic search demo over a small text set.",
    }),
    mission(P1, "apr27", "APR 2027", {
      n: 2,
      title: "Document Ingestion & Chunking",
      tags: ["RAG"],
      core: ["Document extraction and ingestion", "Document chunking strategies"],
      stretch: ["Compare chunk sizes on your eval set"],
      deliverable: "An ingestion pipeline for PDFs and text.",
    }),
    mission(P1, "apr27", "APR 2027", {
      n: 3,
      title: "Vector Search with pgvector or Qdrant",
      tags: ["Vector Search"],
      core: ["Vector search", "PostgreSQL with pgvector OR Qdrant", "Metadata filtering"],
      stretch: ["Benchmark query latency"],
      deliverable: "Filtered vector search wired into the API.",
    }),
    mission(P1, "apr27", "APR 2027", {
      n: 4,
      title: "Retrieval Quality, Reranking & Citations",
      tags: ["Retrieval", "Evaluation", "React"],
      hours: 14,
      core: [
        "Retrieval strategies",
        "Hybrid search",
        "Reranking",
        "Source citations and grounded answers",
        "Measure retrieval and log poor vs successful examples",
      ],
      stretch: ["Add query rewriting"],
      deliverable: "RAG Document Assistant with citations and measured retrieval.",
    }),
    buffer(P1, "apr27", "APR 2027"),
  ],
};

const may: Milestone = {
  id: "may27",
  phaseId: P1,
  label: "MAY 2027",
  title: "AI Agents & Workflow Engineering",
  goal: "Build agentic applications that use tools responsibly.",
  outcome:
    "A controlled business workflow agent with approved tool execution and human-in-the-loop actions.",
  tags: ["AI Agents", "Agentic AI", "LangGraph", "MCP", "Tool Calling", "Security"],
  frontend: ["Approval interactions", "Tool execution timeline", "Agent state view"],
  notes: ["Learn the concepts first — build a raw tool loop before relying on a framework."],
  weeks: [
    mission(P1, "may27", "MAY 2027", {
      n: 1,
      title: "A Tool-Calling Loop Without a Framework",
      tags: ["AI Agents", "Tool Calling"],
      core: ["Build a simple tool-calling loop by hand", "Understand tool selection and execution"],
      stretch: ["Add a max-steps safety limit"],
      deliverable: "A framework-free agent loop you can explain line by line.",
    }),
    mission(P1, "may27", "MAY 2027", {
      n: 2,
      title: "Agent Workflows with LangGraph",
      tags: ["LangGraph", "Agentic AI"],
      core: ["Agent workflows", "LangGraph fundamentals", "State and conditional routing"],
      stretch: ["Persist graph state between runs"],
      deliverable: "A LangGraph workflow with branching logic.",
    }),
    mission(P1, "may27", "MAY 2027", {
      n: 3,
      title: "MCP & External Integrations",
      tags: ["MCP", "Tool Calling"],
      core: ["MCP fundamentals", "External service integrations"],
      stretch: ["Write your own small MCP server"],
      deliverable: "An agent that uses an MCP-connected service.",
    }),
    mission(P1, "may27", "MAY 2027", {
      n: 4,
      title: "Human Approval, Permissions & Tool Security",
      tags: ["Security", "AI Agents", "React"],
      hours: 14,
      core: [
        "Human approval workflows",
        "Role-based tool permissions",
        "Retry and failure handling",
        "Prompt injection and tool security",
        "Approval UI in React/TS",
      ],
      stretch: ["Red-team your agent with 10 injection attempts"],
      deliverable: "AI Workflow Agent with human-in-the-loop approvals.",
    }),
    buffer(P1, "may27", "MAY 2027"),
  ],
};

const jun: Milestone = {
  id: "jun27",
  phaseId: P1,
  label: "JUNE 2027",
  title: "Production AI & Early Job Applications",
  goal: "Make AI applications reliable, safe, measurable and suitable for real-world use.",
  outcome: "A more reliable capstone with repeatable evaluations and monitoring.",
  tags: ["Production AI", "Evaluation", "Security", "Guardrails", "Observability", "Reliability"],
  frontend: ["Evaluation dashboard", "Cost & latency panels", "Graceful failure states"],
  notes: ["Start regular job applications and mock interviews this month."],
  weeks: [
    mission(P1, "jun27", "JUN 2027", {
      n: 1,
      title: "LLM & RAG Evaluation",
      tags: ["Evaluation", "Production AI"],
      core: [
        "LLM evaluation",
        "RAG evaluation",
        "Test datasets",
        "Hallucination and groundedness checks",
      ],
      deliverable: "A repeatable evaluation suite for the capstone.",
    }),
    mission(P1, "jun27", "JUN 2027", {
      n: 2,
      title: "Guardrails, Privacy & Data Access",
      tags: ["Guardrails", "Security"],
      core: [
        "Guardrails",
        "Prompt injection defence",
        "Role-based data access",
        "Privacy fundamentals",
      ],
      deliverable: "Guardrails and RBAC applied to capstone data.",
    }),
    mission(P1, "jun27", "JUN 2027", {
      n: 3,
      title: "Tracing, Cost & Latency Monitoring",
      tags: ["Observability"],
      core: [
        "Langfuse and tracing",
        "Cost monitoring",
        "Latency monitoring",
        "Logging and observability",
      ],
      deliverable: "Observable capstone with cost and latency dashboards.",
    }),
    mission(P1, "jun27", "JUN 2027", {
      n: 4,
      title: "CI Evaluations + Job Application Launch",
      tags: ["Reliability", "Career"],
      core: [
        "CI-based evaluation tests",
        "Send the first batch of job applications",
        "Complete a mock interview and collect feedback",
      ],
      deliverable: "Evals running in CI and an active application pipeline.",
    }),
    buffer(P1, "jun27", "JUN 2027"),
  ],
};

const julaug: Milestone = {
  id: "julaug27",
  phaseId: P1,
  label: "JULY – AUGUST 2027",
  title: "Deployment & Capstone Completion",
  goal: "Complete and demonstrate a production-style AI product.",
  outcome:
    "Enterprise AI Operations Copilot — deployed, documented and measured with real metrics.",
  tags: ["Docker", "Cloud", "CI/CD", "System Design", "Full-Stack AI", "Deployment"],
  frontend: ["Responsive production UI", "Audit history views", "Role-aware navigation"],
  notes: [
    "Use real, permitted workflows or safe mock data — never confidential data without authorization.",
    "Track actual project performance. Do not invent metrics.",
  ],
  weeks: [
    mission(P1, "julaug27", "JUL 2027", {
      n: 1,
      title: "Linux & Docker",
      tags: ["Docker", "Deployment"],
      core: ["Linux fundamentals", "Docker", "Containerise frontend and backend"],
      deliverable: "Capstone running locally in containers.",
    }),
    mission(P1, "julaug27", "JUL 2027", {
      n: 2,
      title: "Secrets, GitHub Actions & CI/CD",
      tags: ["CI/CD"],
      core: ["Environment variables and secrets", "GitHub Actions", "CI/CD fundamentals"],
      deliverable: "A green CI pipeline with tests and evals.",
    }),
    mission(P1, "julaug27", "JUL 2027", {
      n: 3,
      title: "Cloud Deployment (AWS or Azure)",
      tags: ["Cloud", "Deployment"],
      core: ["Choose AWS or Azure", "Deploy the frontend and backend"],
      deliverable: "Capstone reachable on a public URL.",
    }),
    mission(P1, "julaug27", "JUL 2027", {
      n: 4,
      title: "Cloud Logs, Monitoring & Troubleshooting",
      tags: ["Cloud", "Observability"],
      core: ["Cloud logs and monitoring", "Troubleshooting deployed applications"],
      deliverable: "A troubleshooting runbook for the capstone.",
    }),
    buffer(P1, "julaug27", "JUL 2027", 1),
    mission(P1, "julaug27", "AUG 2027", {
      n: 5,
      title: "System Design Fundamentals",
      tags: ["System Design"],
      core: ["System design fundamentals", "Draw the capstone architecture diagram"],
      deliverable: "Architecture diagram and design notes.",
    }),
    mission(P1, "julaug27", "AUG 2027", {
      n: 6,
      title: "Capstone Integration: Agents, Approvals & Audit",
      tags: ["Full-Stack AI", "AI Agents"],
      hours: 15,
      core: [
        "Integrate agents and tool calling",
        "Human approval and audit history",
        "Role-based access end to end",
      ],
      deliverable: "Feature-complete capstone.",
    }),
    mission(P1, "julaug27", "AUG 2027", {
      n: 7,
      title: "Ship the Enterprise AI Operations Copilot",
      tags: ["Deployment", "Full-Stack AI"],
      hours: 15,
      core: [
        "Production deployment of the capstone",
        "Technical documentation",
        "Record real cost, latency and evaluation metrics",
      ],
      deliverable: "Capstone deployed and documented.",
    }),
    mission(P1, "julaug27", "AUG 2027", {
      n: 8,
      title: "Python DSA & SQL Sprint",
      tags: ["DSA", "SQL"],
      core: ["Python DSA practice", "SQL exercises"],
      deliverable: "A logged set of solved problems with notes.",
    }),
    buffer(P1, "julaug27", "AUG 2027", 2),
  ],
};

const sepnov: Milestone = {
  id: "sepnov27",
  phaseId: P1,
  label: "SEPTEMBER – NOVEMBER 2027",
  title: "Interviews & Career Transition",
  goal: "Convert the skills and portfolio into a professional Applied AI Engineer opportunity.",
  outcome:
    "Interview-ready across DSA, backend, AI architecture and your capstone. November is a target window, not a guaranteed offer date.",
  tags: ["DSA", "System Design", "Career"],
  notes: [
    "Target: ~100–120 DSA questions, ~30–40 SQL exercises, and an independent capstone walkthrough.",
  ],
  weeks: [
    mission(P1, "sepnov27", "SEP 2027", {
      n: 1,
      title: "Arrays, Strings, Hash Maps & Sets",
      tags: ["DSA"],
      core: ["Arrays and strings", "Hash maps and sets"],
      deliverable: "Pattern notes + solved problem log.",
    }),
    mission(P1, "sepnov27", "SEP 2027", {
      n: 2,
      title: "Two Pointers, Sliding Window, Stacks & Queues",
      tags: ["DSA"],
      core: ["Two pointers", "Sliding window", "Stacks and queues"],
      deliverable: "Pattern notes + solved problem log.",
    }),
    mission(P1, "sepnov27", "SEP 2027", {
      n: 3,
      title: "Linked Lists & Binary Search",
      tags: ["DSA"],
      core: ["Linked lists", "Binary search"],
      deliverable: "Pattern notes + solved problem log.",
    }),
    mission(P1, "sepnov27", "SEP 2027", {
      n: 4,
      title: "Trees, Recursion & Basic DP",
      tags: ["DSA"],
      core: ["Trees and recursion", "Basic dynamic programming"],
      deliverable: "Pattern notes + solved problem log.",
    }),
    buffer(P1, "sepnov27", "SEP 2027", 1),
    mission(P1, "sepnov27", "OCT 2027", {
      n: 5,
      title: "Backend, REST & SQL Interview Drills",
      tags: ["Backend Engineering", "SQL"],
      core: ["OOP", "REST API design", "Backend fundamentals", "SQL practice"],
      deliverable: "Answer bank for backend interviews.",
    }),
    mission(P1, "sepnov27", "OCT 2027", {
      n: 6,
      title: "AI, RAG & Agent Architecture Interviews",
      tags: ["RAG", "AI Agents"],
      core: ["AI architecture", "RAG architecture", "Agent workflows"],
      deliverable: "Whiteboard-ready AI architecture explanations.",
    }),
    mission(P1, "sepnov27", "OCT 2027", {
      n: 7,
      title: "System Design & Capstone Walkthrough",
      tags: ["System Design", "Career"],
      core: [
        "System design practice",
        "Capstone architecture walkthrough",
        "Security, evaluation & deployment trade-offs",
      ],
      deliverable: "A confident 10-minute capstone walkthrough.",
    }),
    mission(P1, "sepnov27", "OCT 2027", {
      n: 8,
      title: "Mock Interview & Application Sprint",
      tags: ["Career"],
      core: [
        "Two mock interviews with feedback",
        "Tailor resume versions",
        "Follow up on applications",
      ],
      deliverable: "Updated application tracker and feedback log.",
    }),
    buffer(P1, "sepnov27", "OCT 2027", 2),
    mission(P1, "sepnov27", "NOV 2027", {
      n: 9,
      title: "Transition Window: Interviews & Follow-ups",
      tags: ["Career"],
      core: [
        "Prepare for scheduled interview rounds",
        "Follow up with recruiters",
        "Reflect and refine your pitch",
      ],
      deliverable: "Active interview pipeline for Applied AI roles.",
    }),
    buffer(P1, "sepnov27", "NOV 2027", 3),
  ],
};

export const PHASES: Phase[] = [
  {
    id: P0,
    code: "PHASE 0",
    name: "Foundation Audit",
    period: "21 Nov – 15 Dec 2026",
    heading: "REBUILD ONLY WHAT NEEDS REBUILDING.",
    description:
      "You already have full-stack development exposure. Audit your existing knowledge, identify weaknesses and repair the gaps instead of repeating everything from scratch.",
    milestones: [audit],
  },
  {
    id: PC,
    code: "PHASE 0.5",
    name: "Engineering Core",
    period: "Dec 2026 – Jan 2027",
    heading: "STRENGTHEN YOUR ENGINEERING CORE.",
    description:
      "Professional Python, essential ML and transformer concepts — ending with a small, working and demonstrable LLM application.",
    milestones: [dec, jan],
  },
  {
    id: P1,
    code: "PHASE 1",
    name: "Applied AI Engineering",
    period: "Feb – Nov 2027",
    heading: "FROM SOFTWARE DEVELOPER TO APPLIED AI ENGINEER.",
    description:
      "Monthly milestones and weekly missions from backend engineering through RAG, agents, production AI, deployment and interviews.",
    milestones: [feb, mar, apr, may, jun, julaug, sepnov],
  },
];

export const MILESTONES: Milestone[] = PHASES.flatMap((p) => p.milestones);
export const ALL_WEEKS: Week[] = MILESTONES.flatMap((m) => m.weeks);
export const MISSION_WEEKS: Week[] = ALL_WEEKS.filter((w) => w.kind === "mission");

export const getWeek = (id: string) => ALL_WEEKS.find((w) => w.id === id);
export const getMilestone = (id: string) => MILESTONES.find((m) => m.id === id);
export const getPhase = (id: string) => PHASES.find((p) => p.id === id);

export const coreTasks = (w: Week) => w.sections.flatMap((s) => s.tasks);
