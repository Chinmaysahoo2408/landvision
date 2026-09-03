import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  Download,
  ExternalLink,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Layers,
  Loader2,
  MapPin,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
  Panel,
  PanelTitle,
  PageHeader,
  StatCard,
} from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";
import { overallProgress } from "@/lib/lv/risk";
import {
  DEMO_LOCATIONS,
  getFirStateAnalysis,
  STATE_LIST,
} from "@/lib/lv/data";
import type {
  FirRecord,
  FirUploadValidation,
  Prediction,
  Project,
  RiskCategory,
} from "@/lib/lv/types";

export const Route = createFileRoute("/app/data")({
  head: () => ({
    meta: [
      { title: "State-wise FIR Analysis & Data Upload — LandVision AI" },
      {
        name: "description",
        content:
          "State-wise FIR intelligence, dataset upload (CSV/XLSX/JSON), location auto-detection, validation, and AI pipeline workflow.",
      },
      { property: "og:title", content: "FIR Analytics & Upload — LandVision AI" },
      {
        property: "og:description",
        content: "State-wise FIR analysis system with dataset upload and AI training workflow.",
      },
    ],
  }),
  component: DataPage,
});

const CAT_COLORS: Record<RiskCategory, string> = {
  LOW: "var(--risk-low)",
  MEDIUM: "var(--risk-medium)",
  HIGH: "var(--risk-high)",
  CRITICAL: "var(--risk-critical)",
};

const AXIS = { stroke: "var(--muted-foreground)", fontSize: 11 } as const;
const TOOLTIP = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
} as const;

const PAGE = 25;

type SortKey =
  | "projectId"
  | "name"
  | "district"
  | "landArea"
  | "compensationPct"
  | "rrPct"
  | "legalDisputes"
  | "riskScore"
  | "createdAt";

type Row = { p: Project; pr: Prediction };

const HEADERS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "projectId", label: "Parcel / project ID" },
  { key: "name", label: "Project" },
  { key: "district", label: "District" },
  { key: "landArea", label: "Land (ha)", numeric: true },
  { key: "compensationPct", label: "Compensation", numeric: true },
  { key: "rrPct", label: "R&R", numeric: true },
  { key: "legalDisputes", label: "Legal", numeric: true },
  { key: "riskScore", label: "Risk", numeric: true },
  { key: "createdAt", label: "Last updated", numeric: true },
];

const PIPELINE_STEPS = [
  { id: "s1", name: "Data Upload", detail: "Dataset uploaded successfully", status: "completed" },
  { id: "s2", name: "Validation", detail: "Schema and missing value checks passed", status: "completed" },
  { id: "s3", name: "Data Cleaning", detail: "Deduplication & date standardization completed", status: "completed" },
  { id: "s4", name: "Location Detection", detail: "6 core locations identified", status: "completed" },
  { id: "s5", name: "Feature Extraction", detail: "14 risk features generated", status: "active" },
  { id: "s6", name: "Model Training", detail: "XGBoost & Random Forest model training", status: "pending" },
  { id: "s7", name: "Model Evaluation", detail: "Accuracy & ROC-AUC evaluation", status: "pending" },
  { id: "s8", name: "Report Generation", detail: "Executive PDF & risk summary ready", status: "pending" },
];

function valueFor(row: Row, key: SortKey): string | number {
  switch (key) {
    case "projectId":
      return row.p.projectId;
    case "name":
      return row.p.name;
    case "district":
      return row.p.district;
    case "landArea":
      return row.p.landArea;
    case "compensationPct":
      return row.p.params.compensationPct;
    case "rrPct":
      return row.p.params.rrPct;
    case "legalDisputes":
      return row.p.params.legalDisputes;
    case "riskScore":
      return row.pr.riskScore;
    case "createdAt":
      return new Date(row.p.createdAt).getTime();
  }
}

