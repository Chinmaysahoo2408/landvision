export type RiskCategory = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type Role =
  | "ADMIN"
  | "STATE_OFFICER"
  | "DISTRICT_OFFICER"
  | "DECISION_MAKER"
  | "ANALYST"
  | "PUBLIC_USER";

export const PROJECT_TYPES = [
  "Highway",
  "Railway",
  "Industrial",
  "Power",
  "Urban Development",
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number];

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

export interface StakeholderScores {
  landowners: number; // 0-100
  districtAdmin: number;
  governmentDepts: number;
  legalAuthorities: number;
  rrAuthorities: number;
  projectAuthorities: number;
}

export interface RiskParameters {
  // Core SIH input parameters
  projectType: ProjectType;
  landArea: number; // in hectares / acres
  affectedFamilies: number;
  compensationPct: number; // 0-100
  approvalCompletionPct: number; // 0-100
  approvalDelayDays: number; // 0-180
  legalDisputes: number; // open disputes count
  resolvedDisputes: number;
  documentationPct: number; // 0-100 verified
  pendingNotifications: number; // 0-10
  ownershipConflicts: number; // 0-30
  rrPct: number; // 0-100 R&R progress
  possessionPct: number; // 0-100
  stakeholderResponsiveness: number; // 0-100 composite
  stakeholderBreakdown: StakeholderScores;
  departmentPerformance: number; // 0-100
  projectComplexity: "Low" | "Medium" | "High" | "Extreme";
  currentAcquisitionProgress: number; // 0-100
  historicalPerformance: number; // 0-100
  pendingApprovals: number;
}

export interface StageProgress {
  stage: Stage;
  progress: number;
  plannedDate: string;
  actualDate: string | null;
  plannedCompletion: string;
  actualCompletion: string | null;
  status: "Completed" | "In Progress" | "At Risk" | "Delayed" | "Upcoming" | "Blocked";
  daysDelayed: number;
  delayProbability: number;
  riskCategory: RiskCategory;
  department: string;
}

export interface LegalCase {
  id: string;
  projectId: string;
  caseNumber: string;
  court: string;
  petitioner: string;
  respondent: string;
  subject: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  status: "Pending" | "In Hearing" | "Stay Granted" | "Resolved";
  affectedParcels: number;
  filedDate: string;
  hearingDate: string;
  daysPending: number;
  resolutionTimeEstimateDays: number;
}

export interface CompensationRecord {
  projectId: string;
  totalLandowners: number;
  eligibleAmountCr: number;
  paidAmountCr: number;
  pendingAmountCr: number;
  disbursedPct: number;
  avgProcessingDays: number;
  stalledAccounts: number;
  disbursalVelocityCrPerMonth: number;
}

export interface DocumentItem {
  type: "Land Ownership" | "Survey & Demarcation" | "Legal & Court" | "Compensation Awards" | "R&R Plans" | "Statutory Approvals";
  submitted: number;
  verified: number;
  pending: number;
  rejected: number;
  compliancePct: number;
}

export interface RRMetrics {
  projectId: string;
  totalFamilies: number;
  rehabilitationCompleted: number;
  rehabilitationPending: number;
  resettlementCompleted: number;
  resettlementPending: number;
  rrCompletionPct: number;
  resettlementSitesReady: number;
  resettlementSitesPlanned: number;
  rrRiskCategory: RiskCategory;
}

export interface PossessionMetrics {
  projectId: string;
  totalLandRequiredAcres: number;
  landAcquiredAcres: number;
  landPossessedAcres: number;
  landPendingAcres: number;
  possessionPct: number;
  encroachmentIssues: number;
  encroachedAreaAcres: number;
}

export interface LandPricePoint {
  year: number;
  historicalPricePerAcreLakhs: number;
  currentEstimatedPricePerAcreLakhs: number;
  futureEstimatedPricePerAcreLakhs: number;
  infraImpactMultiplier: number;
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
  landArea: number; // in ha / acres
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
  targetCompletionYear: number;
  params: RiskParameters;
  stages: StageProgress[];
  legalCases: LegalCase[];
  compensation: CompensationRecord;
  documents: DocumentItem[];
  rrMetrics: RRMetrics;
  possession: PossessionMetrics;
  landPrices: LandPricePoint[];
  publicNotice: string;
  demo: true;
}

