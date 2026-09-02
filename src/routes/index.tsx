import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  BellRing,
  Brain,
  Database,
  Gauge,
  GitBranch,
  Globe2,
  Layers,
  LineChart,
  Lock,
  Map,
  Repeat,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { HeroMap } from "@/components/lv/HeroMap";
import { DemoTag, Panel } from "@/components/lv/panels";
import { useCountUp } from "@/components/lv/risk";
import { STAGES } from "@/lib/lv/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LandVision AI — Predict Land Acquisition Delays Before They Happen" },
      {
        name: "description",
        content:
          "LandVision AI predicts land acquisition delays, explains risk drivers, maps parcels on GIS and recommends interventions for government authorities.",
      },
      {
        property: "og:title",
        content: "LandVision AI — Predictive Land Acquisition Intelligence",
      },
      {
        property: "og:description",
        content:
          "Predict delays. Identify bottlenecks. Prioritize intervention. Accelerate infrastructure.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const NAV = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Intelligence", href: "#intelligence" },
  { label: "GIS", href: "#gis" },
  { label: "About", href: "#about" },
];

const METRICS = [
  { label: "Projects monitored", value: 1248 },
  { label: "High-risk projects", value: 184 },
  { label: "Maximum predicted risk", value: 82, suffix: "%" },
  { label: "Active interventions", value: 23 },
];

const STEPS = [
  { n: "01", title: "Collect", icon: Database, text: "Project, land, compensation, approval, legal and R&R data." },
  { n: "02", title: "Analyze", icon: Search, text: "AI analyses historical and current acquisition patterns." },
  { n: "03", title: "Predict", icon: Gauge, text: "ML estimates the probability of future delay." },
  { n: "04", title: "Explain", icon: Brain, text: "Explainable AI identifies the major risk contributors." },
  { n: "05", title: "Recommend", icon: Sparkles, text: "The system suggests prioritised corrective actions." },
  { n: "06", title: "Monitor", icon: Activity, text: "Officials track interventions and project progress." },
  { n: "07", title: "Learn", icon: Repeat, text: "New outcomes can improve future model versions." },
];

const STAGE_DETAIL: Record<string, { desc: string; bottleneck: string; indicator: string }> = {
  Notification: {
    desc: "Section 11 notification issued and published for the proposed acquisition.",
    bottleneck: "Delayed gazette publication and incomplete village schedules.",
    indicator: "Approvals pending at the revenue department.",
  },
  Survey: {
    desc: "Field survey, demarcation and measurement of affected parcels.",
    bottleneck: "Survey team shortages and inaccessible parcels.",
    indicator: "Documentation completeness below 70%.",
  },
  Valuation: {
    desc: "Market value determination and preparation of the award statement.",
    bottleneck: "Disputed market rates and outdated circle rates.",
    indicator: "Objections filed against valuation.",
  },
  Compensation: {
    desc: "Award declaration and disbursement of compensation to landowners.",
    bottleneck: "Bank verification failures and unresolved title records.",
    indicator: "Disbursement stalled beyond 30 days.",
  },
  "Legal Resolution": {
    desc: "Resolution of objections, appeals and title litigation.",
    bottleneck: "Court backlogs and multiple claimants on a single parcel.",
    indicator: "Open dispute count rising month over month.",
  },
  "Rehabilitation & Resettlement": {
    desc: "Entitlement delivery, resettlement sites and livelihood restoration.",
    bottleneck: "Site readiness and family entitlement verification.",
    indicator: "R&R completion lagging compensation progress.",
  },
  Possession: {
    desc: "Physical possession handed over to the implementing agency.",
    bottleneck: "Encroachment removal and structure valuation disputes.",
    indicator: "Possession percentage far below compensation percentage.",
  },
  Completion: {
    desc: "Acquisition closure, records updated and land transferred.",
    bottleneck: "Pending mutation entries and audit closure.",
    indicator: "Residual parcels outstanding.",
  },
};

const FEATURES = [
  { icon: LineChart, title: "Predictive Delay Analytics", text: "Identify projects likely to experience delays before schedules slip." },
  { icon: Gauge, title: "Dynamic Risk Scoring", text: "Generate project-level risk scores that update as data changes." },
  { icon: Brain, title: "Explainable AI", text: "Understand why each prediction occurred, factor by factor.", ai: true },
  { icon: Layers, title: "Stage-wise Risk", text: "Pinpoint which acquisition stage is driving the delay risk." },
  { icon: Map, title: "GIS Intelligence", text: "See risk geographically at parcel, district and state level." },
  { icon: BellRing, title: "Smart Alerts", text: "Notify responsible officials when conditions deteriorate." },
  { icon: Sparkles, title: "AI Recommendations", text: "Receive prioritised corrective interventions.", ai: true },
  { icon: Repeat, title: "Continuous Learning", text: "Retrain on new outcomes to improve future accuracy." },
  { icon: ShieldCheck, title: "Secure Governance", text: "Role-based access control and complete audit trails." },
];

