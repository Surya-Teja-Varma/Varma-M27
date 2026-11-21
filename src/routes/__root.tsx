import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/vx/app-shell";
import { MissionIntro } from "@/components/vx/intro";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="panel hud-corners max-w-md p-8 text-center">
        <p className="hud-label text-primary-deep">Signal lost</p>
        <h1 className="mt-2 text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          This mission doesn&apos;t exist
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-gradient-primary px-5 font-display text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-glow transition-[transform,filter] duration-200 hover:-translate-y-px hover:brightness-105"
          >
            Back to Mission Control
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="panel hud-corners max-w-md p-8 text-center">
        <p className="hud-label text-primary-deep">VARMA 27 · Mission 2027</p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
          This page didn&apos;t load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something unexpected happened. You can try refreshing or head back to Mission Control.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-gradient-primary px-5 font-display text-xs font-semibold uppercase tracking-[0.12em] text-primary-foreground shadow-glow transition-[transform,filter] duration-200 hover:-translate-y-px hover:brightness-105"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-input bg-card px-4 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary-deep"
          >
            Mission Control
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VARMA 27 — Mission 2027 · Learn. Build. Evolve." },
      {
        name: "description",
        content:
          "VARMA 27 (Mission 2027) — a personal mission-control dashboard for becoming an Applied AI Engineer by November 2027.",
      },
      { name: "author", content: "VARMA 27" },
      { property: "og:title", content: "VARMA 27 — Mission 2027" },
      {
        property: "og:description",
        content: "Learn. Build. Evolve. The road to Applied AI Engineer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#F5F7FA" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Hides the launch overlay before paint when it already played this session.
// On a first entry it marks the app as waiting so it can glide in when the intro lifts.
const INTRO_GUARD = `try{document.documentElement.classList.add(sessionStorage.getItem('vx-intro-seen')==='1'?'vx-intro-seen':'vx-intro-playing')}catch(e){}`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_GUARD }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        <MissionIntro />
        <AppShell>
          <Outlet />
        </AppShell>
      </TooltipProvider>
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  );
}
