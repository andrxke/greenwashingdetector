import type { AuditResult, ClaimSeverity, FlaggedClaim } from "../types";
import { clampScore, scoreToRiskLevel, truncateText } from "../utils";

interface ClaimPattern {
  regex: RegExp;
  severity: ClaimSeverity;
  critique: (matchText: string) => string;
  regulationTip: string;
  weight: number;
}

const CLAIM_PATTERNS: ClaimPattern[] = [
  {
    regex: /\b100%\s*(sustainable|eco[- ]friendly|recycl\w*|carbon\s*neutral|natural|green|renewable|biodegradable)\b/gi,
    severity: "high",
    critique: (m) =>
      `The absolute claim "${m}" asserts total, unqualified environmental performance. Absolute quantifiers like "100%" require rigorous, independently verifiable proof covering the entire lifecycle and supply chain - no such evidence is provided here.`,
    regulationTip:
      "FTC Green Guides \u00a7260.4: unqualified general environmental benefit claims are deceptive unless substantiated for the entire product lifecycle.",
    weight: 14
  },
  {
    regex: /\b(zero[- ]waste|zero\s*impact|zero\s*emissions?)\b/gi,
    severity: "high",
    critique: (m) =>
      `"${m}" implies a complete absence of environmental impact. Without disclosed measurement methodology, boundary definitions, and third-party verification, this is an unsubstantiated absolute claim.`,
    regulationTip:
      "EU Green Claims Directive: claims of zero impact must be backed by a recognized life-cycle assessment methodology.",
    weight: 13
  },
  {
    regex: /\bcarbon[- ]neutral(ity)?\b/gi,
    severity: "medium",
    critique: (m) =>
      `"${m}" is claimed without specifying whether this relies on offsets, the offset registry used, the baseline year, or whether Scope 3 emissions are included - a common greenwashing gap.`,
    regulationTip:
      "ISO 14021 / ASA CAP Code: carbon neutrality claims must disclose whether they rely on offsetting and specify the accounting standard used.",
    weight: 10
  },
  {
    regex: /\bnet[- ]zero\b/gi,
    severity: "medium",
    critique: (m) =>
      `"${m}" is stated without a target date, interim milestones, or a Science Based Targets initiative (SBTi) validated pathway, making it difficult to verify or hold accountable.`,
    regulationTip:
      "SBTi Corporate Net-Zero Standard: net-zero claims should reference validated targets, baseline year, and interim reduction milestones.",
    weight: 9
  },
  {
    regex: /\b(eco[- ]friendly|earth[- ]friendly|planet[- ]friendly|nature[- ]friendly)\b/gi,
    severity: "medium",
    critique: (m) =>
      `"${m}" is a vague, undefined marketing term with no legal or scientific definition. It gives consumers a positive impression without any measurable basis.`,
    regulationTip:
      "FTC Green Guides \u00a7260.3: vague terms like 'eco-friendly' are likely to convey unsubstantiated general environmental benefits and should be avoided or clearly qualified.",
    weight: 7
  },
  {
    regex: /\ball[- ]natural\b/gi,
    severity: "low",
    critique: (m) =>
      `"${m}" conflates "natural" with "environmentally safe," which is not necessarily true - many natural substances are toxic or resource-intensive to produce.`,
    regulationTip:
      "FTC Green Guides: 'natural' claims should not imply environmental benefit without specific substantiation.",
    weight: 5
  },
  {
    regex: /\b(completely|totally|fully)\s+(sustainable|biodegradable|renewable|green|recyclable)\b/gi,
    severity: "high",
    critique: (m) =>
      `"${m}" uses absolute intensifiers around an environmental claim. Complete/total claims require whole-lifecycle, third-party-audited evidence that is not cited.`,
    regulationTip:
      "FTC Green Guides \u00a7260.4: qualify claims with specifics rather than absolute intensifiers unless fully substantiated.",
    weight: 12
  },
  {
    regex: /\bmost\s+(environmentally\s+friendly|sustainable|eco[- ]friendly|green)\b/gi,
    severity: "medium",
    critique: (m) =>
      `"${m}" is a superlative competitive claim with no comparative data, benchmark, or named competitors provided to substantiate the ranking.`,
    regulationTip:
      "FTC Green Guides: comparative environmental superiority claims must be substantiated with reliable evidence and clearly defined comparison basis.",
    weight: 8
  },
  {
    regex: /\bgreener?\s+(tomorrow|future|planet)\b/gi,
    severity: "low",
    critique: (m) =>
      `"${m}" is an aspirational, feel-good phrase that conveys environmental commitment without any specific, measurable claim behind it.`,
    regulationTip:
      "Consider replacing aspirational language with specific, dated commitments and interim progress metrics.",
    weight: 4
  },
  {
    regex: /\b(revolutionary|cutting[- ]edge|leading[- ]edge|state[- ]of[- ]the[- ]art)\s+(green|clean|eco|sustainable)\w*/gi,
    severity: "low",
    critique: (m) =>
      `"${m}" pairs an unverifiable superiority adjective with an environmental term, implying breakthrough performance without technical substantiation.`,
    regulationTip:
      "Substantiate technology superiority claims with named standards, third-party testing, or peer-reviewed data.",
    weight: 5
  },
  {
    regex: /\bethical(ly)?\s+(sourced|supply\s*chain|manufactur\w*)\b/gi,
    severity: "medium",
    critique: (m) =>
      `"${m}" implies supply-chain-wide ethical and environmental compliance without naming an auditor, certification body (e.g. Fair Trade, SA8000), or audit frequency.`,
    regulationTip:
      "Disclose the specific certification scheme and independent auditor used to verify supply chain claims.",
    weight: 7
  },
  {
    regex: /\bno\s+(negative\s+)?(impact|footprint|effect)\s+on\s+(the\s+)?(planet|environment|climate)\b/gi,
    severity: "high",
    critique: (m) =>
      `"${m}" claims total absence of environmental impact, which is scientifically implausible for virtually any commercial activity without extraordinary, fully-disclosed evidence.`,
    regulationTip:
      "FTC Green Guides \u00a7260.4: claims of no environmental impact require exceptionally rigorous, publicly available substantiation.",
    weight: 13
  }
];

