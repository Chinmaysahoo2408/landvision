import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Layers, Map as MapIcon, ShieldCheck } from "lucide-react";
import { DemoTag, Panel, PageHeader } from "@/components/lv/panels";
import { GisMap } from "@/components/lv/GisMap";
import { useLV } from "@/lib/lv/store";

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

function PublicMap() {
  const { visibleProjects, predictions } = useLV();
  const [parcels, setParcels] = useState(false);
  const [heat, setHeat] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <PageHeader
        title="GIS project map"
        description="Locate land acquisition projects across the country. Select a marker to open its public project page."
      >
        <DemoTag />
      </PageHeader>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="space-y-4">
          <Panel>
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" aria-hidden />
              <h2 className="font-display text-sm font-semibold text-foreground">
                Layers
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              <LayerToggle
                label="Parcel boundaries"
                description="Approximate acquisition outlines"
                checked={parcels}
                onChange={setParcels}
              />
              <LayerToggle
                label="Density heatmap"
                description="Concentration of projects"
                checked={heat}
                onChange={setHeat}
              />
            </div>
          </Panel>

          <Panel>
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="size-4 text-primary" aria-hidden /> Public
              view
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This map shows project locations and current stage only. Detailed
              risk scores and landowner information are not shown on the public
              portal.
            </p>
          </Panel>

          <Panel>
            <div className="flex items-center gap-2">
              <MapIcon className="size-4 text-primary" aria-hidden />
              <h2 className="font-display text-sm font-semibold text-foreground">
                On the map
              </h2>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">
              {visibleProjects.length.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground">projects plotted</p>
          </Panel>
        </div>

        <Panel className="p-2">
          <GisMap
            projects={visibleProjects}
            predictions={predictions}
            showParcels={parcels}
            showHeat={heat}
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
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        <span className="block text-xs text-muted-foreground">
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
