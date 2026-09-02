import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Map as MapIcon } from "lucide-react";
import { useLV } from "@/lib/lv/store";
import { GisMap } from "@/components/lv/GisMap";
import { DemoTag, Panel, PageHeader } from "@/components/lv/panels";
import type { RiskCategory } from "@/lib/lv/types";

export const Route = createFileRoute("/app/gis")({
  head: () => ({
    meta: [
      { title: "GIS risk map — LandVision AI" },
      {
        name: "description",
        content: "Cadastral-level geospatial view of land acquisition risk across monitored corridors.",
      },
      { property: "og:title", content: "GIS risk map — LandVision AI" },
      { property: "og:description", content: "Geospatial land acquisition risk intelligence." },
    ],
  }),
  component: GisPage,
});

const CATS: RiskCategory[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function GisPage() {
  const { visibleProjects, predictions } = useLV();
  const [cats, setCats] = useState<RiskCategory[]>(CATS);
  const [state, setState] = useState("");
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
        return true;
      }),
    [visibleProjects, predictions, cats, state],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="GIS risk intelligence"
        description="Cadastral parcels, corridor alignments and predicted risk hotspots on one canvas."
      >
        <DemoTag />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-4">
        <Panel className="space-y-4 lg:col-span-1">
          <p className="font-display text-sm font-semibold text-foreground">Layers &amp; filters</p>
          <div className="space-y-2">
            {CATS.map((c) => (
              <label key={c} className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={cats.includes(c)}
                  onChange={() =>
                    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
                  }
                />
                {c}
              </label>
            ))}
          </div>
          <label className="block text-xs text-muted-foreground">
            State
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-card px-2 py-1.5 text-xs text-foreground"
            >
              <option value="">All states</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={showParcels} onChange={() => setShowParcels((v) => !v)} />
            Cadastral parcels
          </label>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={showHeat} onChange={() => setShowHeat((v) => !v)} />
            Risk heat layer
          </label>
          <p className="text-xs text-muted-foreground">
            {filtered.length.toLocaleString("en-IN")} projects match. First 400 are rendered for
            performance.
          </p>
        </Panel>

        <Panel className="lg:col-span-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapIcon className="size-4 text-primary" aria-hidden /> National acquisition map
          </div>
          <GisMap
            projects={filtered}
            predictions={predictions}
            showParcels={showParcels}
            showHeat={showHeat}
            height="620px"
          />
        </Panel>
      </div>
    </div>
  );
}
