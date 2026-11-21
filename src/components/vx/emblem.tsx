import { useId } from "react";

import { cn } from "@/lib/utils";

/** Precision Varma 27 — Mission 2027 monogram emblem: interlocking V + 7 crest with lime mission beacon. */
export function VxEmblem({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  const bg = `v27-bg-${uid}`;
  const glow = `v27-glow-${uid}`;
  const orange = `v27-orange-${uid}`;
  const rim = `v27-rim-${uid}`;
  return (
    <svg viewBox="0 0 64 64" fill="none" className={cn("size-10", className)} aria-hidden>
      <defs>
        <linearGradient id={bg} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E2B48" />
          <stop offset="100%" stopColor="#101829" />
        </linearGradient>
        <radialGradient id={glow} cx="50" cy="14" r="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF702E" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#FF702E" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={orange} x1="39" y1="18" x2="46" y2="47" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF8A4C" />
          <stop offset="45%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--primary-deep)" />
        </linearGradient>
        <linearGradient id={rim} x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.35" />
          <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.28" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="58" height="58" rx="16" fill={`url(#${bg})`} />
      <rect x="3" y="3" width="58" height="58" rx="16" fill={`url(#${glow})`} />
      <rect
        x="3.75"
        y="3.75"
        width="56.5"
        height="56.5"
        rx="15.25"
        stroke={`url(#${rim})`}
        strokeWidth="1.5"
      />
      <path d="M10 19H17.2L23 35.5L28.8 19H36L26.4 46H19.6Z" fill="var(--card)" />
      <path d="M39.8 19H53.8L44.2 46H37L44.3 25.5H37.5Z" fill={`url(#${orange})`} />
      <rect x="46.8" y="39.2" width="6.8" height="6.8" rx="2" fill="var(--lime)" />
    </svg>
  );
}

export const Varma27Emblem = VxEmblem;

export function Wordmark({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <VxEmblem
        className={cn(
          "shrink-0 drop-shadow-[0_6px_14px_color-mix(in_oklab,var(--ink)_20%,transparent)]",
          compact ? "size-8" : "size-10",
        )}
      />
      <div className="leading-none">
        <div className="font-display text-lg font-bold tracking-[0.02em] text-foreground">
          VARMA <span className="text-primary">27</span>
        </div>
        <div className="hud-label mt-1 !text-[9px] !tracking-[0.28em]">Mission 2027</div>
      </div>
    </div>
  );
}
