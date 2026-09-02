import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Polygon, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import type { Prediction, Project } from "@/lib/lv/types";
import { riskStyle } from "./risk";

const CARTO_KEY = import.meta.env["VITE_CARTO_API_KEY"] as string | undefined;
const TILE_URL = `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${
  CARTO_KEY ? `?api_key=${CARTO_KEY}` : ""
}`;

function colorFor(pred: Prediction | undefined) {
  if (!pred) return "var(--muted-foreground)";
  return riskStyle(pred.riskCategory).stroke;
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
  height = "100%",
}: {
  projects: Project[];
  predictions: Map<string, Prediction>;
  showParcels?: boolean;
  showHeat?: boolean;
  publicMode?: boolean;
  height?: string;
}) {
  const focus = projects.slice(0, 400);
  const corridor = focus.slice(0, 40).map((p) => [p.latitude, p.longitude] as [number, number]);

  return (
    <MapContainer
      center={[22.4, 79]}
      zoom={5}
      scrollWheelZoom
      style={{ height, width: "100%", borderRadius: 16 }}
      preferCanvas
    >
      <TileLayer
        url={TILE_URL}
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        subdomains={["a", "b", "c", "d"]}
      />
      <FitBounds projects={focus} />

      {corridor.length > 1 ? (
        <Polyline
          positions={corridor}
          pathOptions={{ color: "var(--primary)", weight: 1, opacity: 0.28, dashArray: "6 10" }}
        />
      ) : null}

      {focus.map((p) => {
        const pred = predictions.get(p.id);
        const color = publicMode ? "var(--primary)" : colorFor(pred);
        return (
          <div key={p.id}>
            {showParcels && focus.length <= 60
              ? parcels(p).map((ring, i) => (
                  <Polygon
                    key={`${p.id}-parcel-${i}`}
                    positions={ring}
                    pathOptions={{
                      color: "var(--primary)",
                      weight: 1,
                      opacity: 0.65,
                      fillColor: color,
                      fillOpacity: i % 3 === 0 ? 0.18 : 0.06,
                    }}
                  />
                ))
              : null}
            {showHeat && !publicMode ? (
              <CircleMarker
                center={[p.latitude, p.longitude]}
                radius={Math.max(10, (pred?.riskScore ?? 20) / 3)}
                pathOptions={{ color: "transparent", fillColor: color, fillOpacity: 0.16 }}
              />
            ) : null}
            <CircleMarker
              center={[p.latitude, p.longitude]}
              radius={publicMode ? 5 : 4 + (pred?.riskScore ?? 0) / 28}
              pathOptions={{ color, weight: 2, fillColor: color, fillOpacity: 0.55 }}
            >
              <Popup>
                <div className="min-w-52 space-y-1">
                  <p className="font-display text-sm font-semibold text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.district}, {p.state} · {p.type}
                  </p>
                  {publicMode ? (
                    <p className="text-xs text-muted-foreground">
                      Current stage: <span className="text-foreground">{p.currentStage}</span>
                    </p>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground">
                        Risk:{" "}
                        <span style={{ color }} className="font-semibold">
                          {pred?.riskScore ?? "—"} / 100 — {pred?.riskCategory}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Delay probability:{" "}
                        <span className="text-foreground">{pred?.delayProbability}%</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Current stage: <span className="text-foreground">{p.currentStage}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Legal cases: <span className="text-foreground">{p.params.legalDisputes}</span> ·
                        Compensation:{" "}
                        <span className="text-foreground">{p.params.compensationPct}%</span>
                      </p>
                    </>
                  )}
                  <Link
                    to={publicMode ? "/public/projects/$projectId" : "/app/projects/$projectId"}
                    params={{ projectId: p.id }}
                    className="mt-2 inline-block rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground"
                  >
                    {publicMode ? "View project" : "View full project"}
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