export interface RiskFactor {
  factor: string;
  contribution: number; // 0-100 percentage share
  raw: number;
  direction: "increases" | "reduces";
  detail: string;
  category: "Legal" | "Financial" | "Administrative" | "Social" | "Technical";
}

export interface StageRisk {
  stage: Stage;
  probability: number;
  category: RiskCategory;
  daysDelayed: number;
  bottleneck: boolean;
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
  targetDriver: string;
}

export interface Prediction {
  projectId: string;
  riskScore: number; // 0-100
  delayProbability: number; // 0-100%
  expectedDelayDays: number;
  expectedDelayMonths: number;
  riskCategory: RiskCategory;
  currentStage: Stage;
  bottleneckStage: Stage;
  topDelayDrivers: RiskFactor[];
  factors: RiskFactor[];
  stageRisks: StageRisk[];
  recommendations: Recommendation[];
  modelVersion: string;
  stakeholderIndex: number;
  createdAt: string;
}

export interface Intervention {
  id: string;
  projectId: string;
  projectName: string;
  recommendationId: string | null;
  action: string;
  assignedTo: string;
  department: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  deadline: string;
  status: "Pending" | "In Progress" | "Completed" | "Escalated";
  notes: string;
  previousRisk: number;
  currentRisk: number;
  riskReduction: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Alert {
  id: string;
  projectId: string;
  projectName: string;
  severity: "Critical" | "High" | "Medium" | "Information";
  message: string;
  trigger: string;
  officer: string;
  recommendation: string;
  status: "New" | "Acknowledged" | "Assigned" | "Escalated" | "Resolved";
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  user: string;
  role: Role | string;
  action: string;
  entity: string;
  entityId: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
  status: "SUCCESS" | "WARNING" | "INFO";
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

export interface RetrainingLog {
  id: string;
  version: string;
  datasetSize: number;
  trainingSamples: number;
  testSamples: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  trainingDate: string;
  status: "Active" | "Archived" | "Staging";
  notes: string;
}

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  category: "Projects" | "Risk & ML" | "Analytics" | "Alerts" | "Interventions" | "Integrations";
  status: "Implemented" | "Demo Simulation" | "Planned Govt Gateway";
  params?: string[];
  responseSample: Record<string, unknown>;
}

export interface FirRecord {
  firId: string;
  state: string;
  district: string;
  location: string;
  category: string;
  status: "Open" | "Closed" | "Critical" | "Under Investigation";
  filedDate: string;
  resolutionTimeDays: number;
  riskLevel: RiskCategory;
  complainantType: string;
  summary: string;
}

export interface StateFirAnalysis {
  state: string;
  totalFirs: number;
  openFirs: number;
  closedFirs: number;
  criticalFirs: number;
  avgResolutionDays: number;
  riskLevel: RiskCategory;
  locationDistribution: { location: string; count: number }[];
  categories: { category: string; count: number }[];
  trend: { month: string; count: number }[];
}

export interface FirUploadValidation {
  totalRecords: number;
  requiredColumnsFound: boolean;
  missingLocationsCount: number;
  duplicatesCount: number;
  invalidDatesCount: number;
  detectedLocations: string[];
  detectedStates: string[];
  isValid: boolean;
}

export interface FirTrainingPipelineStep {
  id: string;
  name: string;
  status: "completed" | "active" | "pending";
  detail: string;
  progressPct: number;
}

export interface DatasetConfig {
  filename: string;
  version: string;
  totalRows: number;
  totalColumns: number;
  numericalColumns: string[];
  categoricalColumns: string[];
  missingPct: number;
  duplicateRows: number;
  qualityScore: number;
  lastUpdated: string;
  isReady: boolean;
  preview: Array<Record<string, any>>;
  stats: Record<string, { mean?: number; median?: number; min?: number; max?: number }>;
  source: string;
}

export interface ModelMetrics {
  mae?: number;
  rmse?: number;
  r2?: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
}

export interface ModelVersionItem {
  target: string;
  version: string;
  algorithm: string;
  training_rows: number;
  metrics: ModelMetrics;
  created_at: string;
  is_active: boolean;
  comparison?: Record<string, ModelMetrics>;
}

export interface ActiveModelConfig {
  modelName: string;
  version: string;
  status: "Trained" | "Training" | "Evaluating" | "Ready";
  algorithm: string;
  lastTrained: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  mae: number;
  rmse: number;
  r2: number;
  trainingRows: number;
  targetColumns: string[];
  activeVersions: Record<string, string>;
  comparison?: Record<string, ModelMetrics>;
}

