import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Building2, Layers, MapPin, TrendingUp, Users } from "lucide-react";
import {
  DemoTag,
  Panel,
  PanelTitle,
  PageHeader,
  StatCard,
} from "@/components/lv/panels";
import { useLV } from "@/lib/lv/store";
import { overallProgress } from "@/lib/lv/risk";
import type { RiskCategory } from "@/lib/lv/types";

export const Route = createFileRoute("/public/statistics")({
  head: () => ({
    meta: [
      { title: "Statistics — LandVision Public Portal" },
      {
        name: "description",
        content:
          "Aggregate statistics on land acquisition — progress, risk distribution, compensation, R&R, project status and delay trends.",
      },
      {
        property: "og:title",
        content: "Statistics — LandVision Public Portal",
      },
      {
        property: "og:description",
        content: "Aggregate land acquisition statistics for citizens.",
      },
    ],
  }),
  component: PublicStatistics,
});

const CAT_COLORS: Record<RiskCategory, string> = {
  LOW: "var(--risk-low)",
  MEDIUM: "var(--risk-medium)",
  HIGH: "var(--risk-high)",
  CRITICAL: "var(--risk-critical)",
};
const STATUS_COLORS: Record<string, string> = {
  Active: "var(--chart-1)",
  "On Hold": "var(--risk-high)",
  Completed: "var(--chart-2)",
};
const AXIS = { stroke: "var(--muted-foreground)", fontSize: 11 } as const;
const TOOLTIP = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
} as const;

function PublicStatistics() {
  const { visibleProjects, predictions } = useLV();

  const data = useMemo(() => {
    const total = visibleProjects.length;
    const families = visibleProjects.reduce(
      (s, p) => s + p.affectedFamilies,
      0,
    );
    const states = new Set(visibleProjects.map((p) => p.state));
    const avgProgress = total
      ? Math.round(
          visibleProjects.reduce((s, p) => s + overallProgress(p), 0) / total,
        )
      : 0;

    const risk: Record<RiskCategory, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    const status: Record<string, number> = {
      Active: 0,
      "On Hold": 0,
      Completed: 0,
    };
    const byState = new Map<string, number>();
    const progressBuckets = [
      { name: "0–25%", value: 0 },
      { name: "26–50%", value: 0 },
      { name: "51–75%", value: 0 },
      { name: "76–100%", value: 0 },
    ];
    const typeAgg = new Map<string, { comp: number; rr: number; n: number }>();
    const yearAgg = new Map<number, { delay: number; n: number }>();

    for (const p of visibleProjects) {
      const pr = predictions.get(p.id);
      if (pr) risk[pr.riskCategory] += 1;
      status[p.status] = (status[p.status] ?? 0) + 1;
      byState.set(p.state, (byState.get(p.state) ?? 0) + 1);

      const pct = overallProgress(p);
      const bi = pct <= 25 ? 0 : pct <= 50 ? 1 : pct <= 75 ? 2 : 3;
      const bucket = progressBuckets[bi];
      if (bucket) bucket.value += 1;

      const t = typeAgg.get(p.type) ?? { comp: 0, rr: 0, n: 0 };
      t.comp += p.params.compensationPct;
      t.rr += p.params.rrPct;
      t.n += 1;
      typeAgg.set(p.type, t);

      if (pr) {
        const y = yearAgg.get(p.startYear) ?? { delay: 0, n: 0 };
        y.delay += pr.expectedDelayDays;
        y.n += 1;
        yearAgg.set(p.startYear, y);
      }
    }

    return {
      total,
      families,
      states: states.size,
      avgProgress,
      riskData: (Object.keys(risk) as RiskCategory[]).map((k) => ({
        name: k,
        value: risk[k],
      })),
      statusData: Object.keys(status).map((k) => ({
        name: k,
        value: status[k] ?? 0,
      })),
      stateData: [...byState.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      progressBuckets,
      typeData: [...typeAgg.entries()].map(([name, v]) => ({
        name,
        Compensation: Math.round(v.comp / v.n),
        "R&R": Math.round(v.rr / v.n),
      })),
      delayTrend: [...yearAgg.entries()]
        .map(([year, v]) => ({
          year: String(year),
          delay: Math.round(v.delay / v.n),
        }))
        .sort((a, b) => Number(a.year) - Number(b.year)),
    };
  }, [visibleProjects, predictions]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Land acquisition statistics"
        description="Aggregate figures across all tracked projects. All values are demonstration data generated from a synthetic dataset."
      >
        <DemoTag />
      </PageHeader>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total projects" value={data.total} icon={Building2} />
        <StatCard
          label="Average progress"
          value={data.avgProgress}
          suffix="%"
          icon={TrendingUp}
          tone="ai"
        />
        <StatCard label="States covered" value={data.states} icon={MapPin} />
        <StatCard
          label="Families in scope"
          value={data.families}
          icon={Users}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelTitle
            title="Risk distribution"
            subtitle="Projects by predicted risk category."
            icon={Layers}
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.riskData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {data.riskData.map((e) => (
                    <Cell
                      key={e.name}
                      fill={CAT_COLORS[e.name as RiskCategory]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelTitle
            title="Project status"
            subtitle="Active, on hold and completed projects."
            icon={Layers}
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {data.statusData.map((e) => (
                    <Cell
                      key={e.name}
                      fill={STATUS_COLORS[e.name] ?? "var(--chart-3)"}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel className="mt-6">
        <PanelTitle
          title="Projects by state"
          subtitle="Count of tracked projects in each state."
          icon={MapPin}
        />
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.stateData} margin={{ bottom: 40 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                angle={-35}
                textAnchor="end"
                interval={0}
                height={60}
                {...AXIS}
              />
              <YAxis {...AXIS} />
              <Tooltip contentStyle={TOOLTIP} />
              <Bar
                dataKey="value"
                name="Projects"
                fill="var(--chart-2)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelTitle
            title="Acquisition progress"
            subtitle="Distribution of overall project progress."
            icon={TrendingUp}
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.progressBuckets}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" {...AXIS} />
                <YAxis {...AXIS} />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar
                  dataKey="value"
                  name="Projects"
                  fill="var(--primary)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelTitle
            title="Compensation &amp; R&amp;R by type"
            subtitle="Average disbursal and rehabilitation progress."
            icon={Layers}
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.typeData} margin={{ bottom: 30 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                  height={50}
                  {...AXIS}
                />
                <YAxis unit="%" {...AXIS} />
                <Tooltip contentStyle={TOOLTIP} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="Compensation"
                  fill="var(--chart-4)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="R&R"
                  fill="var(--chart-5)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel className="mt-6">
        <PanelTitle
          title="Delay trend by start year"
          subtitle="Average predicted delay (days) for projects grouped by the year acquisition began — aggregate figures only."
          icon={TrendingUp}
          ai
        />
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.delayTrend}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="year" {...AXIS} />
              <YAxis unit="d" {...AXIS} />
              <Tooltip contentStyle={TOOLTIP} />
              <Line
                type="monotone"
                dataKey="delay"
                name="Avg delay (days)"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
