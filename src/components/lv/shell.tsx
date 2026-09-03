import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Brain,
  Building2,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Cpu,
  Database,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Gavel,
  GitCompare,
  Globe2,
  HandCoins,
  HeartHandshake,
  Hourglass,
  Info,
  LandPlot,
  Layers,
  LayoutDashboard,
  LineChart,
  LogOut,
  Map,
  MapPin,
  Menu,
  Network,
  Repeat,
  Scale,
  ScrollText,
  ServerCog,
  Settings,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
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
  badge?: string | number;
  roles?: Role[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Command Center",
    items: [
      { to: "/app/dashboard", label: "Overview Dashboard", icon: LayoutDashboard },
      { to: "/app/ai-prediction", label: "AI Prediction & Training", icon: Brain, badge: "AI Core" },
      { to: "/app/projects", label: "Projects Portfolio", icon: Activity },
      { to: "/app/predictor", label: "AI Delay Predictor", icon: Sparkles },
      { to: "/app/gis", label: "GIS Risk Intelligence", icon: Map },
      { to: "/app/timeline", label: "Timeline & Lifecycle", icon: CalendarClock },
    ],
  },
  {
    title: "Analytics & Spatial",
    items: [
      { to: "/app/district-analytics", label: "District Analytics", icon: MapPin },
      { to: "/app/state-analytics", label: "State Analytics", icon: Building2 },
      { to: "/app/compare", label: "Multi-Compare Tool", icon: GitCompare },
      { to: "/app/insights", label: "AI Portfolio Insights", icon: Brain },
      { to: "/app/explainable-ai", label: "Explainable AI (XAI)", icon: Scale },
      { to: "/app/analytics", label: "Benchmarking", icon: BarChart3 },
    ],
  },
  {
    title: "Acquisition Domains",
    items: [
      { to: "/app/legal", label: "Legal Disputes", icon: Gavel },
      { to: "/app/compensation", label: "Compensation Tracking", icon: HandCoins },
      { to: "/app/documentation", label: "Documentation & Titles", icon: FileCheck },
      { to: "/app/bottlenecks", label: "Administrative Bottlenecks", icon: Hourglass },
      { to: "/app/rr", label: "R&R Resettlement", icon: HeartHandshake },
      { to: "/app/possession", label: "Land Possession", icon: LandPlot },
      { to: "/app/stakeholders", label: "Stakeholder Index", icon: UserCheck },
      { to: "/app/land-price", label: "Land Price & Future Infra", icon: TrendingUp },
    ],
  },
  {
    title: "Action & Governance",
    items: [
      { to: "/app/alerts", label: "Smart Alerts", icon: Bell },
      { to: "/app/interventions", label: "Intervention Management", icon: ShieldAlert },
      { to: "/app/reports", label: "Reports & Exports", icon: FileSpreadsheet },
    ],
  },
  {
    title: "AI & Data Core",
    items: [
      { to: "/app/data", label: "FIR Analysis & Data Upload", icon: Database },
      { to: "/app/model", label: "ML Model Performance", icon: LineChart },
      { to: "/app/continuous-learning", label: "Continuous Learning", icon: Repeat },
      { to: "/app/api-center", label: "API & Govt Gateways", icon: Network },
    ],
  },
  {
    title: "Administration",
    items: [
      { to: "/app/admin-ai", label: "Admin AI / ML Center", icon: Cpu, roles: ["ADMIN"] },
      { to: "/app/users", label: "Users & Roles", icon: Users, roles: ["ADMIN"] },
      { to: "/app/audit", label: "Audit Trails", icon: ScrollText, roles: ["ADMIN"] },
      { to: "/app/settings", label: "System Settings", icon: Settings },
    ],
  },
];

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
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="size-2 animate-pulse rounded-full bg-primary" />
          Verifying secure government session…
        </div>
      </div>
    );
  }

  const unreadAlerts = alerts.filter((a) => a.status === "New").length;

  return (
    <div className="min-h-screen bg-background">
      {/* SIDEBAR */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-sidebar transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        {/* BRAND */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Globe2 className="size-4.5" aria-hidden />
            </span>
            <div>
              <span className="font-display text-sm font-bold tracking-wider text-foreground">
                LANDVISION AI
              </span>
              <span className="block text-[9px] font-medium tracking-widest text-primary uppercase">
                National Command Center
              </span>
            </div>
          </Link>
          <button
            className="rounded-md p-1.5 text-muted-foreground hover:bg-card lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* NAVIGATION GROUPS */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => {
            const visibleItems = group.items.filter(
              (i) => !i.roles || i.roles.includes(session.role),
            );
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
                  {group.title}
                </p>
                <ul className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={() => setOpen(false)}
                        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                        activeProps={{
                          className:
                            "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs bg-primary/10 text-primary border border-primary/20 font-semibold shadow-xs",
                        }}
                        activeOptions={{ exact: item.to === "/app/dashboard" }}
                      >
                        <span className="flex items-center gap-2.5">
                          <item.icon className="size-4 shrink-0" aria-hidden />
                          <span>{item.label}</span>
                        </span>
                        {item.to === "/app/alerts" && unreadAlerts > 0 ? (
                          <span className="grid size-4.5 place-items-center rounded-full bg-risk-critical text-[10px] font-bold text-white">
                            {unreadAlerts}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* PUBLIC PORTAL SHORTCUT */}
          <div className="pt-2">
            <p className="px-3 text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
              External & Presentation
            </p>
            <div className="mt-1 space-y-1">
              <Link
                to="/public"
                className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-card hover:text-foreground"
              >
                <Globe2 className="size-3.5 text-primary" /> Public Citizen Portal
              </Link>
              <Link
                to="/public/methodology"
                className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-card hover:text-foreground"
              >
                <Info className="size-3.5 text-primary" /> SIH Methodology & Specs
              </Link>
              <Link
                to="/public/impact"
                className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-card hover:text-foreground"
              >
                <TrendingUp className="size-3.5 text-primary" /> Governance Impact Analysis
              </Link>
            </div>
          </div>
        </nav>

        {/* USER PROFILE & LOGOUT */}
        <div className="border-t border-border p-3">
          <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-foreground">{session.name}</p>
                <p className="text-[11px] font-medium text-primary">{ROLE_LABEL[session.role]}</p>
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {session.district ? `${session.district}, ${session.state}` : session.state ?? "National Jurisdiction"}
                </p>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate({ to: "/login" });
                }}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Sign out"
              >
                <LogOut className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {open ? (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      {/* MAIN VIEWPORT */}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md border border-border p-1.5 text-foreground lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>
            <div className="hidden items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground sm:flex">
              <span className="size-2 animate-pulse rounded-full bg-primary" aria-hidden />
              <span>AI Engine Active · Synthetic Data Demonstration</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/app/predictor"
              className="hidden items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary border border-primary/20 hover:bg-primary/15 sm:inline-flex"
            >
              <Sparkles className="size-3.5" />
              Predict Delay Risk
            </Link>
            <Link
              to="/app/alerts"
              className="relative rounded-md border border-border bg-card p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={`Alerts, ${unreadAlerts} unread`}
            >
              <Bell className="size-4" />
              {unreadAlerts > 0 ? (
                <span className="absolute -top-1.5 -right-1.5 grid size-4.5 place-items-center rounded-full bg-risk-critical text-[10px] font-bold text-white">
                  {unreadAlerts}
                </span>
              ) : null}
            </Link>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-foreground">{session.name}</p>
              <p className="text-[10px] text-muted-foreground">{ROLE_LABEL[session.role]}</p>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
