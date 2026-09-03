import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  Clock,
  Layers,
  Play,
  RotateCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { DemoTag, PageHeader, Panel, PanelTitle } from "@/components/lv/panels";
import { RiskBadge, RiskGauge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";
import type { Prediction, ProjectType, RiskParameters, Stage } from "@/lib/lv/types";
import { PROJECT_TYPES, STAGES } from "@/lib/lv/types";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/app/predictor")({
  component: PredictorPage,
  head: () => ({
    meta: [
      { title: "AI Delay Predictor & Sandbox — LandVision AI" },
      {
        name: "description",
        content:
          "Interactive AI/ML delay risk prediction engine. Tune 17+ land acquisition parameters to compute delay probabilities, bottleneck drivers, and AI recommendations.",
      },
      { property: "og:title", content: "AI Delay Predictor — LandVision AI" },
    ],
  }),
});

const DEFAULT_PARAMS: RiskParameters = {
  projectType: "Highway",
  landArea: 642.5,
  affectedFamilies: 1860,
  compensationPct: 50,
  approvalCompletionPct: 62,
  approvalDelayDays: 78,
  legalDisputes: 12,
  resolvedDisputes: 4,
  documentationPct: 48,
  pendingNotifications: 3,
  ownershipConflicts: 18,
  rrPct: 35,
  possessionPct: 22,
  stakeholderResponsiveness: 42,
  stakeholderBreakdown: {
    landowners: 38,
    districtAdmin: 72,
    governmentDepts: 65,
    legalAuthorities: 32,
    rrAuthorities: 45,
    projectAuthorities: 80,
  },
  departmentPerformance: 54,
  projectComplexity: "High",
  currentAcquisitionProgress: 36,
  historicalPerformance: 48,
  pendingApprovals: 5,
};

