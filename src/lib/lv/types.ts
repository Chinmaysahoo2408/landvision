export type RiskCategory = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Role = "ADMIN" | "STATE_OFFICER" | "DISTRICT_OFFICER" | "DECISION_MAKER";

export type ProjectType =
  | "Highway"
  | "Railway"
  | "Industrial"
  | "Power"
  | "Urban Development";

export const STAGES = [
  "Notification",
  "Survey",
  "Valuation",
  "Compensation",
  "Legal Resolution",
  "Rehabilitation & Resettlement",
  "Possession",
  "Completion",
] as const;

export type Stage = (typeof STAGES)[number];

export interface RiskParameters {
  pendingApprovals: number;
  legalDisputes: number;
  resolvedDisputes: number;
  ownershipConflicts: number;
  documentationPct: number;
  compensationPct: number;
  rrPct: number;
  possessionPct: number;
  stakeholderResponsiveness: number;
  historicalPerformance: number;
}

export interface StageProgress {
  stage: Stage;
  progress: number;
  plannedDate: string;
  actualDate: string | null;
  status: "Completed" | "In Progress" | "Delayed" | "Upcoming";
  department: string;
}

export interface Project {
  id: string;
  projectId: string;
  name: string;
  type: ProjectType;
  agency: string;
  state: string;
  district: string;
  block: string;
  village: string;
  landArea: number;
  govtLand: number;
  privateLand: number;
  forestLand: number;
  villages: number;
  affectedFamilies: number;
  latitude: number;
  longitude: number;
  status: "Active" | "On Hold" | "Completed";
  currentStage: Stage;
  createdAt: string;
  startYear: number;
  params: RiskParameters;
  stages: StageProgress[];
  publicNotice: string;
  demo: true;
}

export interface RiskFactor {
  factor: string;
  contribution: number; // 0-100 normalized share
  raw: number;
  direction: "increases" | "reduces";
  detail: string;
}

export interface StageRisk {
  stage: Stage;
  probability: number;
  category: RiskCategory;
}

export interface Recommendation {
  id: string;
  projectId: string;
  priority: 1 | 2 | 3;
  title: string;
  reason: string;
  action: string;
  impact: string;
  status: "Open" | "In Progress" | "Completed";
}

export interface Prediction {
  projectId: string;
  riskScore: number;
  delayProbability: number;
  expectedDelayDays: number;
  riskCategory: RiskCategory;
  factors: RiskFactor[];
  stageRisks: StageRisk[];
  recommendations: Recommendation[];
  modelVersion: string;
  createdAt: string;
}

export interface Intervention {
  id: string;
  projectId: string;
  recommendationId: string | null;
  action: string;
  assignedTo: string;
  department: string;
  priority: "Critical" | "High" | "Medium";
  deadline: string;
  status: "Pending" | "In Progress" | "Completed" | "Escalated";
  notes: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  projectId: string;
  projectName: string;
  severity: "Critical" | "High" | "Medium" | "Information";
  message: string;
  trigger: string;
  officer: string;
  status: "New" | "Acknowledged" | "Escalated" | "Resolved";
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  state: string | null;
  district: string | null;
  status: "Active" | "Disabled";
  lastLogin: string;
}

export interface Thresholds {
  medium: number;
  high: number;
  critical: number;
}
