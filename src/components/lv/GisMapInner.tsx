import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Polygon, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import type { Prediction, Project } from "@/lib/lv/types";
import { STATUTORY_RISK_HEX } from "./risk";

const CARTO_KEY = import.meta.env["VITE_CARTO_API_KEY"] as string | undefined;

export type GisBaseLayer = "light" | "dark" | "satellite" | "osm";

const TILE_CONFIGS: Record<GisBaseLayer, { url: string; attribution: string; maxZoom?: number; subdomains?: string[] }> = {
  light: {
    url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${CARTO_KEY ? `?api_key=${CARTO_KEY}` : ""}`,
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    subdomains: ["a", "b", "c", "d"],
    maxZoom: 19,
  },
  dark: {
    url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${CARTO_KEY ? `?api_key=${CARTO_KEY}` : ""}`,
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    subdomains: ["a", "b", "c", "d"],
    maxZoom: 19,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; Esri &mdash; World Imagery',
    maxZoom: 18,
  },
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; OpenStreetMap contributors',
    subdomains: ["a", "b", "c"],
    maxZoom: 19,
  },
};

export function colorFor(pred: Prediction | undefined): string {
  if (!pred) return STATUTORY_RISK_HEX.UNKNOWN;
  return STATUTORY_RISK_HEX[pred.riskCategory] || STATUTORY_RISK_HEX.UNKNOWN;
}

/** Deterministic cadastral parcels around a project centroid. */
function parcels(p: Project): [number, number][][] {
  const out: [number, number][][] = [];
  const seed = p.projectId.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  for (let i = 0; i < 6; i++) {
    const a = ((seed + i * 37) % 100) / 4000;
    const b = ((seed + i * 91) % 100) / 4000;
    const lat = p.latitude + (i % 3) * 0.012 - 0.012 + a;
    const lng = p.longitude + Math.floor(i / 3) * 0.016 - 0.008 + b;
    out.push([
      [lat, lng],
      [lat + 0.009, lng + 0.002],
      [lat + 0.011, lng + 0.014],
      [lat + 0.001, lng + 0.012],
    ]);
  }
  return out;
}

function FitBounds({ projects }: { projects: Project[] }) {
  const map = useMap();
  useEffect(() => {
    if (projects.length === 0) return;
    if (projects.length === 1) {
      const first = projects[0]!;
      map.setView([first.latitude, first.longitude], 11);
      return;
    }
    const lats = projects.map((p) => p.latitude);
    const lngs = projects.map((p) => p.longitude);
    map.fitBounds(
      [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ],
      { padding: [40, 40] },
    );
  }, [projects, map]);
  return null;
}

export default function GisMapInner({
  projects,
  predictions,
  showParcels = true,
  showHeat = false,
  publicMode = false,
  baseLayer = "light",
  height = "100%",
}: {
  projects: Project[];
  predictions: Map<string, Prediction>;
  showParcels?: boolean;
  showHeat?: boolean;
  publicMode?: boolean;
  baseLayer?: GisBaseLayer;
  height?: string;
}) {
  const focus = projects.slice(0, 400);
  const corridor = focus.slice(0, 40).map((p) => [p.latitude, p.longitude] as [number, number]);
  const activeTile = TILE_CONFIGS[baseLayer] ?? TILE_CONFIGS.light;

  return (
    <MapContainer
      center={[22.4, 79]}
      zoom={5}
      scrollWheelZoom
      style={{ height, width: "100%", borderRadius: 16 }}
      preferCanvas
    >
      <TileLayer
        key={baseLayer}
        url={activeTile.url}
        attribution={activeTile.attribution}
        subdomains={activeTile.subdomains ?? []}
        maxZoom={activeTile.maxZoom ?? 19}
      />
      <FitBounds projects={focus} />

      {corridor.length > 1 ? (
        <Polyline
          positions={corridor}
          pathOptions={{ color: "#16A34A", weight: 1.5, opacity: 0.35, dashArray: "6 10" }}
        />
      ) : null}

      {focus.map((p) => {
        const pred = predictions.get(p.id);
        const color = colorFor(pred);
        const isHighOrCrit = pred?.riskCategory === "HIGH" || pred?.riskCategory === "CRITICAL";

        return (
          <div key={p.id}>
            {showParcels && focus.length <= 60
              ? parcels(p).map((ring, i) => (
                  <Polygon
                    key={`${p.id}-parcel-${i}`}
                    positions={ring}
                    pathOptions={{
                      color: color,
                      weight: 1.5,
                      opacity: 0.75,
                      fillColor: color,
                      fillOpacity: i % 3 === 0 ? 0.25 : 0.08,
                    }}
                  />
                ))
              : null}
            {showHeat ? (
              <CircleMarker
                center={[p.latitude, p.longitude]}
                radius={Math.max(12, (pred?.riskScore ?? 25) / 2.5)}
                pathOptions={{ color: "transparent", fillColor: color, fillOpacity: 0.22 }}
              />
            ) : null}
            <CircleMarker
              center={[p.latitude, p.longitude]}
              radius={isHighOrCrit ? 7.5 : 5.5}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: color,
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <div className="min-w-64 space-y-2 p-1 text-xs">
                  <div className="border-b border-border pb-1.5">
                    <p className="font-display text-sm font-bold text-foreground">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      {p.district}, {p.state} · {p.type}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-muted-foreground">Statutory Risk:</span>
                    <span
                      style={{ backgroundColor: `${color}20`, color, borderColor: `${color}60` }}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black border"
                    >
                      ● {pred?.riskCategory ?? "UNKNOWN"} ({pred?.riskScore ?? "—"}/100)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-surface/80 p-2 text-[11px]">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Current Stage:</span>
                      <strong className="text-foreground font-semibold">{p.currentStage}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Land Required:</span>
                      <strong className="text-foreground font-semibold">{p.landArea} Ha</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Affected Families:</span>
                      <strong className="text-foreground font-semibold">{p.affectedFamilies.toLocaleString("en-IN")}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Legal Disputes:</span>
                      <strong className="text-foreground font-semibold">{p.params.legalDisputes > 0 ? `${p.params.legalDisputes} Pending` : "None"}</strong>
                    </div>
                  </div>

                  {pred && (
                    <div className="text-[11px] text-muted-foreground">
                      Expected Delay: <strong className="text-foreground font-bold">{pred.expectedDelayDays} Days ({Math.round((pred.expectedDelayDays / 30.4) * 10) / 10} Mos)</strong>
                    </div>
                  )}

                  <Link
                    to={publicMode ? "/public/projects/$projectId" : "/app/projects/$projectId"}
                    params={{ projectId: p.id }}
                    className="mt-2 block w-full text-center rounded-lg bg-primary py-1.5 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-90 transition-opacity"
                  >
                    {publicMode ? "View Public Project Report" : "View Full Project Workspace"}
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          </div>
        );
      })}
    </MapContainer>
  );
}

