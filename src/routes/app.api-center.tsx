import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  Braces,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Database,
  Globe2,
  Layers,
  Network,
  Play,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { DemoTag, PageHeader, Panel, PanelTitle } from "@/components/lv/panels";
import { API_ENDPOINTS } from "@/lib/lv/data";
import type { ApiEndpoint } from "@/lib/lv/types";

export const Route = createFileRoute("/app/api-center")({
  component: ApiCenterPage,
  head: () => ({
    meta: [
      { title: "API Gateway & Government Systems Integration — LandVision AI" },
      {
        name: "description",
        content:
          "API Architecture, RESTful endpoints catalog, live interactive request console, and government system integration specifications.",
      },
    ],
  }),
});

function ApiCenterPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint>(API_ENDPOINTS[0]!);
  const [copied, setCopied] = useState(false);
  const [testingResponse, setTestingResponse] = useState<string | null>(null);

  const copySample = () => {
    navigator.clipboard.writeText(JSON.stringify(selectedEndpoint.responseSample, null, 2));
    setCopied(true);
    toast.success("JSON response copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const testApi = () => {
    setTestingResponse("Loading response from LandVision AI Engine...");
    setTimeout(() => {
      setTestingResponse(JSON.stringify(selectedEndpoint.responseSample, null, 2));
      toast.success(`200 OK — ${selectedEndpoint.path}`);
    }, 300);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Integration Center & Government Gateway Architecture"
        description="Standardized REST API specifications and integration architecture connecting State Land Records (Bhulekh/Bhoomi), PFMS compensation disbursals, and High Court e-Courts systems."
      >
        <DemoTag />
      </PageHeader>

      {/* INTEGRATION ARCHITECTURE DIAGRAM */}
      <Panel className="border-primary/40 bg-gradient-to-r from-primary/10 via-card to-primary/5">
        <PanelTitle
          title="Government Integration Architecture & Data Flow"
          subtitle="How LandVision AI ingests multi-department telemetry and serves predictive intelligence"
          icon={Network}
          ai
        />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-1 min-w-56 flex-col items-center rounded-xl border border-border bg-card p-3 text-center">
            <Database className="size-6 text-primary mb-1.5" />
            <span className="font-bold text-foreground">Government Systems</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              Land Records (Bhoomi), e-Courts, PFMS Bank DBT, Forest NOC
            </span>
          </div>

          <ArrowRight className="size-5 text-primary hidden lg:block" />

          <div className="flex flex-1 min-w-56 flex-col items-center rounded-xl border border-border bg-card p-3 text-center">
            <ServerCog className="size-6 text-foreground mb-1.5" />
            <span className="font-bold text-foreground">LandVision API Gateway</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              Auth, Rate Limiting, Anomaly Filter, Schema Translation
            </span>
          </div>

          <ArrowRight className="size-5 text-primary hidden lg:block" />

          <div className="flex flex-1 min-w-56 flex-col items-center rounded-xl border border-primary/40 bg-primary/10 p-3 text-center">
            <Sparkles className="size-6 text-primary mb-1.5" />
            <span className="font-bold text-foreground">AI Delay Prediction Engine</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              ML Inference v2.4, SHAP Attribution, Bottleneck Detector
            </span>
          </div>

          <ArrowRight className="size-5 text-primary hidden lg:block" />

          <div className="flex flex-1 min-w-56 flex-col items-center rounded-xl border border-border bg-card p-3 text-center">
            <Globe2 className="size-6 text-foreground mb-1.5" />
            <span className="font-bold text-foreground">Command Center &amp; Alerts</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">
              Decision Dashboards, GIS Layers, SMS/Email Alerts, Interventions
            </span>
          </div>
        </div>
      </Panel>

      {/* API CATALOG & INTERACTIVE CONSOLE */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* ENDPOINTS LIST */}
        <div className="space-y-3 lg:col-span-5">
          <Panel>
            <PanelTitle title="RESTful Endpoints Catalog" icon={Code2} />
            <div className="space-y-2 mt-2">
              {API_ENDPOINTS.map((ep) => {
                const isSelected = selectedEndpoint.path === ep.path;
                return (
                  <button
                    key={ep.path}
                    onClick={() => {
                      setSelectedEndpoint(ep);
                      setTestingResponse(null);
                    }}
                    className={`w-full text-left rounded-xl border p-3 transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-xs"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                            ep.method === "GET"
                              ? "bg-risk-low/20 text-risk-low"
                              : "bg-primary/20 text-primary"
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="font-mono text-xs font-semibold text-foreground">{ep.path}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{ep.category}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">{ep.description}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                          ep.status === "Implemented"
                            ? "bg-risk-low/15 text-risk-low"
                            : "bg-surface border border-border text-muted-foreground"
                        }`}
                      >
                        {ep.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* INTERACTIVE CONSOLE & JSON VIEWER */}
        <div className="space-y-4 lg:col-span-7">
          <Panel>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                      selectedEndpoint.method === "GET"
                        ? "bg-risk-low/20 text-risk-low"
                        : "bg-primary/20 text-primary"
                    }`}
                  >
                    {selectedEndpoint.method}
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground">{selectedEndpoint.path}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{selectedEndpoint.description}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={testApi}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <Play className="size-3.5" /> Test Endpoint
                </button>
                <button
                  onClick={copySample}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-surface"
                >
                  {copied ? <Check className="size-3.5 text-risk-low" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy JSON"}
                </button>
              </div>
            </div>

            {/* LIVE RESPONSE WINDOW */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>Response Body (JSON Payload):</span>
                <span className="font-mono text-[10px] text-risk-low">HTTP 200 OK</span>
              </div>
              <pre className="max-h-96 overflow-auto rounded-xl border border-border bg-surface p-4 font-mono text-xs text-foreground leading-relaxed">
                {testingResponse ?? JSON.stringify(selectedEndpoint.responseSample, null, 2)}
              </pre>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
