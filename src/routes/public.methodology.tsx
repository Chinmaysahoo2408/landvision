import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Brain,
  Building2,
  CheckCircle2,
  Cpu,
  Database,
  GitBranch,
  Globe2,
  Layers,
  LineChart,
  Lock,
  Network,
  Repeat,
  Scale,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { DemoTag, PageHeader, Panel, PanelTitle } from "@/components/lv/panels";

export const Route = createFileRoute("/public/methodology")({
  component: MethodologyPage,
  head: () => ({
    meta: [
      { title: "Smart India Hackathon (SIH) Solution & Methodology — LandVision AI" },
      {
        name: "description",
        content:
          "Comprehensive technical methodology, AI/ML architecture, GIS pipeline, explainable AI formulas, and governance workflow designed for SIH judges.",
      },
    ],
  }),
});

function MethodologyPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 space-y-12">
      {/* HERO / PROBLEM STATEMENT */}
      <div className="max-w-3xl space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" /> Smart India Hackathon (SIH) Technical Architecture
        </span>
        <h1 className="font-display text-4xl font-bold text-foreground">
          Predictive Analytics System for Early Detection of Land Acquisition Delays
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Land acquisition is the single most critical and time-sensitive bottleneck in national infrastructure delivery.
          LandVision AI upgrades infrastructure governance from reactive crisis management to proactive AI-powered early
          detection and closed-loop decision support.
        </p>
      </div>

      {/* CORE END-TO-END WORKFLOW */}
      <Panel className="border-primary/40 bg-gradient-to-r from-primary/10 via-card to-primary/5">
        <PanelTitle
          title="The Closed-Loop Intelligence Pipeline"
          subtitle="How LandVision AI transforms multi-source data into real-world delay reduction"
          icon={Brain}
          ai
        />

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs">
          {[
            { step: "1. Data Telemetry", desc: "Land, Court, PFMS, Survey" },
            { step: "2. AI Prediction", desc: "Multi-parameter Delay ML" },
            { step: "3. Risk Score", desc: "0-100 Score & Categorization" },
            { step: "4. Explainable AI", desc: "SHAP Factor Attribution" },
            { step: "5. GIS Mapping", desc: "Cadastral Hotspot Overlays" },
            { step: "6. Smart Alert", desc: "Threshold Breach Signals" },
            { step: "7. Recommendation", desc: "Priority Corrective Action" },
            { step: "8. Intervention", desc: "Officer Action & Recalculation" },
            { step: "9. Continuous Learning", desc: "Automated Retraining" },
          ].map((item, idx, arr) => (
            <div key={item.step} className="flex items-center gap-2">
              <div className="rounded-xl border border-border bg-card p-3 shadow-xs text-center min-w-28">
                <span className="font-bold text-foreground block text-[11px]">{item.step}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5 block">{item.desc}</span>
              </div>
              {idx < arr.length - 1 ? <ArrowRight className="size-3 text-primary hidden sm:block" /> : null}
            </div>
          ))}
        </div>
      </Panel>

      {/* 4 CORE ARCHITECTURAL PILLARS */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* PILLAR 1: AI/ML ENGINE */}
        <Panel>
          <PanelTitle title="1. AI / ML Predictive Engine" icon={Cpu} ai />
          <ul className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Multi-Factor Delay Modeling:</strong> Consumes 17+ domain parameters
                including Section 64 legal disputes, compensation disbursal velocity, statutory approval backlogs,
                and stakeholder responsiveness indices.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Ensemble Model Architecture:</strong> Combines Random Forest decision
                trees, Gradient Boosted Classifiers (XGBoost), and logistic calibration for high-precision delay classification.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Continuous Learning &amp; MLOps:</strong> Automated feedback loops
                re-calibrate model hyperparameters whenever new ground-truth outcomes are recorded.
              </span>
            </li>
          </ul>
        </Panel>

        {/* PILLAR 2: EXPLAINABLE AI */}
        <Panel>
          <PanelTitle title="2. Explainable AI (XAI) & Factor Attribution" icon={Scale} ai />
          <ul className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">SHAP Attribution Ratios:</strong> Normalizes individual parameter
                weights into percentage contributions (e.g., Legal disputes 24%, Compensation 21%, Approvals 15%).
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Plain-Language Governance Insights:</strong> Converts complex mathematical
                inference into actionable, transparent sentences for district magistrates and revenue officers.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Counterfactual Simulations:</strong> Evaluates "what-if" scenarios
                showing officers the precise risk drop achieved by clearing specific backlogs.
              </span>
            </li>
          </ul>
        </Panel>

        {/* PILLAR 3: GEOSPATIAL INTELLIGENCE */}
        <Panel>
          <PanelTitle title="3. Geospatial Intelligence & GIS Layers" icon={Globe2} />
          <ul className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Cadastral Parcel Demarcation:</strong> Maps village parcel boundaries,
                forest reservations, and government land parcels along project alignments.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Risk Heatmaps:</strong> Visualizes geospatial clusters of land title
                disputes and stalled compensation disbursements across districts and states.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Multi-Scale Navigation:</strong> Seamless zoom from national overview
                to state corridors, district revenue blocks, and individual survey numbers.
              </span>
            </li>
          </ul>
        </Panel>

        {/* PILLAR 4: SECURITY & GOVERNANCE */}
        <Panel>
          <PanelTitle title="4. Role-Based Access & Audit Logging" icon={ShieldCheck} />
          <ul className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Granular RBAC:</strong> Six distinct roles (Super Admin, State Administrator,
                District Officer, Decision Maker, Analyst, Public User) ensure strict data segregation.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Immutable Audit Trail:</strong> Every parameter change, intervention
                assignment, and model retraining event is cryptographically timestamped and logged.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong className="text-foreground">Public Data Protection:</strong> Citizen portal displays transparent
                aggregate statistics and public notices without exposing sensitive landholder records.
              </span>
            </li>
          </ul>
        </Panel>
      </div>

      {/* CTA SECTION */}
      <Panel className="text-center p-8 border-primary/40 bg-card">
        <h3 className="font-display text-2xl font-bold text-foreground">Explore the Live Command Center</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
          Experience the full predictive decision-support system in action with interactive project simulators and GIS intelligence.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/app/dashboard"
            className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:shadow-[var(--shadow-glow)]"
          >
            Launch Command Center
          </Link>
          <Link
            to="/app/predictor"
            className="rounded-lg border border-border bg-surface px-5 py-2.5 text-xs font-bold text-foreground hover:bg-card"
          >
            Test AI Predictor Sandbox
          </Link>
        </div>
      </Panel>
    </div>
  );
}
