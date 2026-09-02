import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import type { Prediction, Project } from "@/lib/lv/types";

const Inner = lazy(() => import("./GisMapInner"));

function MapSkeleton({ height }: { height: string }) {
  return (
    <div
      className="grid-backdrop grid place-items-center rounded-2xl border border-border bg-surface"
      style={{ height }}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
        Loading geospatial layers…
      </div>
    </div>
  );
}

export function GisMap(props: {
  projects: Project[];
  predictions: Map<string, Prediction>;
  showParcels?: boolean;
  showHeat?: boolean;
  publicMode?: boolean;
  height?: string;
}) {
  const height = props.height ?? "560px";
  return (
    <ClientOnly fallback={<MapSkeleton height={height} />}>
      <Suspense fallback={<MapSkeleton height={height} />}>
        <Inner {...props} height={height} />
      </Suspense>
    </ClientOnly>
  );
}
