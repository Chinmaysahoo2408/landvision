import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Play,
  ShieldAlert,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { DemoTag, EmptyState, PageHeader, Panel, PanelTitle } from "@/components/lv/panels";
import { useLV } from "@/lib/lv/store";
import type { Alert } from "@/lib/lv/types";

export const Route = createFileRoute("/app/alerts")({
  head: () => ({
    meta: [
      { title: "Risk Early-Warning Alerts & Escalations — LandVision AI" },
      {
        name: "description",
        content:
          "Automated escalation alerts triggered by rising land acquisition delay risk, compensation stalls, and court dispute breaches.",
      },
      { property: "og:title", content: "Risk Alerts — LandVision AI" },
    ],
  }),
  component: AlertsPage,
});

const SEVERITY: Alert["severity"][] = ["Critical", "High", "Medium", "Information"];
const STATUSES: Alert["status"][] = ["New", "Acknowledged", "Assigned", "Escalated", "Resolved"];

function tone(sev: Alert["severity"]) {
  return sev === "Critical"
    ? "var(--risk-critical)"
    : sev === "High"
      ? "var(--risk-high)"
      : sev === "Medium"
        ? "var(--risk-medium)"
        : "var(--primary)";
}

function AlertsPage() {
  const { alerts, updateAlert, addIntervention, session } = useLV();
  const [sev, setSev] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const filtered = useMemo(
    () => alerts.filter((a) => (!sev || a.severity === sev) && (!status || a.status === status)),
    [alerts, sev, status],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automated Risk Early-Warning & Escalation Center"
        description="Real-time automated threshold signals: SLA breaches, legal dispute spikes, stalled compensation disbursals, and stakeholder responsiveness declines."
      >
        <DemoTag />
      </PageHeader>

      <Panel>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div className="flex flex-wrap gap-2">
            <select
              value={sev}
              onChange={(e) => setSev(e.target.value)}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground font-medium"
            >
              <option value="">All Severities</option>
              {SEVERITY.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground font-medium"
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-muted-foreground">
            Showing <strong>{filtered.length}</strong> active alert signals
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No alerts" description="No alerts match the selected filters." icon={Bell} />
        ) : (
          <ul className="space-y-3">
            {filtered.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-card p-4 shadow-2xs hover:border-primary/40 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: tone(a.severity) }} aria-hidden />
                    <p className="text-sm font-bold text-foreground">{a.projectName}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        a.severity === "Critical"
                          ? "bg-risk-critical/15 text-risk-critical"
                          : a.severity === "High"
                            ? "bg-risk-high/15 text-risk-high"
                            : "bg-risk-medium/15 text-risk-medium"
                      }`}
                    >
                      {a.severity}
                    </span>
                    <span className="text-muted-foreground">{new Date(a.createdAt).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <p className="mt-1.5 text-xs font-medium text-foreground">{a.message}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                  <span>
                    Trigger: <strong className="text-foreground">{a.trigger}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Assigned Officer: <strong className="text-foreground">{a.officer}</strong>
                  </span>
                </div>

                {a.recommendation ? (
                  <div className="mt-2 rounded-lg bg-surface border border-border p-2 text-[11px] text-primary flex items-start gap-1.5">
                    <Sparkles className="size-3.5 shrink-0 mt-0.5" />
                    <span>
                      <strong>AI Recommendation:</strong> {a.recommendation}
                    </span>
                  </div>
                ) : null}

                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          updateAlert(a.id, s);
                          toast.success(`Alert marked as ${s}`);
                        }}
                        className={`rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
                          s === a.status
                            ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                            : "border border-border bg-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        addIntervention({
                          projectId: a.projectId,
                          projectName: a.projectName,
                          recommendationId: null,
                          action: a.recommendation || `Investigate trigger: ${a.trigger}`,
                          assignedTo: a.officer,
                          department: "District Administration",
                          priority: a.severity === "Critical" ? "Critical" : "High",
                          deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
                          status: "In Progress",
                          notes: `Created from Alert ${a.id}: ${a.message}`,
                        });
                        updateAlert(a.id, "Assigned");
                        toast.success("Corrective intervention created and assigned!");
                      }}
                      className="inline-flex items-center gap-1 rounded bg-primary/10 border border-primary/30 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/20"
                    >
                      <Play className="size-3" /> Quick Intervene
                    </button>
                    <Link
                      to="/app/projects/$projectId"
                      params={{ projectId: a.projectId }}
                      className="rounded border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-card"
                    >
                      View Corridor →
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
