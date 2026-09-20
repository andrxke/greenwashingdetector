"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { ClipboardX } from "lucide-react";

interface MissingMetricsListProps {
  missingMetrics: string[];
}

export function MissingMetricsList({ missingMetrics }: MissingMetricsListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <ClipboardX className="h-5 w-5 text-orange-400" />
          <CardTitle>Missing Quantifiable Metrics</CardTitle>
        </div>
      </CardHeader>
      <ul className="flex flex-col gap-3">
        {missingMetrics.map((metric, index) => (
          <motion.li
            key={metric}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
            className="flex items-start gap-3 rounded-lg border border-white/10 bg-base-900/60 p-3.5"
          >
            <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange-400/15 text-xs font-bold text-orange-300">
              !
            </span>
            <span className="text-sm text-slate-300">{metric}</span>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}
