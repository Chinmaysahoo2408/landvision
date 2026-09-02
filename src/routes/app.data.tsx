import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  ExternalLink,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  DemoTag,
  EmptyState,
  Panel,
  PageHeader,
  StatCard,
} from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";
import { overallProgress } from "@/lib/lv/risk";
import type { Prediction, Project, RiskCategory } from "@/lib/lv/types";

export const Route = createFileRoute("/app/data")({
  head: () => ({
    meta: [
      { title: "Data management — LandVision AI" },
      {
        name: "description",
        content:
          "Land acquisition data management — parcel records, acquisition, compensation, R&R and legal status with search, filters and export.",
      },
      { property: "og:title", content: "Data management — LandVision AI" },
      {
        property: "og:description",
        content: "Search, filter and export land acquisition records.",
      },
    ],
  }),
  component: DataPage,
});

const PAGE = 25;

type SortKey =
  | "projectId"
  | "name"
  | "district"
  | "landArea"
  | "compensationPct"
  | "rrPct"
  | "legalDisputes"
  | "riskScore"
  | "createdAt";

type Row = { p: Project; pr: Prediction };

const HEADERS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "projectId", label: "Parcel / project ID" },
  { key: "name", label: "Project" },
  { key: "district", label: "District" },
  { key: "landArea", label: "Land (ha)", numeric: true },
  { key: "compensationPct", label: "Compensation", numeric: true },
  { key: "rrPct", label: "R&R", numeric: true },
  { key: "legalDisputes", label: "Legal", numeric: true },
  { key: "riskScore", label: "Risk", numeric: true },
  { key: "createdAt", label: "Last updated", numeric: true },
];

function valueFor(row: Row, key: SortKey): string | number {
  switch (key) {
    case "projectId":
      return row.p.projectId;
    case "name":
      return row.p.name;
    case "district":
      return row.p.district;
    case "landArea":
      return row.p.landArea;
    case "compensationPct":
      return row.p.params.compensationPct;
    case "rrPct":
      return row.p.params.rrPct;
    case "legalDisputes":
      return row.p.params.legalDisputes;
    case "riskScore":
      return row.pr.riskScore;
    case "createdAt":
      return new Date(row.p.createdAt).getTime();
  }
}

