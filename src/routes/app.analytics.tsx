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
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { useLV } from "@/lib/lv/store";
import { overallProgress } from "@/lib/lv/risk";
import { DemoTag, Panel, PanelTitle, PageHeader } from "@/components/lv/panels";
import { STAGES } from "@/lib/lv/types";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — LandVision AI" },
      {
        name: "description",
        content: "Comparative analytics on delay risk by state, stage, project type and acquisition performance.",
      },
      { property: "og:title", content: "Analytics — LandVision AI" },
      { property: "og:description", content: "Land acquisition delay analytics and benchmarking." },
    ],
  }),
  component: AnalyticsPage,
});

const AXIS = { stroke: "var(--muted-foreground)", fontSize: 11 };

function AnalyticsPage() {
  const { visibleProjects, predictions } = useLV();

  const data = useMemo(() => {
    const byState = new Map<string, { sum: number; n: number; delay: number }>();
    const byStage = new Map<string, { sum: number; n: number }>();
    const byType = new Map<string, { sum: number; n: number }>();
    const scatter: { progress: number; risk: number; families: number }[] = [];

    for (const p of visibleProjects) {
      const pred = predictions.get(p.id);
      if (!pred) continue;
      const s = byState.get(p.state) ?? { sum: 0, n: 0, delay: 0 };
      byState.set(p.state, { sum: s.sum + pred.riskScore, n: s.n + 1, delay: s.delay + pred.expectedDelayDays });
      const st = byStage.get(p.currentStage) ?? { sum: 0, n: 0 };
      byStage.set(p.currentStage, { sum: st.sum + pred.riskScore, n: st.n + 1 });
      const t = byType.get(p.type) ?? { sum: 0, n: 0 };
      byType.set(p.type, { sum: t.sum + pred.riskScore, n: t.n + 1 });
    }

    for (const p of visibleProjects.slice(0, 220)) {
      const pred = predictions.get(p.id);
      if (!pred) continue;
      scatter.push({ progress: overallProgress(p), risk: pred.riskScore, families: p.affectedFamilies });
    }

    return {
      states: Array.from(byState.entries())
        .map(([state, v]) => ({ state, risk: Math.round(v.sum / v.n), delay: Math.round(v.delay / v.n) }))
        .sort((a, b) => b.risk - a.risk),
      stages: STAGES.map((s) => {
        const v = byStage.get(s);
        return { stage: s.split(" ")[0]!, risk: v ? Math.round(v.sum / v.n) : 0 };
      }),
      types: Array.from(byType.entries()).map(([type, v]) => ({ type, risk: Math.round(v.sum / v.n) })),
      scatter,
    };
  }, [visibleProjects, predictions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Benchmark risk performance across states, stages, project types and delivery progress."
      >
        <DemoTag />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelTitle title="Average risk by state" icon={BarChart3} />
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.states} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} {...AXIS} />
              <YAxis type="category" dataKey="state" width={110} {...AXIS} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Bar dataKey="risk" radius={[0, 6, 6, 0]}>
                {data.states.map((d) => (
                  <Cell
                    key={d.state}
                    fill={d.risk >= 70 ? "var(--risk-high)" : d.risk >= 40 ? "var(--risk-medium)" : "var(--risk-low)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <PanelTitle title="Risk profile by acquisition stage" icon={BarChart3} />
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={data.stages}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="stage" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
              <Radar dataKey="risk" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.28} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <PanelTitle title="Average predicted delay by state" icon={BarChart3} />
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.states}>
              <CartesianGrid stroke="var(--border)" />
              <XAxis dataKey="state" hide />
              <YAxis {...AXIS} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="delay" name="Avg delay (days)" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Panel>

        <Panel>
          <PanelTitle title="Progress versus predicted risk" icon={BarChart3} subtitle="Each point is a monitored project" />
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid stroke="var(--border)" />
              <XAxis type="number" dataKey="progress" name="Progress %" domain={[0, 100]} {...AXIS} />
              <YAxis type="number" dataKey="risk" name="Risk" domain={[0, 100]} {...AXIS} />
              <ZAxis type="number" dataKey="families" range={[20, 200]} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
              <Scatter data={data.scatter} fill="var(--chart-2)" fillOpacity={0.55} />
            </ScatterChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      <Panel>
        <PanelTitle title="Average risk by project type" icon={BarChart3} />
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data.types}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="type" {...AXIS} />
            <YAxis domain={[0, 100]} {...AXIS} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
            <Bar dataKey="risk" fill="var(--primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
