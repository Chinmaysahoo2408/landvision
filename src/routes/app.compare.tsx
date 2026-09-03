import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Clock,
  GitCompare,
  HandCoins,
  Layers,
  MapPin,
  Scale,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DemoTag, PageHeader, Panel, PanelTitle } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { overallProgress } from "@/lib/lv/risk";
import { useLV } from "@/lib/lv/store";
import type { Project } from "@/lib/lv/types";

export const Route = createFileRoute("/app/compare")({
  component: ComparePage,
  head: () => ({
    meta: [
      { title: "Multi-Project & Corridor Comparison — LandVision AI" },
      {
        name: "description",
        content:
          "Side-by-side comparative analytics for 2–4 land acquisition projects, districts or states across risk scores, delay probabilities, and stage friction.",
      },
    ],
  }),
});

const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

const PALETTE = ["var(--primary)", "var(--chart-2)", "var(--chart-4)", "var(--risk-high)"];

function ComparePage() {
  const { visibleProjects, predictions } = useLV();
  const [selectedIds, setSelectedIds] = useState<string[]>(["nh16", "rrc", "idz"]);

  const selectedProjects = useMemo(() => {
    return selectedIds
      .map((id) => visibleProjects.find((p) => p.id === id || p.projectId === id))
      .filter((p): p is Project => Boolean(p));
  }, [visibleProjects, selectedIds]);

  const toggleProject = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 2) setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      if (selectedIds.length < 4) setSelectedIds([...selectedIds, id]);
    }
  };

  const radarData = useMemo(() => {
    const metrics = [
      { key: "riskScore", label: "Risk Score" },
      { key: "delayProb", label: "Delay Probability" },
      { key: "legalCases", label: "Legal Friction" },
      { key: "compDone", label: "Compensation %" },
      { key: "possession", label: "Possession %" },
      { key: "rrProgress", label: "R&R Progress %" },
      { key: "docVerified", label: "Documentation %" },
    ];

    return metrics.map((m) => {
      const row: Record<string, string | number> = { metric: m.label };
      selectedProjects.forEach((p, idx) => {
        const pred = predictions.get(p.id);
        let val = 0;
        if (m.key === "riskScore") val = pred?.riskScore ?? 50;
        else if (m.key === "delayProb") val = pred?.delayProbability ?? 50;
        else if (m.key === "legalCases") val = Math.min(100, (p.params.legalDisputes / 15) * 100);
        else if (m.key === "compDone") val = p.params.compensationPct;
        else if (m.key === "possession") val = p.params.possessionPct;
        else if (m.key === "rrProgress") val = p.params.rrPct;
        else if (m.key === "docVerified") val = p.params.documentationPct;
        row[`proj_${idx}`] = Math.round(val);
      });
      return row;
    });
  }, [selectedProjects, predictions]);

  const barComparisonData = useMemo(() => {
    return selectedProjects.map((p) => {
      const pred = predictions.get(p.id);
      return {
        name: p.name.split(" ")[0] + " " + (p.name.split(" ")[1] ?? ""),
        riskScore: pred?.riskScore ?? 0,
        expectedDelay: pred?.expectedDelayDays ?? 0,
        compensationPct: p.params.compensationPct,
        possessionPct: p.params.possessionPct,
      };
    });
  }, [selectedProjects, predictions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Multi-Project & Corridor Comparison"
        description="Benchmark 2–4 land acquisition corridors side-by-side. Analyze relative risk scores, compensation bottlenecks, legal dispute density, and lifecycle velocity."
      >
        <DemoTag />
      </PageHeader>

      {/* SELECTOR PANEL */}
      <Panel className="bg-card">
        <PanelTitle
          title="Select Corridors to Compare (2 to 4 Projects)"
          subtitle="Click to toggle projects in the comparative workspace"
          icon={GitCompare}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {visibleProjects.slice(0, 10).map((p) => {
            const isSelected = selectedIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleProject(p.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "border border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.name} ({p.projectId})
              </button>
            );
          })}
        </div>
      </Panel>

      {/* COMPARISON CHARTS (RADAR & BAR) */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* RADAR CHART */}
        <Panel>
          <PanelTitle
            title="Multi-Dimensional Risk & Performance Radar"
            subtitle="Normalized comparison across 7 key acquisition indicators"
            icon={Sparkles}
            ai
          />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                {selectedProjects.map((p, idx) => (
                  <Radar
                    key={p.id}
                    name={p.name}
                    dataKey={`proj_${idx}`}
                    stroke={PALETTE[idx % PALETTE.length]}
                    fill={PALETTE[idx % PALETTE.length]}
                    fillOpacity={0.2}
                  />
                ))}
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* BAR COMPARISON */}
        <Panel>
          <PanelTitle
            title="Delay Probability & Expected Slippage"
            subtitle="Comparing predicted delay days and compensation disbursal"
            icon={BarChart3}
          />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barComparisonData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="riskScore" name="Risk Score (/100)" fill="var(--risk-high)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="compensationPct" name="Compensation %" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="possessionPct" name="Possession %" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* SIDE-BY-SIDE DETAILED COMPARISON TABLE */}
      <Panel>
        <PanelTitle
          title="Side-by-Side Detailed Parameter Breakdown"
          subtitle="Comparative matrix across all administrative, social, and financial features"
          icon={Scale}
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="p-3 font-semibold text-muted-foreground uppercase text-[10px]">Parameter</th>
                {selectedProjects.map((p, idx) => (
                  <th key={p.id} className="p-3 font-bold text-foreground">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ background: PALETTE[idx % PALETTE.length] }}
                      />
                      <span>{p.name}</span>
                    </div>
                    <span className="text-[10px] font-normal text-muted-foreground">{p.projectId} · {p.state}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-3 font-medium text-muted-foreground">AI Risk Score</td>
                {selectedProjects.map((p) => {
                  const pred = predictions.get(p.id);
                  return (
                    <td key={p.id} className="p-3">
                      <RiskBadge category={pred?.riskCategory ?? "LOW"} score={pred?.riskScore} />
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-3 font-medium text-muted-foreground">Delay Probability</td>
                {selectedProjects.map((p) => (
                  <td key={p.id} className="p-3 font-bold tabular-nums text-foreground">
                    {predictions.get(p.id)?.delayProbability}%
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-muted-foreground">Expected Delay</td>
                {selectedProjects.map((p) => (
                  <td key={p.id} className="p-3 font-bold tabular-nums text-risk-high">
                    +{predictions.get(p.id)?.expectedDelayDays} days
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-muted-foreground">Current Stage</td>
                {selectedProjects.map((p) => (
                  <td key={p.id} className="p-3 font-medium text-foreground">
                    {p.currentStage}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-muted-foreground">Total Land Required</td>
                {selectedProjects.map((p) => (
                  <td key={p.id} className="p-3 tabular-nums text-foreground">
                    {p.landArea} ha ({p.govtLand} govt / {p.privateLand} pvt)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-muted-foreground">Affected Families</td>
                {selectedProjects.map((p) => (
                  <td key={p.id} className="p-3 tabular-nums text-foreground">
                    {p.affectedFamilies.toLocaleString("en-IN")}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-muted-foreground">Compensation Disbursed</td>
                {selectedProjects.map((p) => (
                  <td key={p.id} className="p-3 tabular-nums text-foreground font-semibold">
                    {p.params.compensationPct}% (₹{p.compensation.paidAmountCr} Cr / ₹{p.compensation.eligibleAmountCr} Cr)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-muted-foreground">Active Legal Disputes</td>
                {selectedProjects.map((p) => (
                  <td key={p.id} className="p-3 tabular-nums font-bold text-risk-critical">
                    {p.params.legalDisputes} active cases
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-muted-foreground">Physical Possession</td>
                {selectedProjects.map((p) => (
                  <td key={p.id} className="p-3 tabular-nums text-foreground">
                    {p.params.possessionPct}% ({p.possession.landPossessedAcres} ha possessed)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-muted-foreground">R&R Progress</td>
                {selectedProjects.map((p) => (
                  <td key={p.id} className="p-3 tabular-nums text-foreground">
                    {p.params.rrPct}% ({p.rrMetrics.rehabilitationCompleted} families settled)
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-muted-foreground">Stakeholder Index</td>
                {selectedProjects.map((p) => (
                  <td key={p.id} className="p-3 tabular-nums text-foreground">
                    {p.params.stakeholderResponsiveness}/100
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-muted-foreground">Top Delay Driver</td>
                {selectedProjects.map((p) => (
                  <td key={p.id} className="p-3 text-xs font-semibold text-risk-high">
                    {predictions.get(p.id)?.topDelayDrivers[0]?.factor ?? "None"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