function DataPage() {
  const { visibleProjects, predictions, selectedState, setSelectedState } = useLV();
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("riskScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(0);

  // Upload & Pipeline state
  const [dragActive, setDragActive] = useState(false);
  const [uploadFile, setUploadFile] = useState<string | null>(null);
  const [validation, setValidation] = useState<FirUploadValidation | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(4);

  // Get state FIR analysis
  const stateAnalysis = useMemo(
    () => getFirStateAnalysis(selectedState),
    [selectedState],
  );

  const handleFileUpload = (fileName: string) => {
    setUploadFile(fileName);
    setValidation({
      totalRecords: 5842,
      requiredColumnsFound: true,
      missingLocationsCount: 32,
      duplicatesCount: 7,
      invalidDatesCount: 0,
      detectedLocations: DEMO_LOCATIONS,
      detectedStates: [selectedState, "Maharashtra", "Jharkhand", "Chhattisgarh"],
      isValid: true,
    });
    toast.success(`Dataset "${fileName}" loaded and validated successfully!`);
  };

  const startAiPipeline = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setActiveStepIndex(4);
    toast.info("Starting AI Model Training & Data Pipeline...");

    let step = 4;
    const interval = setInterval(() => {
      step += 1;
      setActiveStepIndex(step);
      setPipelineProgress(Math.round((step / PIPELINE_STEPS.length) * 100));
      if (step >= PIPELINE_STEPS.length - 1) {
        clearInterval(interval);
        setIsProcessing(false);
        toast.success("AI Training Pipeline & Report Generation Completed!");
      }
    }, 1200);
  };


  const districts = useMemo(
    () => [...new Set(visibleProjects.map((p) => p.district))].sort(),
    [visibleProjects],
  );
  const types = useMemo(
    () => [...new Set(visibleProjects.map((p) => p.type))].sort(),
    [visibleProjects],
  );

  const rows = useMemo<Row[]>(() => {
    const q = query.toLowerCase().trim();
    const filtered = visibleProjects
      .map((p) => ({ p, pr: predictions.get(p.id) }))
      .filter((r): r is Row => Boolean(r.pr))
      .filter((r) => (district ? r.p.district === district : true))
      .filter((r) => (type ? r.p.type === type : true))
      .filter((r) => (status ? r.p.status === status : true))
      .filter((r) => (risk ? r.pr.riskCategory === risk : true))
      .filter((r) =>
        q
          ? r.p.name.toLowerCase().includes(q) ||
            r.p.projectId.toLowerCase().includes(q) ||
            r.p.village.toLowerCase().includes(q)
          : true,
      );

    const dir = sortDir === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      const av = valueFor(a, sortKey);
      const bv = valueFor(b, sortKey);
      if (typeof av === "number" && typeof bv === "number")
        return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
    return filtered;
  }, [
    visibleProjects,
    predictions,
    query,
    district,
    type,
    status,
    risk,
    sortKey,
    sortDir,
  ]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(safePage * PAGE, safePage * PAGE + PAGE);

  const totals = useMemo(() => {
    const land = rows.reduce((s, r) => s + r.p.landArea, 0);
    const families = rows.reduce((s, r) => s + r.p.affectedFamilies, 0);
    const disputes = rows.reduce((s, r) => s + r.p.params.legalDisputes, 0);
    return { land: Math.round(land), families, disputes };
  }, [rows]);

  const setSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(
        key === "name" || key === "district" || key === "projectId"
          ? "asc"
          : "desc",
      );
    }
    setPage(0);
  };

  const resetFilters = () => {
    setQuery("");
    setDistrict("");
    setType("");
    setStatus("");
    setRisk("");
    setPage(0);
  };

  const exportCsv = () => {
    if (rows.length === 0) {
      toast.error("No records to export for the current filters.");
      return;
    }
    const cols = [
      "Project ID",
      "Name",
      "Type",
      "Agency",
      "State",
      "District",
      "Village",
      "Land area (ha)",
      "Govt land (ha)",
      "Private land (ha)",
      "Forest land (ha)",
      "Affected families",
      "Compensation %",
      "R&R %",
      "Possession %",
      "Documentation %",
      "Open legal disputes",
      "Resolved disputes",
      "Risk score",
      "Risk category",
      "Overall progress %",
      "Status",
      "Current stage",
      "Created / updated",
    ];
    const escape = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = rows.map((r) =>
      [
        r.p.projectId,
        r.p.name,
        r.p.type,
        r.p.agency,
        r.p.state,
        r.p.district,
        r.p.village,
        r.p.landArea,
        r.p.govtLand,
        r.p.privateLand,
        r.p.forestLand,
        r.p.affectedFamilies,
        r.p.params.compensationPct,
        r.p.params.rrPct,
        r.p.params.possessionPct,
        r.p.params.documentationPct,
        r.p.params.legalDisputes,
        r.p.params.resolvedDisputes,
        r.pr.riskScore,
        r.pr.riskCategory,
        overallProgress(r.p),
        r.p.status,
        r.p.currentStage,
        new Date(r.p.createdAt).toISOString().slice(0, 10),
      ]
        .map(escape)
        .join(","),
    );
    const csv = [cols.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `landvision-acquisition-data-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length.toLocaleString("en-IN")} records.`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="State-wise FIR Analysis & Data Upload"
        description="Select state for FIR analytics, upload new multi-location datasets (CSV, XLSX, JSON), validate schema, detect locations, and trigger AI training pipeline."
      >
        <DemoTag />
      </PageHeader>

      {/* SECTION 1: STATE SELECTOR & STATE-WISE FIR ANALYSIS */}
      <Panel className="border-primary/40 bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Database className="size-4.5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-foreground tracking-wide uppercase">
                {selectedState} FIR Analysis System
              </h2>
              <p className="text-xs text-muted-foreground">
                State-level crime, land dispute, and legal FIR intelligence breakdown
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="state-selector" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select State:
            </label>
            <select
              id="state-selector"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="rounded-lg border border-primary/40 bg-background px-3 py-2 text-xs font-bold text-foreground shadow-xs focus:ring-2 focus:ring-primary outline-none cursor-pointer"
            >
              {STATE_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* STATE FIR STAT CARDS */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <StatCard
            label={`Total FIRs (${selectedState})`}
            value={stateAnalysis.totalFirs}
            icon={FileText}
            tone="ai"
          />
          <StatCard
            label="Open FIRs"
            value={stateAnalysis.openFirs}
            icon={Activity}
            tone="medium"
          />
          <StatCard
            label="Closed FIRs"
            value={stateAnalysis.closedFirs}
            icon={CheckCircle2}
            tone="low"
          />
          <StatCard
            label="Critical FIRs"
            value={stateAnalysis.criticalFirs}
            icon={ShieldAlert}
            tone="critical"
          />
          <StatCard
            label="Avg Resolution Time"
            value={stateAnalysis.avgResolutionDays}
            suffix=" days"
            icon={RefreshCw}
            hint="Resolution velocity"
          />
        </div>

        {/* STATE TREND & CATEGORY DISTRIBUTION CHARTS */}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-bold text-foreground tracking-wide flex items-center justify-between">
              <span>{selectedState} Monthly FIR Trend</span>
              <span className="text-[10px] text-muted-foreground">Jan – Aug 2026</span>
            </p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stateAnalysis.trend}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="month" {...AXIS} />
                  <YAxis {...AXIS} />
                  <Tooltip contentStyle={TOOLTIP} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--primary)"
                    strokeWidth={2.5}
                    dot={{ fill: "var(--primary)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <p className="text-xs font-bold text-foreground tracking-wide">
              Major FIR Categories ({selectedState})
            </p>
            <ul className="mt-2 space-y-2 text-xs">
              {stateAnalysis.categories.map((c) => {
                const pct = Math.round((c.count / stateAnalysis.totalFirs) * 100);
                return (
                  <li key={c.category} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-foreground truncate max-w-[75%]">{c.category}</span>
                      <span className="font-bold text-primary tabular-nums">{c.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Panel>

      {/* SECTION 2: FIR DATA UPLOAD & 5-6 LOCATION DETECTION */}
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Panel>
          <PanelTitle
            title="FIR Dataset Upload"
            subtitle="Upload multi-location FIR datasets in CSV, XLSX, or JSON format"
            icon={UploadCloud}
          />

          {/* DRAG & DROP ZONE */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              const file = e.dataTransfer.files[0];
              if (file) handleFileUpload(file.name);
            }}
            className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <UploadCloud className="size-10 text-primary animate-bounce" />
            <h3 className="mt-2 font-display text-sm font-bold text-foreground">
              Upload FIR Dataset
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Drag &amp; Drop your dataset file here or click to browse
            </p>
            <div className="mt-4 flex items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90">
                <span>Choose File</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f.name);
                  }}
                />
              </label>
            </div>
            <p className="mt-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Supported Formats: CSV, XLSX, JSON
            </p>
          </div>

          {/* DEMO DATASET QUICK LOAD BUTTONS */}
          <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Load Sample Dataset:</span>
            <button
              onClick={() => handleFileUpload("Odisha_FIR_Dataset_2026.csv")}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              Odisha_FIR_Dataset_2026.csv
            </button>
            <button
              onClick={() => handleFileUpload("National_Parcels_5Locations.xlsx")}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              National_Parcels_5Locations.xlsx
            </button>
          </div>

          {/* STEP 1: VALIDATION RESULTS PANEL */}
          {validation ? (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-2">
                  <FileCheck className="size-4 text-risk-low" /> STEP 1 — DATA VALIDATION RESULTS
                </span>
                <span className="rounded bg-risk-low/20 px-2 py-0.5 text-[10px] font-bold text-risk-low">
                  VALIDATED
                </span>
              </div>

              <div className="grid gap-2 text-xs">
                <div className="flex items-center gap-2 text-risk-low font-medium">
                  <CheckCircle2 className="size-3.5" />
                  <span>✓ {validation.totalRecords.toLocaleString("en-IN")} records detected</span>
                </div>
                <div className="flex items-center gap-2 text-risk-low font-medium">
                  <CheckCircle2 className="size-3.5" />
                  <span>✓ Required columns found (fir_id, state, location, category, date, severity)</span>
                </div>
                <div className="flex items-center gap-2 text-risk-medium font-medium">
                  <AlertTriangle className="size-3.5" />
                  <span>⚠ {validation.missingLocationsCount} records have missing location (imputed to nearest district)</span>
                </div>
                <div className="flex items-center gap-2 text-risk-medium font-medium">
                  <AlertTriangle className="size-3.5" />
                  <span>⚠ {validation.duplicatesCount} duplicate records (auto-deduplicated)</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={() => toast.info("Data review log downloaded.")}
                  className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-card"
                >
                  Review Data
                </button>
                <button
                  onClick={startAiPipeline}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-60"
                >
                  {isProcessing ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                  <span>Continue to Pipeline</span>
                </button>
              </div>
            </div>
          ) : null}
        </Panel>

        {/* LOCATION DISTRIBUTION (5-6 LOCATIONS) */}
        <Panel>
          <PanelTitle
            title="Dataset Location Distribution"
            subtitle="Auto-detected location grouping from uploaded/demo dataset"
            icon={MapPin}
          />
          <div className="mt-4 space-y-3 text-xs">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Calculated Distribution Across 6 Monitored Locations:
            </p>
            {DEMO_LOCATIONS.map((loc, idx) => {
              const counts = [1240, 982, 847, 731, 654, 588];
              const c = counts[idx] ?? 600;
              const max = 1240;
              const pct = Math.round((c / max) * 100);
              return (
                <div key={loc} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <MapPin className="size-3 text-primary" /> Location {idx + 1} — {loc}
                    </span>
                    <span className="font-bold text-primary tabular-nums">
                      {c.toLocaleString("en-IN")} records
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* SECTION 3: TRAINING / MODEL PROCESS WORKFLOW */}
      <Panel>
        <div className="flex items-center justify-between">
          <PanelTitle
            title="AI Model Processing Pipeline Workflow"
            subtitle="End-to-end automated processing pipeline from raw dataset upload to ML report generation"
            icon={Cpu}
            ai
          />
          <button
            onClick={startAiPipeline}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
            <span>{isProcessing ? "Processing Pipeline..." : "Run AI Model Pipeline"}</span>
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
          {PIPELINE_STEPS.map((step, idx) => {
            const isDone = idx < activeStepIndex;
            const isActive = idx === activeStepIndex && isProcessing;
            return (
              <div
                key={step.id}
                className={`rounded-xl border p-3 text-center space-y-1.5 transition-all ${
                  isDone
                    ? "border-risk-low/50 bg-risk-low/10 text-foreground"
                    : isActive
                      ? "border-primary bg-primary/10 ring-2 ring-primary/40 animate-pulse"
                      : "border-border bg-card opacity-65 text-muted-foreground"
                }`}
              >
                <div className="mx-auto grid size-7 place-items-center rounded-full border text-xs font-bold">
                  {isDone ? "✓" : isActive ? "●" : idx + 1}
                </div>
                <p className="font-display text-xs font-bold text-foreground truncate">{step.name}</p>
                <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{step.detail}</p>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* SECTION 4: MASTER PARCEL RECORDS TABLE & FILTERS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Records in scope"
          value={rows.length}
          icon={Database}
        />
        <StatCard
          label="Total land area"
          value={totals.land}
          suffix=" ha"
          icon={Database}
          tone="ai"
        />
        <StatCard
          label="Affected families"
          value={totals.families}
          icon={Database}
        />
        <StatCard
          label="Open legal disputes"
          value={totals.disputes}
          icon={Database}
          tone="high"
        />
      </div>

      <Panel>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Search</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Project, ID or village"
                className="w-60 rounded-md border border-border bg-background py-2 pr-3 pl-8 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </span>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">District</span>
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setPage(0);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">All districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Type</span>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(0);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">All types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Status</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">All statuses</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block">Risk</span>
            <select
              value={risk}
              onChange={(e) => {
                setRisk(e.target.value);
                setPage(0);
              }}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="">All risk levels</option>
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskCategory[]).map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ),
              )}
            </select>
          </label>
          <div className="ml-auto flex items-end gap-2">
            <button
              onClick={resetFilters}
              className="rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-card"
            >
              Reset
            </button>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Download className="size-3.5" aria-hidden /> Export CSV
            </button>
          </div>
        </div>
      </Panel>

      <Panel className="p-0">
        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No matching records"
              description="Try clearing the search box or resetting the filters above."
              icon={Database}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface">
                  <tr className="text-[11px] tracking-wide text-muted-foreground uppercase">
                    {HEADERS.map((h) => (
                      <th
                        key={h.key}
                        className={`px-3 py-2.5 font-medium ${h.numeric ? "text-right" : ""}`}
                      >
                        <button
                          onClick={() => setSort(h.key)}
                          className={`inline-flex items-center gap-1 hover:text-foreground ${
                            sortKey === h.key ? "text-foreground" : ""
                          } ${h.numeric ? "flex-row-reverse" : ""}`}
                        >
                          {h.label}
                          <ArrowUpDown className="size-3" aria-hidden />
                        </button>
                      </th>
                    ))}
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((r) => (
                    <tr
                      key={r.p.id}
                      className="border-t border-border hover:bg-surface/60"
                    >
                      <td className="px-3 py-2.5 font-medium text-foreground">
                        {r.p.projectId}
                      </td>
                      <td
                        className="max-w-[220px] truncate px-3 py-2.5 text-foreground"
                        title={r.p.name}
                      >
                        {r.p.name}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {r.p.district}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                        {r.p.landArea.toLocaleString("en-IN")}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                        {r.p.params.compensationPct}%
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                        {r.p.params.rrPct}%
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                        {r.p.params.legalDisputes}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <RiskBadge
                          category={r.pr.riskCategory}
                          score={r.pr.riskScore}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                        {new Date(r.p.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Link
                          to="/app/projects/$projectId"
                          params={{ projectId: r.p.id }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Open <ExternalLink className="size-3" aria-hidden />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
              <span>
                Showing {safePage * PAGE + 1}–
                {Math.min((safePage + 1) * PAGE, rows.length)} of{" "}
                {rows.length.toLocaleString("en-IN")}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 disabled:opacity-40"
                >
                  <ChevronLeft className="size-3.5" aria-hidden /> Prev
                </button>
                <span className="tabular-nums">
                  Page {safePage + 1} / {pageCount}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={safePage >= pageCount - 1}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 disabled:opacity-40"
                >
                  Next <ChevronRight className="size-3.5" aria-hidden />
                </button>
              </div>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