const MISSING_METRIC_CHECKS: Array<{ pattern: RegExp; metric: string }> = [
  {
    pattern: /scope\s*3/i,
    metric: "Scope 3 (value chain) emissions baseline and reduction targets not disclosed"
  },
  {
    pattern: /scope\s*1|scope\s*2/i,
    metric: "Scope 1 and Scope 2 emissions figures not broken out or quantified"
  },
  {
    pattern: /(third[- ]party|independent(ly)?)\s+(audit|verif|certif)/i,
    metric: "No independent third-party audit or verification of environmental claims cited"
  },
  {
    pattern: /iso\s*14001|iso\s*14021|b\s*corp|leed|energy\s*star|fair\s*trade|sbti|science\s*based\s*targets/i,
    metric: "No recognized certification or standard (e.g. ISO 14001, B Corp, SBTi) referenced"
  },
  {
    pattern: /baseline\s*year|base\s*year|since\s*\d{4}/i,
    metric: "No baseline year specified against which progress is measured"
  },
  {
    pattern: /water\s*(usage|consumption|withdrawal)/i,
    metric: "Water usage / consumption data not disclosed"
  },
  {
    pattern: /waste\s*diversion|landfill\s*diversion\s*rate/i,
    metric: "Waste diversion / landfill rate figures not disclosed"
  },
  {
    pattern: /offset\s*registry|verified\s*carbon\s*standard|gold\s*standard/i,
    metric: "Carbon offset registry or standard (e.g. Verified Carbon Standard, Gold Standard) not named"
  }
];

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (matches && matches.length > 0) {
    return matches.map((s) => s.trim()).filter(Boolean);
  }
  return text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function findSentenceContaining(sentences: string[], matchText: string): string {
  const lower = matchText.toLowerCase();
  const found = sentences.find((sentence) => sentence.toLowerCase().includes(lower));
  return found ? truncateText(found, 280) : truncateText(matchText, 280);
}

function countSpecificityBonuses(text: string): number {
  let bonus = 0;
  const numberMatches = text.match(/\b\d+(\.\d+)?\s*(%|tons?|tonnes?|kg|kwh|mwh|gwh)\b/gi);
  if (numberMatches) bonus += Math.min(numberMatches.length * 2, 16);

  const certMatches = text.match(
    /iso\s*14001|iso\s*14021|b\s*corp|leed\b|energy\s*star|fair\s*trade|sbti|science\s*based\s*targets|verified\s*carbon\s*standard|gold\s*standard/gi
  );
  if (certMatches) bonus += Math.min(certMatches.length * 5, 20);

  const auditMatches = text.match(/third[- ]party\s+(audit|verif)|independently\s+(audit|verif)/gi);
  if (auditMatches) bonus += Math.min(auditMatches.length * 5, 15);

  return bonus;
}

