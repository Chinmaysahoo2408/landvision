import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bell,
  KeyRound,
  Map as MapIcon,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { DemoTag, Panel, PanelTitle, PageHeader } from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { ROLE_LABEL, useLV } from "@/lib/lv/store";
import { categorize, DEFAULT_THRESHOLDS } from "@/lib/lv/risk";
import type { RiskCategory, Thresholds } from "@/lib/lv/types";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — LandVision AI" },
      {
        name: "description",
        content:
          "Configure risk thresholds, notifications, map defaults and review security posture for LandVision AI.",
      },
      { property: "og:title", content: "Settings — LandVision AI" },
      {
        property: "og:description",
        content: "Platform configuration and security posture.",
      },
    ],
  }),
  component: SettingsPage,
});

type Section = "general" | "notifications" | "map" | "security";

const SECTIONS: {
  id: Section;
  label: string;
  icon: typeof SlidersHorizontal;
}[] = [
  { id: "general", label: "General", icon: SlidersHorizontal },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "map", label: "Map", icon: MapIcon },
  { id: "security", label: "Security", icon: KeyRound },
];

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-border bg-surface p-3">
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

function SettingsPage() {
  const {
    thresholds,
    setThresholds,
    session,
    visibleProjects,
    predictions,
    log,
  } = useLV();
  const [active, setActive] = useState<Section>("general");

  // General — risk thresholds (genuinely wired to the prediction engine).
  const [draft, setDraft] = useState<Thresholds>(thresholds);

  // Notification & map preferences are UI preferences stored in this session.
  const [notify, setNotify] = useState({
    critical: true,
    high: true,
    digest: false,
    legal: true,
  });
  const [mapPrefs, setMapPrefs] = useState({
    parcels: true,
    heat: false,
    labels: true,
  });

  const preview = useMemo(() => {
    const dist: Record<RiskCategory, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    for (const p of visibleProjects) {
      const pr = predictions.get(p.id);
      if (!pr) continue;
      dist[categorize(pr.riskScore, draft)] += 1;
    }
    return dist;
  }, [visibleProjects, predictions, draft]);

  const thresholdsValid =
    draft.medium < draft.high &&
    draft.high < draft.critical &&
    draft.critical <= 100;

  const applyThresholds = () => {
    if (!thresholdsValid) {
      toast.error("Thresholds must increase: medium < high < critical ≤ 100.");
      return;
    }
    setThresholds(draft);
    log({
      user: session?.name ?? "System",
      action: "Updated risk thresholds",
      entity: "Settings",
      entityId: "risk-thresholds",
      oldValue: `${thresholds.medium}/${thresholds.high}/${thresholds.critical}`,
      newValue: `${draft.medium}/${draft.high}/${draft.critical}`,
    });
    toast.success("Risk thresholds applied across the platform.");
  };

  const resetThresholds = () => {
    setDraft(DEFAULT_THRESHOLDS);
    toast.message("Reset to defaults", {
      description: "Click Apply to save the change.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure how LandVision scores risk, notifies officers and renders maps. Changes to thresholds take effect immediately."
      >
        <DemoTag />
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 lg:flex-col">
          {SECTIONS.map((s) => {
            const on = s.id === active;
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  on
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-card"
                }`}
              >
                <s.icon className="size-4" aria-hidden /> {s.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-6">
          {active === "general" ? (
            <Panel>
              <PanelTitle
                title="Risk thresholds"
                subtitle="Score boundaries used to classify every project. Applied instantly to all predictions."
                icon={Sparkles}
                ai
                action={
                  <button
                    onClick={resetThresholds}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-card"
                  >
                    <RotateCcw className="size-3.5" aria-hidden /> Defaults
                  </button>
                }
              />
              <div className="grid gap-5 sm:grid-cols-3">
                {(["medium", "high", "critical"] as const).map((key) => (
                  <label key={key} className="text-xs text-muted-foreground">
                    <span className="mb-1 block capitalize">
                      {key} threshold
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={draft[key]}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          [key]: Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={draft[key]}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          [key]: Number(e.target.value),
                        }))
                      }
                      className="mt-2 w-full accent-[var(--primary)]"
                      aria-label={`${key} threshold slider`}
                    />
                  </label>
                ))}
              </div>

              <div className="mt-5 rounded-lg border border-border bg-surface p-4">
                <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Live preview —{" "}
                  {visibleProjects.length.toLocaleString("en-IN")} projects
                  re-classified
                </p>
                <div className="flex flex-wrap gap-4">
                  {(
                    ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskCategory[]
                  ).map((c) => (
                    <div key={c} className="flex items-center gap-2">
                      <RiskBadge category={c} />
                      <span className="text-sm font-semibold text-foreground tabular-nums">
                        {preview[c]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {!thresholdsValid ? (
                <p className="mt-3 text-xs text-[var(--risk-high)]">
                  Thresholds must increase in order: medium &lt; high &lt;
                  critical ≤ 100.
                </p>
              ) : null}

              <div className="mt-5">
                <button
                  onClick={applyThresholds}
                  disabled={!thresholdsValid}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                >
                  <Save className="size-4" aria-hidden /> Apply thresholds
                </button>
              </div>
            </Panel>
          ) : null}

          {active === "notifications" ? (
            <Panel>
              <PanelTitle
                title="Notification preferences"
                subtitle="Choose which events raise an alert for your account."
                icon={Bell}
              />
              <div className="space-y-3">
                <Toggle
                  label="Critical risk alerts"
                  description="Notify when a project crosses the critical threshold."
                  checked={notify.critical}
                  onChange={(v) => setNotify((n) => ({ ...n, critical: v }))}
                />
                <Toggle
                  label="High risk alerts"
                  description="Notify when a project reaches high risk."
                  checked={notify.high}
                  onChange={(v) => setNotify((n) => ({ ...n, high: v }))}
                />
                <Toggle
                  label="New legal dispute alerts"
                  description="Notify when a new legal dispute is recorded against a project."
                  checked={notify.legal}
                  onChange={(v) => setNotify((n) => ({ ...n, legal: v }))}
                />
                <Toggle
                  label="Weekly digest"
                  description="A weekly summary of risk movement across your jurisdiction."
                  checked={notify.digest}
                  onChange={(v) => setNotify((n) => ({ ...n, digest: v }))}
                />
              </div>
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() =>
                    toast.success(
                      "Notification preferences saved for this session.",
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Save className="size-4" aria-hidden /> Save preferences
                </button>
                <span className="text-xs text-muted-foreground">
                  Preferences are stored in your browser for this demo.
                </span>
              </div>
            </Panel>
          ) : null}

          {active === "map" ? (
            <Panel>
              <PanelTitle
                title="Map defaults"
                subtitle="Default layers applied when you open the GIS view."
                icon={MapIcon}
              />
              <div className="space-y-3">
                <Toggle
                  label="Show parcel boundaries"
                  description="Overlay approximate parcel outlines on the map by default."
                  checked={mapPrefs.parcels}
                  onChange={(v) => setMapPrefs((m) => ({ ...m, parcels: v }))}
                />
                <Toggle
                  label="Show risk heatmap"
                  description="Render a risk-weighted heat layer on load."
                  checked={mapPrefs.heat}
                  onChange={(v) => setMapPrefs((m) => ({ ...m, heat: v }))}
                />
                <Toggle
                  label="Show project labels"
                  description="Display project name labels next to markers."
                  checked={mapPrefs.labels}
                  onChange={(v) => setMapPrefs((m) => ({ ...m, labels: v }))}
                />
              </div>
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() =>
                    toast.success("Map defaults saved for this session.")
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Save className="size-4" aria-hidden /> Save defaults
                </button>
                <span className="text-xs text-muted-foreground">
                  Preferences are stored in your browser for this demo.
                </span>
              </div>
            </Panel>
          ) : null}

          {active === "security" ? (
            <Panel>
              <PanelTitle
                title="Security &amp; access"
                subtitle="Your current session and how LandVision handles secrets."
                icon={KeyRound}
              />
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-surface p-3">
                  <dt className="text-xs text-muted-foreground">
                    Signed in as
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {session?.name ?? "—"}
                  </dd>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <dt className="text-xs text-muted-foreground">Role</dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {session ? ROLE_LABEL[session.role] : "—"}
                  </dd>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <dt className="text-xs text-muted-foreground">
                    Account email
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {session?.email ?? "—"}
                  </dd>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3">
                  <dt className="text-xs text-muted-foreground">
                    Jurisdiction
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {session?.district ?? session?.state ?? "National"}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <KeyRound className="size-4 text-primary" aria-hidden />{" "}
                  Credential handling
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  LandVision never displays API keys, access tokens or
                  connection secrets in the interface. Any keys used to reach a
                  prediction service or map provider are held server-side in
                  environment configuration and are never sent to the browser.
                  There are no secrets to view or copy on this screen by design.
                </p>
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
