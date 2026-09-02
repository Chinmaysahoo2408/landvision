import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Brain,
  CalendarClock,
  ClipboardList,
  Layers,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useLV } from "@/lib/lv/store";
import { overallProgress } from "@/lib/lv/risk";
import { Panel, PanelTitle, PageHeader, DemoTag, EmptyState } from "@/components/lv/panels";
import { RiskBadge, RiskGauge, riskStyle } from "@/components/lv/risk";
import { GisMap } from "@/components/lv/GisMap";

export const Route = createFileRoute("/app/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project risk profile — LandVision AI" },
      {
        name: "description",
        content:
          "Explainable risk profile, stage-wise delay predictions, recommendations and interventions for a land acquisition project.",
      },
      { property: "og:title", content: "Project risk profile — LandVision AI" },
      {
        property: "og:description",
        content: "Explainable AI risk profile for a land acquisition project.",
      },
    ],
  }),
  component: ProjectDetail,
});

const TABS = ["Overview", "Explainable AI", "Stage forecast", "Recommendations", "Interventions"] as const;
type Tab = (typeof TABS)[number];

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const {
    projects,
    predictions,
    interventions,
    addIntervention,
    updateIntervention,
    recStatus,
    setRecStatus,
    session,
  } = useLV();
  const [tab, setTab] = useState<Tab>("Overview");

  const project = projects.find((p) => p.id === projectId || p.projectId === projectId);
  const pred = project ? predictions.get(project.id) : undefined;

  if (!project || !pred) {
    return (
      <EmptyState
        title="Project not found"
        description="This project is not part of the current synthetic dataset."
        icon={Layers}
        action={
          <Link to="/app/projects" className="text-sm font-semibold text-primary">
            Back to portfolio
          </Link>
        }
      />
    );
  }

  const style = riskStyle(pred.riskCategory);
  const projectInterventions = interventions.filter((i) => i.projectId === project.id);

  return (
    <div className="space-y-6">
      <Link
        to="/app/projects"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden /> Back to portfolio
      </Link>

      <PageHeader title={project.name} description={`${project.projectId} · ${project.agency}`}>
        <div className="flex items-center gap-2">
          <DemoTag />
          <RiskBadge category={pred.riskCategory} score={pred.riskScore} />
        </div>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="flex flex-col items-center justify-center gap-3">
          <RiskGauge score={pred.riskScore} category={pred.riskCategory} />
          <p className="text-center text-xs text-muted-foreground">
            Model {pred.modelVersion} · {pred.delayProbability}% delay probability
          </p>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelTitle title="Acquisition snapshot" icon={MapPin} subtitle="Location, land composition and people impact" />
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              ["Location", `${project.village}, ${project.district}`],
              ["State", project.state],
              ["Type", project.type],
              ["Current stage", project.currentStage],
              ["Total land", `${project.landArea} ha`],
              ["Private land", `${project.privateLand} ha`],
              ["Forest land", `${project.forestLand} ha`],
              ["Villages", String(project.villages)],
              ["Affected families", project.affectedFamilies.toLocaleString("en-IN")],
              ["Expected delay", `${pred.expectedDelayDays} days`],
              ["Overall progress", `${overallProgress(project)}%`],
              ["Status", project.status],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">{k}</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              t === tab
                ? "rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                : "rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            }
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel>
            <PanelTitle title="Stage timeline" icon={CalendarClock} subtitle="Planned versus actual progression" />
            <ol className="space-y-3">
              {project.stages.map((s) => (
                <li key={s.stage} className="flex items-start gap-3">
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{
                      background:
                        s.status === "Completed"
                          ? "var(--risk-low)"
                          : s.status === "Delayed"
                            ? "var(--risk-high)"
                            : s.status === "In Progress"
                              ? "var(--primary)"
                              : "var(--border)",
                    }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{s.stage}</p>
                      <span className="text-[11px] text-muted-foreground">{s.status}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary"
                        style={{ width: `${s.progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {s.department} · planned {s.plannedDate}
                      {s.actualDate ? ` · actual ${s.actualDate}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel>
            <PanelTitle title="Geospatial context" icon={MapPin} subtitle="Cadastral parcels around the alignment" />
            <GisMap
              projects={[project]}
              predictions={predictions}
              showParcels
              height="420px"
            />
          </Panel>
        </div>
      ) : null}

      {tab === "Explainable AI" ? (
        <Panel>
          <PanelTitle
            title="Why this project is at risk"
            icon={Brain}
            ai
            subtitle="Normalised factor contributions from the prediction engine"
          />
          <ul className="space-y-4">
            {pred.factors.map((f) => (
              <li key={f.factor}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">{f.factor}</span>
                  <span className="tabular-nums text-muted-foreground">{f.contribution}%</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${f.contribution}%`,
                      background: f.direction === "increases" ? style.stroke : "var(--risk-low)",
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {f.direction === "increases" ? "Increases" : "Reduces"} risk · {f.detail}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {tab === "Stage forecast" ? (
        <Panel>
          <PanelTitle
            title="Stage-wise delay probability"
            icon={Layers}
            subtitle="Where the acquisition is most likely to stall next"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {pred.stageRisks.map((s) => (
              <div key={s.stage} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{s.stage}</p>
                  <RiskBadge category={s.category} />
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${s.probability}%`, background: riskStyle(s.category).stroke }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{s.probability}% delay probability</p>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      {tab === "Recommendations" ? (
        <Panel>
          <PanelTitle
            title="Prioritised interventions"
            icon={Sparkles}
            ai
            subtitle="Generated from the dominant risk factors for this project"
          />
          <ul className="space-y-3">
            {pred.recommendations.map((r) => {
              const status = recStatus[r.id] ?? r.status;
              return (
                <li key={r.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-display text-sm font-semibold text-foreground">
                      P{r.priority} · {r.title}
                    </p>
                    <span className="rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                      {status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>
                  <p className="mt-2 text-xs text-foreground">Action: {r.action}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Expected impact: {r.impact}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["Open", "In Progress", "Completed"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setRecStatus(r.id, s)}
                        className={
                          s === status
                            ? "rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground"
                            : "rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                        }
                      >
                        {s}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        addIntervention({
                          projectId: project.id,
                          projectName: project.name,
                          recommendationId: r.id,
                          action: r.action,
                          assignedTo: session?.name ?? "Unassigned",
                          department: "District Administration",
                          priority: r.priority === 1 ? "Critical" : r.priority === 2 ? "High" : "Medium",
                          deadline: new Date(Date.now() + 21 * 86400_000).toISOString().slice(0, 10),
                          status: "Pending",
                          notes: r.reason,
                        });
                        toast.success("Intervention created and assigned");
                      }}
                      className="rounded-md border border-primary px-2.5 py-1 text-[11px] font-semibold text-primary"
                    >
                      Create intervention
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}

      {tab === "Interventions" ? (
        <Panel>
          <PanelTitle
            title="Intervention tracker"
            icon={ClipboardList}
            subtitle="Assigned corrective actions for this project"
          />
          {projectInterventions.length === 0 ? (
            <EmptyState
              title="No interventions yet"
              description="Create an intervention from the recommendations tab to start tracking corrective action."
              icon={Users}
            />
          ) : (
            <ul className="space-y-3">
              {projectInterventions.map((i) => (
                <li key={i.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">{i.action}</p>
                    <span className="rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                      {i.priority} · due {i.deadline}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {i.assignedTo} · {i.department}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(["Pending", "In Progress", "Completed", "Escalated"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateIntervention(i.id, { status: s })}
                        className={
                          s === i.status
                            ? "rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground"
                            : "rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                        }
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
