import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock,
  Coins,
  Globe2,
  HeartHandshake,
  LandPlot,
  Layers,
  LineChart,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { DemoTag, PageHeader, Panel, PanelTitle } from "@/components/lv/panels";

export const Route = createFileRoute("/public/impact")({
  component: ImpactPage,
  head: () => ({
    meta: [
      { title: "Governance & Economic Impact Assessment — LandVision AI" },
      {
        name: "description",
        content:
          "Analyzing the real-world governance, social, and economic impact of AI-powered early land acquisition delay detection.",
      },
    ],
  }),
});

const IMPACT_AREAS = [
  {
    title: "1. Infrastructure Delivery Acceleration",
    icon: Clock,
    summary: "Proactive bottleneck resolution prevents catastrophic project schedule slippages.",
    points: [
      "Early warning flags disputes 90–120 days before traditional administrative escalation.",
      "Accelerates handover of encumbrance-free land to highway, rail, and energy developers.",
      "Reduces capital lock-in and avoids multi-year construction idling penalties.",
    ],
  },
  {
    title: "2. Public Expenditure Optimization",
    icon: Coins,
    summary: "Optimizes financial outlays and prevents escalation in land compensation interest.",
    points: [
      "Mitigates compound interest penalties under RFCTLARR Section 72 on delayed awards.",
      "Enhances transparent Direct Benefit Transfer (DBT) verification velocity.",
      "Optimizes state budget allocation by targeting high-risk corridor bottlenecks first.",
    ],
  },
  {
    title: "3. Transparent & Fair Citizen Rehabilitation",
    icon: HeartHandshake,
    summary: "Empowers displaced families with timely compensation and verified civic infrastructure.",
    points: [
      "Real-time tracking ensures R&R resettlement colonies are built before physical displacement.",
      "Reduces citizen grievances and court backlogs through proactive Lok Adalat mediation.",
      "Maintains public transparency with open notices and aggregate progress statistics.",
    ],
  },
  {
    title: "4. Data-Driven Proactive Governance",
    icon: Sparkles,
    summary: "Replaces siloed manual file movement with unified inter-departmental intelligence.",
    points: [
      "Breaks down silos between Revenue, Forest, Survey, Judiciary, and Implementing Agencies.",
      "Provides state Chief Secretaries and District Collectors with single-pane situational awareness.",
      "Creates an immutable audit trail of administrative decisions and accountability.",
    ],
  },
];

function ImpactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 space-y-10">
      {/* HEADER */}
      <div className="max-w-3xl space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-primary">
          <TrendingUp className="size-3.5" /> Economic &amp; Governance Impact
        </span>
        <h1 className="font-display text-4xl font-bold text-foreground">
          Transforming National Land Acquisition Governance
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          How LandVision AI creates measurable governance improvements, protects public exchequer funds, and ensures
          humane, transparent resettlement for affected families.
        </p>
      </div>

      {/* 4 CORE IMPACT CARDS */}
      <div className="grid gap-6 md:grid-cols-2">
        {IMPACT_AREAS.map((area) => (
          <Panel key={area.title} className="p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <area.icon className="size-5" />
              </span>
              <h3 className="font-display text-base font-bold text-foreground">{area.title}</h3>
            </div>
            <p className="mt-2 text-xs font-semibold text-primary">{area.summary}</p>
            <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
              {area.points.map((pt, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{pt}</span>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>

      {/* CALL TO ACTION */}
      <Panel className="border-primary/40 bg-card text-center p-8">
        <h3 className="font-display text-xl font-bold text-foreground">
          Ready to Experience Predictive Land Acquisition Intelligence?
        </h3>
        <p className="mt-2 text-xs text-muted-foreground max-w-lg mx-auto">
          Explore the National Command Center Dashboard or simulate project risk parameters in the interactive predictor.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/app/dashboard"
            className="rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:shadow-[var(--shadow-glow)]"
          >
            Open Dashboard
          </Link>
          <Link
            to="/public/methodology"
            className="rounded-lg border border-border bg-surface px-5 py-2.5 text-xs font-bold text-foreground hover:bg-card"
          >
            Read SIH Technical Specs
          </Link>
        </div>
      </Panel>
    </div>
  );
}
