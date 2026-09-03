import type {
  Prediction,
  Project,
  Recommendation,
  RiskCategory,
  RiskFactor,
  RiskParameters,
  Stage,
  StageRisk,
  StakeholderScores,
  Thresholds,
} from "./types";
import { STAGES } from "./types";

export const DEFAULT_THRESHOLDS: Thresholds = { medium: 40, high: 70, critical: 85 };
export const MODEL_VERSION = "v2.4";

export function categorize(score: number, t: Thresholds = DEFAULT_THRESHOLDS): RiskCategory {
  if (score >= t.critical) return "CRITICAL";
  if (score >= t.high) return "HIGH";
  if (score >= t.medium) return "MEDIUM";
  return "LOW";
}

export function riskToken(category: RiskCategory) {
  switch (category) {
    case "LOW":
      return "risk-low";
    case "MEDIUM":
      return "risk-medium";
    case "HIGH":
      return "risk-high";
    default:
      return "risk-critical";
  }
}

export function riskStyle(category: RiskCategory) {
  switch (category) {
    case "LOW":
      return { stroke: "var(--risk-low)", bg: "color-mix(in oklab, var(--risk-low) 12%, transparent)", text: "var(--risk-low)" };
    case "MEDIUM":
      return { stroke: "var(--risk-medium)", bg: "color-mix(in oklab, var(--risk-medium) 12%, transparent)", text: "var(--risk-medium)" };
    case "HIGH":
      return { stroke: "var(--risk-high)", bg: "color-mix(in oklab, var(--risk-high) 12%, transparent)", text: "var(--risk-high)" };
    default:
      return { stroke: "var(--risk-critical)", bg: "color-mix(in oklab, var(--risk-critical) 12%, transparent)", text: "var(--risk-critical)" };
  }
}

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

export function computeStakeholderIndex(s: StakeholderScores): number {
  const sum =
    s.landowners * 0.25 +
    s.districtAdmin * 0.2 +
    s.governmentDepts * 0.18 +
    s.legalAuthorities * 0.15 +
    s.rrAuthorities * 0.12 +
    s.projectAuthorities * 0.1;
  return Math.round(sum);
}

interface WeightedFactor {
  key: string;
  label: string;
  category: RiskFactor["category"];
  weight: number;
  value: number; // 0..1 severity
  detail: string;
}

export function computeWeightedFactors(params: RiskParameters): WeightedFactor[] {
  const q = params;
  const stakeholderScore = q.stakeholderBreakdown
    ? computeStakeholderIndex(q.stakeholderBreakdown)
    : q.stakeholderResponsiveness;

  return [
    {
      key: "legal",
      label: "Legal disputes",
      category: "Legal",
      weight: 24,
      value: clamp((q.legalDisputes * 1.2 + q.ownershipConflicts * 0.4) / 14),
      detail: `${q.legalDisputes} open legal cases, ${q.ownershipConflicts} ownership disputes`,
    },
    {
      key: "compensation",
      label: "Compensation delay",
      category: "Financial",
      weight: 21,
      value: clamp((100 - q.compensationPct) / 100),
      detail: `${q.compensationPct}% of compensation disbursed to landowners`,
    },
    {
      key: "possession",
      label: "Low possession progress",
      category: "Technical",
      weight: 15,
      value: clamp((100 - q.possessionPct) / 100),
      detail: `${q.possessionPct}% of land handed over to project authority`,
    },
    {
      key: "approvals",
      label: "Approval delay",
      category: "Administrative",
      weight: 14,
      value: clamp((q.approvalDelayDays / 120 + q.pendingApprovals / 8) / 2),
      detail: `${q.approvalDelayDays} days average approval delay across ${q.pendingApprovals} pending clearances`,
    },
    {
      key: "documentation",
      label: "Documentation issues",
      category: "Administrative",
      weight: 10,
      value: clamp((100 - q.documentationPct) / 100),
      detail: `${q.documentationPct}% of revenue records & titles verified`,
    },
    {
      key: "rr",
      label: "R&R challenges",
      category: "Social",
      weight: 8,
      value: clamp((100 - q.rrPct) / 100),
      detail: `${q.rrPct}% of affected families rehabilitated & resettled`,
    },
    {
      key: "stakeholders",
      label: "Stakeholder responsiveness",
      category: "Social",
      weight: 5,
      value: clamp((100 - stakeholderScore) / 100),
      detail: `Composite responsiveness index ${stakeholderScore}/100`,
    },
    {
      key: "department",
      label: "Department coordination",
      category: "Administrative",
      weight: 3,
      value: clamp((100 - q.departmentPerformance) / 100),
      detail: `Inter-departmental velocity index ${q.departmentPerformance}/100`,
    },
  ];
}

