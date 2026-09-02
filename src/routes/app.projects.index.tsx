import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { DemoTag, EmptyState, Panel, PageHeader } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { overallProgress } from "@/lib/lv/risk";
import { useLV } from "@/lib/lv/store";
import { STAGES, type RiskCategory } from "@/lib/lv/types";

interface ProjectSearch {
  risk?: string | undefined;
  state?: string | undefined;
  q?: string | undefined;
}

export const Route = createFileRoute("/app/projects/")({
  validateSearch: (search: Record<string, unknown>): ProjectSearch => ({
    risk: typeof search["risk"] === "string" ? search["risk"] : undefined,
    state: typeof search["state"] === "string" ? search["state"] : undefined,
    q: typeof search["q"] === "string" ? search["q"] : undefined,
  }),
  component: ProjectsPage,
  head: () => ({
    meta: [
      { title: "Projects — LandVision AI acquisition portfolio" },
      {
        name: "description",
        content: "Search, filter and monitor every land acquisition project with predicted delay risk scores.",
      },
      { property: "og:title", content: "LandVision AI project portfolio" },
      { property: "og:description", content: "Filter acquisition projects by state, stage and predicted risk." },
    ],
  }),
});

const PAGE = 25;

function ProjectsPage() {
  const initial = Route.useSearch();
  const { visibleProjects, predictions } = useLV();
  const [page, setPage] = useState(0);
  const [stage, setStage] = useState<string>("");
  const [search, setFilters] = useState<ProjectSearch>(initial);

  const states = useMemo(
    () => [...new Set(visibleProjects.map((p) => p.state))].sort(),
    [visibleProjects],
  );

  const rows = useMemo(() => {
    const q = (search.q ?? "").toLowerCase().trim();
    return visibleProjects
      .map((p) => ({ p, pr: predictions.get(p.id)! }))
      .filter((r) => r.pr)
      .filter((r) => (search.risk ? r.pr.riskCategory === search.risk : true))
      .filter((r) => (search.state ? r.p.state === search.state : true))
      .filter((r) => (stage ? r.p.currentStage === stage : true))
      .filter((r) =>
        q
          ? r.p.name.toLowerCase().includes(q) ||
            r.p.projectId.toLowerCase().includes(q) ||
            r.p.district.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => b.pr.riskScore - a.pr.riskScore);
  }, [visibleProjects, predictions, search, stage]);

  const paged = rows.slice(page * PAGE, page * PAGE + PAGE);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));

  const setSearch = (patch: ProjectSearch) => {
    setPage(0);
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  return (
    <div>
      <PageHeader
        title="Acquisition projects"
        description={`${rows.length.toLocaleString("en-IN")} projects matching current filters, ranked by predicted delay risk.`}
      >
        <div className="flex items-center gap-2">
          <DemoTag />
          <Link
            to="/app/projects/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden /> New project
          </Link>
        </div>
      </PageHeader>

      <Panel className="mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-56 flex-1">
            <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" aria-hidden />
            <input
              value={search.q ?? ""}
              onChange={(e) => setSearch({ q: e.target.value || undefined })}
              placeholder="Search by name, ID or district"
              className="w-full rounded-md border border-border bg-background py-2 pr-3 pl-9 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <select
            value={search.risk ?? ""}
            onChange={(e) => setSearch({ risk: e.target.value || undefined })}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            aria-label="Filter by risk category"
          >
            <option value="">All risk levels</option>
            {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskCategory[]).map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={search.state ?? ""}
            onChange={(e) => setSearch({ state: e.target.value || undefined })}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            aria-label="Filter by state"
          >
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={stage}
            onChange={(e) => {
              setStage(e.target.value);
              setPage(0);
            }}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            aria-label="Filter by stage"
          >
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </Panel>

      {paged.length === 0 ? (
        <EmptyState
          title="No projects match these filters"
          description="Adjust the search term, risk level, state or acquisition stage to widen the result set."
          icon={Filter}
        />
      ) : (
        <Panel className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface">
              <tr className="text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Delay</th>
                <th className="px-4 py-3 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(({ p, pr }) => (
                <tr key={p.id} className="border-t border-border transition-colors hover:bg-surface">
                  <td className="px-4 py-3">
                    <Link
                      to="/app/projects/$projectId"
                      params={{ projectId: p.id }}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {p.name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground">{p.projectId}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.district}, {p.state}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.currentStage}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{overallProgress(p)}%</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{pr.expectedDelayDays}d</td>
                  <td className="px-4 py-3">
                    <RiskBadge category={pr.riskCategory} score={pr.riskScore} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Page {page + 1} of {pages}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((n) => Math.max(0, n - 1))}
            disabled={page === 0}
            className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((n) => Math.min(pages - 1, n + 1))}
            disabled={page >= pages - 1}
            className="rounded-md border border-border px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
