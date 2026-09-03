import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ArrowRight,
  Building2,
  FileText,
  Landmark,
  MapPin,
  Megaphone,
  TrendingUp,
  Users,
} from "lucide-react";
import { HeroMap } from "@/components/lv/HeroMap";
import { DemoTag, Panel } from "@/components/lv/panels";
import { RiskBadge, useCountUp } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";
import { overallProgress } from "@/lib/lv/risk";
import { noticeFor } from "@/lib/lv/public";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/public/")({
  head: () => ({
    meta: [
      { title: "Public Portal — LandVision AI" },
      {
        name: "description",
        content:
          "Public transparency portal for land acquisition projects — track progress, view notices and explore aggregate statistics.",
      },
      { property: "og:title", content: "LandVision AI — Public Portal" },
      {
        property: "og:description",
        content:
          "Transparency for land acquisition: project progress, notices and statistics for citizens.",
      },
    ],
  }),
  component: PublicHome,
});

const FLAGSHIP = ["nh16", "rrc", "idz", "tcd", "uip"];

function PublicHome() {
  const { visibleProjects, predictions } = useLV();
  const { t, tStr } = useTranslation();

  const stats = useMemo(() => {
    const states = new Set(visibleProjects.map((p) => p.state));
    const districts = new Set(visibleProjects.map((p) => p.district));
    const families = visibleProjects.reduce(
      (s, p) => s + p.affectedFamilies,
      0,
    );
    const progress = visibleProjects.length
      ? Math.round(
          visibleProjects.reduce((s, p) => s + overallProgress(p), 0) /
            visibleProjects.length,
        )
      : 0;
    return {
      projects: visibleProjects.length,
      states: states.size,
      districts: districts.size,
      families,
      progress,
    };
  }, [visibleProjects]);

  const featured = useMemo(() => {
    const byId = new Map(visibleProjects.map((p) => [p.id, p]));
    const picked = FLAGSHIP.map((id) => byId.get(id)).filter(
      (p): p is NonNullable<typeof p> => Boolean(p),
    );
    return (picked.length ? picked : visibleProjects.slice(0, 5)).slice(0, 3);
  }, [visibleProjects]);

  const notices = useMemo(() => {
    return [...visibleProjects]
      .map(noticeFor)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [visibleProjects]);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          className="grid-backdrop pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Landmark className="size-3.5 text-primary" aria-hidden />
              {tStr("Land acquisition transparency portal")}
            </span>
            <h1 className="mt-5 font-display text-4xl leading-tight font-bold text-foreground sm:text-5xl">
              {tStr("Track land acquisition")}{" "}
              <span className="ai-gradient-text">{tStr("in the open.")}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground">
              {tStr(
                "Explore active land acquisition projects, follow their progress stage by stage, read public notices and see aggregate statistics across states and districts — all in one place.",
              )}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/public/projects"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[var(--shadow-glow)]"
              >
                {t.nav.projects} <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                to="/public/map"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                {tStr("Open GIS map")}
              </Link>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <HeroMap />
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <PublicStat
              label={t.dashboard.totalProjects}
              value={stats.projects}
              icon={Building2}
            />
            <PublicStat
              label={t.gis.allStates}
              value={stats.states}
              icon={MapPin}
            />
            <PublicStat
              label={tStr("Districts")}
              value={stats.districts}
              icon={MapPin}
            />
            <PublicStat
              label={tStr("Affected Families")}
              value={stats.families}
              icon={Users}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            <DemoTag /> {tStr("Figures are demonstration values generated from a synthetic dataset — not official government data.")}
          </p>
        </div>
      </section>

      {/* FEATURED PROJECTS */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                Featured
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
                Projects in focus
              </h2>
            </div>
            <Link
              to="/public/projects"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {featured.map((p) => {
              const cat = predictions.get(p.id)?.riskCategory;
              const pct = overallProgress(p);
              return (
                <Link
                  key={p.id}
                  to="/public/projects/$projectId"
                  params={{ projectId: p.id }}
                  className="group block"
                >
                  <Panel className="h-full transition-transform group-hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {p.type}
                        </p>
                        <h3 className="mt-0.5 font-display text-base font-semibold text-foreground">
                          {p.name}
                        </h3>
                      </div>
                      {cat ? <RiskBadge category={cat} /> : null}
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" aria-hidden /> {p.district},{" "}
                      {p.state}
                    </p>
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Overall progress</span>
                        <span className="tabular-nums text-foreground">
                          {pct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-surface">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      Current stage ·{" "}
                      <span className="text-foreground">{p.currentStage}</span>
                    </p>
                  </Panel>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* GIS + NOTICES PREVIEW */}
      <section className="bg-surface">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <Panel className="flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest text-primary uppercase">
                Geospatial
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-foreground">
                See projects on the map
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                An interactive GIS view shows where projects are located and
                their current stage. Detailed risk analytics remain available
                only to authorised officers.
              </p>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {[
                  "Project locations",
                  "Layer controls",
                  "Stage indicators",
                  "District context",
                ].map((t) => (
                  <li
                    key={t}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              to="/public/map"
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[var(--shadow-glow)]"
            >
              Open GIS map <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Megaphone className="size-4 text-primary" aria-hidden />
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Latest public notices
                </h2>
              </div>
              <Link
                to="/public/notices"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                All notices <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {notices.map((n) => (
                <li key={n.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {n.category}
                    </span>
                    <time className="text-xs text-muted-foreground tabular-nums">
                      {new Date(n.date).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-foreground">
                    {n.projectName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {n.district}, {n.state}
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="size-3.5" aria-hidden /> Sample notices for
              demonstration — not official government notifications.
            </p>
          </Panel>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <Panel className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Explore the numbers behind acquisition
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Aggregate statistics on progress, compensation, R&R and project
                status across the country.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/public/statistics"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-[var(--shadow-glow)]"
              >
                <TrendingUp className="size-4" aria-hidden /> View statistics
              </Link>
              <Link
                to="/public/about"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                How it works
              </Link>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}

function PublicStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Building2;
}) {
  const n = useCountUp(value, 1100);
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <p className="font-display text-3xl font-bold text-foreground tabular-nums">
          {n.toLocaleString("en-IN")}
        </p>
        <Icon className="size-5 text-primary" aria-hidden />
      </div>
      <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}
