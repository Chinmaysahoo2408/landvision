import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, History, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  DemoTag,
  EmptyState,
  Panel,
  PageHeader,
  StatCard,
} from "@/components/lv/panels";
import { useLV } from "@/lib/lv/store";
import type { AuditEntry } from "@/lib/lv/types";

export const Route = createFileRoute("/app/audit")({
  head: () => ({
    meta: [
      { title: "Audit trail — LandVision AI" },
      {
        name: "description",
        content:
          "Chronological audit trail of every action taken in LandVision, with date, user, entity and action filters.",
      },
      { property: "og:title", content: "Audit trail — LandVision AI" },
      {
        property: "og:description",
        content: "Immutable chronological record of platform activity.",
      },
    ],
  }),
  component: AuditPage,
});

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function AuditPage() {
  const { audit } = useLV();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState("");
  const [entity, setEntity] = useState("");
  const [range, setRange] = useState("all");

  const users = useMemo(
    () => [...new Set(audit.map((a) => a.user))].sort(),
    [audit],
  );
  const entities = useMemo(
    () => [...new Set(audit.map((a) => a.entity))].sort(),
    [audit],
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const now = Date.now();
    const maxAgeDays = range === "all" ? Infinity : Number(range);
    return audit
      .filter((a) => (user ? a.user === user : true))
      .filter((a) => (entity ? a.entity === entity : true))
      .filter((a) => {
        if (maxAgeDays === Infinity) return true;
        const ageDays = (now - new Date(a.timestamp).getTime()) / 86400000;
        return ageDays <= maxAgeDays;
      })
      .filter((a) =>
        q
          ? a.action.toLowerCase().includes(q) ||
            a.entityId.toLowerCase().includes(q) ||
            a.user.toLowerCase().includes(q)
          : true,
      )
      .slice()
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }, [audit, query, user, entity, range]);

  const grouped = useMemo(() => {
    const map = new Map<string, AuditEntry[]>();
    for (const a of filtered) {
      const k = dayKey(a.timestamp);
      const arr = map.get(k) ?? [];
      arr.push(a);
      map.set(k, arr);
    }
    return [...map.entries()];
  }, [filtered]);

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("No audit entries to export for the current filters.");
      return;
    }
    const cols = [
      "Timestamp",
      "User",
      "Action",
      "Entity",
      "Entity ID",
      "Old value",
      "New value",
    ];
    const escape = (v: string) =>
      /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    const lines = filtered.map((a) =>
      [
        a.timestamp,
        a.user,
        a.action,
        a.entity,
        a.entityId,
        a.oldValue,
        a.newValue,
      ]
        .map(escape)
        .join(","),
    );
    const csv = [cols.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `landvision-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} audit entries.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit trail"
        description="A chronological record of sign-ins, data changes and administrative actions across the platform."
      >
        <DemoTag />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Entries in scope"
          value={filtered.length}
          icon={History}
        />
        <StatCard
          label="Distinct users"
          value={users.length}
          icon={ShieldAlert}
          tone="ai"
        />
        <StatCard label="Entity types" value={entities.length} icon={History} />
        <StatCard label="Total logged" value={audit.length} icon={History} />
      </div>

      <Panel>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Search</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Action, project ID or user"
                className="w-64 rounded-md border border-border bg-background py-2 pr-3 pl-8 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </span>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">User</span>
            <select
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Entity</span>
            <select
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">All entities</option>
              {entities.map((en) => (
                <option key={en} value={en}>
                  {en}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Period</span>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="all">All time</option>
              <option value="30">Last 30 days</option>
              <option value="7">Last 7 days</option>
              <option value="1">Last 24 hours</option>
            </select>
          </label>
          <button
            onClick={exportCsv}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Download className="size-3.5" aria-hidden /> Export CSV
          </button>
        </div>
      </Panel>

      {grouped.length === 0 ? (
        <Panel>
          <EmptyState
            title="No audit entries"
            description="Nothing matches the current filters. Try widening the period or clearing the search."
            icon={History}
          />
        </Panel>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, entries]) => (
            <Panel key={day}>
              <h3 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {day}
              </h3>
              <ol className="relative space-y-4 border-l border-border pl-5">
                {entries.map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute top-1.5 -left-[22px] size-2.5 rounded-full border-2 border-background bg-primary" />
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">{a.user}</span> ·{" "}
                        {a.action}
                      </p>
                      <time className="text-xs text-muted-foreground tabular-nums">
                        {new Date(a.timestamp).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.entity} ·{" "}
                      <span className="font-medium text-foreground">
                        {a.entityId}
                      </span>
                      {a.oldValue !== "—" || a.newValue !== "—" ? (
                        <>
                          {" "}
                          ·{" "}
                          <span className="text-muted-foreground">
                            {a.oldValue}
                          </span>{" "}
                          →{" "}
                          <span className="text-foreground">{a.newValue}</span>
                        </>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ol>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
