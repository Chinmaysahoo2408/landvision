import type {
  Alert,
  ApiEndpoint,
  AppUser,
  AuditEntry,
  CompensationRecord,
  DocumentItem,
  LegalCase,
  PossessionMetrics,
  Project,
  ProjectType,
  RetrainingLog,
  RRMetrics,
  Stage,
  StageProgress,
} from "./types";
import { STAGES } from "./types";
import { predict } from "./risk";

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

export interface StateDef {
  name: string;
  code: string;
  lat: number;
  lng: number;
  districts: string[];
}

export const STATES: StateDef[] = [
  { name: "Odisha", code: "OD", lat: 20.35, lng: 85.3, districts: ["Khordha", "Cuttack", "Puri", "Ganjam", "Sundargarh", "Jajpur", "Sambalpur", "Balasore"] },
  { name: "Maharashtra", code: "MH", lat: 19.5, lng: 75.7, districts: ["Pune", "Nagpur", "Nashik", "Raigad", "Thane", "Aurangabad", "Solapur", "Kolhapur"] },
  { name: "Uttar Pradesh", code: "UP", lat: 26.9, lng: 80.9, districts: ["Lucknow", "Kanpur Nagar", "Varanasi", "Gautam Buddha Nagar", "Agra", "Prayagraj", "Gorakhpur", "Meerut"] },
  { name: "Tamil Nadu", code: "TN", lat: 11.1, lng: 78.6, districts: ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Kancheepuram", "Tirunelveli", "Vellore"] },
  { name: "Gujarat", code: "GJ", lat: 22.6, lng: 71.6, districts: ["Ahmedabad", "Surat", "Rajkot", "Kutch", "Vadodara", "Bharuch", "Bhavnagar", "Jamnagar"] },
  { name: "Karnataka", code: "KA", lat: 15.0, lng: 76.0, districts: ["Bengaluru Rural", "Mysuru", "Belagavi", "Tumakuru", "Ballari", "Dharwad", "Dakshina Kannada", "Shivamogga"] },
  { name: "Rajasthan", code: "RJ", lat: 26.6, lng: 74.2, districts: ["Jaipur", "Jodhpur", "Alwar", "Udaipur", "Bikaner", "Kota", "Ajmer", "Bhilwara"] },
  { name: "Madhya Pradesh", code: "MP", lat: 23.3, lng: 78.3, districts: ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Rewa", "Ujjain", "Sagar", "Satna"] },
  { name: "West Bengal", code: "WB", lat: 23.0, lng: 87.9, districts: ["Howrah", "Hooghly", "Bardhaman", "Nadia", "Murshidabad", "Purulia", "North 24 Parganas", "South 24 Parganas"] },
  { name: "Andhra Pradesh", code: "AP", lat: 15.9, lng: 79.7, districts: ["Guntur", "Visakhapatnam", "Krishna", "Nellore", "Kurnool", "Anantapur", "Chittoor", "Prakasam"] },
  { name: "Telangana", code: "TS", lat: 17.9, lng: 79.0, districts: ["Rangareddy", "Medak", "Warangal", "Karimnagar", "Nalgonda", "Khammam", "Mahbubnagar", "Nizamabad"] },
  { name: "Bihar", code: "BR", lat: 25.6, lng: 85.4, districts: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Purnia", "Darbhanga", "Begusarai", "Rohtas"] },
];

export const PROJECT_TYPES: ProjectType[] = [
  "Highway",
  "Railway",
  "Industrial",
  "Power",
  "Urban Development",
];

export const AGENCIES: Record<ProjectType, string> = {
  Highway: "National Highways Authority of India (NHAI)",
  Railway: "Ministry of Railways — Dedicated Freight Corridor Corp",
  Industrial: "State Industrial Development Corporation (SIDC)",
  Power: "Power Grid Corporation of India / State Transmission Utility",
  "Urban Development": "National Capital Region / State Urban Development Authority",
};

export const DEPARTMENTS: Record<Stage, string> = {
  Notification: "Revenue & Disaster Management Department",
  Survey: "Directorate of Land Records & Survey",
  Valuation: "District Valuation Committee & Tehsildar",
  Compensation: "Land Acquisition Office & Competent Authority (CALA)",
  "Legal Resolution": "District Legal Services Authority / Revenue Court",
  "Rehabilitation & Resettlement": "R&R Directorate & Commissioner",
  Possession: "Special Land Acquisition Officer & District Police",
  Completion: "Implementing Agency Project Management Unit",
};

const NAME_PREFIX: Record<ProjectType, string[]> = {
  Highway: ["NH", "SH", "National Expressway", "Greenfield Corridor", "Economic Bypass"],
  Railway: ["High Speed Rail", "Freight Corridor", "Line Doubling", "Orbital Rail"],
  Industrial: ["Mega Industrial Park", "Textile Cluster", "Logistics Hub", "Special Investment Region"],
  Power: ["765kV Transmission Line", "Green Energy Corridor", "Substation Feeder", "Solar Park Evacuation"],
  "Urban Development": ["Ring Road Phase", "Metro Expansion Line", "Smart City Extension", "Outer Boulevard"],
};

function makeStages(rand: () => number, currentIndex: number, startYear: number): StageProgress[] {
  return STAGES.map((stage, i) => {
    const plannedStart = new Date(Date.UTC(startYear, 1 + i * 4, 10 + Math.floor(rand() * 15)));
    const plannedEnd = new Date(plannedStart.getTime() + 90 * 86400000);
    let progress: number;
    let status: StageProgress["status"];
    let daysDelayed = 0;

    if (i < currentIndex) {
      progress = 100;
      status = "Completed";
      daysDelayed = Math.floor(rand() * 15);
    } else if (i === currentIndex) {
      progress = 20 + Math.floor(rand() * 60);
      daysDelayed = 30 + Math.floor(rand() * 90);
      status = daysDelayed > 60 ? "Delayed" : "In Progress";
    } else {
      progress = 0;
      status = "Upcoming";
      daysDelayed = 0;
    }

    const actualStart = i <= currentIndex ? plannedStart.toISOString().slice(0, 10) : null;
    const actualEnd =
      i < currentIndex
        ? new Date(plannedEnd.getTime() + daysDelayed * 86400000).toISOString().slice(0, 10)
        : null;

    const delayProbability =
      status === "Completed"
        ? 0
        : status === "Delayed"
          ? 70 + Math.floor(rand() * 25)
          : 20 + Math.floor(rand() * 50);

    return {
      stage,
      progress,
      plannedDate: plannedStart.toISOString().slice(0, 10),
      actualDate: actualStart,
      plannedCompletion: plannedEnd.toISOString().slice(0, 10),
      actualCompletion: actualEnd,
      status,
      daysDelayed,
      delayProbability,
      riskCategory: delayProbability >= 70 ? "HIGH" : delayProbability >= 40 ? "MEDIUM" : "LOW",
      department: DEPARTMENTS[stage],
    };
  });
}

function generateLegalCases(projectId: string, count: number, rand: () => number): LegalCase[] {
  const courts = ["High Court", "District Court", "Sub-Divisional Revenue Court", "National Green Tribunal"];
  const subjects = [
    "Compensation quantum enhancement plea under RFCTLARR Sec 64",
    "Ancestral title and partition dispute between co-sharers",
    "Objection against alignment passing through multi-crop agricultural land",
    "Religious structure relocation and cultural rights claim",
    "Tenancy rights and sharecropper rehabilitation entitlement claim",
  ];

  const cases: LegalCase[] = [];
  for (let i = 1; i <= count; i++) {
    const isResolved = rand() > 0.65;
    const severity = at(["Critical", "High", "Medium", "Low"] as const, Math.floor(rand() * 4));
    cases.push({
      id: `${projectId}-CASE-${100 + i}`,
      projectId,
      caseNumber: `WP(C)/${2023 + Math.floor(rand() * 3)}/${1000 + Math.floor(rand() * 8000)}`,
      court: at(courts, Math.floor(rand() * courts.length)),
      petitioner: `Ramesh Chandra & ${1 + Math.floor(rand() * 8)} others`,
      respondent: "State of India & Competent Authority for Land Acquisition",
      subject: at(subjects, Math.floor(rand() * subjects.length)),
      severity,
      status: isResolved ? "Resolved" : severity === "Critical" ? "Stay Granted" : "In Hearing",
      affectedParcels: 1 + Math.floor(rand() * 12),
      filedDate: new Date(Date.now() - (60 + rand() * 400) * 86400000).toISOString().slice(0, 10),
      hearingDate: new Date(Date.now() + (10 + rand() * 45) * 86400000).toISOString().slice(0, 10),
      daysPending: isResolved ? 0 : Math.floor(45 + rand() * 240),
      resolutionTimeEstimateDays: Math.floor(30 + rand() * 120),
    });
  }
  return cases;
}

function generateDocuments(rand: () => number, docPct: number): DocumentItem[] {
  const types: DocumentItem["type"][] = [
    "Land Ownership",
    "Survey & Demarcation",
    "Legal & Court",
    "Compensation Awards",
    "R&R Plans",
    "Statutory Approvals",
  ];

  return types.map((type) => {
    const total = 100 + Math.floor(rand() * 150);
    const verified = Math.round((total * docPct) / 100);
    const rejected = Math.floor(rand() * 8);
    const pending = Math.max(0, total - verified - rejected);
    return {
      type,
      submitted: total,
      verified,
      pending,
      rejected,
      compliancePct: Math.round((verified / total) * 100),
    };
  });
}

function buildProject(i: number, rand: () => number): Project {
  const st = at(STATES, Math.floor(rand() * STATES.length));
  const district = at(st.districts, Math.floor(rand() * st.districts.length));
  const type = at(PROJECT_TYPES, Math.floor(rand() * PROJECT_TYPES.length));
  const prefix = at(NAME_PREFIX[type], Math.floor(rand() * NAME_PREFIX[type].length));
  const currentIndex = 1 + Math.floor(rand() * 6);
  const startYear = 2020 + Math.floor(rand() * 5);
  const landArea = Math.round((25 + rand() * 1200) * 10) / 10;
  const govt = Math.round(landArea * (0.1 + rand() * 0.3) * 10) / 10;
  const forest = Math.round(landArea * rand() * 0.12 * 10) / 10;
  const privateLand = Math.max(0, Math.round((landArea - govt - forest) * 10) / 10);
  const affectedFamilies = 40 + Math.floor(rand() * 3200);

  const compensationPct = Math.floor(rand() * 101);
  const possessionPct = Math.floor(rand() * 101);
  const rrPct = Math.floor(rand() * 101);
  const docPct = 40 + Math.floor(rand() * 58);
  const legalCount = Math.floor(rand() * 8);

  const totalLandRequired = landArea;
  const landAcquired = Math.round(((totalLandRequired * (compensationPct + possessionPct)) / 200) * 10) / 10;
  const landPossessed = Math.round(((totalLandRequired * possessionPct) / 100) * 10) / 10;
  const landPending = Math.max(0, Math.round((totalLandRequired - landPossessed) * 10) / 10);

  const eligibleCr = Math.round((landArea * (1.2 + rand() * 2.8)) * 10) / 10;
  const paidCr = Math.round(((eligibleCr * compensationPct) / 100) * 10) / 10;
  const pendingCr = Math.max(0, Math.round((eligibleCr - paidCr) * 10) / 10);

  const currentStage = at(STAGES, currentIndex);
  const complexity = at(["Low", "Medium", "High", "Extreme"] as const, Math.floor(rand() * 4));

  const stakeholderBreakdown = {
    landowners: 35 + Math.floor(rand() * 60),
    districtAdmin: 50 + Math.floor(rand() * 48),
    governmentDepts: 55 + Math.floor(rand() * 42),
    legalAuthorities: 40 + Math.floor(rand() * 55),
    rrAuthorities: 45 + Math.floor(rand() * 50),
    projectAuthorities: 60 + Math.floor(rand() * 38),
  };

  const compRecord: CompensationRecord = {
    projectId: `LV-${String(1000 + i)}`,
    totalLandowners: Math.round(affectedFamilies * 1.35),
    eligibleAmountCr: eligibleCr,
    paidAmountCr: paidCr,
    pendingAmountCr: pendingCr,
    disbursedPct: compensationPct,
    avgProcessingDays: 35 + Math.floor(rand() * 65),
    stalledAccounts: Math.floor(rand() * 45),
    disbursalVelocityCrPerMonth: Math.round((paidCr / (1 + rand() * 6)) * 10) / 10,
  };

  const rrRecord: RRMetrics = {
    projectId: `LV-${String(1000 + i)}`,
    totalFamilies: affectedFamilies,
    rehabilitationCompleted: Math.round((affectedFamilies * rrPct) / 100),
    rehabilitationPending: Math.max(0, affectedFamilies - Math.round((affectedFamilies * rrPct) / 100)),
    resettlementCompleted: Math.round((affectedFamilies * Math.max(0, rrPct - 10)) / 100),
    resettlementPending: Math.max(0, affectedFamilies - Math.round((affectedFamilies * Math.max(0, rrPct - 10)) / 100)),
    rrCompletionPct: rrPct,
    resettlementSitesReady: 1 + Math.floor(rand() * 4),
    resettlementSitesPlanned: 2 + Math.floor(rand() * 4),
    rrRiskCategory: rrPct >= 70 ? "LOW" : rrPct >= 40 ? "MEDIUM" : "HIGH",
  };

  const possessionRecord: PossessionMetrics = {
    projectId: `LV-${String(1000 + i)}`,
    totalLandRequiredAcres: totalLandRequired,
    landAcquiredAcres: landAcquired,
    landPossessedAcres: landPossessed,
    landPendingAcres: landPending,
    possessionPct,
    encroachmentIssues: Math.floor(rand() * 6),
    encroachedAreaAcres: Math.round(rand() * 18 * 10) / 10,
  };

  const basePriceLakhs = 15 + Math.floor(rand() * 60);
  const landPrices = [
    { year: 2021, historicalPricePerAcreLakhs: basePriceLakhs * 0.75, currentEstimatedPricePerAcreLakhs: basePriceLakhs, futureEstimatedPricePerAcreLakhs: basePriceLakhs * 1.4, infraImpactMultiplier: 1.15 },
    { year: 2022, historicalPricePerAcreLakhs: basePriceLakhs * 0.82, currentEstimatedPricePerAcreLakhs: basePriceLakhs, futureEstimatedPricePerAcreLakhs: basePriceLakhs * 1.45, infraImpactMultiplier: 1.2 },
    { year: 2023, historicalPricePerAcreLakhs: basePriceLakhs * 0.9, currentEstimatedPricePerAcreLakhs: basePriceLakhs, futureEstimatedPricePerAcreLakhs: basePriceLakhs * 1.5, infraImpactMultiplier: 1.3 },
    { year: 2024, historicalPricePerAcreLakhs: basePriceLakhs * 0.96, currentEstimatedPricePerAcreLakhs: basePriceLakhs, futureEstimatedPricePerAcreLakhs: basePriceLakhs * 1.6, infraImpactMultiplier: 1.4 },
    { year: 2025, historicalPricePerAcreLakhs: basePriceLakhs, currentEstimatedPricePerAcreLakhs: basePriceLakhs, futureEstimatedPricePerAcreLakhs: basePriceLakhs * 1.7, infraImpactMultiplier: 1.55 },
    { year: 2026, historicalPricePerAcreLakhs: basePriceLakhs * 1.08, currentEstimatedPricePerAcreLakhs: basePriceLakhs * 1.08, futureEstimatedPricePerAcreLakhs: basePriceLakhs * 1.85, infraImpactMultiplier: 1.7 },
  ];

  return {
    id: `p${i}`,
    projectId: `LV-${String(1000 + i)}`,
    name: `${prefix} ${100 + Math.floor(rand() * 800)} — ${district} Corridor`,
    type,
    agency: AGENCIES[type],
    state: st.name,
    district,
    block: `${district} Block ${1 + Math.floor(rand() * 6)}`,
    village: `Village ${1 + Math.floor(rand() * 40)}`,
    landArea,
    govtLand: govt,
    privateLand,
    forestLand: forest,
    villages: 1 + Math.floor(rand() * 18),
    affectedFamilies,
    latitude: st.lat + (rand() - 0.5) * 2.4,
    longitude: st.lng + (rand() - 0.5) * 2.4,
    status: rand() > 0.94 ? "On Hold" : currentIndex >= 7 ? "Completed" : "Active",
    currentStage,
    createdAt: new Date(Date.UTC(startYear, Math.floor(rand() * 12), 1 + Math.floor(rand() * 27)))
      .toISOString()
      .slice(0, 10),
    startYear,
    targetCompletionYear: startYear + 3 + Math.floor(rand() * 3),
    params: {
      projectType: type,
      landArea,
      affectedFamilies,
      compensationPct,
      approvalCompletionPct: 40 + Math.floor(rand() * 58),
      approvalDelayDays: Math.floor(rand() * 110),
      legalDisputes: legalCount,
      resolvedDisputes: Math.floor(rand() * 5),
      documentationPct: docPct,
      pendingNotifications: Math.floor(rand() * 4),
      ownershipConflicts: Math.floor(rand() * 12),
      rrPct,
      possessionPct,
      stakeholderResponsiveness: Math.round(
        (stakeholderBreakdown.landowners +
          stakeholderBreakdown.districtAdmin +
          stakeholderBreakdown.governmentDepts) /
          3,
      ),
      stakeholderBreakdown,
      departmentPerformance: 45 + Math.floor(rand() * 50),
      projectComplexity: complexity,
      currentAcquisitionProgress: Math.round((compensationPct + possessionPct + rrPct) / 3),
      historicalPerformance: 40 + Math.floor(rand() * 55),
      pendingApprovals: Math.floor(rand() * 6),
    },
    stages: makeStages(rand, currentIndex, startYear),
    legalCases: generateLegalCases(`LV-${String(1000 + i)}`, legalCount, rand),
    compensation: compRecord,
    documents: generateDocuments(rand, docPct),
    rrMetrics: rrRecord,
    possession: possessionRecord,
    landPrices,
    publicNotice: `Preliminary notification under Section 11(1) of RFCTLARR Act 2013 for ${district} corridor. Public objections open at District Revenue Cell.`,
    demo: true,
  };
}

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
      Valuation: 85,
      Compensation: 52,
      "Legal Resolution": 34,
      "Rehabilitation & Resettlement": 42,
      Possession: 22,
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
    return {
      ...s,
      progress,
      status,
      daysDelayed: s.stage === "Legal Resolution" ? 144 : s.stage === "Compensation" ? 92 : s.daysDelayed,
      delayProbability: s.stage === "Legal Resolution" ? 84 : 45,
    };
  });

  return [
    mk(1, {
      id: "nh16",
      projectId: "LV-0001",
      name: "NH-16 6-Lane Expansion Corridor",
      type: "Highway",
      agency: "National Highways Authority of India (NHAI)",
      state: "Odisha",
      district: "Khordha",
      block: "Balianta",
      village: "Pratap Nagari & Nuapatna",
      landArea: 642.5,
      govtLand: 148.2,
      privateLand: 462.1,
      forestLand: 32.2,
      villages: 14,
      affectedFamilies: 1860,
      latitude: 20.2961,
      longitude: 85.8245,
      status: "Active",
      currentStage: "Legal Resolution",
      stages: nh16Stages,
      params: {
        projectType: "Highway",
        landArea: 642.5,
        affectedFamilies: 1860,
        compensationPct: 50,
        approvalCompletionPct: 62,
        approvalDelayDays: 78,
        legalDisputes: 12,
        resolvedDisputes: 4,
        documentationPct: 48,
        pendingNotifications: 3,
        ownershipConflicts: 18,
        rrPct: 35,
        possessionPct: 22,
        stakeholderResponsiveness: 42,
        stakeholderBreakdown: {
          landowners: 38,
          districtAdmin: 72,
          governmentDepts: 65,
          legalAuthorities: 32,
          rrAuthorities: 45,
          projectAuthorities: 80,
        },
        departmentPerformance: 54,
        projectComplexity: "High",
        currentAcquisitionProgress: 36,
        historicalPerformance: 48,
        pendingApprovals: 5,
      },
    }),
    mk(2, {
      id: "rrc",
      projectId: "LV-0002",
      name: "Western Dedicated Freight Corridor (Segment B)",
      type: "Railway",
      agency: "Dedicated Freight Corridor Corporation of India (DFCCIL)",
      state: "Maharashtra",
      district: "Raigad",
      block: "Panvel",
      village: "Karanjade & Jasai",
      currentStage: "Compensation",
      latitude: 18.9894,
      longitude: 73.1175,
      landArea: 918.4,
      affectedFamilies: 2410,
      params: {
        projectType: "Railway",
        landArea: 918.4,
        affectedFamilies: 2410,
        compensationPct: 42,
        approvalCompletionPct: 70,
        approvalDelayDays: 52,
        legalDisputes: 7,
        resolvedDisputes: 6,
        documentationPct: 58,
        pendingNotifications: 2,
        ownershipConflicts: 12,
        rrPct: 38,
        possessionPct: 30,
        stakeholderResponsiveness: 48,
        stakeholderBreakdown: {
          landowners: 45,
          districtAdmin: 68,
          governmentDepts: 74,
          legalAuthorities: 52,
          rrAuthorities: 50,
          projectAuthorities: 78,
        },
        departmentPerformance: 62,
        projectComplexity: "Extreme",
        currentAcquisitionProgress: 40,
        historicalPerformance: 55,
        pendingApprovals: 4,
      },
    }),
    mk(3, {
      id: "idz",
      projectId: "LV-0003",
      name: "PCPIR Special Industrial Investment Zone",
      type: "Industrial",
      agency: "Gujarat Industrial Development Corporation (GIDC)",
      state: "Gujarat",
      district: "Bharuch",
      block: "Dahej",
      village: "Vagra & Suva",
      currentStage: "Valuation",
      latitude: 21.7051,
      longitude: 72.9959,
      landArea: 1240,
      affectedFamilies: 940,
      params: {
        projectType: "Industrial",
        landArea: 1240,
        affectedFamilies: 940,
        compensationPct: 71,
        approvalCompletionPct: 88,
        approvalDelayDays: 22,
        legalDisputes: 2,
        resolvedDisputes: 8,
        documentationPct: 84,
        pendingNotifications: 1,
        ownershipConflicts: 4,
        rrPct: 68,
        possessionPct: 58,
        stakeholderResponsiveness: 76,
        stakeholderBreakdown: {
          landowners: 72,
          districtAdmin: 85,
          governmentDepts: 88,
          legalAuthorities: 70,
          rrAuthorities: 78,
          projectAuthorities: 84,
        },
        departmentPerformance: 82,
        projectComplexity: "Medium",
        currentAcquisitionProgress: 66,
        historicalPerformance: 78,
        pendingApprovals: 2,
      },
    }),
    mk(4, {
      id: "tcd",
      projectId: "LV-0004",
      name: "Green Energy Ultra-High Voltage Grid Corridor",
      type: "Power",
      agency: "Power Grid Corporation of India Limited (PGCIL)",
      state: "Rajasthan",
      district: "Jodhpur",
      block: "Phalodi",
      village: "Bap & Baori",
      currentStage: "Survey",
      latitude: 26.2389,
      longitude: 73.0243,
      landArea: 310.6,
      affectedFamilies: 320,
      params: {
        projectType: "Power",
        landArea: 310.6,
        affectedFamilies: 320,
        compensationPct: 88,
        approvalCompletionPct: 92,
        approvalDelayDays: 14,
        legalDisputes: 1,
        resolvedDisputes: 4,
        documentationPct: 91,
        pendingNotifications: 0,
        ownershipConflicts: 2,
        rrPct: 82,
        possessionPct: 65,
        stakeholderResponsiveness: 85,
        stakeholderBreakdown: {
          landowners: 82,
          districtAdmin: 90,
          governmentDepts: 92,
          legalAuthorities: 80,
          rrAuthorities: 84,
          projectAuthorities: 90,
        },
        departmentPerformance: 88,
        projectComplexity: "Low",
        currentAcquisitionProgress: 78,
        historicalPerformance: 84,
        pendingApprovals: 1,
      },
    }),
    mk(5, {
      id: "uip",
      projectId: "LV-0005",
      name: "Hyderabad Regional Ring Road (RRR) Southern Loop",
      type: "Urban Development",
      agency: "Hyderabad Metropolitan Development Authority (HMDA)",
      state: "Telangana",
      district: "Rangareddy",
      block: "Ibrahimpatnam",
      village: "Manchal & Yacharam",
      currentStage: "Rehabilitation & Resettlement",
      latitude: 17.1894,
      longitude: 78.6189,
      landArea: 486.2,
      affectedFamilies: 3120,
      params: {
        projectType: "Urban Development",
        landArea: 486.2,
        affectedFamilies: 3120,
        compensationPct: 62,
        approvalCompletionPct: 74,
        approvalDelayDays: 45,
        legalDisputes: 5,
        resolvedDisputes: 9,
        documentationPct: 68,
        pendingNotifications: 2,
        ownershipConflicts: 9,
        rrPct: 40,
        possessionPct: 46,
        stakeholderResponsiveness: 58,
        stakeholderBreakdown: {
          landowners: 52,
          districtAdmin: 76,
          governmentDepts: 78,
          legalAuthorities: 60,
          rrAuthorities: 54,
          projectAuthorities: 82,
        },
        departmentPerformance: 68,
        projectComplexity: "High",
        currentAcquisitionProgress: 52,
        historicalPerformance: 65,
        pendingApprovals: 3,
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
    .slice(0, 24);

  const officers = [
    "District Collector, Khordha",
    "Special Land Acquisition Officer (CALA)",
    "Sub-Divisional Magistrate, Panvel",
    "Chief Revenue Officer, Raigad",
    "Commissioner R&R, Odisha",
  ];

  return scored.map(({ p, pred }, i) => {
    const severity: Alert["severity"] =
      pred.riskScore >= 80 ? "Critical" : pred.riskScore >= 65 ? "High" : i % 3 === 0 ? "Medium" : "Information";

    let message = "";
    let trigger = "";
    let recommendation = "";

    if (severity === "Critical") {
      message = `High delay probability (${pred.delayProbability}%) with ${p.params.legalDisputes} active legal disputes.`;
      trigger = "Legal dispute threshold & risk > 80 crossed";
      recommendation = "Convene urgent revenue court hearing with District Legal Services Authority.";
    } else if (severity === "High") {
      message = `Compensation disbursement stalled at ${p.params.compensationPct}% for 45+ days.`;
      trigger = "Disbursement stall > 30 days";
      recommendation = "Deploy village DBT verification camp to expedite title clearances.";
    } else if (severity === "Medium") {
      message = `Approval delay exceeded 60 days (${p.params.approvalDelayDays}d) in ${p.currentStage}.`;
      trigger = "Approval SLA breach";
      recommendation = "Escalate statutory file movement to State Single Window Cell.";
    } else {
      message = `Dataset imported successfully for corridor segment (${p.landArea} ha).`;
      trigger = "Routine telemetry import";
      recommendation = "Continue weekly milestone tracking.";
    }

    return {
      id: `AL-${1000 + i}`,
      projectId: p.id,
      projectName: p.name,
      severity,
      message,
      trigger,
      officer: at(officers, i),
      recommendation,
      status: i === 0 ? "New" : i % 4 === 0 ? "Acknowledged" : i % 7 === 0 ? "Assigned" : "New",
      createdAt: new Date(Date.now() - i * 8 * 3600_000).toISOString(),
    };
  });
}

export const DEMO_USERS: AppUser[] = [
  {
    id: "u1",
    name: "Dr. Arvind Mehra, IAS",
    email: "admin@landvision.gov.in",
    role: "ADMIN",
    state: null,
    district: null,
    status: "Active",
    lastLogin: "2026-08-30T09:12:00Z",
  },
  {
    id: "u2",
    name: "S. Patnaik, OAS",
    email: "state.odisha@landvision.gov.in",
    role: "STATE_OFFICER",
    state: "Odisha",
    district: null,
    status: "Active",
    lastLogin: "2026-08-30T11:40:00Z",
  },
  {
    id: "u3",
    name: "R. K. Nayak",
    email: "district.khordha@landvision.gov.in",
    role: "DISTRICT_OFFICER",
    state: "Odisha",
    district: "Khordha",
    status: "Active",
    lastLogin: "2026-08-30T07:05:00Z",
  },
  {
    id: "u4",
    name: "Dr. K. Iyer",
    email: "policy@landvision.gov.in",
    role: "DECISION_MAKER",
    state: null,
    district: null,
    status: "Active",
    lastLogin: "2026-08-29T16:22:00Z",
  },
  {
    id: "u5",
    name: "Pooja Sharma",
    email: "analyst@landvision.gov.in",
    role: "ANALYST",
    state: "Maharashtra",
    district: "Raigad",
    status: "Active",
    lastLogin: "2026-08-29T14:10:00Z",
  },
];

export const SEED_AUDIT: AuditEntry[] = [
  {
    id: "a1",
    user: "R. K. Nayak",
    role: "DISTRICT_OFFICER",
    action: "Updated compensation disbursement batch",
    entity: "Project",
    entityId: "LV-0001",
    oldValue: "50% (₹321.2 Cr)",
    newValue: "52% (₹334.1 Cr)",
    timestamp: "2026-08-30T10:14:00Z",
    status: "SUCCESS",
  },
  {
    id: "a2",
    user: "Dr. Arvind Mehra, IAS",
    role: "ADMIN",
    action: "Triggered model continuous learning retraining pipeline",
    entity: "ML Model",
    entityId: "v2.4",
    oldValue: "v2.3",
    newValue: "v2.4",
    timestamp: "2026-08-29T15:02:00Z",
    status: "SUCCESS",
  },
  {
    id: "a3",
    user: "S. Patnaik, OAS",
    role: "STATE_OFFICER",
    action: "Created High-Priority Administrative Intervention",
    entity: "Intervention",
    entityId: "IV-000104",
    oldValue: "—",
    newValue: "Convene Lok Adalat for Balianta parcel dispute",
    timestamp: "2026-08-28T12:41:00Z",
    status: "SUCCESS",
  },
];

export const RETRAINING_HISTORY: RetrainingLog[] = [
  {
    id: "rt-4",
    version: "v2.4",
    datasetSize: 1248,
    trainingSamples: 998,
    testSamples: 250,
    accuracy: 94.2,
    precision: 92.8,
    recall: 91.5,
    f1Score: 92.1,
    rocAuc: 0.962,
    trainingDate: "2026-08-26T14:30:00Z",
    status: "Active",
    notes: "Integrated RFCTLARR Section 64 litigation weights and multi-stakeholder responsiveness features.",
  },
  {
    id: "rt-3",
    version: "v2.0",
    datasetSize: 980,
    trainingSamples: 784,
    testSamples: 196,
    accuracy: 91.6,
    precision: 89.4,
    recall: 88.2,
    f1Score: 88.8,
    rocAuc: 0.938,
    trainingDate: "2026-05-18T10:15:00Z",
    status: "Archived",
    notes: "Added stage-wise bottleneck forecasting and cadastral parcel risk overlay.",
  },
  {
    id: "rt-2",
    version: "v1.5",
    datasetSize: 640,
    trainingSamples: 512,
    testSamples: 128,
    accuracy: 88.4,
    precision: 85.9,
    recall: 84.1,
    f1Score: 85.0,
    rocAuc: 0.904,
    trainingDate: "2026-01-12T08:00:00Z",
    status: "Archived",
    notes: "First multi-state calibration across NHAI and Railway corridors.",
  },
  {
    id: "rt-1",
    version: "v1.0",
    datasetSize: 320,
    trainingSamples: 256,
    testSamples: 64,
    accuracy: 83.1,
    precision: 79.5,
    recall: 78.0,
    f1Score: 78.7,
    rocAuc: 0.856,
    trainingDate: "2025-08-10T12:00:00Z",
    status: "Archived",
    notes: "Baseline prototype deterministic scoring model.",
  },
];

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: "GET",
    path: "/api/projects",
    description: "Fetch paginated land acquisition projects with state, district, and risk filters.",
    category: "Projects",
    status: "Implemented",
    params: ["state", "district", "riskCategory", "page", "limit"],
    responseSample: {
      total: 1248,
      page: 1,
      projects: [
        { id: "p1", projectId: "LV-0001", name: "NH-16 6-Lane Expansion Corridor", state: "Odisha", riskScore: 82, delayProbability: 84 },
      ],
    },
  },
  {
    method: "GET",
    path: "/api/projects/{projectId}",
    description: "Retrieve comprehensive details, stages, legal cases, compensation, R&R, and possession metrics.",
    category: "Projects",
    status: "Implemented",
    params: ["projectId"],
    responseSample: {
      projectId: "LV-0001",
      name: "NH-16 6-Lane Expansion Corridor",
      currentStage: "Legal Resolution",
      landArea: 642.5,
      affectedFamilies: 1860,
      params: { legalDisputes: 12, compensationPct: 50, possessionPct: 22 },
    },
  },
  {
    method: "POST",
    path: "/api/predict",
    description: "Calculate delay probability, risk score, bottleneck stage, and AI recommendations for arbitrary parameters.",
    category: "Risk & ML",
    status: "Implemented",
    responseSample: {
      riskScore: 82,
      delayProbability: 84,
      riskCategory: "HIGH",
      expectedDelayMonths: 4.8,
      bottleneckStage: "Legal Resolution",
      topDelayDrivers: [{ factor: "Legal disputes", contribution: 28 }, { factor: "Compensation delay", contribution: 24 }],
      recommendations: [{ title: "Convene Special Lok Adalat", priority: 1 }],
    },
  },
  {
    method: "GET",
    path: "/api/analytics/district",
    description: "Get aggregated risk, compensation, dispute, and delay averages grouped by district.",
    category: "Analytics",
    status: "Implemented",
    params: ["state"],
    responseSample: {
      state: "Odisha",
      districts: [
        { district: "Khordha", totalProjects: 28, highRiskProjects: 9, avgRisk: 68, avgDelayDays: 142 },
      ],
    },
  },
  {
    method: "GET",
    path: "/api/analytics/state",
    description: "National comparative performance across all 12 states.",
    category: "Analytics",
    status: "Implemented",
    responseSample: {
      states: [
        { state: "Odisha", projects: 124, highRisk: 38, avgRisk: 67, compensationPct: 62 },
        { state: "Maharashtra", projects: 186, highRisk: 44, avgRisk: 64, compensationPct: 58 },
      ],
    },
  },
  {
    method: "GET",
    path: "/api/alerts",
    description: "Fetch live threshold breach notifications and early warnings.",
    category: "Alerts",
    status: "Implemented",
    params: ["severity", "status"],
    responseSample: {
      alerts: [
        { id: "AL-1001", projectId: "LV-0001", severity: "Critical", trigger: "Risk threshold crossed (82/100)" },
      ],
    },
  },
  {
    method: "POST",
    path: "/api/interventions",
    description: "Create and assign an official corrective intervention and trigger risk recalculation.",
    category: "Interventions",
    status: "Implemented",
    responseSample: {
      id: "IV-000104",
      action: "Convene Lok Adalat for Balianta dispute",
      assignedTo: "R. K. Nayak",
      previousRisk: 82,
      currentRisk: 69,
      riskReduction: 13,
      status: "In Progress",
    },
  },
  {
    method: "POST",
    path: "/api/gateway/bhoomi-sync",
    description: "Government land records (Bhoomi / Bhulekh) automated sync adapter.",
    category: "Integrations",
    status: "Planned Govt Gateway",
    responseSample: {
      adapter: "National Land Record Modernization Program (NLRMP)",
      status: "Planned - Interface Specification Ready",
      protocol: "REST / OpenID Connect + Digital Signature",
    },
  },
];

export const STATE_LIST = [
  "Odisha",
  "Jharkhand",
  "Chhattisgarh",
  "West Bengal",
  "Bihar",
  "Andhra Pradesh",
  "Maharashtra",
  "Tamil Nadu",
  "Gujarat",
  "Karnataka",
  "Uttar Pradesh",
  "Rajasthan",
];

export const DEMO_LOCATIONS = [
  "Bhubaneswar",
  "Cuttack",
  "Khordha",
  "Puri",
  "Ganjam",
  "Balasore",
];

export const STATE_FIR_OVERVIEW: Record<
  string,
  {
    totalFirs: number;
    openFirs: number;
    closedFirs: number;
    criticalFirs: number;
    avgResolutionDays: number;
    riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    locations: { location: string; count: number }[];
    categories: { category: string; count: number }[];
    trend: { month: string; count: number }[];
  }
> = {
  Odisha: {
    totalFirs: 1284,
    openFirs: 438,
    closedFirs: 846,
    criticalFirs: 72,
    avgResolutionDays: 18.4,
    riskLevel: "HIGH",
    locations: [
      { location: "Bhubaneswar", count: 1240 },
      { location: "Cuttack", count: 982 },
      { location: "Khordha", count: 847 },
      { location: "Puri", count: 731 },
      { location: "Ganjam", count: 654 },
      { location: "Balasore", count: 588 },
    ],
    categories: [
      { category: "Land Compensation Dispute", count: 482 },
      { category: "Title Encroachment & Ownership", count: 310 },
      { category: "R&R Resettlement Clearance", count: 245 },
      { category: "Statutory & Environmental Objection", count: 142 },
      { category: "Possession & Eviction Order", count: 105 },
    ],
    trend: [
      { month: "Jan", count: 88 },
      { month: "Feb", count: 94 },
      { month: "Mar", count: 112 },
      { month: "Apr", count: 105 },
      { month: "May", count: 130 },
      { month: "Jun", count: 145 },
      { month: "Jul", count: 128 },
      { month: "Aug", count: 142 },
    ],
  },
  "West Bengal": {
    totalFirs: 923,
    openFirs: 312,
    closedFirs: 611,
    criticalFirs: 48,
    avgResolutionDays: 21.2,
    riskLevel: "HIGH",
    locations: [
      { location: "Howrah", count: 280 },
      { location: "Hooghly", count: 210 },
      { location: "Bardhaman", count: 175 },
      { location: "Nadia", count: 140 },
      { location: "Purulia", count: 118 },
    ],
    categories: [
      { category: "Land Compensation Dispute", count: 360 },
      { category: "Title Encroachment & Ownership", count: 240 },
      { category: "R&R Resettlement Clearance", count: 180 },
      { category: "Statutory & Environmental Objection", count: 143 },
    ],
    trend: [
      { month: "Jan", count: 65 },
      { month: "Feb", count: 72 },
      { month: "Mar", count: 80 },
      { month: "Apr", count: 75 },
      { month: "May", count: 90 },
      { month: "Jun", count: 110 },
      { month: "Jul", count: 95 },
      { month: "Aug", count: 102 },
    ],
  },
  Jharkhand: {
    totalFirs: 742,
    openFirs: 265,
    closedFirs: 477,
    criticalFirs: 39,
    avgResolutionDays: 24.1,
    riskLevel: "CRITICAL",
    locations: [
      { location: "Ranchi", count: 220 },
      { location: "Dhanbad", count: 180 },
      { location: "Jamshedpur", count: 150 },
      { location: "Bokaro", count: 110 },
      { location: "Hazaribagh", count: 82 },
    ],
    categories: [
      { category: "Tribal Land Rights & CNT Act", count: 290 },
      { category: "Land Compensation Dispute", count: 220 },
      { category: "Forest Clearance Objection", count: 140 },
      { category: "Possession & Eviction Order", count: 92 },
    ],
    trend: [
      { month: "Jan", count: 50 },
      { month: "Feb", count: 58 },
      { month: "Mar", count: 64 },
      { month: "Apr", count: 60 },
      { month: "May", count: 75 },
      { month: "Jun", count: 88 },
      { month: "Jul", count: 78 },
      { month: "Aug", count: 82 },
    ],
  },
  Chhattisgarh: {
    totalFirs: 681,
    openFirs: 219,
    closedFirs: 462,
    criticalFirs: 31,
    avgResolutionDays: 19.8,
    riskLevel: "MEDIUM",
    locations: [
      { location: "Raipur", count: 210 },
      { location: "Bhilai", count: 165 },
      { location: "Korba", count: 140 },
      { location: "Bilaspur", count: 105 },
      { location: "Durg", count: 61 },
    ],
    categories: [
      { category: "Industrial Corridor Land Dispute", count: 240 },
      { category: "Land Compensation Dispute", count: 210 },
      { category: "Forest Rights Act (FRA)", count: 135 },
      { category: "Title Encroachment", count: 96 },
    ],
    trend: [
      { month: "Jan", count: 45 },
      { month: "Feb", count: 52 },
      { month: "Mar", count: 58 },
      { month: "Apr", count: 54 },
      { month: "May", count: 68 },
      { month: "Jun", count: 79 },
      { month: "Jul", count: 70 },
      { month: "Aug", count: 74 },
    ],
  },
  Bihar: {
    totalFirs: 594,
    openFirs: 201,
    closedFirs: 393,
    criticalFirs: 28,
    avgResolutionDays: 26.5,
    riskLevel: "HIGH",
    locations: [
      { location: "Patna", count: 190 },
      { location: "Gaya", count: 130 },
      { location: "Muzaffarpur", count: 110 },
      { location: "Bhagalpur", count: 90 },
      { location: "Darbhanga", count: 74 },
    ],
    categories: [
      { category: "Ancestral Title & Partition", count: 230 },
      { category: "Land Compensation Dispute", count: 180 },
      { category: "Sharecropper Entitlement", count: 110 },
      { category: "Possession Stalled", count: 74 },
    ],
    trend: [
      { month: "Jan", count: 40 },
      { month: "Feb", count: 44 },
      { month: "Mar", count: 50 },
      { month: "Apr", count: 48 },
      { month: "May", count: 60 },
      { month: "Jun", count: 70 },
      { month: "Jul", count: 62 },
      { month: "Aug", count: 68 },
    ],
  },
  "Andhra Pradesh": {
    totalFirs: 840,
    openFirs: 290,
    closedFirs: 550,
    criticalFirs: 41,
    avgResolutionDays: 17.6,
    riskLevel: "MEDIUM",
    locations: [
      { location: "Visakhapatnam", count: 260 },
      { location: "Vijayawada", count: 210 },
      { location: "Guntur", count: 170 },
      { location: "Nellore", count: 120 },
      { location: "Kurnool", count: 80 },
    ],
    categories: [
      { category: "Land Compensation Dispute", count: 310 },
      { category: "Port & Highway Corridor Alignment", count: 230 },
      { category: "Title Encroachment", count: 180 },
      { category: "R&R Resettlement", count: 120 },
    ],
    trend: [
      { month: "Jan", count: 58 },
      { month: "Feb", count: 64 },
      { month: "Mar", count: 72 },
      { month: "Apr", count: 68 },
      { month: "May", count: 82 },
      { month: "Jun", count: 96 },
      { month: "Jul", count: 85 },
      { month: "Aug", count: 90 },
    ],
  },
  Maharashtra: {
    totalFirs: 1420,
    openFirs: 490,
    closedFirs: 930,
    criticalFirs: 85,
    avgResolutionDays: 16.5,
    riskLevel: "HIGH",
    locations: [
      { location: "Pune", count: 420 },
      { location: "Nagpur", count: 320 },
      { location: "Nashik", count: 260 },
      { location: "Thane", count: 240 },
      { location: "Raigad", count: 180 },
    ],
    categories: [
      { category: "Expressway & Metro Land Acquisition", count: 520 },
      { category: "Compensation Quantum Enhancement", count: 410 },
      { category: "MIDC Industrial Land Disagreements", count: 310 },
      { category: "Title & Shareholder Verification", count: 180 },
    ],
    trend: [
      { month: "Jan", count: 95 },
      { month: "Feb", count: 102 },
      { month: "Mar", count: 120 },
      { month: "Apr", count: 115 },
      { month: "May", count: 140 },
      { month: "Jun", count: 165 },
      { month: "Jul", count: 142 },
      { month: "Aug", count: 158 },
    ],
  },
  "Tamil Nadu": {
    totalFirs: 1110,
    openFirs: 370,
    closedFirs: 740,
    criticalFirs: 54,
    avgResolutionDays: 15.8,
    riskLevel: "LOW",
    locations: [
      { location: "Chennai", count: 340 },
      { location: "Coimbatore", count: 260 },
      { location: "Madurai", count: 210 },
      { location: "Salem", count: 170 },
      { location: "Vellore", count: 130 },
    ],
    categories: [
      { category: "SIPCOT Industrial Corridor Disputes", count: 410 },
      { category: "Compensation Disbursement Rate", count: 330 },
      { category: "Title Verification Gaps", count: 220 },
      { category: "Environmental Clearances", count: 150 },
    ],
    trend: [
      { month: "Jan", count: 75 },
      { month: "Feb", count: 82 },
      { month: "Mar", count: 95 },
      { month: "Apr", count: 88 },
      { month: "May", count: 110 },
      { month: "Jun", count: 128 },
      { month: "Jul", count: 112 },
      { month: "Aug", count: 120 },
    ],
  },
};

export function getFirStateAnalysis(state: string) {
  const defaultData = STATE_FIR_OVERVIEW["Odisha"]!;
  const found = STATE_FIR_OVERVIEW[state];
  if (found) return { state, ...found };
  
  return {
    state,
    totalFirs: 650,
    openFirs: 210,
    closedFirs: 440,
    criticalFirs: 32,
    avgResolutionDays: 19.5,
    riskLevel: "MEDIUM" as const,
    locations: [
      { location: `${state} Central`, count: 210 },
      { location: `${state} North`, count: 170 },
      { location: `${state} South`, count: 150 },
      { location: `${state} West`, count: 120 },
    ],
    categories: [
      { category: "Land Compensation Dispute", count: 250 },
      { category: "Title & Ownership Conflict", count: 180 },
      { category: "R&R Resettlement Progress", count: 140 },
      { category: "Statutory Approval Delay", count: 80 },
    ],
    trend: [
      { month: "Jan", count: 45 },
      { month: "Feb", count: 52 },
      { month: "Mar", count: 60 },
      { month: "Apr", count: 56 },
      { month: "May", count: 70 },
      { month: "Jun", count: 82 },
      { month: "Jul", count: 72 },
      { month: "Aug", count: 78 },
    ],
  };
}