function Landing() {
  const [stage, setStage] = useState<string>("Legal Resolution");
  const detail = STAGE_DETAIL[stage]!;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <Globe2 className="size-5 text-primary" aria-hidden />
            <span className="font-display text-sm font-bold tracking-widest text-foreground">
              LANDVISION AI
            </span>
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {n.label}
              </a>
            ))}
            <Link to="/public" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Public Projects
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card"
            >
              Login
            </Link>
            <Link
              to="/app/dashboard"
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[var(--shadow-glow)]"
            >
              Explore Platform
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-ai" aria-hidden />
              Predictive governance for land acquisition
            </span>
            <h1 className="mt-5 font-display text-4xl leading-tight font-bold text-foreground sm:text-5xl">
              Predicting Land Acquisition Delays{" "}
              <span className="ai-gradient-text">Before They Happen.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground">
              LandVision AI uses predictive analytics, explainable AI and geospatial intelligence to
              identify high-risk land acquisition projects, uncover bottlenecks and help authorities
              intervene before delays impact infrastructure delivery.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/app/dashboard"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[var(--shadow-glow)]"
              >
                Explore Dashboard <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                See How It Works
              </a>
            </div>
            <p className="mt-5 text-xs tracking-wide text-muted-foreground uppercase">
              Predict delays · Identify bottlenecks · Prioritize intervention · Accelerate infrastructure
            </p>
          </div>
          <div className="flex justify-center lg:justify-end">
            <HeroMap />
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {METRICS.map((m) => (
              <Metric key={m.label} {...m} />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <DemoTag /> Values shown are demonstration figures generated from a synthetic dataset.
          </p>
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead
            eyebrow="The shift"
            title="From reactive monitoring to predictive governance"
            text="LandVision AI moves authorities from discovering problems after they occur to anticipating them and acting first."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Panel className="border-border/70">
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Before</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-foreground">Reactive monitoring</h3>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {["Problem happens", "Officer discovers it", "Action"].map((s, i) => (
                  <span key={s} className="flex items-center gap-2">
                    <span className="rounded-md border border-border bg-background px-3 py-1.5">{s}</span>
                    {i < 2 ? <ArrowRight className="size-3.5" aria-hidden /> : null}
                  </span>
                ))}
              </div>
            </Panel>
            <Panel className="border-primary/40">
              <p className="text-xs font-semibold tracking-widest text-primary uppercase">After</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-foreground">Predictive governance</h3>
              <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
                {["Data", "AI predicts risk", "Explain", "Recommend", "Intervene", "Monitor"].map((s, i, arr) => (
                  <span key={s} className="flex items-center gap-2">
                    <span className="rounded-md border border-primary/30 bg-background px-3 py-1.5 text-foreground">
                      {s}
                    </span>
                    {i < arr.length - 1 ? <ArrowRight className="size-3.5 text-primary" aria-hidden /> : null}
                  </span>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead
            eyebrow="How it works"
            title="Data → AI → Risk → Explanation → Action → Monitoring → Learning"
            text="A single closed intelligence loop across the acquisition lifecycle."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <Panel key={s.n} className="group relative overflow-hidden">
                <span className="font-display text-xs font-bold tracking-widest text-primary">{s.n}</span>
                <s.icon className="mt-3 size-5 text-primary" aria-hidden />
                <h3 className="mt-3 font-display text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
                <span className="absolute inset-x-0 bottom-0 h-px bg-primary/0 transition-colors group-hover:bg-primary/60" />
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* LIFECYCLE */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead
            eyebrow="Land acquisition lifecycle"
            title="Eight stages, each with its own failure modes"
            text="Select a stage to see typical bottlenecks and the indicators the model watches."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="panel p-5">
              <ol className="space-y-2">
                {STAGES.map((s, i) => {
                  const activeStage = s === stage;
                  return (
                    <li key={s}>
                      <button
                        onClick={() => setStage(s)}
                        aria-pressed={activeStage}
                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                          activeStage
                            ? "border-primary/50 bg-background text-foreground"
                            : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                        }`}
                      >
                        <span
                          className={`grid size-6 shrink-0 place-items-center rounded-md border text-[11px] font-semibold ${
                            activeStage ? "border-primary text-primary" : "border-border"
                          }`}
                        >
                          {i + 1}
                        </span>
                        {s}
                        {activeStage ? <ArrowRight className="ml-auto size-4 text-primary" aria-hidden /> : null}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
            <Panel>
              <h3 className="font-display text-lg font-semibold text-foreground">{stage}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{detail.desc}</p>
              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <p className="text-xs tracking-widest text-muted-foreground uppercase">Typical bottleneck</p>
                  <p className="mt-1 text-foreground">{detail.bottleneck}</p>
                </div>
                <div>
                  <p className="text-xs tracking-widest text-muted-foreground uppercase">Risk indicator</p>
                  <p className="mt-1 text-foreground">{detail.indicator}</p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHead
            eyebrow="Platform modules"
            title="An analytical command centre, not a dashboard"
            text="Nine capability modules covering prediction, explanation, geography and governance."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Panel key={f.title} className="transition-transform hover:-translate-y-0.5">
                <span
                  className={`grid size-10 place-items-center rounded-lg border border-border ${
                    f.ai ? "ai-gradient-bg text-ai-foreground" : "bg-background text-primary"
                  }`}
                >
                  <f.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
              </Panel>
            ))}
          </div>
        </div>
      </section>

      {/* INTELLIGENCE */}
      <section id="intelligence" className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionHead
              eyebrow="AI intelligence"
              title="Every prediction comes with its explanation"
              text="The model estimates probability — never certainty — and always shows the contributing factors."
            />
            <ul className="mt-8 space-y-3">
              {[
                { icon: Workflow, t: "Stage-wise delay probabilities across all eight stages" },
                { icon: Scale, t: "SHAP-style factor attribution for each risk score" },
                { icon: GitBranch, t: "Recommended interventions ranked by priority and impact" },
                { icon: Lock, t: "Role-based access and full audit trail on every change" },
              ].map((x) => (
                <li key={x.t} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <x.icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {x.t}
                </li>
              ))}
            </ul>
          </div>
          <Panel className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 ai-gradient-bg" aria-hidden />
            <p className="text-xs tracking-widest text-muted-foreground uppercase">Sample AI insight</p>
            <p className="mt-3 font-display text-lg text-foreground">
              The model estimates an <span className="text-risk-critical">82% probability of delay</span> for
              NH-16 Expansion over the next 90 days.
            </p>
            <div className="mt-5 space-y-3">
              {[
                { label: "Legal disputes", v: 24 },
                { label: "Compensation delay", v: 21 },
                { label: "Pending approvals", v: 15 },
                { label: "Documentation", v: 12 },
                { label: "R&R progress", v: 8 },
              ].map((f) => (
                <div key={f.label}>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{f.label}</span>
                    <span className="text-foreground tabular-nums">{f.v}%</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-background">
                    <div className="h-full rounded-full ai-gradient-bg" style={{ width: `${f.v * 3}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              <DemoTag /> Generated from the synthetic demonstration dataset.
            </p>
          </Panel>
        </div>
      </section>

      {/* GIS */}
      <section id="gis" className="border-b border-border">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <SectionHead
              eyebrow="GIS intelligence"
              title="Where is the land, and where is the risk?"
              text="Cadastral parcels, acquisition boundaries, infrastructure corridors and risk overlays on a single live geospatial canvas."
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                "Parcel-level cadastral outlines",
                "Project acquisition boundaries",
                "Infrastructure corridor overlays",
                "Risk heatmap and layer switching",
              ].map((t) => (
                <div key={t} className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-muted-foreground">
                  {t}
                </div>
              ))}
            </div>
            <Link
              to="/app/gis"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[var(--shadow-glow)]"
            >
              Open GIS Risk Map <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="order-1 flex justify-center lg:order-2">
            <HeroMap />
          </div>
        </div>
      </section>

      {/* ABOUT + FOOTER */}
      <footer id="about" className="bg-surface">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe2 className="size-5 text-primary" aria-hidden />
              <span className="font-display text-sm font-bold tracking-widest text-foreground">
                LANDVISION AI
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              An AI-powered early-warning and decision-support platform for land acquisition delay
              prediction, root-cause explanation and intervention tracking.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Demonstration build. All figures are synthetic and not official government data.
            </p>
          </div>
          <FooterCol
            title="Platform"
            links={[
              { label: "Government Portal", to: "/app/dashboard" },
              { label: "Public Portal", to: "/public" },
              { label: "GIS Risk Map", to: "/app/gis" },
              { label: "AI Insights", to: "/app/insights" },
            ]}
          />
          <FooterCol
            title="Resources"
            links={[
              { label: "Public Notices", to: "/public/notices" },
              { label: "Public Statistics", to: "/public/statistics" },
              { label: "About", to: "/public/about" },
            ]}
          />
          <div>
            <p className="font-display text-sm font-semibold text-foreground">Privacy, Security & Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Role-based access control</li>
              <li>Audit-logged administrative actions</li>
              <li>No personal landowner data exposed publicly</li>
              <li>contact@landvision.demo</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          LandVision AI — demonstration platform for Smart India Hackathon evaluation.
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; to: string }[] }) {
  return (
    <div>
      <p className="font-display text-sm font-semibold text-foreground">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
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
      <p className="text-xs font-semibold tracking-widest text-primary uppercase">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-bold text-foreground">{title}</h2>
      <p className="mt-3 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Metric({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const n = useCountUp(value, 1200);
  return (
    <div className="panel p-5">
      <p className="font-display text-3xl font-bold text-foreground tabular-nums">
        {n.toLocaleString("en-IN")}
        {suffix ?? ""}
      </p>
      <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
