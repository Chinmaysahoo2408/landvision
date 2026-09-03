import React from "react";
import type { LanguageCode } from "@/lib/i18n";

export interface CountryFlagProps {
  country?: string;
  language?: LanguageCode | string;
  className?: string;
  width?: number | string;
  height?: number | string;
  title?: string;
  rounded?: boolean;
}

/**
 * Reusable high-precision vector SVG for the Indian National Flag (Tiranga).
 * Includes the 24-spoke Ashoka Chakra with central hub and outer rim.
 */
export function IndianFlagSvg({
  width = 22,
  height = 15,
  className = "",
  title = "National Flag of India",
}: {
  width?: number | string;
  height?: number | string;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 16"
      width={width}
      height={height}
      className={`inline-block shrink-0 rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.15)] ring-1 ring-black/10 dark:ring-white/20 overflow-hidden ${className}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {/* Top Stripe: India Saffron (Kesari) */}
      <rect width="24" height="5.333" fill="#FF9933" />
      {/* Middle Stripe: White */}
      <rect y="5.333" width="24" height="5.334" fill="#FFFFFF" />
      {/* Bottom Stripe: India Green */}
      <rect y="10.667" width="24" height="5.333" fill="#138808" />

      {/* Ashoka Chakra: Centered at (12, 8) */}
      <g transform="translate(12, 8)">
        {/* Outer Ring */}
        <circle r="2.2" fill="none" stroke="#000080" strokeWidth="0.32" />
        {/* Central Hub */}
        <circle r="0.45" fill="#000080" />
        {/* 24 Spokes (12 lines across diameter rotated in 15-degree steps) */}
        {[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165].map((angle) => (
          <line
            key={angle}
            x1="0"
            y1="-2.1"
            x2="0"
            y2="2.1"
            stroke="#000080"
            strokeWidth="0.22"
            transform={`rotate(${angle})`}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * Country-to-flag registry mapping.
 * Automatically resolves language codes (or regional country codes) to appropriate flags.
 */
const COUNTRY_MAP: Record<string, string> = {
  // Languages mapped to India
  en: "IN",
  hi: "IN",
  or: "IN",
  bn: "IN",
  te: "IN",
  ta: "IN",
  mr: "IN",
  gu: "IN",
  kn: "IN",
  ml: "IN",
  pa: "IN",
  ur: "IN",
  as: "IN",
  in: "IN",
  india: "IN",
};

/**
 * Reusable dynamic Country/Language Flag component.
 * Supports configurable dimensions, dynamic language mapping, and fallback.
 */
export function CountryFlag({
  country = "IN",
  language,
  className = "",
  width = 22,
  height = 15,
  title,
}: CountryFlagProps) {
  const targetCode = (language ? COUNTRY_MAP[language.toLowerCase()] : COUNTRY_MAP[country.toLowerCase()]) || country.toUpperCase();
  const label = title || (targetCode === "IN" ? "India (IN)" : targetCode);

  switch (targetCode) {
    case "IN":
      return (
        <IndianFlagSvg
          width={width}
          height={height}
          className={className}
          title={label}
        />
      );
    default:
      return (
        <IndianFlagSvg
          width={width}
          height={height}
          className={className}
          title={label}
        />
      );
  }
}

export default CountryFlag;
