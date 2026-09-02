import type { ProjectType, RiskCategory, Stage } from "./types";

export interface HistoricalAcquisitionRecord {
  id: string;
  state: string;
  district: string;
  projectType: string;
  projectName?: string;
  landRequiredHa: number;
  landRemainingHa: number;
  affectedFamilies: number;
  compensationAmount: number;
  projectCostCr: number;
  legalDispute: "Yes" | "No";
  courtCase: "Yes" | "No";
  environmentalClearance: "Obtained" | "Pending" | "Under Review" | "Not Required";
  forestClearance: "Obtained" | "Pending" | "Under Review" | "Not Required";
  rehabilitationIssue: "Yes" | "No";
  awardDelayDays: number;
  paymentDelayDays: number;
  possessionDelayDays: number;
  delayReason: string;
  isValid?: boolean;
  issues?: string[];
}

export type AcquisitionStageName =
  | "Notification"
  | "Survey"
  | "Valuation"
  | "Award"
  | "Compensation"
  | "Environmental Clearance"
  | "Forest Clearance"
  | "Legal Clearance"
  | "Rehabilitation & Resettlement"
  | "Possession"
  | "Handover";

export type AcquisitionStageStatus =
  | "COMPLETE"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "WAITING"
  | "NOT_STARTED";

export interface StageDetail {
  id: number;
  name: AcquisitionStageName;
  status: AcquisitionStageStatus;
  progressPct: number;
  reason?: string | undefined;
  impact?: string | undefined;
  startedDate: string;
  expectedDate: string;
  currentDelayDays: number;
  delayContributionMonths: number;
  isBottleneck?: boolean | undefined;
  department: string;
  statutoryAct?: string | undefined;
}

export interface PredictionResult {
  projectName: string;
  projectType: string;
  state: string;
  district: string;
  landRequiredHa: number;
  affectedFamilies: number;
  projectCostCr: number;
  originalExpectedCompletion: string;
  predictedCompletionDate: string;
  delayProbabilityPct: number;
  riskScore: number; // 0-100
  riskCategory: RiskCategory;
  expectedDelayMonths: number;
  expectedDelayDays: number;
  financialImpactCr: number | null;
  financialImpactText: string;
  primaryBottleneck: {
    stage: AcquisitionStageName;
    cause: string;
    statusText: string;
    projectImpact: string;
    predictedDelayMonths: number;
    delayDays: number;
    gisCoordinates?: { lat: number; lng: number };
    gisLocationName?: string;
  };
  stages: StageDetail[];
  delayContributions: {
    factor: string;
    months: number;
    category: "Clearance" | "Legal" | "Financial" | "Social" | "Administrative";
  }[];
  explanation: string;
  recommendations: {
    priority: 1 | 2 | 3;
    title: string;
    reason: string;
    action: string;
    expectedImpact: string;
    department: string;
  }[];
  whatIfScenarios: {
    key: string;
    title: string;
    description: string;
    riskReduction: number;
    delayReductionMonths: number;
  }[];
}

export interface DatasetQualityReport {
  totalRecords: number;
  validRecords: number;
  missingValues: number;
  duplicateRecords: number;
  invalidRecords: number;
  qualityScorePct: number;
  statesCount: number;
  districtsCount: number;
  projectsCount: number;
  featuresCount: number;
  issuesSummary: { field: string; issue: string; count: number }[];
}

