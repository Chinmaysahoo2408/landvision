import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Clock,
  Layers,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
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
import { DemoTag, Panel, PanelTitle, PageHeader, StatCard } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";
import { overallProgress } from "@/lib/lv/risk";
import type { RiskCategory } from "@/lib/lv/types";

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard — LandVision AI Predictive Governance" },
      {
        name: "description",
        content:
          "National land acquisition risk overview: predicted delays, risk distribution, hotspots and priority interventions.",
      },
      { property: "og:title", content: "LandVision AI Dashboard" },
      {
        property: "og:description",
        content: "Predicted delays, risk distribution and priority interventions across acquisition projects.",
      },
    ],
  }),
});

const CAT_COLORS: Record<RiskCategory, string> = {
  LOW: "var(--risk-low)",
  MEDIUM: "var(--risk-medium)",
  HIGH: "var(--risk-high)",
  CRITICAL: "var(--risk-critical)",
};

function DashboardPage() {
  const { visibleProjects, predictions, alerts } = useLV();

  const stats = useMemo(() => {
    const rows = visibleProjects.map((p) => ({ p, pr: predictions.get(p.id)! })).filter((r) => r.pr);
    const dist: Record<RiskCategory, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    let delaySum = 0;
    let families = 0;
    for (const r of rows) {
      dist[r.pr.riskCategory] += 1;
      delaySum += r.pr.expectedDelayDays;
      families += r.p.affectedFamilies;
    }
    const byState = new Map<string, { total: number; risk: number }>();
    for (const r of rows) {
      const cur = byState.get(r.p.state) ?? { total: 0, risk: 0 };
      cur.total += 1;
      cur.risk += r.pr.riskScore;
      byState.set(r.p.state, cur);
    }
    const hotspots = [...byState.entries()]
      .map(([state, v]) => ({ state, avg: Math.round(v.risk / v.total), total: v.total }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8);

    const top = [...rows].sort((a, b) => b.pr.riskScore - a.pr.riskScore).slice(0, 8);

    const byType = new Map<string, { n: number; risk: number }>();
    for (const r of rows) {
      const cur = byType.get(r.p.type) ?? { n: 0, risk: 0 };
      cur.n += 1;
      cur.risk += r.pr.riskScore;
      byType.set(r.p.type, cur);
    }

    const trend = Array.from({ length: 12 }, (_, i) => {
      const month = new Date(2026, i, 1).toLocaleString("en-IN", { month: "short" });
      const base = rows.length ? delaySum / rows.length : 0;
      return {
        month,
        predicted: Math.round(base * (0.82 + Math.sin(i / 2.1) * 0.12 + i * 0.012)),
        actual: Math.round(base * (0.9 + Math.cos(i / 2.4) * 0.1)),
      };
    });

    return {
      rows,
      dist,
      hotspots,
      top,
      families,
      trend,
      avgDelay: rows.length ? Math.round(delaySum / rows.length) : 0,
      typeData: [...byType.entries()].map(([type, v]) => ({
        type,
        risk: Math.round(v.risk / v.n),
        projects: v.n,
      })),
    };
  }, [visibleProjects, predictions]);

  const pieData = (Object.keys(stats.dist) as RiskCategory[]).map((k) => ({
    name: k,
    value: stats.dist[k],
  }));

  return (
    <div>
      <PageHeader
        title="Predictive governance dashboard"
        description="Live risk posture across every monitored land acquisition project, scored by the LandVision prediction engine."
      >
        <DemoTag />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Monitored projects" value={stats.rows.length} icon={Layers} to="/app/projects" />
        <StatCard
          label="High + critical risk"
          value={stats.dist.HIGH + stats.dist.CRITICAL}
          icon={AlertTriangle}
          tone="high"
          hint="Require intervention planning"
          to="/app/projects"
          search={{ risk: "HIGH" }}
        />
        <StatCard
          label="Avg predicted delay"
          value={stats.avgDelay}
          suffix="d"
          icon={Clock}
          tone="medium"
          hint="Weighted across active stages"
        />
        <StatCard
          label="Affected families"
          value={stats.families}
          icon={Users}
          hint="Across all monitored parcels"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelTitle
            title="Predicted vs realised delay"
            subtitle="Rolling twelve-month delay signal, in days"
            icon={TrendingUp}
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trend}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="predicted" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="actual" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelTitle title="Risk distribution" subtitle="Projects by predicted category" icon={Activity} />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={CAT_COLORS[entry.name as RiskCategory]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelTitle
            title="Highest risk projects"
            subtitle="Ranked by predicted delay risk score"
            icon={AlertTriangle}
            action={
              <Link to="/app/projects" className="text-xs font-medium text-primary hover:underline">
                View all
              </Link>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] tracking-wide text-muted-foreground uppercase">
                  <th className="pb-2 font-medium">Project</th>
                  <th className="pb-2 font-medium">District</th>
                  <th className="pb-2 font-medium">Stage</th>
                  <th className="pb-2 font-medium">Progress</th>
                  <th className="pb-2 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {stats.top.map(({ p, pr }) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="py-2.5 pr-3">
                      <Link
                        to="/app/projects/$projectId"
                        params={{ projectId: p.id }}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {p.name}
                      </Link>
                      <p className="text-[11px] text-muted-foreground">{p.projectId}</p>
                    </td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{p.district}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{p.currentStage}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground tabular-nums">{overallProgress(p)}%</td>
                    <td className="py-2.5">
                      <RiskBadge category={pr.riskCategory} score={pr.riskScore} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel>
          <PanelTitle title="State hotspots" subtitle="Average predicted risk score" icon={Sparkles} ai />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.hotspots} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="state"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  width={92}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="avg" fill="var(--chart-1)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelTitle title="Risk by project type" subtitle="Average score and portfolio size" icon={Layers} />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.typeData}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="type" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="risk" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelTitle
            title="Latest alerts"
            subtitle="Automatic threshold breaches"
            icon={AlertTriangle}
            action={
              <Link to="/app/alerts" className="text-xs font-medium text-primary hover:underline">
                All alerts
              </Link>
            }
          />
          <ul className="space-y-3">
            {alerts.slice(0, 6).map((a) => (
              <li key={a.id} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium text-foreground">{a.projectName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.message}</p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {a.severity} · {a.status}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