export function computeStageRisks(params: RiskParameters, overallRiskScore: number): StageRisk[] {
  const q = params;
  const stakeholderScore = q.stakeholderBreakdown ? computeStakeholderIndex(q.stakeholderBreakdown) : q.stakeholderResponsiveness;

  const base: Record<Stage, { prob: number; delayDays: number }> = {
    Notification: {
      prob: 10 + q.pendingNotifications * 7 + (100 - q.departmentPerformance) * 0.2,
      delayDays: Math.round(15 + q.pendingNotifications * 12),
    },
    Survey: {
      prob: 12 + (100 - q.documentationPct) * 0.35 + (100 - stakeholderScore) * 0.15,
      delayDays: Math.round(20 + (100 - q.documentationPct) * 0.4),
    },
    Valuation: {
      prob: 15 + (100 - q.documentationPct) * 0.3 + q.ownershipConflicts * 1.5,
      delayDays: Math.round(25 + q.ownershipConflicts * 3),
    },
    Compensation: {
      prob: 18 + (100 - q.compensationPct) * 0.65 + (100 - stakeholderScore) * 0.15,
      delayDays: Math.round(30 + (100 - q.compensationPct) * 0.8),
    },
    "Legal Resolution": {
      prob: 22 + q.legalDisputes * 5.8 + q.ownershipConflicts * 1.6,
      delayDays: Math.round(45 + q.legalDisputes * 9),
    },
    "Rehabilitation & Resettlement": {
      prob: 16 + (100 - q.rrPct) * 0.6 + (100 - stakeholderScore) * 0.2,
      delayDays: Math.round(28 + (100 - q.rrPct) * 0.7),
    },
    Possession: {
      prob: 20 + (100 - q.possessionPct) * 0.55 + q.legalDisputes * 2.2,
      delayDays: Math.round(35 + (100 - q.possessionPct) * 0.75),
    },
    Completion: {
      prob: 8 + overallRiskScore * 0.6,
      delayDays: Math.round(overallRiskScore * 0.9),
    },
  };

  let maxProb = -1;
  let bottleneckStage: Stage = "Legal Resolution";

  const stageRisks: StageRisk[] = STAGES.map((stage) => {
    const raw = base[stage];
    const probability = Math.round(Math.min(98, Math.max(4, raw.prob)));
    const daysDelayed = Math.round(raw.delayDays);
    if (probability > maxProb && stage !== "Completion") {
      maxProb = probability;
      bottleneckStage = stage;
    }
    return {
      stage,
      probability,
      category: categorize(probability),
      daysDelayed,
      bottleneck: false,
    };
  });

  return stageRisks.map((s) => ({
    ...s,
    bottleneck: s.stage === bottleneckStage,
  }));
}

export function buildRecommendations(projectId: string, projectName: string, factors: RiskFactor[], params: RiskParameters): Recommendation[] {
  const out: Recommendation[] = [];
  const top = factors.filter((f) => f.direction === "increases").slice(0, 5);

  let priority = 1;
  for (const f of top) {
    let rec: Omit<Recommendation, "id" | "projectId" | "priority" | "status" | "targetDriver"> | null = null;
    let targetDriver = f.factor;

    if (f.factor === "Legal disputes" && params.legalDisputes > 0) {
      rec = {
        title: "Convene Special Lok Adalat & Fast-track Dispute Resolution",
        reason: `${params.legalDisputes} disputes contribute ${f.contribution}% to predicted project delay.`,
        action: "Convene a dedicated revenue-court Lok Adalat camp to resolve title disputes through pre-litigation mediation.",
        impact: "Estimated 14–22 point reduction in risk score and 45–60 days delay mitigation.",
      };
    } else if (f.factor === "Compensation delay" && params.compensationPct < 95) {
      rec = {
        title: "Deploy Additional Verification Officers & Clear Award Backlogs",
        reason: `Compensation is only ${params.compensationPct}% disbursed, causing dissatisfaction and delay.`,
        action: "Set up village-level direct bank transfer camps with dedicated revenue inspectors for instant account validation.",
        impact: "Estimated 12–18 point reduction in risk score upon reaching 90% disbursement.",
      };
    } else if (f.factor === "Low possession progress" && params.possessionPct < 90) {
      rec = {
        title: "Accelerate Demarcation & Physical Possession Handover",
        reason: `Possession is lagging at ${params.possessionPct}%, blocking subsequent infrastructure construction phases.`,
        action: "Coordinate with district police and revenue surveyors for joint demarcation and peaceful possession drive.",
        impact: "Estimated 10–16 point reduction in risk score as possession reaches 75%+.",
      };
    } else if (f.factor === "Approval delay" && (params.approvalDelayDays > 30 || params.pendingApprovals > 0)) {
      rec = {
        title: "Escalate Statutory Approvals to State Single-Window Cell",
        reason: `Average approval delay of ${params.approvalDelayDays} days is impeding notification progression.`,
        action: "Table pending clearances in the fortnightly Chief Secretary infrastructure monitoring review.",
        impact: "Estimated 8–12 point reduction in risk score upon clearance of critical approvals.",
      };
    } else if (f.factor === "Documentation issues" && params.documentationPct < 90) {
      rec = {
        title: "Conduct Record-of-Rights (RoR) Mutation & Digitization Drive",
        reason: `${100 - params.documentationPct}% of land titles require verification and reconciliation.`,
        action: "Deploy mobile tehsil units for on-spot mutation verification and digital land record integration.",
        impact: "Estimated 6–10 point reduction in risk score.",
      };
    } else if (f.factor === "R&R challenges" && params.rrPct < 90) {
      rec = {
        title: "Expedite Resettlement Colony Amenities & Allotment Letters",
        reason: `R&R progress (${params.rrPct}%) is below schedule, triggering stakeholder resistance.`,
        action: "Complete civic infrastructure at rehabilitation sites and issue possession certificates to affected families.",
        impact: "Estimated 7–11 point reduction in risk score.",
      };
    } else if (f.factor === "Stakeholder responsiveness") {
      rec = {
        title: "Establish Gram Sabha Consultation & Grievance Redressal Cell",
        reason: `Stakeholder responsiveness is strained, leading to negotiation standoffs.`,
        action: "Organize weekly public hearings with village leaders and district authorities.",
        impact: "Estimated 5–9 point reduction in risk score.",
      };
    }

    if (rec) {
      out.push({
        id: `${projectId}-REC-${priority}`,
        projectId,
        priority: (priority > 3 ? 3 : priority) as 1 | 2 | 3,
        status: "Open",
        targetDriver,
        ...rec,
      });
      priority += 1;
    }
  }

  // Fallback recommendation if clean
  if (out.length === 0) {
    out.push({
      id: `${projectId}-REC-1`,
      projectId,
      priority: 1,
      status: "Open",
      targetDriver: "Maintenance",
      title: "Maintain Bi-weekly Milestone Tracking",
      reason: "Project parameters are currently within acceptable risk thresholds.",
      action: "Continue routine monitoring of scheduled milestone deliveries across revenue and executing departments.",
      impact: "Preserves stable low-risk trajectory.",
    });
  }

  return out;
}

