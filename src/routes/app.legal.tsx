import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Gavel,
  LandPlot,
  Layers,
  MapPin,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { DemoTag, PageHeader, Panel, PanelTitle, StatCard } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";
import type { LegalCase } from "@/lib/lv/types";

export const Route = createFileRoute("/app/legal")({
  component: LegalDisputesPage,
  head: () => ({
    meta: [
      { title: "Legal Dispute Intelligence & Litigation Tracking — LandVision AI" },
      {
        name: "description",
        content:
          "Monitor court litigations, stay orders, title dispute backlogs, and resolution timelines impacting land acquisition corridors.",
      },
    ],
  }),
});

function LegalDisputesPage() {
  const { visibleProjects, predictions } = useLV();
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("");

  const allLegalCases = useMemo(() => {
    const list: (LegalCase & { projectName: string; state: string; district: string })[] = [];
    for (const p of visibleProjects) {
      for (const c of p.legalCases) {
        list.push({ ...c, projectName: p.name, state: p.state, district: p.district });
      }
    }
    return list;
  }, [visibleProjects]);

  const filteredCases = useMemo(() => {
    return allLegalCases.filter((c) => {
      if (selectedState && c.state !== selectedState) return false;
      if (selectedCourt && c.court !== selectedCourt) return false;
      if (selectedSeverity && c.severity !== selectedSeverity) return false;
      return true;
    });
  }, [allLegalCases, selectedState, selectedCourt, selectedSeverity]);

  const stats = useMemo(() => {
    const total = allLegalCases.length;
    const pending = allLegalCases.filter((c) => c.status !== "Resolved").length;
    const stayGranted = allLegalCases.filter((c) => c.status === "Stay Granted").length;
    const critical = allLegalCases.filter((c) => c.severity === "Critical").length;
    const affectedParcelsTotal = allLegalCases.reduce((s, c) => s + c.affectedParcels, 0);
    const avgPendingDays = Math.round(
      allLegalCases.reduce((s, c) => s + c.daysPending, 0) / (pending || 1),
    );

    return { total, pending, stayGranted, critical, affectedParcelsTotal, avgPendingDays };
  }, [allLegalCases]);

  const states = useMemo(() => [...new Set(visibleProjects.map((p) => p.state))].sort(), [visibleProjects]);
  const courts = useMemo(() => [...new Set(allLegalCases.map((c) => c.court))].sort(), [allLegalCases]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Legal Dispute & Revenue Litigation Tracking Center"
        description="Monitor active court challenges under RFCTLARR Section 64/69, title conflicts, stay orders, and dispute resolution velocity across districts."
      >
        <DemoTag />
      </PageHeader>

      {/* KPI METRICS */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Legal Cases" value={stats.total} icon={Gavel} hint="Recorded across corridors" />
        <StatCard
          label="Pending Hearings"
          value={stats.pending}
          icon={Clock}
          tone="high"
          hint="Active court disputes"
        />
        <StatCard
          label="Stay Orders Granted"
          value={stats.stayGranted}
          icon={ShieldAlert}
          tone="critical"
          hint="Physical work blocked"
        />
        <StatCard
          label="Critical Severity"
          value={stats.critical}
          icon={AlertTriangle}
          tone="critical"
          hint="High risk to milestone"
        />
        <StatCard
          label="Affected Land Parcels"
          value={stats.affectedParcelsTotal}
          icon={LandPlot}
          tone="medium"
          hint="Parcels tied in litigation"
        />
        <StatCard
          label="Avg Resolution Time"
          value={stats.avgPendingDays}
          suffix="d"
          icon={Calendar}
          hint="Court duration"
        />
      </div>

      {/* FILTER PANEL */}
      <Panel className="bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Filter State</label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="mt-1 block rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
              >
                <option value="">All States</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Filter Court</label>
              <select
                value={selectedCourt}
                onChange={(e) => setSelectedCourt(e.target.value)}
                className="mt-1 block rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
              >
                <option value="">All Judicial Fora</option>
                {courts.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">Severity</label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="mt-1 block rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground"
              >
                <option value="">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <span className="text-xs text-muted-foreground">
            Showing <strong>{filteredCases.length}</strong> active cases
          </span>
        </div>
      </Panel>

      {/* LEGAL CASES REGISTRY */}
      <Panel>
        <PanelTitle
          title="Litigation & Revenue Dispute Registry"
          subtitle="Real-time docket of disputes with estimated resolution impact on acquisition timeline"
          icon={Gavel}
        />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] tracking-wider text-muted-foreground uppercase">
                <th className="py-2.5 font-semibold">Case Number & Forum</th>
                <th className="py-2.5 font-semibold">Corridor & District</th>
                <th className="py-2.5 font-semibold">Petitioner vs Respondent</th>
                <th className="py-2.5 font-semibold">Dispute Subject</th>
                <th className="py-2.5 font-semibold">Severity</th>
                <th className="py-2.5 font-semibold">Status</th>
                <th className="py-2.5 font-semibold">Affected Parcels</th>
                <th className="py-2.5 font-semibold">Next Hearing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCases.slice(0, 35).map((c) => (
                <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 pr-2">
                    <span className="font-bold text-foreground block">{c.caseNumber}</span>
                    <span className="text-[10px] text-muted-foreground">{c.court}</span>
                  </td>
                  <td className="py-2.5 pr-2">
                    <span className="font-medium text-foreground block truncate max-w-44">{c.projectName}</span>
                    <span className="text-[10px] text-muted-foreground">{c.district}, {c.state}</span>
                  </td>
                  <td className="py-2.5 pr-2 text-muted-foreground max-w-48 truncate">
                    {c.petitioner}
                  </td>
                  <td className="py-2.5 pr-2 text-foreground max-w-56 truncate" title={c.subject}>
                    {c.subject}
                  </td>
                  <td className="py-2.5 pr-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        c.severity === "Critical"
                          ? "bg-risk-critical/15 text-risk-critical"
                          : c.severity === "High"
                            ? "bg-risk-high/15 text-risk-high"
                            : "bg-risk-medium/15 text-risk-medium"
                      }`}
                    >
                      {c.severity}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                        c.status === "Stay Granted"
                          ? "bg-risk-critical text-white font-bold"
                          : c.status === "Resolved"
                            ? "bg-risk-low/15 text-risk-low"
                            : "bg-surface border border-border text-foreground"
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums font-semibold text-foreground">
                    {c.affectedParcels} parcels
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums text-muted-foreground">
                    {c.hearingDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
