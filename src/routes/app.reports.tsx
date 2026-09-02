import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Banknote,
  Building2,
  Download,
  Eye,
  FileBarChart,
  FileText,
  Gavel,
  HeartHandshake,
  MapPinned,
  TimerReset,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  DemoTag,
  EmptyState,
  Panel,
  PanelTitle,
  PageHeader,
} from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";
import { overallProgress } from "@/lib/lv/risk";
import type { Prediction, Project, RiskCategory } from "@/lib/lv/types";

export const Route = createFileRoute("/app/reports")({
  head: () => ({
    meta: [
      { title: "Reports — LandVision AI" },
      {
        name: "description",
        content:
          "Generate, preview and export land acquisition risk, delay, compensation, R&R and legal dispute reports.",
      },
      { property: "og:title", content: "Reports — LandVision AI" },
      {
        property: "og:description",
        content: "Preview and export land acquisition governance reports.",
      },
    ],
  }),
  component: ReportsPage,
});

const CAT_COLORS: Record<RiskCategory, string> = {
  LOW: "var(--risk-low)",
  MEDIUM: "var(--risk-medium)",
  HIGH: "var(--risk-high)",
  CRITICAL: "var(--risk-critical)",
};

const AXIS = { stroke: "var(--muted-foreground)", fontSize: 11 } as const;
const TOOLTIP = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
} as const;

type Row = { p: Project; pr: Prediction };

interface ReportColumn {
  key: string;
  label: string;
}

interface ReportView {
  columns: ReportColumn[];
  rows: Record<string, string | number>[];
  chart: {
    kind: "bar" | "pie";
    data: { name: string; value: number }[];
    color?: string;
  };
  summary: string;
}

interface ReportDef {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  build: (rows: Row[]) => ReportView;
}

const round = (n: number) => Math.round(n);

function groupAverage(
  rows: Row[],
  keyFor: (r: Row) => string,
  valueFor: (r: Row) => number,
) {
  const map = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const k = keyFor(r);
    const cur = map.get(k) ?? { sum: 0, n: 0 };
    map.set(k, { sum: cur.sum + valueFor(r), n: cur.n + 1 });
  }
  return map;
}

