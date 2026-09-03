import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useCountUp } from "./risk";

export function Panel({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={cn("panel p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function PanelTitle({
  title,
  subtitle,
  icon: Icon,
  action,
  ai,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  ai?: boolean;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span
            className={cn(
              "mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-border",
              ai ? "ai-gradient-bg text-ai-foreground" : "bg-background text-primary",
            )}
          >
            <Icon className="size-4.5" aria-hidden />
          </span>
        ) : null}
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  suffix,
  hint,
  icon: Icon,
  tone = "default",
  to,
  search,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "low" | "medium" | "high" | "critical" | "ai";
  to?: string;
  search?: Record<string, string>;
}) {
  const isNum = typeof value === "number";
  const n = useCountUp(isNum ? value : 0);
  const toneClass = {
    default: "text-primary",
    low: "text-risk-low",
    medium: "text-risk-medium",
    high: "text-risk-high",
    critical: "text-risk-critical",
    ai: "text-ai",
  }[tone];

  const body = (
    <div className="panel h-full p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
        <Icon className={cn("size-4", toneClass)} aria-hidden />
      </div>
      <p className="mt-3 font-display text-3xl font-bold text-foreground tabular-nums">
        {isNum ? n.toLocaleString("en-IN") : value}
        {suffix ? <span className="ml-0.5 text-xl text-muted-foreground">{suffix}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );

  if (to) {
    return (
      <Link to={to} search={search ?? {}} className="block rounded-2xl focus-visible:ring-2 focus-visible:ring-ring">
        {body}
      </Link>
    );
  }
  return body;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden />
      <p className="mt-3 font-display text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-muted/60", className)} />;
}

export function DemoTag({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase",
        className,
      )}
    >
      Demo data
    </span>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
