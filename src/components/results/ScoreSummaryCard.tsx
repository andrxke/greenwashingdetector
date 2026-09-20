"use client";

import { RiskGauge } from "@/components/results/RiskGauge";
import { Badge } from "@/components/ui/Badge";
import type { AuditResult } from "@/lib/types";
import { riskLevelToTextClass } from "@/lib/utils";
import { motion } from "framer-motion";
import { AlertOctagon, Bot, Cpu, ListChecks } from "lucide-react";

interface ScoreSummaryCardProps {
  result: AuditResult;
  sourceLabel: string | null;
}

const SEVERITY_COUNTS_ORDER = ["high", "medium", "low"] as const;

export function ScoreSummaryCard({ result, sourceLabel }: ScoreSummaryCardProps) {
  const severityCounts = result.flaggedClaims.reduce(
    (acc, claim) => {
      acc[claim.severity] += 1;
      return acc;
    },
    { low: 0, medium: 0, high: 0 }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel flex flex-col items-center gap-6 p-8 md:flex-row md:items-stretch md:justify-between"
    >
      <div className="flex flex-col items-center justify-center">
        <RiskGauge score={result.overallScore} riskLevel={result.riskLevel} />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">Audit Source</p>
          <p className="mt-1 truncate text-lg font-semibold text-white">{sourceLabel ?? "Unknown source"}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-base-900/60 px-3 py-2">
            <AlertOctagon className="h-4 w-4 text-red-400" />
            <span className="text-sm text-slate-300">{severityCounts.high} High</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-base-900/60 px-3 py-2">
            <AlertOctagon className="h-4 w-4 text-orange-400" />
            <span className="text-sm text-slate-300">{severityCounts.medium} Medium</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-base-900/60 px-3 py-2">
            <AlertOctagon className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-slate-300">{severityCounts.low} Low</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-base-900/60 px-3 py-2">
            <ListChecks className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-300">{result.missingMetrics.length} Missing Metrics</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge tone="accent">
            {result.analysisEngine === "llm" ? (
              <>
                <Bot className="h-3.5 w-3.5" /> LLM Analysis
              </>
            ) : (
              <>
                <Cpu className="h-3.5 w-3.5" /> Heuristic Engine
              </>
            )}
          </Badge>
          <span className={`text-sm font-semibold ${riskLevelToTextClass(result.riskLevel)}`}>
            {result.riskLevel} greenwashing risk classification
          </span>
        </div>

        {SEVERITY_COUNTS_ORDER.every((key) => severityCounts[key] === 0) && (
          <p className="text-sm text-slate-500">
            No absolute or unsubstantiated claims were detected by the automated scan.
          </p>
        )}
      </div>
    </motion.div>
  );
}
