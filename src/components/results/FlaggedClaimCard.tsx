"use client";

import { Badge } from "@/components/ui/Badge";
import type { FlaggedClaim } from "@/lib/types";
import { severityToLabel } from "@/lib/utils";
import { motion } from "framer-motion";
import { Gavel, MessageSquareWarning, Quote } from "lucide-react";

interface FlaggedClaimCardProps {
  claim: FlaggedClaim;
  index: number;
}

const SEVERITY_TONE = {
  low: "low",
  medium: "medium",
  high: "high"
} as const;

export function FlaggedClaimCard({ claim, index }: FlaggedClaimCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.6) }}
      className="glass-panel p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Flagged Claim #{index + 1}
        </span>
        <Badge tone={SEVERITY_TONE[claim.severity]}>{severityToLabel(claim.severity)}</Badge>
      </div>

      <div className="mb-4 flex gap-3 rounded-xl border border-white/10 bg-base-900/60 p-4">
        <Quote className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-500" />
        <p className="text-sm italic leading-relaxed text-slate-200">&ldquo;{claim.originalText}&rdquo;</p>
      </div>

      <div className="mb-4 flex gap-3">
        <MessageSquareWarning className="mt-0.5 h-4 w-4 flex-shrink-0 text-risk-high" />
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Auditor Critique</p>
          <p className="text-sm leading-relaxed text-slate-300">{claim.critiqueText}</p>
        </div>
      </div>

      <div className="flex gap-3 rounded-xl border border-accent/20 bg-accent/5 p-4">
        <Gavel className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">Regulation Tip</p>
          <p className="text-sm leading-relaxed text-slate-300">{claim.regulationTip}</p>
        </div>
      </div>
    </motion.div>
  );
}
