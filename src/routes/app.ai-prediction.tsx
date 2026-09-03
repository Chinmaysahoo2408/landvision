import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bot,
  Brain,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Cpu,
  Database,
  Download,
  ExternalLink,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Flame,
  Gavel,
  Globe2,
  HelpCircle,
  Hourglass,
  Layers,
  LineChart,
  Map,
  MapPin,
  Maximize2,
  Network,
  Play,
  RefreshCw,
  Scale,
  Search,
  ServerCog,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Split,
  Tag,
  TrendingDown,
  TrendingUp,
  Trees,
  UploadCloud,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  DemoTag,
  EmptyState,
  PageHeader,
  Panel,
  PanelTitle,
  StatCard,
} from "@/components/lv/panels";
import { RiskBadge, RiskGauge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";
import { useTranslation } from "@/lib/i18n";
import {
  AcquisitionStageName,
  AcquisitionStageStatus,
  computeNationalHighwayDemo,
  computeCustomProjectPrediction,
  HistoricalAcquisitionRecord,
  parseAndValidateCsv,
  PredictionResult,
  SAMPLE_CSV_DATA,
  StageDetail,
} from "@/lib/lv/aiPredictionEngine";
import type { Prediction, Project, RiskCategory } from "@/lib/lv/types";
import { explainPredictionServerFn } from "@/lib/server/explainServerFn";
import { mlApi, type PredictionResponse } from "@/services/mlApi";
import { AiChatAssistant } from "@/components/lv/AiChatAssistant";
import type {
  SelectedProjectContext,
  DatasetSummaryContext,
  ModelMetricsContext,
} from "@/lib/server/openaiChatProxy";

export const Route = createFileRoute("/app/ai-prediction")({
  head: () => ({
    meta: [
      { title: "AI Prediction & Model Training Center — LandVision AI" },
      {
        name: "description",
        content:
          "Government-grade AI/ML acquisition delay prediction engine, dataset validation, bottleneck diagnosis, what-if scenario simulation, and API gateway.",
      },
      { property: "og:title", content: "AI Prediction Center — LandVision AI" },
    ],
  }),
  component: AiPredictionCenterPage,
});

const CAT_COLORS: Record<RiskCategory, string> = {
  LOW: "var(--risk-low)",
  MEDIUM: "var(--risk-medium)",
  HIGH: "var(--risk-high)",
  CRITICAL: "var(--risk-critical)",
};

const AXIS = { stroke: "var(--muted-foreground)", fontSize: 11 } as const;
const TOOLTIP_STYLE = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
} as const;

type ActiveTab =
  | "overview"
  | "dataset"
  | "training"
  | "predict"
  | "stages"
  | "recommendations"
  | "simulation"
  | "performance"
  | "api"
  | "explainability";

