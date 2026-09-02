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
  Alert,
  AppUser,
  AuditEntry,
  Intervention,
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
    session: DEMO_USERS[0] ?? null,
    recStatus: {},
    modelVersion: MODEL_VERSION,
    retrainingHistory: RETRAINING_HISTORY,
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
}

const StoreContext = createContext<Ctx | null>(null);

export function LandVisionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(() => buildInitial());
  const [ready, setReady] = useState(false);
  const [selectedState, setSelectedState] = useState("Odisha");

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
          session: state.session,
          recStatus: state.recStatus,
          projects: state.projects,
          modelVersion: state.modelVersion,
          retrainingHistory: state.retrainingHistory,
        }),
      );
    } catch {
      /* storage full or unavailable — state stays in memory */
    }
  }, [state, ready]);

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
    logout: () => setState((s) => ({ ...s, session: null })),
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
