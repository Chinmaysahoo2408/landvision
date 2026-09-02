import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  ShieldCheck,
  UserCheck,
  UserCog,
  UserX,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  DemoTag,
  EmptyState,
  Panel,
  PageHeader,
  StatCard,
} from "@/components/lv/panels";
import { ROLE_LABEL, useLV } from "@/lib/lv/store";
import type { AppUser, Project, Role } from "@/lib/lv/types";

export const Route = createFileRoute("/app/users")({
  head: () => ({
    meta: [
      { title: "Users &amp; stakeholders — LandVision AI" },
      {
        name: "description",
        content:
          "Manage officers and stakeholders — roles, jurisdiction, assigned projects, status and last activity.",
      },
      { property: "og:title", content: "Users & stakeholders — LandVision AI" },
      {
        property: "og:description",
        content: "Officer and stakeholder access management.",
      },
    ],
  }),
  component: UsersPage,
});

const ROLE_TONE: Record<Role, string> = {
  ADMIN: "bg-primary/10 text-primary",
  STATE_OFFICER: "bg-chart-2/15 text-foreground",
  DISTRICT_OFFICER: "bg-chart-4/15 text-foreground",
  DECISION_MAKER: "bg-chart-1/15 text-foreground",
};

function assignedCount(user: AppUser, projects: Project[]): number {
  if (user.role === "STATE_OFFICER" && user.state)
    return projects.filter((p) => p.state === user.state).length;
  if (user.role === "DISTRICT_OFFICER" && user.district)
    return projects.filter((p) => p.district === user.district).length;
  // Administrators and decision makers operate at national scope.
  return projects.length;
}

function jurisdiction(user: AppUser): string {
  if (user.district)
    return `${user.district}, ${user.state ?? ""}`.replace(/, $/, "");
  if (user.state) return user.state;
  return "National";
}

function UsersPage() {
  const { users, projects, setUsers, log, session } = useLV();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return users
      .filter((u) => (role ? u.role === role : true))
      .filter((u) => (status ? u.status === status : true))
      .filter((u) =>
        q
          ? u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.district ?? "").toLowerCase().includes(q) ||
            (u.state ?? "").toLowerCase().includes(q)
          : true,
      );
  }, [users, role, status, query]);

  const counts = useMemo(() => {
    const active = users.filter((u) => u.status === "Active").length;
    const admins = users.filter((u) => u.role === "ADMIN").length;
    return {
      total: users.length,
      active,
      disabled: users.length - active,
      admins,
    };
  }, [users]);

  const toggleStatus = (user: AppUser) => {
    if (session && session.id === user.id) {
      toast.error("You cannot disable the account you are signed in with.");
      return;
    }
    const next: AppUser["status"] =
      user.status === "Active" ? "Disabled" : "Active";
    setUsers(users.map((u) => (u.id === user.id ? { ...u, status: next } : u)));
    log({
      user: session?.name ?? "System",
      action:
        next === "Disabled"
          ? "Disabled user account"
          : "Re-enabled user account",
      entity: "User",
      entityId: user.email,
      oldValue: user.status,
      newValue: next,
    });
    toast.success(`${user.name} is now ${next.toLowerCase()}.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users &amp; stakeholders"
        description="Officers and decision makers with access to LandVision, their jurisdiction and assigned project load."
      >
        <DemoTag />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={counts.total} icon={UsersIcon} />
        <StatCard
          label="Active"
          value={counts.active}
          icon={UserCheck}
          tone="low"
        />
        <StatCard
          label="Disabled"
          value={counts.disabled}
          icon={UserX}
          tone="high"
        />
        <StatCard
          label="Administrators"
          value={counts.admins}
          icon={ShieldCheck}
          tone="ai"
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
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, email or jurisdiction"
                className="w-64 rounded-md border border-border bg-background py-2 pr-3 pl-8 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </span>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">All roles</option>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </select>
          </label>
          <span className="ml-auto text-xs text-muted-foreground">
            {filtered.length} shown
          </span>
        </div>
      </Panel>

      <Panel className="p-0">
        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No users match"
              description="Adjust the search box or filters to see stakeholders."
              icon={UserCog}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface">
                <tr className="text-[11px] tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Role</th>
                  <th className="px-4 py-2.5 font-medium">Jurisdiction</th>
                  <th className="px-4 py-2.5 text-right font-medium">
                    Assigned projects
                  </th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Last activity</th>
                  <th className="px-4 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-border hover:bg-surface/60"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {u.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {u.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_TONE[u.role]}`}
                      >
                        {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {jurisdiction(u)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {assignedCount(u, projects).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          u.status === "Active"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`size-2 rounded-full ${
                            u.status === "Active"
                              ? "bg-primary"
                              : "bg-muted-foreground/50"
                          }`}
                        />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(u.lastLogin).toLocaleString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => toggleStatus(u)}
                        className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-card"
                      >
                        {u.status === "Active" ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
