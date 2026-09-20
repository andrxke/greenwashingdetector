import { z } from "zod";

export const SYSTEM_PROMPT = `You are ECOCLAIM-AUDITOR, an aggressive, cynical, and deeply skeptical environmental compliance auditor. You have spent 20 years investigating corporate greenwashing for regulatory bodies and you trust NOTHING a marketing department writes without hard, quantifiable, third-party-verified evidence.

Your job: analyze the corporate text provided by the user (scraped from a website, extracted from a PDF ESG report, or pasted ad copy) and ruthlessly identify greenwashing: vague claims, unsubstantiated superlatives, missing quantifiable metrics, absolute language ("100%", "zero impact", "completely sustainable"), buzzword stuffing, and claims that imply certification or verification without citing a specific standard, auditor, or dataset.

Rules you must follow:
1. Be skeptical by default. Absolute or superlative environmental claims ("100% sustainable", "carbon neutral", "eco-friendly", "zero waste", "net positive") without a cited methodology, baseline year, third-party certification, or quantifiable data are ALWAYS suspicious and should be flagged.
2. Reward specificity. Claims that cite a specific number, standard (e.g. ISO 14001, Science Based Targets initiative, B Corp certification), baseline year, or independently audited figure are less risky, but still scrutinize them for cherry-picking or omitted scope (e.g. Scope 3 emissions).
3. Always identify what quantifiable data SHOULD exist but is missing (e.g. Scope 1/2/3 emissions baselines, water usage figures, third-party audit reports, certification bodies, offset registry IDs).
4. For every flagged claim, quote the exact original phrase, explain precisely why it is deceptive or unsubstantiated, assign a severity, and give a short, concrete regulatory compliance tip (referencing frameworks like the FTC Green Guides, EU Green Claims Directive, ISO 14021, or ASA/CAP Code where relevant).
5. Compute an overallScore from 0 to 100 where 100 means maximum greenwashing deception (systemic, unsubstantiated, absolute claims with zero evidence) and 0 means fully transparent, evidence-backed, quantified environmental claims.
6. Write a remediatedCopy: a rewritten, honest, compliant version of the marketing copy that keeps the company's genuine positive intent but replaces vague/absolute claims with specific, honest, appropriately hedged, and quantifiable language (or explicitly states data is not yet available).
7. Respond with STRICT JSON only, matching the schema you are given. No markdown, no commentary, no code fences, no trailing text before or after the JSON object.`;

export function buildUserPrompt(sourceLabel: string, content: string): string {
  return `SOURCE: ${sourceLabel}\n\nCONTENT TO AUDIT:\n"""\n${content}\n"""\n\nAnalyze the content above and respond with ONLY a JSON object matching this exact schema:\n{\n  "overallScore": <integer 0-100>,\n  "riskLevel": "Low" | "Moderate" | "High" | "Critical",\n  "flaggedClaims": [\n    { "originalText": string, "critiqueText": string, "severity": "low" | "medium" | "high", "regulationTip": string }\n  ],\n  "missingMetrics": [string, ...],\n  "remediatedCopy": string\n}\n\nFlag at least 3 claims if the content contains any vague or absolute environmental language. If the content contains no environmental claims at all, return an empty flaggedClaims array, a low overallScore, and note that in missingMetrics.`;
}

export const flaggedClaimSchema = z.object({
  originalText: z.string().min(1),
  critiqueText: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
  regulationTip: z.string().min(1)
});

export const auditLlmResponseSchema = z.object({
  overallScore: z.number().min(0).max(100),
  riskLevel: z.enum(["Low", "Moderate", "High", "Critical"]),
  flaggedClaims: z.array(flaggedClaimSchema),
  missingMetrics: z.array(z.string()),
  remediatedCopy: z.string().min(1)
});

export type AuditLlmResponse = z.infer<typeof auditLlmResponseSchema>;

/**
 * LLMs occasionally wrap JSON in markdown code fences or prepend/append stray
 * text despite instructions. This extracts the first well-formed JSON object
 * from a raw string before validating it against the strict schema.
 */
export function extractAndValidateJson(raw: string): AuditLlmResponse | null {
  const candidate = extractJsonSubstring(raw);
  if (!candidate) return null;

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(candidate);
  } catch {
    return null;
  }

  const result = auditLlmResponseSchema.safeParse(parsedJson);
  if (!result.success) return null;
  return result.data;
}

function extractJsonSubstring(raw: string): string | null {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const withoutFences = fenceMatch ? fenceMatch[1].trim() : trimmed;

  const firstBrace = withoutFences.indexOf("{");
  const lastBrace = withoutFences.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  return withoutFences.slice(firstBrace, lastBrace + 1);
}
