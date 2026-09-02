import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
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
import {
  Activity,
  Braces,
  Cpu,
  GitBranch,
  Info,
  Layers,
  ServerCog,
  ShieldCheck,
  Sigma,
} from "lucide-react";
import {
  DemoTag,
  Panel,
  PanelTitle,
  PageHeader,
  StatCard,
} from "@/components/lv/panels";
import { useLV } from "@/lib/lv/store";
import { MODEL_VERSION } from "@/lib/lv/risk";
import type { RiskCategory } from "@/lib/lv/types";

export const Route = createFileRoute("/app/model")({
  head: () => ({
    meta: [
      { title: "Model intelligence — LandVision AI" },
      {
        name: "description",
        content:
          "Risk prediction engine status, feature importance, prediction distribution and model transparency for LandVision AI.",
      },
      { property: "og:title", content: "Model intelligence — LandVision AI" },
      {
        name: "og:description",
        content: "Transparency view of the LandVision risk prediction engine.",
      },
    ],
  }),
  component: ModelPage,
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

// Feature weights are the genuine design of the deterministic engine in
// src/lib/lv/risk.ts (weighted()). They are presented here as "feature
// importance" because they are exactly the weights the engine applies.
const FEATURES: { label: string; weight: number; input: string }[] = [
  { label: "Legal disputes", weight: 26, input: "Open disputes, capped at 12" },
  {
    label: "Compensation delay",
    weight: 22,
    input: "Share of compensation not yet disbursed",
  },
  {
    label: "Pending approvals",
    weight: 16,
    input: "Statutory approvals awaiting clearance, capped at 9",
  },
  {
    label: "Documentation gaps",
    weight: 13,
    input: "Share of land records not yet verified",
  },
  {
    label: "R&R progress",
    weight: 10,
    input: "Share of families not yet rehabilitated",
  },
  {
    label: "Stakeholder responsiveness",
    weight: 7,
    input: "Responsiveness index (0–100)",
  },
  {
    label: "Historical administrative performance",
    weight: 6,
    input: "District performance index (0–100)",
  },
];

function ModelPage() {
  const { visibleProjects, predictions, thresholds, ready } = useLV();

  const stats = useMemo(() => {
    const dist: Record<RiskCategory, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    let scoreSum = 0;
    let scored = 0;
    for (const p of visibleProjects) {
      const pr = predictions.get(p.id);
      if (!pr) continue;
      dist[pr.riskCategory] += 1;
      scoreSum += pr.riskScore;
      scored += 1;
    }
    const avg = scored ? Math.round(scoreSum / scored) : 0;
    return { dist, avg, scored };
  }, [visibleProjects, predictions]);

  const distData = (Object.keys(stats.dist) as RiskCategory[]).map((k) => ({
    name: k,
    value: stats.dist[k],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Model intelligence"
        description="Status and transparency for the LandVision risk prediction engine — how risk scores are produced and where the engine currently sits."
      >
        <DemoTag />
      </PageHeader>

      <Panel className="border-primary/40 bg-primary/5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-background text-primary">
            <Info className="size-4.5" aria-hidden />
          </span>
          <div className="text-sm text-foreground">
            <p className="font-semibold">
              Simulation engine — not a trained ML model
            </p>
            <p className="mt-1 text-muted-foreground">
              This build uses a deterministic, rule-based scoring engine. It
              produces risk scores from a fixed, weighted formula over
              acquisition parameters — it is not a statistically trained
              machine-learning model, so there are no measured accuracy,
              precision or recall figures to report. The feature weights,
              distributions and stage risks shown below are genuine outputs of
              that engine on the current dataset. The interface is structured to
              swap in a real ML service (a{" "}
              <code className="rounded bg-card px-1 py-0.5 text-xs">
                POST /predict
              </code>{" "}
              API) without UI changes.
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Engine status"
          value={ready ? 1 : 0}
          icon={ServerCog}
          tone="ai"
          hint={ready ? "Operational" : "Initialising"}
        />
        <StatCard
          label="Model version"
          value={2.4}
          icon={GitBranch}
          hint={MODEL_VERSION}
        />
        <StatCard label="Projects scored" value={stats.scored} icon={Cpu} />
        <StatCard
          label="Mean risk score"
          value={stats.avg}
          suffix="/100"
          icon={Sigma}
          tone="medium"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel>
          <PanelTitle
            title="Feature importance"
            subtitle="Fixed weights the engine assigns to each acquisition parameter (sums to 100)."
            icon={Layers}
            ai
          />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={FEATURES}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0, 30]} {...AXIS} unit="%" />
                <YAxis type="category" dataKey="label" width={180} {...AXIS} />
                <Tooltip
                  contentStyle={TOOLTIP}
                  formatter={(v: number) => [`${v}%`, "Weight"]}
                />
                <Bar
                  dataKey="weight"
                  fill="var(--primary)"
                  radius={[0, 6, 6, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelTitle
            title="Risk prediction distribution"
            subtitle="Live categorisation of scored projects."
            icon={Activity}
          />
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={104}
                  paddingAngle={3}
                >
                  {distData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={CAT_COLORS[entry.name as RiskCategory]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
            {distData.map((d) => (
              <span key={d.name} className="inline-flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: CAT_COLORS[d.name as RiskCategory] }}
                />
                {d.name} · {d.value}
              </span>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelTitle
            title="How a prediction is computed"
            subtitle="The engine is fully transparent and reproducible."
            icon={Braces}
          />
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                1
              </span>
              Each acquisition parameter is normalised to a 0–1 severity value.
            </li>
            <li className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                2
              </span>
              Severities are multiplied by the fixed weights above and summed
              into a 0–100 risk score.
            </li>
            <li className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                3
              </span>
              The score is classified using the configurable thresholds (medium{" "}
              {thresholds.medium}, high {thresholds.high}, critical{" "}
              {thresholds.critical}).
            </li>
            <li className="flex gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                4
              </span>
              Per-stage risk, delay probability and recommendations are derived
              from the same parameters.
            </li>
          </ol>
          <p className="mt-4 rounded-lg border border-border bg-surface p-3 text-xs text-muted-foreground">
            Because the mapping is deterministic, identical inputs always yield
            identical outputs — there is no random inference and no training
            data involved.
          </p>
        </Panel>

        <Panel>
          <PanelTitle
            title="Validation &amp; accuracy metrics"
            subtitle="What is and isn't available in this build."
            icon={ShieldCheck}
          />
          <div className="space-y-3 text-sm">
            <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-3">
              <div>
                <p className="font-medium text-foreground">
                  Measured accuracy / precision / recall
                </p>
                <p className="text-xs text-muted-foreground">
                  Requires a trained model validated against realised outcomes.
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Not available
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-3">
              <div>
                <p className="font-medium text-foreground">
                  Feature weights (design)
                </p>
                <p className="text-xs text-muted-foreground">
                  Fixed, documented and shown above.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Available
              </span>
            </div>
            <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-surface p-3">
              <div>
                <p className="font-medium text-foreground">
                  Live prediction distribution
                </p>
                <p className="text-xs text-muted-foreground">
                  Computed on the current dataset in real time.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Available
              </span>
            </div>
            <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              When a trained model is connected via the prediction API, measured
              validation metrics will populate this panel automatically.
            </p>
          </div>
        </Panel>
      </div>

      <Panel className="p-0">
        <div className="p-5">
          <PanelTitle
            title="Model inputs"
            subtitle="The parameters consumed by the prediction engine and how each is derived."
            icon={Layers}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface">
              <tr className="text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-5 py-2.5 font-medium">Feature</th>
                <th className="px-5 py-2.5 font-medium">Derived from</th>
                <th className="px-5 py-2.5 text-right font-medium">Weight</th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.label} className="border-t border-border">
                  <td className="px-5 py-2.5 font-medium text-foreground">
                    {f.label}
                  </td>
                  <td className="px-5 py-2.5 text-muted-foreground">
                    {f.input}
                  </td>
                  <td className="px-5 py-2.5 text-right tabular-nums text-foreground">
                    {f.weight}%
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