export const SAMPLE_CSV_DATA = `State,District,Project_Type,Land_Required_Hectare,Land_Remaining_Hectare,Affected_Families,Compensation_Amount,Project_Cost,Legal_Dispute,Court_Case,Environmental_Clearance,Forest_Clearance,Rehabilitation_Issue,Award_Delay,Payment_Delay,Possession_Delay,Delay_Reason
Odisha,Khordha,National Highway,1250.00,420.00,420,1200201446,420.00,No,No,Obtained,Pending,No,168,53,309,Forest Clearance / diversion approval pending; Project alignment intersects protected forest reserve land
Andhra Pradesh,Anantapur,Irrigation/Dam,513.34,400.4,2862,3541682357,4192.52,No,No,Not Required,Obtained,No,7,23,118,No major delay — acquisition on schedule
Andhra Pradesh,Chittoor,Power Plant,406.76,316.77,1864,5647015286,5386.86,Yes,Yes,Not Required,Obtained,No,714,108,888,Landowners disputing compensation valuation; Stay order from High Court on land handover
Andhra Pradesh,East Godavari,State Highway,128.61,4.4,819,564727152,234.96,No,No,Pending,Not Required,No,137,31,330,Environmental Clearance approval pending
Andhra Pradesh,Guntur,SEZ,443.87,60.58,4456,17463816981,17338.47,No,No,Obtained,Obtained,Yes,20,238,71,Delay in providing alternate housing/livelihood support; Fund release delay from state/central treasury
Andhra Pradesh,Krishna,SEZ,225.99,65.87,1523,2824799574,1557.62,Yes,No,Pending,Pending,Yes,250,167,486,Objections raised during Social Impact Assessment; Forest Clearance pending
Assam,Baksa,Mining Project,709.48,240.84,8044,15385835725,11994.54,Yes,Yes,Not Required,Not Required,No,435,56,525,Landowners disputing compensation valuation; Writ petition challenging acquisition notification
Bihar,Jamui,Airport,97.76,74.66,242,1084860584,476.63,Yes,Yes,Obtained,Pending,No,713,138,927,Ownership dispute; Stay order from High Court; Forest Clearance pending
Chhattisgarh,Janjgir-Champa,National Highway,650.14,487.29,7860,17466918211,11390.72,Yes,Yes,Obtained,Under Review,No,556,121,685,Landowners disputing compensation valuation; Stay order from High Court; Forest Clearance pending
Gujarat,Bharuch,Railway Line,605.02,61.4,1853,4032760810,4615.57,Yes,Yes,Obtained,Pending,No,586,137,662,Objections during Social Impact Assessment; Stay order from High Court; Forest Clearance pending
Haryana,Mewat,Railway Line,735.35,241.1,7895,12753426114,7477.17,Yes,Yes,Obtained,Pending,No,588,98,804,Writ petition challenging acquisition notification; Forest Clearance pending
Karnataka,Ballari (Bellary),Power Plant,326.66,68.8,3129,14011554570,17923.83,Yes,No,Pending,Pending,No,687,91,946,Farmers refusing consent; Environmental and Forest Clearance pending
Kerala,Palakkad,National Highway,658.58,329.31,8190,17783266163,6270.77,No,No,Obtained,Pending,No,42,137,315,Forest Clearance / diversion approval pending; Local protests
Madhya Pradesh,Chhindwara,Port Development,793.48,382.49,3688,9658284808,9359.6,Yes,Yes,Obtained,Under Review,No,722,101,792,Landowners disputing compensation valuation; Stay order from High Court
Maharashtra,Dhule,National Highway,599.4,72.18,8435,24987218399,26452.28,Yes,Yes,Obtained,Pending,Yes,714,226,792,Objections during SIA; Stay order from High Court; Forest Clearance pending
Rajasthan,Chittorgarh,Port Development,528.64,348.49,6916,30070110566,26552.22,Yes,No,Obtained,Pending,No,416,93,759,Farmers refusing consent; Forest Clearance pending
Tamil Nadu,Cuddalore,Airport,598.89,189.7,7983,5960018125,5609.87,Yes,Yes,Obtained,Pending,No,673,124,828,Farmers refusing consent; Stay order from High Court; Forest Clearance pending
Telangana,Komaram Bheem Asifabad,State Highway,266.12,18.31,994,4148441784,4275.15,Yes,Yes,Obtained,Pending,No,500,100,775,Ownership dispute; Forest Clearance pending; Local protests
Uttar Pradesh,Farrukhabad,Industrial Corridor,695.86,401.11,7717,28732068570,21322.52,No,No,Pending,Pending,No,48,0,374,Environmental Clearance pending; Forest Clearance pending
West Bengal,Cooch Behar,SEZ,502.63,397.92,3328,11208710803,7124.57,Yes,Yes,Pending,Not Required,No,597,27,949,Ownership dispute; Stay order from High Court; Environmental Clearance pending`;

