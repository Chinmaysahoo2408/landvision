import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Clock,
  Landmark,
  MapPin,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import { DemoTag, EmptyState, Panel, PanelTitle } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";
import { overallProgress } from "@/lib/lv/risk";
import type { StageProgress } from "@/lib/lv/types";

export const Route = createFileRoute("/public/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project details — LandVision Public Portal" },
      {
        name: "description",
        content:
          "Public overview of a land acquisition project — location, land composition, progress stages and public notice.",
      },
      {
        property: "og:title",
        content: "Project details — LandVision Public Portal",
      },
      {
        property: "og:description",
        content: "Land acquisition project progress and public notice.",
      },
    ],
  }),
  component: PublicProjectDetail,
});

function stageStyle(status: StageProgress["status"]) {
  switch (status) {
    case "Completed":
      return {
        icon: CheckCircle2,
        color: "var(--risk-low)",
        label: "Completed",
      };
    case "In Progress":
      return { icon: Clock, color: "var(--primary)", label: "In progress" };
    case "Delayed":
      return {
        icon: TriangleAlert,
        color: "var(--risk-high)",
        label: "Delayed",
      };
    default:
      return {
        icon: CircleDashed,
        color: "var(--muted-foreground)",
        label: "Upcoming",
      };
  }
}

function PublicProjectDetail() {
  const { projectId } = Route.useParams();
  const { visibleProjects, predictions } = useLV();
  const project = visibleProjects.find((p) => p.id === projectId);

  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Panel>
          <EmptyState
            title="Project not found"
            description="This project may not exist or is not available on the public portal."
            icon={Building2}
            action={
              <Link
                to="/public/projects"
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <ArrowLeft className="size-4" aria-hidden /> Back to projects
              </Link>
            }
          />
        </Panel>
      </div>
    );
  }

  const cat = predictions.get(project.id)?.riskCategory;
  const pct = overallProgress(project);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        to="/public/projects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to projects
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {project.type} · {project.projectId}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold text-foreground">
            {project.name}
          </h1>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" aria-hidden /> {project.district},{" "}
            {project.state}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Landmark className="size-4" aria-hidden /> {project.agency}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              project.status === "Active"
                ? "border-primary/40 text-primary"
                : project.status === "Completed"
                  ? "border-border text-muted-foreground"
                  : "border-[var(--risk-high)]/40 text-[var(--risk-high)]"
            }`}
          >
            {project.status}
          </span>
          {cat ? <RiskBadge category={cat} /> : null}
        </div>
      </div>

      <DemoTag className="mt-4" />

      {/* OVERVIEW STATS */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewCard
          icon={Landmark}
          label="Total land area"
          value={`${project.landArea.toLocaleString("en-IN")} ha`}
        />
        <OverviewCard
          icon={Building2}
          label="Villages"
          value={project.villages.toLocaleString("en-IN")}
        />
        <OverviewCard
          icon={Users}
          label="Affected families"
          value={project.affectedFamilies.toLocaleString("en-IN")}
        />
        <OverviewCard
          icon={CalendarClock}
          label="Current stage"
          value={project.currentStage}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* PROGRESS TIMELINE */}
        <Panel>
          <PanelTitle
            title="Acquisition progress"
            subtitle={`Overall ${pct}% across the acquisition lifecycle.`}
            icon={CalendarClock}
          />
          <div className="mb-6">
            <div className="h-2.5 rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <ol className="relative space-y-4 border-l border-border pl-6">
            {project.stages.map((s) => {
              const style = stageStyle(s.status);
              const Icon = style.icon;
              return (
                <li key={s.stage} className="relative">
                  <span
                    className="absolute top-0.5 -left-[31px] grid size-5 place-items-center rounded-full border-2 border-background"
                    style={{ background: style.color }}
                  >
                    <Icon className="size-3 text-background" aria-hidden />
                  </span>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {s.stage}
                    </p>
                    <span
                      className="text-xs font-medium"
                      style={{ color: style.color }}
                    >
                      {style.label} · {s.progress}%
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Planned{" "}
                    {new Date(s.plannedDate).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                    })}
                    {s.actualDate
                      ? ` · Actual ${new Date(s.actualDate).toLocaleDateString(
                          "en-IN",
                          {
                            year: "numeric",
                            month: "short",
                          },
                        )}`
                      : ""}
                  </p>
                </li>
              );
            })}
          </ol>
        </Panel>

        <div className="space-y-6">
          {/* LAND COMPOSITION */}
          <Panel>
            <PanelTitle
              title="Land composition"
              subtitle="Area by ownership category."
              icon={Landmark}
            />
            <div className="space-y-4">
              {[
                {
                  label: "Government land",
                  value: project.govtLand,
                  color: "var(--chart-2)",
                },
                {
                  label: "Private land",
                  value: project.privateLand,
                  color: "var(--chart-1)",
                },
                {
                  label: "Forest land",
                  value: project.forestLand,
                  color: "var(--chart-4)",
                },
              ].map((row) => {
                const share =
                  project.landArea > 0
                    ? Math.round((row.value / project.landArea) * 100)
                    : 0;
                return (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="text-foreground tabular-nums">
                        {row.value.toLocaleString("en-IN")} ha · {share}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-surface">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${share}%`, background: row.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* PUBLIC NOTICE */}
          <Panel>
            <PanelTitle title="Public notice" icon={ShieldCheck} />
            <p className="text-sm text-muted-foreground">
              {project.publicNotice}
            </p>
            <p className="mt-3 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              Sample notice shown for demonstration only — this is not an
              official government notification.
            </p>
          </Panel>
        </div>
      </div>

      {/* PRIVACY NOTE */}
      <Panel className="mt-6 border-primary/30 bg-primary/5">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ShieldCheck className="size-4 text-primary" aria-hidden /> Your
          privacy is protected
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          This public view shows only aggregate project information. Individual
          landowner identities, personal contact details, internal
          administrative notes and detailed risk analytics are never published
          here.
        </p>
      </Panel>
    </div>
  );
}

function OverviewCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <Panel className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <Icon className="size-4 text-primary" aria-hidden />
      </div>
      <p className="mt-1.5 font-display text-lg font-semibold text-foreground">
        {value}
      </p>
    </Panel>
  );
}
