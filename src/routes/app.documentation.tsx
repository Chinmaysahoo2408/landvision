import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Layers,
  MapPin,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DemoTag, PageHeader, Panel, PanelTitle, StatCard } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";
import type { DocumentItem } from "@/lib/lv/types";

export const Route = createFileRoute("/app/documentation")({
  component: DocumentationPage,
  head: () => ({
    meta: [
      { title: "Documentation & Title Verification Compliance — LandVision AI" },
      {
        name: "description",
        content:
          "Audit land records, Record-of-Rights (RoR), statutory clearances, survey maps, and legal title compliance across acquisition parcels.",
      },
    ],
  }),
});

const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

function DocumentationPage() {
  const { visibleProjects, predictions } = useLV();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("nh16");

  const project =
    visibleProjects.find((p) => p.id === selectedProjectId || p.projectId === selectedProjectId) ??
    visibleProjects[0]!;

  const aggregateDocs = useMemo(() => {
    const map = new Map<string, { type: string; submitted: number; verified: number; pending: number; rejected: number }>();

    for (const p of visibleProjects) {
      for (const d of p.documents) {
        const cur = map.get(d.type) ?? { type: d.type, submitted: 0, verified: 0, pending: 0, rejected: 0 };
        cur.submitted += d.submitted;
        cur.verified += d.verified;
        cur.pending += d.pending;
        cur.rejected += d.rejected;
        map.set(d.type, cur);
      }
    }

    return [...map.values()].map((d) => ({
      ...d,
      compliancePct: Math.round((d.verified / (d.submitted || 1)) * 100),
    }));
  }, [visibleProjects]);

  const totalSubmitted = aggregateDocs.reduce((s, d) => s + d.submitted, 0);
  const totalVerified = aggregateDocs.reduce((s, d) => s + d.verified, 0);
  const totalPending = aggregateDocs.reduce((s, d) => s + d.pending, 0);
  const totalRejected = aggregateDocs.reduce((s, d) => s + d.rejected, 0);
  const nationalDocCompliance = totalSubmitted > 0 ? Math.round((totalVerified / totalSubmitted) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentation Verification & Title Compliance Center"
        description="Track the verification status of 6 statutory document classes: Land Ownership Titles, Cadastral Survey Demarcation, Legal Notices, Compensation Awards, R&R Plans, and Statutory Clearances."
      >
        <DemoTag />
      </PageHeader>

      {/* STAT CARDS */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <StatCard
          label="Total Documents Tracked"
          value={totalSubmitted}
          icon={FileText}
          hint="Submitted title dossiers"
        />
        <StatCard
          label="Verified & Cleared"
          value={totalVerified}
          icon={FileCheck}
          tone="low"
          hint="Mutation & title confirmed"
        />
        <StatCard
          label="Pending Verification"
          value={totalPending}
          icon={Clock}
          tone="medium"
          hint="Under Tehsil scrutiny"
        />
        <StatCard
          label="Compliance Rate"
          value={nationalDocCompliance}
          suffix="%"
          icon={ShieldCheck}
          tone={nationalDocCompliance >= 75 ? "low" : "high"}
          hint="Portfolio compliance"
        />
      </div>

      {/* NATIONAL COMPLIANCE CHART ACROSS 6 DOCUMENT CLASSES */}
      <Panel>
        <PanelTitle
          title="National Compliance by Document Category (6 Statutory Classes)"
          subtitle="Verified, pending, and rejected documentation volumes across all monitored corridors"
          icon={FileSpreadsheet}
        />
        <div className="mt-4 h-76">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={aggregateDocs} margin={{ left: 16 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="type" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(t) => t.split(" ")[0]} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="verified" name="Verified" fill="var(--risk-low)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" name="Pending Verification" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" name="Rejected / Defective" fill="var(--risk-critical)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* PROJECT-LEVEL DOCUMENT DRILLDOWN */}
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <PanelTitle
            title="Corridor Document Compliance Inspector"
            subtitle="View document verification status for a specific corridor"
            icon={FileCheck}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Select Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-foreground font-medium"
            >
              {visibleProjects.slice(0, 30).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectId}) — {p.district}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {project.documents.map((doc) => {
            const isDeficient = doc.compliancePct < 60;
            return (
              <div
                key={doc.type}
                className={`rounded-xl border p-4 shadow-2xs transition-all ${
                  isDeficient ? "border-risk-high/40 bg-risk-high/5" : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-xs font-bold text-foreground">{doc.type}</h4>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      doc.compliancePct >= 80
                        ? "bg-risk-low/15 text-risk-low"
                        : doc.compliancePct >= 60
                          ? "bg-risk-medium/15 text-risk-medium"
                          : "bg-risk-high/15 text-risk-high"
                    }`}
                  >
                    {doc.compliancePct}% Compliance
                  </span>
                </div>

                <div className="mt-2.5 space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${doc.compliancePct}%`,
                        background: doc.compliancePct >= 70 ? "var(--risk-low)" : "var(--risk-high)",
                      }}
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded bg-surface p-1.5 border border-border">
                    <span className="text-[10px] text-muted-foreground block">Verified</span>
                    <span className="font-bold text-risk-low tabular-nums">{doc.verified}</span>
                  </div>
                  <div className="rounded bg-surface p-1.5 border border-border">
                    <span className="text-[10px] text-muted-foreground block">Pending</span>
                    <span className="font-bold text-risk-medium tabular-nums">{doc.pending}</span>
                  </div>
                  <div className="rounded bg-surface p-1.5 border border-border">
                    <span className="text-[10px] text-muted-foreground block">Rejected</span>
                    <span className="font-bold text-risk-critical tabular-nums">{doc.rejected}</span>
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
