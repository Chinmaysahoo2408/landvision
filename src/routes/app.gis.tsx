import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Filter,
  Globe2,
  Layers,
  Map as MapIcon,
  Search,
  ShieldAlert,
  Sparkles,
  Sun,
  Moon,
  Satellite,
  Compass,
} from "lucide-react";
import { useLV } from "@/lib/lv/store";
import { GisMap } from "@/components/lv/GisMap";
import { DemoTag, Panel, PageHeader } from "@/components/lv/panels";
import type { RiskCategory } from "@/lib/lv/types";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/app/gis")({
  head: () => ({
    meta: [
      { title: "GIS Risk Intelligence — LandVision AI" },
      {
        name: "description",
        content: "Cadastral-level geospatial view of land acquisition risk across monitored corridors.",
      },
      { property: "og:title", content: "GIS Risk Intelligence — LandVision AI" },
      { property: "og:description", content: "Geospatial land acquisition risk intelligence with satellite layers." },
    ],
  }),
  component: GisPage,
});

const CATS: RiskCategory[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

type BaseLayerMode = "osm" | "satellite";

function GisPage() {
  const { visibleProjects, predictions } = useLV();
  const { tStr, formatNumberIndian } = useTranslation();
  const [cats, setCats] = useState<RiskCategory[]>(CATS);
  const [state, setState] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [baseLayer, setBaseLayer] = useState<BaseLayerMode>("osm");
  const [showParcels, setShowParcels] = useState(true);
  const [showHeat, setShowHeat] = useState(true);

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

  const criticalCount = useMemo(
    () => filtered.filter((p) => predictions.get(p.id)?.riskCategory === "CRITICAL").length,
    [filtered, predictions],
  );

  const highCount = useMemo(
    () => filtered.filter((p) => predictions.get(p.id)?.riskCategory === "HIGH").length,
    [filtered, predictions],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="GIS Risk Intelligence & Geospatial Analytics"
        description="Cadastral parcels, corridor alignments, satellite imagery, and predicted risk hotspots on one unified canvas."
      >
        <div className="flex items-center gap-2">
          <DemoTag />
        </div>
      </PageHeader>

      {/* QUICK METRICS BAR */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="text-xs text-muted-foreground">{tStr("Monitored Corridors")}</div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">{formatNumberIndian(filtered.length)}</span>
            <span className="text-[11px] text-muted-foreground">{tStr("of")} {formatNumberIndian(visibleProjects.length)} {tStr("total")}</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="text-xs text-muted-foreground">{tStr("Critical Risk Corridors")}</div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-lg font-bold text-risk-critical">{formatNumberIndian(criticalCount)}</span>
            <span className="text-[11px] text-risk-critical font-medium">{tStr("Urgent intervention")}</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="text-xs text-muted-foreground">{tStr("High Risk Corridors")}</div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-lg font-bold text-risk-high">{formatNumberIndian(highCount)}</span>
            <span className="text-[11px] text-risk-high font-medium">{tStr("Clearance required")}</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="text-xs text-muted-foreground">{tStr("Active Map Layer")}</div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">
              {baseLayer === "osm" ? tStr("Street Map") : tStr("Satellite Imagery")}
            </span>
            <span className="text-[11px] text-primary font-medium">{tStr("High Precision")}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {/* SIDEBAR FILTERS & CONTROLS */}
        <Panel className="space-y-4 lg:col-span-1">
          <div>
            <p className="font-display text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Search className="size-3.5 text-primary" /> {tStr("Corridor Search")}
            </p>
            <div className="mt-2 relative">
              <input
                type="text"
                placeholder={tStr("Search corridor, district, ID…")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="font-display text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Globe2 className="size-3.5 text-primary" /> {tStr("Base Map Imagery")}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: "osm", label: "Street Map", icon: Compass },
                  { id: "satellite", label: "Satellite Imagery", icon: Satellite },
                ] as const
              ).map((m) => {
                const Icon = m.icon;
                const isActive = baseLayer === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setBaseLayer(m.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    <span>{tStr(m.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Filter className="size-3.5 text-primary" /> {tStr("Risk Category Legend & Filters")}
              </p>
            </div>
            <div className="mt-2.5 space-y-2">
              {[
                { cat: "LOW" as RiskCategory, label: "LOW", color: "#16A34A", bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-700 dark:text-emerald-400" },
                { cat: "MEDIUM" as RiskCategory, label: "MEDIUM", color: "#EAB308", bg: "bg-amber-500/15", border: "border-amber-500/40", text: "text-amber-700 dark:text-amber-400" },
                { cat: "HIGH" as RiskCategory, label: "HIGH", color: "#F87171", bg: "bg-rose-400/15", border: "border-rose-400/40", text: "text-rose-600 dark:text-rose-400" },
                { cat: "CRITICAL" as RiskCategory, label: "CRITICAL", color: "#B91C1C", bg: "bg-rose-700/20", border: "border-rose-700/50", text: "text-rose-700 dark:text-rose-300" },
              ].map(({ cat, label, color, bg, border, text }) => {
                const count = visibleProjects.filter((p) => {
                  const pred = predictions.get(p.id);
                  return pred && pred.riskCategory === cat;
                }).length;
                const active = cats.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      setCats((prev) =>
                        prev.includes(cat)
                          ? prev.filter((c) => c !== cat)
                          : [...prev, cat],
                      )
                    }
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                      active ? `${bg} ${border} ${text} shadow-2xs` : "border-border/60 bg-card/60 text-muted-foreground opacity-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
                      <span>{tStr(label)}</span>
                    </span>
                    <span className="rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-bold">
                      {formatNumberIndian(count)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="font-display text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Filter className="size-3.5 text-primary" /> {tStr("State Filter")}
            </p>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="">{tStr("All States")} ({formatNumberIndian(visibleProjects.length)})</option>
              {states.map((s) => {
                const count = visibleProjects.filter((p) => p.state === s).length;
                return (
                  <option key={s} value={s}>
                    {s} ({formatNumberIndian(count)})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-primary" /> {tStr("Geospatial Overlays")}
            </p>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showParcels}
                onChange={() => setShowParcels((v) => !v)}
                className="rounded border-border accent-primary"
              />
              {tStr("Cadastral parcel polygons")}
            </label>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={showHeat}
                onChange={() => setShowHeat((v) => !v)}
                className="rounded border-border accent-primary"
              />
              {tStr("Risk intensity heat layer")}
            </label>
          </div>

          <div className="rounded-lg bg-surface p-2.5 text-[11px] text-muted-foreground border border-border">
            <strong>{formatNumberIndian(filtered.length)}</strong> {tStr("corridors plotted on canvas. Click any marker for detailed parcel risk and delay parameters.")}
          </div>
        </Panel>

        {/* MAP CONTAINER */}
        <Panel className="lg:col-span-3 p-2">
          <div className="mb-2.5 flex items-center justify-between px-3 pt-2 text-sm font-semibold text-foreground">
            <div className="flex items-center gap-2">
              <MapIcon className="size-4 text-primary" aria-hidden /> {tStr("National Land Acquisition Corridor Map")}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="capitalize">{baseLayer} {tStr("imagery")}</span>
              <span>&middot;</span>
              <span>{tStr("GPS Cadastral Bounds")}</span>
            </div>
          </div>
          <GisMap
            projects={filtered}
            predictions={predictions}
            showParcels={showParcels}
            showHeat={showHeat}
            baseLayer={baseLayer}
            height="640px"
          />
        </Panel>
      </div>
    </div>
  );
}
