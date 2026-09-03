import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Compass, Filter, Globe2, Layers, Map as MapIcon, Moon, Satellite, Search, ShieldCheck, Sun } from "lucide-react";
import { DemoTag, Panel, PageHeader } from "@/components/lv/panels";
import { GisMap } from "@/components/lv/GisMap";
import { useLV } from "@/lib/lv/store";
import type { RiskCategory } from "@/lib/lv/types";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/public/map")({
  head: () => ({
    meta: [
      { title: "GIS Map — LandVision Public Portal" },
      {
        name: "description",
        content:
          "Interactive public GIS map of land acquisition projects with layer controls and stage indicators.",
      },
      { property: "og:title", content: "GIS Map — LandVision Public Portal" },
      {
        property: "og:description",
        content: "Explore land acquisition projects geographically.",
      },
    ],
  }),
  component: PublicMap,
});

const CATS: RiskCategory[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
type BaseLayerMode = "osm" | "satellite";

function PublicMap() {
  const { visibleProjects, predictions } = useLV();
  const { t } = useTranslation();
  const [cats, setCats] = useState<RiskCategory[]>(CATS);
  const [state, setState] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [baseLayer, setBaseLayer] = useState<BaseLayerMode>("osm");
  const [parcels, setParcels] = useState(true);
  const [heat, setHeat] = useState(false);

  const states = useMemo(
    () => Array.from(new Set(visibleProjects.map((p) => p.state))).sort(),
    [visibleProjects],
  );

  const filtered = useMemo(
    () =>
      visibleProjects.filter((p) => {
        const pred = predictions.get(p.id);
        if (!pred || !cats.includes(pred.riskCategory)) return false;
        if (state && p.state !== state) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesDistrict = p.district.toLowerCase().includes(q);
          const matchesId = p.projectId.toLowerCase().includes(q);
          const matchesType = p.type.toLowerCase().includes(q);
          if (!matchesName && !matchesDistrict && !matchesId && !matchesType) return false;
        }
        return true;
      }),
    [visibleProjects, predictions, cats, state, searchQuery],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title={t.gis.title}
        description={t.gis.subtitle}
      >
        <DemoTag />
      </PageHeader>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          {/* SEARCH & FILTERS */}
          <Panel className="space-y-4">
            <div>
              <p className="font-display text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Search className="size-3.5 text-primary" /> {t.common.search}
              </p>
              <input
                type="text"
                placeholder="Search projects or districts…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
            </div>

            {/* BASEMAP CHOOSER */}
            <div>
              <p className="font-display text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Globe2 className="size-3.5 text-primary" /> {t.gis.basemap}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: "osm", label: "Street Map", icon: Compass },
                    { id: "satellite", label: t.gis.satellite, icon: Satellite },
                  ] as const
                ).map((m) => {
                  const Icon = m.icon;
                  const isActive = baseLayer === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setBaseLayer(m.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all ${
                        isActive
                          ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RISK LEGEND & FILTER */}
            <div>
              <p className="font-display text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="size-3.5 text-primary" /> {t.gis.riskCategory}
              </p>
              <div className="mt-2 space-y-1.5">
                {[
                  { cat: "LOW" as RiskCategory, label: "LOW (0-150d)", color: "#16A34A", bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-700 dark:text-emerald-400" },
                  { cat: "MEDIUM" as RiskCategory, label: "MEDIUM (151-400d)", color: "#EAB308", bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-700 dark:text-amber-400" },
                  { cat: "HIGH" as RiskCategory, label: "HIGH (401-800d)", color: "#F87171", bg: "bg-rose-400/15", border: "border-rose-400/40", text: "text-rose-600 dark:text-rose-400" },
                  { cat: "CRITICAL" as RiskCategory, label: "CRITICAL (>800d)", color: "#B91C1C", bg: "bg-rose-700/20", border: "border-rose-700/50", text: "text-rose-700 dark:text-rose-300" },
                ].map(({ cat, label, color, bg, border, text }) => {
                  const count = visibleProjects.filter((p) => {
                    if (state && p.state !== state) return false;
                    return predictions.get(p.id)?.riskCategory === cat;
                  }).length;
                  const isChecked = cats.includes(cat);

                  return (
                    <label
                      key={cat}
                      className={`flex items-center justify-between rounded-lg border p-1.5 text-xs transition-all cursor-pointer ${
                        isChecked ? `${bg} ${border}` : "border-border bg-card/60 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setCats((prev) =>
                              prev.includes(cat) ? prev.filter((x) => x !== cat) : [...prev, cat]
                            )
                          }
                          className="rounded border-border accent-primary cursor-pointer"
                        />
                        <span className={`font-bold ${text} text-[11px] flex items-center gap-1.5`}>
                          <span className="size-2 rounded-full inline-block" style={{ backgroundColor: color }} />
                          {label}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-foreground">
                        ({count})
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* STATE FILTER */}
            <div>
              <label className="block text-xs text-foreground font-semibold">
                {t.gis.filterByState}
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-normal text-foreground outline-none focus:border-primary"
                >
                  <option value="">{t.gis.allStates} ({states.length})</option>
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" aria-hidden />
              <h2 className="font-display text-sm font-semibold text-foreground">
                Geospatial Layers
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              <LayerToggle
                label="Cadastral boundaries"
                description="Approximate acquisition outlines"
                checked={parcels}
                onChange={setParcels}
              />
              <LayerToggle
                label="Risk intensity heatmap"
                description="Concentration of delayed projects"
                checked={heat}
                onChange={setHeat}
              />
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <MapIcon className="size-4 text-primary" aria-hidden />
              <h2 className="font-display text-sm font-semibold text-foreground">
                Plotted Corridors
              </h2>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">
              {filtered.length.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground">of {visibleProjects.length} total projects</p>
          </Panel>
        </div>

        <Panel className="p-2">
          <GisMap
            projects={filtered}
            predictions={predictions}
            showParcels={parcels}
            showHeat={heat}
            baseLayer={baseLayer}
            publicMode
            height="640px"
          />
        </Panel>
      </div>
    </div>
  );
}

function LayerToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span>
        <span className="block text-xs font-semibold text-foreground">
          {label}
        </span>
        <span className="block text-[10px] text-muted-foreground">
          {description}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-background transition-all ${
            checked ? "left-4" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

