import { AlertTriangle, CheckCircle2, ShieldAlert, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import type { RiskCategory } from "@/lib/lv/types";
import { cn } from "@/lib/utils";

const styles: Record<RiskCategory, { bg: string; text: string; ring: string; stroke: string }> = {
  LOW: {
    bg: "bg-risk-low/12",
    text: "text-risk-low",
    ring: "ring-risk-low/40",
    stroke: "var(--risk-low)",
  },
  MEDIUM: {
    bg: "bg-risk-medium/12",
    text: "text-risk-medium",
    ring: "ring-risk-medium/40",
    stroke: "var(--risk-medium)",
  },
  HIGH: {
    bg: "bg-risk-high/12",
    text: "text-risk-high",
    ring: "ring-risk-high/40",
    stroke: "var(--risk-high)",
  },
  CRITICAL: {
    bg: "bg-risk-critical/16",
    text: "text-risk-critical",
    ring: "ring-risk-critical/50",
    stroke: "var(--risk-critical)",
  },
};

const icons: Record<RiskCategory, typeof AlertTriangle> = {
  LOW: CheckCircle2,
  MEDIUM: AlertTriangle,
  HIGH: TriangleAlert,
  CRITICAL: ShieldAlert,
};

export function riskStyle(category: RiskCategory) {
  return styles[category];
}

export function RiskBadge({
  category,
  score,
  className,
}: {
  category: RiskCategory;
  score?: number | undefined;
  className?: string | undefined;
}) {
  const s = styles[category];
  const Icon = icons[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1",
        s.bg,
        s.text,
        s.ring,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {score !== undefined ? `${score} / 100 — ` : ""}
      {category}
    </span>
  );
}

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export function RiskGauge({
  score,
  category,
  size = 190,
}: {
  score: number;
  category: RiskCategory;
  size?: number;
}) {
  const animated = useCountUp(score);
  const s = styles[category];
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  const offset = c - (animated / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`Risk score ${score} of 100, ${category}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={12} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={s.stroke}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 200ms linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold text-foreground">{animated}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
        <span className={cn("mt-1 text-xs font-semibold tracking-wide", s.text)}>{category}</span>
      </div>
    </div>
  );
}
