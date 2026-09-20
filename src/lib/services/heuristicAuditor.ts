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
      `The absolute claim "${m}" asserts total, unqualified environmental performance. Absolute quantifiers like "100%" require rigorous, independently verifiable proof covering the entire lifecycle and supply chain \u2014 no such evidence is provided here.`,
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
      `"${m}" is claimed without specifying whether this relies on offsets, the offset registry used, the baseline year, or whether Scope 3 emissions are included \u2014 a common greenwashing gap.`,
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
      `"${m}" conflates "natural" with "environmentally safe," which is not necessarily true \u2014 many natural substances are toxic or resource-intensive to produce.`,
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
    regex: /\b(?:reduces?|cuts?|lowers?)\b[^.!?]{0,100}\bby\s+\d+(?:\.\d+)?%[^.!?]*(?:compared|than|versus|vs\.?)/gi,
    severity: "high",
    critique: (m) =>
      `"${m}" makes a quantified comparative claim without identifying the measurement method, baseline, time period, scope, or comparison set. A percentage alone does not establish that the claimed environmental benefit is reliable.`,
    regulationTip:
      "Comparative environmental claims should identify the comparison basis, methodology, scope, and date, and retain evidence that can reproduce the result.",
    weight: 12
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
function isNegatedClaim(sentence: string, matchText: string): boolean {
  const matchIndex = sentence.toLowerCase().indexOf(matchText.toLowerCase());
  if (matchIndex < 0) return false;

  const prefix = sentence.slice(Math.max(0, matchIndex - 90), matchIndex);
  return /\b(?:not|no|never|without|don't|do not|doesn't|does not|isn't|is not|aren't|are not|cannot|can't|lack(?:s|ing)?|den(?:y|ies|ied))\b/i.test(
    prefix
  );
}

function hasAffirmativeMatch(text: string, pattern: RegExp): boolean {
  const sentencePattern = new RegExp(pattern.source, pattern.flags.replace("g", ""));
  return splitSentences(text).some((sentence) => {
    const match = sentence.match(sentencePattern);
    return Boolean(match?.[0] && !isNegatedClaim(sentence, match[0]));
  });
}

function countSpecificityBonuses(text: string): number {
  let bonus = 0;
  const countAffirmativeMatches = (pattern: RegExp): number =>
    splitSentences(text).reduce((total, sentence) => {
      const matches = sentence.match(pattern) ?? [];
      return total + matches.filter((match) => !isNegatedClaim(sentence, match)).length;
    }, 0);

  bonus += Math.min(
    countAffirmativeMatches(/\b\d+(\.\d+)?\s*(%|tons?|tonnes?|kg|kwh|mwh|gwh)\b/gi) * 2,
    16
  );
  bonus += Math.min(
    countAffirmativeMatches(
      /iso\s*14001|iso\s*14021|b\s*corp|leed\b|energy\s*star|fair\s*trade|sbti|science\s*based\s*targets|verified\s*carbon\s*standard|gold\s*standard/gi
    ) * 5,
    20
  );
  bonus += Math.min(
    countAffirmativeMatches(/third[- ]party\s+(audit|verif)|independently\s+(audit|verif)/gi) * 5,
    15
  );

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
      if (isNegatedClaim(originalText, match)) continue;
      const dedupeKey = originalText.toLowerCase();
      if (seenSentences.has(dedupeKey)) continue;
      seenSentences.add(dedupeKey);

      flaggedClaims.push({
        originalText,
        critiqueText: pattern.critique(match),
        severity: pattern.severity,
        regulationTip: pattern.regulationTip,
        evidenceStatus: "insufficient_evidence",
        confidence: 0.8
      });
      rawWeightTotal += pattern.weight;
    }
  }

  const hasEnvironmentalSignal = hasAffirmativeMatch(
    content,
    /\b(?:sustainab\w*|carbon|emission\w*|eco[- ]friendly|environment\w*|climate|green|recycl\w*|renewable|biodegrad\w*|offset\w*|footprint|planet|esg)\b/i
  );
  const missingMetrics = !hasEnvironmentalSignal
    ? ["No environmental claims found in the reviewed text; environmental substantiation was not assessed."]
    : MISSING_METRIC_CHECKS.filter((check) => !hasAffirmativeMatch(content, check.pattern)).map(
        (check) => check.metric
      );

  if (missingMetrics.length === 0) {
    missingMetrics.push("No obvious data gaps detected by automated scan \u2014 manual review still recommended.");
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
  if (flagCount === 0) {
    return `${content.trim()}\n\n[Screening note: No major environmental-claim pattern was detected. This is not confirmation that the text is compliant; retain current evidence and obtain jurisdiction-specific review before publication.]`;
  }
  const rewritten = content
    .replace(/\b100%\s*(sustainable|eco[- ]friendly|carbon\s*neutral|natural|green|renewable|biodegradable)\b/gi, "a measured percentage of $1 [publish percentage, scope, method, and date]")
    .replace(/\bnet[- ]zero\b/gi, "a proposed net-zero target [publish target year, baseline, milestones, and method]")
    .replace(/\bcarbon[- ]neutral(ity)?\b/gi, "a carbon-neutral claim [publish scopes, baseline, method, and verifier before using this claim]")
    .replace(/\bzero[- ]waste\b/gi, "a measured waste-diversion claim [publish boundary, rate, method, and date]")
    .replace(/(?<!net[- ])\bzero\s*(impact|emissions?)\b/gi, "a measured reduction in $1 [publish scope, baseline, method, and date]")
    .replace(/\b(eco|earth|planet|nature)[- ]friendly\b/gi, "a specific environmental benefit [publish the metric, scope, method, and date]")
    .replace(/\ball[- ]natural\b/gi, "specific ingredients and environmental attributes [publish the full ingredient list and substantiation]")
    .replace(/\b(completely|totally|fully)\s+(sustainable|biodegradable|renewable|green|recyclable)\b/gi, "a measured $2 attribute [publish percentage, scope, method, and date]")
    .replace(/\bmost\s+(environmentally\s+friendly|sustainable|eco[- ]friendly|green)\b/gi, "a comparative environmental claim [publish the benchmark, comparison set, scope, method, and date]")
    .replace(/\bno\s+(negative\s+)?(impact|footprint|effect)\s+on\s+(the\s+)?(planet|environment|climate)\b/gi, "a measured environmental reduction claim [publish scope, baseline, method, and date]");

  const disclaimer =
    "\n\n[Screening note: This is a draft revision, not approved compliance copy. Replace every bracketed item with evidence from the source or remove the claim. Obtain jurisdiction-specific legal and technical review before publication.]";

  return `${rewritten.trim()}${disclaimer}`;
}
