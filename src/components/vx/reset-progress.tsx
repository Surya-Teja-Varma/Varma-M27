import { Download, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { actions, useCloudSync } from "@/lib/mission-store";
import { cn } from "@/lib/utils";

export function ResetProgress({ className }: { className?: string }) {
  const sync = useCloudSync();
  const [busy, setBusy] = useState(false);

  const handleReset = async () => {
    setBusy(true);
    const ok = await actions.reset();
    setBusy(false);
    if (!ok && sync.user) {
      toast.error("Cloud reset failed", {
        description: "Local state reset, but Firebase could not be updated. Retry sync to push.",
      });
      return;
    }
    toast("Progress reset", {
      description: sync.user
        ? "VARMA 27 is back to day zero locally and in Firebase."
        : "VARMA 27 is back to day zero.",
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger
        className={cn(
          "press flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface hover:text-destructive",
          className,
        )}
      >
        <RotateCcw className="size-3.5" /> Reset mission progress
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">Reset all progress?</AlertDialogTitle>
          <AlertDialogDescription>
            This clears every completed mission, custom mission, task, audit rating, skill level,
            habit, project, note, and job entry
            {sync.user
              ? " in this browser and in your Firebase cloud record"
              : " saved in this browser"}
            . It can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep my progress</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => void handleReset()}
          >
            {busy ? "Resetting…" : "Reset everything"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Compact JSON backup export/import + reset controls for Achievements / settings areas. */
export function DataControls({ onAction }: { onAction?: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    const json = actions.exportSnapshot();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `varma-27-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exported", {
      description: `Saved varma-27-backup-${stamp}.json`,
    });
    onAction?.();
  };

  const handleImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const res = await actions.importSnapshot(text);
      if (res.ok) {
        toast.success("Backup restored", {
          description: "Your mission data has been safely imported and synced.",
        });
        onAction?.();
      } else {
        toast.error("Import failed", { description: res.error });
      }
    } catch {
      toast.error("Import failed", { description: "Could not read the selected file." });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Import mission backup JSON"
        onChange={(e) => void handleImport(e.target.files?.[0])}
      />
      <button
        type="button"
        onClick={exportBackup}
        className="press inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
      >
        <Download className="size-3.5" /> Export JSON
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="press inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
      >
        <Upload className="size-3.5" /> Import JSON
      </button>
      <ResetProgress className="w-auto" />
    </div>
  );
}
