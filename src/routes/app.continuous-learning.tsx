import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Brain,
  CheckCircle2,
  Cpu,
  Database,
  GitBranch,
  Layers,
  LineChart,
  Loader2,
  RefreshCw,
  Repeat,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { DemoTag, PageHeader, Panel, PanelTitle, StatCard } from "@/components/lv/panels";
import { useLV } from "@/lib/lv/store";

export const Route = createFileRoute("/app/continuous-learning")({
  component: ContinuousLearningPage,
  head: () => ({
    meta: [
      { title: "Continuous Learning & Automated ML Pipeline — LandVision AI" },
      {
        name: "description",
        content:
          "Demonstrating automated model retraining, data ingestion validation, feature engineering, model versioning, and continuous learning lifecycle for SIH evaluation.",
      },
    ],
  }),
});

const PIPELINE_STEPS = [
  { n: "01", name: "New Corridor Data Ingestion", icon: Database, desc: "Real-time telemetry, court dockets, and DBT bank transfer logs." },
  { n: "02", name: "Data Validation & Cleansing", icon: ShieldCheck, desc: "Schema validation, anomaly filtering, and duplicate mutation removal." },
  { n: "03", name: "Dynamic Feature Engineering", icon: Cpu, desc: "Extraction of Section 64 litigation ratios and stakeholder friction indices." },
  { n: "04", name: "Model Retraining & Calibration", icon: Repeat, desc: "Ensemble Random Forest & XGBoost hyperparameter cross-validation." },
  { n: "05", name: "Model Evaluation & Benchmarking", icon: LineChart, desc: "Verification against holdout sets for accuracy, recall, and ROC-AUC." },
  { n: "06", name: "Model Versioning & Promotion", icon: GitBranch, desc: "Semantic versioning (v2.4 → v2.5) with automated rollback guardrails." },
  { n: "07", name: "Live Inference API Deployment", icon: Zap, desc: "Instant zero-downtime serving across national command center dashboards." },
];

function ContinuousLearningPage() {
  const { modelVersion, retrainingHistory, retrainModel, visibleProjects } = useLV();
  const [isRetraining, setIsRetraining] = useState(false);

  const activeModel = retrainingHistory.find((m) => m.status === "Active") ?? retrainingHistory[0]!;

  const handleRetrain = async () => {
    setIsRetraining(true);
    try {
      const newLog = await retrainModel();
      toast.success(`Model successfully retrained! Promoted to ${newLog.version} (Accuracy: ${newLog.accuracy}%)`);
    } catch (err) {
      toast.error("Failed to retrain model.");
    } finally {
      setIsRetraining(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Continuous Learning & MLOps Pipeline"
        description="Continuous model retraining lifecycle. As new ground-truth outcomes (disputes settled, awards disbursed, possession handed over) are recorded, the AI model automatically adapts and upgrades."
      >
        <div className="flex items-center gap-2">
          <DemoTag />
          <button
            onClick={handleRetrain}
            disabled={isRetraining}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:shadow-[var(--shadow-glow)] disabled:opacity-60"
          >
            {isRetraining ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            {isRetraining ? "RETRAINING MODEL..." : "Trigger Model Retraining"}
          </button>
        </div>
      </PageHeader>

      {/* ACTIVE MODEL STATS */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Active Model" value={modelVersion} icon={GitBranch} hint="Production release" />
        <StatCard
          label="Training Samples"
          value={activeModel.trainingSamples}
          icon={Database}
          hint="Corridor instances"
        />
        <StatCard
          label="Model Accuracy"
          value={activeModel.accuracy}
          suffix="%"
          icon={CheckCircle2}
          tone="ai"
          hint="Test set validation"
        />
        <StatCard
          label="Precision Rate"
          value={activeModel.precision}
          suffix="%"
          icon={Sparkles}
          tone="low"
          hint="Early delay true positives"
        />
        <StatCard
          label="Recall Sensitivity"
          value={activeModel.recall}
          suffix="%"
          icon={Activity}
          tone="low"
          hint="Bottleneck capture rate"
        />
        <StatCard
          label="ROC-AUC Score"
          value={activeModel.rocAuc}
          icon={LineChart}
          tone="ai"
          hint="Discriminative power"
        />
      </div>

      {/* CONTINUOUS LEARNING PIPELINE FLOW */}
      <Panel>
        <PanelTitle
          title="7-Stage Continuous Learning Lifecycle Pipeline"
          subtitle="Closed-loop MLOps architecture for continuous ingestion, calibration, and deployment"
          icon={Repeat}
          ai
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {PIPELINE_STEPS.map((step, idx) => (
            <div
              key={step.n}
              className="relative flex flex-col justify-between rounded-xl border border-border bg-card p-3.5 shadow-2xs hover:border-primary/50 transition-colors"
            >
              <div>
                <span className="font-display text-xs font-bold text-primary">{step.n}</span>
                <step.icon className="mt-2 size-5 text-foreground" />
                <h4 className="mt-2 font-display text-xs font-bold text-foreground">{step.name}</h4>
                <p className="mt-1 text-[11px] text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* MODEL VERSION HISTORY & AUDIT LOG */}
      <Panel>
        <PanelTitle
          title="Model Versioning & Retraining Registry"
          subtitle="Audit-logged history of trained model artifacts and performance benchmarks"
          icon={ServerCog}
        />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] tracking-wider text-muted-foreground uppercase">
                <th className="py-2.5 font-semibold">Model Version</th>
                <th className="py-2.5 font-semibold">Dataset Size</th>
                <th className="py-2.5 font-semibold">Train / Test Split</th>
                <th className="py-2.5 font-semibold">Accuracy</th>
                <th className="py-2.5 font-semibold">Precision / Recall</th>
                <th className="py-2.5 font-semibold">F1 Score / AUC</th>
                <th className="py-2.5 font-semibold">Training Timestamp</th>
                <th className="py-2.5 font-semibold">Deployment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {retrainingHistory.map((m) => (
                <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3 font-bold text-foreground flex items-center gap-2">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary font-mono">{m.version}</span>
                  </td>
                  <td className="py-3 tabular-nums font-medium text-foreground">{m.datasetSize} records</td>
                  <td className="py-3 tabular-nums text-muted-foreground">
                    {m.trainingSamples} / {m.testSamples}
                  </td>
                  <td className="py-3 tabular-nums font-bold text-risk-low">{m.accuracy}%</td>
                  <td className="py-3 tabular-nums text-foreground">
                    {m.precision}% / {m.recall}%
                  </td>
                  <td className="py-3 tabular-nums font-semibold text-foreground">
                    {m.f1Score}% (AUC: {m.rocAuc})
                  </td>
                  <td className="py-3 tabular-nums text-muted-foreground">
                    {new Date(m.trainingDate).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        m.status === "Active"
                          ? "bg-risk-low text-white"
                          : "bg-surface border border-border text-muted-foreground"
                      }`}
                    >
                      {m.status}
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
