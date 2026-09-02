import type {
  Alert,
  AppUser,
  AuditEntry,
  Project,
  ProjectType,
  Stage,
  StageProgress,
} from "./types";
import { STAGES } from "./types";
import { predict } from "./risk";

/** Deterministic PRNG so demo data is stable across renders and SSR. */
const at = <T,>(arr: readonly T[], i: number): T => arr[i % arr.length] as T;

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface StateDef {
  name: string;
  lat: number;
  lng: number;
  districts: string[];
}

export const STATES: StateDef[] = [
  { name: "Odisha", lat: 20.35, lng: 85.3, districts: ["Khordha", "Cuttack", "Puri", "Ganjam", "Sundargarh", "Jajpur"] },
  { name: "Maharashtra", lat: 19.5, lng: 75.7, districts: ["Pune", "Nagpur", "Nashik", "Raigad", "Thane", "Aurangabad"] },
  { name: "Uttar Pradesh", lat: 26.9, lng: 80.9, districts: ["Lucknow", "Kanpur Nagar", "Varanasi", "Gautam Buddha Nagar", "Agra", "Prayagraj"] },
  { name: "Tamil Nadu", lat: 11.1, lng: 78.6, districts: ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Kancheepuram"] },
  { name: "Gujarat", lat: 22.6, lng: 71.6, districts: ["Ahmedabad", "Surat", "Rajkot", "Kutch", "Vadodara", "Bharuch"] },
  { name: "Karnataka", lat: 15.0, lng: 76.0, districts: ["Bengaluru Rural", "Mysuru", "Belagavi", "Tumakuru", "Ballari", "Dharwad"] },
  { name: "Rajasthan", lat: 26.6, lng: 74.2, districts: ["Jaipur", "Jodhpur", "Alwar", "Udaipur", "Bikaner", "Kota"] },
  { name: "Madhya Pradesh", lat: 23.3, lng: 78.3, districts: ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Rewa", "Ujjain"] },
  { name: "West Bengal", lat: 23.0, lng: 87.9, districts: ["Howrah", "Hooghly", "Bardhaman", "Nadia", "Murshidabad", "Purulia"] },
  { name: "Andhra Pradesh", lat: 15.9, lng: 79.7, districts: ["Guntur", "Visakhapatnam", "Krishna", "Nellore", "Kurnool", "Anantapur"] },
  { name: "Telangana", lat: 17.9, lng: 79.0, districts: ["Rangareddy", "Medak", "Warangal", "Karimnagar", "Nalgonda", "Khammam"] },
  { name: "Bihar", lat: 25.6, lng: 85.4, districts: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Purnia", "Darbhanga"] },
];

export const PROJECT_TYPES: ProjectType[] = [
  "Highway",
  "Railway",
  "Industrial",
  "Power",
  "Urban Development",
];

const AGENCIES: Record<ProjectType, string> = {
  Highway: "National Highways Authority of India",
  Railway: "Ministry of Railways — Construction Wing",
  Industrial: "State Industrial Development Corporation",
  Power: "State Transmission Utility",
  "Urban Development": "State Urban Development Authority",
};

const DEPARTMENTS: Record<Stage, string> = {
  Notification: "Revenue Department",
  Survey: "Survey & Settlement",
  Valuation: "District Valuation Cell",
  Compensation: "Land Acquisition Office",
  "Legal Resolution": "District Legal Cell",
  "Rehabilitation & Resettlement": "R&R Directorate",
  Possession: "Land Acquisition Office",
  Completion: "Implementing Agency",
};

const NAME_PREFIX: Record<ProjectType, string[]> = {
  Highway: ["NH", "SH", "Bypass", "Expressway"],
  Railway: ["Rail Corridor", "Doubling Line", "Freight Corridor"],
  Industrial: ["Industrial Park", "Industrial Development Zone", "Logistics Hub"],
  Power: ["Transmission Corridor", "Substation Link", "Grid Corridor"],
  "Urban Development": ["Urban Extension", "Metro Corridor", "Ring Road"],
};

function makeStages(rand: () => number, currentIndex: number, startYear: number): StageProgress[] {
  return STAGES.map((stage, i) => {
    const planned = new Date(Date.UTC(startYear, 1 + i * 4, 10 + Math.floor(rand() * 15)));
    let progress: number;
    let status: StageProgress["status"];
    if (i < currentIndex) {
      progress = 100;
      status = "Completed";
    } else if (i === currentIndex) {
      progress = 20 + Math.floor(rand() * 60);
      status = rand() > 0.5 ? "In Progress" : "Delayed";
    } else {
      progress = 0;
      status = "Upcoming";
    }
    const delayed = i <= currentIndex && rand() > 0.55;
    const actual =
      i < currentIndex
        ? new Date(planned.getTime() + (delayed ? 1 : 0) * (20 + rand() * 120) * 86400000)
        : null;
    return {
      stage,
      progress,
      plannedDate: planned.toISOString().slice(0, 10),
      actualDate: actual ? actual.toISOString().slice(0, 10) : null,
      status,
      department: DEPARTMENTS[stage],
    };
  });
}

function buildProject(i: number, rand: () => number): Project {
  const st = at(STATES, Math.floor(rand() * STATES.length));
  const district = at(st.districts, Math.floor(rand() * st.districts.length));
  const type = at(PROJECT_TYPES, Math.floor(rand() * PROJECT_TYPES.length));
  const prefix = at(NAME_PREFIX[type], Math.floor(rand() * NAME_PREFIX[type].length));
  const currentIndex = 1 + Math.floor(rand() * 6);
  const startYear = 2019 + Math.floor(rand() * 6);
  const landArea = Math.round((12 + rand() * 880) * 10) / 10;
  const govt = Math.round(landArea * (0.1 + rand() * 0.35) * 10) / 10;
  const forest = Math.round(landArea * rand() * 0.15 * 10) / 10;
  const compensationPct = Math.floor(rand() * 101);
  const severityBias = rand();
  return {
    id: `p${i}`,
    projectId: `LV-${String(1000 + i)}`,
    name: `${prefix} ${100 + Math.floor(rand() * 800)} — ${district} Segment`,
    type,
    agency: AGENCIES[type],
    state: st.name,
    district,
    block: `${district} Block ${1 + Math.floor(rand() * 6)}`,
    village: `Village ${1 + Math.floor(rand() * 40)}`,
    landArea,
    govtLand: govt,
    privateLand: Math.round((landArea - govt - forest) * 10) / 10,
    forestLand: forest,
    villages: 1 + Math.floor(rand() * 18),
    affectedFamilies: 20 + Math.floor(rand() * 2400),
    latitude: st.lat + (rand() - 0.5) * 2.6,
    longitude: st.lng + (rand() - 0.5) * 2.6,
    status: rand() > 0.94 ? "On Hold" : currentIndex >= 7 ? "Completed" : "Active",
    currentStage: at(STAGES, currentIndex),
    createdAt: new Date(Date.UTC(startYear, Math.floor(rand() * 12), 1 + Math.floor(rand() * 27)))
      .toISOString()
      .slice(0, 10),
    startYear,
    params: {
      pendingApprovals: Math.floor(rand() * (severityBias > 0.7 ? 10 : 5)),
      legalDisputes: Math.floor(rand() * (severityBias > 0.75 ? 15 : 5)),
      resolvedDisputes: Math.floor(rand() * 9),
      ownershipConflicts: Math.floor(rand() * 20),
      documentationPct: 35 + Math.floor(rand() * 66),
      compensationPct,
      rrPct: Math.floor(rand() * 101),
      possessionPct: Math.floor(rand() * 101),
      stakeholderResponsiveness: 25 + Math.floor(rand() * 76),
      historicalPerformance: 30 + Math.floor(rand() * 71),
    },
    stages: makeStages(rand, currentIndex, startYear),
    publicNotice: `Notification issued under the RFCTLARR Act, 2013 for ${district}. Objections may be filed with the District Land Acquisition Office.`,
    demo: true,
  };
}

/** Five named demonstration projects referenced in the demo walkthrough. */
function flagshipProjects(): Project[] {
  const mk = (
    seedIdx: number,
    over: Partial<Project> & { params?: Partial<Project["params"]> },
  ): Project => {
    const base = buildProject(seedIdx, mulberry32(9000 + seedIdx));
    return {
      ...base,
      ...over,
      params: { ...base.params, ...(over.params ?? {}) },
      stages: over.stages ?? base.stages,
    } as Project;
  };

  const nh16Stages = makeStages(mulberry32(77), 4, 2022).map((s) => {
    const map: Record<string, number> = {
      Notification: 100,
      Survey: 100,
      Valuation: 80,
      Compensation: 50,
      "Legal Resolution": 30,
      "Rehabilitation & Resettlement": 40,
      Possession: 20,
      Completion: 0,
    };
    const progress = map[s.stage] ?? s.progress;
    const status: StageProgress["status"] =
      progress === 100
        ? "Completed"
        : progress === 0
          ? "Upcoming"
          : s.stage === "Legal Resolution" || s.stage === "Compensation"
            ? "Delayed"
            : "In Progress";
    return { ...s, progress, status };
  });

  return [
    mk(1, {
      id: "nh16",
      projectId: "LV-0001",
      name: "NH-16 Expansion",
      type: "Highway",
      agency: "National Highways Authority of India",
      state: "Odisha",
      district: "Khordha",
      block: "Balianta",
      village: "Pratap Nagari",
      landArea: 642.5,
      govtLand: 148.2,
      privateLand: 462.1,
      forestLand: 32.2,
      villages: 14,
      affectedFamilies: 1860,
      latitude: 20.1809,
      longitude: 85.7,
      status: "Active",
      currentStage: "Legal Resolution",
      stages: nh16Stages,
      params: {
        pendingApprovals: 9,
        legalDisputes: 12,
        resolvedDisputes: 6,
        ownershipConflicts: 18,
        documentationPct: 20,
        compensationPct: 50,
        rrPct: 10,
        possessionPct: 20,
        stakeholderResponsiveness: 10,
        historicalPerformance: 5,
      },
    }),
    mk(2, {
      id: "rrc",
      projectId: "LV-0002",
      name: "Regional Railway Corridor",
      type: "Railway",
      state: "Maharashtra",
      district: "Raigad",
      currentStage: "Compensation",
      latitude: 18.52,
      longitude: 73.18,
      landArea: 918.4,
      affectedFamilies: 2410,
      params: {
        pendingApprovals: 6,
        legalDisputes: 7,
        resolvedDisputes: 4,
        ownershipConflicts: 12,
        documentationPct: 58,
        compensationPct: 42,
        rrPct: 35,
        possessionPct: 30,
        stakeholderResponsiveness: 48,
        historicalPerformance: 52,
      },
    }),
    mk(3, {
      id: "idz",
      projectId: "LV-0003",
      name: "Industrial Development Zone",
      type: "Industrial",
      state: "Gujarat",
      district: "Bharuch",
      currentStage: "Valuation",
      latitude: 21.7,
      longitude: 72.99,
      landArea: 1240,
      affectedFamilies: 940,
      params: {
        pendingApprovals: 3,
        legalDisputes: 2,
        resolvedDisputes: 6,
        ownershipConflicts: 4,
        documentationPct: 82,
        compensationPct: 71,
        rrPct: 64,
        possessionPct: 55,
        stakeholderResponsiveness: 74,
        historicalPerformance: 70,
      },
    }),
    mk(4, {
      id: "tcd",
      projectId: "LV-0004",
      name: "Transmission Corridor",
      type: "Power",
      state: "Rajasthan",
      district: "Jodhpur",
      currentStage: "Survey",
      latitude: 26.28,
      longitude: 73.02,
      landArea: 310.6,
      affectedFamilies: 320,
      params: {
        pendingApprovals: 4,
        legalDisputes: 1,
        resolvedDisputes: 2,
        ownershipConflicts: 3,
        documentationPct: 91,
        compensationPct: 88,
        rrPct: 80,
        possessionPct: 62,
        stakeholderResponsiveness: 84,
        historicalPerformance: 79,
      },
    }),
    mk(5, {
      id: "uip",
      projectId: "LV-0005",
      name: "Urban Infrastructure Project",
      type: "Urban Development",
      state: "Telangana",
      district: "Rangareddy",
      currentStage: "Rehabilitation & Resettlement",
      latitude: 17.31,
      longitude: 78.31,
      landArea: 486.2,
      affectedFamilies: 3120,
      params: {
        pendingApprovals: 5,
        legalDisputes: 5,
        resolvedDisputes: 9,
        ownershipConflicts: 9,
        documentationPct: 66,
        compensationPct: 61,
        rrPct: 38,
        possessionPct: 44,
        stakeholderResponsiveness: 55,
        historicalPerformance: 58,
      },
    }),
  ];
}

export const PROJECT_COUNT = 1248;

export function generateProjects(): Project[] {
  const rand = mulberry32(20260829);
  const list = flagshipProjects();
  for (let i = 6; i <= PROJECT_COUNT; i++) list.push(buildProject(i, rand));
  return list;
}

export function seedAlerts(projects: Project[]): Alert[] {
  const scored = projects
    .map((p) => ({ p, pred: predict(p) }))
    .sort((a, b) => b.pred.riskScore - a.pred.riskScore)
    .slice(0, 18);
  const officers = [
    "Collector, District Office",
    "Land Acquisition Officer",
    "Sub-Divisional Magistrate",
    "R&R Officer",
  ];
  return scored.map(({ p, pred }, i) => {
    const severity: Alert["severity"] =
      pred.riskScore >= 85 ? "Critical" : pred.riskScore >= 70 ? "High" : i % 3 === 0 ? "Medium" : "Information";
    const message =
      severity === "Critical"
        ? `Risk increased from ${Math.max(20, pred.riskScore - 22)} → ${pred.riskScore}`
        : severity === "High"
          ? `Compensation progress has remained unchanged for 30 days (${p.params.compensationPct}%).`
          : severity === "Medium"
            ? `${p.params.legalDisputes} legal disputes pending beyond the resolution timeline.`
            : "New project dataset successfully imported.";
    return {
      id: `AL-${1000 + i}`,
      projectId: p.id,
      projectName: p.name,
      severity,
      message,
      trigger:
        severity === "Critical"
          ? "Risk threshold crossed"
          : severity === "High"
            ? "Stalled compensation progress"
            : severity === "Medium"
              ? "Legal disputes increased"
              : "Dataset import",
      officer: at(officers, i),
      status: i === 0 ? "New" : i % 4 === 0 ? "Acknowledged" : "New",
      createdAt: new Date(Date.now() - i * 15 * 3600_000).toISOString(),
    };
  });
}

export const DEMO_USERS: AppUser[] = [
  {
    id: "u1",
    name: "A. Mehra",
    email: "admin@landvision.gov.in",
    role: "ADMIN",
    state: null,
    district: null,
    status: "Active",
    lastLogin: "2026-08-28T09:12:00Z",
  },
  {
    id: "u2",
    name: "S. Patnaik",
    email: "state.odisha@landvision.gov.in",
    role: "STATE_OFFICER",
    state: "Odisha",
    district: null,
    status: "Active",
    lastLogin: "2026-08-28T11:40:00Z",
  },
  {
    id: "u3",
    name: "R. Nayak",
    email: "district.khordha@landvision.gov.in",
    role: "DISTRICT_OFFICER",
    state: "Odisha",
    district: "Khordha",
    status: "Active",
    lastLogin: "2026-08-29T07:05:00Z",
  },
  {
    id: "u4",
    name: "Dr. K. Iyer",
    email: "policy@landvision.gov.in",
    role: "DECISION_MAKER",
    state: null,
    district: null,
    status: "Active",
    lastLogin: "2026-08-27T16:22:00Z",
  },
  {
    id: "u5",
    name: "M. Verma",
    email: "state.gujarat@landvision.gov.in",
    role: "STATE_OFFICER",
    state: "Gujarat",
    district: null,
    status: "Disabled",
    lastLogin: "2026-06-14T10:00:00Z",
  },
];

export const SEED_AUDIT: AuditEntry[] = [
  {
    id: "a1",
    user: "R. Nayak",
    action: "Updated compensation progress",
    entity: "Project",
    entityId: "LV-0001",
    oldValue: "50%",
    newValue: "65%",
    timestamp: "2026-08-28T10:14:00Z",
  },
  {
    id: "a2",
    user: "A. Mehra",
    action: "Uploaded project dataset",
    entity: "Dataset",
    entityId: "land_acq_batch_08.csv",
    oldValue: "—",
    newValue: "1,248 records",
    timestamp: "2026-08-27T15:02:00Z",
  },
  {
    id: "a3",
    user: "A. Mehra",
    action: "Deployed ML model",
    entity: "Model",
    entityId: "v2.4",
    oldValue: "v2.3",
    newValue: "v2.4",
    timestamp: "2026-08-26T12:41:00Z",
  },
];