/** Core deterministic prediction calculation for any project or simulation parameters. */
export function predictParameters(
  params: RiskParameters,
  projectId = "SIM-001",
  projectName = "Simulation Project",
  currentStage: Stage = "Legal Resolution",
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
  version = MODEL_VERSION,
): Prediction {
  const parts = computeWeightedFactors(params);
  const totalRaw = parts.reduce((s, x) => s + x.weight * x.value, 0);
  const riskScore = Math.round(Math.min(100, Math.max(2, totalRaw)));
  const delayProbability = Math.round(Math.min(98, Math.max(4, riskScore * 0.98)));
  const expectedDelayDays = Math.round(riskScore * 2.2);
  const expectedDelayMonths = Math.round((expectedDelayDays / 30) * 10) / 10;
  const sumWeights = parts.reduce((s, x) => s + x.weight * x.value, 0) || 1;

  const factors: RiskFactor[] = parts
    .map((x) => ({
      factor: x.label,
      category: x.category,
      raw: Math.round(x.weight * x.value * 10) / 10,
      contribution: Math.round(((x.weight * x.value) / sumWeights) * 100),
      direction: (x.value > 0.35 ? "increases" : "reduces") as RiskFactor["direction"],
      detail: x.detail,
    }))
    .sort((a, b) => b.contribution - a.contribution);

  const topDelayDrivers = factors.filter((f) => f.direction === "increases").slice(0, 5);
  const stageRisks = computeStageRisks(params, riskScore);
  const bottleneck = stageRisks.find((s) => s.bottleneck)?.stage ?? currentStage;
  const recommendations = buildRecommendations(projectId, projectName, factors, params);
  const stakeholderIndex = params.stakeholderBreakdown
    ? computeStakeholderIndex(params.stakeholderBreakdown)
    : params.stakeholderResponsiveness;

  return {
    projectId,
    riskScore,
    delayProbability,
    expectedDelayDays,
    expectedDelayMonths,
    riskCategory: categorize(riskScore, thresholds),
    currentStage,
    bottleneckStage: bottleneck,
    topDelayDrivers,
    factors,
    stageRisks,
    recommendations,
    modelVersion: version,
    stakeholderIndex,
    createdAt: new Date().toISOString(),
  };
}

export function predict(p: Project, t: Thresholds = DEFAULT_THRESHOLDS, version = MODEL_VERSION): Prediction {
  return predictParameters(p.params, p.id, p.name, p.currentStage, t, version);
}

export function overallProgress(p: Project): number {
  const active = p.stages.filter((s) => s.stage !== "Completion");
  if (active.length === 0) return 100;
  return Math.round(active.reduce((s, x) => s + x.progress, 0) / active.length);
}
