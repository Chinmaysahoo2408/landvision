import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Clock,
  Globe2,
  HandCoins,
  Layers,
  MapPin,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DemoTag, PageHeader, Panel, PanelTitle, StatCard } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { STATES } from "@/lib/lv/data";
import { overallProgress } from "@/lib/lv/risk";
import { useLV } from "@/lib/lv/store";
import type { RiskCategory } from "@/lib/lv/types";

export const Route = createFileRoute("/app/state-analytics")({
  component: StateAnalyticsPage,
  head: () => ({
    meta: [
      { title: "National State Analytics & Comparative Posture — LandVision AI" },
      {
        name: "description",
        content:
          "State-level cross-comparison across all 12 major Indian States: high-risk corridor counts, average delay probability, compensation velocity and dispute indices.",
      },
    ],
  }),
});

const AXIS_STYLE = { stroke: "var(--muted-foreground)", fontSize: 11 };
const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

function StateAnalyticsPage() {
  const { visibleProjects, predictions } = useLV();
  const [sortKey, setSortKey] = useState<"projects" | "highRisk" | "avgRisk" | "delay" | "compensation">("avgRisk");

  const stateData = useMemo(() => {
    const map = new Map<
      string,
      {
        state: string;
        code: string;
        projects: number;
        highRisk: number;
        criticalRisk: number;
        riskSum: number;
        delaySum: number;
        compSum: number;
        possessionSum: number;
        rrSum: number;
        legalCases: number;
        families: number;
        landArea: number;
      }
    >();

    for (const s of STATES) {
      map.set(s.name, {
        state: s.name,
        code: s.code,
        projects: 0,
        highRisk: 0,
        criticalRisk: 0,
        riskSum: 0,
        delaySum: 0,
        compSum: 0,
        possessionSum: 0,
        rrSum: 0,
        legalCases: 0,
        families: 0,
        landArea: 0,
      });
    }

    for (const p of visibleProjects) {
      const pred = predictions.get(p.id);
      if (!pred) continue;
      const cur = map.get(p.state) ?? {
        state: p.state,
        code: "IN",
        projects: 0,
        highRisk: 0,
        criticalRisk: 0,
        riskSum: 0,
        delaySum: 0,
        compSum: 0,
        possessionSum: 0,
        rrSum: 0,
        legalCases: 0,
        families: 0,
        landArea: 0,
      };

      cur.projects += 1;
      if (pred.riskCategory === "HIGH") cur.highRisk += 1;
      if (pred.riskCategory === "CRITICAL") cur.criticalRisk += 1;
      cur.riskSum += pred.riskScore;
      cur.delaySum += pred.expectedDelayDays;
      cur.compSum += p.params.compensationPct;
      cur.possessionSum += p.params.possessionPct;
      cur.rrSum += p.params.rrPct;
      cur.legalCases += p.params.legalDisputes;
      cur.families += p.affectedFamilies;
      cur.landArea += p.landArea;
      map.set(p.state, cur);
    }

    const rows = [...map.values()].map((s) => ({
      ...s,
      avgRisk: Math.round(s.riskSum / (s.projects || 1)),
      avgDelay: Math.round(s.delaySum / (s.projects || 1)),
      avgComp: Math.round(s.compSum / (s.projects || 1)),
      avgPossession: Math.round(s.possessionSum / (s.projects || 1)),
      avgRR: Math.round(s.rrSum / (s.projects || 1)),
      highRiskTotal: s.highRisk + s.criticalRisk,
    }));

    return rows.sort((a, b) => {
      if (sortKey === "projects") return b.projects - a.projects;
      if (sortKey === "highRisk") return b.highRiskTotal - a.highRiskTotal;
      if (sortKey === "delay") return b.avgDelay - a.avgDelay;
      if (sortKey === "compensation") return b.avgComp - a.avgComp;
      return b.avgRisk - a.avgRisk;
    });
  }, [visibleProjects, predictions, sortKey]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="National State Analytics & Comparative League Table"
        description="Comprehensive pan-India evaluation of land acquisition velocity, legal dispute density, compensation disbursements, and delay probabilities across all 12 States."
      >
        <DemoTag />
      </PageHeader>

      {/* CHARTS: NATIONAL COMPARISON */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelTitle
            title="State-wise Average Predicted Risk Score"
            subtitle="Benchmark risk index computed by LandVision AI Engine"
            icon={BarChart3}
            ai
          />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateData} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid stroke="var(--border)" horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} {...AXIS_STYLE} />
                <YAxis type="category" dataKey="state" width={100} {...AXIS_STYLE} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="avgRisk" name="Avg Risk Score" radius={[0, 4, 4, 0]}>
                  {stateData.map((s) => (
                    <Cell
                      key={s.state}
                      fill={
                        s.avgRisk >= 70
                          ? "var(--risk-high)"
                          : s.avgRisk >= 50
                            ? "var(--risk-medium)"
                            : "var(--risk-low)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelTitle
            title="High-Risk Projects by State"
            subtitle="Volume of corridors requiring proactive administrative intervention"
            icon={AlertTriangle}
          />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="code" {...AXIS_STYLE} />
                <YAxis {...AXIS_STYLE} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="projects" name="Total Projects" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="highRiskTotal" name="High/Critical Risk" fill="var(--risk-critical)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* STATE BENCHMARKING LEAGUE TABLE */}
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <PanelTitle
            title="State Comparative Performance Table"
            subtitle="Click column headers to sort by risk, delay, or compensation progress"
            icon={Building2}
          />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Sort by:</span>
            {(["avgRisk", "highRisk", "projects", "delay", "compensation"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setSortKey(k)}
                className={`rounded px-2 py-0.5 font-medium uppercase text-[10px] ${
                  sortKey === k
                    ? "bg-primary text-primary-foreground font-bold"
                    : "border border-border hover:bg-surface text-foreground"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] tracking-wider text-muted-foreground uppercase">
                <th className="py-2.5 font-semibold">State</th>
                <th className="py-2.5 font-semibold">Total Projects</th>
                <th className="py-2.5 font-semibold">High Risk Projects</th>
                <th className="py-2.5 font-semibold">Avg Risk Score</th>
                <th className="py-2.5 font-semibold">Avg Predicted Delay</th>
                <th className="py-2.5 font-semibold">Compensation Disbursed</th>
                <th className="py-2.5 font-semibold">Possession Handover</th>
                <th className="py-2.5 font-semibold">Legal Disputes</th>
                <th className="py-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stateData.map((s) => (
                <tr key={s.state} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3 font-semibold text-foreground flex items-center gap-2">
                    <span className="grid size-6 place-items-center rounded bg-surface border border-border text-[10px] font-bold">
                      {s.code}
                    </span>
                    {s.state}
                  </td>
                  <td className="py-3 tabular-nums font-medium text-foreground">{s.projects}</td>
                  <td className="py-3 tabular-nums font-bold text-risk-high">{s.highRiskTotal}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold tabular-nums text-foreground">{s.avgRisk}%</span>
                      <div className="h-1.5 w-16 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${s.avgRisk}%`,
                            background:
                              s.avgRisk >= 70
                                ? "var(--risk-high)"
                                : s.avgRisk >= 50
                                  ? "var(--risk-medium)"
                                  : "var(--risk-low)",
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 tabular-nums text-muted-foreground">+{s.avgDelay} days</td>
                  <td className="py-3 tabular-nums text-foreground">{s.avgComp}%</td>
                  <td className="py-3 tabular-nums text-foreground">{s.avgPossession}%</td>
                  <td className="py-3 tabular-nums font-semibold text-risk-critical">{s.legalCases}</td>
                  <td className="py-3 text-right">
                    <Link
                      to="/app/district-analytics"
                      className="inline-flex items-center gap-1 rounded bg-surface border border-border px-2 py-1 text-[11px] font-semibold text-primary hover:border-primary/40"
                    >
                      Districts <ArrowRight className="size-3" />
                    </Link>
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