export function parseAndValidateCsv(csvText: string): {
  records: HistoricalAcquisitionRecord[];
  report: DatasetQualityReport;
} {
  const lines = csvText.trim().split("\n").filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    return {
      records: [],
      report: {
        totalRecords: 0,
        validRecords: 0,
        missingValues: 0,
        duplicateRecords: 0,
        invalidRecords: 0,
        qualityScorePct: 0,
        statesCount: 0,
        districtsCount: 0,
        projectsCount: 0,
        featuresCount: 0,
        issuesSummary: [],
      },
    };
  }

  const firstLine = lines[0] ?? "";
  const header = firstLine.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const records: HistoricalAcquisitionRecord[] = [];
  const seenKeys = new Set<string>();
  const statesSet = new Set<string>();
  const districtsSet = new Set<string>();
  let duplicateCount = 0;
  let missingValCount = 0;
  let invalidRecordCount = 0;
  const issuesMap: Record<string, number> = {};

  let recordIdx = 0;
  for (const rawLine of lines.slice(1)) {
    if (!rawLine) continue;
    recordIdx++;
    // Simple CSV parser handling quotes
    const cols: string[] = [];
    let inQuotes = false;
    let current = "";
    for (let charIdx = 0; charIdx < rawLine.length; charIdx++) {
      const c = rawLine[charIdx];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === "," && !inQuotes) {
        cols.push(current.trim());
        current = "";
      } else {
        current += c;
      }
    }
    cols.push(current.trim());

    const state = cols[0] ?? "";
    const district = cols[1] ?? "";
    const pType = cols[2] ?? "National Highway";
    const landReq = parseFloat(cols[3] ?? "0") || 0;
    const landRem = parseFloat(cols[4] ?? "0") || 0;
    const families = parseInt(cols[5] ?? "0", 10) || 0;
    const compAmount = parseFloat(cols[6] ?? "0") || 0;
    const pCost = parseFloat(cols[7] ?? "0") || 0;
    const legalDispute = cols[8] === "Yes" ? "Yes" : "No";
    const courtCase = cols[9] === "Yes" ? "Yes" : "No";
    const envClearance = (cols[10] as any) || "Obtained";
    const forClearance = (cols[11] as any) || "Obtained";
    const rrIssue = cols[12] === "Yes" ? "Yes" : "No";
    const awardDelay = parseInt(cols[13] ?? "0", 10) || 0;
    const payDelay = parseInt(cols[14] ?? "0", 10) || 0;
    const possDelay = parseInt(cols[15] ?? "0", 10) || 0;
    const delayReason = cols[16] ?? "Normal acquisition cycle";

    const recordIssues: string[] = [];
    if (!state) {
      recordIssues.push("Missing state");
      missingValCount++;
      issuesMap["State"] = (issuesMap["State"] || 0) + 1;
    }
    if (!district) {
      recordIssues.push("Missing district");
      missingValCount++;
      issuesMap["District"] = (issuesMap["District"] || 0) + 1;
    }
    if (landReq <= 0) {
      recordIssues.push("Invalid land required value");
      invalidRecordCount++;
      issuesMap["Land Area"] = (issuesMap["Land Area"] || 0) + 1;
    }
    if (families < 0) {
      recordIssues.push("Negative affected families");
      invalidRecordCount++;
      issuesMap["Affected Families"] = (issuesMap["Affected Families"] || 0) + 1;
    }

    const dupKey = `${state}_${district}_${pType}_${landReq}`;
    if (seenKeys.has(dupKey)) {
      duplicateCount++;
      recordIssues.push("Duplicate record detected");
      issuesMap["Duplicate Row"] = (issuesMap["Duplicate Row"] || 0) + 1;
    } else {
      seenKeys.add(dupKey);
    }

    if (state) statesSet.add(state);
    if (district) districtsSet.add(district);

    records.push({
      id: `REC-${1000 + recordIdx}`,
      state,
      district,
      projectType: pType,
      projectName: `${pType} Corridor (${district})`,
      landRequiredHa: landReq,
      landRemainingHa: landRem,
      affectedFamilies: families,
      compensationAmount: compAmount,
      projectCostCr: pCost,
      legalDispute,
      courtCase,
      environmentalClearance: envClearance,
      forestClearance: forClearance,
      rehabilitationIssue: rrIssue,
      awardDelayDays: awardDelay,
      paymentDelayDays: payDelay,
      possessionDelayDays: possDelay,
      delayReason,
      isValid: recordIssues.length === 0,
      issues: recordIssues,
    });
  }

  const total = records.length;
  const valid = records.filter((r) => r.isValid).length;
  const qualityScore = total > 0 ? Math.round((valid / total) * 100) : 0;

  const issuesSummary = Object.entries(issuesMap).map(([field, count]) => ({
    field,
    issue: `Quality defect in ${field}`,
    count,
  }));

  return {
    records,
    report: {
      totalRecords: total,
      validRecords: valid,
      missingValues: missingValCount,
      duplicateRecords: duplicateCount,
      invalidRecords: invalidRecordCount,
      qualityScorePct: qualityScore,
      statesCount: statesSet.size,
      districtsCount: districtsSet.size,
      projectsCount: total,
      featuresCount: 24,
      issuesSummary,
    },
  };
}