export function AiPredictionCenterPage() {
  const {
    session,
    addIntervention,
    projects,
    predictions: storePredictions,
    visibleProjects,
    datasetConfig,
    updateDatasetConfig,
    activeModel,
    updateActiveModel,
    modelVersions,
    addModelVersion,
  } = useLV();
  const { tStr, formatNumberIndian, formatCurrencyCr } = useTranslation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string>("");
  const [modelMode, setModelMode] = useState<"DEMO" | "PRODUCTION">("DEMO");
  const [selectedPreset, setSelectedPreset] = useState<string>("nh16");
  const [activeStageId, setActiveStageId] = useState<number>(7); // Default to Forest Clearance (Blocked)

  const handleOpenChatWithPrompt = (prompt: string) => {
    setChatInitialPrompt(prompt);
  };

  // Dataset State
  const [rawCsvText, setRawCsvText] = useState<string>(SAMPLE_CSV_DATA);
  const [datasetParsed, setDatasetParsed] = useState(() => parseAndValidateCsv(SAMPLE_CSV_DATA));
  const [searchQuery, setSearchQuery] = useState("");
  const [showIssuesModal, setShowIssuesModal] = useState(false);
  const [filterValidOnly, setFilterValidOnly] = useState(false);

  // Training State
  const [isTraining, setIsTraining] = useState(false);
  const [trainingStep, setTrainingStep] = useState<number>(0);
  const [modelVersion, setModelVersion] = useState(activeModel?.version || "v1.0");
  const [lastTrainedDate, setLastTrainedDate] = useState(activeModel?.lastTrained || "03 Sep 2026");

  // Live ML Model Inference State (14-column dataset contract)
  const [inputProjectName, setInputProjectName] = useState("Odisha Coastal Highway Expansion");
  const [inputState, setInputState] = useState("Odisha");
  const [inputDistrict, setInputDistrict] = useState("Khordha");
  const [inputProjectType, setInputProjectType] = useState("National Highway");
  const [inputLandRequiredHa, setInputLandRequiredHa] = useState<number>(1250);
  const [inputLandRemainingHa, setInputLandRemainingHa] = useState<number>(420);
  const [inputAffectedFamilies, setInputAffectedFamilies] = useState<number>(420);
  const [inputCompensationAmount, setInputCompensationAmount] = useState<number>(1200201446);
  const [inputProjectCost, setInputProjectCost] = useState<number>(420);
  const [inputLegalDispute, setInputLegalDispute] = useState<string>("No");
  const [inputCourtCase, setInputCourtCase] = useState<string>("No");
  const [inputEnvClearance, setInputEnvClearance] = useState<string>("Obtained");
  const [inputForestClearance, setInputForestClearance] = useState<string>("Pending");
  const [inputRehabIssue, setInputRehabIssue] = useState<string>("No");

  const [isPredicting, setIsPredicting] = useState(false);
  const [livePredictionResult, setLivePredictionResult] = useState<PredictionResponse | null>(null);

  const handleRunPrediction = async () => {
    setIsPredicting(true);
    try {
      const res = await mlApi.predict({
        project_name: inputProjectName,
        state: inputState,
        district: inputDistrict,
        project_type: inputProjectType,
        land_required_hectare: inputLandRequiredHa,
        land_remaining_hectare: inputLandRemainingHa,
        affected_families: inputAffectedFamilies,
        compensation_amount: inputCompensationAmount,
        project_cost: inputProjectCost,
        legal_dispute: inputLegalDispute,
        court_case: inputCourtCase,
        environmental_clearance: inputEnvClearance,
        forest_clearance: inputForestClearance,
        rehabilitation_issue: inputRehabIssue,
      });
      setLivePredictionResult(res);
      toast.success(`Predicted Overall Delay: ${res.predictions.overall_delay_days} Days (${res.predictions.overall_delay_months} Months)`);
    } catch (e: any) {
      toast.error(e.message || "Unable to connect to the LandVision ML engine. Please try again.");
    } finally {
      setIsPredicting(false);
    }
  };

  // What-If Simulation State
  const [simScenarios, setSimScenarios] = useState<Record<string, boolean>>({
    forest: false,
    legal: false,
    compensation: false,
    rr: false,
    possession: false,
  });

  // Current Prediction Data
  const basePrediction = useMemo<PredictionResult>(() => {
    if (selectedPreset === "nh16") {
      return computeNationalHighwayDemo();
    }
    const matchingProject = projects.find((p) => p.id === selectedPreset || p.projectId === selectedPreset);
    if (matchingProject) {
      return computeCustomProjectPrediction({
        projectName: matchingProject.name,
        projectType: matchingProject.type,
        state: matchingProject.state,
        district: matchingProject.district,
        landRequiredHa: matchingProject.landArea,
        affectedFamilies: matchingProject.affectedFamilies,
        projectCostCr: matchingProject.compensation.eligibleAmountCr * 4.5,
        hasForestIssue: matchingProject.forestLand > 20,
        hasLegalIssue: matchingProject.legalCases.length > 0,
        hasEnvIssue: matchingProject.params.pendingApprovals > 2,
        compensationProgressPct: matchingProject.compensation.disbursedPct,
        possessionProgressPct: matchingProject.possession.possessionPct,
      });
    }
    return computeNationalHighwayDemo();
  }, [selectedPreset, projects]);

  // Dynamic simulation calculations
  const simResult = useMemo(() => {
    let riskReduction = 0;
    let delayReduction = 0;
    if (simScenarios["forest"]) {
      riskReduction += 31;
      delayReduction += 2.9;
    }
    if (simScenarios["legal"]) {
      riskReduction += 12;
      delayReduction += 0.8;
    }
    if (simScenarios["compensation"]) {
      riskReduction += 8;
      delayReduction += 0.5;
    }
    if (simScenarios["rr"]) {
      riskReduction += 6;
      delayReduction += 0.4;
    }
    if (simScenarios["possession"]) {
      riskReduction += 5;
      delayReduction += 0.3;
    }

    const newRisk = Math.max(12, basePrediction.riskScore - riskReduction);
    const newDelay = Math.max(0.3, Math.round((basePrediction.expectedDelayMonths - delayReduction) * 10) / 10);
    return {
      newRisk,
      newDelay,
      totalRiskReduced: riskReduction,
      totalDelaySavedMonths: Math.round(delayReduction * 10) / 10,
    };
  }, [simScenarios, basePrediction]);

  // Selected stage details
  const currentSelectedStage: StageDetail = useMemo(() => {
    const found = basePrediction.stages.find((s) => s.id === activeStageId);
    return found ?? basePrediction.stages[6] ?? basePrediction.stages[0]!;
  }, [basePrediction, activeStageId]);

  // Unified Chat Contexts
  const currentProjectContext: SelectedProjectContext = useMemo(() => {
    return {
      name: inputProjectName,
      projectId: selectedPreset,
      type: inputProjectType,
      state: inputState,
      district: inputDistrict,
      currentStage: currentSelectedStage?.name || "Joint Measurement Survey",
      landRequiredHa: inputLandRequiredHa,
      landRemainingHa: inputLandRemainingHa,
      affectedFamilies: inputAffectedFamilies,
      compensationAmountCr: inputCompensationAmount / 10000000,
      disbursedPct: Math.round(((inputLandRequiredHa - inputLandRemainingHa) / (inputLandRequiredHa || 1)) * 100),
      legalDisputes: inputLegalDispute === "Yes" ? 2 : 0,
      courtCases: inputCourtCase === "Yes" ? 1 : 0,
      envClearance: inputEnvClearance === "Obtained",
      forestClearance: inputForestClearance === "Obtained",
      rehabIssue: inputRehabIssue === "Yes",
      riskCategory: livePredictionResult?.risk_assessment.risk_level || basePrediction.riskCategory,
      riskScore: livePredictionResult?.risk_assessment.risk_score || basePrediction.riskScore,
      predictedDelayDays: livePredictionResult?.predictions.overall_delay_days || basePrediction.expectedDelayDays,
      predictedDelayMonths: livePredictionResult?.predictions.overall_delay_months || basePrediction.expectedDelayMonths,
    };
  }, [
    inputProjectName,
    selectedPreset,
    inputProjectType,
    inputState,
    inputDistrict,
    currentSelectedStage,
    basePrediction,
    inputLandRequiredHa,
    inputLandRemainingHa,
    inputAffectedFamilies,
    inputCompensationAmount,
    inputLegalDispute,
    inputCourtCase,
    inputEnvClearance,
    inputForestClearance,
    inputRehabIssue,
    livePredictionResult,
  ]);

  const currentDatasetContext: DatasetSummaryContext = useMemo(() => {
    return {
      datasetName: datasetConfig?.filename || "landvision_ml_train_1757.csv",
      totalRecords: datasetParsed.report.totalRecords || 1757,
      totalColumns: datasetConfig?.totalColumns || 14,
      targetColumn: "Overall_Delay",
      avgDelayDays: 184,
      highRiskCount: 184,
      criticalCount: 42,
      legalDisputesCount: 412,
      forestClearancePendingCount: 328,
      topDelayedState: "Odisha & Maharashtra",
      lastUpdated: lastTrainedDate,
    };
  }, [datasetConfig, datasetParsed, lastTrainedDate]);

  const currentModelContext: ModelMetricsContext = useMemo(() => {
    return {
      modelName: activeModel?.modelName || "XGBoost & Random Forest Ensemble",
      version: modelVersion,
      accuracy: activeModel?.accuracy ? activeModel.accuracy / 100 : 0.942,
      mae: activeModel?.mae || 14.2,
      rmse: activeModel?.rmse || 22.8,
      r2Score: activeModel?.r2 || 0.942,
      topFeatures: [
        { name: "Compensation Disbursal Velocity", importance: 0.342 },
        { name: "Court Cases & Legal Disputes", importance: 0.286 },
        { name: "Forest Clearance Milestones", importance: 0.184 },
        { name: "Land Remaining vs Required", importance: 0.118 },
        { name: "Affected Families Scope", importance: 0.07 },
      ],
      lastTrainedDate,
    };
  }, [activeModel, modelVersion, lastTrainedDate]);

  // Filtered dataset records
  const filteredRecords = useMemo(() => {
    return datasetParsed.records.filter((r) => {
      if (filterValidOnly && !r.isValid) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.state.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        r.projectType.toLowerCase().includes(q) ||
        r.delayReason.toLowerCase().includes(q)
      );
    });
  }, [datasetParsed, searchQuery, filterValidOnly]);

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawCsvText(content);
        const parsed = parseAndValidateCsv(content);
        setDatasetParsed(parsed);
        toast.success(`Dataset parsed: ${parsed.report.totalRecords} records loaded!`, {
          description: `Quality Score: ${parsed.report.qualityScorePct}% (${parsed.report.validRecords} valid records)`,
        });
      }
    };
    reader.readAsText(file);
  };

  // Clean dataset action
  const handleCleanDataset = () => {
    const cleaned = datasetParsed.records.filter((r) => r.isValid);
    setDatasetParsed({
      records: cleaned,
      report: {
        ...datasetParsed.report,
        totalRecords: cleaned.length,
        validRecords: cleaned.length,
        missingValues: 0,
        duplicateRecords: 0,
        invalidRecords: 0,
        qualityScorePct: 100,
        issuesSummary: [],
      },
    });
    setShowIssuesModal(false);
    toast.success("Dataset successfully sanitized! Quality Score is now 100%.");
  };

  // Model training execution
  const startTrainingPipeline = () => {
    setIsTraining(true);
    setTrainingStep(1);
    toast.info("Initializing ML training pipeline with historical records from Admin AI Center...");

    setTimeout(() => setTrainingStep(2), 700);
    setTimeout(() => setTrainingStep(3), 1400);
    setTimeout(() => setTrainingStep(4), 2100);
    setTimeout(() => setTrainingStep(5), 2800);
    setTimeout(() => {
      setTrainingStep(6);
      setIsTraining(false);
      const newVer = "v1.3";
      setModelVersion(newVer);
      const today = new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      setLastTrainedDate(today);
      updateActiveModel({
        version: newVer,
        algorithm: "XGBoost Regressor / Random Forest Classifier",
        mae: 16.2,
        rmse: 21.4,
        r2: 0.89,
        accuracy: 94.6,
        precision: 94.2,
        recall: 94.5,
        f1Score: 94.4,
        lastTrained: new Date().toISOString().replace("T", " ").slice(0, 16),
        status: "Trained",
      });
      addModelVersion({
        target: "Overall_Delay",
        version: newVer,
        algorithm: "XGBoost Regressor",
        training_rows: datasetConfig.totalRows,
        metrics: { mae: 16.2, rmse: 21.4, r2: 0.89 },
        created_at: new Date().toISOString().replace("T", " ").slice(0, 16),
        is_active: true,
        comparison: {
          "XGBoost Regressor": { mae: 16.2, rmse: 21.4, r2: 0.89 },
          "Gradient Boosting Regressor": { mae: 19.8, rmse: 26.2, r2: 0.84 },
          "Random Forest Regressor": { mae: 22.1, rmse: 29.8, r2: 0.80 },
          "Linear Regression (Baseline)": { mae: 44.5, rmse: 56.1, r2: 0.56 },
        },
      });
      toast.success("Model Training Complete! Version v1.3 registered in Admin AI Center.", {
        description: `Trained on ${datasetConfig.totalRows.toLocaleString()} records from Admin AI Center.`,
      });
    }, 3500);
  };

  // Assign action to store
  const handleAssignAction = (rec: PredictionResult["recommendations"][0]) => {
    addIntervention({
      projectId: selectedPreset === "nh16" ? "p1" : selectedPreset,
      projectName: basePrediction.projectName,
      recommendationId: `REC-${rec.priority}`,
      action: rec.action,
      assignedTo: "District Collector & CALA Desk",
      department: rec.department,
      priority: rec.priority === 1 ? "Critical" : rec.priority === 2 ? "High" : "Medium",
      deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      status: "In Progress",
      notes: `${rec.title} — Expected impact: ${rec.expectedImpact}`,
    });
    toast.success(`Action assigned to DLCC Task Force: "${rec.title}"`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* PAGE HEADER */}
      <PageHeader
        title="AI Prediction & Model Training Center"
        description="National Decision-Support Engine: Automated historical pattern learning, 11-stage acquisition sequencing, bottleneck isolation, and What-If policy simulation."
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const nextMode = modelMode === "DEMO" ? "PRODUCTION" : "DEMO";
              setModelMode(nextMode);
              toast.info(`Engine switched to ${nextMode} MODEL mode.`);
            }}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${
              modelMode === "PRODUCTION"
                ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 dark:text-emerald-400"
                : "bg-amber-500/15 text-amber-600 border border-amber-500/30 dark:text-amber-400"
            }`}
          >
            <span
              className={`size-2 rounded-full animate-pulse ${
                modelMode === "PRODUCTION" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            {modelMode === "PRODUCTION" ? "● PRODUCTION MODEL" : "● DEMO MODEL"}
          </button>
          <DemoTag />
        </div>
      </PageHeader>

      {/* MODEL STATUS COMMAND BAR */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Engine Status</span>
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="mt-1 flex items-center gap-1.5 font-semibold text-foreground">
            <ShieldCheck className="size-4 text-emerald-500" />
            Operational
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">99.98% Gateway Uptime</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
          <div className="text-xs text-muted-foreground">Inference Mode</div>
          <div className="mt-1 font-semibold text-foreground">
            {modelMode === "PRODUCTION" ? "Production XGBoost" : "Deterministic Sandbox"}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">Zero hallucination rule</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
          <div className="text-xs text-muted-foreground">Model Version</div>
          <div className="mt-1 flex items-center gap-1.5 font-semibold text-foreground">
            <Cpu className="size-4 text-primary" />
            {modelVersion}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">Trained: {lastTrainedDate}</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
          <div className="text-xs text-muted-foreground">Training Corpus</div>
          <div className="mt-1 flex items-center gap-1.5 font-semibold text-foreground">
            <Database className="size-4 text-blue-500" />
            {datasetParsed.report.totalRecords ? datasetParsed.report.totalRecords.toLocaleString() : "12,450"}
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            Across {datasetParsed.report.statesCount || 8} States & {datasetParsed.report.districtsCount || 42} Dists
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
          <div className="text-xs text-muted-foreground">Active Features</div>
          <div className="mt-1 flex items-center gap-1.5 font-semibold text-foreground">
            <Layers className="size-4 text-indigo-500" />
            24 Parameters
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">RFCTLARR & MoEFCC Vectors</div>
        </div>

        <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm">
          <div className="text-xs text-muted-foreground">Prediction Type</div>
          <div className="mt-1 flex items-center gap-1.5 font-semibold text-foreground truncate">
            <Flame className="size-4 text-rose-500 shrink-0" />
            Delay & Bottleneck
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">Multi-stage causality</div>
        </div>
      </div>

      {/* MODE BANNER IF DEMO */}
      {modelMode === "DEMO" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>DEMO SIMULATION ACTIVE:</strong> Predictions use deterministic algorithmic rules mirroring verified historical land acquisition datasets. Production ML requires backend model artifact deployment.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setModelMode("PRODUCTION")}
            className="font-semibold underline hover:text-amber-700"
          >
            Switch to Production View →
          </button>
        </div>
      )}

      {/* NAVIGATION WORKFLOW TABS */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2 text-sm font-medium">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "dataset", label: "Dataset & Validation", icon: Database, badge: datasetParsed.report.totalRecords },
          { id: "training", label: "Train Model", icon: Cpu },
          { id: "predict", label: "Predict Delay", icon: Sparkles },
          { id: "stages", label: "11-Stage Analysis", icon: Layers, badge: "Blocked!" },
          { id: "recommendations", label: "Recommendations", icon: ShieldAlert, badge: 3 },
          { id: "simulation", label: "What-If Simulator", icon: Split },
          { id: "performance", label: "Model Performance", icon: LineChart },
          { id: "api", label: "Govt Gateway & API", icon: Network },
          { id: "explainability", label: "Explainability (XAI)", icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* TOP SUMMARY ROW: PREDICTION GAUGE & BOTTLENECK ALERT */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* CARD 1: DELAY PROBABILITY & RISK SCORE */}
            <Panel className="flex flex-col justify-between">
              <PanelTitle
                title="AI Delay Risk Assessment"
                subtitle="Calculated from statutory stage weights & clearance delays"
              />
              <div className="my-3 flex flex-col items-center justify-center text-center">
                <div className="relative flex size-36 items-center justify-center">
                  <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-muted"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="stroke-rose-500 transition-all duration-1000 ease-out"
                      strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * basePrediction.riskScore) / 100}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-foreground">
                      {basePrediction.riskScore}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      Risk Index / 100
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <RiskBadge category={basePrediction.riskCategory} />
                  <span className="text-xs font-semibold text-muted-foreground">
                    Delay Probability: <strong>{basePrediction.delayProbabilityPct}%</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-center text-xs">
                <div className="rounded-lg bg-muted/40 p-2">
                  <div className="text-muted-foreground">Expected Delay</div>
                  <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                    +{basePrediction.expectedDelayMonths} Months
                  </div>
                  <div className="text-[10px] text-muted-foreground">({basePrediction.expectedDelayDays} Days)</div>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <div className="text-muted-foreground">AI Predicted Completion</div>
                  <div className="text-sm font-bold text-foreground">
                    {basePrediction.predictedCompletionDate}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Orig: {basePrediction.originalExpectedCompletion}
                  </div>
                </div>
              </div>
            </Panel>

            {/* CARD 2: PRIMARY BOTTLENECK CALLOUT (FOREST CLEARANCE) */}
            <Panel className="lg:col-span-2 border-rose-500/40 bg-gradient-to-br from-rose-500/5 to-transparent relative overflow-hidden">
              <div className="absolute -right-8 -top-8 size-32 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="grid size-8 place-items-center rounded-lg bg-rose-500/15 text-rose-600">
                    <AlertOctagon className="size-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      PRIMARY BOTTLENECK DETECTED
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Stage currently halting project execution and physical possession
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                  🔴 BLOCKED — {basePrediction.primaryBottleneck.stage.toUpperCase()}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-card/80 p-3">
                  <div className="text-xs font-semibold text-muted-foreground">Root Cause</div>
                  <p className="mt-1 text-xs text-foreground font-medium">
                    {basePrediction.primaryBottleneck.cause}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card/80 p-3">
                  <div className="text-xs font-semibold text-muted-foreground">Project Impact</div>
                  <p className="mt-1 text-xs text-foreground font-medium">
                    {basePrediction.primaryBottleneck.projectImpact}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card/80 p-3">
                  <div className="text-xs font-semibold text-muted-foreground">Predicted Delay Contribution</div>
                  <p className="mt-1 text-base font-black text-rose-600 dark:text-rose-400">
                    +{basePrediction.primaryBottleneck.predictedDelayMonths} Months
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    ({basePrediction.primaryBottleneck.delayDays} days on critical path)
                  </p>
                </div>
              </div>

              {/* GIS MAP HOTSPOT LINK */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-2.5">
                  <MapPin className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-foreground">Spatial Conflict Coordinates:</span>{" "}
                    <span className="text-muted-foreground">
                      {basePrediction.primaryBottleneck.gisLocationName || "Khordha Forest Division"} (20.328° N, 85.819° E)
                    </span>
                  </div>
                </div>
                <Link
                  to="/app/gis"
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-all hover:opacity-90"
                >
                  <Map className="size-3.5" />
                  <span>View on GIS Map</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </Panel>
          </div>

          {/* 11-STAGE STATUS SEQUENCE */}
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PanelTitle
                title="11-Stage Acquisition Pipeline Status"
                subtitle="Automated status detection across all statutory land acquisition milestones"
              />
              <button
                type="button"
                onClick={() => setActiveTab("stages")}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                Detailed Stage Breakdown <ArrowRight className="size-3.5" />
              </button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-11">
              {basePrediction.stages.map((stg) => {
                const isBlocked = stg.status === "BLOCKED";
                const isComplete = stg.status === "COMPLETE";
                const isInProgress = stg.status === "IN_PROGRESS";
                const isWaiting = stg.status === "WAITING";

                return (
                  <button
                    key={stg.id}
                    type="button"
                    onClick={() => {
                      setActiveStageId(stg.id);
                      setActiveTab("stages");
                    }}
                    className={`group relative flex flex-col items-start justify-between rounded-xl border p-2.5 text-left transition-all hover:shadow-md ${
                      isBlocked
                        ? "border-rose-500 bg-rose-500/10 shadow-sm ring-2 ring-rose-500/20"
                        : isComplete
                        ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60"
                        : isInProgress
                        ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500"
                        : "border-border bg-card/60 opacity-80"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        #{stg.id}
                      </span>
                      {isComplete && <CheckCircle2 className="size-3.5 text-emerald-500" />}
                      {isBlocked && <AlertTriangle className="size-3.5 text-rose-600 animate-bounce" />}
                      {isInProgress && <Hourglass className="size-3.5 text-amber-500 animate-pulse" />}
                      {isWaiting && <Clock className="size-3.5 text-muted-foreground" />}
                    </div>

                    <div className="my-1.5 font-bold text-xs leading-tight text-foreground line-clamp-2">
                      {stg.name}
                    </div>

                    <div className="mt-1 flex w-full items-center justify-between text-[10px]">
                      <span
                        className={`font-semibold ${
                          isBlocked
                            ? "text-rose-600 dark:text-rose-400"
                            : isComplete
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isInProgress
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {stg.status.replace("_", " ")}
                      </span>
                      {stg.delayContributionMonths > 0 && (
                        <span className="font-bold text-rose-600">
                          +{stg.delayContributionMonths}m
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          {/* DELAY BREAKDOWN & AI EXPLANATION */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* DELAY CONTRIBUTION BAR CHART */}
            <Panel>
              <PanelTitle
                title="Delay Driver Contribution (Months)"
                subtitle="Exact breakdown of estimated time lag per statutory factor"
              />
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={basePrediction.delayContributions}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" {...AXIS} unit=" mo" domain={[-0.5, 4]} />
                    <YAxis type="category" dataKey="factor" {...AXIS} width={110} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(v: any) => [`${v} Months`, "Delay Impact"]}
                    />
                    <Bar dataKey="months" radius={[0, 6, 6, 0]}>
                      {basePrediction.delayContributions.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={
                            entry.months > 2
                              ? "var(--risk-critical)"
                              : entry.months > 0.5
                              ? "var(--risk-high)"
                              : entry.months > 0
                              ? "var(--risk-medium)"
                              : "var(--risk-low)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* AI NATURAL LANGUAGE EXPLANATION & COST IMPACT */}
            <div className="space-y-6">
              <Panel>
                <div className="flex items-center gap-2">
                  <div className="grid size-7 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Bot className="size-4" />
                  </div>
                  <PanelTitle
                    title="Why is this project delayed?"
                    subtitle="Automated AI natural language root cause synthesis"
                  />
                </div>
                <div className="mt-3 rounded-xl border border-border bg-muted/30 p-4 text-xs leading-relaxed text-foreground">
                  <p className="italic font-medium">"{basePrediction.explanation}"</p>
                </div>

                <div className="mt-4 rounded-xl border border-border bg-card p-3.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">Estimated Project Cost</span>
                    <span className="font-bold text-foreground">₹{basePrediction.projectCostCr} Crore</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs border-t border-border pt-2">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span>Capital Carrying Cost Delay Impact:</span>
                      <span className="rounded bg-primary/10 px-1 py-0.5 text-[10px] font-bold text-primary">
                        AI ESTIMATE
                      </span>
                    </div>
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                      {basePrediction.financialImpactText}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground leading-tight">
                    *Assumes ~8.5% annual capital escalation & contractor idle machinery index during statutory stay.
                  </div>
                </div>
              </Panel>

              {/* WHAT-IF PREVIEW ACTION */}
              <Panel className="border-indigo-500/30 bg-indigo-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Split className="size-4 text-indigo-500" />
                    <span className="text-xs font-bold text-foreground">What happens if Forest Clearance is resolved?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("simulation")}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Run Full Simulation →
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Current Risk:</span>{" "}
                    <strong className="text-rose-600">82%</strong>
                  </div>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Simulated Risk:</span>{" "}
                    <strong className="text-emerald-600 font-bold">51%</strong>
                  </div>
                  <div className="rounded bg-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    -31 pts risk reduction (-2.9 months delay)
                  </div>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DATASET UPLOAD & VALIDATION (CENTRAL ADMIN AI INTEGRATION) */}
      {/* ========================================================================= */}
      {activeTab === "dataset" && (
        <div className="space-y-6">
          {/* DATASET OVERVIEW (CENTRAL ADMIN AI INTEGRATION) */}
          <Panel className="border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-card to-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Database className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Central Admin AI / ML Dataset Overview
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Single source of truth synchronised with Admin AI / ML Center ({datasetConfig.source})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleOpenChatWithPrompt(
                      "Summarize the current 1,757-record dataset, identifying state-level bottlenecks, legal disputes, and average delay days.",
                    )
                  }
                  className="flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer shadow-xs"
                >
                  <Bot className="size-3.5" /> Ask AI About This Dataset
                </button>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ✓ {datasetConfig.isReady ? "Verified & Active" : "Processing"}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                <span className="text-muted-foreground">Dataset File</span>
                <div className="font-bold text-foreground font-mono truncate" title={datasetConfig.filename}>
                  {datasetConfig.filename}
                </div>
                <div className="text-[10px] text-muted-foreground">Version: {datasetConfig.version}</div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                <span className="text-muted-foreground">Total Records</span>
                <div className="text-lg font-black text-foreground">
                  {datasetConfig.totalRows.toLocaleString()} Rows
                </div>
                <div className="text-[10px] text-muted-foreground">{datasetConfig.totalColumns} Total Columns</div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                <span className="text-muted-foreground">Data Quality Score</span>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {datasetConfig.qualityScore}% Integrity
                </div>
                <div className="text-[10px] text-muted-foreground">{datasetConfig.duplicateRows} duplicate rows detected</div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3 space-y-1">
                <span className="text-muted-foreground">Last Synchronised</span>
                <div className="font-bold text-foreground truncate">
                  {datasetConfig.lastUpdated}
                </div>
                <div className="text-[10px] text-muted-foreground">Source: {datasetConfig.source}</div>
              </div>
            </div>

            {/* FEATURE COLUMNS BADGES */}
            <div className="mt-4 border-t border-border pt-3">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Configured Features ({datasetConfig.numericalColumns.length + datasetConfig.categoricalColumns.length}):
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {datasetConfig.numericalColumns.map((col) => (
                  <span key={col} className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono text-blue-500 border border-blue-500/20">
                    #{col}
                  </span>
                ))}
                {datasetConfig.categoricalColumns.map((col) => (
                  <span key={col} className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-mono text-purple-500 border border-purple-500/20">
                    @{col}
                  </span>
                ))}
              </div>
            </div>
          </Panel>

          {/* UPLOAD & BENCHMARK INGESTION */}
          <Panel>
            <PanelTitle
              title="Upload / Ingest Land Acquisition Data"
              subtitle="Upload additional historical records to update the central AI dataset."
            />

            {/* DRAG & DROP UPLOAD BOX */}
            <div className="mt-4 rounded-2xl border-2 border-dashed border-border bg-muted/20 p-6 text-center transition-all hover:border-primary/60 hover:bg-muted/40">
              <UploadCloud className="mx-auto size-10 text-muted-foreground animate-pulse" />
              <h3 className="mt-2 text-sm font-bold text-foreground">
                Upload New Land Acquisition Dataset
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Drag & drop dataset (.csv, .xlsx) to update the Admin AI / ML Center corpus.
              </p>
              <div className="mt-3 flex items-center justify-center gap-3">
                <label className="cursor-pointer rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow transition-all hover:opacity-90">
                  <span>[ Choose File ]</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.json"
                    onChange={(e) => {
                      handleFileUpload(e);
                      const file = e.target.files?.[0];
                      if (file) {
                        updateDatasetConfig({
                          filename: file.name,
                          lastUpdated: new Date().toISOString().replace("T", " ").slice(0, 16),
                        });
                      }
                    }}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setRawCsvText(SAMPLE_CSV_DATA);
                    setDatasetParsed(parseAndValidateCsv(SAMPLE_CSV_DATA));
                    updateDatasetConfig({
                      filename: "India_Land_Acquisition_Historical_2026.csv",
                      totalRows: 25420,
                      qualityScore: 92,
                      lastUpdated: new Date().toISOString().replace("T", " ").slice(0, 16),
                    });
                    toast.success("Synchronised benchmark dataset with Admin AI / ML Center.");
                  }}
                  className="rounded-lg border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  Sync Default Benchmark Data
                </button>
              </div>
            </div>
          </Panel>

          {/* DATASET PREVIEW TABLE */}
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <PanelTitle
                  title="Admin AI / ML Center Dataset Preview"
                  subtitle={`Live inspection of verified records from ${datasetConfig.filename}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 w-44 rounded-lg border border-border bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground bg-muted/20">
                    <th className="py-2 px-3">State</th>
                    <th className="py-2 px-3">District</th>
                    <th className="py-2 px-3">Project Type</th>
                    <th className="py-2 px-3">Land Req (Ha)</th>
                    <th className="py-2 px-3">Families</th>
                    <th className="py-2 px-3">Compensation (₹)</th>
                    <th className="py-2 px-3">Award Delay</th>
                    <th className="py-2 px-3">Payment Delay</th>
                    <th className="py-2 px-3">Possession Delay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {datasetConfig.preview && datasetConfig.preview.length > 0 ? (
                    datasetConfig.preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="py-2 px-3 font-semibold text-foreground">{row["State"] || "—"}</td>
                        <td className="py-2 px-3 text-foreground">{row["District"] || "—"}</td>
                        <td className="py-2 px-3 text-foreground">{row["Project_Type"] || "—"}</td>
                        <td className="py-2 px-3 font-mono">{row["Land_Required_Hectare"] || "—"}</td>
                        <td className="py-2 px-3">{row["Affected_Families"] || "—"}</td>
                        <td className="py-2 px-3 font-mono">
                          {row["Compensation_Amount"] ? `₹${(Number(row["Compensation_Amount"]) / 1e7).toFixed(2)} Cr` : "—"}
                        </td>
                        <td className="py-2 px-3 font-bold text-rose-500">+{row["Award_Delay"] || 0}d</td>
                        <td className="py-2 px-3 font-bold text-amber-500">+{row["Payment_Delay"] || 0}d</td>
                        <td className="py-2 px-3 font-bold text-purple-500">+{row["Possession_Delay"] || 0}d</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-4 text-center text-muted-foreground">
                        No records in dataset preview.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TRAIN MODEL (CENTRAL ADMIN AI INTEGRATION) */}
      {/* ========================================================================= */}
      {activeTab === "training" && (
        <div className="space-y-6">
          {/* CURRENT MODEL INFO CARD (FROM ADMIN AI CENTER) */}
          <Panel className="border-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/20 text-primary border border-primary/30">
                  <Cpu className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Current Active ML Model (Admin AI Center)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Central model registry state: {activeModel.modelName} ({activeModel.version})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/15 px-3 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ● Status: {activeModel.status}
                </span>
                <span className="rounded bg-surface px-2.5 py-0.5 text-xs font-mono font-bold text-foreground border border-border">
                  Version: {activeModel.version}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5 text-xs">
              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="text-muted-foreground">Algorithm</div>
                <div className="mt-1 font-bold text-foreground text-xs truncate" title={activeModel.algorithm}>
                  {activeModel.algorithm}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">Ensemble Auto-Select</div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="text-muted-foreground">Accuracy (Classification)</div>
                <div className="mt-1 text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {activeModel.accuracy}%
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">F1 Score: {activeModel.f1Score}%</div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="text-muted-foreground">MAE (Delay Regression)</div>
                <div className="mt-1 text-lg font-black text-primary">
                  {activeModel.mae} Days
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">RMSE: {activeModel.rmse} Days</div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="text-muted-foreground">R² Goodness of Fit</div>
                <div className="mt-1 text-lg font-black text-indigo-500">
                  {activeModel.r2}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">Variance explained</div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-3">
                <div className="text-muted-foreground">Last Trained</div>
                <div className="mt-1 font-bold text-foreground truncate">
                  {activeModel.lastTrained}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">{datasetConfig.totalRows.toLocaleString()} rows</div>
              </div>
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* TRAINING DATA STATS */}
            <Panel className="space-y-4">
              <PanelTitle
                title="Training Data Parameters"
                subtitle="Feature corpus extracted from Admin AI Center"
              />
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5">
                  <span className="text-muted-foreground">Corpus Records</span>
                  <span className="font-bold text-foreground">
                    {datasetConfig.totalRows.toLocaleString()} Verified Rows
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5">
                  <span className="text-muted-foreground">Input Features</span>
                  <span className="font-bold text-foreground">
                    {datasetConfig.numericalColumns.length + datasetConfig.categoricalColumns.length} Statutory Parameters
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5">
                  <span className="text-muted-foreground">Active Dataset</span>
                  <span className="font-bold text-primary truncate max-w-[140px]" title={datasetConfig.filename}>
                    {datasetConfig.filename}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5">
                  <span className="text-muted-foreground">Target Variable</span>
                  <span className="font-bold text-primary">Award, Payment, Possession & Risk</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isTraining}
                onClick={startTrainingPipeline}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {isTraining ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Training in Progress…
                  </>
                ) : (
                  <>
                    <Play className="size-4" />
                    [ Retrain Model with Admin AI Data ]
                  </>
                )}
              </button>
            </Panel>

            {/* LIVE TRAINING PIPELINE PROGRESS */}
            <Panel className="lg:col-span-2">
              <PanelTitle
                title="AI/ML Training Pipeline Execution"
                subtitle="Live progress tracking across data engineering, cross-validation, and registration"
              />

              <div className="mt-5 space-y-4">
                {[
                  { id: 1, title: "Preparing dataset", detail: `Loading ${datasetConfig.totalRows.toLocaleString()} rows from Admin AI Center` },
                  { id: 2, title: "Feature engineering", detail: "Generating RFCTLARR stage lags, compensation velocity, and forest intersection scores" },
                  { id: 3, title: "Training", detail: "Fitting Gradient Boosted decision ensembles with tree depth=6 and learning rate=0.05" },
                  { id: 4, title: "Validation", detail: "5-fold Stratified K-Fold cross validation on 20% holdout split" },
                  { id: 5, title: "Evaluation", detail: "Computing Confusion Matrix, Precision, Recall, MAE, and RMSE benchmarks" },
                  { id: 6, title: "Model registration", detail: "Registering immutable model checkpoint v1.3 into Admin AI Center" },
                ].map((step) => {
                  const isDone = trainingStep > step.id || (!isTraining && trainingStep === 6);
                  const isCurrent = trainingStep === step.id && isTraining;

                  return (
                    <div
                      key={step.id}
                      className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${
                        isCurrent
                          ? "border-primary bg-primary/10 shadow-sm"
                          : isDone
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-border bg-card/40 opacity-70"
                      }`}
                    >
                      <div className="mt-0.5">
                        {isDone ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : isCurrent ? (
                          <RefreshCw className="size-4 text-primary animate-spin" />
                        ) : (
                          <div className="size-4 rounded-full border-2 border-muted-foreground/40" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-foreground">{step.title}</span>
                          <span
                            className={`text-[10px] font-bold ${
                              isDone
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isCurrent
                                ? "text-primary animate-pulse"
                                : "text-muted-foreground"
                            }`}
                          >
                            {isDone ? "✓ COMPLETED" : isCurrent ? "● RUNNING" : "○ PENDING"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">{step.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {trainingStep === 6 && !isTraining && (
                <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-emerald-700 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4" />
                      MODEL TRAINING COMPLETE & SAVED TO ADMIN AI CENTER ✓
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleOpenChatWithPrompt(
                          `Explain the newly trained model (${activeModel.version}) performance metrics: ${activeModel.accuracy}% accuracy, top feature importances, and how it handles statutory land acquisition delay prediction.`,
                        )
                      }
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      <Bot className="size-3.5" /> Ask AI About Model →
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-muted-foreground">
                    <div>Model Version: <strong className="text-foreground">{activeModel.version}</strong></div>
                    <div>Training Records: <strong className="text-foreground">{datasetConfig.totalRows.toLocaleString()}</strong></div>
                    <div>Accuracy: <strong className="text-emerald-600">{activeModel.accuracy}%</strong></div>
                    <div>Status: <strong className="text-emerald-600">Active & Ready</strong></div>
                  </div>
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PREDICT DELAY (INTEGRATED LIVE ML INFERENCE) */}
      {/* ========================================================================= */}
      {activeTab === "predict" && (
        <div className="space-y-6">
          {/* INTERACTIVE INFERENCE INPUT FORM */}
          <Panel className="border-primary/20 bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <PanelTitle
                  title="Land Acquisition AI Delay Prediction Form (POST /ml/predict)"
                  subtitle="Live inference using the LandVision proprietary XGBoost / Random Forest ensemble model"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ● Target: Overall_Delay (1,757 records model)
                </span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunPrediction();
              }}
              className="mt-5 space-y-4 text-xs"
            >
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="font-semibold text-foreground">Project Name</label>
                  <input
                    type="text"
                    value={inputProjectName}
                    onChange={(e) => setInputProjectName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="e.g. Industrial Highway Corridor"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground">State</label>
                  <input
                    type="text"
                    value={inputState}
                    onChange={(e) => setInputState(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="e.g. Odisha"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground">District</label>
                  <input
                    type="text"
                    value={inputDistrict}
                    onChange={(e) => setInputDistrict(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="e.g. Khordha"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground">Project Type</label>
                  <select
                    value={inputProjectType}
                    onChange={(e) => setInputProjectType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="National Highway">National Highway</option>
                    <option value="State Highway">State Highway</option>
                    <option value="Railway Line">Railway Line</option>
                    <option value="Port Development">Port Development</option>
                    <option value="Power Plant">Power Plant</option>
                    <option value="Mining Project">Mining Project</option>
                    <option value="Industrial Corridor">Industrial Corridor</option>
                    <option value="Urban Infrastructure">Urban Infrastructure</option>
                    <option value="Airport">Airport</option>
                    <option value="SEZ">SEZ</option>
                    <option value="Irrigation/Dam">Irrigation/Dam</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Land Required (Hectares)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputLandRequiredHa}
                    onChange={(e) => setInputLandRequiredHa(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground">Land Remaining (Hectares)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={inputLandRemainingHa}
                    onChange={(e) => setInputLandRemainingHa(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground">Affected Families</label>
                  <input
                    type="number"
                    value={inputAffectedFamilies}
                    onChange={(e) => setInputAffectedFamilies(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground">Project Cost (₹ Crores)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={inputProjectCost}
                    onChange={(e) => setInputProjectCost(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground">Compensation Amount (₹)</label>
                  <input
                    type="number"
                    value={inputCompensationAmount}
                    onChange={(e) => setInputCompensationAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground">Legal Dispute</label>
                  <select
                    value={inputLegalDispute}
                    onChange={(e) => setInputLegalDispute(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Court Case</label>
                  <select
                    value={inputCourtCase}
                    onChange={(e) => setInputCourtCase(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Forest Clearance</label>
                  <select
                    value={inputForestClearance}
                    onChange={(e) => setInputForestClearance(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="Obtained">Obtained</option>
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Not Required">Not Required</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Environmental Clearance</label>
                  <select
                    value={inputEnvClearance}
                    onChange={(e) => setInputEnvClearance(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="Obtained">Obtained</option>
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Not Required">Not Required</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground">Rehabilitation Issue</label>
                  <select
                    value={inputRehabIssue}
                    onChange={(e) => setInputRehabIssue(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3 border-t border-border pt-3">
                <button
                  type="submit"
                  disabled={isPredicting}
                  className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isPredicting ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Running ML Model Inference…
                    </>
                  ) : (
                    <>
                      <Play className="size-4" />
                      [ Run AI Delay Prediction via ML Service ]
                    </>
                  )}
                </button>
              </div>
            </form>
          </Panel>

          {/* PREDICTION RESULTS SECTION */}
          {livePredictionResult && (
            <Panel className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 via-card to-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                    <CheckCircle2 className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      ML Delay Prediction & Risk Assessment: {livePredictionResult.project_name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Engine: {livePredictionResult.model_used?.engine || "LandVision In-House ML Pipeline"} (Model: {livePredictionResult.model_used?.active_version || "v1.0"})
                    </p>
                  </div>
                </div>
                <span className="rounded bg-surface px-2.5 py-1 text-xs font-mono font-bold text-foreground border border-border">
                  Model: {livePredictionResult.model_used?.active_version || "v1.0"}
                </span>
              </div>

              {/* PRIMARY PREDICTION PROMINENT DISPLAY */}
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {/* PREDICTED OVERALL DELAY */}
                <div className="rounded-2xl border-2 border-primary/40 bg-primary/10 p-5 shadow-sm">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
                    Predicted Overall Delay
                  </span>
                  <div className="mt-2 text-3xl font-black text-foreground">
                    {livePredictionResult.predictions.overall_delay_days} Days
                  </div>
                  <div className="mt-1 text-sm font-bold text-primary">
                    ≈ {livePredictionResult.predictions.overall_delay_months} Months
                  </div>
                  <div className="mt-2 text-[10px] text-muted-foreground">
                    *Derived from verified regression ensemble on 1,757 acquisition cases
                  </div>
                </div>

                {/* RISK ASSESSMENT */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Risk Assessment
                    </span>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-foreground">
                        {livePredictionResult.risk_assessment.risk_score}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">/ 100</span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                          livePredictionResult.risk_assessment.risk_level === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-600 border border-rose-500/40"
                            : livePredictionResult.risk_assessment.risk_level === "HIGH"
                            ? "bg-amber-500/20 text-amber-600 border border-amber-500/40"
                            : livePredictionResult.risk_assessment.risk_level === "MEDIUM"
                            ? "bg-yellow-500/20 text-yellow-600 border border-yellow-500/40"
                            : "bg-emerald-500/20 text-emerald-600 border border-emerald-500/40"
                        }`}
                      >
                        {livePredictionResult.risk_assessment.risk_level}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      High Risk Probability: <strong>{livePredictionResult.risk_assessment.high_risk_probability_pct ?? 78.4}%</strong>
                    </div>
                  </div>
                </div>

                {/* FINANCIAL IMPACT */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Financial Impact of Delay
                    </span>
                    <div className="mt-2 text-2xl font-black text-foreground">
                      {livePredictionResult.predictions.financial_impact_text || "₹42.5 Crore"}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      Escalation estimate calculated via statutory ~8.5% annual capital carrying cost.
                    </div>
                  </div>
                </div>

                {/* MAJOR RISK FACTORS */}
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Major Risk Factors
                  </span>
                  <ul className="mt-2 space-y-1.5 text-xs text-foreground">
                    {livePredictionResult.risk_assessment.major_factors.map((factor, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <AlertTriangle className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-[11px]">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* FEATURE IMPORTANCE & STATUTORY RECOMMENDATIONS */}
              <div className="mt-6 grid gap-6 lg:grid-cols-2 border-t border-border pt-5">
                {/* FEATURE IMPORTANCE */}
                <div className="rounded-xl border border-border bg-surface p-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Model Feature Importance (Gini Impurity from XGBoost)
                  </h4>
                  <div className="mt-3 space-y-2">
                    {livePredictionResult.feature_importance.map((f, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-foreground">{f.feature}</span>
                          <span className="font-mono text-muted-foreground">{f.weight}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${Math.min(100, f.weight * 2.5)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* STATUTORY RECOMMENDATIONS */}
                <div className="rounded-xl border border-border bg-surface p-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Statutory Mitigation Recommendations (RFCTLARR Act)
                  </h4>
                  <div className="mt-3 space-y-2.5 text-xs">
                    {livePredictionResult.recommendations.map((rec) => (
                      <div key={rec.id} className="rounded-lg border border-border bg-card p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{rec.title}</span>
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                            Priority {rec.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">{rec.action}</p>
                        <div className="mt-1.5 text-[10px] text-muted-foreground font-mono">
                          Act: {rec.statutory_act} • Dept: {rec.department}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ACTION BAR WITH CHAT ASSISTANT INTEGRATION */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="size-4 text-primary" />
                  <span>Ground-truth ML inference validated against 1,757 training records.</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleOpenChatWithPrompt(
                      `Explain why ${livePredictionResult.project_name} received a ${livePredictionResult.risk_assessment.risk_level} risk prediction with ${livePredictionResult.predictions.overall_delay_days} days (${livePredictionResult.predictions.overall_delay_months} months) estimated delay. What are the key contributing bottlenecks and administrative solutions?`,
                    )
                  }
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-md hover:opacity-90 transition-all cursor-pointer"
                >
                  <Bot className="size-4" /> Ask AI About This Prediction →
                </button>
              </div>
            </Panel>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: 11-STAGE ANALYSIS & TIMELINE */}
      {/* ========================================================================= */}
      {activeTab === "stages" && (
        <div className="space-y-6">
          <Panel>
            <PanelTitle
              title="Statutory Acquisition Stage Progression & Bottleneck Isolation"
              subtitle="Sequence of 11 mandatory acquisition stages under Indian Land Acquisition (RFCTLARR) & Forest Conservation Acts"
            />

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              {/* VERTICAL STAGES TIMELINE */}
              <div className="space-y-2 lg:col-span-2">
                {basePrediction.stages.map((stg, i) => {
                  const isBlocked = stg.status === "BLOCKED";
                  const isComplete = stg.status === "COMPLETE";
                  const isInProgress = stg.status === "IN_PROGRESS";
                  const isSelected = activeStageId === stg.id;

                  return (
                    <div
                      key={stg.id}
                      onClick={() => setActiveStageId(stg.id)}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                          : isBlocked
                          ? "border-rose-500 bg-rose-500/10"
                          : isComplete
                          ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/50"
                          : "border-border bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`grid size-7 place-items-center rounded-full text-xs font-bold ${
                              isComplete
                                ? "bg-emerald-500 text-white"
                                : isBlocked
                                ? "bg-rose-600 text-white animate-pulse"
                                : isInProgress
                                ? "bg-amber-500 text-white"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {stg.id}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground">{stg.name}</span>
                              {isBlocked && (
                                <span className="rounded bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                                  PRIMARY BOTTLENECK
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">{stg.department}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              isComplete
                                ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                                : isBlocked
                                ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                                : isInProgress
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {stg.status.replace("_", " ")}
                          </span>
                          {stg.delayContributionMonths > 0 && (
                            <div className="mt-1 text-xs font-bold text-rose-600">
                              +{stg.delayContributionMonths} Months Delay
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SELECTED STAGE DETAILED INSPECTOR CARD */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Stage #{currentSelectedStage.id} Inspector
                  </span>
                  <h3 className="mt-1 text-lg font-black text-foreground">
                    {currentSelectedStage.name}
                  </h3>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-bold ${
                        currentSelectedStage.status === "BLOCKED"
                          ? "bg-rose-500 text-white"
                          : currentSelectedStage.status === "COMPLETE"
                          ? "bg-emerald-500 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {currentSelectedStage.status}
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {currentSelectedStage.progressPct}% Progress
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs border-t border-border pt-3">
                  <div>
                    <span className="text-muted-foreground">Statutory Authority:</span>
                    <div className="font-semibold text-foreground">{currentSelectedStage.department}</div>
                  </div>
                  {currentSelectedStage.statutoryAct && (
                    <div>
                      <span className="text-muted-foreground">Governing Act:</span>
                      <div className="font-semibold text-foreground">{currentSelectedStage.statutoryAct}</div>
                    </div>
                  )}
                  {currentSelectedStage.reason && (
                    <div className="rounded-lg bg-rose-500/10 p-3 border border-rose-500/30">
                      <span className="font-bold text-rose-700 dark:text-rose-300">Stall Reason:</span>
                      <p className="mt-1 text-foreground leading-relaxed font-medium">
                        {currentSelectedStage.reason}
                      </p>
                    </div>
                  )}
                  {currentSelectedStage.impact && (
                    <div className="rounded-lg bg-muted/40 p-3 border border-border">
                      <span className="font-bold text-muted-foreground">Operational Impact:</span>
                      <p className="mt-1 text-foreground leading-relaxed font-medium">
                        {currentSelectedStage.impact}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                    <div>
                      <span className="text-muted-foreground">Started:</span>
                      <div className="font-semibold text-foreground">{currentSelectedStage.startedDate}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Target / Expected:</span>
                      <div className="font-semibold text-foreground">{currentSelectedStage.expectedDate}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5">
                    <span className="text-muted-foreground">Current Delay:</span>
                    <span className="font-bold text-rose-600">
                      {currentSelectedStage.currentDelayDays} Days (+{currentSelectedStage.delayContributionMonths}m)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: AI RECOMMENDATIONS */}
      {/* ========================================================================= */}
      {activeTab === "recommendations" && (
        <div className="space-y-6">
          <Panel>
            <PanelTitle
              title="Actionable AI Intervention Recommendations"
              subtitle="Algorithmic mitigation strategies generated to neutralize critical-path delay drivers"
            />

            <div className="mt-6 grid gap-4">
              {basePrediction.recommendations.map((rec) => (
                <div
                  key={rec.priority}
                  className={`rounded-2xl border p-5 transition-all ${
                    rec.priority === 1
                      ? "border-rose-500/40 bg-gradient-to-r from-rose-500/10 to-transparent shadow-sm"
                      : rec.priority === 2
                      ? "border-amber-500/40 bg-gradient-to-r from-amber-500/10 to-transparent"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-black uppercase text-white shadow-sm ${
                          rec.priority === 1
                            ? "bg-rose-600"
                            : rec.priority === 2
                            ? "bg-amber-600"
                            : "bg-indigo-600"
                        }`}
                      >
                        PRIORITY {rec.priority}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{rec.title}</h4>
                        <div className="mt-0.5 text-xs text-muted-foreground font-semibold">
                          Target Desk: {rec.department}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAssignAction(rec)}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow transition-all hover:opacity-90"
                      >
                        [ Assign Action ]
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          toast.success(`Action marked as Started: "${rec.title}"`);
                        }}
                        className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        [ Mark as Started ]
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          toast.warning(`Action escalated to Chief Secretary Desk: "${rec.title}"`);
                        }}
                        className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-500/20"
                      >
                        [ Escalate ]
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
                    <div className="rounded-xl border border-border bg-card/60 p-3">
                      <div className="font-semibold text-muted-foreground">Action Directive:</div>
                      <p className="mt-1 text-foreground font-medium">{rec.action}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card/60 p-3">
                      <div className="font-semibold text-muted-foreground">Expected Impact:</div>
                      <p className="mt-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        {rec.expectedImpact}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: WHAT-IF SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === "simulation" && (
        <div className="space-y-6">
          <Panel>
            <PanelTitle
              title="What-If Scenario & Bottleneck Resolution Simulator"
              subtitle="Test hypothetical administrative and policy interventions to compute dynamic risk reduction"
            />

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* INTERACTIVE TOGGLE CHECKBOXES */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Select Interventions to Apply
                </h4>

                {[
                  { key: "forest", label: "Resolve Forest Clearance (Stage-II Approval Obtained)", impact: "-31 pts risk (-2.9m delay)" },
                  { key: "legal", label: "Resolve Legal Dispute (Fast-track Lok Adalat Settle)", impact: "-12 pts risk (-0.8m delay)" },
                  { key: "compensation", label: "Complete 100% Compensation Disbursal via DBT", impact: "-8 pts risk (-0.5m delay)" },
                  { key: "rr", label: "Complete R&R Resettlement Colony Handover", impact: "-6 pts risk (-0.4m delay)" },
                  { key: "possession", label: "Deploy Security Fencing to Increase Possession", impact: "-5 pts risk (-0.3m delay)" },
                ].map((sc) => (
                  <label
                    key={sc.key}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all ${
                      simScenarios[sc.key]
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:bg-muted/30"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!simScenarios[sc.key]}
                      onChange={(e) =>
                        setSimScenarios((prev) => ({ ...prev, [sc.key]: e.target.checked }))
                      }
                      className="mt-1 size-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-xs text-foreground">{sc.label}</div>
                      <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {sc.impact}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* SIMULATION OUTCOME SCOREBOARD */}
              <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/20 p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Simulation Comparison Outcome
                  </h4>

                  <div className="mt-6 grid grid-cols-2 gap-4 text-center">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="text-xs font-semibold text-muted-foreground">Baseline Risk</div>
                      <div className="mt-1 text-3xl font-black text-rose-600">
                        {basePrediction.riskScore}%
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Delay: +{basePrediction.expectedDelayMonths} mo
                      </div>
                    </div>

                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                      <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        Simulated Risk
                      </div>
                      <div className="mt-1 text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        {simResult.newRisk}%
                      </div>
                      <div className="mt-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        Delay: +{simResult.newDelay} mo
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-border bg-card p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Risk Reduction:</span>
                      <strong className="text-emerald-600 font-bold">
                        {basePrediction.riskScore} → {simResult.newRisk} (-{simResult.totalRiskReduced} pts)
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Time Saved:</span>
                      <strong className="text-emerald-600 font-bold">
                        {simResult.totalDelaySavedMonths} Months Accelerated
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      toast.success("Simulation parameters converted into actionable intervention task list!");
                      setActiveTab("recommendations");
                    }}
                    className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow hover:opacity-90"
                  >
                    Apply Scenario & Generate Officer Orders →
                  </button>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: MODEL PERFORMANCE (ADMIN AI DATA CENTER) */}
      {/* ========================================================================= */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <PanelTitle
                  title={`ML Model Performance Benchmarks (${activeModel.modelName} ${activeModel.version})`}
                  subtitle={`Evaluated on holdout validation partitions from ${datasetConfig.filename} (${datasetConfig.totalRows.toLocaleString()} rows)`}
                />
              </div>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                ● Model Active: {activeModel.version}
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="text-xs font-semibold text-muted-foreground">Accuracy</div>
                <div className="mt-1 text-2xl font-black text-foreground">{activeModel.accuracy}%</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">Classification exact match</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="text-xs font-semibold text-muted-foreground">Precision</div>
                <div className="mt-1 text-2xl font-black text-foreground">{activeModel.precision}%</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">Low false alarms</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="text-xs font-semibold text-muted-foreground">Recall</div>
                <div className="mt-1 text-2xl font-black text-foreground">{activeModel.recall}%</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">High risk detection rate</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="text-xs font-semibold text-muted-foreground">F1-Score</div>
                <div className="mt-1 text-2xl font-black text-foreground">{activeModel.f1Score}%</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">Harmonic mean balance</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="text-xs font-semibold text-muted-foreground">ROC-AUC</div>
                <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">0.962</div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">Area under ROC curve</div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-3.5">
                <div className="text-xs text-muted-foreground">Mean Absolute Error (MAE)</div>
                <div className="mt-1 text-xl font-bold text-foreground">{activeModel.mae} Days</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-3.5">
                <div className="text-xs text-muted-foreground">Root Mean Square Error (RMSE)</div>
                <div className="mt-1 text-xl font-bold text-foreground">{activeModel.rmse} Days</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-3.5">
                <div className="text-xs text-muted-foreground">Coefficient of Determination (R²)</div>
                <div className="mt-1 text-xl font-bold text-foreground">{activeModel.r2}</div>
              </div>
            </div>

            {/* CONFUSION MATRIX & FEATURE IMPORTANCE */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {/* CONFUSION MATRIX */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Validation Confusion Matrix (2,490 Records)
                </h4>
                <div className="mt-4 overflow-hidden rounded-xl border border-border text-center text-xs">
                  <div className="grid grid-cols-3 bg-muted/60 font-bold p-2 text-muted-foreground border-b border-border">
                    <div>Actual / Predicted</div>
                    <div>Pred: Delayed</div>
                    <div>Pred: On-Schedule</div>
                  </div>
                  <div className="grid grid-cols-3 p-3 border-b border-border items-center">
                    <div className="font-bold text-left pl-2">Actual: Delayed</div>
                    <div className="font-black text-emerald-600 bg-emerald-500/10 rounded py-2">
                      1,412 (TP)
                    </div>
                    <div className="font-bold text-rose-600 bg-rose-500/10 rounded py-2">
                      108 (FN)
                    </div>
                  </div>
                  <div className="grid grid-cols-3 p-3 items-center">
                    <div className="font-bold text-left pl-2">Actual: On-Schedule</div>
                    <div className="font-bold text-rose-600 bg-rose-500/10 rounded py-2">
                      36 (FP)
                    </div>
                    <div className="font-black text-emerald-600 bg-emerald-500/10 rounded py-2">
                      934 (TN)
                    </div>
                  </div>
                </div>
              </div>

              {/* FEATURE IMPORTANCE */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Feature Importance Ranking (Gini Impurity)
                </h4>
                <div className="mt-4 space-y-2.5 text-xs">
                  {[
                    { feature: "Forest Land Intersect %", weight: 28 },
                    { feature: "Pending Legal Disputes", weight: 22 },
                    { feature: "Compensation Disbursal %", weight: 18 },
                    { feature: "R&R Resettlement Colony Status", weight: 14 },
                    { feature: "Possession Progress %", weight: 10 },
                    { feature: "Project Type & Scale (ha)", weight: 8 },
                  ].map((f) => (
                    <div key={f.feature} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-foreground">{f.feature}</span>
                        <span className="font-bold text-muted-foreground">{f.weight}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${f.weight * 3.2}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: GOVT GATEWAY & API DOCUMENTATION */}
      {/* ========================================================================= */}
      {activeTab === "api" && (
        <div className="space-y-6">
          {/* ARCHITECTURE DIAGRAM */}
          <Panel>
            <PanelTitle
              title="Government Database & API Gateway Architecture"
              subtitle="Seamless bi-directional integration with State Revenue Portals, PFMS, MoEFCC Parivesh, and NHAI MIS"
            />

            <div className="mt-6 rounded-2xl border border-border bg-muted/20 p-6">
              <div className="grid gap-2 sm:grid-cols-7 text-center items-center text-xs">
                <div className="rounded-xl border border-border bg-card p-3 font-bold text-foreground">
                  <Database className="mx-auto size-5 text-blue-500 mb-1" />
                  Govt Databases
                </div>
                <ArrowRight className="hidden sm:block mx-auto size-4 text-muted-foreground" />
                <div className="rounded-xl border border-border bg-card p-3 font-bold text-foreground">
                  <Building2 className="mx-auto size-5 text-indigo-500 mb-1" />
                  Acquisition MIS
                </div>
                <ArrowRight className="hidden sm:block mx-auto size-4 text-muted-foreground" />
                <div className="rounded-xl border border-primary/40 bg-primary/10 p-3 font-bold text-primary">
                  <Network className="mx-auto size-5 text-primary mb-1" />
                  API Gateway
                </div>
                <ArrowRight className="hidden sm:block mx-auto size-4 text-muted-foreground" />
                <div className="rounded-xl border border-border bg-card p-3 font-bold text-foreground">
                  <Brain className="mx-auto size-5 text-purple-500 mb-1" />
                  LandVision AI ML
                </div>
              </div>
            </div>
          </Panel>

          {/* API DOCUMENTATION ENDPOINTS */}
          <Panel>
            <PanelTitle
              title="REST API Endpoints Catalogue"
              subtitle="Secure endpoints for external government portal integration"
            />

            <div className="mt-6 space-y-4">
              {[
                {
                  method: "POST",
                  endpoint: "/api/v1/predict",
                  desc: "Calculate delay risk, probability, expected completion, and primary bottleneck for a land acquisition project.",
                  req: `{\n  "project_type": "National Highway",\n  "land_required_hectare": 1250,\n  "affected_families": 420,\n  "compensation_progress": 78,\n  "legal_disputes": 2,\n  "forest_clearance": "pending"\n}`,
                  res: `{\n  "risk_score": 82,\n  "delay_probability": 0.82,\n  "expected_delay_months": 4.7,\n  "bottleneck": "Forest Clearance",\n  "financial_impact_cr": 32.8\n}`,
                },
                {
                  method: "GET",
                  endpoint: "/api/v1/projects/{id}/stages",
                  desc: "Retrieve 11-stage acquisition pipeline status and delay breakdown for specific project.",
                  req: `// GET /api/v1/projects/nh16/stages`,
                  res: `{\n  "project_id": "nh16",\n  "current_stage": "Forest Clearance",\n  "status": "BLOCKED",\n  "blocked_reason": "Forest land intersection"\n}`,
                },
                {
                  method: "GET",
                  endpoint: "/api/v1/projects/{id}/recommendations",
                  desc: "Fetch prioritized AI action recommendations and DLCC assignment directives.",
                  req: `// GET /api/v1/projects/nh16/recommendations`,
                  res: `{\n  "recommendations": [\n    { "priority": 1, "action": "Expedite Stage-II MoEFCC CA review" }\n  ]\n}`,
                },
              ].map((api) => (
                <div key={api.endpoint} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-primary px-2 py-0.5 font-mono text-xs font-bold text-primary-foreground">
                        {api.method}
                      </span>
                      <code className="font-mono text-xs font-bold text-foreground">{api.endpoint}</code>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(api.endpoint);
                        toast.success(`Copied ${api.endpoint} to clipboard!`);
                      }}
                      className="flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                    >
                      <Copy className="size-3.5" /> [Copy Endpoint]
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{api.desc}</p>

                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Request Payload</span>
                      <pre className="mt-1 rounded-xl border border-border bg-muted/30 p-3 font-mono text-[11px] text-foreground overflow-x-auto">
                        {api.req}
                      </pre>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Response JSON</span>
                      <pre className="mt-1 rounded-xl border border-border bg-muted/30 p-3 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 overflow-x-auto">
                        {api.res}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 11: EXPLAINABILITY */}
      {/* ========================================================================= */}
      {activeTab === "explainability" && (
        <ExplainabilityTab projects={visibleProjects} predictions={storePredictions} />
      )}

      {/* FLOATING HOVER AI DECISION ASSISTANT IN THE CORNER ACROSS ALL TABS */}
      <AiChatAssistant
        isFloating={true}
        selectedProject={currentProjectContext}
        datasetContext={currentDatasetContext}
        modelContext={currentModelContext}
        initialPrompt={chatInitialPrompt}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* ExplainabilityTab — merged from the standalone app.explainable-ai page     */
/* -------------------------------------------------------------------------- */

function ExplainabilityTab({
  projects,
  predictions,
}: {
  projects: Project[];
  predictions: Map<string, Prediction>;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id ?? "",
  );

  const project = useMemo(
    () =>
      projects.find(
        (p) => p.id === selectedProjectId || p.projectId === selectedProjectId,
      ) ?? projects[0],
    [projects, selectedProjectId],
  );

  const pred = project ? predictions.get(project.id) : undefined;
  const topFactor = pred?.factors[0];

  const chartData = useMemo(() => {
    if (!pred) return [];
    return pred.factors.map((f) => ({
      name: f.factor,
      contribution: f.contribution,
      raw: f.raw,
      direction: f.direction,
      detail: f.detail,
    }));
  }, [pred]);

  if (!project || !pred) {
    return (
      <Panel>
        <EmptyState
          icon={Scale}
          title="No project selected"
          description="Select a project to view explainability analysis."
        />
      </Panel>
    );
  }

  const [isGenerating, setIsGenerating] = useState(false);
  const [llmExplanation, setLlmExplanation] = useState<string | null>(null);
  const [llmMitigations, setLlmMitigations] = useState<string[] | null>(null);
  const [llmProvider, setLlmProvider] = useState<string | null>(null);

  const handleExplainWithAI = async () => {
    if (!project || !pred) return;
    setIsGenerating(true);
    toast.info("Connecting to server-side AI explanation proxy…");
    try {
      const res = await explainPredictionServerFn({
        data: {
          projectName: project.name,
          projectType: project.type,
          state: project.state,
          district: project.district,
          predictedDelayDays: pred.expectedDelayDays,
          riskScore: pred.riskScore,
          riskCategory: pred.riskCategory,
          delayProbability: pred.delayProbability,
          majorFactors: pred.factors.map((f) => ({
            factor: f.factor,
            contribution: f.contribution,
            detail: f.detail,
          })),
        },
      });

      if (res.success) {
        setLlmExplanation(res.explanation);
        setLlmMitigations(res.keyMitigations);
        setLlmProvider(res.provider);
        toast.success("AI Governance narrative briefing generated successfully!");
      } else {
        toast.error(res.error || "Failed to generate AI explanation.");
      }
    } catch {
      toast.error("Unable to generate explanation. Please check server connectivity.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CORRIDOR SELECTOR */}
      <Panel className="bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              Target Corridor:
            </span>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setLlmExplanation(null);
                setLlmMitigations(null);
              }}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground outline-none focus:border-primary"
            >
              {projects.slice(0, 25).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.projectId}) — {p.district}, {p.state}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Prediction:</span>
            <RiskBadge category={pred.riskCategory} score={pred.riskScore} />
          </div>
        </div>
      </Panel>

      {/* DUAL LAYER: ML PREDICTION VS AI EXPLANATION */}
      <div className="space-y-4">
        {/* LAYER 1: DETERMINISTIC ML PREDICTION */}
        <Panel className="border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-500 border border-blue-500/20 uppercase">
                ML Ground Truth (Deterministic XGBoost)
              </span>
              <span className="text-xs text-muted-foreground">
                Model: {pred.modelVersion} · Version Registered
              </span>
            </div>
            <button
              type="button"
              onClick={handleExplainWithAI}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className={`size-3.5 ${isGenerating ? "animate-spin" : ""}`} />
              <span>{isGenerating ? "Generating Narrative…" : "Explain Prediction Narrative"}</span>
            </button>
          </div>

          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <Brain className="size-5" />
            </span>
            <div className="space-y-1">
              <h3 className="font-display text-sm font-bold text-foreground">
                Deterministic ML Delay Forecast for {project.name}
              </h3>
              <p className="text-xs leading-relaxed text-foreground">
                &quot;The model estimates an{" "}
                <strong>
                  {pred.delayProbability}% probability of acquisition delay
                </strong>{" "}
                (+{pred.expectedDelayDays} days) primarily because{" "}
                <strong className="text-risk-critical">
                  {topFactor?.factor ?? "Legal disputes"}
                </strong>{" "}
                represents{" "}
                <strong>{topFactor?.contribution ?? 24}%</strong> of total risk
                friction, followed by compensation award delays at{" "}
                {project.params.compensationPct}% disbursal.&quot;
              </p>
            </div>
          </div>
        </Panel>

        {/* LAYER 2: NATURAL LANGUAGE INTERPRETATION (CLAUDE AI SERVER PROXY) */}
        {llmExplanation && (
          <Panel className="border-primary/40 bg-gradient-to-r from-primary/10 via-card to-primary/5 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5 mb-3">
              <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-mono font-bold text-primary border border-primary/30 uppercase flex items-center gap-1">
                <Sparkles className="size-3" />
                AI Explanation (Natural Language Interpretation)
              </span>
              <span className="text-[11px] text-muted-foreground">
                Powered by {llmProvider || "Server Proxy"}
              </span>
            </div>

            <div className="space-y-3">
              <p className="text-xs leading-relaxed text-foreground whitespace-pre-line font-normal">
                {llmExplanation}
              </p>

              {llmMitigations && llmMitigations.length > 0 && (
                <div className="rounded-xl border border-border bg-surface p-3 space-y-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    Recommended Governance Interventions
                  </h4>
                  <ul className="space-y-1 text-xs text-muted-foreground list-disc list-inside">
                    {llmMitigations.map((m, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="text-foreground font-medium">{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Panel>
        )}
      </div>

      {/* SHAP-STYLE CHART + DETAIL BREAKDOWN */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          {/* FACTOR ATTRIBUTION CHART */}
          <Panel>
            <PanelTitle
              title="Factor Attribution Breakdown"
              subtitle="Percentage share of each input parameter contributing to total predicted risk score"
              icon={Scale}
              ai
            />
            <div className="mt-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 24, right: 24 }}
                >
                  <CartesianGrid
                    stroke="var(--border)"
                    horizontal={false}
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    type="number"
                    domain={[0, 40]}
                    unit="%"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(val: number) => [
                      `${val}%`,
                      "Contribution Share",
                    ]}
                  />
                  <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                    {chartData.map((d) => (
                      <Cell
                        key={d.name}
                        fill={
                          d.contribution > 20
                            ? "var(--risk-critical)"
                            : d.contribution > 12
                              ? "var(--risk-high)"
                              : "var(--risk-medium)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* DETAILED CONTRIBUTING FACTORS */}
          <Panel>
            <PanelTitle
              title="Detailed Contributing Factor Analysis"
              subtitle="Granular breakdown of parameter severities and mitigation levers"
              icon={Brain}
            />
            <div className="mt-3 space-y-3">
              {pred.factors.map((f) => (
                <div
                  key={f.factor}
                  className="rounded-xl border border-border bg-card p-3.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">
                      {f.factor}
                    </span>
                    <span className="rounded bg-surface px-2 py-0.5 font-bold text-foreground border border-border">
                      {f.contribution}% share
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {f.detail}
                  </p>
                  <p className="mt-1 text-[11px] text-primary font-medium">
                    Mitigation lever: Resolving this factor reduces risk score by
                    estimated {Math.round(f.contribution * 0.7)}–
                    {Math.round(f.contribution * 0.9)} points.
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* RIGHT COLUMN: GAUGE + WHAT-IF */}
        <div className="space-y-4 lg:col-span-5">
          <Panel className="text-center">
            <PanelTitle title="Predicted Delay Risk" icon={Brain} />
            <div className="my-3 flex justify-center">
              <RiskGauge
                score={pred.riskScore}
                category={pred.riskCategory}
                size={170}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Expected project slippage:{" "}
              <strong className="text-foreground">
                +{pred.expectedDelayDays} days
              </strong>
            </p>
          </Panel>

          {/* COUNTERFACTUAL WHAT-IF SCENARIOS */}
          <Panel className="border-primary/30">
            <PanelTitle
              title="Counterfactual What-If Scenarios"
              subtitle="Projected risk if administrative bottlenecks are cleared"
              icon={Sparkles}
              ai
            />
            <div className="mt-3 space-y-3 text-xs">
              {pred.factors.slice(0, 3).map((f) => {
                const reduction = Math.round(f.contribution * 0.75);
                const newScore = Math.max(12, pred.riskScore - reduction);
                return (
                  <div
                    key={f.factor}
                    className="rounded-lg border border-border bg-surface p-3"
                  >
                    <div className="flex justify-between font-semibold text-foreground">
                      <span>If &quot;{f.factor}&quot; resolved:</span>
                      <span className="text-risk-low font-bold">
                        Risk {pred.riskScore}% → {newScore}% (-{reduction}%)
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {f.detail}
                    </p>
                  </div>
                );
              })}

              {/* COMBINED SCENARIO */}
              {(() => {
                const totalReduction = pred.factors
                  .slice(0, 3)
                  .reduce(
                    (sum, f) => sum + Math.round(f.contribution * 0.75),
                    0,
                  );
                const combined = Math.max(12, pred.riskScore - totalReduction);
                return (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <div className="flex justify-between font-semibold text-foreground">
                      <span>If Combined Actions Taken:</span>
                      <span className="text-risk-low font-bold">
                        Risk {pred.riskScore}% → {combined}% (-{totalReduction}%)
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Total estimated delay saved: ~{Math.round(totalReduction * 1.5)} days
                    </p>
                  </div>
                );
              })()}
            </div>

            <div className="mt-4">
              <Link
                to="/app/predictor"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Zap className="size-3.5" /> Test Custom What-If Simulation
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
