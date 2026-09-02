import { useEffect, useState } from "react";

const INDIA_PATH =
  "M203 22 L232 34 L258 30 L276 44 L300 40 L316 62 L342 70 L356 92 L340 108 L316 106 L300 122 L318 140 L330 168 L318 196 L300 232 L286 268 L268 306 L250 348 L232 392 L214 428 L198 404 L184 366 L168 322 L150 286 L128 252 L108 218 L92 186 L74 158 L58 130 L52 104 L70 88 L96 80 L118 62 L146 52 L172 34 Z";

interface Marker {
  x: number;
  y: number;
  risk: "low" | "medium" | "high" | "critical";
  label: string;
}

const MARKERS: Marker[] = [
  { x: 258, y: 240, risk: "critical", label: "Khordha, Odisha — NH-16 Expansion" },
  { x: 168, y: 262, risk: "high", label: "Raigad, Maharashtra — Rail Corridor" },
  { x: 130, y: 210, risk: "medium", label: "Bharuch, Gujarat — Industrial Zone" },
  { x: 122, y: 150, risk: "low", label: "Jodhpur, Rajasthan — Transmission Corridor" },
  { x: 196, y: 288, risk: "high", label: "Rangareddy, Telangana — Urban Infrastructure" },
  { x: 214, y: 148, risk: "medium", label: "Lucknow, Uttar Pradesh — Ring Road" },
  { x: 200, y: 352, risk: "low", label: "Madurai, Tamil Nadu — Bypass" },
  { x: 268, y: 178, risk: "critical", label: "Howrah, West Bengal — Freight Corridor" },
  { x: 176, y: 196, risk: "medium", label: "Bhopal, Madhya Pradesh — Metro Corridor" },
];

const COLOR: Record<Marker["risk"], string> = {
  low: "var(--risk-low)",
  medium: "var(--risk-medium)",
  high: "var(--risk-high)",
  critical: "var(--risk-critical)",
};

const CORRIDORS = [
  "M122 150 L176 196 L258 240",
  "M168 262 L196 288 L200 352",
  "M214 148 L268 178",
  "M176 196 L130 210",
];

export function HeroMap() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((i) => (i + 1) % MARKERS.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative aspect-square w-full max-w-[560px]">
      <div className="grid-backdrop absolute inset-0 rounded-3xl opacity-60" aria-hidden />
      <div
        className="animate-scan pointer-events-none absolute inset-x-0 top-0 h-24 rounded-3xl"
        style={{
          background:
            "linear-gradient(to bottom, transparent, color-mix(in oklab, var(--primary) 16%, transparent), transparent)",
        }}
        aria-hidden
      />
      <svg
        viewBox="0 0 400 460"
        className="relative h-full w-full"
        role="img"
        aria-label="Map of India showing monitored land acquisition projects by risk level"
      >
        <defs>
          <linearGradient id="landFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--ai)" stopOpacity="0.12" />
          </linearGradient>
          <clipPath id="landClip">
            <path d={INDIA_PATH} />
          </clipPath>
        </defs>

        <path d={INDIA_PATH} fill="url(#landFill)" stroke="var(--primary)" strokeWidth="1.4" />

        {/* Cadastral parcel grid clipped to the landmass */}
        <g clipPath="url(#landClip)" opacity="0.5">
          {Array.from({ length: 24 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 18}
              y1="0"
              x2={i * 18}
              y2="460"
              stroke="var(--primary)"
              strokeWidth="0.4"
              opacity="0.35"
            />
          ))}
          {Array.from({ length: 26 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1="0"
              y1={i * 18}
              x2="400"
              y2={i * 18}
              stroke="var(--primary)"
              strokeWidth="0.4"
              opacity="0.35"
            />
          ))}
          <rect x="238" y="222" width="46" height="34" fill="var(--risk-critical)" opacity="0.22" />
          <rect x="150" y="248" width="40" height="28" fill="var(--risk-high)" opacity="0.18" />
          <rect x="108" y="196" width="38" height="26" fill="var(--risk-medium)" opacity="0.16" />
        </g>

        {/* Infrastructure corridors */}
        {CORRIDORS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="1"
            strokeDasharray="5 7"
            opacity="0.75"
            className="animate-dash"
          />
        ))}

        {MARKERS.map((m, i) => (
          <g key={m.label}>
            <circle
              cx={m.x}
              cy={m.y}
              r="5"
              fill={COLOR[m.risk]}
              opacity={i === active ? 0.35 : 0.15}
              style={{ transformOrigin: `${m.x}px ${m.y}px` }}
              className={i === active ? "animate-ping" : undefined}
            />
            <circle cx={m.x} cy={m.y} r="3.4" fill={COLOR[m.risk]} />
            <circle cx={m.x} cy={m.y} r="6.5" fill="none" stroke={COLOR[m.risk]} strokeWidth="0.8" opacity="0.6" />
          </g>
        ))}
      </svg>

      <div className="panel absolute bottom-2 left-2 max-w-[70%] px-3 py-2">
        <p className="text-[10px] tracking-widest text-muted-foreground uppercase">Live monitoring · demo</p>
        <p className="mt-0.5 text-xs font-medium text-foreground">{MARKERS[active]!.label}</p>
      </div>
      <div className="panel absolute top-2 right-2 space-y-1 px-3 py-2 text-[10px]">
        {(["low", "medium", "high", "critical"] as const).map((r) => (
          <div key={r} className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ background: COLOR[r] }} aria-hidden />
            <span className="uppercase">{r} risk</span>
          </div>
        ))}
      </div>
    </div>
  );
}
