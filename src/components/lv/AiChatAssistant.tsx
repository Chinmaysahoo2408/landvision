import React, { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Square,
  AlertCircle,
  Database,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Globe2,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useLV } from "@/lib/lv/store";
import { useTranslation, type LanguageCode } from "@/lib/i18n";
import { aiChatServerFn } from "@/lib/server/aiChatServerFn";
import type {
  AiChatMessage,
  SelectedProjectContext,
  DatasetSummaryContext,
  ModelMetricsContext,
} from "@/lib/server/openaiChatProxy";

export interface AiChatAssistantProps {
  selectedProject?: SelectedProjectContext | null;
  datasetContext?: DatasetSummaryContext | null;
  modelContext?: ModelMetricsContext | null;
  initialPrompt?: string;
  className?: string;
  isFloating?: boolean;
  onClose?: () => void;
}

const DEFAULT_SUGGESTIONS = [
  "Summarize the current dataset",
  "Which projects are at highest risk?",
  "What are the main causes of delay?",
  "Explain the current model performance",
  "Why is this project high risk?",
  "What should the administration prioritize?",
  "Show projects with pending forest clearance",
  "Explain today's AI delay predictions",
];

const AVAILABLE_LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "or", label: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ur", label: "Urdu", native: "اردو" },
  { code: "as", label: "Assamese", native: "অসমীয়া" },
];

function FormattedAiResponse({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-xs leading-relaxed text-foreground">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header 3 / Section Title
        if (trimmed.startsWith("### ")) {
          const title = trimmed.replace("### ", "").trim();
          return (
            <div key={idx} className="pt-2 pb-0.5 border-b border-border/40">
              <span className="font-display font-bold text-xs text-primary flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary" />
                {renderFormattedInline(title)}
              </span>
            </div>
          );
        }

        // Header 2 / Big Title
        if (trimmed.startsWith("## ")) {
          const title = trimmed.replace("## ", "").trim();
          return (
            <div key={idx} className="pt-2.5 pb-1">
              <span className="font-display font-extrabold text-sm text-foreground">
                {renderFormattedInline(title)}
              </span>
            </div>
          );
        }

        // Bullet point
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const itemText = trimmed.replace(/^[-*]\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="text-primary mt-1 shrink-0 font-bold">•</span>
              <div className="flex-1">{renderFormattedInline(itemText)}</div>
            </div>
          );
        }

        // Numbered item
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
        if (numberedMatch) {
          const num = numberedMatch[1] || "1";
          const text = numberedMatch[2] || "";
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="inline-grid size-4 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary shrink-0 mt-0.5">
                {num}
              </span>
              <div className="flex-1">{renderFormattedInline(text)}</div>
            </div>
          );
        }

        // Standard line
        return (
          <p key={idx} className="leading-relaxed">
            {renderFormattedInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

function renderFormattedInline(text: string): React.ReactNode {
  // Split by bold (**text**)
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={i} className="font-bold text-foreground">
          {boldText}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      const codeText = part.slice(1, -1);
      return (
        <code key={i} className="rounded bg-muted px-1 py-0.5 text-[11px] font-mono text-primary font-semibold">
          {codeText}
        </code>
      );
    }
    return part;
  });
}

