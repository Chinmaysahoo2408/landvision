import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  FileText,
  HelpCircle,
  Info,
  Layers,
  Lightbulb,
  Scale,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DemoTag, PageHeader, Panel, PanelTitle } from "@/components/lv/panels";
import { RiskBadge, RiskGauge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";
import type { RiskFactor } from "@/lib/lv/types";

export const Route = createFileRoute("/app/explainable-ai")({
  component: ExplainableAiPage,
  head: () => ({
    meta: [
      { title: "Explainable AI (XAI) & Factor Attribution — LandVision AI" },
      {
        name: "description",
        content:
          "Transparent machine learning explainability. SHAP-style factor attributions, root-cause delay drivers, and plain-language governance summaries.",
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

function ExplainableAiPage() {
  const { visibleProjects, predictions } = useLV();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("nh16");

  const project =
    visibleProjects.find((p) => p.id === selectedProjectId || p.projectId === selectedProjectId) ??
    visibleProjects[0]!;

  const pred = predictions.get(project.id);

  const topFactor = pred?.factors[0];

  const chartData = useMemo(() => {
    if (!pred) return [];
    return pred.factors.map((f) => ({
      name: f.factor,
      contribution: f.contribution,
      raw: f.raw,
      direction: f.direction,
      detail: f.detail,
    }));
  }, [pred]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Explainable AI (XAI) & Factor Attribution Engine"
        description="Demystifying AI predictions for administrative officers. Understand exactly why a corridor is flagged at risk, which factors drive the score, and how specific policy interventions will reduce delays."
      >
        <DemoTag />
      </PageHeader>

      {/* CORRIDOR SELECTOR BAR */}
      <Panel className="bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Target Corridor:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary"
            >
              {visibleProjects.slice(0, 25).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectId}) — {p.district}, {p.state}
                </option>
              ))}
            </select>
          </div>
          {pred ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Prediction:</span>
              <RiskBadge category={pred.riskCategory} score={pred.riskScore} />
            </div>
          ) : null}
        </div>
      </Panel>

      {/* PLAIN-LANGUAGE EXECUTIVE SUMMARY */}
      <Panel className="border-primary/40 bg-gradient-to-r from-primary/10 via-card to-primary/5">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Brain className="size-5" />
          </span>
          <div className="space-y-1">
            <h3 className="font-display text-sm font-bold text-foreground">
              Plain-Language AI Governance Summary for {project.name}
            </h3>
            <p className="text-xs leading-relaxed text-foreground">
              "The model estimates an <strong>{pred?.delayProbability ?? 84}% probability of acquisition delay</strong> (+
              {pred?.expectedDelayDays ?? 144} days) primarily because{" "}
              <strong className="text-risk-critical">{topFactor?.factor ?? "Legal disputes"}</strong> represents{" "}
              <strong>{topFactor?.contribution ?? 24}%</strong> of total risk friction, followed by compensation award
              delays at {project.params.compensationPct}% disbursal."
            </p>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded bg-surface px-2 py-0.5 font-medium border border-border text-foreground">
                Model: {pred?.modelVersion ?? "v2.4"}
              </span>
              <span>·</span>
              <span>Deterministic multi-variate SHAP attribution</span>
            </div>
          </div>
        </div>
      </Panel>

      {/* SHAP-STYLE FEATURE ATTRIBUTION CHART */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <Panel>
            <PanelTitle
              title="SHAP-Style Factor Attribution Breakdown"
              subtitle="Percentage share of each input parameter contributing to total predicted risk score"
              icon={Scale}
              ai
            />

            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 24, right: 24 }}>
                  <CartesianGrid stroke="var(--border)" horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 40]} unit="%" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis type="category" dataKey="name" width={140} stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(val: number) => [`${val}%`, "Contribution Share"]}
                  />
                  <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                    {chartData.map((d) => (
                      <Cell
                        key={d.name}
                        fill={
                          d.contribution > 20
                            ? "var(--risk-critical)"
                            : d.contribution > 12
                              ? "var(--risk-high)"
                              : "var(--risk-medium)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* SENSITIVITY EXPLANATIONS */}
          <Panel>
            <PanelTitle
              title="Detailed Contributing Factor Analysis"
              subtitle="Granular breakdown of parameter severities and mitigation levers"
              icon={Info}
            />

            <div className="mt-3 space-y-3">
              {pred?.factors.map((f) => (
                <div key={f.factor} className="rounded-xl border border-border bg-card p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{f.factor}</span>
                    <span className="rounded bg-surface px-2 py-0.5 font-bold text-foreground border border-border">
                      {f.contribution}% share
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{f.detail}</p>
                  <p className="mt-1 text-[11px] text-primary font-medium">
                    Mitigation lever: Resolving this factor reduces risk score by estimated {Math.round(f.contribution * 0.7)}–{Math.round(f.contribution * 0.9)} points.
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* RIGHT COLUMN: GAUGE & WHAT-IF ACTIONS */}
        <div className="space-y-4 lg:col-span-5">
          <Panel className="text-center">
            <PanelTitle title="Predicted Delay Risk" icon={Brain} />
            <div className="flex justify-center my-3">
              <RiskGauge score={pred?.riskScore ?? 82} category={pred?.riskCategory ?? "HIGH"} size={170} />
            </div>
            <p className="text-xs text-muted-foreground">
              Expected project slippage: <strong className="text-foreground">+{pred?.expectedDelayDays ?? 144} days</strong>
            </p>
          </Panel>

          {/* COUNTERFACTUAL WHAT-IF SIMULATION */}
          <Panel className="border-primary/30">
            <PanelTitle
              title="Counterfactual What-If Scenarios"
              subtitle="Projected risk score if administrative bottlenecks are cleared"
              icon={Sparkles}
              ai
            />

            <div className="mt-3 space-y-3 text-xs">
              <div className="rounded-lg border border-border bg-surface p-3">
                <div className="flex justify-between font-semibold text-foreground">
                  <span>If Legal Disputes drop from 12 → 4:</span>
                  <span className="text-risk-low font-bold">Risk 82% → 64% (-18%)</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Lok Adalat pre-litigation settlement campaign</p>
              </div>

              <div className="rounded-lg border border-border bg-surface p-3">
                <div className="flex justify-between font-semibold text-foreground">
                  <span>If Compensation reaches 90%+:</span>
                  <span className="text-risk-low font-bold">Risk 82% → 68% (-14%)</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Direct beneficiary bank transfer camp deployment</p>
              </div>

              <div className="rounded-lg border border-border bg-surface p-3">
                <div className="flex justify-between font-semibold text-foreground">
                  <span>If Combined Actions Taken:</span>
                  <span className="text-risk-low font-bold">Risk 82% → 42% (-40%)</span>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">Total delay mitigation: ~90 days saved</p>
              </div>
            </div>

            <div className="mt-4">
              <Link
                to="/app/predictor"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Zap className="size-3.5" /> Test Custom What-If Simulation
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
