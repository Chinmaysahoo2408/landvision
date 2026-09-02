import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  Coins,
  CreditCard,
  HandCoins,
  Layers,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DemoTag, PageHeader, Panel, PanelTitle, StatCard } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";

export const Route = createFileRoute("/app/compensation")({
  component: CompensationPage,
  head: () => ({
    meta: [
      { title: "Compensation Tracking & Disbursal Velocity — LandVision AI" },
      {
        name: "description",
        content:
          "Monitor compensation awards, direct benefit transfers (DBT), stalled bank accounts, and disbursement velocity across land acquisition corridors.",
      },
    ],
  }),
});

const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
};

function CompensationPage() {
  const { visibleProjects, predictions } = useLV();
  const [selectedState, setSelectedState] = useState<string>("");

  const compData = useMemo(() => {
    let eligibleTotalCr = 0;
    let paidTotalCr = 0;
    let pendingTotalCr = 0;
    let landownersTotal = 0;
    let stalledAccountsTotal = 0;

    const filtered = visibleProjects.filter((p) => !selectedState || p.state === selectedState);

    for (const p of filtered) {
      eligibleTotalCr += p.compensation.eligibleAmountCr;
      paidTotalCr += p.compensation.paidAmountCr;
      pendingTotalCr += p.compensation.pendingAmountCr;
      landownersTotal += p.compensation.totalLandowners;
      stalledAccountsTotal += p.compensation.stalledAccounts;
    }

    const overallDisbursedPct = eligibleTotalCr > 0 ? Math.round((paidTotalCr / eligibleTotalCr) * 100) : 0;

    return {
      eligibleTotalCr: Math.round(eligibleTotalCr),
      paidTotalCr: Math.round(paidTotalCr),
      pendingTotalCr: Math.round(pendingTotalCr),
      landownersTotal,
      stalledAccountsTotal,
      overallDisbursedPct,
      projects: filtered,
    };
  }, [visibleProjects, selectedState]);

  const stateComparison = useMemo(() => {
    const map = new Map<string, { state: string; eligible: number; paid: number; pending: number; count: number }>();
    for (const p of visibleProjects) {
      const cur = map.get(p.state) ?? { state: p.state, eligible: 0, paid: 0, pending: 0, count: 0 };
      cur.eligible += p.compensation.eligibleAmountCr;
      cur.paid += p.compensation.paidAmountCr;
      cur.pending += p.compensation.pendingAmountCr;
      cur.count += 1;
      map.set(p.state, cur);
    }
    return [...map.values()]
      .map((s) => ({
        state: s.state,
        eligibleCr: Math.round(s.eligible),
        paidCr: Math.round(s.paid),
        pendingCr: Math.round(s.pending),
        pct: Math.round((s.paid / (s.eligible || 1)) * 100),
      }))
      .sort((a, b) => b.eligibleCr - a.eligibleCr);
  }, [visibleProjects]);

  const states = useMemo(() => [...new Set(visibleProjects.map((p) => p.state))].sort(), [visibleProjects]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compensation Disbursement & Financial Tracking"
        description="Monitor statutory compensation awards under RFCTLARR Act 2013, payment velocity, pending financial outlays, and DBT disbursal progress to affected landholders."
      >
        <DemoTag />
      </PageHeader>

      {/* STAT CARDS */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          label="Total Award Value"
          value={compData.eligibleTotalCr}
          suffix=" Cr"
          icon={Coins}
          hint="Total compensation budget"
        />
        <StatCard
          label="Disbursed (DBT)"
          value={compData.paidTotalCr}
          suffix=" Cr"
          icon={HandCoins}
          tone="low"
          hint="Paid to bank accounts"
        />
        <StatCard
          label="Pending Outlay"
          value={compData.pendingTotalCr}
          suffix=" Cr"
          icon={Banknote}
          tone="high"
          hint="Awaiting disbursal"
        />
        <StatCard
          label="Disbursement Rate"
          value={compData.overallDisbursedPct}
          suffix="%"
          icon={TrendingUp}
          tone={compData.overallDisbursedPct >= 70 ? "low" : "medium"}
          hint="National average"
        />
        <StatCard
          label="Affected Landowners"
          value={compData.landownersTotal}
          icon={Users}
          hint="Eligible title holders"
        />
        <StatCard
          label="Stalled Accounts"
          value={compData.stalledAccountsTotal}
          icon={AlertTriangle}
          tone="critical"
          hint="KYC/Title issues"
        />
      </div>

      {/* STATE BAR CHART */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelTitle
            title="State-wise Compensation Outlay (Paid vs Pending)"
            subtitle="Financial volume in ₹ Crores across states"
            icon={HandCoins}
          />
          <div className="h-76">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateComparison} margin={{ left: 16 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="state" stroke="var(--muted-foreground)" fontSize={10} tickFormatter={(s) => s.slice(0, 4)} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} unit=" Cr" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="paidCr" name="Disbursed (₹ Cr)" fill="var(--risk-low)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pendingCr" name="Pending (₹ Cr)" fill="var(--risk-high)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelTitle
            title="State Disbursal Completion League"
            subtitle="Percentage of award successfully credited to landowners"
            icon={TrendingUp}
          />
          <div className="h-76">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateComparison} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid stroke="var(--border)" horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} unit="%" />
                <YAxis type="category" dataKey="state" width={90} stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="pct" name="Disbursed %" radius={[0, 4, 4, 0]}>
                  {stateComparison.map((s) => (
                    <Cell
                      key={s.state}
                      fill={s.pct >= 70 ? "var(--risk-low)" : s.pct >= 50 ? "var(--risk-medium)" : "var(--risk-high)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* PROJECT-LEVEL COMPENSATION REGISTRY */}
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <PanelTitle
            title="Corridor Compensation Status Registry"
            subtitle="Detailed payment velocity, eligible amounts, and stalled account tracking"
            icon={Coins}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filter State:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs text-foreground"
            >
              <option value="">All States</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-[10px] tracking-wider text-muted-foreground uppercase">
                <th className="py-2.5 font-semibold">Corridor</th>
                <th className="py-2.5 font-semibold">Location</th>
                <th className="py-2.5 font-semibold">Landowners</th>
                <th className="py-2.5 font-semibold">Award Eligible</th>
                <th className="py-2.5 font-semibold">Amount Paid</th>
                <th className="py-2.5 font-semibold">Amount Pending</th>
                <th className="py-2.5 font-semibold">Disbursed %</th>
                <th className="py-2.5 font-semibold">Disbursal Velocity</th>
                <th className="py-2.5 font-semibold">Stalled Accounts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {compData.projects.slice(0, 30).map((p) => (
                <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 pr-2 font-medium text-foreground max-w-56 truncate">
                    <Link to="/app/projects/$projectId" params={{ projectId: p.id }} className="hover:text-primary">
                      {p.name}
                    </Link>
                    <span className="block text-[10px] text-muted-foreground">{p.projectId}</span>
                  </td>
                  <td className="py-2.5 pr-2 text-muted-foreground">
                    {p.district}, {p.state}
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums text-foreground">
                    {p.compensation.totalLandowners.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums font-semibold text-foreground">
                    ₹{p.compensation.eligibleAmountCr} Cr
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums font-semibold text-risk-low">
                    ₹{p.compensation.paidAmountCr} Cr
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums font-semibold text-risk-high">
                    ₹{p.compensation.pendingAmountCr} Cr
                  </td>
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-12 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: `${p.compensation.disbursedPct}%` }}
                        />
                      </div>
                      <span className="font-bold tabular-nums text-foreground">{p.compensation.disbursedPct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums text-muted-foreground">
                    ₹{p.compensation.disbursalVelocityCrPerMonth} Cr/mo
                  </td>
                  <td className="py-2.5 pr-2 tabular-nums font-bold text-risk-critical">
                    {p.compensation.stalledAccounts}
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