export function computeNationalHighwayDemo(): PredictionResult {
  const originalDate = "2026-08-15";
  const predictedDate = "2027-01-05"; // ~4.7 months delay

  const stages: StageDetail[] = [
    {
      id: 1,
      name: "Notification",
      status: "COMPLETE",
      progressPct: 100,
      startedDate: "2025-01-10",
      expectedDate: "2025-03-15",
      currentDelayDays: 0,
      delayContributionMonths: 0,
      department: "Revenue & Land Reforms",
      statutoryAct: "RFCTLARR Act Sec 11(1)",
    },
    {
      id: 2,
      name: "Survey",
      status: "COMPLETE",
      progressPct: 100,
      startedDate: "2025-03-20",
      expectedDate: "2025-06-10",
      currentDelayDays: 0,
      delayContributionMonths: 0,
      department: "Survey & Land Records (DGPS/Drone)",
      statutoryAct: "RFCTLARR Act Sec 12",
    },
    {
      id: 3,
      name: "Valuation",
      status: "COMPLETE",
      progressPct: 100,
      startedDate: "2025-06-15",
      expectedDate: "2025-08-30",
      currentDelayDays: 0,
      delayContributionMonths: 0,
      department: "District Valuation Committee",
      statutoryAct: "RFCTLARR Act Sec 26",
    },
    {
      id: 4,
      name: "Award",
      status: "COMPLETE",
      progressPct: 100,
      startedDate: "2025-09-05",
      expectedDate: "2025-11-20",
      currentDelayDays: 0,
      delayContributionMonths: 0,
      department: "Competent Authority for Land Acquisition (CALA)",
      statutoryAct: "RFCTLARR Act Sec 30",
    },
    {
      id: 5,
      name: "Compensation",
      status: "COMPLETE",
      progressPct: 100,
      startedDate: "2025-12-01",
      expectedDate: "2026-02-28",
      currentDelayDays: 15,
      delayContributionMonths: 0.5,
      department: "Treasury / PFMS Direct Benefit Transfer",
      statutoryAct: "RFCTLARR Act Sec 77",
    },
    {
      id: 6,
      name: "Environmental Clearance",
      status: "COMPLETE",
      progressPct: 100,
      startedDate: "2025-02-15",
      expectedDate: "2025-09-10",
      currentDelayDays: 0,
      delayContributionMonths: 0,
      department: "State Environmental Impact Assessment Authority (SEIAA)",
      statutoryAct: "EIA Notification 2006",
    },
    {
      id: 7,
      name: "Forest Clearance",
      status: "BLOCKED",
      progressPct: 35,
      reason:
        "The proposed National Highway alignment intersects protected forest reserve land (Chandaka-Dampara ecological zone).",
      impact:
        "Possession of the 42 km highway stretch cannot proceed until Stage-II Forest Conservation Act clearance is granted by MoEFCC.",
      startedDate: "2026-06-12",
      expectedDate: "2026-08-18",
      currentDelayDays: 98,
      delayContributionMonths: 3.4,
      isBottleneck: true,
      department: "Ministry of Environment, Forest & Climate Change (MoEFCC)",
      statutoryAct: "Forest (Conservation) Act, 1980 Sec 2",
    },
    {
      id: 8,
      name: "Legal Clearance",
      status: "COMPLETE",
      progressPct: 100,
      startedDate: "2025-10-01",
      expectedDate: "2026-01-15",
      currentDelayDays: 24,
      delayContributionMonths: 0.8,
      department: "District Legal Services Authority / High Court",
      statutoryAct: "High Court Disposal Order",
    },
    {
      id: 9,
      name: "Rehabilitation & Resettlement",
      status: "IN_PROGRESS",
      progressPct: 62,
      reason: "Alternative housing allotment for 140 families ongoing in Balianta transit colony.",
      impact: "Partial hindrance in urban section clearance.",
      startedDate: "2026-02-01",
      expectedDate: "2026-09-30",
      currentDelayDays: 12,
      delayContributionMonths: 0.4,
      department: "R&R Commissioner, State Revenue Dept",
      statutoryAct: "RFCTLARR Act Chapter V",
    },
    {
      id: 10,
      name: "Possession",
      status: "WAITING",
      progressPct: 18,
      reason: "Waiting for physical forest handover from State Forest Department.",
      impact: "Construction contractor cannot deploy machinery on Chainage 24+000 to 66+000.",
      startedDate: "2026-08-01",
      expectedDate: "2026-11-30",
      currentDelayDays: 0,
      delayContributionMonths: 0,
      department: "CALA & Executive Engineer (NHAI)",
      statutoryAct: "RFCTLARR Act Sec 38",
    },
    {
      id: 11,
      name: "Handover",
      status: "NOT_STARTED",
      progressPct: 0,
      startedDate: "2026-12-01",
      expectedDate: "2027-01-15",
      currentDelayDays: 0,
      delayContributionMonths: 0,
      department: "National Highways Authority of India (NHAI)",
      statutoryAct: "Final Project Handover Protocol",
    },
  ];

  const projectCostCr = 420.0;
  const expectedDelayMonths = 4.7;
  // Transparent deterministic financial carrying cost: 8.5% p.a. capital escalation
  const financialImpactCr = Math.round((projectCostCr * (expectedDelayMonths / 12) * 0.085 + 16.8) * 10) / 10;

  return {
    projectName: "NH-16 6-Lane Expansion Corridor",
    projectType: "National Highway",
    state: "Odisha",
    district: "Khordha",
    landRequiredHa: 1250.0,
    affectedFamilies: 420,
    projectCostCr,
    originalExpectedCompletion: originalDate,
    predictedCompletionDate: predictedDate,
    delayProbabilityPct: 82,
    riskScore: 82,
    riskCategory: "CRITICAL",
    expectedDelayMonths: 4.7,
    expectedDelayDays: 142,
    financialImpactCr,
    financialImpactText: `₹${financialImpactCr} Crore`,
    primaryBottleneck: {
      stage: "Forest Clearance",
      cause: "Highway alignment crosses 14.8 ha of Reserve Forest land in Chandaka Corridor.",
      statusText: "Blocked (Stage-II MoEFCC Review Pending)",
      projectImpact: "Physical possession delayed for 42 km crucial stretch.",
      predictedDelayMonths: 3.4,
      delayDays: 104,
      gisCoordinates: { lat: 20.328, lng: 85.819 },
      gisLocationName: "Chandaka Reserve Forest Buffer Zone, Khordha (Odisha)",
    },
    stages,
    delayContributions: [
      { factor: "Forest Clearance", months: 3.2, category: "Clearance" },
      { factor: "Legal Dispute", months: 0.8, category: "Legal" },
      { factor: "Compensation", months: 0.5, category: "Financial" },
      { factor: "R&R", months: 0.4, category: "Social" },
      { factor: "Documentation", months: -0.2, category: "Administrative" },
    ],
    explanation:
      "The project has completed the primary land acquisition documentation and compensation stages. The major bottleneck is forest clearance because the proposed highway alignment intersects forest land. Until clearance is obtained, possession and subsequent construction activities may be delayed.",
    recommendations: [
      {
        priority: 1,
        title: "Initiate / Expedite Forest Clearance Review",
        reason: "Stage-II tree felling & non-forestry diversion clearance is stalled at Regional MoEFCC desk.",
        action:
          "Submit verified Compensatory Afforestation (CA) parcel ledger to Regional Empowered Committee (REC) Bhubaneshwar.",
        expectedImpact: "Reduce projected delay by approximately 3.0 to 3.4 months.",
        department: "State Forest Dept & NHAI Forest Cell",
      },
      {
        priority: 2,
        title: "Coordinate with the Forest Department regarding the Affected Alignment",
        reason: "Joint boundary demarcation with DFO Khordha pending for 3 reserve forest boundary stones.",
        action: "Schedule emergency District Level Co-ordination Committee (DLCC) meeting chaired by District Collector.",
        expectedImpact: "Resolve ground boundary disputes within 14 days.",
        department: "District Administration & DFO",
      },
      {
        priority: 3,
        title: "Evaluate Alternative Alignment if Clearance Remains Unresolved",
        reason: "Bypassing 3.2 km ecotourism zone could eliminate forest land acquisition requirement altogether.",
        action: "Direct EPC contractor design team to run micro-alignment simulation on GIS contour layer.",
        expectedImpact: "Alternative bypass safeguards project timeline if statutory clearance exceeds 60 days.",
        department: "NHAI Technical & Design Wing",
      },
    ],
    whatIfScenarios: [
      {
        key: "forest",
        title: "Resolve Forest Clearance",
        description: "Expedite Stage-II MoEFCC approval & CA land handover.",
        riskReduction: 31,
        delayReductionMonths: 2.9,
      },
      {
        key: "legal",
        title: "Resolve Legal Dispute",
        description: "Settle remaining valuation writ petitions through Lok Adalat.",
        riskReduction: 12,
        delayReductionMonths: 0.8,
      },
      {
        key: "compensation",
        title: "Complete Compensation",
        description: "Disburse 100% compensation awards to remaining 38 disputed titleholders.",
        riskReduction: 8,
        delayReductionMonths: 0.5,
      },
      {
        key: "rr",
        title: "Complete R&R",
        description: "Handover all 140 transit rehabilitation plots in Balianta.",
        riskReduction: 6,
        delayReductionMonths: 0.4,
      },
      {
        key: "possession",
        title: "Increase Possession Progress",
        description: "Deploy physical boundary fencing on cleared packages.",
        riskReduction: 5,
        delayReductionMonths: 0.3,
      },
    ],
  };
}

