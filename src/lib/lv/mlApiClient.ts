/**
 * LandVision AI — ML Backend API Client
 *
 * Typed HTTP client for the Python FastAPI ML prediction engine
 * running at http://127.0.0.1:8000.
 *
 * All prediction, training, dataset validation and model management
 * calls go through this client. Zero external AI / LLM APIs.
 */

const ML_BASE = "http://127.0.0.1:8000";

// ─── Response Types ──────────────────────────────────────────────

export interface MLHealthResponse {
  status: "healthy" | string;
  service: string;
  provider: string;
  xgboost_available: boolean;
  active_models: Record<string, string>;
  total_registered_models: number;
}

export interface DatasetValidationResponse {
  dataset_id: string;
  filename: string;
  total_rows: number;
  total_columns: number;
  numerical_columns: string[];
  categorical_columns: string[];
  missing_values_count: number;
  missing_values_pct: number;
  missing_per_column: Record<string, number>;
  duplicate_rows: number;
  outliers_summary: Record<string, number>;
  quality_score_pct: number;
  is_ready_for_training: boolean;
  preview_records: Record<string, unknown>[];
  numerical_summary: Record<
    string,
    { mean: number; median: number; std: number; min: number; max: number }
  >;
}

export interface TrainingJobResponse {
  job_id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  step: number;
  progress: number;
  message: string;
  version: string;
  records: number;
  created_at?: string;
  results?: Record<string, unknown>;
}

export interface ModelListResponse {
  active_versions: Record<string, string>;
  models: Array<{
    target: string;
    version: string;
    algorithm: string;
    training_rows: number;
    metrics: Record<string, number>;
    created_at: string;
    is_active: boolean;
    comparison?: Record<string, Record<string, number>>;
    feature_names?: string[];
  }>;
}

export interface PredictionResponse {
  project_name: string;
  predictions: {
    award_delay_days: number;
    payment_delay_days: number;
    possession_delay_days: number;
    total_delay_days: number;
    total_delay_months: number;
    financial_impact_cr: number | null;
    financial_impact_text: string;
  };
  risk_assessment: {
    risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    risk_score: number;
    major_factors: string[];
  };
  feature_importance: Array<{ feature: string; weight: number }>;
  recommendations: Array<{
    id: string;
    title: string;
    action: string;
    priority: number;
    department: string;
    expectedImpact: string;
    rationale: string;
  }>;
  model_used: {
    active_version: string;
    engine: string;
  };
}

export interface PredictionParams {
  project_name?: string;
  state: string;
  district?: string;
  project_type: string;
  land_required_hectare: number;
  land_remaining_hectare: number;
  affected_families: number;
  compensation_amount: number;
  project_cost: number;
  legal_dispute: string;
  court_case: string;
  environmental_clearance: string;
  forest_clearance: string;
  rehabilitation_issue: string;
  model_version?: string;
}

export interface ReportResponse {
  report_id: string;
  generated_at: string;
  project_info: Record<string, unknown>;
  executive_summary: string;
  risk_analysis: Record<string, unknown>;
  predictions_detail: Record<string, unknown>;
  recommendations: Array<Record<string, unknown>>;
  model_metadata: Record<string, unknown>;
  disclaimer: string;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
}

// ─── API Functions ──────────────────────────────────────────────

async function mlFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${ML_BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    throw new Error(`ML API ${res.status}: ${errText}`);
  }
  return res.json() as Promise<T>;
}

/** Check ML backend health & active models */
export async function checkMLHealth(): Promise<MLHealthResponse> {
  return mlFetch<MLHealthResponse>("/ml/health");
}

/** Upload a file (CSV/XLSX/JSON) for server-side validation & analysis */
export async function uploadAndValidateDataset(
  file: File,
): Promise<DatasetValidationResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return mlFetch<DatasetValidationResponse>("/ml/dataset/validate", {
    method: "POST",
    body: formData,
  });
}

/** Start an asynchronous model training job */
export async function startTrainingJob(
  datasetId?: string,
  versionLabel?: string,
): Promise<TrainingJobResponse> {
  return mlFetch<TrainingJobResponse>("/ml/train", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataset_id: datasetId ?? null,
      version_label: versionLabel ?? null,
    }),
  });
}

/** Poll the status of a training job */
export async function getTrainingJobStatus(
  jobId: string,
): Promise<TrainingJobResponse> {
  return mlFetch<TrainingJobResponse>(`/ml/train/${jobId}`);
}

/** List all registered model versions */
export async function listModels(): Promise<ModelListResponse> {
  return mlFetch<ModelListResponse>("/ml/models");
}

/** Activate a specific model version for a target */
export async function activateModel(
  target: string,
  version: string,
): Promise<{ status: string; target: string; active_version: string }> {
  const formData = new FormData();
  formData.append("version", version);
  return mlFetch(`/ml/models/${target}/activate`, {
    method: "POST",
    body: formData,
  });
}

/** Run ML inference for delay prediction */
export async function predict(
  params: PredictionParams,
): Promise<PredictionResponse> {
  return mlFetch<PredictionResponse>("/ml/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

/** Generate a structured AI report */
export async function generateReport(
  params: PredictionParams,
): Promise<ReportResponse> {
  return mlFetch<ReportResponse>("/ml/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

/** Fetch system audit logs from backend */
export async function getSystemLogs(): Promise<{ logs: SystemLogEntry[] }> {
  return mlFetch<{ logs: SystemLogEntry[] }>("/ml/logs");
}

/** Utility: check if backend is reachable (returns true/false, never throws) */
export async function isMLBackendReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${ML_BASE}/ml/health`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
