import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CalendarClock,
  Clock,
  Gavel,
  HandCoins,
  Layers,
  MapPin,
  Scale,
  Sparkles,
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
import { overallProgress } from "@/lib/lv/risk";
import { useLV } from "@/lib/lv/store";
import type { RiskCategory } from "@/lib/lv/types";

export const Route = createFileRoute("/app/district-analytics")({
  component: DistrictAnalyticsPage,
  head: () => ({
    meta: [
      { title: "District Analytics & Hotspots — LandVision AI" },
      {
        name: "description",
        content:
          "District-level land acquisition risk analytics, stage delays, compensation completion, and litigation hot-spots across states.",
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

function DistrictAnalyticsPage() {
  const { visibleProjects, predictions } = useLV();
  const [selectedState, setSelectedState] = useState<string>("Odisha");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Khordha");

  const states = useMemo(() => {
    return [...new Set(visibleProjects.map((p) => p.state))].sort();
  }, [visibleProjects]);

  const stateProjects = useMemo(() => {
    return visibleProjects.filter((p) => !selectedState || p.state === selectedState);
  }, [visibleProjects, selectedState]);

  const districts = useMemo(() => {
    return [...new Set(stateProjects.map((p) => p.district))].sort();
  }, [stateProjects]);

  const districtSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        district: string;
        state: string;
        projects: number;
        low: number;
        medium: number;
        high: number;
        critical: number;
        riskSum: number;
        delaySum: number;
        compSum: number;
        possessionSum: number;
        rrSum: number;
        legalCases: number;
      }
    >();

    for (const p of stateProjects) {
      const pred = predictions.get(p.id);
      if (!pred) continue;
      const cur = map.get(p.district) ?? {
        district: p.district,
        state: p.state,
        projects: 0,
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
        riskSum: 0,
        delaySum: 0,
        compSum: 0,
        possessionSum: 0,
        rrSum: 0,
        legalCases: 0,
      };

      cur.projects += 1;
      if (pred.riskCategory === "LOW") cur.low += 1;
      else if (pred.riskCategory === "MEDIUM") cur.medium += 1;
      else if (pred.riskCategory === "HIGH") cur.high += 1;
      else cur.critical += 1;

      cur.riskSum += pred.riskScore;
      cur.delaySum += pred.expectedDelayDays;
      cur.compSum += p.params.compensationPct;
      cur.possessionSum += p.params.possessionPct;
      cur.rrSum += p.params.rrPct;
      cur.legalCases += p.params.legalDisputes;
      map.set(p.district, cur);
    }

    return [...map.values()]
      .map((d) => ({
        ...d,
        avgRisk: Math.round(d.riskSum / (d.projects || 1)),
        avgDelay: Math.round(d.delaySum / (d.projects || 1)),
        avgComp: Math.round(d.compSum / (d.projects || 1)),
        avgPossession: Math.round(d.possessionSum / (d.projects || 1)),
        avgRR: Math.round(d.rrSum / (d.projects || 1)),
      }))
      .sort((a, b) => b.avgRisk - a.avgRisk);
  }, [stateProjects, predictions]);

  const activeDistrictProjects = useMemo(() => {
    return stateProjects
      .filter((p) => !selectedDistrict || p.district === selectedDistrict)
      .map((p) => ({ p, pr: predictions.get(p.id)! }))
      .filter((x) => Boolean(x.pr))
      .sort((a, b) => b.pr.riskScore - a.pr.riskScore);
  }, [stateProjects, selectedDistrict, predictions]);

  const activeDistrictMetrics = useMemo(() => {
    return (
      districtSummary.find((d) => d.district === selectedDistrict) ??
      districtSummary[0] ?? {
        district: selectedDistrict,
        projects: 0,
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
        avgRisk: 0,
        avgDelay: 0,
        avgComp: 0,
        avgPossession: 0,
        avgRR: 0,
        legalCases: 0,
      }
    );
  }, [districtSummary, selectedDistrict]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="District-Wise Acquisition Analytics & Risk Heatmap"
        description="Hierarchical State → District → Corridor drill-down intelligence. Monitor administrative bottlenecks, compensation disbursements, and legal cases at district level."
      >
        <DemoTag />
      </PageHeader>

      {/* FILTER BAR: STATE & DISTRICT DRILLDOWN */}
      <Panel className="bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">1. Select State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  const firstDist = visibleProjects.find((p) => p.state === e.target.value)?.district;
                  if (firstDist) setSelectedDistrict(firstDist);
                }}
                className="mt-1 block rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
              >
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase">2. Select District</label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="mt-1 block rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-primary"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">District Focus:</span>
            <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              {selectedDistrict}, {selectedState}
            </span>
          </div>
        </div>
      </Panel>

      {/* DISTRICT KPIS */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="District Corridors"
          value={activeDistrictMetrics.projects}
          icon={Layers}
          hint="Active acquisitions"
        />
        <StatCard
          label="High/Critical Risk"
          value={activeDistrictMetrics.high + activeDistrictMetrics.critical}
          icon={AlertTriangle}
          tone="high"
          hint="Require review"
        />
        <StatCard
          label="Avg Risk Score"
          value={activeDistrictMetrics.avgRisk}
          suffix="/100"
          icon={Sparkles}
          tone={activeDistrictMetrics.avgRisk >= 70 ? "high" : "medium"}
          hint="ML risk index"
        />
        <StatCard
          label="Avg Delay"
          value={activeDistrictMetrics.avgDelay}
          suffix="d"
          icon={Clock}
          tone="medium"
          hint="Expected delay"
        />
        <StatCard
          label="Compensation Disbursed"
          value={activeDistrictMetrics.avgComp}
          suffix="%"
          icon={HandCoins}
          tone="low"
          hint="Disbursal progress"
        />
        <StatCard
          label="Active Legal Cases"
          value={activeDistrictMetrics.legalCases}
          icon={Gavel}
          tone="critical"
          hint="Court disputes"
        />
      </div>

      {/* CHARTS: DISTRICT COMPARISON IN SELECTED STATE */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelTitle
            title={`District Risk Profile — ${selectedState}`}
            subtitle="Comparative average risk score across districts"
            icon={BarChart3}
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtSummary} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="var(--border)" horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} {...AXIS_STYLE} />
                <YAxis type="category" dataKey="district" width={90} {...AXIS_STYLE} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="avgRisk" name="Avg Risk Score" radius={[0, 4, 4, 0]}>
                  {districtSummary.map((d) => (
                    <Cell
                      key={d.district}
                      fill={
                        d.avgRisk >= 70
                          ? "var(--risk-high)"
                          : d.avgRisk >= 40
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
            title="Compensation vs Possession in Districts"
            subtitle="Disbursal rate against physical possession percentage"
            icon={HandCoins}
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtSummary}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="district" {...AXIS_STYLE} tickFormatter={(d) => d.slice(0, 6)} />
                <YAxis domain={[0, 100]} {...AXIS_STYLE} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="avgComp" name="Compensation %" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgPossession" name="Possession %" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* DRILL-DOWN: CORRIDORS IN SELECTED DISTRICT */}
      <Panel>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <PanelTitle
            title={`Corridors Monitored in ${selectedDistrict}, ${selectedState}`}
            subtitle={`${activeDistrictProjects.length} active land acquisition projects ranked by predicted risk`}
            icon={MapPin}
          />
          <Link to="/app/gis" className="text-xs font-semibold text-primary hover:underline">
            View on GIS Map →
          </Link>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] tracking-wider text-muted-foreground uppercase">
                <th className="py-2.5 font-semibold">Corridor & Agency</th>
                <th className="py-2.5 font-semibold">Stage</th>
                <th className="py-2.5 font-semibold">Land (Ha)</th>
                <th className="py-2.5 font-semibold">Families</th>
                <th className="py-2.5 font-semibold">Compensation</th>
                <th className="py-2.5 font-semibold">Possession</th>
                <th className="py-2.5 font-semibold">Legal Cases</th>
                <th className="py-2.5 font-semibold">Delay Prob</th>
                <th className="py-2.5 font-semibold">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeDistrictProjects.map(({ p, pr }) => (
                <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 pr-3">
                    <Link
                      to="/app/projects/$projectId"
                      params={{ projectId: p.id }}
                      className="font-medium text-foreground hover:text-primary transition-colors block truncate max-w-64"
                    >
                      {p.name}
                    </Link>
                    <span className="text-[10px] text-muted-foreground">{p.projectId} · {p.agency.split(" ")[0]}</span>
                  </td>
                  <td className="py-2.5 pr-2">
                    <span className="rounded bg-surface px-1.5 py-0.5 text-[11px] font-medium text-foreground border border-border">
                      {p.currentStage}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums text-foreground">{p.landArea} ha</td>
                  <td className="py-2.5 pr-2 tabular-nums text-muted-foreground">
                    {p.affectedFamilies.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums">{p.params.compensationPct}%</td>
                  <td className="py-2.5 pr-2 tabular-nums">{p.params.possessionPct}%</td>
                  <td className="py-2.5 pr-2 font-semibold text-risk-high tabular-nums">
                    {p.params.legalDisputes} cases
                  </td>
                  <td className="py-2.5 pr-2 font-semibold tabular-nums text-foreground">
                    {pr.delayProbability}%
                  </td>
                  <td className="py-2.5">
                    <RiskBadge category={pr.riskCategory} score={pr.riskScore} />
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
