import { Link } from "@tanstack/react-router";
import { ArrowRight, Globe2, Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { SampleDataBanner } from "./panels";
import { LanguageSelector, useTranslation } from "@/lib/i18n";

const LINK_BASE =
  "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground";
const LINK_ACTIVE =
  "rounded-md px-3 py-2 text-sm font-medium text-foreground bg-card";

export function PublicShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t } = useTranslation();

  const NAV = [
    { to: "/public", label: t.nav.dashboard, exact: true },
    { to: "/public/projects", label: t.nav.projects },
    { to: "/public/map", label: t.nav.gis },
    { to: "/public/notices", label: t.nav.documentation },
    { to: "/public/statistics", label: t.dashboard.totalProjects },
    { to: "/public/methodology", label: "SIH Methodology" },
    { to: "/public/impact", label: "Impact" },
    { to: "/public/about", label: "About" },
  ];

  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/public" className="flex items-center gap-2">
            <Globe2 className="size-5 text-primary" aria-hidden />
            <span className="font-display text-sm font-bold tracking-widest text-foreground">
              LANDVISION AI
            </span>
            <span className="hidden rounded-full border border-border bg-card px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase sm:inline">
              {t.nav.publicPortal}
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={LINK_BASE}
                activeProps={{ className: LINK_ACTIVE }}
                activeOptions={{ exact: n.exact ?? false }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <LanguageSelector />
            <Link
              to="/login"
              className="hidden items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card sm:inline-flex"
            >
              {t.nav.login}
            </Link>
            <button
              className="lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close navigation" : "Open navigation"}
            >
              {open ? (
                <X className="size-5 text-foreground" />
              ) : (
                <Menu className="size-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {open ? (
          <nav className="border-t border-border bg-background px-4 py-3 lg:hidden">
            <ul className="space-y-1">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link
                    to={n.to}
                    className={cn(LINK_BASE, "block")}
                    activeProps={{ className: cn(LINK_ACTIVE, "block") }}
                    activeOptions={{ exact: n.exact ?? false }}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/login"
                  className="mt-2 block rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground"
                >
                  Government Login
                </Link>
              </li>
            </ul>
          </nav>
        ) : null}
      </header>

      <SampleDataBanner />

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe2 className="size-5 text-primary" aria-hidden />
              <span className="font-display text-sm font-bold tracking-widest text-foreground">
                LANDVISION AI
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Public transparency portal for land acquisition projects —
              progress, notices and aggregate statistics for citizens.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Demonstration build. All figures are synthetic and not official
              government data.
            </p>
          </div>

          <PublicFooterCol
            title="Explore"
            links={[
              { label: "Projects", to: "/public/projects" },
              { label: "GIS Map", to: "/public/map" },
              { label: "Statistics", to: "/public/statistics" },
            ]}
          />
          <PublicFooterCol
            title="SIH Specifications"
            links={[
              { label: "SIH Methodology", to: "/public/methodology" },
              { label: "Governance Impact", to: "/public/impact" },
              { label: "Public Notices", to: "/public/notices" },
              { label: "About the platform", to: "/public/about" },
            ]}
          />

          <div>
            <p className="font-display text-sm font-semibold text-foreground">
              For officials
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Authorised officers can access the governance workspace with
              role-based controls.
            </p>
            <Link
              to="/login"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Government login <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          LandVision AI — public transparency portal · demonstration platform.
        </div>
      </footer>
    </div>
  );
}

function PublicFooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; to: string }[];
}) {
  return (
    <div>
      <p className="font-display text-sm font-semibold text-foreground">
        {title}
      </p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
