# VARMA 27 — Mission 2027

**Learn. Build. Evolve.**

A personal mission-control dashboard designed to guide the transition to **Applied AI Engineer (Full-Stack AI Product Engineering)** by November 2027, backed by **Firebase Authentication** and **Cloud Firestore** real-time persistence.

## Core Modules

- **Mission Control (`/`)** — Career destination, active mission spotlight, live radial telemetry, weekly streak chain, foundation audit summary, mission route, skill matrix overview, and portfolio pipeline.
- **Foundation Audit (`/foundation-audit`)** — Phase 0 diagnostic assessment across 24 core topics with targeted revision tracking and an automated repair list.
- **Learning Roadmap (`/roadmap`)** — Connected vertical timeline across Phases 0, 0.5, and 1 with collapsible monthly milestones, weekly missions, custom mission creation/editing/deletion, overdue filtering, and buffer blocks.
- **Weekly Mission Drawer** — Reusable mission workspace with collapsible core/stretch task groups, deliverable confirmation, learning notes, weekly reflections, target date/priority/effort metadata, completion celebration, and carry-forward buffer workflows.
- **Skill Matrix (`/skills`)** — 15 Applied AI engineering tracks + custom skills, self-assessed from _Not started_ to _Confident_ with search, filtering, and roadmap links.
- **Projects & Portfolio (`/projects`)** — 6 built-in full-stack AI projects (culminating in _Enterprise AI Operations Copilot_) + custom portfolio project CRUD, detail modal, linked weekly missions, and real Demo & GitHub URLs.
- **DSA & Interview Prep (`/interview-prep`)** — Gradual DSA & SQL counters, `Asia/Kolkata` weekly engineering habit grid with history, topic & interview calibration checklists, and a full job application tracker.
- **Achievements (`/achievements`)** — Weekly streak chains, live progress toward locked milestones, verified IST completion log, and JSON backup export/import.

## Architecture

- **Framework**: TanStack Start + TanStack Router + React 19 + TypeScript + Tailwind CSS v4
- **Firebase Cloud Backend**:
  - Singleton initialization in `src/lib/firebase.ts` (Auth, Firestore with offline persistent multi-tab cache, optional Analytics)
  - Auth & Firestore CRUD + `onSnapshot` real-time sync in `src/lib/firebase-service.ts`
  - Firestore document path: `users/{uid}/mission/state` and `users/{uid}/profile/meta`
  - Owner-only security rules in `firestore.rules`
- **Rules**: Pure progress, completion, streak, achievement, `Asia/Kolkata` timezone, and state sanitization logic in `src/lib/progress.ts`
- **State Store**: Single `useSyncExternalStore` store in `src/lib/mission-store.ts` uniting Firestore real-time sync with offline-first `localStorage` caching

## Environment Setup

Copy `.env.example` to `.env.local` and fill in your Firebase Web App credentials:

```bash
cp .env.example .env.local
```

## Development & Verification

```bash
npm install
npm run dev
npx tsc --noEmit
npm test
npm run lint
npm run build
```
