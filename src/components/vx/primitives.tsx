import { Check } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import type { Tone } from "@/data/types";
import type { WeekStatus } from "@/lib/progress";
import { cn } from "@/lib/utils";

export const TONE_CHIP: Record<Tone, string> = {
  orange: "bg-primary-soft text-primary-deep border-primary/20",
  lime: "bg-lime-soft text-lime-ink border-lime-ink/20",
  cyan: "bg-cyan-soft text-cyan-ink border-cyan/30",
  violet: "bg-violet-soft text-violet-ink border-violet/25",
  navy: "bg-surface text-foreground border-border",
};

export const TONE_DOT: Record<Tone, string> = {
  orange: "bg-primary",
  lime: "bg-lime",
  cyan: "bg-cyan",
  violet: "bg-violet",
  navy: "bg-ink",
};

const TAG_TONE: Record<string, Tone> = {
  Python: "orange",
  "Backend Engineering": "cyan",
  FastAPI: "cyan",
  "Async Python": "orange",
  PostgreSQL: "cyan",
  SQL: "cyan",
  Authentication: "violet",
  Testing: "violet",
  "LLM Engineering": "orange",
  "Generative AI": "violet",
  "Structured Outputs": "violet",
  "Tool Calling": "orange",
  "Streaming UI": "cyan",
  React: "cyan",
  TypeScript: "violet",
  JavaScript: "orange",
  Embeddings: "violet",
  "Vector Search": "cyan",
  RAG: "cyan",
  Retrieval: "cyan",
  Evaluation: "lime",
  "AI Agents": "orange",
  "Agentic AI": "orange",
  LangGraph: "violet",
  MCP: "violet",
  Security: "navy",
  "Production AI": "lime",
  Guardrails: "navy",
  Observability: "lime",
  Reliability: "lime",
  Docker: "cyan",
  Cloud: "cyan",
  "CI/CD": "violet",
  "System Design": "violet",
  "Full-Stack AI": "orange",
  Deployment: "cyan",
  DSA: "orange",
  Career: "navy",
  Buffer: "lime",
};

export function tagTone(tag: string): Tone {
  if (TAG_TONE[tag]) return TAG_TONE[tag];
  const h = [...tag].reduce((a, c) => a + c.charCodeAt(0), 0);
  return h % 2 ? "cyan" : "violet";
}

export function Tag({
  children,
  tone,
  className,
}: {
  children: string;
  tone?: Tone;
  className?: string;
}) {
  const t = tone ?? tagTone(children);
  return (
    <span
      className={cn(
        "group/tag inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-5 transition-[transform,box-shadow,border-color] duration-200 ease-vx hover:-translate-y-px hover:shadow-[0_4px_10px_-6px_color-mix(in_oklab,var(--ink)_35%,transparent)]",
        TONE_CHIP[t],
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full transition-transform duration-200 group-hover/tag:scale-125",
          TONE_DOT[t],
        )}
        aria-hidden
      />
      {children}
    </span>
  );
}

const STATUS_META: Record<WeekStatus, { label: string; cls: string }> = {
  upcoming: { label: "Upcoming", cls: "bg-surface text-muted-foreground border-border" },
  "in-progress": {
    label: "In progress",
    cls: "bg-primary-soft text-primary-deep border-primary/25",
  },
  completed: { label: "Completed", cls: "bg-lime text-ink border-lime-ink/25" },
  buffer: { label: "Buffer / Catch-up", cls: "bg-cyan-soft text-cyan-ink border-cyan/30" },
};

export function StatusPill({ status, className }: { status: WeekStatus; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-display text-[10px] font-semibold uppercase tracking-[0.14em]",
        m.cls,
        className,
      )}
    >
      {status === "completed" ? <Check className="size-3" strokeWidth={3} /> : null}
      {status === "in-progress" ? (
        <span className="size-1.5 animate-pulse rounded-full bg-primary" />
      ) : null}
      {m.label}
    </span>
  );
}

export function ProgressBar({
  value,
  tone = "orange",
  className,
}: {
  value: number;
  tone?: "orange" | "lime";
  className?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "animate-grow-x h-full rounded-full transition-[width,background-color] duration-700 ease-vx",
          tone === "lime" || pct === 100
            ? "bg-lime shadow-[0_0_10px_color-mix(in_oklab,var(--lime)_70%,transparent)]"
            : "bg-gradient-primary",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  action,
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <p className="hud-label flex items-center gap-2">
          <span className="h-px w-5 bg-primary" aria-hidden />
          {eyebrow}
        </p>
        <h2 className="mt-1.5 text-xl font-bold text-foreground sm:text-2xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  code,
  title,
  description,
  aside,
}: {
  code: string;
  title: string;
  description: string;
  aside?: ReactNode;
}) {
  return (
    <header className="panel hud-corners relative mb-6 overflow-hidden bg-gradient-hero p-6 sm:p-8">
      <div className="hud-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(90deg,transparent,black)]" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="hud-label text-primary-deep">{code}</p>
          <h1 className="mt-2 text-3xl font-bold leading-[1.05] sm:text-4xl lg:text-[2.75rem]">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
        {aside}
      </div>
    </header>
  );
}