export function AiChatAssistant({
  selectedProject,
  datasetContext,
  modelContext,
  initialPrompt,
  className = "",
  isFloating = false,
  onClose,
}: AiChatAssistantProps) {
  const { session, datasetConfig, activeModel } = useLV();
  const { language, setLanguage, tStr } = useTranslation();

  const [isOpen, setIsOpen] = useState(!isFloating);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      content: selectedProject
        ? `Hello Officer. I am connected to the **${selectedProject.name}** context and the platform's **1,757-record ML dataset**.\n\nHow can I assist your statutory acquisition review today?`
        : `Hello Officer. I am the **LandVision AI Decision-Support Assistant** connected to the active **1,757-record acquisition dataset** and **XGBoost v2.4 model**.\n\nAsk me about dataset statistics, risk predictions, delay drivers, or select a project for deep-dive analysis.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<"analyzing" | "generating">("analyzing");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeContextMode, setActiveContextMode] = useState<"project" | "dataset" | "model">(
    selectedProject ? "project" : "dataset",
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  // Handle initial pre-filled prompt trigger
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim().length > 0) {
      setIsOpen(true);
      sendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  // Update context mode when project changes
  useEffect(() => {
    if (selectedProject) {
      setActiveContextMode("project");
    }
  }, [selectedProject]);

  const fallbackDatasetContext: DatasetSummaryContext = datasetContext || {
    datasetName: datasetConfig?.filename || "landvision_ml_train_1757.csv",
    totalRecords: datasetConfig?.totalRows || 1757,
    totalColumns: datasetConfig?.totalColumns || 14,
    targetColumn: "Overall_Delay",
    avgDelayDays: 184,
    highRiskCount: 184,
    criticalCount: 42,
    legalDisputesCount: 412,
    forestClearancePendingCount: 328,
    topDelayedState: "Odisha & Maharashtra",
    lastUpdated: datasetConfig?.lastUpdated || "03 Sep 2026",
  };

  const fallbackModelContext: ModelMetricsContext = modelContext || {
    modelName: activeModel?.modelName || "XGBoost & Random Forest Ensemble",
    version: activeModel?.version || "v2.4",
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
    lastTrainedDate: activeModel?.lastTrained || "03 Sep 2026",
  };

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: AiChatMessage = { role: "user", content: query, timestamp: userTimestamp };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setLoadingPhase(selectedProject ? "analyzing" : "generating");

    try {
      const response = await aiChatServerFn({
        data: {
          messages: updatedMessages,
          projectContext: activeContextMode === "project" ? (selectedProject ?? null) : null,
          datasetContext: fallbackDatasetContext,
          modelContext: fallbackModelContext,
          language,
          userRole: session?.role || "ADMIN",
          isAuthenticated: Boolean(session),
        },
      });

      if (response && response.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        toast.error(response?.error || "Unable to generate AI response.");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ **Error Processing Request:** ${
              response?.reply || "Unable to connect to the secure AI decision engine. Please verify your session."
            }`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reach AI service.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ **Connection Timeout:** The AI server proxy is momentarily unavailable. Ground-truth ML telemetry remains active in the platform dashboard.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleCopy = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    toast.success("AI response copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: `Conversation reset. How can I assist with your land acquisition monitoring?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    toast.info("Conversation cleared.");
  };

  // IF FLOATING AND COLLAPSED: RENDER SLEEK FLOATING TRIGGER BUTTON
  if (isFloating && !isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 rounded-full border-2 border-primary/40 bg-card/95 px-4 py-3 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-[var(--shadow-glow)] cursor-pointer"
        >
          <div className="relative">
            <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform group-hover:rotate-12">
              <Sparkles className="size-5" />
            </span>
            <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-card animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-card" />
          </div>
          <div className="text-left pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-tight text-foreground">
                AI Decision Assistant
              </span>
              <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                1,757 Records
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground font-medium">
              Click to ask questions & predict delays
            </div>
          </div>
        </button>
      </div>
    );
  }

  const containerClasses = isFloating
    ? `fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl border-2 border-primary/40 bg-card/98 shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
        isExpanded
          ? "w-[92vw] sm:w-[620px] h-[80vh] max-h-[780px]"
          : "w-[92vw] sm:w-[460px] h-[560px]"
      }`
    : `flex flex-col rounded-2xl border border-primary/30 bg-card shadow-xl backdrop-blur-md overflow-hidden transition-all ${
        isExpanded ? "h-[740px]" : "h-[580px]"
      } ${className}`;

  return (
    <div className={containerClasses}>
      {/* CHAT HEADER */}
      <div className="flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <Bot className="size-4.5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-xs font-bold text-foreground tracking-tight">
                LandVision AI Decision Assistant
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">
              Connected to XGBoost v2.4 & 1,757 Records
            </p>
          </div>
        </div>

        {/* HEADER CONTROLS (LANGUAGE SELECTOR + TOOLS) */}
        <div className="flex items-center gap-1.5">
          {/* LANGUAGE PICKER DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu((v) => !v)}
              className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-bold text-foreground hover:bg-muted transition-colors"
              title="Change Chat Language"
            >
              <Globe2 className="size-3 text-primary" />
              <span>{language.toUpperCase()}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-border bg-card p-1 shadow-xl max-h-64 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-bold uppercase text-muted-foreground border-b border-border/50">
                  Select Chat Language
                </div>
                {AVAILABLE_LANGUAGES.map((langItem) => (
                  <button
                    key={langItem.code}
                    type="button"
                    onClick={() => {
                      setLanguage(langItem.code);
                      setShowLangMenu(false);
                      toast.success(`Language set to ${langItem.label} (${langItem.native})`);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                      language === langItem.code
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span>{langItem.label}</span>
                    <span className="text-[11px] opacity-75">{langItem.native}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleClearChat}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={isExpanded ? "Minimize size" : "Expand size"}
          >
            {isExpanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
          {isFloating ? (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Minimize chat to corner"
            >
              <X className="size-4" />
            </button>
          ) : onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Close chat"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* CONTEXT SELECTOR PILL BAR */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-1.5 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
            Context:
          </span>
          <div className="flex items-center gap-1 shrink-0">
            {selectedProject && (
              <button
                type="button"
                onClick={() => setActiveContextMode("project")}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                  activeContextMode === "project"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                <Layers className="size-3" />
                <span className="truncate max-w-32">{selectedProject.name}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveContextMode("dataset")}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                activeContextMode === "dataset"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              <Database className="size-3" />
              <span>Dataset (1,757)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveContextMode("model")}
              className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                activeContextMode === "model"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              <Sparkles className="size-3" />
              <span>ML v2.4</span>
            </button>
          </div>
        </div>
      </div>

      {/* CHAT MESSAGES BODY */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-in fade-in`}
            >
              <div
                className={`relative max-w-[90%] rounded-2xl p-3.5 shadow-xs leading-relaxed ${
                  isUser
                    ? "bg-primary text-primary-foreground font-medium rounded-br-xs"
                    : "bg-surface border border-border text-foreground rounded-bl-xs space-y-1.5"
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between pb-1 border-b border-border/50 text-[10px] text-muted-foreground font-semibold">
                    <span className="flex items-center gap-1 text-primary">
                      <Sparkles className="size-3" /> Grounded Analysis ({language.toUpperCase()})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(m.content, idx)}
                      className="inline-flex items-center gap-1 hover:text-foreground cursor-pointer"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="size-3 text-emerald-500" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" /> Copy
                        </>
                      )}
                    </button>
                  </div>
                )}

                {isUser ? (
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                ) : (
                  <FormattedAiResponse content={m.content} />
                )}

                <div
                  className={`mt-1 text-right text-[9px] ${
                    isUser ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {/* LOADING STATE */}
        {isLoading && (
          <div className="flex flex-col items-start animate-in fade-in">
            <div className="max-w-[85%] rounded-2xl rounded-bl-xs bg-surface border border-primary/30 p-3.5 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <RefreshCw className="size-3.5 animate-spin" />
                <span>
                  {loadingPhase === "analyzing"
                    ? "Analyzing corridor risk & legal metrics…"
                    : "Synthesizing statutory recommendations…"}
                </span>
              </div>
              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-primary/20">
                <div className="h-full w-full bg-primary animate-pulse" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* SUGGESTED PROMPT CHIPS */}
      <div className="border-t border-border bg-surface/50 p-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[10px] font-bold text-muted-foreground uppercase shrink-0">
            Suggested:
          </span>
          {DEFAULT_SUGGESTIONS.slice(0, 4).map((sugg) => (
            <button
              key={sugg}
              type="button"
              onClick={() => sendMessage(sugg)}
              className="shrink-0 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-foreground transition-all cursor-pointer"
            >
              {sugg}
            </button>
          ))}
        </div>
      </div>

      {/* INPUT BAR */}
      <div className="border-t border-border bg-card p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedProject
                ? `Ask about ${selectedProject.name} in ${language.toUpperCase()}...`
                : `Ask in ${language.toUpperCase()} about dataset delays, risk scores, or model...`
            }
            className="flex-1 max-h-24 resize-none rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-all"
          />
          <button
            type="button"
            disabled={!input.trim() || isLoading}
            onClick={() => sendMessage()}
            className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
          >
            {isLoading ? <Square className="size-3.5 fill-current" /> : <Send className="size-4" />}
          </button>
        </div>

        {/* DATA TRANSPARENCY FOOTER */}
        <div className="mt-2 flex flex-wrap items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="size-3 text-emerald-500" />
            Source: LandVision ML Telemetry ({fallbackDatasetContext.datasetName})
          </span>
          <span>Shift+Enter for newline · Enter to send</span>
        </div>
      </div>
    </div>
  );
}
