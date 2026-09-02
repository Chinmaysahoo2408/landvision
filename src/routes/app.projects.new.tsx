import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Panel, PanelTitle, PageHeader } from "@/components/lv/panels";
import { useLV } from "@/lib/lv/store";
import { STAGES, type Project, type ProjectType } from "@/lib/lv/types";

export const Route = createFileRoute("/app/projects/new")({
  component: NewProjectPage,
  head: () => ({
    meta: [
      { title: "Register project — LandVision AI" },
      {
        name: "description",
        content: "Register a new land acquisition project and generate an immediate predictive risk assessment.",
      },
      { property: "og:title", content: "Register a land acquisition project" },
      { property: "og:description", content: "Capture parcel, compensation and legal parameters for AI scoring." },
    ],
  }),
});

const TYPES: ProjectType[] = ["Highway", "Railway", "Industrial", "Power", "Urban Development"];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

function NewProjectPage() {
  const { addProject } = useLV();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    type: "Highway" as ProjectType,
    agency: "National Highways Authority of India",
    state: "Odisha",
    district: "Khordha",
    block: "Balianta",
    village: "Pubasasan",
    landArea: 120,
    govtLand: 30,
    privateLand: 80,
    forestLand: 10,
    villages: 6,
    affectedFamilies: 240,
    latitude: 20.29,
    longitude: 85.82,
    pendingApprovals: 4,
    legalDisputes: 3,
    ownershipConflicts: 2,
    documentationPct: 55,
    compensationPct: 45,
    rrPct: 30,
    stakeholderResponsiveness: 60,
    historicalPerformance: 65,
  });

  const set = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    const id = `usr-${Date.now()}`;
    const project: Project = {
      id,
      projectId: `LV-${Date.now().toString().slice(-6)}`,
      name: form.name.trim(),
      type: form.type,
      agency: form.agency,
      state: form.state,
      district: form.district,
      block: form.block,
      village: form.village,
      landArea: Number(form.landArea),
      govtLand: Number(form.govtLand),
      privateLand: Number(form.privateLand),
      forestLand: Number(form.forestLand),
      villages: Number(form.villages),
      affectedFamilies: Number(form.affectedFamilies),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      status: "Active",
      currentStage: "Survey",
      createdAt: new Date().toISOString(),
      startYear: new Date().getFullYear(),
      params: {
        projectType: form.type as ProjectType,
        landArea: Number(form.landArea) || 100,
        affectedFamilies: Number(form.affectedFamilies) || 50,
        compensationPct: Number(form.compensationPct) || 0,
        approvalCompletionPct: 50,
        approvalDelayDays: 30,
        pendingApprovals: Number(form.pendingApprovals) || 0,
        legalDisputes: Number(form.legalDisputes) || 0,
        resolvedDisputes: 0,
        ownershipConflicts: Number(form.ownershipConflicts) || 0,
        documentationPct: Number(form.documentationPct) || 50,
        pendingNotifications: 0,
        rrPct: Number(form.rrPct) || 0,
        possessionPct: 0,
        stakeholderResponsiveness: Number(form.stakeholderResponsiveness) || 50,
        stakeholderBreakdown: {
          landowners: Number(form.stakeholderResponsiveness) || 50,
          districtAdmin: 70,
          governmentDepts: 65,
          legalAuthorities: 50,
          rrAuthorities: 50,
          projectAuthorities: 75,
        },
        departmentPerformance: 65,
        projectComplexity: "Medium",
        currentAcquisitionProgress: 15,
        historicalPerformance: Number(form.historicalPerformance) || 60,
      },
      stages: STAGES.map((stage, i) => ({
        stage,
        progress: i === 0 ? 100 : i === 1 ? 40 : 0,
        plannedDate: new Date(Date.now() + i * 60 * 86400000).toISOString(),
        actualDate: i === 0 ? new Date().toISOString() : null,
        plannedCompletion: new Date(Date.now() + (i + 1) * 60 * 86400000).toISOString(),
        actualCompletion: i === 0 ? new Date().toISOString() : null,
        status: i === 0 ? "Completed" : i === 1 ? "In Progress" : "Upcoming",
        daysDelayed: 0,
        delayProbability: i === 1 ? 25 : 10,
        riskCategory: "LOW" as const,
        department: "Revenue",
      })),
      targetCompletionYear: new Date().getFullYear() + 3,
      legalCases: [],
      compensation: {
        projectId: id,
        totalLandowners: Number(form.affectedFamilies) || 50,
        eligibleAmountCr: Math.round((Number(form.landArea) || 100) * 0.45 * 10) / 10,
        paidAmountCr: 0,
        pendingAmountCr: Math.round((Number(form.landArea) || 100) * 0.45 * 10) / 10,
        disbursedPct: 0,
        avgProcessingDays: 45,
        stalledAccounts: 0,
        disbursalVelocityCrPerMonth: 2.5,
      },
      documents: [
        { type: "Land Ownership", submitted: 120, verified: 60, pending: 60, rejected: 0, compliancePct: 50 },
        { type: "Survey & Demarcation", submitted: 40, verified: 20, pending: 20, rejected: 0, compliancePct: 50 },
        { type: "Legal & Court", submitted: 10, verified: 10, pending: 0, rejected: 0, compliancePct: 100 },
        { type: "Compensation Awards", submitted: 50, verified: 10, pending: 40, rejected: 0, compliancePct: 20 },
        { type: "R&R Plans", submitted: 30, verified: 15, pending: 15, rejected: 0, compliancePct: 50 },
        { type: "Statutory Approvals", submitted: 8, verified: 4, pending: 4, rejected: 0, compliancePct: 50 },
      ],
      rrMetrics: {
        projectId: id,
        totalFamilies: Number(form.affectedFamilies) || 50,
        rehabilitationCompleted: 0,
        rehabilitationPending: Number(form.affectedFamilies) || 50,
        resettlementCompleted: 0,
        resettlementPending: Number(form.affectedFamilies) || 50,
        rrCompletionPct: 0,
        resettlementSitesReady: 0,
        resettlementSitesPlanned: 2,
        rrRiskCategory: "LOW",
      },
      possession: {
        projectId: id,
        totalLandRequiredAcres: Number(form.landArea) || 100,
        landAcquiredAcres: 0,
        landPossessedAcres: 0,
        landPendingAcres: Number(form.landArea) || 100,
        possessionPct: 0,
        encroachmentIssues: 0,
        encroachedAreaAcres: 0,
      },
      landPrices: [
        { year: 2022, historicalPricePerAcreLakhs: 18, currentEstimatedPricePerAcreLakhs: 24, futureEstimatedPricePerAcreLakhs: 32, infraImpactMultiplier: 1.35 },
        { year: 2024, historicalPricePerAcreLakhs: 22, currentEstimatedPricePerAcreLakhs: 28, futureEstimatedPricePerAcreLakhs: 38, infraImpactMultiplier: 1.45 },
        { year: 2026, historicalPricePerAcreLakhs: 26, currentEstimatedPricePerAcreLakhs: 34, futureEstimatedPricePerAcreLakhs: 46, infraImpactMultiplier: 1.55 },
      ],
      publicNotice: `Public notice issued for ${form.name.trim()} in ${form.district}, ${form.state}.`,
      demo: true,
    };
    addProject(project);
    toast.success("Project registered — predictive assessment generated");
    void navigate({ to: "/app/projects/$projectId", params: { projectId: id } });
  };

  return (
    <div>
      <PageHeader
        title="Register acquisition project"
        description="Captured parameters are scored instantly by the prediction engine, producing risk, delay and intervention outputs."
      />
      <form onSubmit={submit} className="grid gap-4 xl:grid-cols-2">
        <Panel>
          <PanelTitle title="Project identity" subtitle="Administrative and agency details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Project name">
                <input className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
            </div>
            <Field label="Project type">
              <select
                className={inputClass}
                value={form.type}
                onChange={(e) => set("type", e.target.value as ProjectType)}
              >
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Implementing agency">
              <input className={inputClass} value={form.agency} onChange={(e) => set("agency", e.target.value)} />
            </Field>
            <Field label="State">
              <input className={inputClass} value={form.state} onChange={(e) => set("state", e.target.value)} />
            </Field>
            <Field label="District">
              <input className={inputClass} value={form.district} onChange={(e) => set("district", e.target.value)} />
            </Field>
            <Field label="Block">
              <input className={inputClass} value={form.block} onChange={(e) => set("block", e.target.value)} />
            </Field>
            <Field label="Village">
              <input className={inputClass} value={form.village} onChange={(e) => set("village", e.target.value)} />
            </Field>
          </div>
        </Panel>

        <Panel>
          <PanelTitle title="Land and community" subtitle="Parcel composition and affected population" />
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["landArea", "Total land area (ha)"],
                ["govtLand", "Government land (ha)"],
                ["privateLand", "Private land (ha)"],
                ["forestLand", "Forest land (ha)"],
                ["villages", "Villages affected"],
                ["affectedFamilies", "Affected families"],
                ["latitude", "Latitude"],
                ["longitude", "Longitude"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  type="number"
                  step="any"
                  className={inputClass}
                  value={form[key]}
                  onChange={(e) => set(key, Number(e.target.value))}
                />
              </Field>
            ))}
          </div>
        </Panel>

        <Panel className="xl:col-span-2">
          <PanelTitle title="Risk parameters" subtitle="Feature inputs consumed by the prediction model" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                ["pendingApprovals", "Pending approvals"],
                ["legalDisputes", "Active legal disputes"],
                ["ownershipConflicts", "Ownership conflicts"],
                ["documentationPct", "Documentation complete (%)"],
                ["compensationPct", "Compensation disbursed (%)"],
                ["rrPct", "R&R completion (%)"],
                ["stakeholderResponsiveness", "Stakeholder responsiveness (0-100)"],
                ["historicalPerformance", "District historical performance (0-100)"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <input
                  type="number"
                  className={inputClass}
                  value={form[key]}
                  onChange={(e) => set(key, Number(e.target.value))}
                />
              </Field>
            ))}
          </div>
          <button
            type="submit"
            className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" aria-hidden /> Register and predict
          </button>
        </Panel>
      </form>
    </div>
  );
}
