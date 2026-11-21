# VARMA 27 (Mission 2027) — Project Architecture

- Roadmap content lives in `src/data/*` as typed data; dynamic user-created missions, skills, and projects merge through pure selectors in `src/lib/progress.ts`.
- All progress rules (completion, streaks, achievements, stats, `Asia/Kolkata` timezone dates, state sanitization, URL validation) are pure functions in `src/lib/progress.ts`, covered by `src/test/progress.test.ts`; keep UI free of rule logic.
- Firebase singleton initialization lives in `src/lib/firebase.ts` and all Auth/Firestore operations live in `src/lib/firebase-service.ts` (document paths: `users/{uid}/mission/state` and `users/{uid}/profile/meta`, protected by owner-only `firestore.rules`).
- Application state persists via a single `useSyncExternalStore` store in `src/lib/mission-store.ts` (Cloud Firestore `onSnapshot` real-time sync + offline `localStorage` cache and JSON export/import).
- Any mission/week (built-in or custom) opens through the one shared drawer (`useMissionDrawer().openMission(id)`).
- Launch intro (`MissionIntro`) plays once per session; a head script adds `vx-intro-seen` before paint to avoid a flash on reloads.
