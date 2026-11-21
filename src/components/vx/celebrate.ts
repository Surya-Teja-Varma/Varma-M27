import { useSyncExternalStore } from "react";
import { toast } from "sonner";

import { ACHIEVEMENTS } from "@/lib/progress";

export function announceAchievements(ids: string[], delay = 1400) {
  ids.forEach((id, i) => {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    window.setTimeout(
      () => {
        toast.success(`Achievement unlocked — ${a.name}`, { description: a.description });
      },
      delay + i * 500,
    );
  });
}

/* The most recently completed week, so its streak block can play a one-shot celebration. */
let recent: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function markRecentlyCompleted(weekId: string) {
  recent = weekId;
  emit();
  window.setTimeout(() => {
    if (recent === weekId) {
      recent = null;
      emit();
    }
  }, 9000);
}

export function useRecentCompletion() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => recent,
    () => null,
  );
}
