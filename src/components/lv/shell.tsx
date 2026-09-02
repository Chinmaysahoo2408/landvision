import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  Brain,
  Database,
  FileText,
  Globe2,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  ScrollText,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ROLE_LABEL, useLV } from "@/lib/lv/store";
import type { Role } from "@/lib/lv/types";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
}

const MAIN: NavItem[] = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/projects", label: "Projects", icon: Activity },
  { to: "/app/gis", label: "GIS Risk Map", icon: Map },
  { to: "/app/insights", label: "AI Insights", icon: Sparkles },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/alerts", label: "Alerts", icon: Bell },
  { to: "/app/reports", label: "Reports", icon: FileText },
];

const ADMIN: NavItem[] = [
  { to: "/app/data", label: "Data Management", icon: Database, roles: ["ADMIN"] },
  { to: "/app/model", label: "Model Intelligence", icon: Brain, roles: ["ADMIN", "DECISION_MAKER"] },
  { to: "/app/users", label: "Users", icon: Users, roles: ["ADMIN"] },
  { to: "/app/audit", label: "Audit Logs", icon: ScrollText, roles: ["ADMIN"] },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

function NavList({ items, role, onNavigate }: { items: NavItem[]; role: Role; onNavigate: () => void }) {
  return (
    <ul className="space-y-1">
      {items
        .filter((i) => !i.roles || i.roles.includes(role))
        .map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onNavigate}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
              activeProps={{
                className:
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm bg-card text-foreground border border-border font-medium",
              }}
              activeOptions={{ exact: false }}
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          </li>
        ))}
    </ul>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { session, logout, alerts, ready } = useLV();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (ready && !session) navigate({ to: "/login" });
  }, [ready, session, navigate]);

  useEffect(() => setOpen(false), [pathname]);

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Verifying session…</p>
      </div>
    );
  }

  const newAlerts = alerts.filter((a) => a.status === "New").length;

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-border bg-sidebar transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link to="/" className="flex items-center gap-2">
            <Globe2 className="size-5 text-primary" aria-hidden />
            <span className="font-display text-sm font-bold tracking-wide text-foreground">
              LANDVISION AI
            </span>
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation">
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>
        <nav className="flex h-[calc(100vh-4rem)] flex-col justify-between overflow-y-auto p-4">
          <div className="space-y-6">
            <div>
              <p className="mb-2 px-3 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                Government Portal
              </p>
              <NavList items={MAIN} role={session.role} onNavigate={() => setOpen(false)} />
            </div>
            <div>
              <p className="mb-2 px-3 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                Administration
              </p>
              <NavList items={ADMIN} role={session.role} onNavigate={() => setOpen(false)} />
            </div>
          </div>
          <div className="panel mt-6 p-3">
            <p className="text-xs font-semibold text-foreground">{session.name}</p>
            <p className="text-[11px] text-muted-foreground">{ROLE_LABEL[session.role]}</p>
            <p className="text-[11px] text-muted-foreground">
              {session.district ?? session.state ?? "National scope"}
            </p>
            <button
              onClick={() => {
                logout();
                navigate({ to: "/login" });
              }}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-card"
            >
              <LogOut className="size-3.5" aria-hidden /> Sign out
            </button>
          </div>
        </nav>
      </aside>

      {open ? (
        <div
          className="fixed inset-0 z-40 bg-background/80 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
              <Menu className="size-5 text-foreground" />
            </button>
            <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground sm:flex">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden />
              Predictive governance mode · synthetic dataset
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/app/alerts"
              className="relative rounded-md border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={`Alerts, ${newAlerts} unread`}
            >
              <Bell className="size-4" />
              {newAlerts > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 grid size-4.5 min-w-4.5 place-items-center rounded-full bg-risk-critical px-1 text-[10px] font-bold text-primary-foreground">
                  {newAlerts}
                </span>
              ) : null}
            </Link>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-foreground">{session.name}</p>
              <p className="text-[11px] text-muted-foreground">{ROLE_LABEL[session.role]}</p>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
