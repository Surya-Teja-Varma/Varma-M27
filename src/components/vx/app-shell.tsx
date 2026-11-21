import { Link, useRouterState } from "@tanstack/react-router";
import {
  Award,
  Brain,
  Code2,
  FolderKanban,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  ScanSearch,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useMission } from "@/lib/mission-store";
import { computeStats, getAllWeeks } from "@/lib/progress";
import { cn } from "@/lib/utils";

import { CloudAccountWidget, CloudStatusBanner } from "./cloud-sync";
import { Wordmark } from "./emblem";
import { MissionDrawerProvider } from "./mission-drawer";
import { ProgressBar } from "./primitives";
import { ResetProgress } from "./reset-progress";

type NavTo =
  | "/"
  | "/foundation-audit"
  | "/roadmap"
  | "/skills"
  | "/projects"
  | "/interview-prep"
  | "/achievements";

const NAV: { to: NavTo; label: string; short: string; icon: LucideIcon }[] = [
  { to: "/", label: "Mission Control", short: "Control", icon: LayoutDashboard },
  { to: "/foundation-audit", label: "Foundation Audit", short: "Audit", icon: ScanSearch },
  { to: "/roadmap", label: "Learning Roadmap", short: "Roadmap", icon: MapIcon },
  { to: "/skills", label: "Skill Matrix", short: "Skills", icon: Brain },
  { to: "/projects", label: "Projects & Portfolio", short: "Projects", icon: FolderKanban },
  { to: "/interview-prep", label: "DSA & Interview Prep", short: "DSA", icon: Code2 },
  { to: "/achievements", label: "Achievements", short: "Awards", icon: Award },
];

function useActive() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (to: string) => (to === "/" ? path === "/" : path.startsWith(to));
}

const ITEM_H = 40; // h-10
const ITEM_GAP = 4; // space-y-1

function NavItem({
  item,
  onNavigate,
  sliding,
}: {
  item: (typeof NAV)[number];
  onNavigate?: () => void;
  sliding?: boolean;
}) {
  const isActive = useActive()(item.to);
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-[color,background-color] duration-200 ease-vx active:scale-[0.98]",
        isActive
          ? cn("text-primary-deep", !sliding && "bg-primary-soft")
          : "text-muted-foreground hover:bg-surface/80 hover:text-foreground",
      )}
    >
      {!sliding ? (
        <span
          className={cn(
            "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary transition-opacity",
            isActive ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />
      ) : null}
      <Icon
        className={cn(
          "relative size-[18px] transition-[color,transform] duration-200 ease-vx",
          isActive
            ? "text-primary"
            : "text-subtle group-hover:translate-x-0.5 group-hover:scale-110 group-hover:text-primary-deep",
        )}
      />
      <span className="relative">{item.label}</span>
    </Link>
  );
}

/** Desktop nav with one active pill that glides between items. */
function SlidingNav() {
  const isActive = useActive();
  const index = NAV.findIndex((n) => isActive(n.to));
  return (
    <div className="relative space-y-1">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-10 rounded-lg border border-primary/15 bg-primary-soft shadow-[0_6px_16px_-10px_var(--glow-orange)] transition-[transform,opacity] duration-300 ease-vx"
        style={{
          transform: `translateY(${Math.max(0, index) * (ITEM_H + ITEM_GAP)}px)`,
          opacity: index < 0 ? 0 : 1,
        }}
      >
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
      </span>
      {NAV.map((item) => (
        <NavItem key={item.to} item={item} sliding />
      ))}
    </div>
  );
}

function SidebarStatus() {
  const state = useMission();
  const s = computeStats(getAllWeeks(state), state);
  return (
    <div className="panel lift relative overflow-hidden p-3">
      <div className="hud-grid absolute inset-0 opacity-40" />
      <div className="relative">
        <p className="hud-label !text-[9px]">Destination</p>
        <p className="mt-0.5 font-display text-sm font-bold">Applied AI Engineer</p>
        <p className="text-[11px] text-muted-foreground">Target window · Nov 2027</p>
        <ProgressBar value={s.completion} className="mt-2 h-1.5" />
        <p className="mt-1.5 text-[11px] tabular text-muted-foreground">
          {s.completedWeeks}/{s.totalWeeks} missions · {Math.round(s.completion * 100)}%
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isActive = useActive();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const mobilePrimary = NAV.slice(0, 4);
  const moreActive = NAV.slice(4).some((n) => isActive(n.to));

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  return (
    <MissionDrawerProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-display focus:text-xs focus:font-semibold focus:uppercase focus:tracking-wider focus:text-primary-foreground focus:shadow-lift"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="vx-app-aside fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-sidebar/95 backdrop-blur lg:flex">
        <div className="px-5 pb-2.5 pt-4">
          <Link
            to="/"
            aria-label="VARMA 27 home"
            className="inline-block rounded-lg transition-transform duration-200 ease-vx hover:scale-[1.02] active:scale-[0.98]"
          >
            <Wordmark />
          </Link>
        </div>
        <nav className="scrollbar-none flex-1 overflow-y-auto px-3" aria-label="Main navigation">
          <p className="hud-label px-3 pb-1.5 pt-1.5 !text-[9px]">Navigation</p>
          <SlidingNav />
        </nav>
        <div className="space-y-2 p-3">
          <SidebarStatus />
          <CloudAccountWidget />
          <ResetProgress />
          <p className="px-3 pb-0.5 font-display text-[10px] uppercase tracking-[0.24em] text-subtle">
            Learn · Build · Evolve
          </p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="vx-app-aside sticky top-0 z-30 flex items-center justify-between border-b bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" aria-label="VARMA 27 home">
          <Wordmark compact />
        </Link>
        <span className="hud-label !text-[9px]">Learn · Build · Evolve</span>
      </header>

      <main id="main-content" className="vx-app-main min-h-screen pb-28 lg:pb-12 lg:pl-64">
        <div
          key={pathname}
          className="vx-page mx-auto w-full max-w-[1280px] px-4 pt-5 sm:px-6 lg:px-10 lg:pt-8"
        >
          <CloudStatusBanner />
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav
        className="vx-app-aside fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-2xl border bg-card/95 p-1.5 shadow-lift backdrop-blur lg:hidden"
        aria-label="Mobile navigation"
      >
        {mobilePrimary.map((item) => {
          const active = isActive(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-medium transition-[color,background-color,transform] duration-200 ease-vx active:scale-95",
                active ? "bg-primary-soft text-primary-deep" : "text-muted-foreground",
              )}
            >
              <Icon
                className={cn(
                  "size-5 transition-transform duration-300 ease-vx-spring",
                  active ? "-translate-y-0.5 text-primary" : "",
                )}
              />
              {item.short}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
          className={cn(
            "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-medium transition-[color,background-color,transform] duration-200 ease-vx active:scale-95",
            moreActive ? "bg-primary-soft text-primary-deep" : "text-muted-foreground",
          )}
        >
          <Menu className={cn("size-5", moreActive && "text-primary")} />
          More
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card p-4 pb-8"
        >
          <SheetTitle className="hud-label mb-3 px-1">All sections</SheetTitle>
          <div className="space-y-0.5">
            {NAV.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </div>
          <div className="mt-3 space-y-2 border-t pt-3">
            <CloudAccountWidget onAction={() => setMoreOpen(false)} />
            <ResetProgress />
          </div>
        </SheetContent>
      </Sheet>
    </MissionDrawerProvider>
  );
}
