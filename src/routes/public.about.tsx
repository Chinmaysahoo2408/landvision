import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Brain,
  Database,
  Gauge,
  Lightbulb,
  Map as MapIcon,
  ShieldCheck,
} from "lucide-react";
import { DemoTag, Panel, PanelTitle, PageHeader } from "@/components/lv/panels";

export const Route = createFileRoute("/public/about")({
  head: () => ({
    meta: [
      { title: "About — LandVision Public Portal" },
      {
        name: "description",
        content:
          "How LandVision AI turns land data into actionable insight: Land Data → GIS → AI Analysis → Risk Prediction → Actionable Insights.",
      },
      { property: "og:title", content: "About — LandVision Public Portal" },
      {
        property: "og:description",
        content: "How LandVision AI works and what it protects.",
      },
    ],
  }),
  component: PublicAbout,
});

const PIPELINE = [
  {
    icon: Database,
    title: "Land Data",
    text: "Project, land, compensation, approval, legal and R&R records are collected for each acquisition.",
  },
  {
    icon: MapIcon,
    title: "GIS",
    text: "Projects are placed on an interactive geospatial map with location and stage context.",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    text: "A transparent scoring engine weighs the factors that most often drive acquisition delays.",
  },
  {
    icon: Gauge,
    title: "Risk Prediction",
    text: "Each project receives a risk category and an estimated likelihood of delay.",
  },
  {
    icon: Lightbulb,
    title: "Actionable Insights",
    text: "Authorities see where to intervene first; citizens see transparent progress.",
  },
];

function PublicAbout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageHeader
        title="About LandVision AI"
        description="LandVision AI helps authorities anticipate land acquisition delays and gives citizens a transparent window into project progress."
      >
        <DemoTag />
      </PageHeader>

      {/* PIPELINE */}
      <Panel className="mt-6">
        <PanelTitle
          title="How it works"
          subtitle="A single flow from raw land data to insight that anyone can follow."
        />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          {PIPELINE.map((step, i) => (
            <div key={step.title} className="flex flex-1 items-stretch gap-3">
              <div className="flex-1 rounded-xl border border-border bg-surface p-4">
                <span className="grid size-10 place-items-center rounded-lg border border-border bg-background text-primary">
                  <step.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-3 font-display text-sm font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {step.text}
                </p>
              </div>
              {i < PIPELINE.length - 1 ? (
                <div className="hidden items-center justify-center lg:flex">
                  <ArrowRight className="size-4 text-primary" aria-hidden />
                </div>
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          The prediction engine in this demonstration is a transparent,
          rule-based model — not a trained machine-learning system — so every
          score can be traced back to the factors that produced it.
        </p>
      </Panel>

      {/* WHAT / WHY */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel>
          <PanelTitle title="What the platform does" />
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              "Tracks land acquisition projects across states and districts.",
              "Shows progress stage by stage, from notification to completion.",
              "Highlights where delays are most likely so authorities can act early.",
              "Publishes notices and aggregate statistics for public transparency.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <ArrowRight
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                {t}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelTitle title="What we protect" icon={ShieldCheck} />
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              "Individual landowner identities and personal details are never shown publicly.",
              "Internal administrative notes stay within the government workspace.",
              "Detailed risk scores and model attributions are limited to authorised officers.",
              "Access is role-based and administrative actions are audit-logged.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                {t}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* DATA NOTE + CTA */}
      <Panel className="mt-6 border-primary/30 bg-primary/5">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Explore the portal
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse projects, follow notices and view aggregate statistics. All
              figures are synthetic demonstration data.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/public/projects"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[var(--shadow-glow)]"
            >
              Browse projects <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              to="/public/statistics"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              View statistics
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}
