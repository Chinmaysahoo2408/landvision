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
  Role,
  Thresholds,
} from "./types";
import { DEFAULT_THRESHOLDS, predict } from "./risk";
import { DEMO_USERS, SEED_AUDIT, generateProjects, seedAlerts } from "./data";

interface Persisted {
  projects: Project[];
  interventions: Intervention[];
  alerts: Alert[];
  audit: AuditEntry[];
  users: AppUser[];
  thresholds: Thresholds;
  session: AppUser | null;
  recStatus: Record<string, Recommendation["status"]>;
}

const KEY = "landvision.state.v1";

function buildInitial(): Persisted {
  const projects = generateProjects();
  return {
    projects,
    interventions: [],
    alerts: seedAlerts(projects),
    audit: SEED_AUDIT,
    users: DEMO_USERS,
    thresholds: DEFAULT_THRESHOLDS,
    session: null,
    recStatus: {},
  };
}

interface Ctx extends Persisted {
  ready: boolean;
  predictions: Map<string, Prediction>;
  predictionFor: (projectId: string) => Prediction | undefined;
  login: (role: Role) => AppUser | null;
  logout: () => void;
  visibleProjects: Project[];
  updateProject: (id: string, patch: Partial<Project>, note?: string) => void;
  addProject: (p: Project) => void;
  addIntervention: (i: Omit<Intervention, "id" | "createdAt">) => void;
  updateIntervention: (id: string, patch: Partial<Intervention>) => void;
  setRecStatus: (recId: string, status: Recommendation["status"]) => void;
  updateAlert: (id: string, status: Alert["status"]) => void;
  setThresholds: (t: Thresholds) => void;
  setUsers: (u: AppUser[]) => void;
  log: (e: Omit<AuditEntry, "id" | "timestamp">) => void;
}

const StoreContext = createContext<Ctx | null>(null);

export function LandVisionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(() => buildInitial());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Persisted>;
        setState((s) => ({ ...s, ...parsed, projects: parsed.projects?.length ? parsed.projects : s.projects }));
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
        }),
      );
    } catch {
      /* storage full or unavailable — state stays in memory */
    }
  }, [state, ready]);

  const predictions = useMemo(() => {
    const m = new Map<string, Prediction>();
    for (const p of state.projects) m.set(p.id, predict(p, state.thresholds));
    return m;
  }, [state.projects, state.thresholds]);

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
        { ...e, id: `au-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: new Date().toISOString() },
        ...s.audit,
      ],
    }));
  }, []);

  const value: Ctx = {
    ...state,
    ready,
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
              action: "Signed in",
              entity: "Session",
              entityId: user.email,
              oldValue: "—",
              newValue: role,
              timestamp: new Date().toISOString(),
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
        const oldScore = before ? predict(before, s.thresholds).riskScore : 0;
        const newScore = after ? predict(after, s.thresholds).riskScore : 0;
        return {
          ...s,
          projects,
          audit: [
            {
              id: `au-${Date.now()}`,
              user: s.session?.name ?? "System",
              action: note ?? "Updated project data",
              entity: "Project",
              entityId: before?.projectId ?? id,
              oldValue: `risk ${oldScore}`,
              newValue: `risk ${newScore}`,
              timestamp: new Date().toISOString(),
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
            action: "Created project",
            entity: "Project",
            entityId: p.projectId,
            oldValue: "—",
            newValue: p.name,
            timestamp: new Date().toISOString(),
          },
          ...s.audit,
        ],
      })),
    addIntervention: (i) =>
      setState((s) => ({
        ...s,
        interventions: [
          { ...i, id: `IV-${Date.now().toString().slice(-6)}`, createdAt: new Date().toISOString() },
          ...s.interventions,
        ],
      })),
    updateIntervention: (id, patch) =>
      setState((s) => ({
        ...s,
        interventions: s.interventions.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      })),
    setRecStatus: (recId, status) =>
      setState((s) => ({ ...s, recStatus: { ...s.recStatus, [recId]: status } })),
    updateAlert: (id, status) =>
      setState((s) => ({ ...s, alerts: s.alerts.map((a) => (a.id === id ? { ...a, status } : a)) })),
    setThresholds: (t) => setState((s) => ({ ...s, thresholds: t })),
    setUsers: (u) => setState((s) => ({ ...s, users: u })),
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
  ADMIN: "Administrator",
  STATE_OFFICER: "State Officer",
  DISTRICT_OFFICER: "District Officer",
  DECISION_MAKER: "Decision Maker",
};
