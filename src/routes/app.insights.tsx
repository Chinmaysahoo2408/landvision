import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CheckCircle2,
  Compass,
  FileSpreadsheet,
  Globe2,
  Info,
  MapPin,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLV } from "@/lib/lv/store";
import { DemoTag, Panel, PanelTitle, PageHeader, StatCard } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import type { RiskCategory } from "@/lib/lv/types";

export const Route = createFileRoute("/app/insights")({
  head: () => ({
    meta: [
      { title: "AI Insights & Risk Intelligence — LandVision AI" },
      {
        name: "description",
        content: "AI-generated findings across land acquisition escalation, compensation patterns, geographic risk hotspots, and recommended actions.",
      },
      { property: "og:title", content: "AI Insights — LandVision AI" },
      { property: "og:description", content: "AI-driven land acquisition risk findings and intelligence." },
    ],
  }),
  component: InsightsPage,
});

const CAT_COLORS: Record<RiskCategory, string> = {
  LOW: "var(--risk-low)",
  MEDIUM: "var(--risk-medium)",
  HIGH: "var(--risk-high)",
  CRITICAL: "var(--risk-critical)",
};

const AXIS = { stroke: "var(--muted-foreground)", fontSize: 11 } as const;
const TOOLTIP = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
} as const;

function InsightsPage() {
  const { visibleProjects, predictions } = useLV();

  const {
    criticalEscalations,
    majorPattern,
    geographicHotspots,
    actionableRecs,
    drivers,
    riskDist,
    districtStats,
    watchlist,
  } = useMemo(() => {
    const agg = new Map<string, number>();
    const recs: { id: string; projectId: string; name: string; title: string; action: string; impact: string; priority: number }[] = [];
    const distMap = new Map<string, { total: number; critical: number; sumRisk: number }>();
    const catCount: Record<RiskCategory, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

    let criticalCount = 0;
    for (const p of visibleProjects) {
      const pred = predictions.get(p.id);
      if (!pred) continue;

      catCount[pred.riskCategory] += 1;
      if (pred.riskCategory === "CRITICAL" || pred.riskCategory === "HIGH") criticalCount += 1;

      // Factors
      for (const f of pred.factors) {
        agg.set(f.factor, (agg.get(f.factor) ?? 0) + f.contribution);
      }

      // District aggregation
      const cur = distMap.get(p.district) ?? { total: 0, critical: 0, sumRisk: 0 };
      distMap.set(p.district, {
        total: cur.total + 1,
        critical: cur.critical + (pred.riskCategory === "CRITICAL" ? 1 : 0),
        sumRisk: cur.sumRisk + pred.riskScore,
      });

      // Recs
      if (pred.riskScore >= 70) {
        for (const r of pred.recommendations.filter((x) => x.priority === 1)) {
          recs.push({
            id: r.id,
            projectId: p.id,
            name: p.name,
            title: r.title,
            action: r.action,
            impact: r.impact,
            priority: r.priority,
          });
        }
      }
    }

    const total = Array.from(agg.values()).reduce((a, b) => a + b, 0) || 1;
    const drivers = Array.from(agg.entries())
      .map(([factor, v]) => ({ factor, share: Math.round((v / total) * 100) }))
      .sort((a, b) => b.share - a.share)
      .slice(0, 5);

    const districtStats = Array.from(distMap.entries())
      .map(([district, v]) => ({
        district,
        total: v.total,
        critical: v.critical,
        avgRisk: Math.round(v.sumRisk / v.total),
      }))
      .sort((a, b) => b.avgRisk - a.avgRisk);

    const watchlist = visibleProjects
      .map((p) => ({ p, pred: predictions.get(p.id)! }))
      .filter((x) => x.pred)
      .sort((a, b) => b.pred.riskScore - a.pred.riskScore)
      .slice(0, 6);

    const riskDist = (Object.keys(catCount) as RiskCategory[]).map((k) => ({
      name: k,
      value: catCount[k],
    }));

    // 4 required core insights
    const topDistrict = districtStats[0]?.district ?? "Khordha";

    const criticalEscalations = {
      title: "Critical Finding",
      stat: `${criticalCount} Locations`,
      headline: `${criticalCount} locations show a high probability of escalation.`,
      detail: `Algorithmic analysis of pending court stays and uncompleted R&R colonies shows high risk of multi-month work stop if unresolved.`,
      badge: "CRITICAL RISK",
      tone: "critical" as const,
    };

    const majorPattern = {
      title: "Major Pattern",
      stat: "Compensation Disbursal",
      headline: "Compensation-related issues are the most common contributor.",
      detail: `Direct-Benefit Transfer (DBT) verification bottlenecks and unverified ancestral title deeds account for ${drivers[0]?.share ?? 34}% of total delay weight across projects.`,
      badge: "MAJOR PATTERN",
      tone: "high" as const,
    };

    const geographicHotspots = {
      title: "Geographic Pattern",
      stat: topDistrict,
      headline: `${topDistrict} currently has the highest concentration of reported cases.`,
      detail: `Density analysis confirms ${topDistrict} district accounts for the highest average risk score (${districtStats[0]?.avgRisk ?? 76}/100) with multiple unresolved legal disputes.`,
      badge: "GEOGRAPHIC FOCUS",
      tone: "medium" as const,
    };

    const actionableRecs = {
      title: "Recommendation",
      stat: "Fast-Track Action",
      headline: "Prioritize review of cases where multiple issues remain unresolved for more than 30 days.",
      detail: `Convene Lok Adalat & Revenue Court fast-track benches for projects exceeding 30 days of inactivity to prevent timeline slippage into next quarter.`,
      badge: "ACTIONABLE",
      tone: "low" as const,
    };

    return {
      criticalEscalations,
      majorPattern,
      geographicHotspots,
      actionableRecs,
      drivers,
      riskDist,
      districtStats,
      watchlist,
      topRecs: recs.slice(0, 6),
    };
  }, [visibleProjects, predictions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights & Risk Intelligence"
        description="Data-driven intelligence generated from real-time acquisition records, FIR case tracking, and model delay attributions."
      >
        <DemoTag />
      </PageHeader>

      {/* DEMO INSIGHTS DISCLAIMER */}
      <Panel className="border-primary/40 bg-primary/5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-background text-primary">
            <Sparkles className="size-4.5" aria-hidden />
          </span>
          <div className="text-xs text-foreground space-y-1">
            <p className="font-bold">DEMO-GENERATED AI INSIGHTS</p>
            <p className="text-muted-foreground">
              These insights are dynamically synthesized by the LandVision AI inference engine based on current project records and synthetic FIR dataset inputs. They illustrate automated pattern recognition across land acquisition governance.
            </p>
          </div>
        </div>
      </Panel>

      {/* 4 CORE REQUIRED INSIGHT CARDS */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 1. CRITICAL FINDING */}
        <div className="rounded-xl border border-risk-critical/40 bg-card p-5 shadow-sm hover:border-risk-critical transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-risk-critical/15 px-2.5 py-1 text-[11px] font-bold text-risk-critical">
              <ShieldAlert className="size-3.5" />
              {criticalEscalations.title}
            </span>
            <span className="text-xs font-bold text-risk-critical">{criticalEscalations.stat}</span>
          </div>
          <h3 className="font-display text-base font-bold text-foreground">
            {criticalEscalations.headline}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {criticalEscalations.detail}
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-border/60 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-risk-critical font-medium">
              <ArrowUpRight className="size-3.5" /> High Risk Escalation Vector
            </span>
            <Link to="/app/predictor" className="text-primary hover:underline font-semibold">
              Simulate Delay →
            </Link>
          </div>
        </div>

        {/* 2. MAJOR PATTERN */}
        <div className="rounded-xl border border-risk-high/40 bg-card p-5 shadow-sm hover:border-risk-high transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-risk-high/15 px-2.5 py-1 text-[11px] font-bold text-risk-high">
              <TrendingUp className="size-3.5" />
              {majorPattern.title}
            </span>
            <span className="text-xs font-bold text-risk-high">{majorPattern.stat}</span>
          </div>
          <h3 className="font-display text-base font-bold text-foreground">
            {majorPattern.headline}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {majorPattern.detail}
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-border/60 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-risk-high font-medium">
              <Info className="size-3.5" /> Primary Delay Driver (34% Weight)
            </span>
            <Link to="/app/compensation" className="text-primary hover:underline font-semibold">
              Track Disbursal →
            </Link>
          </div>
        </div>

        {/* 3. GEOGRAPHIC PATTERN */}
        <div className="rounded-xl border border-risk-medium/40 bg-card p-5 shadow-sm hover:border-risk-medium transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-risk-medium/15 px-2.5 py-1 text-[11px] font-bold text-risk-medium">
              <MapPin className="size-3.5" />
              {geographicHotspots.title}
            </span>
            <span className="text-xs font-bold text-risk-medium">{geographicHotspots.stat}</span>
          </div>
          <h3 className="font-display text-base font-bold text-foreground">
            {geographicHotspots.headline}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {geographicHotspots.detail}
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-border/60 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-risk-medium font-medium">
              <Compass className="size-3.5" /> Concentrated Legal Cases
            </span>
            <Link to="/app/district-analytics" className="text-primary hover:underline font-semibold">
              District View →
            </Link>
          </div>
        </div>

        {/* 4. RECOMMENDATION */}
        <div className="rounded-xl border border-risk-low/40 bg-card p-5 shadow-sm hover:border-risk-low transition-colors space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-risk-low/15 px-2.5 py-1 text-[11px] font-bold text-risk-low">
              <CheckCircle2 className="size-3.5" />
              {actionableRecs.title}
            </span>
            <span className="text-xs font-bold text-risk-low">{actionableRecs.stat}</span>
          </div>
          <h3 className="font-display text-base font-bold text-foreground">
            {actionableRecs.headline}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {actionableRecs.detail}
          </p>
          <div className="pt-2 flex items-center justify-between border-t border-border/60 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-risk-low font-medium">
              <ArrowDownRight className="size-3.5" /> Actionable Target: &gt;30 Days Stalled
            </span>
            <Link to="/app/interventions" className="text-primary hover:underline font-semibold">
              Create Intervention →
            </Link>
          </div>
        </div>
      </div>

      {/* VISUAL CHARTS & DRIVERS */}
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel>
          <PanelTitle
            title="Portfolio Delay Factors Attribution"
            subtitle="Normalized percentage weight contribution across all active projects"
            icon={Brain}
            ai
          />
          <ul className="mt-4 space-y-3.5">
            {drivers.map((d) => (
              <li key={d.factor} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{d.factor}</span>
                  <span className="tabular-nums font-bold text-primary">{d.share}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${d.share}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelTitle
            title="Risk Category Split"
            subtitle="Distribution of overall acquisition risk across monitored projects"
            icon={Sparkles}
          />
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDist}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {riskDist.map((entry) => (
                    <Cell key={entry.name} fill={CAT_COLORS[entry.name as RiskCategory]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
            {riskDist.map((d) => (
              <span key={d.name} className="inline-flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2.5 rounded-full" style={{ background: CAT_COLORS[d.name as RiskCategory] }} />
                <span className="font-bold text-foreground">{d.name}</span> ({d.value})
              </span>
            ))}
          </div>
        </Panel>
      </div>

      {/* WATCHLIST */}
      <Panel>
        <PanelTitle
          title="High-Escalation District Watchlist"
          subtitle="Locations requiring prioritized administrative review"
          icon={ShieldAlert}
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] uppercase text-muted-foreground">
                <th className="py-2.5 font-semibold">District Name</th>
                <th className="py-2.5 font-semibold">Monitored Projects</th>
                <th className="py-2.5 font-semibold">Critical Cases</th>
                <th className="py-2.5 font-semibold">Average Risk Score</th>
                <th className="py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {districtStats.map((d) => (
                <tr key={d.district} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3 font-bold text-foreground flex items-center gap-2">
                    <MapPin className="size-3.5 text-primary" /> {d.district}
                  </td>
                  <td className="py-3 tabular-nums text-foreground">{d.total} projects</td>
                  <td className="py-3 tabular-nums text-risk-critical font-bold">{d.critical} cases</td>
                  <td className="py-3 tabular-nums font-bold">
                    <span className={d.avgRisk >= 70 ? "text-risk-critical" : d.avgRisk >= 50 ? "text-risk-high" : "text-risk-low"}>
                      {d.avgRisk}/100
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        d.critical > 0
                          ? "bg-risk-critical/15 text-risk-critical"
                          : "bg-risk-low/15 text-risk-low"
                      }`}
                    >
                      {d.critical > 0 ? "Escalation Hotspot" : "Stable Progress"}
                    </span>
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

