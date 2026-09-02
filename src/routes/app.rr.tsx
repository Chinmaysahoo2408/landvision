import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Home,
  Layers,
  MapPin,
  ShieldAlert,
  Users,
} from "lucide-react";
import { DemoTag, PageHeader, Panel, PanelTitle, StatCard } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";

export const Route = createFileRoute("/app/rr")({
  component: RRPage,
  head: () => ({
    meta: [
      { title: "Rehabilitation & Resettlement (R&R) Analytics — LandVision AI" },
      {
        name: "description",
        content:
          "Monitor displaced families, resettlement colony readiness, livelihood restoration grants, and R&R risk scoring across acquisition corridors.",
      },
    ],
  }),
});

function RRPage() {
  const { visibleProjects, predictions } = useLV();
  const [selectedState, setSelectedState] = useState<string>("");

  const filtered = useMemo(() => {
    return visibleProjects.filter((p) => !selectedState || p.state === selectedState);
  }, [visibleProjects, selectedState]);

  const stats = useMemo(() => {
    let totalFamilies = 0;
    let rehabCompleted = 0;
    let rehabPending = 0;
    let resettleCompleted = 0;
    let resettlePending = 0;
    let sitesReady = 0;
    let sitesPlanned = 0;

    for (const p of filtered) {
      totalFamilies += p.rrMetrics.totalFamilies;
      rehabCompleted += p.rrMetrics.rehabilitationCompleted;
      rehabPending += p.rrMetrics.rehabilitationPending;
      resettleCompleted += p.rrMetrics.resettlementCompleted;
      resettlePending += p.rrMetrics.resettlementPending;
      sitesReady += p.rrMetrics.resettlementSitesReady;
      sitesPlanned += p.rrMetrics.resettlementSitesPlanned;
    }

    const overallRRRate = totalFamilies > 0 ? Math.round((rehabCompleted / totalFamilies) * 100) : 0;

    return {
      totalFamilies,
      rehabCompleted,
      rehabPending,
      resettleCompleted,
      resettlePending,
      sitesReady,
      sitesPlanned,
      overallRRRate,
    };
  }, [filtered]);

  const states = useMemo(() => [...new Set(visibleProjects.map((p) => p.state))].sort(), [visibleProjects]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rehabilitation & Resettlement (R&R) Tracking"
        description="Monitor statutory R&R entitlements under RFCTLARR Act 2013, family relocation progress, civic infrastructure at resettlement colonies, and socio-economic restoration."
      >
        <DemoTag />
      </PageHeader>

      {/* KPI METRICS */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Affected Families"
          value={stats.totalFamilies}
          icon={Users}
          hint="Displaced or project-affected"
        />
        <StatCard
          label="Rehabilitation Done"
          value={stats.rehabCompleted}
          icon={CheckCircle2}
          tone="low"
          hint="Livelihood grants disbursed"
        />
        <StatCard
          label="Rehabilitation Pending"
          value={stats.rehabPending}
          icon={Clock}
          tone="high"
          hint="Awaiting grant clearance"
        />
        <StatCard
          label="Resettlement Relocated"
          value={stats.resettleCompleted}
          icon={Home}
          tone="low"
          hint="Colony plots allotted"
        />
        <StatCard
          label="Resettlement Pending"
          value={stats.resettlePending}
          icon={AlertTriangle}
          tone="critical"
          hint="Awaiting colony readiness"
        />
        <StatCard
          label="R&R Completion Rate"
          value={stats.overallRRRate}
          suffix="%"
          icon={HeartHandshake}
          tone={stats.overallRRRate >= 70 ? "low" : "medium"}
          hint="Portfolio R&R velocity"
        />
      </div>

      {/* REGISTRY */}
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <PanelTitle
            title="Corridor R&R Implementation Registry"
            subtitle="Corridor-wise rehabilitation progress, resettlement colony readiness, and risk ratings"
            icon={Building}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-foreground"
            >
              <option value="">All States</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] tracking-wider text-muted-foreground uppercase">
                <th className="py-2.5 font-semibold">Corridor</th>
                <th className="py-2.5 font-semibold">Location</th>
                <th className="py-2.5 font-semibold">Total Families</th>
                <th className="py-2.5 font-semibold">Rehabilitation Done</th>
                <th className="py-2.5 font-semibold">Resettlement Done</th>
                <th className="py-2.5 font-semibold">Colonies Ready / Planned</th>
                <th className="py-2.5 font-semibold">R&R Completion %</th>
                <th className="py-2.5 font-semibold">R&R Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.slice(0, 30).map((p) => (
                <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 pr-2 font-medium text-foreground max-w-56 truncate">
                    <Link to="/app/projects/$projectId" params={{ projectId: p.id }} className="hover:text-primary">
                      {p.name}
                    </Link>
                    <span className="block text-[10px] text-muted-foreground">{p.projectId}</span>
                  </td>
                  <td className="py-2.5 pr-2 text-muted-foreground">
                    {p.district}, {p.state}
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums text-foreground">
                    {p.rrMetrics.totalFamilies.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums font-semibold text-risk-low">
                    {p.rrMetrics.rehabilitationCompleted} ({Math.round((p.rrMetrics.rehabilitationCompleted / (p.rrMetrics.totalFamilies || 1)) * 100)}%)
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums font-semibold text-foreground">
                    {p.rrMetrics.resettlementCompleted} ({Math.round((p.rrMetrics.resettlementCompleted / (p.rrMetrics.totalFamilies || 1)) * 100)}%)
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums text-foreground">
                    {p.rrMetrics.resettlementSitesReady} of {p.rrMetrics.resettlementSitesPlanned} colonies
                  </td>
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-12 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${p.rrMetrics.rrCompletionPct}%` }}
                        />
                      </div>
                      <span className="font-bold tabular-nums text-foreground">{p.rrMetrics.rrCompletionPct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <RiskBadge category={p.rrMetrics.rrRiskCategory} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
