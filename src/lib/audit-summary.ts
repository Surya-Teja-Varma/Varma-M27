import { AUDIT_ITEMS } from "@/data/audit";
import type { MissionState } from "./progress";

export function summarizeAudit(state: MissionState) {
  const total = AUDIT_ITEMS.length;
  const counts = { confident: 0, revision: 0, practice: 0, notdone: 0 };
  let assessed = 0;
  let repaired = 0;
  const weak: typeof AUDIT_ITEMS = [];
  for (const item of AUDIT_ITEMS) {
    const a = state.audit[item.id];
    if (!a?.level) continue;
    assessed += 1;
    counts[a.level] += 1;
    if (a.level !== "confident") {
      if (a.revised) repaired += 1;
      else weak.push(item);
    }
  }
  const ready = counts.confident + repaired;
  return { total, assessed, counts, repaired, weak, readiness: total ? ready / total : 0 };
}
