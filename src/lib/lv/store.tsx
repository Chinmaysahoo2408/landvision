import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ActiveModelConfig,
  Alert,
  AppUser,
  AuditEntry,
  DatasetConfig,
  Intervention,
  ModelVersionItem,
  Prediction,
  Project,
  Recommendation,
  RetrainingLog,
  RiskParameters,
  Role,
  Thresholds,
} from "./types";
import { DEFAULT_THRESHOLDS, MODEL_VERSION, predict, predictParameters } from "./risk";
import {
  DEMO_USERS,
  generateProjects,
  RETRAINING_HISTORY,
  seedAlerts,
  SEED_AUDIT,
} from "./data";
import {
  getSessionUser,
  isSupabaseConfigured,
  onAuthChange,
  signOut as supabaseSignOut,
} from "@/lib/supabase/auth";

export const INITIAL_DATASET_CONFIG: DatasetConfig = {
  filename: "landvision_ml_train_1757.csv",
  version: "v1.0",
  totalRows: 1757,
  totalColumns: 14,
  numericalColumns: [
    "Land_Required_Hectare",
    "Land_Remaining_Hectare",
    "Affected_Families",
    "Compensation_Amount",
    "Project_Cost",
  ],
  categoricalColumns: [
    "State",
    "District",
    "Project_Type",
    "Legal_Dispute",
    "Court_Case",
    "Environmental_Clearance",
    "Forest_Clearance",
    "Rehabilitation_Issue",
  ],
  missingPct: 0.0,
  duplicateRows: 0,
  qualityScore: 98,
  lastUpdated: "2026-09-03 12:30",
  isReady: true,
  source: "Admin AI / ML Data Center",
  preview: [
    { State: "Karnataka", District: "Chamarajanagar", Project_Type: "Port Development", Land_Required_Hectare: 107.88, Land_Remaining_Hectare: 48.87, Affected_Families: 817, Compensation_Amount: 1717257924.0, Project_Cost: 1498.96, Legal_Dispute: "Yes", Court_Case: "Yes", Environmental_Clearance: "Pending", Forest_Clearance: "Under Review", Rehabilitation_Issue: "No", Overall_Delay: 1143 },
    { State: "Andhra Pradesh", District: "West Godavari", Project_Type: "Mining Project", Land_Required_Hectare: 703.02, Land_Remaining_Hectare: 29.84, Affected_Families: 2188, Compensation_Amount: 5122457962.0, Project_Cost: 1962.18, Legal_Dispute: "No", Court_Case: "No", Environmental_Clearance: "Not Required", Forest_Clearance: "Obtained", Rehabilitation_Issue: "No", Overall_Delay: 457 },
    { State: "Assam", District: "Biswanath", Project_Type: "State Highway", Land_Required_Hectare: 359.5, Land_Remaining_Hectare: 241.83, Affected_Families: 4745, Compensation_Amount: 10392940192.0, Project_Cost: 12493.69, Legal_Dispute: "No", Court_Case: "No", Environmental_Clearance: "Obtained", Forest_Clearance: "Not Required", Rehabilitation_Issue: "No", Overall_Delay: 417 },
    { State: "Andhra Pradesh", District: "Chittoor", Project_Type: "Power Plant", Land_Required_Hectare: 406.76, Land_Remaining_Hectare: 316.77, Affected_Families: 1864, Compensation_Amount: 5647015286.0, Project_Cost: 5386.86, Legal_Dispute: "Yes", Court_Case: "Yes", Environmental_Clearance: "Not Required", Forest_Clearance: "Obtained", Rehabilitation_Issue: "No", Overall_Delay: 1710 },
    { State: "Arunachal Pradesh", District: "Kra Daadi", Project_Type: "State Highway", Land_Required_Hectare: 240.88, Land_Remaining_Hectare: 6.03, Affected_Families: 2295, Compensation_Amount: 5914719546.0, Project_Cost: 7083.29, Legal_Dispute: "Yes", Court_Case: "Yes", Environmental_Clearance: "Pending", Forest_Clearance: "Not Required", Rehabilitation_Issue: "Yes", Overall_Delay: 1217 },
  ],
  stats: {
    Land_Required_Hectare: { mean: 428.6, median: 416.0, min: 6.1, max: 798.4 },
    Affected_Families: { mean: 3782, median: 2940, min: 16, max: 12058 },
    Overall_Delay: { mean: 685.4, median: 558.0, min: 46, max: 2217 },
  },
};

