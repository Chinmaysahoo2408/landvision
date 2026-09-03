import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  Gavel,
  HandCoins,
  Hourglass,
  Layers,
  MapPin,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { DemoTag, PageHeader, Panel, PanelTitle, StatCard } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";

export const Route = createFileRoute("/app/bottlenecks")({
  component: BottlenecksPage,
  head: () => ({
    meta: [
      { title: "Administrative Bottleneck & File Movement Analysis — LandVision AI" },
      {
        name: "description",
        content:
          "End-to-end process flowchart analysis identifying slowest administrative stages, departmental approval delays, and file movement friction.",
      },
    ],
  }),
});

interface ProcessStage {
  name: string;
  department: string;
  avgDelayDays: number;
  slaDays: number;
  pendingFiles: number;
  bottleneckScore: number;
  status: "Normal" | "At Risk" | "Critical Bottleneck";
}

const PROCESS_STAGES: ProcessStage[] = [
  {
    name: "Application & Section 11 Notification",
    department: "Revenue & Disaster Management Dept",
    avgDelayDays: 24,
    slaDays: 30,
    pendingFiles: 142,
    bottleneckScore: 32,
    status: "Normal",
  },
  {
    name: "Cadastral Verification & Joint Survey",
    department: "Directorate of Land Records & Survey",
    avgDelayDays: 42,
    slaDays: 45,
    pendingFiles: 284,
    bottleneckScore: 48,
    status: "Normal",
  },
  {
    name: "District Valuation & Award Approval",
    department: "District Valuation Committee & CALA",
    avgDelayDays: 68,
    slaDays: 60,
    pendingFiles: 340,
    bottleneckScore: 68,
    status: "At Risk",
  },
  {
    name: "State Statutory & Environmental Clearance",
    department: "State Single Window Cell / Forest Dept",
    avgDelayDays: 112,
    slaDays: 60,
    pendingFiles: 198,
    bottleneckScore: 84,
    status: "Critical Bottleneck",
  },
  {
    name: "Dispute Mediation & Revenue Court Adjudication",
    department: "District Legal Services / Revenue Court",
    avgDelayDays: 144,
    slaDays: 60,
    pendingFiles: 215,
    bottleneckScore: 92,
    status: "Critical Bottleneck",
  },
  {
    name: "Compensation Disbursement & Award Transfer",
    department: "Land Acquisition Office & Bank Cell",
    avgDelayDays: 86,
    slaDays: 45,
    pendingFiles: 312,
    bottleneckScore: 74,
    status: "At Risk",
  },
  {
    name: "R&R Infrastructure & Colony Handover",
    department: "R&R Directorate & District Admin",
    avgDelayDays: 95,
    slaDays: 60,
    pendingFiles: 180,
    bottleneckScore: 78,
    status: "At Risk",
  },
  {
    name: "Demarcation & Physical Land Possession",
    department: "Special Land Acquisition Officer & Police",
    avgDelayDays: 64,
    slaDays: 45,
    pendingFiles: 124,
    bottleneckScore: 62,
    status: "At Risk",
  },
];

function BottlenecksPage() {
  const { visibleProjects, predictions } = useLV();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administrative Bottleneck & Departmental Delay Analysis"
        description="Process flow analysis tracing files from initial notification through district scrutiny, state single-window approvals, court mediation, and physical possession."
      >
        <DemoTag />
      </PageHeader>

      {/* OVERVIEW STATS */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <StatCard
          label="Slowest Process Stage"
          value={144}
          suffix=" days"
          icon={Hourglass}
          tone="critical"
          hint="Court dispute adjudication"
        />
        <StatCard
          label="Total Pending Files"
          value={1795}
          icon={FileText}
          tone="high"
          hint="Across all 8 departments"
        />
        <StatCard
          label="Statutory Clearance SLA"
          value={112}
          suffix=" days"
          icon={Clock}
          tone="critical"
          hint="Against 60-day target"
        />
        <StatCard
          label="Average Inter-Dept Delay"
          value={79}
          suffix=" days"
          icon={AlertTriangle}
          tone="medium"
          hint="File movement friction"
        />
      </div>

      {/* PROCESS VISUALIZATION FLOW */}
      <Panel>
        <PanelTitle
          title="End-to-End Land Acquisition File Movement Flowchart"
          subtitle="Identifies average processing delay, statutory SLA breach, and responsible government departments"
          icon={Hourglass}
          ai
        />

        <div className="mt-6 space-y-3">
          {PROCESS_STAGES.map((stage, idx) => {
            const isCritical = stage.status === "Critical Bottleneck";
            const isAtRisk = stage.status === "At Risk";

            return (
              <div key={stage.name} className="space-y-2">
                <div
                  className={`rounded-xl border p-4 transition-all ${
                    isCritical
                      ? "border-risk-critical bg-risk-critical/5 ring-1 ring-risk-critical/30"
                      : isAtRisk
                        ? "border-risk-high/50 bg-risk-high/5"
                        : "border-border bg-card"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                          isCritical
                            ? "bg-risk-critical text-white animate-pulse"
                            : isAtRisk
                              ? "bg-risk-high text-white"
                              : "bg-surface border border-border text-foreground"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-display text-sm font-bold text-foreground">{stage.name}</h4>
                        <p className="text-[11px] text-muted-foreground">Responsible Department: {stage.department}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          isCritical
                            ? "bg-risk-critical text-white"
                            : isAtRisk
                              ? "bg-risk-high/15 text-risk-high"
                              : "bg-risk-low/15 text-risk-low"
                        }`}
                      >
                        {stage.status}
                      </span>
                      <span className="rounded border border-border bg-surface px-2 py-0.5 text-xs font-bold text-foreground">
                        {stage.pendingFiles} files pending
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Average Processing Time</span>
                      <p className={`mt-0.5 font-bold ${stage.avgDelayDays > stage.slaDays ? "text-risk-high" : "text-foreground"}`}>
                        {stage.avgDelayDays} days
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Statutory SLA Target</span>
                      <p className="mt-0.5 font-medium text-foreground">{stage.slaDays} days</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">SLA Slippage</span>
                      <p className={`mt-0.5 font-bold ${stage.avgDelayDays > stage.slaDays ? "text-risk-critical" : "text-risk-low"}`}>
                        {stage.avgDelayDays > stage.slaDays ? `+${stage.avgDelayDays - stage.slaDays} days delayed` : "Within SLA"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase">Bottleneck Score</span>
                      <p className="mt-0.5 font-bold text-foreground">{stage.bottleneckScore}/100</p>
                    </div>
                  </div>
                </div>

                {idx < PROCESS_STAGES.length - 1 ? (
                  <div className="flex justify-center py-0.5">
                    <ArrowDown className="size-4 text-muted-foreground animate-bounce" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
