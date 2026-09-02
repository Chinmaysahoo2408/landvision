import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Brain, Sparkles, TriangleAlert } from "lucide-react";
import { useLV } from "@/lib/lv/store";
import { DemoTag, Panel, PanelTitle, PageHeader } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";

export const Route = createFileRoute("/app/insights")({
  head: () => ({
    meta: [
      { title: "AI insights — LandVision AI" },
      {
        name: "description",
        content: "Explainable AI narratives, dominant delay drivers and prioritised national recommendations.",
      },
      { property: "og:title", content: "AI insights — LandVision AI" },
      { property: "og:description", content: "Explainable AI insights for land acquisition governance." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const { visibleProjects, predictions } = useLV();

  const { drivers, topRecs, watchlist } = useMemo(() => {
    const agg = new Map<string, number>();
    const recs: { id: string; projectId: string; name: string; title: string; action: string; impact: string; priority: number }[] = [];
    for (const p of visibleProjects) {
      const pred = predictions.get(p.id);
      if (!pred) continue;
      for (const f of pred.factors) agg.set(f.factor, (agg.get(f.factor) ?? 0) + f.contribution);
      if (pred.riskScore >= 70) {
        for (const r of pred.recommendations.filter((x) => x.priority === 1)) {
          recs.push({
            id: r.id,
            projectId: p.id,
            name: p.name,
            title: r.title,
            action: r.action,
            impact: r.impact,
            priority: r.priority,
          });
        }
      }
    }
    const total = Array.from(agg.values()).reduce((a, b) => a + b, 0) || 1;
    const drivers = Array.from(agg.entries())
      .map(([factor, v]) => ({ factor, share: Math.round((v / total) * 100) }))
      .sort((a, b) => b.share - a.share)
      .slice(0, 6);
    const watchlist = visibleProjects
      .map((p) => ({ p, pred: predictions.get(p.id)! }))
      .filter((x) => x.pred)
      .sort((a, b) => b.pred.riskScore - a.pred.riskScore)
      .slice(0, 8);
    return { drivers, topRecs: recs.slice(0, 12), watchlist };
  }, [visibleProjects, predictions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI insights"
        description="What the model is seeing across the portfolio, and what should be done about it this week."
      >
        <DemoTag />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelTitle title="Dominant delay drivers" icon={Brain} ai subtitle="Aggregated factor attribution across all monitored projects" />
          <ul className="space-y-3">
            {drivers.map((d) => (
              <li key={d.factor}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{d.factor}</span>
                  <span className="tabular-nums text-muted-foreground">{d.share}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${d.share}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelTitle title="Highest-risk watchlist" icon={TriangleAlert} subtitle="Projects most likely to slip in the next quarter" />
          <ul className="divide-y divide-border">
            {watchlist.map(({ p, pred }) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <Link
                    to="/app/projects/$projectId"
                    params={{ projectId: p.id }}
                    className="truncate text-sm font-medium text-foreground hover:text-primary"
                  >
                    {p.name}
                  </Link>
                  <p className="text-[11px] text-muted-foreground">
                    {p.district}, {p.state} · {p.currentStage}
                  </p>
                </div>
                <RiskBadge category={pred.riskCategory} score={pred.riskScore} />
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel>
        <PanelTitle title="Priority-1 recommended actions" icon={Sparkles} ai subtitle="Generated for every high and critical risk project" />
        <div className="grid gap-3 md:grid-cols-2">
          {topRecs.map((r) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4">
              <p className="font-display text-sm font-semibold text-foreground">{r.title}</p>
              <Link
                to="/app/projects/$projectId"
                params={{ projectId: r.projectId }}
                className="text-[11px] text-primary"
              >
                {r.name}
              </Link>
              <p className="mt-2 text-xs text-foreground">{r.action}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{r.impact}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