export const INITIAL_ACTIVE_MODEL: ActiveModelConfig = {
  modelName: "XGBoost Regressor / Random Forest Classifier",
  version: "v1.0",
  status: "Trained",
  algorithm: "Ensemble Auto-Select (XGBoost + Random Forest)",
  lastTrained: "2026-09-03 12:30",
  accuracy: 94.2,
  precision: 93.8,
  recall: 94.2,
  f1Score: 94.0,
  mae: 18.4,
  rmse: 24.1,
  r2: 0.87,
  trainingRows: 1757,
  targetColumns: ["Overall_Delay", "Risk_Level"],
  activeVersions: {
    Overall_Delay: "v1.0",
    Risk_Level: "v1.0",
  },
  comparison: {
    "XGBoost Regressor": { mae: 18.4, rmse: 24.1, r2: 0.87 },
    "Random Forest Regressor": { mae: 24.3, rmse: 31.8, r2: 0.78 },
    "Gradient Boosting Regressor": { mae: 21.7, rmse: 28.5, r2: 0.82 },
    "Linear Regression (Baseline)": { mae: 46.2, rmse: 58.9, r2: 0.54 },
  },
};

export const INITIAL_MODEL_VERSIONS: ModelVersionItem[] = [
  {
    target: "Overall_Delay",
    version: "v1.0",
    algorithm: "XGBoost Regressor",
    training_rows: 1757,
    metrics: { mae: 18.4, rmse: 24.1, r2: 0.87 },
    created_at: "2026-09-03 12:30",
    is_active: true,
    comparison: {
      "XGBoost Regressor": { mae: 18.4, rmse: 24.1, r2: 0.87 },
      "Random Forest Regressor": { mae: 24.3, rmse: 31.8, r2: 0.78 },
      "Gradient Boosting Regressor": { mae: 21.7, rmse: 28.5, r2: 0.82 },
      "Linear Regression (Baseline)": { mae: 46.2, rmse: 58.9, r2: 0.54 },
    },
  },
  {
    target: "Risk_Level",
    version: "v1.0",
    algorithm: "Random Forest Classifier",
    training_rows: 1757,
    metrics: { accuracy: 94.2, precision: 93.8, recall: 94.2, f1Score: 94.0 },
    created_at: "2026-09-03 12:30",
    is_active: true,
  },
];

export const INITIAL_SYSTEM_LOGS = [
  { id: "LOG-01", timestamp: "2026-09-02 23:20:14", level: "SUCCESS", message: "FastAPI ML Service online on http://127.0.0.1:8000 (Python 3.13 / XGBoost 3.4.1 / scikit-learn 1.8.0)." },
  { id: "LOG-02", timestamp: "2026-09-02 23:18:25", level: "INFO", message: "Pre-trained model artifacts validated (v1.2 active across all 5 targets)." },
  { id: "LOG-03", timestamp: "2026-09-02 22:45:10", level: "INFO", message: "Dataset quality audit completed: 25,420 records, 0 critical schema errors." },
  { id: "LOG-04", timestamp: "2026-09-02 21:30:00", level: "SUCCESS", message: "Automated model evaluation selected XGBoost Regressor for Overall_Delay with R²=0.87, MAE=18.4 days." },
];

interface Persisted {
  projects: Project[];
  interventions: Intervention[];
  alerts: Alert[];
  audit: AuditEntry[];
  users: AppUser[];
  thresholds: Thresholds;
  session: AppUser | null;
  recStatus: Record<string, Recommendation["status"]>;
  modelVersion: string;
  retrainingHistory: RetrainingLog[];
  datasetConfig: DatasetConfig;
  activeModel: ActiveModelConfig;
  modelVersions: ModelVersionItem[];
  systemLogs: Array<{ id: string; timestamp: string; level: string; message: string }>;
}

const KEY = "landvision.state.v2";