const REPORTS: ReportDef[] = [
  {
    id: "project-risk",
    title: "Project Risk Report",
    description:
      "Predicted risk score and category for every project matching the current filters.",
    icon: FileBarChart,
    build: (rows) => {
      const dist: Record<RiskCategory, number> = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0,
      };
      for (const r of rows) dist[r.pr.riskCategory] += 1;
      return {
        columns: [
          { key: "projectId", label: "Project ID" },
          { key: "name", label: "Project" },
          { key: "district", label: "District" },
          { key: "state", label: "State" },
          { key: "riskScore", label: "Risk score" },
          { key: "riskCategory", label: "Category" },
        ],
        rows: rows.map((r) => ({
          projectId: r.p.projectId,
          name: r.p.name,
          district: r.p.district,
          state: r.p.state,
          riskScore: r.pr.riskScore,
          riskCategory: r.pr.riskCategory,
        })),
        chart: {
          kind: "pie",
          data: (Object.keys(dist) as RiskCategory[]).map((k) => ({
            name: k,
            value: dist[k],
          })),
        },
        summary: `${rows.length} projects · ${dist.HIGH + dist.CRITICAL} at high or critical risk.`,
      };
    },
  },
  {
    id: "delay-prediction",
    title: "Delay Prediction Report",
    description:
      "Expected delay in days and delay probability from the prediction engine.",
    icon: TimerReset,
    build: (rows) => {
      const top = [...rows]
        .sort((a, b) => b.pr.expectedDelayDays - a.pr.expectedDelayDays)
        .slice(0, 12);
      const avg = rows.length
        ? round(
            rows.reduce((s, r) => s + r.pr.expectedDelayDays, 0) / rows.length,
          )
        : 0;
      return {
        columns: [
          { key: "projectId", label: "Project ID" },
          { key: "name", label: "Project" },
          { key: "stage", label: "Current stage" },
          { key: "delayDays", label: "Expected delay (days)" },
          { key: "delayProbability", label: "Delay probability (%)" },
        ],
        rows: rows.map((r) => ({
          projectId: r.p.projectId,
          name: r.p.name,
          stage: r.p.currentStage,
          delayDays: r.pr.expectedDelayDays,
          delayProbability: r.pr.delayProbability,
        })),
        chart: {
          kind: "bar",
          color: "var(--chart-1)",
          data: top.map((r) => ({
            name: r.p.projectId,
            value: r.pr.expectedDelayDays,
          })),
        },
        summary: `Average predicted delay ${avg} days across ${rows.length} projects.`,
      };
    },
  },
  {
    id: "district-wise",
    title: "District-wise Report",
    description:
      "Aggregated project count, average risk and average progress by district.",
    icon: MapPinned,
    build: (rows) => {
      const risk = groupAverage(
        rows,
        (r) => r.p.district,
        (r) => r.pr.riskScore,
      );
      const prog = groupAverage(
        rows,
        (r) => r.p.district,
        (r) => overallProgress(r.p),
      );
      const districts = [...risk.entries()]
        .map(([district, v]) => ({
          district,
          projects: v.n,
          avgRisk: round(v.sum / v.n),
          avgProgress: round(
            (prog.get(district)?.sum ?? 0) / (prog.get(district)?.n ?? 1),
          ),
        }))
        .sort((a, b) => b.avgRisk - a.avgRisk);
      return {
        columns: [
          { key: "district", label: "District" },
          { key: "projects", label: "Projects" },
          { key: "avgRisk", label: "Avg risk score" },
          { key: "avgProgress", label: "Avg progress (%)" },
        ],
        rows: districts.map((d) => ({ ...d })),
        chart: {
          kind: "bar",
          color: "var(--chart-2)",
          data: districts
            .slice(0, 12)
            .map((d) => ({ name: d.district, value: d.avgRisk })),
        },
        summary: `${districts.length} districts covered by the current filter set.`,
      };
    },
  },
  {
    id: "acquisition-progress",
    title: "Acquisition Progress Report",
    description:
      "Overall acquisition progress and current stage for each project.",
    icon: TrendingUp,
    build: (rows) => {
      const buckets = [
        { name: "0–25%", value: 0 },
        { name: "26–50%", value: 0 },
        { name: "51–75%", value: 0 },
        { name: "76–100%", value: 0 },
      ];
      for (const r of rows) {
        const pct = overallProgress(r.p);
        const idx = pct <= 25 ? 0 : pct <= 50 ? 1 : pct <= 75 ? 2 : 3;
        const b = buckets[idx];
        if (b) b.value += 1;
      }
      return {
        columns: [
          { key: "projectId", label: "Project ID" },
          { key: "name", label: "Project" },
          { key: "stage", label: "Current stage" },
          { key: "progress", label: "Progress (%)" },
          { key: "status", label: "Status" },
        ],
        rows: rows.map((r) => ({
          projectId: r.p.projectId,
          name: r.p.name,
          stage: r.p.currentStage,
          progress: overallProgress(r.p),
          status: r.p.status,
        })),
        chart: { kind: "bar", color: "var(--chart-1)", data: buckets },
        summary: `Progress distribution across ${rows.length} projects.`,
      };
    },
  },
  {
    id: "compensation",
    title: "Compensation Report",
    description:
      "Compensation disbursement progress against affected families.",
    icon: Banknote,
    build: (rows) => {
      const byState = groupAverage(
        rows,
        (r) => r.p.state,
        (r) => r.p.params.compensationPct,
      );
      const states = [...byState.entries()]
        .map(([state, v]) => ({ state, avg: round(v.sum / v.n) }))
        .sort((a, b) => a.avg - b.avg);
      return {
        columns: [
          { key: "projectId", label: "Project ID" },
          { key: "name", label: "Project" },
          { key: "families", label: "Affected families" },
          { key: "compensationPct", label: "Compensation disbursed (%)" },
        ],
        rows: rows.map((r) => ({
          projectId: r.p.projectId,
          name: r.p.name,
          families: r.p.affectedFamilies,
          compensationPct: r.p.params.compensationPct,
        })),
        chart: {
          kind: "bar",
          color: "var(--chart-4)",
          data: states
            .slice(0, 12)
            .map((s) => ({ name: s.state, value: s.avg })),
        },
        summary: `Lowest average disbursal: ${states[0]?.state ?? "—"} (${states[0]?.avg ?? 0}%).`,
      };
    },
  },
  {
    id: "rr",
    title: "R&R Report",
    description:
      "Rehabilitation & resettlement completion progress by project.",
    icon: HeartHandshake,
    build: (rows) => {
      const byState = groupAverage(
        rows,
        (r) => r.p.state,
        (r) => r.p.params.rrPct,
      );
      const states = [...byState.entries()]
        .map(([state, v]) => ({ state, avg: round(v.sum / v.n) }))
        .sort((a, b) => a.avg - b.avg);
      return {
        columns: [
          { key: "projectId", label: "Project ID" },
          { key: "name", label: "Project" },
          { key: "families", label: "Affected families" },
          { key: "rrPct", label: "R&R completed (%)" },
        ],
        rows: rows.map((r) => ({
          projectId: r.p.projectId,
          name: r.p.name,
          families: r.p.affectedFamilies,
          rrPct: r.p.params.rrPct,
        })),
        chart: {
          kind: "bar",
          color: "var(--chart-5)",
          data: states
            .slice(0, 12)
            .map((s) => ({ name: s.state, value: s.avg })),
        },
        summary: `Average R&R completion is lowest in ${states[0]?.state ?? "—"}.`,
      };
    },
  },
  {
    id: "legal-dispute",
    title: "Legal Dispute Report",
    description:
      "Open legal disputes, resolved cases and ownership conflicts per project.",
    icon: Gavel,
    build: (rows) => {
      const withDisputes = [...rows]
        .filter((r) => r.p.params.legalDisputes > 0)
        .sort((a, b) => b.p.params.legalDisputes - a.p.params.legalDisputes);
      return {
        columns: [
          { key: "projectId", label: "Project ID" },
          { key: "name", label: "Project" },
          { key: "district", label: "District" },
          { key: "legalDisputes", label: "Open disputes" },
          { key: "resolvedDisputes", label: "Resolved" },
          { key: "ownershipConflicts", label: "Ownership conflicts" },
        ],
        rows: withDisputes.map((r) => ({
          projectId: r.p.projectId,
          name: r.p.name,
          district: r.p.district,
          legalDisputes: r.p.params.legalDisputes,
          resolvedDisputes: r.p.params.resolvedDisputes,
          ownershipConflicts: r.p.params.ownershipConflicts,
        })),
        chart: {
          kind: "bar",
          color: "var(--risk-high)",
          data: withDisputes.slice(0, 12).map((r) => ({
            name: r.p.projectId,
            value: r.p.params.legalDisputes,
          })),
        },
        summary: `${withDisputes.length} projects have at least one open legal dispute.`,
      };
    },
  },
];

