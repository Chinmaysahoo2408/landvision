import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Search,
} from "lucide-react";
import { DemoTag, EmptyState, Panel, PageHeader } from "@/components/lv/panels";
import { useLV } from "@/lib/lv/store";
import { NOTICE_CATEGORIES, noticeFor } from "@/lib/lv/public";

export const Route = createFileRoute("/public/notices")({
  head: () => ({
    meta: [
      { title: "Public Notices — LandVision Public Portal" },
      {
        name: "description",
        content:
          "Public notices for land acquisition projects — filter by category and district and sort by date.",
      },
      {
        property: "og:title",
        content: "Public Notices — LandVision Public Portal",
      },
      {
        property: "og:description",
        content: "Land acquisition public notices.",
      },
    ],
  }),
  component: PublicNotices,
});

const PAGE = 15;

function PublicNotices() {
  const { visibleProjects } = useLV();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [district, setDistrict] = useState("");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(0);

  const all = useMemo(() => visibleProjects.map(noticeFor), [visibleProjects]);
  const districts = useMemo(
    () => [...new Set(all.map((n) => n.district))].sort(),
    [all],
  );

  const rows = useMemo(() => {
    const q = query.toLowerCase().trim();
    const filtered = all
      .filter((n) => (category ? n.category === category : true))
      .filter((n) => (district ? n.district === district : true))
      .filter((n) =>
        q
          ? n.projectName.toLowerCase().includes(q) ||
            n.projectRef.toLowerCase().includes(q) ||
            n.body.toLowerCase().includes(q)
          : true,
      );
    const dir = sortDir === "asc" ? 1 : -1;
    filtered.sort(
      (a, b) => (new Date(a.date).getTime() - new Date(b.date).getTime()) * dir,
    );
    return filtered;
  }, [all, query, category, district, sortDir]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(safePage * PAGE, safePage * PAGE + PAGE);

  const resetPage = () => setPage(0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <PageHeader
        title="Public notices"
        description="Notices relating to land acquisition projects, derived from project stages. Filter by category or district and sort by date."
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
                placeholder="Project, ID or text"
                className="w-56 rounded-md border border-border bg-background py-2 pr-3 pl-8 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </span>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Category</span>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                resetPage();
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">All categories</option>
              {NOTICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
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
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-card"
          >
            <ArrowUpDown className="size-3.5" aria-hidden />
            {sortDir === "desc" ? "Newest first" : "Oldest first"}
          </button>
          <span className="ml-auto text-xs text-muted-foreground">
            {rows.length.toLocaleString("en-IN")} notices
          </span>
        </div>
      </Panel>

      <p className="mt-4 rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
        These are sample notices generated for demonstration and are not
        official government notifications.
      </p>

      {rows.length === 0 ? (
        <Panel className="mt-4">
          <EmptyState
            title="No notices found"
            description="Try clearing the search box or changing the filters."
            icon={Megaphone}
          />
        </Panel>
      ) : (
        <>
          <ul className="mt-4 space-y-3">
            {pageRows.map((n) => (
              <li key={n.id}>
                <Panel className="transition-colors hover:border-primary/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {n.category}
                    </span>
                    <time className="text-xs text-muted-foreground tabular-nums">
                      {new Date(n.date).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <h3 className="mt-2 font-display text-base font-semibold text-foreground">
                    {n.projectName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {n.district}, {n.state} · {n.projectRef}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{n.body}</p>
                  <Link
                    to="/public/projects/$projectId"
                    params={{ projectId: n.projectId }}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    View project <ArrowRight className="size-3.5" aria-hidden />
                  </Link>
                </Panel>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
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
