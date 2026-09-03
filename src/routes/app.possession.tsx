import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Handshake,
  LandPlot,
  Layers,
  MapPin,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { DemoTag, PageHeader, Panel, PanelTitle, StatCard } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";

export const Route = createFileRoute("/app/possession")({
  component: PossessionPage,
  head: () => ({
    meta: [
      { title: "Land Possession & Encroachment Tracking — LandVision AI" },
      {
        name: "description",
        content:
          "Monitor physical land handover, demarcated corridor boundaries, encroachment hot-spots, and possession velocity across projects.",
      },
    ],
  }),
});

function PossessionPage() {
  const { visibleProjects, predictions } = useLV();
  const [selectedState, setSelectedState] = useState<string>("");

  const filtered = useMemo(() => {
    return visibleProjects.filter((p) => !selectedState || p.state === selectedState);
  }, [visibleProjects, selectedState]);

  const stats = useMemo(() => {
    let requiredAcres = 0;
    let acquiredAcres = 0;
    let possessedAcres = 0;
    let pendingAcres = 0;
    let encroachmentCases = 0;
    let encroachedArea = 0;

    for (const p of filtered) {
      requiredAcres += p.possession.totalLandRequiredAcres;
      acquiredAcres += p.possession.landAcquiredAcres;
      possessedAcres += p.possession.landPossessedAcres;
      pendingAcres += p.possession.landPendingAcres;
      encroachmentCases += p.possession.encroachmentIssues;
      encroachedArea += p.possession.encroachedAreaAcres;
    }

    const overallPossessionPct = requiredAcres > 0 ? Math.round((possessedAcres / requiredAcres) * 100) : 0;

    return {
      requiredAcres: Math.round(requiredAcres),
      acquiredAcres: Math.round(acquiredAcres),
      possessedAcres: Math.round(possessedAcres),
      pendingAcres: Math.round(pendingAcres),
      encroachmentCases,
      encroachedArea: Math.round(encroachedArea),
      overallPossessionPct,
    };
  }, [filtered]);

  const states = useMemo(() => [...new Set(visibleProjects.map((p) => p.state))].sort(), [visibleProjects]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Land Possession & Boundary Handover Tracking"
        description="Monitor physical land handover from Revenue Authorities to Executing Agencies, joint boundary demarcation, and encroachment clearance."
      >
        <DemoTag />
      </PageHeader>

      {/* KPI METRICS */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Land Required"
          value={stats.requiredAcres}
          suffix=" ha"
          icon={Layers}
          hint="Corridor alignment"
        />
        <StatCard
          label="Land Acquired (Awarded)"
          value={stats.acquiredAcres}
          suffix=" ha"
          icon={CheckCircle2}
          tone="low"
          hint="Award declared"
        />
        <StatCard
          label="Land Possessed"
          value={stats.possessedAcres}
          suffix=" ha"
          icon={LandPlot}
          tone="low"
          hint="Handed over to agency"
        />
        <StatCard
          label="Possession Pending"
          value={stats.pendingAcres}
          suffix=" ha"
          icon={Clock}
          tone="high"
          hint="Awaiting clearance"
        />
        <StatCard
          label="Possession Rate"
          value={stats.overallPossessionPct}
          suffix="%"
          icon={TrendingUp}
          tone={stats.overallPossessionPct >= 70 ? "low" : "medium"}
          hint="Handover progress"
        />
        <StatCard
          label="Encroachment Issues"
          value={stats.encroachmentCases}
          icon={AlertTriangle}
          tone="critical"
          hint={`${stats.encroachedArea} ha disputed`}
        />
      </div>

      {/* POSSESSION REGISTRY TABLE */}
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <PanelTitle
            title="Corridor Possession & Physical Handover Registry"
            subtitle="Corridor-wise required land, possessed land, and encroachment tracking"
            icon={LandPlot}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filter State:</span>
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
                <th className="py-2.5 font-semibold">Required Land</th>
                <th className="py-2.5 font-semibold">Acquired (ha)</th>
                <th className="py-2.5 font-semibold">Possessed (ha)</th>
                <th className="py-2.5 font-semibold">Pending (ha)</th>
                <th className="py-2.5 font-semibold">Possession %</th>
                <th className="py-2.5 font-semibold">Encroachment Issues</th>
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
                  <td className="py-2.5 pr-2 tabular-nums font-semibold text-foreground">
                    {p.possession.totalLandRequiredAcres} ha
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums text-foreground">{p.possession.landAcquiredAcres} ha</td>
                  <td className="py-2.5 pr-2 tabular-nums font-semibold text-risk-low">
                    {p.possession.landPossessedAcres} ha
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums font-semibold text-risk-high">
                    {p.possession.landPendingAcres} ha
                  </td>
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-12 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${p.possession.possessionPct}%` }}
                        />
                      </div>
                      <span className="font-bold tabular-nums text-foreground">{p.possession.possessionPct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums">
                    {p.possession.encroachmentIssues > 0 ? (
                      <span className="font-bold text-risk-critical">
                        {p.possession.encroachmentIssues} spots ({p.possession.encroachedAreaAcres} ha)
                      </span>
                    ) : (
                      <span className="text-risk-low font-medium">Clear</span>
                    )}
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
