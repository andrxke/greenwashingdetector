import type { AuditResult } from "../types";
import { clampScore, scoreToRiskLevel, truncateText } from "../utils";
import { runHeuristicAudit } from "./heuristicAuditor";
import { SYSTEM_PROMPT, buildUserPrompt, extractAndValidateJson } from "./promptSchema";

interface ChatCompletionChoice {
  message?: { content?: string };
  finish_reason?: string;
}

interface ChatCompletionResponse {
  choices?: ChatCompletionChoice[];
}

function isAiConfigured(): boolean {
  return Boolean(process.env.AI_ENDPOINT_URL && process.env.AI_API_KEY && process.env.AI_MODEL);
}

async function callLlmEndpoint(sourceLabel: string, content: string): Promise<string> {
  const endpoint = process.env.AI_ENDPOINT_URL as string;
  const apiKey = process.env.AI_API_KEY as string;
  const model = process.env.AI_MODEL as string;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(sourceLabel, content) }
      ],
      temperature: 0.2,
      max_tokens: 5000,
      response_format: { type: "json_object" }
    }),
    signal: AbortSignal.timeout(45000)
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(`AI endpoint returned HTTP ${response.status}: ${truncateText(bodyText, 300)}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  if (data.choices?.[0]?.finish_reason === "length") {
    throw new Error("AI endpoint truncated the structured response before completion.");
  }
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("AI endpoint response did not contain any message content.");
  }

  return text;
}

/**
 * Generates a structured greenwashing audit for the given content.
 *
 * If AI_ENDPOINT_URL / AI_API_KEY / AI_MODEL are configured, this calls the
 * configured OpenAI-compatible LLM endpoint (Baseten, Modal, or OpenAI itself)
 * and validates the JSON response against the strict schema. If the endpoint
 * is not configured, the call fails, or the response fails schema validation,
 * this transparently falls back to the deterministic heuristic auditor so the
 * API always returns a complete, valid result.
 */
export async function generateAudit(sourceLabel: string, content: string): Promise<AuditResult> {
  if (!isAiConfigured()) {
    return runHeuristicAudit(content);
  }

  try {
    const rawResponse = await callLlmEndpoint(sourceLabel, content);
    const parsed = extractAndValidateJson(rawResponse, content);

    if (!parsed) {
      console.warn("[aiClient] LLM response failed schema validation, falling back to heuristic auditor.");
      return runHeuristicAudit(content);
    }

    const overallScore = clampScore(parsed.overallScore);
    return {
      overallScore,
      riskLevel: scoreToRiskLevel(overallScore),
      flaggedClaims: parsed.flaggedClaims,
      missingMetrics: parsed.missingMetrics,
      remediatedCopy: parsed.remediatedCopy,
      sourceSummary: truncateText(content, 400),
      analysisEngine: "llm"
    };
  } catch (err) {
    console.warn(
      `[aiClient] LLM call failed (${err instanceof Error ? err.message : "unknown error"}), falling back to heuristic auditor.`
    );
    return runHeuristicAudit(content);
  }
}