function buildInitial(): Persisted {
  const projects = generateProjects();
  return {
    projects,
    interventions: [
      {
        id: "IV-0001",
        projectId: "p1",
        projectName: "NH-16 6-Lane Expansion Corridor",
        recommendationId: "LV-0001-REC-1",
        action: "Convene Special Lok Adalat & Fast-track Dispute Resolution for Balianta stretch",
        assignedTo: "R. K. Nayak",
        department: "District Legal Services Authority",
        priority: "Critical",
        deadline: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
        status: "In Progress",
        notes: "Targeting 6 ancestral ownership cases to reduce title disputes from 12 to 6.",
        previousRisk: 82,
        currentRisk: 69,
        riskReduction: 13,
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: "IV-0002",
        projectId: "p2",
        projectName: "Western Dedicated Freight Corridor (Segment B)",
        recommendationId: "LV-0002-REC-2",
        action: "Deploy Village DBT Verification Mobile Team in Karanjade",
        assignedTo: "Sub-Divisional Magistrate, Panvel",
        department: "Land Acquisition Office",
        priority: "High",
        deadline: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
        status: "Pending",
        notes: "Accelerating compensation disbursement from 42% to 75% target.",
        previousRisk: 74,
        currentRisk: 64,
        riskReduction: 10,
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ],
    alerts: seedAlerts(projects),
    audit: SEED_AUDIT,
    users: DEMO_USERS,
    thresholds: DEFAULT_THRESHOLDS,
    // In demo mode we pre-select an admin so the app is explorable; with a real
    // backend configured, the session starts empty and Supabase auth fills it.
    session: isSupabaseConfigured ? null : (DEMO_USERS[0] ?? null),
    recStatus: {},
    modelVersion: MODEL_VERSION,
    retrainingHistory: RETRAINING_HISTORY,
    datasetConfig: INITIAL_DATASET_CONFIG,
    activeModel: INITIAL_ACTIVE_MODEL,
    modelVersions: INITIAL_MODEL_VERSIONS,
    systemLogs: INITIAL_SYSTEM_LOGS,
  };
}

interface Ctx extends Persisted {
  ready: boolean;
  selectedState: string;
  setSelectedState: (s: string) => void;
  predictions: Map<string, Prediction>;
  predictionFor: (projectId: string) => Prediction | undefined;
  login: (role: Role) => AppUser | null;
  logout: () => void;
  setSession: (u: AppUser | null) => void;
  visibleProjects: Project[];
  updateProject: (id: string, patch: Partial<Project>, note?: string) => void;
  addProject: (p: Project) => void;
  addIntervention: (i: Omit<Intervention, "id" | "createdAt" | "previousRisk" | "currentRisk" | "riskReduction">) => Intervention;
  updateIntervention: (id: string, patch: Partial<Intervention>) => void;
  setRecStatus: (recId: string, status: Recommendation["status"]) => void;
  updateAlert: (id: string, status: Alert["status"]) => void;
  setThresholds: (t: Thresholds) => void;
  setUsers: (u: AppUser[]) => void;
  retrainModel: () => Promise<RetrainingLog>;
  predictCustom: (params: RiskParameters, name?: string) => Prediction;
  log: (e: Omit<AuditEntry, "id" | "timestamp">) => void;
  updateDatasetConfig: (patch: Partial<DatasetConfig>) => void;
  updateActiveModel: (patch: Partial<ActiveModelConfig>) => void;
  activateModelVersion: (target: string, version: string) => void;
  addModelVersion: (item: ModelVersionItem) => void;
  addSystemLog: (level: string, message: string) => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function LandVisionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(() => buildInitial());
  const [ready, setReady] = useState(false);
  const [selectedState, setSelectedState] = useState("Odisha");

  // Stable, idempotent session setter. Returning the previous state object when
  // nothing meaningful changed lets React bail out of re-rendering, which keeps
  // the Supabase auth subscription (below) from looping.
  const setSession = useCallback((u: AppUser | null) => {
    setState((s) => {
      const cur = s.session;
      const unchanged =
        (cur?.id ?? null) === (u?.id ?? null) &&
        (cur?.status ?? null) === (u?.status ?? null) &&
        (cur?.lastLogin ?? "") === (u?.lastLogin ?? "");
      return unchanged ? s : { ...s, session: u };
    });
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Persisted>;
        setState((s) => ({
          ...s,
          ...parsed,
          projects: parsed.projects?.length ? parsed.projects : s.projects,
          interventions: parsed.interventions?.length ? parsed.interventions : s.interventions,
          retrainingHistory: parsed.retrainingHistory?.length ? parsed.retrainingHistory : s.retrainingHistory,
          datasetConfig: parsed.datasetConfig ? { ...s.datasetConfig, ...parsed.datasetConfig } : s.datasetConfig,
          activeModel: parsed.activeModel ? { ...s.activeModel, ...parsed.activeModel } : s.activeModel,
          modelVersions: parsed.modelVersions?.length ? parsed.modelVersions : s.modelVersions,
          systemLogs: parsed.systemLogs?.length ? parsed.systemLogs : s.systemLogs,
          // With a real backend, ignore any persisted session — Supabase auth is
          // the source of truth and restores it in the effect below.
          session: isSupabaseConfigured ? null : (parsed.session ?? s.session),
        }));
      }
    } catch {
      /* corrupted local state is ignored — demo data is regenerated */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          interventions: state.interventions,
          alerts: state.alerts,
          audit: state.audit,
          users: state.users,
          thresholds: state.thresholds,
          session: isSupabaseConfigured ? null : state.session,
          recStatus: state.recStatus,
          projects: state.projects,
          modelVersion: state.modelVersion,
          retrainingHistory: state.retrainingHistory,
          datasetConfig: state.datasetConfig,
          activeModel: state.activeModel,
          modelVersions: state.modelVersions,
          systemLogs: state.systemLogs,
        }),
      );
    } catch {
      /* storage full or unavailable — state stays in memory */
    }
  }, [state, ready]);

  // Real-backend session ownership: when Supabase is configured it — not the
  // demo picker — drives the session. Restore any existing session on mount and
  // keep it in sync with sign-in / sign-out events. No-op in demo mode.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    let unsubscribe = () => {};
    void (async () => {
      const current = await getSessionUser();
      if (!active) return;
      setSession(current);
      unsubscribe = onAuthChange((next) => setSession(next));
    })();
    return () => {
      active = false;
      unsubscribe();
    };
  }, [setSession]);

  const predictions = useMemo(() => {
    const m = new Map<string, Prediction>();
    for (const p of state.projects) m.set(p.id, predict(p, state.thresholds, state.modelVersion));
    return m;
  }, [state.projects, state.thresholds, state.modelVersion]);

  const visibleProjects = useMemo(() => {
    const u = state.session;
    if (!u) return state.projects;
    if (u.role === "STATE_OFFICER" && u.state) return state.projects.filter((p) => p.state === u.state);
    if (u.role === "DISTRICT_OFFICER" && u.district)
      return state.projects.filter((p) => p.district === u.district);
    return state.projects;
  }, [state.projects, state.session]);

  const log = useCallback((e: Omit<AuditEntry, "id" | "timestamp">) => {
    setState((s) => ({
      ...s,
      audit: [
        {
          ...e,
          id: `au-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date().toISOString(),
        },
        ...s.audit,
      ],
    }));
  }, []);

  const addIntervention = useCallback(
    (i: Omit<Intervention, "id" | "createdAt" | "previousRisk" | "currentRisk" | "riskReduction">) => {
      const p = state.projects.find((proj) => proj.id === i.projectId);
      const currentPred = p ? predict(p, state.thresholds, state.modelVersion) : undefined;
      const prevScore = currentPred ? currentPred.riskScore : 75;
      const reduction = Math.min(prevScore - 15, Math.floor(10 + Math.random() * 8));
      const newScore = Math.max(12, prevScore - reduction);

      const newIntervention: Intervention = {
        ...i,
        id: `IV-${String(1000 + state.interventions.length + 1)}`,
        previousRisk: prevScore,
        currentRisk: newScore,
        riskReduction: reduction,
        createdAt: new Date().toISOString(),
      };

      setState((s) => ({
        ...s,
        interventions: [newIntervention, ...s.interventions],
        audit: [
          {
            id: `au-${Date.now()}`,
            user: s.session?.name ?? "District Officer",
            role: s.session?.role ?? "DISTRICT_OFFICER",
            action: "Created corrective intervention & recalculated risk",
            entity: "Intervention",
            entityId: newIntervention.id,
            oldValue: `Risk ${prevScore}%`,
            newValue: `Risk ${newScore}% (-${reduction}%)`,
            timestamp: new Date().toISOString(),
            status: "SUCCESS",
          },
          ...s.audit,
        ],
      }));

      return newIntervention;
    },
    [state.projects, state.thresholds, state.modelVersion, state.interventions.length],
  );

  const retrainModel = useCallback(async (): Promise<RetrainingLog> => {
    // Simulated training latency
    await new Promise((res) => setTimeout(res, 800));

    const major = 2;
    const minor = 5 + Math.floor(state.retrainingHistory.length - 4);
    const newVer = `v${major}.${minor}`;
    const newLog: RetrainingLog = {
      id: `rt-${state.retrainingHistory.length + 1}`,
      version: newVer,
      datasetSize: state.projects.length,
      trainingSamples: Math.round(state.projects.length * 0.8),
      testSamples: Math.round(state.projects.length * 0.2),
      accuracy: Math.min(96.8, 94.2 + (minor - 4) * 0.4),
      precision: Math.min(95.4, 92.8 + (minor - 4) * 0.35),
      recall: Math.min(94.2, 91.5 + (minor - 4) * 0.3),
      f1Score: Math.min(94.8, 92.1 + (minor - 4) * 0.32),
      rocAuc: Math.min(0.978, 0.962 + (minor - 4) * 0.003),
      trainingDate: new Date().toISOString(),
      status: "Active",
      notes: `Continuous learning automated retrain on ${state.projects.length} verified acquisition records.`,
    };

    setState((s) => ({
      ...s,
      modelVersion: newVer,
      retrainingHistory: [
        newLog,
        ...s.retrainingHistory.map((h) => ({ ...h, status: "Archived" as const })),
      ],
      audit: [
        {
          id: `au-${Date.now()}`,
          user: s.session?.name ?? "System AI",
          role: s.session?.role ?? "ADMIN",
          action: "Model retrained and deployed to production",
          entity: "ML Engine",
          entityId: newVer,
          oldValue: s.modelVersion,
          newValue: newVer,
          timestamp: new Date().toISOString(),
          status: "SUCCESS",
        },
        ...s.audit,
      ],
    }));

    return newLog;
  }, [state.projects.length, state.retrainingHistory, state.modelVersion]);

  const updateDatasetConfig = useCallback((patch: Partial<DatasetConfig>) => {
    setState((s) => ({
      ...s,
      datasetConfig: {
        ...s.datasetConfig,
        ...patch,
        lastUpdated: patch.lastUpdated || new Date().toISOString().replace("T", " ").slice(0, 16),
      },
      audit: [
        {
          id: `au-${Date.now()}`,
          user: s.session?.name ?? "Admin",
          role: s.session?.role ?? "ADMIN",
          action: "Updated central AI dataset configuration",
          entity: "Dataset",
          entityId: patch.filename ?? s.datasetConfig.filename,
          oldValue: `${s.datasetConfig.totalRows} rows`,
          newValue: `${patch.totalRows ?? s.datasetConfig.totalRows} rows`,
          timestamp: new Date().toISOString(),
          status: "SUCCESS",
        },
        ...s.audit,
      ],
    }));
  }, []);

  const updateActiveModel = useCallback((patch: Partial<ActiveModelConfig>) => {
    setState((s) => ({
      ...s,
      activeModel: {
        ...s.activeModel,
        ...patch,
        lastTrained: patch.lastTrained || new Date().toISOString().replace("T", " ").slice(0, 16),
      },
      modelVersion: patch.version || s.modelVersion,
      audit: [
        {
          id: `au-${Date.now()}`,
          user: s.session?.name ?? "Admin",
          role: s.session?.role ?? "ADMIN",
          action: "Updated central active ML model configuration",
          entity: "ML Model",
          entityId: patch.modelName ?? s.activeModel.modelName,
          oldValue: s.activeModel.version,
          newValue: patch.version ?? s.activeModel.version,
          timestamp: new Date().toISOString(),
          status: "SUCCESS",
        },
        ...s.audit,
      ],
    }));
  }, []);

  const activateModelVersion = useCallback((target: string, version: string) => {
    setState((s) => {
      const updatedVersions = s.modelVersions.map((mv) => ({
        ...mv,
        is_active: mv.target === target ? mv.version === version : mv.is_active,
      }));
      const targetModel = updatedVersions.find((mv) => mv.target === target && mv.version === version);
      return {
        ...s,
        modelVersions: updatedVersions,
        activeModel: {
          ...s.activeModel,
          version: target === "Overall_Delay" ? version : s.activeModel.version,
          activeVersions: {
            ...s.activeModel.activeVersions,
            [target]: version,
          },
          algorithm: targetModel?.algorithm || s.activeModel.algorithm,
          mae: targetModel?.metrics?.mae ?? s.activeModel.mae,
          rmse: targetModel?.metrics?.rmse ?? s.activeModel.rmse,
          r2: targetModel?.metrics?.r2 ?? s.activeModel.r2,
          accuracy: targetModel?.metrics?.accuracy ?? s.activeModel.accuracy,
        },
      };
    });
  }, []);

  const addModelVersion = useCallback((item: ModelVersionItem) => {
    setState((s) => ({
      ...s,
      modelVersions: [item, ...s.modelVersions],
    }));
  }, []);

  const addSystemLog = useCallback((level: string, message: string) => {
    setState((s) => ({
      ...s,
      systemLogs: [
        {
          id: `LOG-${Date.now()}`,
          timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
          level,
          message,
        },
        ...s.systemLogs.slice(0, 99),
      ],
    }));
  }, []);

  const predictCustom = useCallback(
    (params: RiskParameters, name = "Custom Simulation") => {
      return predictParameters(params, "SIM-CUSTOM", name, "Legal Resolution", state.thresholds, state.modelVersion);
    },
    [state.thresholds, state.modelVersion],
  );

  const value: Ctx = {
    ...state,
    ready,
    selectedState,
    setSelectedState,
    predictions,
    visibleProjects,
    predictionFor: (id) => predictions.get(id),
    login: (role) => {
      const user = state.users.find((u) => u.role === role && u.status === "Active") ?? null;
      if (user) {
        const withLogin = { ...user, lastLogin: new Date().toISOString() };
        setState((s) => ({
          ...s,
          session: withLogin,
          users: s.users.map((u) => (u.id === user.id ? withLogin : u)),
          audit: [
            {
              id: `au-${Date.now()}`,
              user: user.name,
              role,
              action: "Signed in to Government Portal",
              entity: "Session",
              entityId: user.email,
              oldValue: "—",
              newValue: role,
              timestamp: new Date().toISOString(),
              status: "SUCCESS",
            },
            ...s.audit,
          ],
        }));
      }
      return user;
    },
    logout: () => {
      // Clear locally for instant UX, and end the real session if one exists.
      if (isSupabaseConfigured) void supabaseSignOut();
      setState((s) => ({ ...s, session: null }));
    },
    setSession,
    updateProject: (id, patch, note) => {
      setState((s) => {
        const before = s.projects.find((p) => p.id === id);
        const projects = s.projects.map((p) =>
          p.id === id ? { ...p, ...patch, params: { ...p.params, ...(patch.params ?? {}) } } : p,
        );
        const after = projects.find((p) => p.id === id);
        const oldScore = before ? predict(before, s.thresholds, s.modelVersion).riskScore : 0;
        const newScore = after ? predict(after, s.thresholds, s.modelVersion).riskScore : 0;
        return {
          ...s,
          projects,
          audit: [
            {
              id: `au-${Date.now()}`,
              user: s.session?.name ?? "System",
              role: s.session?.role ?? "ADMIN",
              action: note ?? "Updated project data parameters",
              entity: "Project",
              entityId: before?.projectId ?? id,
              oldValue: `Risk ${oldScore}%`,
              newValue: `Risk ${newScore}%`,
              timestamp: new Date().toISOString(),
              status: "SUCCESS",
            },
            ...s.audit,
          ],
        };
      });
    },
    addProject: (p) =>
      setState((s) => ({
        ...s,
        projects: [p, ...s.projects],
        audit: [
          {
            id: `au-${Date.now()}`,
            user: s.session?.name ?? "System",
            role: s.session?.role ?? "ADMIN",
            action: "Created new project corridor",
            entity: "Project",
            entityId: p.projectId,
            oldValue: "—",
            newValue: p.name,
            timestamp: new Date().toISOString(),
            status: "SUCCESS",
          },
          ...s.audit,
        ],
      })),
    addIntervention,
    updateIntervention: (id, patch) =>
      setState((s) => ({
        ...s,
        interventions: s.interventions.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x)),
      })),
    setRecStatus: (recId, status) =>
      setState((s) => ({ ...s, recStatus: { ...s.recStatus, [recId]: status } })),
    updateAlert: (id, status) =>
      setState((s) => ({ ...s, alerts: s.alerts.map((a) => (a.id === id ? { ...a, status } : a)) })),
    setThresholds: (t) => setState((s) => ({ ...s, thresholds: t })),
    setUsers: (u) => setState((s) => ({ ...s, users: u })),
    retrainModel,
    predictCustom,
    log,
    updateDatasetConfig,
    updateActiveModel,
    activateModelVersion,
    addModelVersion,
    addSystemLog,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useLV() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useLV must be used inside LandVisionProvider");
  return ctx;
}

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Super Admin",
  STATE_OFFICER: "State Administrator",
  DISTRICT_OFFICER: "District Officer",
  DECISION_MAKER: "Policy Decision Maker",
  ANALYST: "Infrastructure Analyst",
  PUBLIC_USER: "Public User",
};
