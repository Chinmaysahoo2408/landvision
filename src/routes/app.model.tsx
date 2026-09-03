import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Braces,
  CheckCircle2,
  Cpu,
  Database,
  FileCheck,
  GitBranch,
  Info,
  Layers,
  LineChart,
  MapPin,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  Sigma,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  DemoTag,
  PageHeader,
  Panel,
  PanelTitle,
  StatCard,
} from "@/components/lv/panels";
import { MODEL_VERSION } from "@/lib/lv/risk";
import { useLV } from "@/lib/lv/store";
import { DEMO_LOCATIONS } from "@/lib/lv/data";
import type { RiskCategory } from "@/lib/lv/types";

export const Route = createFileRoute("/app/model")({
  head: () => ({
    meta: [
      { title: "AI Model Performance & Evaluation Metrics — LandVision AI" },
      {
        name: "description",
        content:
          "Benchmark AI delay prediction models: XGBoost, Random Forest, and Logistic Regression with Confusion Matrix, Feature Importance, and Location Performance.",
      },
      { property: "og:title", content: "Model Performance — LandVision AI" },
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

const MODEL_COMPARISONS = [
  {
    model: "XGBoost Classifier (Production)",
    accuracy: 94.2,
    precision: 92.8,
    recall: 91.5,
    f1Score: 92.1,
    rocAuc: 0.962,
    mae: "4.2 days",
    rmse: "6.8 days",
    r2: 0.89,
    latencyMs: 14,
    status: "Active Production (v2.4)",
  },
  {
    model: "Random Forest Ensemble",
    accuracy: 92.6,
    precision: 90.4,
    recall: 89.1,
    f1Score: 89.7,
    rocAuc: 0.945,
    mae: "5.1 days",
    rmse: "7.9 days",
    r2: 0.84,
    latencyMs: 18,
    status: "Benchmark Baseline",
  },
  {
    model: "Logistic Regression",
    accuracy: 84.1,
    precision: 81.2,
    recall: 79.8,
    f1Score: 80.5,
    rocAuc: 0.864,
    mae: "8.4 days",
    rmse: "12.1 days",
    r2: 0.71,
    latencyMs: 4,
    status: "Linear Baseline",
  },
];

// REQUIRED FEATURE IMPORTANCE
const FEATURES = [
  { label: "Case Duration / Delay", weight: 28, input: "Historical FIR days pending & hearing frequency" },
  { label: "Location / District", weight: 22, input: "Geographic risk density & local court backlog" },
  { label: "Category / Issue Type", weight: 18, input: "Land compensation, title conflict, or R&R dispute" },
  { label: "Previous Cases Count", weight: 14, input: "Historical litigation history & repeat land titles" },
  { label: "Severity / Escalation", weight: 10, input: "Court stay risk & law-and-order severity rating" },
  { label: "Department Velocity", weight: 5, input: "Inter-departmental file transit time" },
  { label: "Stakeholder Index", weight: 3, input: "Multi-stakeholder composite responsiveness" },
];

// REQUIRED PERFORMANCE BY LOCATION
const LOCATION_PERFORMANCE = [
  { location: "Bhubaneswar", accuracy: 96.1, f1Score: 94.8, sampleSize: 1240 },
  { location: "Cuttack", accuracy: 94.5, f1Score: 93.2, sampleSize: 982 },
  { location: "Khordha", accuracy: 95.2, f1Score: 94.1, sampleSize: 847 },
  { location: "Puri", accuracy: 92.8, f1Score: 91.5, sampleSize: 731 },
  { location: "Ganjam", accuracy: 93.4, f1Score: 92.0, sampleSize: 654 },
  { location: "Balasore", accuracy: 91.9, f1Score: 90.4, sampleSize: 588 },
];

function ModelPage() {
  const { visibleProjects, predictions, modelVersion, ready } = useLV();

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
        title="AI Model Performance & Evaluation Dashboard"
        description="Machine learning model evaluation metrics across accuracy, confusion matrix, feature importance attribution, and location-wise performance."
      >
        <DemoTag />
      </PageHeader>

      {/* DEMO MODEL METRICS NOTICE */}
      <Panel className="border-primary/40 bg-primary/5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-background text-primary">
            <Info className="size-4.5" aria-hidden />
          </span>
          <div className="text-xs text-foreground space-y-1">
            <p className="font-bold">DEMO MODEL PERFORMANCE BENCHMARKS</p>
            <p className="text-muted-foreground">
              These metrics demonstrate evaluation runs on 5,842 multi-location acquisition records across 6 core districts.
              Production metrics update continuously as retraining pipelines execute.
            </p>
          </div>
        </div>
      </Panel>

      {/* SECTION 1: MODEL OVERVIEW */}
      <Panel className="border-border">
        <PanelTitle
          title="Model Overview"
          subtitle="Model specifications, dataset parameters, and deployment metadata"
          icon={Cpu}
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg border border-border bg-card p-3 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Model Name</span>
            <p className="font-display text-sm font-bold text-foreground truncate">LandVision XGBoost</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Version</span>
            <p className="font-display text-sm font-bold text-primary">{modelVersion}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Dataset Size</span>
            <p className="font-display text-sm font-bold text-foreground">5,842 Records</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Training Date</span>
            <p className="font-display text-sm font-bold text-foreground">02 Sep 2026</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Locations Scored</span>
            <p className="font-display text-sm font-bold text-foreground">6 Locations</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 space-y-1">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Features Count</span>
            <p className="font-display text-sm font-bold text-foreground">14 Features</p>
          </div>
        </div>
      </Panel>

      {/* SECTION 2: PERFORMANCE METRICS KPIS */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
        <StatCard label="Accuracy" value={94.2} suffix="%" icon={CheckCircle2} tone="ai" hint="Overall Correct" />
        <StatCard label="Precision" value={92.8} suffix="%" icon={CheckCircle2} tone="ai" hint="Low False Positive" />
        <StatCard label="Recall" value={91.5} suffix="%" icon={CheckCircle2} tone="ai" hint="Low False Negative" />
        <StatCard label="F1 Score" value={92.1} suffix="%" icon={CheckCircle2} tone="ai" hint="Harmonic Mean" />
        <StatCard label="ROC-AUC" value={0.962} icon={LineChart} tone="ai" hint="Discrimination" />
        <StatCard label="MAE (Regression)" value="4.2d" icon={Sigma} hint="Mean Abs Error" />
        <StatCard label="R² Score" value={0.89} icon={Activity} tone="low" hint="Variance Explained" />
      </div>

      {/* SECTION 3: CONFUSION MATRIX & ALGORITHM COMPARISON */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.3fr]">
        {/* CONFUSION MATRIX */}
        <Panel>
          <PanelTitle
            title="Confusion Matrix (Classification)"
            subtitle="Actual vs Predicted delay risk classifications"
            icon={Braces}
          />
          <div className="mt-4 p-4 rounded-xl border border-border bg-card space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 font-semibold text-muted-foreground">Actual \ Predicted</div>
              <div className="p-2 font-bold text-risk-low bg-surface rounded-md">Predicted Low/Med Risk</div>
              <div className="p-2 font-bold text-risk-critical bg-surface rounded-md">Predicted High/Critical</div>

              <div className="p-2 font-bold text-risk-low bg-surface flex items-center justify-center rounded-md">
                Actual Low/Med Risk
              </div>
              <div className="p-4 rounded-lg bg-risk-low/20 border border-risk-low/40 text-center">
                <span className="block font-display text-lg font-bold text-risk-low">3,890</span>
                <span className="text-[10px] text-muted-foreground font-semibold">True Negative (94.8%)</span>
              </div>
              <div className="p-4 rounded-lg bg-risk-medium/10 border border-border text-center">
                <span className="block font-display text-lg font-bold text-foreground">212</span>
                <span className="text-[10px] text-muted-foreground font-semibold">False Positive (5.2%)</span>
              </div>

              <div className="p-2 font-bold text-risk-critical bg-surface flex items-center justify-center rounded-md">
                Actual High/Critical
              </div>
              <div className="p-4 rounded-lg bg-risk-medium/10 border border-border text-center">
                <span className="block font-display text-lg font-bold text-foreground">148</span>
                <span className="text-[10px] text-muted-foreground font-semibold">False Negative (8.5%)</span>
              </div>
              <div className="p-4 rounded-lg bg-risk-critical/20 border border-risk-critical/40 text-center">
                <span className="block font-display text-lg font-bold text-risk-critical">1,592</span>
                <span className="text-[10px] text-muted-foreground font-semibold">True Positive (91.5%)</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground text-center italic">
              * Matrix calculated on 20% holdout test dataset (1,168 validation cases).
            </p>
          </div>
        </Panel>

        {/* ALGORITHM COMPARISON LEAGUE */}
        <Panel>
          <PanelTitle
            title="Algorithm Comparison League"
            subtitle="XGBoost vs Random Forest vs Logistic Regression"
            icon={LineChart}
            ai
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase text-muted-foreground">
                  <th className="py-2.5 font-semibold">Model</th>
                  <th className="py-2.5 font-semibold">Accuracy</th>
                  <th className="py-2.5 font-semibold">F1 Score</th>
                  <th className="py-2.5 font-semibold">ROC-AUC</th>
                  <th className="py-2.5 font-semibold">MAE</th>
                  <th className="py-2.5 font-semibold">R²</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MODEL_COMPARISONS.map((m) => (
                  <tr key={m.model} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 font-bold text-foreground">{m.model}</td>
                    <td className="py-3 tabular-nums font-bold text-risk-low">{m.accuracy}%</td>
                    <td className="py-3 tabular-nums text-foreground">{m.f1Score}%</td>
                    <td className="py-3 tabular-nums font-bold text-primary">{m.rocAuc}</td>
                    <td className="py-3 tabular-nums text-muted-foreground">{m.mae}</td>
                    <td className="py-3 tabular-nums font-bold text-foreground">{m.r2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      {/* SECTION 4: FEATURE IMPORTANCE & PERFORMANCE BY LOCATION */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* FEATURE IMPORTANCE */}
        <Panel>
          <PanelTitle
            title="Feature Importance Attribution"
            subtitle="Normalized relative weights assigned by prediction model"
            icon={Layers}
            ai
          />
          <div className="h-80 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FEATURES} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid stroke="var(--border)" horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 30]} {...AXIS} unit="%" />
                <YAxis type="category" dataKey="label" width={150} {...AXIS} />
                <Tooltip contentStyle={TOOLTIP} formatter={(v: number) => [`${v}%`, "Weight"]} />
                <Bar dataKey="weight" fill="var(--primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* PERFORMANCE BY LOCATION */}
        <Panel>
          <PanelTitle
            title="Performance by Location (6 Locations)"
            subtitle="Accuracy and F1 Score breakdown across monitored districts"
            icon={MapPin}
          />
          <div className="h-80 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={LOCATION_PERFORMANCE} margin={{ left: 10, right: 10 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="location" {...AXIS} />
                <YAxis domain={[80, 100]} {...AXIS} unit="%" />
                <Tooltip contentStyle={TOOLTIP} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="accuracy" name="Accuracy (%)" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="f1Score" name="F1 Score (%)" fill="var(--risk-low)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
    </div>
  );
}

