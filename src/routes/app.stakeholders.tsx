import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Building2,
  CheckCircle2,
  Gavel,
  Handshake,
  HeartHandshake,
  Info,
  Scale,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { DemoTag, PageHeader, Panel, PanelTitle, StatCard } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { computeStakeholderIndex } from "@/lib/lv/risk";
import { useLV } from "@/lib/lv/store";

export const Route = createFileRoute("/app/stakeholders")({
  component: StakeholdersPage,
  head: () => ({
    meta: [
      { title: "Stakeholder Responsiveness Index — LandVision AI" },
      {
        name: "description",
        content:
          "Multi-stakeholder collaboration index measuring responsiveness across Landowners, District Admin, Govt Departments, Legal Authorities, R&R, and Project Units.",
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

function StakeholdersPage() {
  const { visibleProjects, predictions } = useLV();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("nh16");

  const project =
    visibleProjects.find((p) => p.id === selectedProjectId || p.projectId === selectedProjectId) ??
    visibleProjects[0]!;

  const pred = predictions.get(project.id);
  const scores = project.params.stakeholderBreakdown;
  const compositeScore = computeStakeholderIndex(scores);

  const radarData = [
    { category: "Landowners", score: scores.landowners, weight: "25%" },
    { category: "District Admin", score: scores.districtAdmin, weight: "20%" },
    { category: "Govt Departments", score: scores.governmentDepts, weight: "18%" },
    { category: "Legal Authorities", score: scores.legalAuthorities, weight: "15%" },
    { category: "R&R Authorities", score: scores.rrAuthorities, weight: "12%" },
    { category: "Project Authority", score: scores.projectAuthorities, weight: "10%" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stakeholder Responsiveness Index (SRI)"
        description="Quantifying inter-stakeholder coordination friction. Explains how low responsiveness across landowners, revenue courts, and executing agencies compounds project delay probability."
      >
        <DemoTag />
      </PageHeader>

      {/* SELECTION BAR */}
      <Panel className="bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Target Corridor:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground outline-none"
            >
              {visibleProjects.slice(0, 30).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectId}) — {p.district}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Composite SRI:</span>
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                compositeScore >= 75
                  ? "bg-risk-low/15 text-risk-low"
                  : compositeScore >= 50
                    ? "bg-risk-medium/15 text-risk-medium"
                    : "bg-risk-high/15 text-risk-high"
              }`}
            >
              {compositeScore} / 100 Index
            </span>
          </div>
        </div>
      </Panel>

      {/* EXPLANATION CALLOUT: HOW SRI IMPACTS DELAY */}
      <Panel className="border-primary/40 bg-gradient-to-r from-primary/10 via-card to-primary/5">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Sparkles className="size-5" />
          </span>
          <div className="space-y-1">
            <h3 className="font-display text-sm font-bold text-foreground">
              How Stakeholder Friction Compounds Delay Risk
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-foreground pt-1">
              <span className="rounded bg-surface px-2 py-1 border border-border">Low Responsiveness (e.g., &lt;50%)</span>
              <ArrowRight className="size-3.5 text-primary" />
              <span className="rounded bg-surface px-2 py-1 border border-border">Protracted Negotiation &amp; File Stalls</span>
              <ArrowRight className="size-3.5 text-primary" />
              <span className="rounded bg-surface px-2 py-1 border border-border text-risk-critical">
                Higher Delay Probability (+45 to 90 days)
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Stakeholder responsiveness is fed as a weighted non-linear input to the prediction engine.
              Improving landowner engagement and inter-departmental velocity directly lowers project risk.
            </p>
          </div>
        </div>
      </Panel>

      {/* RADAR & INDIVIDUAL SCORES */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* RADAR */}
        <div className="lg:col-span-6">
          <Panel className="h-full">
            <PanelTitle
              title="Stakeholder Coordination Radar"
              subtitle="Responsiveness scores across 6 key administrative & community actors"
              icon={UserCheck}
              ai
            />
            <div className="mt-2 h-76">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                  <Radar
                    name="Responsiveness Index"
                    dataKey="score"
                    stroke="var(--primary)"
                    fill="var(--primary)"
                    fillOpacity={0.25}
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* DETAILED CATEGORIES */}
        <div className="space-y-3 lg:col-span-6">
          {radarData.map((item) => (
            <div key={item.category} className="rounded-xl border border-border bg-card p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{item.category}</span>
                  <span className="text-[10px] text-muted-foreground">Weight: {item.weight}</span>
                </div>
                <span className="font-bold tabular-nums text-foreground">{item.score}%</span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: `${item.score}%`,
                    background:
                      item.score >= 70 ? "var(--risk-low)" : item.score >= 45 ? "var(--risk-medium)" : "var(--risk-critical)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
