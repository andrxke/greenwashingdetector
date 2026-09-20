export type RiskLevel = "Low" | "Moderate" | "High" | "Critical";

export type ClaimSeverity = "low" | "medium" | "high";
export type EvidenceStatus = "supported" | "contradicted" | "insufficient_evidence";

export type InputMode = "url" | "pdf" | "text";

export interface FlaggedClaim {
  originalText: string;
  critiqueText: string;
  severity: ClaimSeverity;
  regulationTip: string;
  evidenceStatus: EvidenceStatus;
  confidence: number;
}

export interface AuditResult {
  overallScore: number;
  riskLevel: RiskLevel;
  flaggedClaims: FlaggedClaim[];
  missingMetrics: string[];
  remediatedCopy: string;
  sourceSummary: string;
  analysisEngine: "llm" | "heuristic";
}

export interface AuditRequestMeta {
  mode: InputMode;
  sourceLabel: string;
}

export interface AuditApiError {
  error: string;
  detail?: string;
}
