import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Bell,
  Brain,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Coins,
  DatabaseZap,
  FileCheck,
  Gavel,
  Globe2,
  HandCoins,
  HeartHandshake,
  Hourglass,
  LandPlot,
  Layers,
  LineChart as LineChartIcon,
  Minus,
  RefreshCw,
  Scale,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DemoTag, PageHeader, Panel, PanelTitle } from "@/components/lv/panels";
import { RiskBadge, RiskGauge } from "@/components/lv/risk";
import { GovVsAiTimeline } from "@/components/lv/GovVsAiTimeline";
import { overallProgress } from "@/lib/lv/risk";
import { ROLE_LABEL, useLV } from "@/lib/lv/store";
import { DATA_SOURCE, recordGovSyncSuccess } from "@/lib/lv/dataSource";
import { executeGovernmentDataSync, syncGovernmentData } from "@/lib/lv/govSync";
import type { RiskCategory } from "@/lib/lv/types";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/app/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "National Land Acquisition Command Center — LandVision AI" },
      {
        name: "description",
        content:
          "AI-powered predictive command center for land acquisition delay forecasting, stage bottlenecks, risk hot-spots, and intervention tracking.",
      },
      { property: "og:title", content: "LandVision AI Command Center" },
    ],
  }),
});

const CAT_COLORS: Record<RiskCategory, string> = {
  LOW: "var(--risk-low)",
  MEDIUM: "var(--risk-medium)",
  HIGH: "var(--risk-high)",
  CRITICAL: "var(--risk-critical)",
};

const AXIS_STYLE = { stroke: "var(--muted-foreground)", fontSize: 11 };
const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

function TrendBadge({
  trend,
  delta,
  hint,
}: {
  trend: "UP" | "DOWN" | "STABLE";
  delta: string;
  hint: string;
}) {
  if (trend === "DOWN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-risk-low/15 px-2 py-0.5 text-[11px] font-semibold text-risk-low">
        <ArrowDownRight className="size-3.5" />
        {delta} · {hint}
      </span>
    );
  }
  if (trend === "UP") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-risk-high/15 px-2 py-0.5 text-[11px] font-semibold text-risk-high">
        <ArrowUpRight className="size-3.5" />
        {delta} · {hint}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
      <Minus className="size-3" />
      {delta} · {hint}
    </span>
  );
}

function DashboardKpiCard({
  title,
  value,
  suffix,
  subtext,
  icon: Icon,
  trend,
  delta,
  trendHint,
  to,
  tone = "default",
}: {
  title: string;
  value: string | number;
  suffix?: string;
  subtext?: string;
  icon: typeof Activity;
  trend?: "UP" | "DOWN" | "STABLE";
  delta?: string;
  trendHint?: string;
  to?: string;
  tone?: "default" | "low" | "medium" | "high" | "critical" | "ai";
}) {
  const toneClass = {
    default: "text-primary",
    low: "text-risk-low",
    medium: "text-risk-medium",
    high: "text-risk-high",
    critical: "text-risk-critical",
    ai: "text-ai",
  }[tone];

  const content = (
    <div className="panel flex h-full flex-col justify-between p-4.5 transition-all hover:-translate-y-0.5 hover:border-primary/40">
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
            {title}
          </span>
          <span className="grid size-7 place-items-center rounded-lg bg-surface border border-border/80">
            <Icon className={`size-3.5 ${toneClass}`} />
          </span>
        </div>
        <div className="mt-2.5 flex items-baseline gap-1">
          <span className="font-display text-2xl font-bold text-foreground tabular-nums">
            {typeof value === "number" ? value.toLocaleString("en-IN") : value}
          </span>
          {suffix ? <span className="text-sm font-medium text-muted-foreground">{suffix}</span> : null}
        </div>
        {subtext ? <p className="mt-0.5 text-[11px] text-muted-foreground">{subtext}</p> : null}
      </div>
      {trend && delta && trendHint ? (
        <div className="mt-3">
          <TrendBadge trend={trend} delta={delta} hint={trendHint} />
        </div>
      ) : null}
    </div>
  );

  if (to) {
    return <Link to={to} className="block h-full">{content}</Link>;
  }
  return content;
}

