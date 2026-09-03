import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BellRing,
  Brain,
  Building2,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  Gauge,
  GitBranch,
  Globe2,
  HandCoins,
  HeartHandshake,
  Layers,
  LineChart,
  Lock,
  Map,
  Network,
  Repeat,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  Workflow,
  Zap,
} from "lucide-react";
import { HeroMap } from "@/components/lv/HeroMap";
import { DemoTag, Panel } from "@/components/lv/panels";
import { useCountUp } from "@/components/lv/risk";
import { STAGES } from "@/lib/lv/types";
import { LanguageSelector, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LandVision AI — Predictive Analytics System for Early Detection of Land Acquisition Delays" },
      {
        name: "description",
        content:
          "AI-powered decision-support platform for early land acquisition delay prediction, SHAP explainability, cadastral GIS mapping, and closed-loop administrative interventions.",
      },
      {
        property: "og:title",
        content: "LandVision AI — Smart India Hackathon (SIH) Predictive Decision Support",
      },
      {
        property: "og:description",
        content:
          "Predict delays. Uncover bottlenecks. Prioritize interventions. Accelerate national infrastructure delivery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const NAV = [
  { label: "Pipeline", href: "#pipeline" },
  { label: "Lifecycle", href: "#lifecycle" },
  { label: "Features", href: "#features" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "GIS", href: "#gis" },
  { label: "SIH Methodology", to: "/public/methodology" },
  { label: "Impact", to: "/public/impact" },
  { label: "Public Portal", to: "/public" },
];

const METRICS = [
  { label: "Monitored Corridors", value: 1248 },
  { label: "High Risk Corridors", value: 184 },
  { label: "Peak Delay Risk Index", value: 82, suffix: "%" },
  { label: "Active Interventions", value: 23 },
];

const STEPS = [
  { n: "01", title: "Data Telemetry", icon: Database, text: "Ingests cadastral, compensation, legal, approval & R&R records." },
  { n: "02", title: "AI/ML Prediction", icon: Gauge, text: "XGBoost & Random Forest ensemble computes delay risk & slippage days." },
  { n: "03", title: "Explainable AI", icon: Brain, text: "SHAP attribution pinpoints top 5 bottleneck drivers & percentage shares." },
  { n: "04", title: "GIS Mapping", icon: Map, text: "Cadastral parcels, corridor buffers, and dispute heatmaps rendered on GIS." },
  { n: "05", title: "Early Alert", icon: BellRing, text: "Automated threshold breaches alert responsible revenue & project officers." },
  { n: "06", title: "Officer Action", icon: UserCheck, text: "Field intervention assigned with deadline & departmental routing." },
  { n: "07", title: "Risk Recalculation", icon: TrendingUp, text: "Closed-loop engine recalculates risk score after field resolution." },
  { n: "08", title: "Continuous Learning", icon: Repeat, text: "MLOps pipeline retrains on ground-truth outcomes to boost accuracy." },
];

const STAGE_DETAIL: Record<string, { desc: string; bottleneck: string; indicator: string }> = {
  Notification: {
    desc: "Section 11 preliminary notification issued and gazette published for proposed alignment.",
    bottleneck: "Delayed gazette publication and incomplete revenue village schedules.",
    indicator: "Approvals pending at State Revenue Cell beyond 30-day SLA.",
  },
  Survey: {
    desc: "Joint measurement survey (JMS) and drone-based boundary validation of project parcels.",
    bottleneck: "Landowner objections, unmapped boundary disputes, and disputed mutation entries.",
    indicator: "JMS variance exceeding 12% across revenue subdivisions.",
  },
  Valuation: {
    desc: "District Collectorate determines market rate base, multiplier factor & 100% solatium.",
    bottleneck: "Disputed circle rates, pending registration data updates, and tree/structure valuation appeals.",
    indicator: "Circle rate appeals pending before Revenue Divisional Commissioner (RDC).",
  },
  Compensation: {
    desc: "Direct Benefit Transfer (DBT) disbursal into verified bank accounts of project-affected persons.",
    bottleneck: "Unlinked Aadhaar/PAN, title partition disputes among legal heirs, and joint holding ambiguity.",
    indicator: "Disbursal velocity below 40% after 90 days of statutory award declaration.",
  },
  "Legal Resolution": {
    desc: "Land Acquisition, Rehabilitation and Resettlement Authority (LARRA) & High Court case adjudication.",
    bottleneck: "Interim stay orders, conflicting title claims, and compensation enhancement suits.",
    indicator: "Active stay orders with hearing dates scheduled beyond 60-day window.",
  },
  "R&R": {
    desc: "Resettlement and rehabilitation package: alternative housing, land-for-land, and annuity grants.",
    bottleneck: "Delay in developing R&R colony infrastructure and community objection to relocation sites.",
    indicator: "R&R site handover lagging behind infrastructure corridor civil work schedule.",
  },
  Possession: {
    desc: "Section 38 physical possession of unencumbered land handed over to project implementing agency.",
    bottleneck: "Crop standing issues, delayed tree felling clearances, and pending structural demolitions.",
    indicator: "Encumbrance certificates pending clearance by Special Land Acquisition Officer (SLAO).",
  },
  Completion: {
    desc: "Final revenue record mutation in RoR (Record of Rights) in favour of Central/State authority.",
    bottleneck: "Tehsil-level record reconciliation delays and digital cadastral map updates.",
    indicator: "Digitized RoR issuance pending post physical handover.",
  },
};

const FEATURES = [
  { icon: LineChart, title: "Predictive Delay Risk Analytics", text: "Multi-parameter ML forecasts delay probability and expected slippage months.", link: "/app/predictor" },
  { icon: Scale, title: "Explainable AI (XAI)", text: "SHAP-style attribution waterfall & plain language governance summaries.", link: "/app/explainable-ai" },
  { icon: Map, title: "Geospatial GIS Intelligence", text: "Parcel-level cadastral outlines, buffer layers, and interactive hotspot heatmaps.", link: "/app/gis" },
  { icon: Workflow, title: "8-Stage Lifecycle Timeline", text: "Track milestones from Sec 11 to Possession with stage bottleneck detection.", link: "/app/timeline" },
  { icon: Building2, title: "District & State Hotspots", text: "Hierarchical analytics across 12 Indian states and high-risk districts.", link: "/app/district-analytics" },
  { icon: ShieldAlert, title: "Legal Litigation Docket", text: "Track Section 64 petitions, stay orders, and court resolution timelines.", link: "/app/legal" },
  { icon: HandCoins, title: "Compensation Disbursal (DBT)", text: "Monitor award payouts, payment velocity, and stalled bank accounts.", link: "/app/compensation" },
  { icon: UserCheck, title: "Intervention Recalculation", text: "Assign corrective actions to officers and track live before/after risk drops.", link: "/app/interventions" },
  { icon: Repeat, title: "Continuous Learning MLOps", text: "Simulate automated retraining cycles with semantic model versioning.", link: "/app/continuous-learning" },
];

function Landing() {
  const { tStr } = useTranslation();
  const [stage, setStage] = useState<string>("Legal Resolution");
  const detail = STAGE_DETAIL[stage]!;

  return (
    <div className="min-h-screen bg-background">
      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Globe2 className="size-5 text-primary" aria-hidden />
            <span className="font-display text-sm font-bold tracking-widest text-foreground">
              LANDVISION AI
            </span>
            <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary sm:inline">
              SIH Edition
            </span>
          </Link>
          <nav className="hidden items-center gap-5 lg:flex">
            {NAV.map((n) =>
              n.to ? (
                <Link
                  key={n.label}
                  to={n.to}
                  className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  {tStr(n.label)}
                </Link>
              ) : (
                <a
                  key={n.label}
                  href={n.href}
                  className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  {tStr(n.label)}
                </a>
              ),
            )}
          </nav>
          <div className="flex items-center gap-2.5">
            <LanguageSelector />
            <Link
              to="/login"
              className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-card"
            >
              {tStr("Officer Login")}
            </Link>
            <Link
              to="/app/dashboard"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:shadow-[var(--shadow-glow)]"
            >
              {tStr("Overview Dashboard")} →
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="size-3.5" aria-hidden />
              AI Decision-Support System for Infrastructure Delivery
            </span>
            <h1 className="mt-5 font-display text-4xl leading-tight font-bold text-foreground sm:text-5xl">
              {tStr("Predicting Land Acquisition Delays")}{" "}
              <span className="ai-gradient-text">{tStr("Before They Happen.")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm text-muted-foreground leading-relaxed">
              LandVision AI combines multi-parameter predictive analytics, transparent SHAP explainability, and cadastral GIS
              intelligence to uncover bottlenecks and empower government authorities to intervene before delays derail critical infrastructure projects.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/app/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-lg transition-shadow hover:shadow-[var(--shadow-glow)]"
              >
                {tStr("Launch National Command Center")} <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                to="/app/predictor"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-xs font-bold text-foreground transition-colors hover:bg-accent"
              >
                <Zap className="size-4 text-primary" /> {tStr("Test AI Predictor Sandbox")}
              </Link>
              <Link
                to="/public/methodology"
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                SIH Methodology Specs →
              </Link>
            </div>
            <p className="mt-6 text-[11px] tracking-wide text-muted-foreground uppercase">
              DATA → AI/ML → DELAY PREDICTION → RISK SCORE → EXPLAINABLE AI → ROOT CAUSE → GIS → ALERT → INTERVENTION → CONTINUOUS LEARNING
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <HeroMap />
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="relative mx-auto max-w-7xl px-4 pb-12 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {METRICS.map((m) => (
              <Metric key={m.label} label={tStr(m.label)} value={m.value} suffix={m.suffix} />
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <DemoTag />
            <span className="text-[11px] text-muted-foreground">
              Simulated multi-state dataset of 1,248 active corridors.
            </span>
          </div>
        </div>
      </section>

      {/* PIPELINE ARCHITECTURE (DATA -> AI -> XAI -> INTERVENTION) */}
      <section id="pipeline" className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead
            eyebrow="Closed-Loop Intelligence"
            title="The 8-Stage End-to-End Governance Pipeline"
            text="How LandVision AI transforms fragmented administrative telemetry into measurable delay reductions."
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <Panel key={s.n} className="group relative overflow-hidden">
                <span className="font-display text-xs font-bold tracking-widest text-primary">{s.n}</span>
                <s.icon className="mt-3 size-5 text-primary" aria-hidden />
                <h3 className="mt-3 font-display text-sm font-bold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{s.text}</p>
                <span className="absolute inset-x-0 bottom-0 h-px bg-primary/0 transition-colors group-hover:bg-primary/60" />
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* 8-STAGE LIFECYCLE INTERACTIVE EXPLORER */}
      <section id="lifecycle" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead
            eyebrow="Land Acquisition Lifecycle"
            title="Eight Critical Milestones, Each With Unique Failure Modes"
            text="Select a stage to explore typical bottlenecks and the indicators monitored by the AI prediction model."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="panel p-4">
              <ol className="space-y-1.5">
                {STAGES.map((s, i) => {
                  const activeStage = s === stage;
                  return (
                    <li key={s}>
                      <button
                        onClick={() => setStage(s)}
                        aria-pressed={activeStage}
                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                          activeStage
                            ? "border-primary bg-primary/10 text-foreground font-bold shadow-2xs"
                            : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                        }`}
                      >
                        <span
                          className={`grid size-6 shrink-0 place-items-center rounded-md border text-[11px] font-bold ${
                            activeStage ? "border-primary bg-primary text-primary-foreground" : "border-border"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span>{s}</span>
                        {activeStage ? <ArrowRight className="ml-auto size-4 text-primary" aria-hidden /> : null}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
            <Panel className="border-primary/40 bg-card">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                Milestone Deep-Dive
              </span>
              <h3 className="mt-2 font-display text-lg font-bold text-foreground">{stage}</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{detail.desc}</p>
              <div className="mt-5 space-y-3.5 text-xs">
                <div className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-[10px] font-bold tracking-widest text-risk-critical uppercase">Typical Bottleneck</p>
                  <p className="mt-1 text-foreground font-medium">{detail.bottleneck}</p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <p className="text-[10px] font-bold tracking-widest text-primary uppercase">AI Risk Indicator</p>
                  <p className="mt-1 text-foreground font-medium">{detail.indicator}</p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </section>

      {/* COMPREHENSIVE PLATFORM CAPABILITIES */}
      <section id="features" className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead
            eyebrow="Platform Modules"
            title="Complete 32-Requirement Decision-Support Suite"
            text="Engineered for Smart India Hackathon: prediction sandboxes, explainability, GIS layers, and closed-loop governance."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Link
                key={f.title}
                to={f.link}
                className="panel p-5 transition-transform hover:-translate-y-1 hover:border-primary/50 group block"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <f.icon className="size-4.5" aria-hidden />
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="mt-4 font-display text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                  {f.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{f.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="about" className="bg-background border-t border-border">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe2 className="size-5 text-primary" aria-hidden />
              <span className="font-display text-sm font-bold tracking-widest text-foreground">
                LANDVISION AI
              </span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              Predictive analytics system for early detection of land acquisition delays. Developed for Smart India Hackathon (SIH).
            </p>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Demonstration build. All figures are synthetic simulation data.
            </p>
          </div>
          <FooterCol
            title="Governance Modules"
            links={[
              { label: "Command Center Dashboard", to: "/app/dashboard" },
              { label: "AI Delay Risk Predictor", to: "/app/predictor" },
              { label: "Explainable AI (XAI)", to: "/app/explainable-ai" },
              { label: "GIS Cadastral Map", to: "/app/gis" },
              { label: "8-Stage Timeline Bottlenecks", to: "/app/timeline" },
              { label: "District Analytics", to: "/app/district-analytics" },
              { label: "National State Analytics", to: "/app/state-analytics" },
            ]}
          />
          <FooterCol
            title="Domain & Governance"
            links={[
              { label: "Legal Disputes Docket", to: "/app/legal" },
              { label: "Compensation Tracking (DBT)", to: "/app/compensation" },
              { label: "Documentation Compliance", to: "/app/documentation" },
              { label: "Administrative Bottlenecks", to: "/app/bottlenecks" },
              { label: "R&R Resettlement Tracking", to: "/app/rr" },
              { label: "Land Possession & Encroachments", to: "/app/possession" },
              { label: "Stakeholder Responsiveness Index", to: "/app/stakeholders" },
              { label: "Intervention Management", to: "/app/interventions" },
            ]}
          />
          <FooterCol
            title="SIH Specifications & Public"
            links={[
              { label: "SIH Technical Methodology", to: "/public/methodology" },
              { label: "Governance Impact Assessment", to: "/public/impact" },
              { label: "Continuous Learning MLOps", to: "/app/continuous-learning" },
              { label: "API Gateway Architecture", to: "/app/api-center" },
              { label: "Public Citizen Portal", to: "/public" },
              { label: "Government Officer Login", to: "/login" },
            ]}
          />
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          LandVision AI — Smart India Hackathon (SIH) Predictive Decision-Support Platform.
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <p className="font-display text-xs font-bold text-foreground uppercase tracking-wider">{title}</p>
      <ul className="mt-3 space-y-1.5 text-xs">
        {links.map((l) => (
          <li key={l.to}>
            <Link to={l.to} className="text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionHead({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-bold tracking-widest text-primary uppercase">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">{title}</h2>
      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function Metric({ label, value, suffix }: { label: string; value: number; suffix?: string | undefined }) {
  const n = useCountUp(value, 1200);
  return (
    <div className="panel p-4">
      <p className="font-display text-2xl font-bold text-foreground tabular-nums">
        {n.toLocaleString("en-IN")}
        {suffix ?? ""}
      </p>
      <p className="mt-1 text-[11px] tracking-wide text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