function PredictorPage() {
  const { predictCustom, projects, addIntervention, session } = useLV();
  const { tStr, formatNumberIndian } = useTranslation();
  const [params, setParams] = useState<RiskParameters>(DEFAULT_PARAMS);
  const [stage, setStage] = useState<Stage>("Legal Resolution");
  const [projectName, setProjectName] = useState("NH-16 6-Lane Expansion Corridor");
  const [isCalculating, setIsCalculating] = useState(false);
  const [prediction, setPrediction] = useState<Prediction>(() =>
    predictCustom(DEFAULT_PARAMS, "NH-16 6-Lane Expansion Corridor"),
  );

  const handlePredict = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const pred = predictCustom(params, projectName);
      setPrediction(pred);
      setIsCalculating(false);
      toast.success("Delay risk prediction updated successfully!");
    }, 400);
  };

  const loadPreset = (projectId: string) => {
    const p = projects.find((x) => x.id === projectId || x.projectId === projectId);
    if (!p) return;
    setParams(p.params);
    setStage(p.currentStage);
    setProjectName(p.name);
    const pred = predictCustom(p.params, p.name);
    setPrediction(pred);
    toast.info(`Loaded preset: ${p.name}`);
  };

  const updateParam = <K extends keyof RiskParameters>(key: K, val: RiskParameters[K]) => {
    setParams((prev) => ({ ...prev, [key]: val }));
  };

  const updateStakeholder = (k: keyof RiskParameters["stakeholderBreakdown"], val: number) => {
    setParams((prev) => {
      const sb = { ...prev.stakeholderBreakdown, [k]: val };
      const avg = Math.round(
        (sb.landowners + sb.districtAdmin + sb.governmentDepts + sb.legalAuthorities + sb.rrAuthorities + sb.projectAuthorities) / 6,
      );
      return { ...prev, stakeholderBreakdown: sb, stakeholderResponsiveness: avg };
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Delay Risk Predictor & What-If Simulator"
        description="Interactive decision-support simulator. Adjust 17+ administrative, financial, legal, and stakeholder parameters to calculate delay probability and generate AI action recommendations."
      >
        <DemoTag />
      </PageHeader>

      {/* PRESETS BAR */}
      <Panel className="border-primary/30 bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Load Flagship Project Presets:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadPreset("nh16")}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary/50"
            >
              NH-16 Corridor (High Risk)
            </button>
            <button
              onClick={() => loadPreset("rrc")}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary/50"
            >
              Freight Corridor (Railway)
            </button>
            <button
              onClick={() => loadPreset("idz")}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary/50"
            >
              Dahej Industrial (Low Risk)
            </button>
            <button
              onClick={() => loadPreset("tcd")}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:border-primary/50"
            >
              Rajasthan Grid (Power)
            </button>
            <button
              onClick={() => {
                setParams(DEFAULT_PARAMS);
                setProjectName("Custom Corridor Simulation");
                handlePredict();
              }}
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3" /> Reset
            </button>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-12">
        {/* LEFT COLUMN: 17 INPUT PARAMETERS */}
        <div className="space-y-4 xl:col-span-7">
          {/* GENERAL INFO */}
          <Panel>
            <PanelTitle title="1. Project Classification & Scope" icon={Layers} />
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Project Type</label>
                <select
                  value={params.projectType}
                  onChange={(e) => updateParam("projectType", e.target.value as ProjectType)}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground"
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Current Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as Stage)}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Land Area (Hectares / Acres)</label>
                <input
                  type="number"
                  value={params.landArea}
                  onChange={(e) => updateParam("landArea", Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Affected Families</label>
                <input
                  type="number"
                  value={params.affectedFamilies}
                  onChange={(e) => updateParam("affectedFamilies", Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Project Complexity</label>
                <select
                  value={params.projectComplexity}
                  onChange={(e) => updateParam("projectComplexity", e.target.value as RiskParameters["projectComplexity"])}
                  className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Extreme">Extreme</option>
                </select>
              </div>
            </div>
          </Panel>

          {/* CRITICAL RISK DRIVERS SLIDERS */}
          <Panel>
            <PanelTitle title="2. Financial, Legal & Administrative Metrics" icon={Scale} />
            <div className="grid gap-4 sm:grid-cols-2">
              {/* COMPENSATION */}
              <div className="space-y-1.5 rounded-lg border border-border p-3">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">Compensation Disbursed (%)</span>
                  <span className="font-bold text-primary tabular-nums">{params.compensationPct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={params.compensationPct}
                  onChange={(e) => updateParam("compensationPct", Number(e.target.value))}
                  className="w-full accent-[var(--primary)]"
                />
                <p className="text-[10px] text-muted-foreground">Direct bank transfers to affected landowners</p>
              </div>

              {/* LEGAL DISPUTES */}
              <div className="space-y-1.5 rounded-lg border border-border p-3">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">Active Legal Disputes</span>
                  <span className="font-bold text-risk-critical tabular-nums">{params.legalDisputes} cases</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  value={params.legalDisputes}
                  onChange={(e) => updateParam("legalDisputes", Number(e.target.value))}
                  className="w-full accent-[var(--risk-critical)]"
                />
                <p className="text-[10px] text-muted-foreground">Litigation pending before Revenue / High Court</p>
              </div>

              {/* POSSESSION */}
              <div className="space-y-1.5 rounded-lg border border-border p-3">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">Possession Handover (%)</span>
                  <span className="font-bold text-primary tabular-nums">{params.possessionPct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={params.possessionPct}
                  onChange={(e) => updateParam("possessionPct", Number(e.target.value))}
                  className="w-full accent-[var(--primary)]"
                />
                <p className="text-[10px] text-muted-foreground">Physical possession transferred to authority</p>
              </div>

              {/* R&R PROGRESS */}
              <div className="space-y-1.5 rounded-lg border border-border p-3">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">R&R Progress (%)</span>
                  <span className="font-bold text-primary tabular-nums">{params.rrPct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={params.rrPct}
                  onChange={(e) => updateParam("rrPct", Number(e.target.value))}
                  className="w-full accent-[var(--primary)]"
                />
                <p className="text-[10px] text-muted-foreground">Resettlement sites & entitlements disbursed</p>
              </div>

              {/* DOCUMENTATION */}
              <div className="space-y-1.5 rounded-lg border border-border p-3">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">Documentation Verified (%)</span>
                  <span className="font-bold text-primary tabular-nums">{params.documentationPct}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={params.documentationPct}
                  onChange={(e) => updateParam("documentationPct", Number(e.target.value))}
                  className="w-full accent-[var(--primary)]"
                />
                <p className="text-[10px] text-muted-foreground">Land record mutation & RoR title clearance</p>
              </div>

              {/* APPROVAL DELAY DAYS */}
              <div className="space-y-1.5 rounded-lg border border-border p-3">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">Approval Delay Days</span>
                  <span className="font-bold text-risk-high tabular-nums">{params.approvalDelayDays} days</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={180}
                  value={params.approvalDelayDays}
                  onChange={(e) => updateParam("approvalDelayDays", Number(e.target.value))}
                  className="w-full accent-[var(--risk-high)]"
                />
                <p className="text-[10px] text-muted-foreground">Statutory environmental & revenue file clearance delay</p>
              </div>

              {/* OWNERSHIP CONFLICTS */}
              <div className="space-y-1.5 rounded-lg border border-border p-3">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">Land Ownership Conflicts</span>
                  <span className="font-bold text-foreground tabular-nums">{params.ownershipConflicts} parcels</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  value={params.ownershipConflicts}
                  onChange={(e) => updateParam("ownershipConflicts", Number(e.target.value))}
                  className="w-full accent-[var(--primary)]"
                />
                <p className="text-[10px] text-muted-foreground">Family co-sharer or boundary contestations</p>
              </div>

              {/* PENDING NOTIFICATIONS */}
              <div className="space-y-1.5 rounded-lg border border-border p-3">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">Pending Sec 11/19 Notifications</span>
                  <span className="font-bold text-foreground tabular-nums">{params.pendingNotifications}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={8}
                  value={params.pendingNotifications}
                  onChange={(e) => updateParam("pendingNotifications", Number(e.target.value))}
                  className="w-full accent-[var(--primary)]"
                />
                <p className="text-[10px] text-muted-foreground">Gazette publications awaiting issuance</p>
              </div>
            </div>
          </Panel>

          {/* STAKEHOLDER RESPONSIVENESS BREAKDOWN */}
          <Panel>
            <PanelTitle title="3. Stakeholder Responsiveness Breakdown" icon={UserCheck} />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { key: "landowners", label: "Landowners", val: params.stakeholderBreakdown.landowners },
                { key: "districtAdmin", label: "District Admin", val: params.stakeholderBreakdown.districtAdmin },
                { key: "governmentDepts", label: "Govt Departments", val: params.stakeholderBreakdown.governmentDepts },
                { key: "legalAuthorities", label: "Legal Authorities", val: params.stakeholderBreakdown.legalAuthorities },
                { key: "rrAuthorities", label: "R&R Authority", val: params.stakeholderBreakdown.rrAuthorities },
                { key: "projectAuthorities", label: "Project Authority", val: params.stakeholderBreakdown.projectAuthorities },
              ].map((s) => (
                <div key={s.key} className="rounded-lg border border-border bg-surface p-2.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-medium text-foreground">{s.label}</span>
                    <span className="font-bold tabular-nums text-primary">{s.val}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={s.val}
                    onChange={(e) =>
                      updateStakeholder(
                        s.key as keyof RiskParameters["stakeholderBreakdown"],
                        Number(e.target.value),
                      )
                    }
                    className="mt-1 w-full accent-[var(--primary)]"
                  />
                </div>
              ))}
            </div>
          </Panel>

          {/* PROMINENT ACTION BUTTON */}
          <div className="sticky bottom-4 z-20">
            <button
              onClick={handlePredict}
              disabled={isCalculating}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:scale-[1.01] hover:shadow-[var(--shadow-glow)] disabled:opacity-60"
            >
              <Zap className="size-4 animate-pulse" />
              {isCalculating ? "CALCULATING ML INFERENCE..." : "PREDICT DELAY RISK"}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: PREDICTION OUTPUTS, TOP DELAY DRIVERS & RECOMMENDATIONS */}
        <div className="space-y-4 xl:col-span-5">
          {/* PRIMARY PREDICTION CARD */}
          <Panel className="border-primary/40 bg-gradient-to-b from-card to-primary/5">
            <PanelTitle
              title="AI Delay Risk Output"
              subtitle="Predictive estimation from LandVision AI v2.4 Engine"
              icon={Brain}
              ai
            />

            <div className="mt-2 flex flex-col items-center justify-center">
              <RiskGauge score={prediction.riskScore} category={prediction.riskCategory} size={180} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
              <div className="text-center">
                <p className="text-[10px] tracking-wide text-muted-foreground uppercase">Delay Probability</p>
                <p className="mt-0.5 font-display text-xl font-bold text-foreground tabular-nums">
                  {prediction.delayProbability}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] tracking-wide text-muted-foreground uppercase">Expected Delay</p>
                <p className="mt-0.5 font-display text-xl font-bold text-risk-high tabular-nums">
                  {prediction.expectedDelayMonths} mo
                </p>
                <p className="text-[10px] text-muted-foreground">({prediction.expectedDelayDays} days)</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] tracking-wide text-muted-foreground uppercase">Risk Level</p>
                <p className="mt-1">
                  <RiskBadge category={prediction.riskCategory} />
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] tracking-wide text-muted-foreground uppercase">Bottleneck Stage</p>
                <p className="mt-0.5 text-xs font-semibold text-foreground">{prediction.bottleneckStage}</p>
              </div>
            </div>
          </Panel>

          {/* TOP 5 DELAY DRIVERS */}
          <Panel>
            <PanelTitle
              title="Top Delay Drivers (Factor Attribution)"
              subtitle="SHAP-normalized contributor weightings to delay risk"
              icon={AlertTriangle}
            />
            <div className="space-y-3">
              {prediction.topDelayDrivers.map((d, i) => (
                <div key={d.factor} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      {i + 1}. {d.factor}
                    </span>
                    <span className="font-bold tabular-nums text-foreground">{d.contribution}% share</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${d.contribution * 2.5}%`,
                        background:
                          d.contribution > 20
                            ? "var(--risk-critical)"
                            : d.contribution > 12
                              ? "var(--risk-high)"
                              : "var(--risk-medium)",
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{d.detail}</p>
                </div>
              ))}
            </div>
          </Panel>

          {/* AI-GENERATED RECOMMENDATIONS */}
          <Panel>
            <PanelTitle
              title="AI Recommendations & Interventions"
              subtitle="Optimized corrective actions to mitigate delay"
              icon={Sparkles}
              ai
            />
            <div className="space-y-3">
              {prediction.recommendations.map((r) => (
                <div key={r.id} className="rounded-xl border border-border bg-card p-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      PRIORITY {r.priority}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground">{r.targetDriver}</span>
                  </div>
                  <h4 className="mt-1 font-display text-xs font-bold text-foreground">{r.title}</h4>
                  <p className="mt-1 text-[11px] text-foreground">{r.action}</p>
                  <p className="mt-1 text-[10px] font-medium text-primary">{r.impact}</p>

                  <div className="mt-2.5 flex justify-end">
                    <button
                      onClick={() => {
                        addIntervention({
                          projectId: "nh16",
                          projectName,
                          recommendationId: r.id,
                          action: r.action,
                          assignedTo: session?.name ?? "District Land Officer",
                          department: "District Revenue Cell",
                          priority: r.priority === 1 ? "Critical" : "High",
                          deadline: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
                          status: "In Progress",
                          notes: `Generated from AI Delay Predictor for ${projectName}. Reason: ${r.reason}`,
                        });
                        toast.success("Corrective intervention assigned & logged to Audit Trail!");
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                      <Play className="size-3" /> Assign Intervention
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
