import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
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
import {
  Activity,
  AlertTriangle,
  Banknote,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Database,
  Download,
  Eye,
  FileBarChart,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  Gavel,
  Globe2,
  HeartHandshake,
  Info,
  Layers,
  Loader2,
  MapPin,
  MapPinned,
  Printer,
  ShieldAlert,
  Sparkles,
  TimerReset,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  DemoTag,
  EmptyState,
  Panel,
  PanelTitle,
  PageHeader,
} from "@/components/lv/panels";
import { RiskBadge } from "@/components/lv/risk";
import { useLV } from "@/lib/lv/store";
import { overallProgress } from "@/lib/lv/risk";
import { DEMO_LOCATIONS, getFirStateAnalysis, STATE_LIST } from "@/lib/lv/data";
import type { Prediction, Project, RiskCategory } from "@/lib/lv/types";

export const Route = createFileRoute("/app/reports")({
  head: () => ({
    meta: [
      { title: "Reports & PDF Intelligence Generator — LandVision AI" },
      {
        name: "description",
        content:
          "Generate, preview and download paper-formatted official 7-page A4 PDF reports for state FIR analysis, AI insights, and model performance.",
      },
      { property: "og:title", content: "Reports & A4 PDF Generator — LandVision AI" },
    ],
  }),
  component: ReportsPage,
});

const CAT_COLORS: Record<RiskCategory, string> = {
  LOW: "#16a34a",
  MEDIUM: "#d97706",
  HIGH: "#dc2626",
  CRITICAL: "#991b1b",
};

const AXIS = { stroke: "#64748b", fontSize: 10 } as const;