function toCsv(view: ReportView): string {
  const header = view.columns.map((c) => c.label).join(",");
  const body = view.rows.map((row) =>
    view.columns
      .map((c) => {
        const raw = row[c.key];
        const cell = raw === undefined || raw === null ? "" : String(raw);
        return /[",\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
      })
      .join(","),
  );
  return [header, ...body].join("\n");
}

function ReportsPage() {
  const { visibleProjects, predictions } = useLV();
  const [district, setDistrict] = useState("");
  const [risk, setRisk] = useState("");
  const [range, setRange] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string>(
    REPORTS[0]?.id ?? "project-risk",
  );

  const districts = useMemo(
    () => [...new Set(visibleProjects.map((p) => p.district))].sort(),
    [visibleProjects],
  );

  const rows = useMemo<Row[]>(() => {
    const q = query.toLowerCase().trim();
    const now = Date.now();
    const maxAgeDays = range === "all" ? Infinity : Number(range);
    return visibleProjects
      .map((p) => ({ p, pr: predictions.get(p.id) }))
      .filter((r): r is Row => Boolean(r.pr))
      .filter((r) => (district ? r.p.district === district : true))
      .filter((r) => (risk ? r.pr.riskCategory === risk : true))
      .filter((r) =>
        q
          ? r.p.name.toLowerCase().includes(q) ||
            r.p.projectId.toLowerCase().includes(q)
          : true,
      )
      .filter((r) => {
        if (maxAgeDays === Infinity) return true;
        const ageDays = (now - new Date(r.p.createdAt).getTime()) / 86400000;
        return ageDays <= maxAgeDays;
      });
  }, [visibleProjects, predictions, district, risk, range, query]);

  const openReport = REPORTS.find((r) => r.id === openId) ?? REPORTS[0];
  const view = useMemo(
    () => (openReport ? openReport.build(rows) : null),
    [openReport, rows],
  );

  const exportReport = (def: ReportDef) => {
    const built = def.build(rows);
    if (built.rows.length === 0) {
      toast.error("No rows to export for the current filters.");
      return;
    }
    const csv = toCsv(built);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `landvision-${def.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${def.title} exported (${built.rows.length} rows).`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports &amp; exports"
        description="Generate governance reports across risk, delay, progress, compensation, R&R and legal disputes. Preview inline or export as CSV."
      >
        <DemoTag />
      </PageHeader>

      <Panel>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Search project</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name or ID"
              className="w-52 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">District</span>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">All districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Risk level</span>
            <select
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">All risk levels</option>
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskCategory[]).map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Created within</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="all">All time</option>
              <option value="365">Last 12 months</option>
              <option value="180">Last 6 months</option>
              <option value="90">Last 90 days</option>
            </select>
          </label>
          <span className="ml-auto text-xs text-muted-foreground">
            {rows.length.toLocaleString("en-IN")} projects in scope
          </span>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r) => {
          const active = r.id === openId;
          return (
            <Panel
              key={r.id}
              className={active ? "border-primary/50" : undefined}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-background text-primary">
                  <r.icon className="size-4.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-semibold text-foreground">
                    {r.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.description}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setOpenId(r.id)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Eye className="size-3.5" aria-hidden /> View report
                </button>
                <button
                  onClick={() => exportReport(r)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-card"
                >
                  <Download className="size-3.5" aria-hidden /> Export CSV
                </button>
              </div>
            </Panel>
          );
        })}
      </div>

      {openReport && view ? (
        <Panel>
          <PanelTitle
            title={openReport.title}
            subtitle={view.summary}
            icon={Building2}
            action={
              <button
                onClick={() => exportReport(openReport)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-card"
              >
                <Download className="size-3.5" aria-hidden /> Export CSV
              </button>
            }
          />

          {view.rows.length === 0 ? (
            <EmptyState
              title="No data for these filters"
              description="Adjust the district, risk level or date range to populate this report."
              icon={FileText}
            />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface">
                    <tr className="text-[11px] tracking-wide text-muted-foreground uppercase">
                      {view.columns.map((c) => (
                        <th key={c.key} className="px-3 py-2 font-medium">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {view.rows.slice(0, 60).map((row, i) => (
                      <tr key={i} className="border-t border-border">
                        {view.columns.map((c) => {
                          const val = row[c.key];
                          if (c.key === "riskCategory") {
                            return (
                              <td key={c.key} className="px-3 py-2">
                                <RiskBadge category={val as RiskCategory} />
                              </td>
                            );
                          }
                          return (
                            <td
                              key={c.key}
                              className="px-3 py-2 text-muted-foreground tabular-nums"
                            >
                              {val ?? "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {view.rows.length > 60 ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Showing first 60 of{" "}
                    {view.rows.length.toLocaleString("en-IN")} rows. Export CSV
                    for the full report.
                  </p>
                ) : null}
              </div>

              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  {view.chart.kind === "pie" ? (
                    <PieChart>
                      <Pie
                        data={view.chart.data}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={54}
                        outerRadius={88}
                        paddingAngle={3}
                      >
                        {view.chart.data.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={
                              CAT_COLORS[entry.name as RiskCategory] ??
                              "var(--chart-1)"
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP} />
                    </PieChart>
                  ) : (
                    <BarChart
                      data={view.chart.data}
                      layout="vertical"
                      margin={{ left: 16 }}
                    >
                      <CartesianGrid
                        stroke="var(--border)"
                        horizontal={false}
                      />
                      <XAxis type="number" {...AXIS} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={96}
                        {...AXIS}
                      />
                      <Tooltip contentStyle={TOOLTIP} />
                      <Bar
                        dataKey="value"
                        fill={view.chart.color ?? "var(--chart-1)"}
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Panel>
      ) : null}
    </div>
  );
}