export function BigCheck({
  checked,
  onChange,
  label,
  disabled,
  tone = "orange",
  children,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
  tone?: "orange" | "lime";
  children?: ReactNode;
}) {
  // Only celebrate a change the user made — never on first render.
  const prev = useRef(checked);
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    if (prev.current !== checked && checked) setFlash((k) => k + 1);
    prev.current = checked;
  }, [checked]);

  return (
    <label
      className={cn(
        "group relative flex min-h-12 cursor-pointer items-center gap-3 overflow-hidden rounded-lg border px-3 py-2.5",
        "transition-[background-color,border-color,box-shadow,transform] duration-300 ease-vx active:scale-[0.995]",
        checked
          ? "border-lime-ink/30 bg-lime-soft shadow-[inset_3px_0_0_var(--lime-ink)]"
          : "border-border bg-card hover:border-primary/40 hover:bg-primary-soft/30",
        disabled && "cursor-default active:scale-100",
      )}
    >
      {flash ? (
        <span
          key={flash}
          aria-hidden
          className="animate-sweep pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-lime/45 to-transparent"
        />
      ) : null}
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span
        className={cn(
          "relative grid size-6 shrink-0 place-items-center rounded-md border-2",
          "transition-[background-color,border-color,transform,box-shadow] duration-200 ease-vx group-active:scale-90",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2",
          checked
            ? "border-lime-ink bg-lime shadow-[0_0_0_3px_color-mix(in_oklab,var(--lime)_35%,transparent)]"
            : tone === "lime"
              ? "border-subtle bg-card"
              : "border-subtle bg-card group-hover:border-primary",
        )}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="var(--ink)"
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M5 12.5 10 17 19 7.5"
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: checked ? 0 : 1,
              transition: `stroke-dashoffset ${checked ? 320 : 160}ms var(--ease-out) ${checked ? 60 : 0}ms`,
            }}
          />
        </svg>
      </span>
      <span
        className={cn(
          "relative flex-1 text-sm transition-colors duration-200",
          checked ? "text-foreground" : "text-foreground",
        )}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Counts smoothly to a new value instead of jumping; instant under reduced motion. */
export function useAnimatedNumber(value: number, duration = 900) {
  const [display, setDisplay] = useState(value);
  const currentRef = useRef(0);
  useIsoLayoutEffect(() => {
    const start = currentRef.current;
    if (start === value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      currentRef.current = value;
      setDisplay(value);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      const next = start + (value - start) * eased;
      currentRef.current = next;
      setDisplay(next);
      if (k < 1) raf = requestAnimationFrame(tick);
      else currentRef.current = value;
    };
    setDisplay(start);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

export function AnimatedNumber({
  value,
  decimals,
  className,
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const n = useAnimatedNumber(value);
  const precision = decimals ?? (Number.isInteger(value) ? 0 : 1);
  const formatted = precision > 0 ? Number(n.toFixed(precision)).toString() : String(Math.round(n));
  return <span className={className}>{formatted}</span>;
}

export function RadialProgress({
  value,
  size = 200,
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  label: string;
  sublabel?: string;
}) {
  const stroke = 14;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, value));
  const ticks = Array.from({ length: 48 });
  const gid = `vx-ring-${useId().replace(/:/g, "")}`;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      {/* 3D base disc */}
      <div className="absolute inset-[10%] rounded-full bg-card shadow-lift" />
      <div className="absolute inset-[22%] rounded-full bg-gradient-to-b from-surface to-card shadow-[inset_0_2px_8px_color-mix(in_oklab,var(--ink)_10%,transparent)]" />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute -rotate-90"
        aria-hidden
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="70%" stopColor="var(--primary-deep)" />
            <stop offset="100%" stopColor="var(--lime)" />
          </linearGradient>
        </defs>
        {ticks.map((_, i) => {
          const a = (i / ticks.length) * Math.PI * 2;
          const r1 = size / 2 - 2;
          const r2 = size / 2 - 6;
          return (
            <line
              key={i}
              x1={size / 2 + Math.cos(a) * r1}
              y1={size / 2 + Math.sin(a) * r1}
              x2={size / 2 + Math.cos(a) * r2}
              y2={size / 2 + Math.sin(a) * r2}
              stroke={
                i / ticks.length < pct
                  ? pct >= 1
                    ? "var(--lime-ink)"
                    : "var(--primary)"
                  : "var(--border)"
              }
              strokeWidth={1.5}
              style={{ transition: `stroke 300ms ease ${i * 12}ms` }}
            />
          );
        })}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={
            {
              "--vx-c": c,
              transition:
                "stroke-dashoffset var(--dur-progress) var(--ease-out), opacity 300ms ease",
              animation: "vx-ring-in 1100ms var(--ease-out) 200ms backwards",
            } as CSSProperties
          }
          opacity={pct === 0 ? 0 : 1}
        />
      </svg>
      <div className="relative text-center">
        <div className="font-display text-4xl font-bold tabular text-foreground">
          <AnimatedNumber value={Math.round(pct * 100)} />
          <span className="text-lg text-muted-foreground">%</span>
        </div>
        <div className="hud-label mt-0.5">{label}</div>
        {sublabel ? <div className="mt-1 text-[11px] text-subtle">{sublabel}</div> : null}
      </div>
    </div>
  );
}
