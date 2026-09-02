import type {
  Prediction,
  Project,
  Recommendation,
  RiskCategory,
  RiskFactor,
  StageRisk,
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

const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));

interface Weighted {
  key: string;
  label: string;
  weight: number;
  value: number; // 0..1 severity
  detail: string;
}

function weighted(p: Project): Weighted[] {
  const q = p.params;
  return [
    {
      key: "legal",
      label: "Legal disputes",
      weight: 26,
      value: clamp(q.legalDisputes / 12),
      detail: `${q.legalDisputes} open disputes, ${q.resolvedDisputes} resolved`,
    },
    {
      key: "compensation",
      label: "Compensation delay",
      weight: 22,
      value: clamp((100 - q.compensationPct) / 100),
      detail: `${q.compensationPct}% of compensation disbursed`,
    },
    {
      key: "approvals",
      label: "Pending approvals",
      weight: 16,
      value: clamp(q.pendingApprovals / 9),
      detail: `${q.pendingApprovals} approvals awaiting clearance`,
    },
    {
      key: "documentation",
      label: "Documentation gaps",
      weight: 13,
      value: clamp((100 - q.documentationPct) / 100),
      detail: `${q.documentationPct}% of land records verified`,
    },
    {
      key: "rr",
      label: "R&R progress",
      weight: 10,
      value: clamp((100 - q.rrPct) / 100),
      detail: `${q.rrPct}% of affected families rehabilitated`,
    },
    {
      key: "stakeholder",
      label: "Stakeholder responsiveness",
      weight: 7,
      value: clamp((100 - q.stakeholderResponsiveness) / 100),
      detail: `Responsiveness index ${q.stakeholderResponsiveness}/100`,
    },
    {
      key: "history",
      label: "Historical administrative performance",
      weight: 6,
      value: clamp((100 - q.historicalPerformance) / 100),
      detail: `District performance index ${q.historicalPerformance}/100`,
    },
  ];
}

export function stageRiskFor(p: Project, riskScore: number): StageRisk[] {
  const q = p.params;
  const base: Record<string, number> = {
    Notification: 8 + q.pendingApprovals * 1.2,
    Survey: 12 + (100 - q.documentationPct) * 0.18,
    Valuation: 16 + (100 - q.documentationPct) * 0.26,
    Compensation: 18 + (100 - q.compensationPct) * 0.62,
    "Legal Resolution": 22 + q.legalDisputes * 5.6 + q.ownershipConflicts * 1.4,
    "Rehabilitation & Resettlement": 16 + (100 - q.rrPct) * 0.55,
    Possession: 20 + (100 - q.possessionPct) * 0.5,
    Completion: 10 + riskScore * 0.55,
  };
  return STAGES.map((stage) => {
    const probability = Math.round(Math.min(97, Math.max(4, base[stage] ?? 10)));
    return { stage, probability, category: categorize(probability) };
  });
}

function buildRecommendations(p: Project, factors: RiskFactor[]): Recommendation[] {
  const q = p.params;
  const out: Recommendation[] = [];
  const top = factors.filter((f) => f.direction === "increases").slice(0, 4);
  let priority = 1;
  for (const f of top) {
    let rec: Omit<Recommendation, "id" | "projectId" | "priority" | "status"> | null = null;
    if (f.factor === "Legal disputes" && q.legalDisputes > 0) {
      rec = {
        title: "Resolve pending legal disputes",
        reason: `${q.legalDisputes} disputes are the largest single contributor (${f.contribution}%) to the current risk estimate.`,
        action: `Convene a dispute resolution camp and escalate cases exceeding the defined resolution timeline to the district court cell.`,
        impact: "Estimated 12–18 point reduction in risk score if disputes fall below 4.",
      };
    } else if (f.factor === "Compensation delay" && q.compensationPct < 95) {
      rec = {
        title: "Accelerate compensation verification and disbursement",
        reason: `Only ${q.compensationPct}% of compensation is disbursed, contributing ${f.contribution}% of the risk estimate.`,
        action: "Deploy additional verification teams and clear pending award payments village-wise.",
        impact: "Estimated 8–14 point reduction in risk score at 90% disbursal.",
      };
    } else if (f.factor === "Pending approvals" && q.pendingApprovals > 0) {
      rec = {
        title: "Escalate pending statutory approvals",
        reason: `${q.pendingApprovals} approvals remain pending, contributing ${f.contribution}% of the risk estimate.`,
        action: "Raise a consolidated approval tracker with the nodal department and review weekly.",
        impact: "Estimated 6–10 point reduction in risk score once approvals clear.",
      };
    } else if (f.factor === "Documentation gaps" && q.documentationPct < 95) {
      rec = {
        title: "Complete land record documentation",
        reason: `${100 - q.documentationPct}% of land records remain unverified.`,
        action: "Run a revenue-record reconciliation drive with the tehsil office.",
        impact: "Estimated 4–8 point reduction in risk score.",
      };
    } else if (f.factor === "R&R progress" && q.rrPct < 95) {
      rec = {
        title: "Advance rehabilitation & resettlement",
        reason: `${q.rrPct}% of affected families have completed R&R.`,
        action: "Prioritise displaced families awaiting allotment and publish an R&R schedule.",
        impact: "Estimated 3–7 point reduction in risk score.",
      };
    }
    if (rec) {
      out.push({
        id: `${p.projectId}-REC-${priority}`,
        projectId: p.id,
        priority: (priority > 3 ? 3 : priority) as 1 | 2 | 3,
        status: "Open",
        ...rec,
      });
      priority += 1;
    }
    if (out.length >= 3) break;
  }
  return out;
}

/** Deterministic prediction engine — mirrors the POST /predict contract. */
export function predict(p: Project, t: Thresholds = DEFAULT_THRESHOLDS): Prediction {
  const parts = weighted(p);
  const total = parts.reduce((s, x) => s + x.weight * x.value, 0);
  const riskScore = Math.round(Math.min(100, Math.max(2, total)));
  const delayProbability = Math.round(Math.min(97, Math.max(4, riskScore * 0.975)));
  const expectedDelayDays = Math.round(riskScore * 1.8);
  const sum = parts.reduce((s, x) => s + x.weight * x.value, 0) || 1;

  const factors: RiskFactor[] = parts
    .map((x) => ({
      factor: x.label,
      raw: Math.round(x.weight * x.value * 10) / 10,
      contribution: Math.round(((x.weight * x.value) / sum) * 100),
      direction: (x.value > 0.35 ? "increases" : "reduces") as RiskFactor["direction"],
      detail: x.detail,
    }))
    .sort((a, b) => b.contribution - a.contribution);

  return {
    projectId: p.id,
    riskScore,
    delayProbability,
    expectedDelayDays,
    riskCategory: categorize(riskScore, t),
    factors,
    stageRisks: stageRiskFor(p, riskScore),
    recommendations: buildRecommendations(p, factors),
    modelVersion: MODEL_VERSION,
    createdAt: new Date().toISOString(),
  };
}

export function overallProgress(p: Project): number {
  const active = p.stages.filter((s) => s.stage !== "Completion");
  return Math.round(active.reduce((s, x) => s + x.progress, 0) / active.length);
}
