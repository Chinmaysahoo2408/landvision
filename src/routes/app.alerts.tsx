import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useLV } from "@/lib/lv/store";
import { DemoTag, EmptyState, Panel, PageHeader } from "@/components/lv/panels";
import type { Alert } from "@/lib/lv/types";

export const Route = createFileRoute("/app/alerts")({
  head: () => ({
    meta: [
      { title: "Risk alerts — LandVision AI" },
      {
        name: "description",
        content: "Automated escalation alerts triggered by rising land acquisition delay risk.",
      },
      { property: "og:title", content: "Risk alerts — LandVision AI" },
      { property: "og:description", content: "Automated land acquisition risk escalation alerts." },
    ],
  }),
  component: AlertsPage,
});

const SEVERITY: Alert["severity"][] = ["Critical", "High", "Medium", "Information"];
const STATUSES: Alert["status"][] = ["New", "Acknowledged", "Escalated", "Resolved"];

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
  const { alerts, updateAlert } = useLV();
  const [sev, setSev] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const filtered = useMemo(
    () =>
      alerts.filter((a) => (!sev || a.severity === sev) && (!status || a.status === status)),
    [alerts, sev, status],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alerts &amp; escalations"
        description="Threshold breaches, stalled stages and legal escalations flagged by the prediction engine."
      >
        <DemoTag />
      </PageHeader>

      <Panel>
        <div className="mb-4 flex flex-wrap gap-3">
          <select
            value={sev}
            onChange={(e) => setSev(e.target.value)}
            className="rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground"
          >
            <option value="">All severities</option>
            {SEVERITY.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState title="No alerts" description="No alerts match the selected filters." icon={Bell} />
        ) : (
          <ul className="space-y-3">
            {filtered.map((a) => (
              <li key={a.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: tone(a.severity) }} aria-hidden />
                    <p className="text-sm font-semibold text-foreground">{a.projectName}</p>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {a.severity} · {new Date(a.createdAt).toLocaleString("en-IN")}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.message}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Trigger: {a.trigger} · Owner: {a.officer}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateAlert(a.id, s)}
                      className={
                        s === a.status
                          ? "rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground"
                          : "rounded-md border border-border px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                      }
                    >
                      {s}
                    </button>
                  ))}
                  <Link
                    to="/app/projects/$projectId"
                    params={{ projectId: a.projectId }}
                    className="ml-auto text-[11px] font-semibold text-primary"
                  >
                    Open project
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
