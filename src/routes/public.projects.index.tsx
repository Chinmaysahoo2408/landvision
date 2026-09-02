import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
} from "lucide-react";
import { DemoTag, EmptyState, Panel, PageHeader } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";
import { overallProgress } from "@/lib/lv/risk";
import type { RiskCategory } from "@/lib/lv/types";

export const Route = createFileRoute("/public/projects/")({
  head: () => ({
    meta: [
      { title: "Projects — LandVision Public Portal" },
      {
        name: "description",
        content:
          "Browse land acquisition projects by state, district, type, status and risk level. Track progress transparently.",
      },
      { property: "og:title", content: "Projects — LandVision Public Portal" },
      {
        property: "og:description",
        content: "Search and explore land acquisition projects.",
      },
    ],
  }),
  component: PublicProjects,
});

const PAGE = 12;

function PublicProjects() {
  const { visibleProjects, predictions } = useLV();
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [page, setPage] = useState(0);

  const states = useMemo(
    () => [...new Set(visibleProjects.map((p) => p.state))].sort(),
    [visibleProjects],
  );
  const districts = useMemo(
    () =>
      [
        ...new Set(
          visibleProjects
            .filter((p) => !state || p.state === state)
            .map((p) => p.district),
        ),
      ].sort(),
    [visibleProjects, state],
  );
  const types = useMemo(
    () => [...new Set(visibleProjects.map((p) => p.type))].sort(),
    [visibleProjects],
  );

  const rows = useMemo(() => {
    const q = query.toLowerCase().trim();
    return visibleProjects
      .filter((p) => (state ? p.state === state : true))
      .filter((p) => (district ? p.district === district : true))
      .filter((p) => (type ? p.type === type : true))
      .filter((p) => (status ? p.status === status : true))
      .filter((p) =>
        risk ? predictions.get(p.id)?.riskCategory === risk : true,
      )
      .filter((p) =>
        q
          ? p.name.toLowerCase().includes(q) ||
            p.projectId.toLowerCase().includes(q)
          : true,
      );
  }, [
    visibleProjects,
    predictions,
    query,
    state,
    district,
    type,
    status,
    risk,
  ]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(safePage * PAGE, safePage * PAGE + PAGE);

  const resetPage = () => setPage(0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Land acquisition projects"
        description="Browse projects across states and districts. Follow progress and current stage — detailed risk analytics are restricted to authorised officers."
      >
        <DemoTag />
      </PageHeader>

      <Panel className="mt-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Search</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  resetPage();
                }}
                placeholder="Project or ID"
                className="w-52 rounded-md border border-border bg-background py-2 pr-3 pl-8 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </span>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">State</span>
            <select
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setDistrict("");
                resetPage();
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">All states</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">District</span>
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                resetPage();
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
                resetPage();
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
                resetPage();
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
            <span className="mb-1 block">Risk level</span>
            <select
              value={risk}
              onChange={(e) => {
                setRisk(e.target.value);
                resetPage();
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
          <span className="ml-auto text-xs text-muted-foreground">
            {rows.length.toLocaleString("en-IN")} projects
          </span>
        </div>
      </Panel>

      {rows.length === 0 ? (
        <Panel className="mt-6">
          <EmptyState
            title="No projects found"
            description="Try adjusting or clearing the filters above."
            icon={Building2}
          />
        </Panel>
      ) : (
        <>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pageRows.map((p) => {
              const cat = predictions.get(p.id)?.riskCategory;
              const pct = overallProgress(p);
              return (
                <Link
                  key={p.id}
                  to="/public/projects/$projectId"
                  params={{ projectId: p.id }}
                  className="group block"
                >
                  <Panel className="flex h-full flex-col transition-transform group-hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {p.type} · {p.projectId}
                        </p>
                        <h3 className="mt-0.5 truncate font-display text-base font-semibold text-foreground">
                          {p.name}
                        </h3>
                      </div>
                      {cat ? <RiskBadge category={cat} /> : null}
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" aria-hidden /> {p.district},{" "}
                      {p.state}
                    </p>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span className="tabular-nums text-foreground">
                          {pct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-surface">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
                      <span className="text-muted-foreground">
                        Stage ·{" "}
                        <span className="text-foreground">
                          {p.currentStage}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-primary">
                        Details <ArrowRight className="size-3.5" aria-hidden />
                      </span>
                    </div>
                  </Panel>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {safePage * PAGE + 1}–
              {Math.min((safePage + 1) * PAGE, rows.length)} of{" "}
              {rows.length.toLocaleString("en-IN")}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" aria-hidden /> Prev
              </button>
              <span className="tabular-nums">
                Page {safePage + 1} / {pageCount}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={safePage >= pageCount - 1}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 disabled:opacity-40"
              >
                Next <ChevronRight className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
