/**
 * LandVision Proprietary ML Service API Client
 * Centralizes all communication between Frontend and Python FastAPI ML Backend.
 */

export interface PredictionRequest {
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

export interface OverallDelayPrediction {
  overall_delay_days: number;
  overall_delay_months: number;
  total_delay_days?: number;
  total_delay_months?: number;
  financial_impact_cr?: number | null;
  financial_impact_text?: string;
}

export interface RiskAssessment {
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  risk_score: number;
  high_risk_prediction?: string;
  high_risk_probability_pct?: number;
  major_factors: string[];
}

export interface FeatureImportance {
  feature: string;
  weight: number;
}

export interface Recommendation {
  id: string;
  priority: number;
  title: string;
  action: string;
  statutory_act: string;
  department: string;
}

export interface PredictionResponse {
  project_name?: string;
  predictions: OverallDelayPrediction;
  risk_assessment: RiskAssessment;
  feature_importance: FeatureImportance[];
  recommendations: Recommendation[];
  model_used?: {
    active_version: string;
    target?: string;
    engine: string;
  };
}

export interface NumericalSummary {
  mean: number;
  median: number;
  std: number;
  min: number;
  max: number;
}

export interface DatasetValidationResponse {
  dataset_id: string;
  filename: string;
  total_rows: number;
  total_columns: number;
  target_column: string;
  feature_columns_count: number;
  numerical_columns: string[];
  categorical_columns: string[];
  missing_values_count: number;
  missing_values_pct: number;
  missing_per_column: Record<string, number>;
  duplicate_rows: number;
  outliers_summary: Record<string, number>;
  quality_score_pct: number;
  is_ready_for_training: boolean;
  preview_records: Record<string, string | number>[];
  numerical_summary: Record<string, NumericalSummary>;
}

export interface TrainingJob {
  job_id: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  step: number;
  progress: number;
  message: string;
  version: string;
  records: number;
  created_at: string;
  results?: Record<string, ModelMetrics>;
}

export interface ModelMetrics {
  mae?: number;
  rmse?: number;
  r2?: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  confusion_matrix?: number[][];
}

export interface ModelInfo {
  target: string;
  version: string;
  algorithm: string;
  training_rows: number;
  metrics: ModelMetrics;
  feature_names: string[];
  created_at: string;
  is_active: boolean;
  comparison?: Record<string, ModelMetrics>;
}

export interface ModelsListResponse {
  active_versions: Record<string, string>;
  models: ModelInfo[];
}

export interface MLHealthResponse {
  status: string;
  service: string;
  provider: string;
  dataset_rows?: number;
  dataset_columns?: number;
  primary_target?: string;
  xgboost_available: boolean;
  active_models: Record<string, string>;
  total_registered_models: number;
}

const getBaseUrl = (): string => {
  // Use VITE_ML_API_URL or default to localhost:8000
  return (import.meta as any).env?.VITE_ML_API_URL || "http://localhost:8000";
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = "Unable to connect to the LandVision ML engine. Please try again.";
    try {
      const errJson = await res.json();
      if (errJson.detail && typeof errJson.detail === "string") {
        errorDetail = errJson.detail;
      }
    } catch {
      // Fallback message
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const mlApi = {
  /**
   * Health check for ML Service
   */
  async checkHealth(): Promise<MLHealthResponse> {
    try {
      const res = await fetch(`${getBaseUrl()}/ml/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      return await handleResponse<MLHealthResponse>(res);
    } catch (e: any) {
      throw new Error(e.message || "Unable to connect to the LandVision ML engine. Please try again.");
    }
  },

  /**
   * Predict overall delay and risk classification
   */
  async predict(data: PredictionRequest): Promise<PredictionResponse> {
    try {
      const res = await fetch(`${getBaseUrl()}/ml/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      return await handleResponse<PredictionResponse>(res);
    } catch (e: any) {
      throw new Error(e.message || "Unable to connect to the LandVision ML engine. Please try again.");
    }
  },

  /**
   * Validate uploaded dataset (14 columns, 1,757 rows)
   */
  async validateDataset(file: File): Promise<DatasetValidationResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${getBaseUrl()}/ml/dataset/validate`, {
        method: "POST",
        body: formData,
      });
      return await handleResponse<DatasetValidationResponse>(res);
    } catch (e: any) {
      throw new Error(e.message || "Unable to connect to the LandVision ML engine. Please try again.");
    }
  },

  /**
   * Trigger training job on dataset
   */
  async startTraining(datasetId?: string, versionLabel?: string): Promise<{ job_id: string; status: string; version: string; records: number }> {
    try {
      const res = await fetch(`${getBaseUrl()}/ml/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: datasetId,
          target_columns: ["Overall_Delay", "Risk_Level"],
          version_label: versionLabel,
        }),
      });
      return await handleResponse<{ job_id: string; status: string; version: string; records: number }>(res);
    } catch (e: any) {
      throw new Error(e.message || "Unable to connect to the LandVision ML engine. Please try again.");
    }
  },

  /**
   * Poll training job progress
   */
  async getTrainingStatus(jobId: string): Promise<TrainingJob> {
    try {
      const res = await fetch(`${getBaseUrl()}/ml/train/${encodeURIComponent(jobId)}`);
      return await handleResponse<TrainingJob>(res);
    } catch (e: any) {
      throw new Error(e.message || "Unable to connect to the LandVision ML engine. Please try again.");
    }
  },

  /**
   * List all registered model versions
   */
  async listModels(): Promise<ModelsListResponse> {
    try {
      const res = await fetch(`${getBaseUrl()}/ml/models`);
      return await handleResponse<ModelsListResponse>(res);
    } catch (e: any) {
      throw new Error(e.message || "Unable to connect to the LandVision ML engine. Please try again.");
    }
  },

  /**
   * Activate model version
   */
  async activateModel(target: string, version: string): Promise<{ status: string; target: string; active_version: string }> {
    try {
      const formData = new FormData();
      formData.append("version", version);

      const res = await fetch(`${getBaseUrl()}/ml/models/${encodeURIComponent(target)}/activate`, {
        method: "POST",
        body: formData,
      });
      return await handleResponse<{ status: string; target: string; active_version: string }>(res);
    } catch (e: any) {
      throw new Error(e.message || "Unable to connect to the LandVision ML engine. Please try again.");
    }
  },

  /**
   * Generate statutory compliance report
   */
  async generateReport(data: PredictionRequest): Promise<any> {
    try {
      const res = await fetch(`${getBaseUrl()}/ml/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return await handleResponse<any>(res);
    } catch (e: any) {
      throw new Error(e.message || "Unable to connect to the LandVision ML engine. Please try again.");
    }
  },

  /**
   * Fetch ML audit logs
   */
  async getLogs(): Promise<{ logs: Array<{ id: string; timestamp: string; level: string; message: string }> }> {
    try {
      const res = await fetch(`${getBaseUrl()}/ml/logs`);
      return await handleResponse<{ logs: Array<{ id: string; timestamp: string; level: string; message: string }> }>(res);
    } catch (e: any) {
      throw new Error(e.message || "Unable to connect to the LandVision ML engine. Please try again.");
    }
  },
};
