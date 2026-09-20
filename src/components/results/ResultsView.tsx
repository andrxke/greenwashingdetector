"use client";

import { ExportButton } from "@/components/results/ExportButton";
import { FlaggedClaimCard } from "@/components/results/FlaggedClaimCard";
import { MissingMetricsList } from "@/components/results/MissingMetricsList";
import { RemediatedCopyCard } from "@/components/results/RemediatedCopyCard";
import { ScoreSummaryCard } from "@/components/results/ScoreSummaryCard";
import { Button } from "@/components/ui/Button";
import type { AuditResult } from "@/lib/types";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ResultsViewProps {
  result: AuditResult;
  sourceLabel: string | null;
  onReset: () => void;
}

export function ResultsView({ result, sourceLabel, onReset }: ResultsViewProps) {
  return (
    <div className="flex flex-col gap-8">
      <ScoreSummaryCard result={result} sourceLabel={sourceLabel} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-lg font-semibold text-white">
          <AlertTriangle className="h-5 w-5 text-risk-high" />
          Flagged Claims Breakdown
        </div>
        <div className="flex gap-3">
          <ExportButton result={result} sourceLabel={sourceLabel} />
          <Button variant="ghost" icon={<RotateCcw className="h-4 w-4" />} onClick={onReset}>
            New Audit
          </Button>
        </div>
      </div>

      {result.flaggedClaims.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-panel p-8 text-center text-slate-400"
        >
          No deceptive or unsubstantiated environmental claims were detected in this content.
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {result.flaggedClaims.map((claim, index) => (
            <FlaggedClaimCard key={`${claim.originalText}-${index}`} claim={claim} index={index} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <MissingMetricsList missingMetrics={result.missingMetrics} />
        <RemediatedCopyCard remediatedCopy={result.remediatedCopy} />
      </div>
    </div>
  );
}
