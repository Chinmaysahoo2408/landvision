import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Building,
  Coins,
  Globe2,
  HelpCircle,
  Info,
  LandPlot,
  Layers,
  LineChart as LineChartIcon,
  MapPin,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DemoTag, PageHeader, Panel, PanelTitle, StatCard } from "@/components/lv/panels";
import { useLV } from "@/lib/lv/store";

export const Route = createFileRoute("/app/land-price")({
  component: LandPricePage,
  head: () => ({
    meta: [
      { title: "Land Price Intelligence & Future Infrastructure Insights — LandVision AI" },
      {
        name: "description",
        content:
          "AI-driven land valuation trends, circle rate projections, and future infrastructure corridor impact multiplier estimates.",
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

const FUTURE_CORRIDORS = [
  {
    name: "Delhi-Mumbai Industrial Corridor (DMIC) Phase 3 Extension",
    category: "Industrial Corridors",
    status: "Predicted Project (AI Simulation)",
    impactMultiplier: "+35%–45%",
    affectedDistricts: "Bharuch, Surat, Vadodara",
    confidence: "82% Multi-Source Corroboration",
  },
  {
    name: "Eastern Coastal High-Speed Rail Corridor",
    category: "Railways & High-Speed Transit",
    status: "Confirmed Project (Official DPR Phase)",
    impactMultiplier: "+50%–65%",
    affectedDistricts: "Khordha, Cuttack, Balasore",
    confidence: "Official Gazette Notification",
  },
  {
    name: "Green Hydrogen Multi-Modal Logistics Hub",
    category: "Green Energy & Port Connectivity",
    status: "Demo Simulation Data",
    impactMultiplier: "+25%–35%",
    affectedDistricts: "Raigad, Thane",
    confidence: "Feasibility Modeling",
  },
  {
    name: "Outer Regional Ring Expressway (Phase 2)",
    category: "Highways & Expressways",
    status: "Predicted Project (AI Simulation)",
    impactMultiplier: "+40%–55%",
    affectedDistricts: "Rangareddy, Medak",
    confidence: "Urban Growth Modeling",
  },
];

function LandPricePage() {
  const { visibleProjects } = useLV();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("nh16");

  const project =
    visibleProjects.find((p) => p.id === selectedProjectId || p.projectId === selectedProjectId) ??
    visibleProjects[0]!;

  const priceHistory = useMemo(() => {
    return project.landPrices.map((p) => ({
      year: String(p.year),
      historical: p.historicalPricePerAcreLakhs,
      current: p.currentEstimatedPricePerAcreLakhs,
      predictedFuture: p.futureEstimatedPricePerAcreLakhs,
      multiplier: p.infraImpactMultiplier,
    }));
  }, [project]);

  const latestPrice = project.landPrices[project.landPrices.length - 1];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Land Price Intelligence & Future Infrastructure Insights"
        description="Historical land valuation curves, estimated market circle rates, and predictive economic impact modeling driven by upcoming multimodal infrastructure corridors."
      >
        <DemoTag />
      </PageHeader>

      {/* DISCLAIMER CALLOUT */}
      <Panel className="border-primary/40 bg-primary/5">
        <div className="flex items-start gap-3.5">
          <Info className="mt-0.5 size-5 shrink-0 text-primary" />
          <div className="space-y-1 text-xs text-foreground">
            <p className="font-bold">Official Government Data Policy &amp; Simulation Labeling</p>
            <p className="text-muted-foreground">
              Land price forecasts and future infrastructure categories are predictive analytical models generated for
              economic decision support. Predictions are explicitly distinguished from gazetted government announcements.
            </p>
          </div>
        </div>
      </Panel>

      {/* CORRIDOR SELECTOR BAR */}
      <Panel className="bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Target Corridor:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground outline-none"
            >
              {visibleProjects.slice(0, 30).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.district}, {p.state})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Corridor Base Price:</span>
            <span className="font-bold text-foreground text-xs">
              ₹{latestPrice?.currentEstimatedPricePerAcreLakhs ?? 45} Lakhs / Acre
            </span>
          </div>
        </div>
      </Panel>

      {/* KPI METRICS */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <StatCard
          label="Current Estimated Price"
          value={latestPrice?.currentEstimatedPricePerAcreLakhs ?? 45}
          suffix=" Lakhs/Acre"
          icon={Coins}
          hint="Circle rate benchmark"
        />
        <StatCard
          label="Projected 2028 Value"
          value={Math.round(latestPrice?.futureEstimatedPricePerAcreLakhs ?? 75)}
          suffix=" Lakhs/Acre"
          icon={TrendingUp}
          tone="low"
          hint="Post-infrastructure appreciation"
        />
        <StatCard
          label="Infra Value Multiplier"
          value={latestPrice?.infraImpactMultiplier ?? 1.6}
          suffix="x"
          icon={Sparkles}
          tone="ai"
          hint="Corridor impact factor"
        />
        <StatCard
          label="Historical CAGR (2021-2026)"
          value={11.4}
          suffix="%"
          icon={LineChartIcon}
          tone="default"
          hint="Annualized growth"
        />
      </div>

      {/* PRICE APPRECIATION CHART */}
      <Panel>
        <PanelTitle
          title={`Land Price Trajectory & Future Forecast — ${project.name}`}
          subtitle="Historical registered values (2021–2025) vs Predicted future appreciation curve (2026–2028)"
          icon={TrendingUp}
          ai
        />
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceHistory}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} unit=" L" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="historical"
                name="Historical Benchmark (₹ Lakhs/Acre)"
                stroke="var(--muted-foreground)"
                fill="none"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Area
                type="monotone"
                dataKey="predictedFuture"
                name="Predicted Post-Corridor Price (₹ Lakhs/Acre)"
                stroke="var(--primary)"
                fill="url(#priceGradient)"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* FUTURE INFRASTRUCTURE CORRIDORS CATALOG */}
      <Panel>
        <PanelTitle
          title="Future Infrastructure Corridors & Catalytic Impact Modeling"
          subtitle="Potential upcoming highways, high-speed rail, industrial corridors, and ports"
          icon={Layers}
        />

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {FUTURE_CORRIDORS.map((c) => (
            <div key={c.name} className="rounded-xl border border-border bg-card p-4 shadow-2xs">
              <div className="flex items-start justify-between gap-2">
                <span className="rounded bg-surface px-2 py-0.5 text-[10px] font-bold text-foreground border border-border">
                  {c.category}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    c.status.includes("Confirmed")
                      ? "bg-risk-low/15 text-risk-low"
                      : "bg-primary/15 text-primary"
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <h4 className="mt-2 font-display text-sm font-bold text-foreground">{c.name}</h4>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-border pt-2.5">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Estimated Land Value Impact</span>
                  <p className="mt-0.5 font-bold text-primary">{c.impactMultiplier}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Influenced Districts</span>
                  <p className="mt-0.5 font-medium text-foreground truncate">{c.affectedDistricts}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
