import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileCheck,
  Flag,
  Hourglass,
  Layers,
  MapPin,
  Sparkles,
} from "lucide-react";
import { DemoTag, PageHeader, Panel, PanelTitle } from "@/components/lv/panels";
import { RiskBadge, riskStyle } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";
import type { Stage, StageProgress } from "@/lib/lv/types";
import { STAGES } from "@/lib/lv/types";

export const Route = createFileRoute("/app/timeline")({
  component: TimelinePage,
  head: () => ({
    meta: [
      { title: "Project Lifecycle & Timeline Analysis — LandVision AI" },
      {
        name: "description",
        content:
          "Interactive 8-stage land acquisition timeline with planned vs actual progress, stage-wise delay probabilities, bottleneck detection, and AI timeline insights.",
      },
    ],
  }),
});

function TimelinePage() {
  const { visibleProjects, predictions } = useLV();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("nh16");

  const project =
    visibleProjects.find((p) => p.id === selectedProjectId || p.projectId === selectedProjectId) ??
    visibleProjects[0]!;

  const pred = predictions.get(project.id);

  const bottleneckStage = pred?.bottleneckStage ?? "Legal Resolution";
  const bottleneckInfo = project.stages.find((s) => s.stage === bottleneckStage);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Lifecycle & Timeline Bottleneck Analysis"
        description="End-to-end 8-stage tracking of acquisition milestones from initial Section 11 Notification to final Possession and Completion."
      >
        <DemoTag />
      </PageHeader>

      {/* PROJECT SELECTOR BAR */}
      <Panel className="bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Select Corridor:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary"
            >
              {visibleProjects.slice(0, 30).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectId}) — {p.district}, {p.state}
                </option>
              ))}
            </select>
          </div>
          {pred ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Corridor Delay Risk:</span>
              <RiskBadge category={pred.riskCategory} score={pred.riskScore} />
            </div>
          ) : null}
        </div>
      </Panel>

      {/* AI TIMELINE INSIGHT CALLOUT */}
      <Panel className="border-primary/40 bg-gradient-to-r from-primary/10 via-card to-primary/5">
        <div className="flex items-start gap-3.5">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <Sparkles className="size-5" />
          </span>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold text-foreground">AI Timeline Bottleneck Insight</h3>
              <span className="rounded bg-risk-critical/15 px-2 py-0.5 text-[10px] font-bold text-risk-critical uppercase">
                Critical Bottleneck: {bottleneckStage}
              </span>
            </div>
            <p className="text-xs text-foreground">
              <strong className="text-primary">{bottleneckStage}</strong> is currently the largest contributor to the
              predicted project delay ({bottleneckInfo?.daysDelayed ?? 144} days delay, {pred?.delayProbability ?? 84}% delay
              probability).
            </p>
            <p className="text-[11px] text-muted-foreground">
              Primary Driver: Land disputes pending before court and compensation award reconciliation in {project.district}.
              Recommended Action: Convene Special Lok Adalat and fast-track disbursal drive.
            </p>
          </div>
        </div>
      </Panel>

      {/* 8-STAGE INTERACTIVE TIMELINE */}
      <Panel>
        <PanelTitle
          title="8-Stage Acquisition Milestone Timeline"
          subtitle="Planned vs Actual milestone start/end dates, delay days, and responsible government departments"
          icon={CalendarClock}
        />

        <div className="mt-6 space-y-6">
          {project.stages.map((st, i) => {
            const isBottleneck = st.stage === bottleneckStage;
            const style = riskStyle(st.riskCategory);

            return (
              <div
                key={st.stage}
                className={`relative rounded-xl border p-4 transition-all ${
                  isBottleneck
                    ? "border-risk-critical/60 bg-risk-critical/5 shadow-sm ring-1 ring-risk-critical/30"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {/* STAGE HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                        st.status === "Completed"
                          ? "bg-risk-low text-white"
                          : isBottleneck
                            ? "bg-risk-critical text-white animate-pulse"
                            : "bg-surface border border-border text-foreground"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="font-display text-sm font-bold text-foreground">{st.stage}</h4>
                      <p className="text-[11px] text-muted-foreground">Nodal: {st.department}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isBottleneck ? (
                      <span className="rounded bg-risk-critical px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                        Active Bottleneck
                      </span>
                    ) : null}
                    <span
                      className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                        st.status === "Completed"
                          ? "bg-risk-low/15 text-risk-low"
                          : st.status === "Delayed"
                            ? "bg-risk-high/15 text-risk-high"
                            : st.status === "In Progress"
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {st.status}
                    </span>
                    <RiskBadge category={st.riskCategory} />
                  </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Milestone Progress</span>
                    <span className="font-bold text-foreground tabular-nums">{st.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${st.progress}%`,
                        background:
                          st.status === "Completed"
                            ? "var(--risk-low)"
                            : isBottleneck
                              ? "var(--risk-critical)"
                              : "var(--primary)",
                      }}
                    />
                  </div>
                </div>

                {/* METRICS ROW */}
                <div className="mt-3.5 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4 text-xs">
                  <div>
                    <span className="text-[10px] tracking-wider text-muted-foreground uppercase">Planned Dates</span>
                    <p className="mt-0.5 font-medium text-foreground">
                      {st.plannedDate} → {st.plannedCompletion}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] tracking-wider text-muted-foreground uppercase">Actual / Realized</span>
                    <p className="mt-0.5 font-medium text-foreground">
                      {st.actualDate ?? "Pending"} → {st.actualCompletion ?? "In Progress"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] tracking-wider text-muted-foreground uppercase">Days Delayed</span>
                    <p
                      className={`mt-0.5 font-bold tabular-nums ${
                        st.daysDelayed > 30 ? "text-risk-high" : "text-foreground"
                      }`}
                    >
                      {st.daysDelayed > 0 ? `+${st.daysDelayed} days` : "On Schedule"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] tracking-wider text-muted-foreground uppercase">Delay Probability</span>
                    <p className="mt-0.5 font-bold tabular-nums text-foreground">{st.delayProbability}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
