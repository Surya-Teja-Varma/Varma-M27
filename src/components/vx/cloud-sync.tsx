import { AlertCircle, Cloud, CloudOff, Loader2, LogOut, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { actions, useCloudSync } from "@/lib/mission-store";
import { cn } from "@/lib/utils";

/** Compact Firebase Auth + Cloud Sync status row for sidebar footer & mobile sheet. */
export function CloudAccountWidget({ onAction }: { onAction?: () => void }) {
  const sync = useCloudSync();
  const [signingIn, setSigningIn] = useState(false);

  if (!sync.configured) return null;

  const handleSignIn = async () => {
    setSigningIn(true);
    const res = await actions.signInWithGoogle();
    setSigningIn(false);
    if (!res.ok) {
      toast.error("Sign-in failed", { description: res.error });
    } else {
      toast.success("Signed in to Firebase", {
        description: "Your VARMA 27 progress now syncs across devices.",
      });
      onAction?.();
    }
  };

  const handleSignOut = async () => {
    await actions.signOut();
    toast("Signed out", { description: "Switched to local browser storage." });
    onAction?.();
  };

  if (!sync.user) {
    return (
      <button
        type="button"
        disabled={signingIn || !sync.authReady}
        onClick={() => void handleSignIn()}
        className="press group flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-primary/25 bg-primary-soft/60 px-3 text-xs font-semibold text-primary-deep transition-[background-color,border-color,box-shadow] duration-200 hover:border-primary/45 hover:bg-primary-soft disabled:opacity-60"
      >
        <span className="flex items-center gap-2">
          {signingIn ? (
            <Loader2 className="size-3.5 animate-spin text-primary" />
          ) : (
            <Cloud className="size-3.5 text-primary transition-transform duration-200 group-hover:scale-110" />
          )}
          <span>{signingIn ? "Connecting…" : "Sign in to sync"}</span>
        </span>
        <span className="rounded bg-card/85 px-1.5 py-0.5 font-display text-[9px] uppercase tracking-wider text-muted-foreground">
          Google
        </span>
      </button>
    );
  }

  const label = sync.user.displayName?.split(" ")[0] || sync.user.email?.split("@")[0] || "Account";
  const initial = label.slice(0, 1).toUpperCase();

  return (
    <div className="flex h-11 items-center gap-2.5 rounded-lg border bg-card px-2.5 shadow-panel">
      {sync.user.photoURL ? (
        <img
          src={sync.user.photoURL}
          alt={label}
          referrerPolicy="no-referrer"
          className="size-7 shrink-0 rounded-full border object-cover"
        />
      ) : (
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-xs font-bold text-primary-deep">
          {initial}
        </span>
      )}
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-xs font-semibold text-foreground">{label}</p>
        <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
          {sync.status === "syncing" || sync.status === "loading" ? (
            <>
              <Loader2 className="size-2.5 animate-spin text-primary" />
              <span>{sync.status === "loading" ? "Loading cloud…" : "Syncing…"}</span>
            </>
          ) : sync.status === "error" ? (
            <button
              type="button"
              onClick={() => void actions.retrySync()}
              className="inline-flex items-center gap-1 font-medium text-destructive hover:underline"
            >
              <RefreshCw className="size-2.5" /> Sync error · Retry
            </button>
          ) : sync.status === "offline" ? (
            <>
              <CloudOff className="size-2.5 text-primary-deep" />
              <span>Offline cached</span>
            </>
          ) : (
            <>
              <span className="size-1.5 rounded-full bg-lime-ink" aria-hidden />
              <span className="text-lime-ink font-medium">Cloud synced</span>
            </>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        title="Sign out"
        aria-label="Sign out of Firebase"
        className="press grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-subtle transition-colors hover:bg-surface hover:text-foreground"
      >
        <LogOut className="size-3.5" />
      </button>
    </div>
  );
}

/** Slim top status banner shown only while loading cloud data, offline, or when a sync error needs attention. */
export function CloudStatusBanner() {
  const sync = useCloudSync();
  const [retrying, setRetrying] = useState(false);

  if (!sync.configured || !sync.user) return null;
  if (sync.status !== "loading" && sync.status !== "error" && sync.status !== "offline") {
    return null;
  }

  return (
    <div
      role={sync.status === "error" ? "alert" : "status"}
      className={cn(
        "mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs",
        sync.status === "error"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : sync.status === "offline"
            ? "border-primary/25 bg-primary-soft/60 text-primary-deep"
            : "border-cyan/30 bg-cyan-soft/80 text-cyan-ink",
      )}
    >
      <div className="flex items-center gap-2">
        {sync.status === "loading" ? (
          <Loader2 className="size-4 shrink-0 animate-spin" />
        ) : sync.status === "offline" ? (
          <CloudOff className="size-4 shrink-0" />
        ) : (
          <AlertCircle className="size-4 shrink-0" />
        )}
        <span className="font-medium">
          {sync.status === "loading"
            ? "Loading your VARMA 27 mission state from Cloud Firestore…"
            : sync.status === "offline"
              ? "You are offline — changes are cached locally and will sync automatically when online."
              : (sync.error ?? "Could not sync latest changes with Firebase.")}
        </span>
      </div>
      {sync.status === "error" ? (
        <Button
          variant="outline"
          size="sm"
          disabled={retrying}
          onClick={async () => {
            setRetrying(true);
            const ok = await actions.retrySync();
            setRetrying(false);
            if (ok) toast.success("Cloud sync restored");
          }}
        >
          <RefreshCw className={cn(retrying && "animate-spin")} /> Retry sync
        </Button>
      ) : null}
    </div>
  );
}