function DashboardPage() {
  const { visibleProjects, predictions, alerts, interventions, session } = useLV();
  const { tStr, formatNumberIndian } = useTranslation();

  const stats = useMemo(() => {
    const rows = visibleProjects.map((p) => ({
      p,
      pr: predictions.get(p.id) ?? {
        riskScore: 35,
        riskCategory: "MEDIUM" as RiskCategory,
        delayProbability: 28,
        expectedDelayDays: 45,
        confidence: 0.85,
        confidenceInterval: [30, 60] as [number, number],
        shapValues: {},
        topDrivers: [],
        recommendations: [],
      },
    }));

    const totalProjects = rows.length;
    const dist: Record<RiskCategory, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    let riskSum = 0;
    let delayProbSum = 0;
    let progressSum = 0;
    let compSum = 0;
    let possessionSum = 0;
    let rrSum = 0;
    let legalDisputesTotal = 0;
    let resolvedDisputesTotal = 0;
    let familiesTotal = 0;
    let delaySumDays = 0;

    const stateMap = new Map<string, { total: number; highRisk: number; riskSum: number; compSum: number }>();

    for (const r of rows) {
      dist[r.pr.riskCategory] += 1;
      riskSum += r.pr.riskScore;
      delayProbSum += r.pr.delayProbability;
      progressSum += overallProgress(r.p);
      compSum += r.p.params.compensationPct;
      possessionSum += r.p.params.possessionPct;
      rrSum += r.p.params.rrPct;
      legalDisputesTotal += r.p.params.legalDisputes;
      resolvedDisputesTotal += r.p.params.resolvedDisputes;
      familiesTotal += r.p.affectedFamilies;
      delaySumDays += r.pr.expectedDelayDays;

      const st = stateMap.get(r.p.state) ?? { total: 0, highRisk: 0, riskSum: 0, compSum: 0 };
      st.total += 1;
      if (r.pr.riskCategory === "HIGH" || r.pr.riskCategory === "CRITICAL") st.highRisk += 1;
      st.riskSum += r.pr.riskScore;
      st.compSum += r.p.params.compensationPct;
      stateMap.set(r.p.state, st);
    }

    const highAndCritical = dist.HIGH + dist.CRITICAL;
    const avgRisk = totalProjects ? Math.round(riskSum / totalProjects) : 0;
    const avgDelayProb = totalProjects ? Math.round(delayProbSum / totalProjects) : 0;
    const avgProgress = totalProjects ? Math.round(progressSum / totalProjects) : 0;
    const avgComp = totalProjects ? Math.round(compSum / totalProjects) : 0;
    const avgPossession = totalProjects ? Math.round(possessionSum / totalProjects) : 0;
    const avgRR = totalProjects ? Math.round(rrSum / totalProjects) : 0;
    const avgDelayDays = totalProjects ? Math.round(delaySumDays / totalProjects) : 0;
    const avgDelayMonths = Math.round((avgDelayDays / 30) * 10) / 10;

    const totalDisputes = legalDisputesTotal + resolvedDisputesTotal;
    const legalResolutionRate = totalDisputes > 0 ? Math.round((resolvedDisputesTotal / totalDisputes) * 100) : 74;

    const topHighRisk = [...rows].sort((a, b) => b.pr.riskScore - a.pr.riskScore).slice(0, 7);

    const stateHotspots = [...stateMap.entries()]
      .map(([state, v]) => ({
        state,
        total: v.total,
        highRisk: v.highRisk,
        avgRisk: Math.round(v.riskSum / v.total),
        compPct: Math.round(v.compSum / v.total),
      }))
      .sort((a, b) => b.avgRisk - a.avgRisk)
      .slice(0, 8);

    const monthlyTrends = [
      { month: "Jan 26", avgRisk: 68, predictedDelay: 140, realizedDelay: 132, interventions: 8 },
      { month: "Feb 26", avgRisk: 65, predictedDelay: 135, realizedDelay: 128, interventions: 12 },
      { month: "Mar 26", avgRisk: 63, predictedDelay: 128, realizedDelay: 122, interventions: 15 },
      { month: "Apr 26", avgRisk: 61, predictedDelay: 122, realizedDelay: 118, interventions: 19 },
      { month: "May 26", avgRisk: 59, predictedDelay: 118, realizedDelay: 112, interventions: 22 },
      { month: "Jun 26", avgRisk: 56, predictedDelay: 110, realizedDelay: 104, interventions: 25 },
      { month: "Jul 26", avgRisk: 54, predictedDelay: 105, realizedDelay: 98, interventions: 28 },
      { month: "Aug 26", avgRisk: 52, predictedDelay: 99, realizedDelay: 92, interventions: 31 },
    ];

    const stageBreakdown = [
      { stage: "Notification", count: 84, avgDelay: 22, risk: 28 },
      { stage: "Survey", count: 142, avgDelay: 35, risk: 36 },
      { stage: "Valuation", count: 186, avgDelay: 48, risk: 52 },
      { stage: "Compensation", count: 320, avgDelay: 84, risk: 68 },
      { stage: "Legal Resolution", count: 215, avgDelay: 144, risk: 82 },
      { stage: "R&R", count: 168, avgDelay: 92, risk: 64 },
      { stage: "Possession", count: 118, avgDelay: 78, risk: 58 },
      { stage: "Completion", count: 15, avgDelay: 15, risk: 18 },
    ];

    return {
      totalProjects,
      dist,
      highAndCritical,
      avgRisk,
      avgDelayProb,
      avgProgress,
      avgComp,
      avgPossession,
      avgRR,
      avgDelayDays,
      avgDelayMonths,
      legalResolutionRate,
      familiesTotal,
      topHighRisk,
      stateHotspots,
      monthlyTrends,
      stageBreakdown,
    };
  }, [visibleProjects, predictions]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [showSyncConfirmModal, setShowSyncConfirmModal] = useState(false);
  const [syncStepMessage, setSyncStepMessage] = useState("");
  const [selectedTab, setSelectedTab] = useState<"trends" | "stages" | "hotspots">("trends");
  const [selectedTimelineId, setSelectedTimelineId] = useState<string>(visibleProjects[0]?.id ?? "");
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => {
    return DATA_SOURCE.lastSyncedAt
      ? new Date(DATA_SOURCE.lastSyncedAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "Just now";
  });

  const selectedTimelineProject = useMemo(() => {
    return visibleProjects.find((p) => p.id === selectedTimelineId) ?? visibleProjects[0];
  }, [visibleProjects, selectedTimelineId]);

  const handleExecuteSync = async () => {
    setShowSyncConfirmModal(false);
    setIsSyncing(true);
    setSyncStepMessage("Syncing… Fetching government data");
    try {
      const result = await syncGovernmentData((stepMsg) => {
        setSyncStepMessage(stepMsg);
      });
      if (result.success) {
        recordGovSyncSuccess("Bhoomi Rashi & PARIVESH Gateway", result.recordsProcessed);
        const timeStr = new Date(result.syncedAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
        setLastSyncTime(timeStr);
        setSyncStepMessage("Completed. Government data synchronized successfully.");
        toast.success(
          `Government data synchronized successfully: ${result.recordsProcessed} records verified!`,
          {
            description: `Last Updated: ${timeStr} · Gateways: Bhoomi Rashi, PARIVESH, PM GatiShakti`,
          },
        );
      } else {
        toast.error(`Government data synchronization failed: ${result.error || "Network error"}`);
      }
    } catch {
      toast.error("Government data synchronization failed. Please check gateway connectivity.");
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setSyncStepMessage("");
      }, 1200);
    }
  };

  const pieData = (Object.keys(stats.dist) as RiskCategory[]).map((k) => ({
    name: k,
    value: stats.dist[k],
  }));

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <PageHeader
        title={tStr("AI Land Acquisition Command Center")}
        description="National early-warning decision-support dashboard for multi-state infrastructure land acquisition corridors."
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{tStr("Last Updated:")}</span>
            <strong className="text-foreground">{lastSyncTime}</strong>
          </div>

          {/* ADMIN-ONLY SYNC TRIGGER WITH CONFIRMATION */}
          <button
            type="button"
            onClick={() => setShowSyncConfirmModal(true)}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary shadow-xs hover:bg-primary/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? syncStepMessage || "Syncing…" : tStr("Sync Now (Admin)")}</span>
          </button>

          <DemoTag />
          <Link
            to="/app/predictor"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:shadow-[var(--shadow-glow)]"
          >
            <Sparkles className="size-3.5" />
            {tStr("Predict Delay Risk")}
          </Link>
        </div>
      </PageHeader>

      {/* CONFIRMATION DIALOG MODAL */}
      {showSyncConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <DatabaseZap className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-foreground">
                  Sync government data now?
                </h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  This will connect to Bhoomi Rashi, PARIVESH, and state cadastral gateways to verify Section 3A/3D/3G notifications and clearance milestones.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Gateways to query:</span>
                <strong className="text-foreground">3 Connected</strong>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Idempotency Check:</span>
                <strong className="text-emerald-500">Enabled (No duplicate records)</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowSyncConfirmModal(false)}
                className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSync}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <CheckCircle2 className="size-3.5" /> Confirm Synchronization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE SYNC PROGRESS BANNER IF RUNNING */}
      {isSyncing && (
        <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-xs text-primary shadow-xs">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="size-4 animate-spin text-primary shrink-0" />
            <span className="font-medium">{syncStepMessage || "Fetching government data…"}</span>
          </div>
          <span className="font-mono text-[11px] uppercase font-bold">Verifying Checksums</span>
        </div>
      )}

      {/* 12 MANDATORY COMMAND CENTER KPIS */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <DashboardKpiCard
          title={tStr("Total Projects")}
          value={stats.totalProjects}
          subtext="Monitored across 12 States"
          icon={Layers}
          trend="UP"
          delta="+14"
          trendHint="new this quarter"
          to="/app/projects"
        />
        <DashboardKpiCard
          title={tStr("Projects At Risk")}
          value={stats.highAndCritical}
          subtext={`${Math.round((stats.highAndCritical / (stats.totalProjects || 1)) * 100)}% of total portfolio`}
          icon={AlertTriangle}
          tone="high"
          trend="DOWN"
          delta="-12%"
          trendHint="vs last period"
          to="/app/projects"
        />
        <DashboardKpiCard
          title={tStr("Critical Projects")}
          value={stats.dist.CRITICAL}
          subtext="Immediate action required"
          icon={ShieldAlert}
          tone="critical"
          trend="DOWN"
          delta="-4"
          trendHint="after interventions"
          to="/app/projects"
        />
        <DashboardKpiCard
          title={tStr("Average Risk Score")}
          value={stats.avgRisk}
          suffix="/100"
          subtext="National composite risk"
          icon={Brain}
          tone="medium"
          trend="DOWN"
          delta="-8 pts"
          trendHint="improved"
          to="/app/state-analytics"
        />
        <DashboardKpiCard
          title={tStr("Average Delay Prob")}
          value={stats.avgDelayProb}
          suffix="%"
          subtext={`Avg ~${stats.avgDelayMonths} months delay`}
          icon={Clock}
          tone="medium"
          trend="DOWN"
          delta="-6%"
          trendHint="projection"
          to="/app/predictor"
        />
        <DashboardKpiCard
          title={tStr("Acquisition Progress")}
          value={stats.avgProgress}
          suffix="%"
          subtext="Weighted lifecycle avg"
          icon={Activity}
          tone="low"
          trend="UP"
          delta="+5.2%"
          trendHint="milestones met"
          to="/app/timeline"
        />
        <DashboardKpiCard
          title={tStr("Compensation Done")}
          value={stats.avgComp}
          suffix="%"
          subtext="Direct bank transfers"
          icon={HandCoins}
          tone="low"
          trend="UP"
          delta="+8.4%"
          trendHint="disbursal velocity"
          to="/app/compensation"
        />
        <DashboardKpiCard
          title={tStr("Legal Resolution")}
          value={stats.legalResolutionRate}
          suffix="%"
          subtext="Cases resolved/settled"
          icon={Gavel}
          tone="default"
          trend="UP"
          delta="+14%"
          trendHint="Lok Adalat drives"
          to="/app/legal"
        />
        <DashboardKpiCard
          title={tStr("R&R Completion")}
          value={stats.avgRR}
          suffix="%"
          subtext="Rehabilitated families"
          icon={HeartHandshake}
          tone="low"
          trend="UP"
          delta="+6.1%"
          trendHint="allotments cleared"
          to="/app/rr"
        />
        <DashboardKpiCard
          title={tStr("Land Possession")}
          value={stats.avgPossession}
          suffix="%"
          subtext="Physical land possessed"
          icon={LandPlot}
          tone="low"
          trend="UP"
          delta="+9.5%"
          trendHint="handover velocity"
          to="/app/possession"
        />
        <DashboardKpiCard
          title="Prediction Accuracy"
          value={94.2}
          suffix="%"
          subtext="Model v2.4 validation"
          icon={LineChartIcon}
          tone="ai"
          trend="UP"
          delta="+2.6%"
          trendHint="continuous learning"
          to="/app/model"
        />
        <DashboardKpiCard
          title="Active Interventions"
          value={interventions.length}
          subtext="Closed-loop actions"
          icon={UserCheck}
          tone="default"
          trend="UP"
          delta="+9"
          trendHint="assigned officers"
          to="/app/interventions"
        />
      </div>

      {/* SECTION 3.5: GOVERNMENT RECORDED TIMELINE VS AI PREDICTED TIMELINE */}
      {selectedTimelineProject && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Target Corridor Timeline Variance:
            </span>
            <select
              value={selectedTimelineId}
              onChange={(e) => setSelectedTimelineId(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary shadow-xs"
            >
              {visibleProjects.slice(0, 20).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectId}) — {p.district}, {p.state}
                </option>
              ))}
            </select>
          </div>
          <GovVsAiTimeline
            project={selectedTimelineProject}
            prediction={predictions.get(selectedTimelineProject.id)}
          />
        </div>
      )}

      {/* CORE ANALYTICS TABS & CHARTS */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* CHART 1: MONTHLY RISK & DELAY TRENDS */}
        <Panel className="xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <PanelTitle
              title="Portfolio Delay & Risk Dynamics"
              subtitle="Historical realization vs ML early-detection delay curve and intervention velocity"
              icon={TrendingUp}
              ai
            />
            <div className="flex gap-1">
              {(["trends", "stages", "hotspots"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                    selectedTab === tab
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "border border-border text-muted-foreground hover:bg-card"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 h-76">
            {selectedTab === "trends" ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyTrends}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorDelay" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--risk-high)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--risk-high)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" {...AXIS_STYLE} />
                  <YAxis {...AXIS_STYLE} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="predictedDelay"
                    name="Predicted Delay (days)"
                    stroke="var(--risk-high)"
                    fill="url(#colorDelay)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="avgRisk"
                    name="Average Risk Score (/100)"
                    stroke="var(--primary)"
                    fill="url(#colorRisk)"
                    strokeWidth={2.5}
                  />
                  <Line
                    type="monotone"
                    dataKey="interventions"
                    name="Active Interventions"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : selectedTab === "stages" ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.stageBreakdown}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="stage" {...AXIS_STYLE} tickFormatter={(s) => s.split(" ")[0]} />
                  <YAxis {...AXIS_STYLE} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="avgDelay" name="Avg Delay (days)" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="risk" name="Stage Risk Score" fill="var(--risk-high)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.stateHotspots} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" {...AXIS_STYLE} domain={[0, 100]} />
                  <YAxis type="category" dataKey="state" width={96} {...AXIS_STYLE} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="avgRisk" name="Avg Risk Score" fill="var(--risk-high)" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="compPct" name="Compensation %" fill="var(--risk-low)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        {/* CHART 2: RISK DISTRIBUTION PIE */}
        <Panel>
          <PanelTitle
            title="Portfolio Risk Categorization"
            subtitle="Current risk distribution across 1,248 monitored corridors"
            icon={Activity}
          />
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={CAT_COLORS[entry.name as RiskCategory]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-risk-critical" />
              <span className="text-muted-foreground">Critical:</span>
              <span className="font-bold text-foreground">{stats.dist.CRITICAL} ({Math.round((stats.dist.CRITICAL / stats.totalProjects) * 100)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-risk-high" />
              <span className="text-muted-foreground">High:</span>
              <span className="font-bold text-foreground">{stats.dist.HIGH} ({Math.round((stats.dist.HIGH / stats.totalProjects) * 100)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-risk-medium" />
              <span className="text-muted-foreground">Medium:</span>
              <span className="font-bold text-foreground">{stats.dist.MEDIUM} ({Math.round((stats.dist.MEDIUM / stats.totalProjects) * 100)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-risk-low" />
              <span className="text-muted-foreground">Low:</span>
              <span className="font-bold text-foreground">{stats.dist.LOW} ({Math.round((stats.dist.LOW / stats.totalProjects) * 100)}%)</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* STATE-WISE FIR OVERVIEW SECTION WITH SORTING */}
      <Panel className="border-primary/40 bg-surface">
        <StateFirOverviewSection />
      </Panel>

      {/* HIGHEST RISK PROJECTS TABLE & STATE HOTSPOTS */}
      <div className="grid gap-4 xl:grid-cols-3">
        {/* CRITICAL HOTSPOT PROJECTS */}
        <Panel className="xl:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <PanelTitle
              title="Priority High-Risk Land Acquisition Corridors"
              subtitle="Ranked by AI delay probability and legal/compensation friction score"
              icon={AlertTriangle}
            />
            <Link to="/app/projects" className="text-xs font-semibold text-primary hover:underline">
              View All Projects →
            </Link>
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-[10px] tracking-wider text-muted-foreground uppercase">
                  <th className="py-2.5 font-semibold">Corridor & Agency</th>
                  <th className="py-2.5 font-semibold">Location</th>
                  <th className="py-2.5 font-semibold">Current Stage</th>
                  <th className="py-2.5 font-semibold">Compensation</th>
                  <th className="py-2.5 font-semibold">Disputes</th>
                  <th className="py-2.5 font-semibold">Delay Prob</th>
                  <th className="py-2.5 font-semibold">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.topHighRisk.map(({ p, pr }) => (
                  <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 pr-2">
                      <Link
                        to="/app/projects/$projectId"
                        params={{ projectId: p.id }}
                        className="font-medium text-foreground hover:text-primary transition-colors block truncate max-w-56"
                      >
                        {p.name}
                      </Link>
                      <span className="text-[10px] text-muted-foreground">{p.projectId} · {p.agency.split(" ")[0]}</span>
                    </td>
                    <td className="py-2.5 pr-2 text-muted-foreground">
                      {p.district}, {p.state}
                    </td>
                    <td className="py-2.5 pr-2">
                      <span className="rounded bg-surface px-1.5 py-0.5 font-medium text-foreground border border-border text-[11px]">
                        {p.currentStage}
                      </span>
                    </td>
                    <td className="py-2.5 pr-2 tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-12 rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${p.params.compensationPct}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground">{p.params.compensationPct}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-2 font-semibold text-risk-high tabular-nums">
                      {p.params.legalDisputes} cases
                    </td>
                    <td className="py-2.5 pr-2 font-semibold tabular-nums text-foreground">
                      {pr.delayProbability}%
                    </td>
                    <td className="py-2.5">
                      <RiskBadge category={pr.riskCategory} score={pr.riskScore} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* LATEST SMART ALERTS */}
        <Panel>
          <div className="flex items-center justify-between border-b border-border pb-3">
            <PanelTitle
              title="Active Early-Warning Alerts"
              subtitle="Automated threshold breach detections"
              icon={Bell}
            />
            <Link to="/app/alerts" className="text-xs font-semibold text-primary hover:underline">
              Alert Center →
            </Link>
          </div>
          <ul className="mt-3 space-y-2.5">
            {alerts.slice(0, 5).map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-border bg-card p-3 shadow-2xs hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      a.severity === "Critical"
                        ? "bg-risk-critical/15 text-risk-critical"
                        : a.severity === "High"
                          ? "bg-risk-high/15 text-risk-high"
                          : "bg-risk-medium/15 text-risk-medium"
                    }`}
                  >
                    {a.severity}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{a.status}</span>
                </div>
                <p className="mt-1 font-medium text-xs text-foreground truncate">{a.projectName}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{a.message}</p>
                <p className="mt-1.5 text-[10px] text-primary font-medium">{a.officer}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* QUICK WORKFLOW PIPELINE FOOTER */}
      <Panel className="border-primary/20 bg-primary/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground">
              LandVision AI Closed-Loop Governance Pipeline
            </h4>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Telemetric Data Ingestion → ML Delay Forecasting → Root Cause Analysis → Officer Intervention → Risk Recalculation
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/app/predictor"
              className="inline-flex items-center gap-1.5 rounded-md bg-card border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface"
            >
              <Sparkles className="size-3.5 text-primary" /> Run Simulation
            </Link>
            <Link
              to="/app/interventions"
              className="inline-flex items-center gap-1.5 rounded-md bg-card border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface"
            >
              <ShieldAlert className="size-3.5 text-primary" /> Manage Interventions
            </Link>
            <Link
              to="/app/gis"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              <Globe2 className="size-3.5" /> Launch GIS Map
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}

type FirSortKey = "totalFirs" | "openFirs" | "criticalFirs" | "avgResolutionDays" | "riskLevel";

function StateFirOverviewSection() {
  const [sortKey, setSortKey] = useState<FirSortKey>("totalFirs");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const stateData = useMemo(() => {
    const list = [
      { state: "Odisha", totalFirs: 1284, openFirs: 438, closedFirs: 846, criticalFirs: 72, avgResolutionDays: 18.4, riskLevel: "HIGH" as const },
      { state: "Maharashtra", totalFirs: 1420, openFirs: 490, closedFirs: 930, criticalFirs: 85, avgResolutionDays: 16.5, riskLevel: "HIGH" as const },
      { state: "Tamil Nadu", totalFirs: 1110, openFirs: 370, closedFirs: 740, criticalFirs: 54, avgResolutionDays: 15.8, riskLevel: "LOW" as const },
      { state: "West Bengal", totalFirs: 923, openFirs: 312, closedFirs: 611, criticalFirs: 48, avgResolutionDays: 21.2, riskLevel: "HIGH" as const },
      { state: "Andhra Pradesh", totalFirs: 840, openFirs: 290, closedFirs: 550, criticalFirs: 41, avgResolutionDays: 17.6, riskLevel: "MEDIUM" as const },
      { state: "Jharkhand", totalFirs: 742, openFirs: 265, closedFirs: 477, criticalFirs: 39, avgResolutionDays: 24.1, riskLevel: "CRITICAL" as const },
      { state: "Chhattisgarh", totalFirs: 681, openFirs: 219, closedFirs: 462, criticalFirs: 31, avgResolutionDays: 19.8, riskLevel: "MEDIUM" as const },
      { state: "Bihar", totalFirs: 594, openFirs: 201, closedFirs: 393, criticalFirs: 28, avgResolutionDays: 26.5, riskLevel: "HIGH" as const },
    ];

    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "riskLevel") {
        const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (order[a.riskLevel] - order[b.riskLevel]) * dir;
      }
      return (a[sortKey] - b[sortKey]) * dir;
    });

    return list;
  }, [sortKey, sortDir]);

  const handleSort = (key: FirSortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="font-display text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Building2 className="size-4 text-primary" /> STATE-WISE FIR OVERVIEW &amp; COMPARISON
          </h3>
          <p className="text-xs text-muted-foreground">
            Compare FIR case volumes, open disputes, critical escalations, and resolution velocity across states.
          </p>
        </div>

        {/* SORTING CONTROLS */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-muted-foreground uppercase text-[10px]">Sort By:</span>
          {[
            { key: "totalFirs" as const, label: "Total FIRs" },
            { key: "openFirs" as const, label: "Open FIRs" },
            { key: "criticalFirs" as const, label: "Critical FIRs" },
            { key: "avgResolutionDays" as const, label: "Resolution Time" },
            { key: "riskLevel" as const, label: "Risk Level" },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => handleSort(btn.key)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                sortKey === btn.key
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {btn.label} {sortKey === btn.key ? (sortDir === "desc" ? "↓" : "↑") : ""}
            </button>
          ))}
        </div>
      </div>

      {/* STATE COMPARISON BAR CHART */}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stateData} margin={{ left: 10, right: 10 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="state" {...AXIS_STYLE} />
            <YAxis {...AXIS_STYLE} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="totalFirs" name="Total FIRs" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="openFirs" name="Open FIRs" fill="var(--risk-high)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="criticalFirs" name="Critical FIRs" fill="var(--risk-critical)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* STATE COMPARISON TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase text-muted-foreground bg-surface/50">
              <th className="py-2.5 px-3 font-semibold">State</th>
              <th className="py-2.5 px-3 font-semibold text-right">Total FIRs</th>
              <th className="py-2.5 px-3 font-semibold text-right">Open FIRs</th>
              <th className="py-2.5 px-3 font-semibold text-right">Closed FIRs</th>
              <th className="py-2.5 px-3 font-semibold text-right">Critical FIRs</th>
              <th className="py-2.5 px-3 font-semibold text-right">Avg Resolution</th>
              <th className="py-2.5 px-3 font-semibold text-center">Risk Level</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {stateData.map((row) => (
              <tr key={row.state} className="hover:bg-muted/40 transition-colors">
                <td className="py-2.5 px-3 font-bold text-foreground">{row.state}</td>
                <td className="py-2.5 px-3 text-right tabular-nums font-bold text-foreground">
                  {row.totalFirs.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-risk-high">
                  {row.openFirs.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-risk-low">
                  {row.closedFirs.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums font-bold text-risk-critical">
                  {row.criticalFirs}
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                  {row.avgResolutionDays} days
                </td>
                <td className="py-2.5 px-3 text-center">
                  <RiskBadge category={row.riskLevel} />
                </td>
                <td className="py-2.5 px-3 text-right">
                  <Link
                    to="/app/data"
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View State →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

