import type { ClaimSeverity, RiskLevel } from "./types";

export function clampScore(score: number): number {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreToRiskLevel(score: number): RiskLevel {
  const clamped = clampScore(score);
  if (clamped >= 85) return "Critical";
  if (clamped >= 60) return "High";
  if (clamped >= 30) return "Moderate";
  return "Low";
}

export function riskLevelToColor(level: RiskLevel): string {
  switch (level) {
    case "Low":
      return "#34d399";
    case "Moderate":
      return "#fbbf24";
    case "High":
      return "#fb923c";
    case "Critical":
      return "#f87171";
    default:
      return "#94a3b8";
  }
}

export function riskLevelToTextClass(level: RiskLevel): string {
  switch (level) {
    case "Low":
      return "text-risk-low";
    case "Moderate":
      return "text-risk-moderate";
    case "High":
      return "text-risk-high";
    case "Critical":
      return "text-risk-critical";
    default:
      return "text-slate-300";
  }
}

export function riskLevelToBgClass(level: RiskLevel): string {
  switch (level) {
    case "Low":
      return "bg-risk-low/15 border-risk-low/40";
    case "Moderate":
      return "bg-risk-moderate/15 border-risk-moderate/40";
    case "High":
      return "bg-risk-high/15 border-risk-high/40";
    case "Critical":
      return "bg-risk-critical/15 border-risk-critical/40";
    default:
      return "bg-slate-500/15 border-slate-500/40";
  }
}

export function severityToColor(severity: ClaimSeverity): string {
  switch (severity) {
    case "low":
      return "#facc15";
    case "medium":
      return "#fb923c";
    case "high":
      return "#f87171";
    default:
      return "#94a3b8";
  }
}

export function severityToLabel(severity: ClaimSeverity): string {
  switch (severity) {
    case "low":
      return "Low Severity";
    case "medium":
      return "Medium Severity";
    case "high":
      return "High Severity";
    default:
      return "Unknown";
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}\u2026`;
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function isLikelyUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
