import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  Clock,
  Edit,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  UserCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { DemoTag, PageHeader, Panel, PanelTitle, StatCard } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";
import type { Intervention } from "@/lib/lv/types";

export const Route = createFileRoute("/app/interventions")({
  component: InterventionsPage,
  head: () => ({
    meta: [
      { title: "Intervention Management & Risk Recalculation — LandVision AI" },
      {
        name: "description",
        content:
          "Closed-loop administrative intervention management. Assign corrective actions, track field resolution, and monitor real-time risk reduction.",
      },
    ],
  }),
});

function InterventionsPage() {
  const { interventions, updateIntervention, addIntervention, visibleProjects, session } = useLV();
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showModal, setShowModal] = useState(false);

  const [newAction, setNewAction] = useState("");
  const [newProject, setNewProject] = useState(visibleProjects[0]?.id ?? "p1");
  const [newOfficer, setNewOfficer] = useState(session?.name ?? "Special Land Acquisition Officer");
  const [newDept, setNewDept] = useState("District Revenue Cell");
  const [newPriority, setNewPriority] = useState<Intervention["priority"]>("Critical");
  const [newDeadline, setNewDeadline] = useState(
    new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
  );
  const [newNotes, setNewNotes] = useState("");

  const filteredInterventions = useMemo(() => {
    return interventions.filter((i) => !filterStatus || i.status === filterStatus);
  }, [interventions, filterStatus]);

  const stats = useMemo(() => {
    const total = interventions.length;
    const inProgress = interventions.filter((i) => i.status === "In Progress").length;
    const completed = interventions.filter((i) => i.status === "Completed").length;
    const avgReduction =
      Math.round(interventions.reduce((s, i) => s + i.riskReduction, 0) / (total || 1)) || 13;

    return { total, inProgress, completed, avgReduction };
  }, [interventions]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction) {
      toast.error("Please enter the recommended intervention action.");
      return;
    }
    const proj = visibleProjects.find((p) => p.id === newProject);
    addIntervention({
      projectId: newProject,
      projectName: proj?.name ?? "Selected Corridor",
      recommendationId: null,
      action: newAction,
      assignedTo: newOfficer,
      department: newDept,
      priority: newPriority,
      deadline: newDeadline,
      status: "In Progress",
      notes: newNotes || "Created via Intervention Management Center",
    });

    toast.success("Intervention assigned and added to audit trail!");
    setShowModal(false);
    setNewAction("");
    setNewNotes("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrative Intervention Management Center"
        description="Closed-loop governance workflow: Risk Identified → AI Recommendation → Officer Assigned → Action Taken → Progress Monitored → Risk Recalculated."
      >
        <div className="flex items-center gap-2">
          <DemoTag />
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:shadow-[var(--shadow-glow)]"
          >
            <Plus className="size-4" /> Create Intervention
          </button>
        </div>
      </PageHeader>

      {/* CLOSED-LOOP PROCESS BANNER */}
      <Panel className="border-primary/40 bg-gradient-to-r from-primary/10 via-card to-primary/5">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
            <span className="rounded bg-surface px-2.5 py-1 border border-border">1. Risk Identified</span>
            <ArrowRight className="size-3.5 text-primary" />
            <span className="rounded bg-surface px-2.5 py-1 border border-border">2. AI Recommendation</span>
            <ArrowRight className="size-3.5 text-primary" />
            <span className="rounded bg-surface px-2.5 py-1 border border-border">3. Officer Assigned</span>
            <ArrowRight className="size-3.5 text-primary" />
            <span className="rounded bg-surface px-2.5 py-1 border border-border">4. Action Taken</span>
            <ArrowRight className="size-3.5 text-primary" />
            <span className="rounded bg-surface px-2.5 py-1 border border-border text-risk-low font-bold">
              5. Risk Recalculated
            </span>
          </div>
          <div className="rounded-md bg-risk-low/15 px-2.5 py-1 text-xs font-bold text-risk-low">
            Average Risk Reduction: -{stats.avgReduction}%
          </div>
        </div>
      </Panel>

      {/* KPI METRICS */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <StatCard label="Total Interventions" value={stats.total} icon={ShieldAlert} hint="Assigned field actions" />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={Clock}
          tone="medium"
          hint="Active field campaigns"
        />
        <StatCard
          label="Completed & Verified"
          value={stats.completed}
          icon={CheckCircle2}
          tone="low"
          hint="Resolved bottlenecks"
        />
        <StatCard
          label="Average Risk Drop"
          value={stats.avgReduction}
          suffix=" pts"
          icon={TrendingDown}
          tone="low"
          hint="Measurable risk drop"
        />
      </div>

      {/* INTERVENTIONS REGISTRY TABLE */}
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <PanelTitle
            title="Active Intervention Register & Risk Recalculation"
            subtitle="Review assigned officers, priority deadlines, and before/after risk impact"
            icon={UserCheck}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status Filter:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-foreground font-medium"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Escalated">Escalated</option>
            </select>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredInterventions.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-4 shadow-2xs transition-all hover:border-primary/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        item.priority === "Critical"
                          ? "bg-risk-critical/15 text-risk-critical"
                          : item.priority === "High"
                            ? "bg-risk-high/15 text-risk-high"
                            : "bg-risk-medium/15 text-risk-medium"
                      }`}
                    >
                      {item.priority} Priority
                    </span>
                    <span className="font-display text-sm font-bold text-foreground">{item.action}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Corridor: <strong className="text-foreground">{item.projectName}</strong> ({item.id})
                  </p>
                </div>

                {/* BEFORE VS AFTER RISK REDUCTION PILL */}
                <div className="flex items-center gap-2 rounded-lg bg-surface border border-border px-3 py-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Previous Risk</span>
                    <span className="font-bold text-risk-high tabular-nums">{item.previousRisk}%</span>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Current Risk</span>
                    <span className="font-bold text-risk-low tabular-nums">{item.currentRisk}%</span>
                  </div>
                  <span className="rounded bg-risk-low/20 px-1.5 py-0.5 text-[10px] font-bold text-risk-low">
                    -{item.riskReduction}%
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Assigned Officer</span>
                  <p className="mt-0.5 font-medium text-foreground">{item.assignedTo}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Nodal Department</span>
                  <p className="mt-0.5 font-medium text-foreground">{item.department}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Deadline</span>
                  <p className="mt-0.5 font-medium text-foreground">{item.deadline}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Status Action</span>
                  <div className="mt-0.5 flex gap-1">
                    {(["In Progress", "Completed", "Escalated"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          updateIntervention(item.id, { status: st });
                          toast.success(`Updated intervention to ${st}`);
                        }}
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                          item.status === st
                            ? "bg-primary text-primary-foreground font-bold"
                            : "border border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {item.notes ? (
                <p className="mt-2 rounded bg-surface/60 p-2 text-[11px] text-muted-foreground">
                  <strong>Notes:</strong> {item.notes}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </Panel>

      {/* CREATE INTERVENTION MODAL */}
      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-display text-lg font-bold text-foreground">Create Administrative Intervention</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Assign corrective field action to mitigate delay probability and recalculate risk score.
            </p>

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Target Corridor</label>
                <select
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground"
                >
                  {visibleProjects.slice(0, 20).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.district})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Intervention Action Title</label>
                <input
                  type="text"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  placeholder="e.g., Convene Special Lok Adalat Camp for Balianta title disputes"
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Assigned Officer</label>
                  <input
                    type="text"
                    value={newOfficer}
                    onChange={(e) => setNewOfficer(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Nodal Department</label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Intervention["priority"])}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Deadline</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Implementation Notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Additional context or milestone steps"
                  className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground outline-none"
                  rows={2}
                />
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  Assign &amp; Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