function DataPage() {
  const { visibleProjects, predictions } = useLV();
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  const districts = useMemo(
    () => [...new Set(visibleProjects.map((p) => p.district))].sort(),
    [visibleProjects],
  );
  const types = useMemo(
    () => [...new Set(visibleProjects.map((p) => p.type))].sort(),
    [visibleProjects],
  );

  const rows = useMemo<Row[]>(() => {
    const q = query.toLowerCase().trim();
    const filtered = visibleProjects
      .map((p) => ({ p, pr: predictions.get(p.id) }))
      .filter((r): r is Row => Boolean(r.pr))
      .filter((r) => (district ? r.p.district === district : true))
      .filter((r) => (type ? r.p.type === type : true))
      .filter((r) => (status ? r.p.status === status : true))
      .filter((r) => (risk ? r.pr.riskCategory === risk : true))
      .filter((r) =>
        q
          ? r.p.name.toLowerCase().includes(q) ||
            r.p.projectId.toLowerCase().includes(q) ||
            r.p.village.toLowerCase().includes(q)
          : true,
      );

    const dir = sortDir === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      const av = valueFor(a, sortKey);
      const bv = valueFor(b, sortKey);
      if (typeof av === "number" && typeof bv === "number")
        return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return filtered;
  }, [
    visibleProjects,
    predictions,
    query,
    district,
    type,
    status,
    risk,
    sortKey,
    sortDir,
  ]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(safePage * PAGE, safePage * PAGE + PAGE);

  const totals = useMemo(() => {
    const land = rows.reduce((s, r) => s + r.p.landArea, 0);
    const families = rows.reduce((s, r) => s + r.p.affectedFamilies, 0);
    const disputes = rows.reduce((s, r) => s + r.p.params.legalDisputes, 0);
    return { land: Math.round(land), families, disputes };
  }, [rows]);

  const setSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(
        key === "name" || key === "district" || key === "projectId"
          ? "asc"
          : "desc",
      );
    }
    setPage(0);
  };

  const resetFilters = () => {
    setQuery("");
    setDistrict("");
    setType("");
    setStatus("");
    setRisk("");
    setPage(0);
  };

  const exportCsv = () => {
    if (rows.length === 0) {
      toast.error("No records to export for the current filters.");
      return;
    }
    const cols = [
      "Project ID",
      "Name",
      "Type",
      "Agency",
      "State",
      "District",
      "Village",
      "Land area (ha)",
      "Govt land (ha)",
      "Private land (ha)",
      "Forest land (ha)",
      "Affected families",
      "Compensation %",
      "R&R %",
      "Possession %",
      "Documentation %",
      "Open legal disputes",
      "Resolved disputes",
      "Risk score",
      "Risk category",
      "Overall progress %",
      "Status",
      "Current stage",
      "Created / updated",
    ];
    const escape = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = rows.map((r) =>
      [
        r.p.projectId,
        r.p.name,
        r.p.type,
        r.p.agency,
        r.p.state,
        r.p.district,
        r.p.village,
        r.p.landArea,
        r.p.govtLand,
        r.p.privateLand,
        r.p.forestLand,
        r.p.affectedFamilies,
        r.p.params.compensationPct,
        r.p.params.rrPct,
        r.p.params.possessionPct,
        r.p.params.documentationPct,
        r.p.params.legalDisputes,
        r.p.params.resolvedDisputes,
        r.pr.riskScore,
        r.pr.riskCategory,
        overallProgress(r.p),
        r.p.status,
        r.p.currentStage,
        new Date(r.p.createdAt).toISOString().slice(0, 10),
      ]
        .map(escape)
        .join(","),
    );
    const csv = [cols.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `landvision-acquisition-data-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length.toLocaleString("en-IN")} records.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Land acquisition data"
        description="Master record of every project and parcel with acquisition, compensation, R&R and legal status. Search, filter, sort and export."
      >
        <DemoTag />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Records in scope"
          value={rows.length}
          icon={Database}
        />
        <StatCard
          label="Total land area"
          value={totals.land}
          suffix=" ha"
          icon={Database}
          tone="ai"
        />
        <StatCard
          label="Affected families"
          value={totals.families}
          icon={Database}
        />
        <StatCard
          label="Open legal disputes"
          value={totals.disputes}
          icon={Database}
          tone="high"
        />
      </div>

      <Panel>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Search</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Project, ID or village"
                className="w-60 rounded-md border border-border bg-background py-2 pr-3 pl-8 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </span>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">District</span>
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setPage(0);
              }}
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
            <span className="mb-1 block">Type</span>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(0);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Status</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Risk</span>
            <select
              value={risk}
              onChange={(e) => {
                setRisk(e.target.value);
                setPage(0);
              }}
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
          <div className="ml-auto flex items-end gap-2">
            <button
              onClick={resetFilters}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-card"
            >
              Reset
            </button>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Download className="size-3.5" aria-hidden /> Export CSV
            </button>
          </div>
        </div>
      </Panel>

      <Panel className="p-0">
        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No matching records"
              description="Try clearing the search box or resetting the filters above."
              icon={Database}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface">
                  <tr className="text-[11px] tracking-wide text-muted-foreground uppercase">
                    {HEADERS.map((h) => (
                      <th
                        key={h.key}
                        className={`px-3 py-2.5 font-medium ${h.numeric ? "text-right" : ""}`}
                      >
                        <button
                          onClick={() => setSort(h.key)}
                          className={`inline-flex items-center gap-1 hover:text-foreground ${
                            sortKey === h.key ? "text-foreground" : ""
                          } ${h.numeric ? "flex-row-reverse" : ""}`}
                        >
                          {h.label}
                          <ArrowUpDown className="size-3" aria-hidden />
                        </button>
                      </th>
                    ))}
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr
                      key={r.p.id}
                      className="border-t border-border hover:bg-surface/60"
                    >
                      <td className="px-3 py-2.5 font-medium text-foreground">
                        {r.p.projectId}
                      </td>
                      <td
                        className="max-w-[220px] truncate px-3 py-2.5 text-foreground"
                        title={r.p.name}
                      >
                        {r.p.name}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {r.p.district}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                        {r.p.landArea.toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                        {r.p.params.compensationPct}%
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                        {r.p.params.rrPct}%
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                        {r.p.params.legalDisputes}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <RiskBadge
                          category={r.pr.riskCategory}
                          score={r.pr.riskScore}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                        {new Date(r.p.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Link
                          to="/app/projects/$projectId"
                          params={{ projectId: r.p.id }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Open <ExternalLink className="size-3" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
              <span>
                Showing {safePage * PAGE + 1}–
                {Math.min((safePage + 1) * PAGE, rows.length)} of{" "}
                {rows.length.toLocaleString("en-IN")}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 disabled:opacity-40"
                >
                  <ChevronLeft className="size-3.5" aria-hidden /> Prev
                </button>
                <span className="tabular-nums">
                  Page {safePage + 1} / {pageCount}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={safePage >= pageCount - 1}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 disabled:opacity-40"
                >
                  Next <ChevronRight className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