export function runHeuristicAudit(content: string): AuditResult {
  const sentences = splitSentences(content);
  const flaggedClaims: FlaggedClaim[] = [];
  const seenSentences = new Set<string>();
  let rawWeightTotal = 0;

  for (const pattern of CLAIM_PATTERNS) {
    const matches = content.match(pattern.regex);
    if (!matches) continue;

    const uniqueMatches = Array.from(new Set(matches.map((m) => m.trim())));

    for (const match of uniqueMatches) {
      const originalText = findSentenceContaining(sentences, match);
      const dedupeKey = originalText.toLowerCase();
      if (seenSentences.has(dedupeKey)) continue;
      seenSentences.add(dedupeKey);

      flaggedClaims.push({
        originalText,
        critiqueText: pattern.critique(match),
        severity: pattern.severity,
        regulationTip: pattern.regulationTip
      });
      rawWeightTotal += pattern.weight;
    }
  }

  const missingMetrics = MISSING_METRIC_CHECKS.filter(
    (check) => !check.pattern.test(content)
  ).map((check) => check.metric);

  if (missingMetrics.length === 0) {
    missingMetrics.push("No obvious data gaps detected by automated scan - manual review still recommended.");
  }

  const specificityBonus = countSpecificityBonuses(content);
  const wordCount = content.split(/\s+/).filter(Boolean).length || 1;
  const densityFactor = Math.min((rawWeightTotal / wordCount) * 400, 25);

  const overallScore = clampScore(rawWeightTotal * 1.4 + densityFactor - specificityBonus + (flaggedClaims.length > 0 ? 10 : 0));
  const riskLevel = scoreToRiskLevel(overallScore);

  const remediatedCopy = buildRemediatedCopy(content, flaggedClaims.length);

  return {
    overallScore,
    riskLevel,
    flaggedClaims: flaggedClaims.slice(0, 12),
    missingMetrics: missingMetrics.slice(0, 10),
    remediatedCopy,
    sourceSummary: truncateText(content, 400),
    analysisEngine: "heuristic"
  };
}

function buildRemediatedCopy(content: string, flagCount: number): string {
  const rewritten = content
    .replace(/\b100%\s*(sustainable|eco[- ]friendly|carbon\s*neutral|natural|green|renewable|biodegradable)\b/gi, "substantially $1 (see our published methodology for exact percentages)")
    .replace(/\bnet[- ]zero\b/gi, "targeting net-zero by [target year], validated against SBTi criteria")
    .replace(/\bcarbon[- ]neutral(ity)?\b/gi, "carbon neutral for Scope 1 and 2 emissions (verified against [named registry]; Scope 3 baseline in progress)")
    .replace(/\bzero[- ]waste\b/gi, "actively reducing waste toward a measured landfill diversion target")
    .replace(/(?<!net[- ])\bzero\s*(impact|emissions?)\b/gi, "working to minimize $1, with figures published annually")
    .replace(/\b(eco|earth|planet|nature)[- ]friendly\b/gi, "designed to reduce environmental impact in [specific measurable way]")
    .replace(/\ball[- ]natural\b/gi, "made primarily from plant-derived ingredients (full ingredient list available)")
    .replace(/\b(completely|totally|fully)\s+(sustainable|biodegradable|renewable|green|recyclable)\b/gi, "largely $2, with independent verification of [X]% by [certifier]")
    .replace(/\bmost\s+(environmentally\s+friendly|sustainable|eco[- ]friendly|green)\b/gi, "among the more $1 options in our tested product line, based on [benchmark]")
    .replace(/\bno\s+(negative\s+)?(impact|footprint|effect)\s+on\s+(the\s+)?(planet|environment|climate)\b/gi, "measurably reduced $2 on $4 compared to our [baseline year] baseline");

  const disclaimer =
    "\n\n[Auditor's Note: This remediated copy replaces unverifiable absolute claims with specific, measurable, and independently verifiable language. Bracketed placeholders indicate where the company must supply real data, named certifiers, and baseline years before publishing.]";

  if (flagCount === 0) {
    return `${rewritten.trim()}\n\n[Auditor's Note: No major greenwashing red flags were detected in the automated scan. Continue to ensure all environmental claims remain backed by current, verifiable data.]`;
  }

  return `${rewritten.trim()}${disclaimer}`;
}