function ReportsPage() {
  const { visibleProjects, predictions, selectedState, setSelectedState } = useLV();

  // Filters
  const [reportState, setReportState] = useState(selectedState);
  const [district, setDistrict] = useState("");
  const [location, setLocation] = useState("");
  const [risk, setRisk] = useState("");
  const [range, setRange] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");

  // Preview Modal & Generation
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // References to A4 pages
  const page1Ref = useRef<HTMLDivElement>(null);
  const page2Ref = useRef<HTMLDivElement>(null);
  const page3Ref = useRef<HTMLDivElement>(null);
  const page4Ref = useRef<HTMLDivElement>(null);
  const page5Ref = useRef<HTMLDivElement>(null);
  const page6Ref = useRef<HTMLDivElement>(null);
  const page7Ref = useRef<HTMLDivElement>(null);

  const stateAnalysis = useMemo(
    () => getFirStateAnalysis(reportState),
    [reportState],
  );

  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const reportId = `LV-RPT-2026-${reportState.slice(0, 2).toUpperCase()}-9428`;
  const pdfFilename = `LandVision_AI_FIR_Report_${reportState}_2026-09-02.pdf`;

  const generatePdf = async () => {
    setIsGenerating(true);
    toast.info(`Generating official A4 PDF report for ${reportState}...`);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pages = [
        page1Ref.current,
        page2Ref.current,
        page3Ref.current,
        page4Ref.current,
        page5Ref.current,
        page6Ref.current,
        page7Ref.current,
      ];

      for (let i = 0; i < pages.length; i++) {
        const el = pages[i];
        if (!el) continue;

        if (i > 0) pdf.addPage();

        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
      }

      pdf.save(pdfFilename);
      toast.success(`Report "${pdfFilename}" downloaded successfully!`);
    } catch (err) {
      toast.error("Failed to render PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports &amp; PDF Intelligence Generator"
        description="Configure state filters, preview paper-styled A4 report pages, and export official multi-page PDF documents."
      >
        <DemoTag />
      </PageHeader>

      {/* FILTER CONTROL BAR */}
      <Panel className="border-primary/40 bg-surface">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block font-semibold text-foreground">Select State</span>
            <select
              value={reportState}
              onChange={(e) => {
                setReportState(e.target.value);
                setSelectedState(e.target.value);
              }}
              className="rounded-lg border border-primary/40 bg-background px-3 py-2 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary outline-none cursor-pointer"
            >
              {STATE_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block font-semibold text-foreground">District / Location</span>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
            >
              <option value="">All Locations (6 Monitored)</option>
              {DEMO_LOCATIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block font-semibold text-foreground">FIR Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
            >
              <option value="">All FIR Statuses</option>
              <option value="Open">Open FIRs</option>
              <option value="Closed">Closed FIRs</option>
              <option value="Critical">Critical Cases</option>
            </select>
          </label>

          <label className="text-xs text-muted-foreground">
            <span className="mb-1 block font-semibold text-foreground">Risk Level</span>
            <select
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground"
            >
              <option value="">All Risk Levels</option>
              {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskCategory[]).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div className="ml-auto flex items-center gap-2 pt-2">
            <button
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
            >
              <Eye className="size-4" />
              <span>Preview Report</span>
            </button>
            <button
              onClick={generatePdf}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
            >
              {isGenerating ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              <span>Download PDF Report</span>
            </button>
          </div>
        </div>
      </Panel>

      {/* REPORT CONFIGURATION OVERVIEW */}
      <div className="grid gap-4 md:grid-cols-3">
        <Panel>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <FileText className="size-5" />
            </span>
            <div className="space-y-1">
              <h3 className="font-display text-sm font-bold text-foreground">Official A4 Paper PDF Format</h3>
              <p className="text-xs text-muted-foreground">
                Formatted as a 7-page printed administrative report with official seals, page headers/footers, and embedded vector charts.
              </p>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Building2 className="size-5" />
            </span>
            <div className="space-y-1">
              <h3 className="font-display text-sm font-bold text-foreground">State Target: {reportState}</h3>
              <p className="text-xs text-muted-foreground">
                Total FIRs: {stateAnalysis.totalFirs.toLocaleString("en-IN")} · Open: {stateAnalysis.openFirs} · Critical: {stateAnalysis.criticalFirs}
              </p>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Printer className="size-5" />
            </span>
            <div className="space-y-1">
              <h3 className="font-display text-sm font-bold text-foreground">Dynamic Output Filename</h3>
              <p className="text-xs text-muted-foreground font-mono font-bold text-primary">
                {pdfFilename}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      {/* PREVIEW CONTAINER OR INLINE PREVIEW */}
      <Panel>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <PanelTitle
            title={`${reportState.toUpperCase()} FIR ANALYSIS REPORT PREVIEW`}
            subtitle="Paper-formatted 7-page report document preview"
            icon={Eye}
          />
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" /> Prev Page
            </button>
            <span className="font-bold text-foreground">
              Page {currentPage} of 7
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(7, p + 1))}
              disabled={currentPage === 7}
              className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 disabled:opacity-40"
            >
              Next Page <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>

        {/* VISUAL PREVIEW VIEWPORT */}
        <div className="mt-6 flex justify-center bg-muted/40 p-6 rounded-xl overflow-x-auto">
          <div className="shadow-2xl rounded-sm overflow-hidden bg-white border border-slate-300">
            {/* PAGE 1 */}
            <div className={currentPage === 1 ? "block" : "hidden"}>
              <div
                ref={page1Ref}
                className="w-[210mm] min-h-[297mm] p-[16mm] bg-white text-slate-900 flex flex-col justify-between font-sans box-border relative"
              >
                {/* HEADER BANNER */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-slate-900 text-white font-bold grid place-items-center text-lg rounded">
                      LV
                    </div>
                    <div>
                      <h1 className="text-xl font-extrabold tracking-wider text-slate-900 uppercase">
                        LANDVISION AI
                      </h1>
                      <p className="text-[9px] font-bold text-slate-600 tracking-widest uppercase">
                        Government Acquisition Intelligence System
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-slate-100 border border-slate-300 px-2 py-1 text-[9px] font-bold text-slate-700 uppercase">
                      OFFICIAL USE ONLY // {reportState.toUpperCase()}
                    </span>
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">{reportId}</p>
                  </div>
                </div>

                {/* COVER TITLE BODY */}
                <div className="my-auto space-y-8 py-10 text-center">
                  <div className="inline-block rounded-full bg-blue-50 border border-blue-200 px-4 py-1 text-xs font-bold text-blue-900 uppercase tracking-widest">
                    State Infrastructure &amp; Land Disputes Report
                  </div>
                  <h2 className="text-4xl font-extrabold text-slate-900 leading-tight tracking-tight uppercase">
                    FIR ANALYSIS &amp;<br />INTELLIGENCE REPORT
                  </h2>
                  <div className="w-24 h-1 bg-slate-900 mx-auto" />
                  <p className="text-sm font-medium text-slate-600 max-w-md mx-auto">
                    AI-powered automated delay forecasting, legal FIR risk clustering, and multi-location acquisition bottleneck intelligence.
                  </p>

                  {/* METADATA BOX */}
                  <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-lg p-6 text-left space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase">Target State</span>
                        <span className="text-sm font-extrabold text-slate-900">{reportState}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase">Report Period</span>
                        <span className="text-sm font-extrabold text-slate-900">01 Jan 2026 – 31 Aug 2026</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase">Generation Date</span>
                        <span className="text-sm font-extrabold text-slate-900">{currentDate}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-500 uppercase">Security Clearance</span>
                        <span className="text-sm font-extrabold text-slate-900">Classified Govt</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="border-t border-slate-300 pt-4 flex items-center justify-between text-[10px] text-slate-500">
                  <span>LandVision AI Command Center · {reportState} Jurisdiction</span>
                  <span className="font-bold">Page 1 of 7</span>
                </div>
              </div>
            </div>

            {/* PAGE 2 — EXECUTIVE SUMMARY */}
            <div className={currentPage === 2 ? "block" : "hidden"}>
              <div
                ref={page2Ref}
                className="w-[210mm] min-h-[297mm] p-[16mm] bg-white text-slate-900 flex flex-col justify-between font-sans box-border relative"
              >
                <div className="space-y-6">
                  <div className="border-b border-slate-300 pb-3 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      LANDVISION AI · REPORT #{reportId}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase">State: {reportState}</span>
                  </div>

                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase border-b-2 border-slate-900 pb-2">
                    EXECUTIVE SUMMARY
                  </h2>

                  {/* 5 KPI CARDS */}
                  <div className="grid grid-cols-5 gap-3">
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
                      <span className="block text-[9px] font-bold text-slate-500 uppercase">Total FIRs</span>
                      <span className="text-lg font-extrabold text-slate-900">{stateAnalysis.totalFirs.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
                      <span className="block text-[9px] font-bold text-amber-700 uppercase">Open FIRs</span>
                      <span className="text-lg font-extrabold text-amber-700">{stateAnalysis.openFirs}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
                      <span className="block text-[9px] font-bold text-green-700 uppercase">Closed FIRs</span>
                      <span className="text-lg font-extrabold text-green-700">{stateAnalysis.closedFirs}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
                      <span className="block text-[9px] font-bold text-red-700 uppercase">Critical FIRs</span>
                      <span className="text-lg font-extrabold text-red-700">{stateAnalysis.criticalFirs}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 rounded text-center">
                      <span className="block text-[9px] font-bold text-slate-500 uppercase">Avg Resolution</span>
                      <span className="text-lg font-extrabold text-slate-900">{stateAnalysis.avgResolutionDays}d</span>
                    </div>
                  </div>

                  {/* AI NARRATIVE */}
                  <div className="bg-blue-50 border border-blue-200 p-5 rounded-lg space-y-2">
                    <h3 className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                      Automated Executive AI Narrative
                    </h3>
                    <p className="text-xs text-slate-800 leading-relaxed">
                      "Analysis of the uploaded dataset indicates that the majority of reported cases are concentrated in selected districts, with unresolved cases contributing significantly to overall risk. Direct-Benefit Transfer (DBT) verification gaps and ancestral land title disputes account for the primary share of timeline slippage across high-priority infrastructure corridors in {reportState}."
                    </p>
                  </div>

                  {/* SUMMARY TABLE */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Executive Portfolio Metrics Overview
                    </h3>
                    <table className="w-full text-left text-xs border border-slate-200">
                      <thead className="bg-slate-100 font-bold text-slate-700">
                        <tr>
                          <th className="p-2 border-b border-slate-200">Indicator Metric</th>
                          <th className="p-2 border-b border-slate-200 text-right">Value</th>
                          <th className="p-2 border-b border-slate-200">Status Target</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-2 font-medium">Jurisdictional Coverage</td>
                          <td className="p-2 text-right font-bold">{reportState} (6 Districts)</td>
                          <td className="p-2 text-green-700 font-bold">Comprehensive</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">Critical Risk Escalation Rate</td>
                          <td className="p-2 text-right font-bold">{Math.round((stateAnalysis.criticalFirs / stateAnalysis.totalFirs) * 100)}%</td>
                          <td className="p-2 text-amber-700 font-bold">Action Required</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">Average Case Resolution Time</td>
                          <td className="p-2 text-right font-bold">{stateAnalysis.avgResolutionDays} Days</td>
                          <td className="p-2 text-slate-700 font-bold">Target: &lt;20 Days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-t border-slate-300 pt-4 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Executive Summary · {reportState}</span>
                  <span className="font-bold">Page 2 of 7</span>
                </div>
              </div>
            </div>

            {/* PAGE 3 — STATE & LOCATION ANALYSIS */}
            <div className={currentPage === 3 ? "block" : "hidden"}>
              <div
                ref={page3Ref}
                className="w-[210mm] min-h-[297mm] p-[16mm] bg-white text-slate-900 flex flex-col justify-between font-sans box-border relative"
              >
                <div className="space-y-6">
                  <div className="border-b border-slate-300 pb-3 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 uppercase">
                      LANDVISION AI · REPORT #{reportId}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase">State &amp; Location Analysis</span>
                  </div>

                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase border-b-2 border-slate-900 pb-2">
                    STATE &amp; LOCATION ANALYSIS
                  </h2>

                  {/* EMBEDDED ACTUAL VISUAL CHART */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase">
                      Location Distribution Chart ({reportState})
                    </h3>
                    <div className="h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stateAnalysis.locations} margin={{ left: 10, right: 10 }}>
                          <CartesianGrid stroke="#cbd5e1" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="location" {...AXIS} />
                          <YAxis {...AXIS} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#0f172a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* LOCATION BREAKDOWN TABLE */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase">
                      District &amp; Location Case Breakdown
                    </h3>
                    <table className="w-full text-left text-xs border border-slate-200">
                      <thead className="bg-slate-100 font-bold text-slate-700">
                        <tr>
                          <th className="p-2 border-b">Location Name</th>
                          <th className="p-2 border-b text-right">Reported FIRs</th>
                          <th className="p-2 border-b text-right">Percentage Share</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {stateAnalysis.locations.map((loc) => (
                          <tr key={loc.location}>
                            <td className="p-2 font-bold">{loc.location}</td>
                            <td className="p-2 text-right font-semibold">{loc.count.toLocaleString("en-IN")}</td>
                            <td className="p-2 text-right font-bold text-blue-900">
                              {Math.round((loc.count / stateAnalysis.totalFirs) * 100)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-t border-slate-300 pt-4 flex items-center justify-between text-[10px] text-slate-500">
                  <span>State &amp; Location Analysis · {reportState}</span>
                  <span className="font-bold">Page 3 of 7</span>
                </div>
              </div>
            </div>

            {/* PAGE 4 — AI INSIGHTS */}
            <div className={currentPage === 4 ? "block" : "hidden"}>
              <div
                ref={page4Ref}
                className="w-[210mm] min-h-[297mm] p-[16mm] bg-white text-slate-900 flex flex-col justify-between font-sans box-border relative"
              >
                <div className="space-y-6">
                  <div className="border-b border-slate-300 pb-3 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 uppercase">
                      LANDVISION AI · REPORT #{reportId}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase">AI-Generated Insights</span>
                  </div>

                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase border-b-2 border-slate-900 pb-2">
                    AI-GENERATED INSIGHTS
                  </h2>

                  {/* KEY FINDINGS 1 - 5 */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Key Algorithmic Findings (1 to 5)
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="p-3 bg-red-50 border-l-4 border-red-600 rounded-r">
                        <span className="font-extrabold text-red-900">1. High Escalation Risk: </span>
                        <span className="text-slate-800">5 locations show a high probability of work stop escalation due to pending court stays.</span>
                      </div>
                      <div className="p-3 bg-amber-50 border-l-4 border-amber-600 rounded-r">
                        <span className="font-extrabold text-amber-900">2. Primary Contributor: </span>
                        <span className="text-slate-800">Compensation-related issues and DBT verification gaps are the single most common contributor (34% weight).</span>
                      </div>
                      <div className="p-3 bg-blue-50 border-l-4 border-blue-600 rounded-r">
                        <span className="font-extrabold text-blue-900">3. Geographic Concentration: </span>
                        <span className="text-slate-800">Khordha currently has the highest concentration of reported land dispute FIR cases.</span>
                      </div>
                      <div className="p-3 bg-slate-100 border-l-4 border-slate-700 rounded-r">
                        <span className="font-extrabold text-slate-900">4. R&amp;R Infrastructure Bottleneck: </span>
                        <span className="text-slate-800">Delayed R&amp;R resettlement site completion increases project slippage probability by 42%.</span>
                      </div>
                      <div className="p-3 bg-slate-100 border-l-4 border-slate-700 rounded-r">
                        <span className="font-extrabold text-slate-900">5. Title Verification Gaps: </span>
                        <span className="text-slate-800">Ancestral title conflicts account for 34% of open legal revenue court disputes.</span>
                      </div>
                    </div>
                  </div>

                  {/* RECOMMENDED ACTIONS */}
                  <div className="space-y-2 pt-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase">Recommended Administrative Actions</h3>
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs space-y-2">
                      <p className="font-bold text-slate-900">✓ Prioritize review of cases where multiple issues remain unresolved for &gt;30 days.</p>
                      <p className="font-bold text-slate-900">✓ Convene Special Revenue Court Lok Adalat benches in Khordha &amp; Cuttack.</p>
                      <p className="font-bold text-slate-900">✓ Deploy village DBT mobile verification teams for rapid compensation disbursal.</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-300 pt-4 flex items-center justify-between text-[10px] text-slate-500">
                  <span>AI Insights · {reportState}</span>
                  <span className="font-bold">Page 4 of 7</span>
                </div>
              </div>
            </div>

            {/* PAGE 5 — MODEL PERFORMANCE */}
            <div className={currentPage === 5 ? "block" : "hidden"}>
              <div
                ref={page5Ref}
                className="w-[210mm] min-h-[297mm] p-[16mm] bg-white text-slate-900 flex flex-col justify-between font-sans box-border relative"
              >
                <div className="space-y-6">
                  <div className="border-b border-slate-300 pb-3 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 uppercase">
                      LANDVISION AI · REPORT #{reportId}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase">Model Performance</span>
                  </div>

                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase border-b-2 border-slate-900 pb-2">
                    MODEL PERFORMANCE &amp; EVALUATION
                  </h2>

                  {/* MODEL METRICS TABLE */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase">
                      Production Model Evaluation Metrics (XGBoost v2.4)
                    </h3>
                    <table className="w-full text-left text-xs border border-slate-200">
                      <thead className="bg-slate-100 font-bold text-slate-700">
                        <tr>
                          <th className="p-2 border-b">Metric</th>
                          <th className="p-2 border-b text-right">Value</th>
                          <th className="p-2 border-b">Benchmark Baseline</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-2 font-medium">Classification Accuracy</td>
                          <td className="p-2 text-right font-extrabold text-green-700">94.2%</td>
                          <td className="p-2 text-slate-600">Random Forest (92.6%)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">Precision Score</td>
                          <td className="p-2 text-right font-bold text-slate-900">92.8%</td>
                          <td className="p-2 text-slate-600">Target &gt;90%</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">Recall Score</td>
                          <td className="p-2 text-right font-bold text-slate-900">91.5%</td>
                          <td className="p-2 text-slate-600">Target &gt;90%</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">F1 Score</td>
                          <td className="p-2 text-right font-bold text-slate-900">92.1%</td>
                          <td className="p-2 text-slate-600">Harmonic Mean</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-medium">ROC-AUC Discriminator</td>
                          <td className="p-2 text-right font-extrabold text-blue-900">0.962</td>
                          <td className="p-2 text-slate-600">High Discrimination</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* CONFUSION MATRIX DISPLAY */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase">Confusion Matrix Breakdown</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white border rounded">
                        <span className="block text-[10px] text-slate-500 font-bold uppercase">True Positive (Critical Detected)</span>
                        <span className="text-base font-extrabold text-slate-900">1,592 cases (91.5%)</span>
                      </div>
                      <div className="p-3 bg-white border rounded">
                        <span className="block text-[10px] text-slate-500 font-bold uppercase">True Negative (Stable Detected)</span>
                        <span className="text-base font-extrabold text-slate-900">3,890 cases (94.8%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-300 pt-4 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Model Performance · {reportState}</span>
                  <span className="font-bold">Page 5 of 7</span>
                </div>
              </div>
            </div>

            {/* PAGE 6 — DATASET SUMMARY */}
            <div className={currentPage === 6 ? "block" : "hidden"}>
              <div
                ref={page6Ref}
                className="w-[210mm] min-h-[297mm] p-[16mm] bg-white text-slate-900 flex flex-col justify-between font-sans box-border relative"
              >
                <div className="space-y-6">
                  <div className="border-b border-slate-300 pb-3 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 uppercase">
                      LANDVISION AI · REPORT #{reportId}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase">Dataset Information</span>
                  </div>

                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase border-b-2 border-slate-900 pb-2">
                    DATASET INFORMATION &amp; AUDIT
                  </h2>

                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-900 uppercase">Uploaded Dataset Audit Summary</h3>
                    <table className="w-full text-left text-xs border border-slate-200">
                      <tbody className="divide-y divide-slate-200">
                        <tr>
                          <td className="p-2.5 font-bold text-slate-700 bg-slate-50 w-1/3">Source File Name</td>
                          <td className="p-2.5 font-bold text-slate-900">Odisha_FIR_Dataset_2026.csv</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-700 bg-slate-50">Ingestion Date</td>
                          <td className="p-2.5 font-medium">{currentDate}</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-700 bg-slate-50">Total Records Ingested</td>
                          <td className="p-2.5 font-extrabold text-slate-900">5,842 Records</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-700 bg-slate-50">Detected Locations</td>
                          <td className="p-2.5 font-medium">6 Locations (Bhubaneswar, Cuttack, Khordha, Puri, Ganjam, Balasore)</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-700 bg-slate-50">Missing Records (Imputed)</td>
                          <td className="p-2.5 font-medium text-amber-700 font-bold">32 Records (0.5%)</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-700 bg-slate-50">Duplicate Records (Deduplicated)</td>
                          <td className="p-2.5 font-medium text-amber-700 font-bold">7 Records</td>
                        </tr>
                        <tr>
                          <td className="p-2.5 font-bold text-slate-700 bg-slate-50">Validation Status</td>
                          <td className="p-2.5 font-extrabold text-green-700">PASSED &amp; VALIDATED</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-t border-slate-300 pt-4 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Dataset Information · {reportState}</span>
                  <span className="font-bold">Page 6 of 7</span>
                </div>
              </div>
            </div>

            {/* PAGE 7 — CONCLUSION */}
            <div className={currentPage === 7 ? "block" : "hidden"}>
              <div
                ref={page7Ref}
                className="w-[210mm] min-h-[297mm] p-[16mm] bg-white text-slate-900 flex flex-col justify-between font-sans box-border relative"
              >
                <div className="space-y-6">
                  <div className="border-b border-slate-300 pb-3 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900 uppercase">
                      LANDVISION AI · REPORT #{reportId}
                    </span>
                    <span className="text-xs font-bold text-slate-500 uppercase">Conclusion &amp; Recommendations</span>
                  </div>

                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase border-b-2 border-slate-900 pb-2">
                    CONCLUSION &amp; RECOMMENDATIONS
                  </h2>

                  <div className="space-y-4 text-xs">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2">
                      <h3 className="font-bold text-slate-900 uppercase">Major Findings Summary</h3>
                      <p className="text-slate-800 leading-relaxed">
                        Data-driven analysis across {reportState} demonstrates that land acquisition delays can be curtailed by up to 60% through proactive Lok Adalat court dispute resolution and expedited DBT compensation disbursal.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg space-y-2">
                      <h3 className="font-bold text-slate-900 uppercase">High-Priority Action Locations</h3>
                      <p className="text-slate-800 font-semibold">
                        • Khordha District (847 records, High Risk Score 76/100)<br />
                        • Cuttack District (982 records, Critical Escalate 72 cases)
                      </p>
                    </div>

                    {/* SIGNATURE BLOCK */}
                    <div className="pt-10 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs">
                      <div>
                        <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">
                          Special Land Acquisition Officer
                        </div>
                        <span className="text-[10px] text-slate-500">Revenue &amp; Disaster Management, {reportState}</span>
                      </div>
                      <div>
                        <div className="border-b border-slate-400 pb-1 mb-1 font-bold text-slate-900">
                          AI Taskforce Lead
                        </div>
                        <span className="text-[10px] text-slate-500">LandVision AI Command Center</span>
                      </div>
                    </div>
                  </div>

                  {/* SLOGAN BANNER */}
                  <div className="bg-slate-900 text-white p-4 rounded-lg text-center my-6 space-y-1">
                    <h3 className="font-extrabold tracking-widest text-sm uppercase">LANDVISION AI</h3>
                    <p className="text-xs text-slate-300 italic">"Turning data into actionable intelligence."</p>
                  </div>
                </div>

                <div className="border-t border-slate-300 pt-4 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Conclusion &amp; Sign-off · {reportState}</span>
                  <span className="font-bold">Page 7 of 7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* FULLSCREEN PREVIEW MODAL */}
      {isPreviewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur p-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-5 py-3 bg-surface">
              <span className="text-sm font-bold text-foreground flex items-center gap-2">
                <Printer className="size-4 text-primary" /> {reportState} A4 Report Document Preview (Page {currentPage} of 7)
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={generatePdf}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90"
                >
                  {isGenerating ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-muted/30">
              <div className="shadow-2xl bg-white border border-slate-300 rounded-sm">
                {currentPage === 1 && (
                  <div className="w-[180mm] p-6 text-slate-900 text-xs">
                    <p className="font-bold text-lg text-center uppercase py-10">Page 1 — Cover Page ({reportState})</p>
                  </div>
                )}
                {currentPage === 2 && (
                  <div className="w-[180mm] p-6 text-slate-900 text-xs">
                    <p className="font-bold text-lg text-center uppercase py-10">Page 2 — Executive Summary ({reportState})</p>
                  </div>
                )}
                {currentPage === 3 && (
                  <div className="w-[180mm] p-6 text-slate-900 text-xs">
                    <p className="font-bold text-lg text-center uppercase py-10">Page 3 — State &amp; Location Analysis</p>
                  </div>
                )}
                {currentPage === 4 && (
                  <div className="w-[180mm] p-6 text-slate-900 text-xs">
                    <p className="font-bold text-lg text-center uppercase py-10">Page 4 — AI Insights</p>
                  </div>
                )}
                {currentPage === 5 && (
                  <div className="w-[180mm] p-6 text-slate-900 text-xs">
                    <p className="font-bold text-lg text-center uppercase py-10">Page 5 — Model Performance</p>
                  </div>
                )}
                {currentPage === 6 && (
                  <div className="w-[180mm] p-6 text-slate-900 text-xs">
                    <p className="font-bold text-lg text-center uppercase py-10">Page 6 — Dataset Information</p>
                  </div>
                )}
                {currentPage === 7 && (
                  <div className="w-[180mm] p-6 text-slate-900 text-xs">
                    <p className="font-bold text-lg text-center uppercase py-10">Page 7 — Conclusion &amp; Recommendations</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border px-5 py-3 bg-surface text-xs text-muted-foreground">
              <span>Dynamic Filename: <code className="text-primary font-bold">{pdfFilename}</code></span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded border border-border px-2.5 py-1 disabled:opacity-40"
                >
                  Prev Page
                </button>
                <span className="font-bold text-foreground">Page {currentPage} of 7</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(7, p + 1))}
                  disabled={currentPage === 7}
                  className="rounded border border-border px-2.5 py-1 disabled:opacity-40"
                >
                  Next Page
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