export function computeCustomProjectPrediction(params: {
  projectName: string;
  projectType: string;
  state: string;
  district: string;
  landRequiredHa: number;
  affectedFamilies: number;
  projectCostCr?: number;
  hasForestIssue?: boolean;
  hasLegalIssue?: boolean;
  hasEnvIssue?: boolean;
  compensationProgressPct?: number;
  possessionProgressPct?: number;
}): PredictionResult {
  const hasForest = params.hasForestIssue ?? false;
  const hasLegal = params.hasLegalIssue ?? false;
  const hasEnv = params.hasEnvIssue ?? false;
  const compPct = params.compensationProgressPct ?? 85;
  const possPct = params.possessionProgressPct ?? 40;

  let baseRisk = 25;
  let delayMonths = 0.5;

  if (hasForest) {
    baseRisk += 40;
    delayMonths += 3.2;
  }
  if (hasLegal) {
    baseRisk += 18;
    delayMonths += 1.1;
  }
  if (hasEnv) {
    baseRisk += 15;
    delayMonths += 0.9;
  }
  if (compPct < 60) {
    baseRisk += 12;
    delayMonths += 0.8;
  }
  if (possPct < 30) {
    baseRisk += 8;
    delayMonths += 0.4;
  }

  const finalRisk = Math.min(95, Math.max(12, baseRisk));
  const roundedDelay = Math.round(delayMonths * 10) / 10;
  const delayDays = Math.round(roundedDelay * 30.4);

  const now = new Date();
  const originalComp = new Date(now.getTime() + 180 * 86400000);
  const predictedComp = new Date(originalComp.getTime() + delayDays * 86400000);

  const primaryStageName: AcquisitionStageName = hasForest
    ? "Forest Clearance"
    : hasLegal
    ? "Legal Clearance"
    : hasEnv
    ? "Environmental Clearance"
    : compPct < 70
    ? "Compensation"
    : "Possession";

  const cost = params.projectCostCr && params.projectCostCr > 0 ? params.projectCostCr : null;
  const finImpact = cost ? Math.round((cost * (roundedDelay / 12) * 0.085 + cost * 0.02) * 10) / 10 : null;

  const stages: StageDetail[] = [
    {
      id: 1,
      name: "Notification",
      status: "COMPLETE",
      progressPct: 100,
      startedDate: "2025-02-01",
      expectedDate: "2025-04-15",
      currentDelayDays: 0,
      delayContributionMonths: 0,
      department: "Revenue & Land Reforms",
    },
    {
      id: 2,
      name: "Survey",
      status: "COMPLETE",
      progressPct: 100,
      startedDate: "2025-04-20",
      expectedDate: "2025-07-10",
      currentDelayDays: 0,
      delayContributionMonths: 0,
      department: "Survey & Land Records",
    },
    {
      id: 3,
      name: "Valuation",
      status: "COMPLETE",
      progressPct: 100,
      startedDate: "2025-07-15",
      expectedDate: "2025-09-30",
      currentDelayDays: 0,
      delayContributionMonths: 0,
      department: "District Valuation Committee",
    },
    {
      id: 4,
      name: "Award",
      status: compPct > 50 ? "COMPLETE" : "IN_PROGRESS",
      progressPct: compPct > 50 ? 100 : 70,
      startedDate: "2025-10-05",
      expectedDate: "2025-12-20",
      currentDelayDays: compPct > 50 ? 0 : 25,
      delayContributionMonths: compPct > 50 ? 0 : 0.4,
      department: "CALA Office",
    },
    {
      id: 5,
      name: "Compensation",
      status: compPct >= 95 ? "COMPLETE" : compPct > 40 ? "IN_PROGRESS" : "BLOCKED",
      progressPct: compPct,
      startedDate: "2026-01-01",
      expectedDate: "2026-04-30",
      currentDelayDays: compPct < 70 ? 45 : 10,
      delayContributionMonths: compPct < 70 ? 0.8 : 0.2,
      department: "Treasury / PFMS",
    },
    {
      id: 6,
      name: "Environmental Clearance",
      status: hasEnv ? "BLOCKED" : "COMPLETE",
      progressPct: hasEnv ? 40 : 100,
      reason: hasEnv ? "Public hearing compliance report pending" : undefined,
      startedDate: "2025-05-10",
      expectedDate: "2025-11-20",
      currentDelayDays: hasEnv ? 60 : 0,
      delayContributionMonths: hasEnv ? 0.9 : 0,
      department: "SEIAA / MoEFCC",
    },
    {
      id: 7,
      name: "Forest Clearance",
      status: hasForest ? "BLOCKED" : "COMPLETE",
      progressPct: hasForest ? 30 : 100,
      reason: hasForest ? "Project alignment crosses designated forest patch." : undefined,
      impact: hasForest ? "Possession delayed pending Stage-II Forest diversion sanction." : undefined,
      startedDate: "2026-01-15",
      expectedDate: "2026-06-30",
      currentDelayDays: hasForest ? 95 : 0,
      delayContributionMonths: hasForest ? 3.2 : 0,
      isBottleneck: hasForest,
      department: "State Forest Dept & MoEFCC",
    },
    {
      id: 8,
      name: "Legal Clearance",
      status: hasLegal ? "BLOCKED" : "COMPLETE",
      progressPct: hasLegal ? 45 : 100,
      reason: hasLegal ? "Pending writ petition challenging compensation quantum." : undefined,
      startedDate: "2025-11-01",
      expectedDate: "2026-03-15",
      currentDelayDays: hasLegal ? 70 : 0,
      delayContributionMonths: hasLegal ? 1.1 : 0,
      department: "High Court / Revenue Court",
    },
    {
      id: 9,
      name: "Rehabilitation & Resettlement",
      status: "IN_PROGRESS",
      progressPct: 55,
      startedDate: "2026-02-01",
      expectedDate: "2026-08-30",
      currentDelayDays: 15,
      delayContributionMonths: 0.3,
      department: "R&R Authority",
    },
    {
      id: 10,
      name: "Possession",
      status: possPct >= 90 ? "COMPLETE" : possPct > 20 ? "IN_PROGRESS" : "WAITING",
      progressPct: possPct,
      startedDate: "2026-05-01",
      expectedDate: "2026-10-31",
      currentDelayDays: 0,
      delayContributionMonths: 0,
      department: "CALA & Executing Agency",
    },
    {
      id: 11,
      name: "Handover",
      status: "NOT_STARTED",
      progressPct: 0,
      startedDate: "2026-11-01",
      expectedDate: "2026-12-31",
      currentDelayDays: 0,
      delayContributionMonths: 0,
      department: "Project Authority",
    },
  ];

  return {
    projectName: params.projectName,
    projectType: params.projectType,
    state: params.state,
    district: params.district,
    landRequiredHa: params.landRequiredHa,
    affectedFamilies: params.affectedFamilies,
    projectCostCr: cost || 0,
    originalExpectedCompletion: originalComp.toISOString().slice(0, 10),
    predictedCompletionDate: predictedComp.toISOString().slice(0, 10),
    delayProbabilityPct: finalRisk,
    riskScore: finalRisk,
    riskCategory: finalRisk >= 80 ? "CRITICAL" : finalRisk >= 60 ? "HIGH" : finalRisk >= 35 ? "MEDIUM" : "LOW",
    expectedDelayMonths: roundedDelay,
    expectedDelayDays: delayDays,
    financialImpactCr: finImpact,
    financialImpactText: finImpact ? `₹${finImpact} Crore` : "Insufficient data",
    primaryBottleneck: {
      stage: primaryStageName,
      cause: hasForest
        ? "Alignment intersects forest land requiring Stage-II statutory diversion clearance."
        : hasLegal
        ? "Litigation / court stay restraining physical possession."
        : hasEnv
        ? "Statutory environmental conditions compliance under review."
        : "Compensation disbursal pending to affected landowners.",
      statusText: `Blocked at ${primaryStageName}`,
      projectImpact: "Possession and construction start deferred.",
      predictedDelayMonths: roundedDelay > 0.5 ? Math.round((roundedDelay * 0.7) * 10) / 10 : 0.4,
      delayDays: Math.round(delayDays * 0.7),
      gisCoordinates: { lat: 20.296, lng: 85.824 },
      gisLocationName: `${params.district}, ${params.state}`,
    },
    stages,
    delayContributions: [
      { factor: "Primary Clearance / Bottleneck", months: Math.round(roundedDelay * 0.65 * 10) / 10, category: "Clearance" },
      { factor: "Litigation & Title Disputes", months: hasLegal ? 1.1 : 0.2, category: "Legal" },
      { factor: "Disbursement & Banking", months: compPct < 80 ? 0.6 : 0.1, category: "Financial" },
      { factor: "R&R Resettlement Colony", months: 0.3, category: "Social" },
      { factor: "Documentation Efficiency", months: -0.2, category: "Administrative" },
    ],
    explanation: `Analysis of ${params.projectName} (${params.projectType}, ${params.district}, ${params.state}) indicates delay risk of ${finalRisk}%. The primary bottleneck is ${primaryStageName}. ${
      hasForest
        ? "The alignment crosses forest land requiring Stage-II MoEFCC clearance before handover."
        : "Administrative and legal hurdles require proactive resolution to minimize project delay."
    }`,
    recommendations: [
      {
        priority: 1,
        title: `Expedite Resolution for ${primaryStageName}`,
        reason: `Stage '${primaryStageName}' accounts for over 65% of the total estimated delay.`,
        action: "Convene inter-departmental task force with CALA, Collector, and line department heads.",
        expectedImpact: `Mitigate up to ${Math.round(roundedDelay * 0.6 * 10) / 10} months of project delay.`,
        department: "District Administration & Line Ministry",
      },
      {
        priority: 2,
        title: "Accelerate Direct Benefit Transfer Disbursement",
        reason: "Landowner satisfaction and voluntary handover increases substantially upon 100% award payment.",
        action: "Deploy village revenue camps for Aadhaar-linked bank mandate verification.",
        expectedImpact: "Eliminate disbursement bottlenecks within 21 days.",
        department: "Revenue / CALA",
      },
      {
        priority: 3,
        title: "Spatial Buffer Alignment Review on GIS",
        reason: "Minor route deviation of 200-400m can avoid environmentally sensitive or disputed parcels.",
        action: "Export alignment shapefile to GIS Risk Intelligence portal and verify avoidance buffer.",
        expectedImpact: "Prevent secondary court stays or wildlife tribunal delays.",
        department: "GIS Engineering Cell",
      },
    ],
    whatIfScenarios: [
      {
        key: "primary",
        title: `Resolve ${primaryStageName}`,
        description: `Clear all pending statutory objections on ${primaryStageName}.`,
        riskReduction: Math.round(finalRisk * 0.42),
        delayReductionMonths: Math.round(roundedDelay * 0.62 * 10) / 10,
      },
      {
        key: "comp",
        title: "Complete 100% Compensation",
        description: "Release pending funds and verify beneficiary bank accounts.",
        riskReduction: 12,
        delayReductionMonths: 0.6,
      },
      {
        key: "legal",
        title: "Fast-Track Legal Lok Adalat",
        description: "Offer pre-settlement consent packages for pending court challenges.",
        riskReduction: 14,
        delayReductionMonths: 0.8,
      },
      {
        key: "rr",
        title: "Finalize R&R Colony Sites",
        description: "Provide civic amenities and physical handover of alternate house sites.",
        riskReduction: 8,
        delayReductionMonths: 0.4,
      },
    ],
  };
}
