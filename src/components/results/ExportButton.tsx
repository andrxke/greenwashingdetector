"use client";

import { Button } from "@/components/ui/Button";
import type { AuditResult } from "@/lib/types";
import { severityToLabel } from "@/lib/utils";
import { Download } from "lucide-react";
import { useState } from "react";

interface ExportButtonProps {
  result: AuditResult;
  sourceLabel: string | null;
}

const PAGE_WIDTH = 210;
const MARGIN = 16;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PAGE_HEIGHT = 297;
const BOTTOM_MARGIN = 20;

export function ExportButton({ result, sourceLabel }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      let cursorY = MARGIN;

      const ensureSpace = (needed: number) => {
        if (cursorY + needed > PAGE_HEIGHT - BOTTOM_MARGIN) {
          doc.addPage();
          cursorY = MARGIN;
        }
      };

      const writeParagraph = (text: string, fontSize: number, lineHeight: number, bold = false) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
        for (const line of lines) {
          ensureSpace(lineHeight);
          doc.text(line, MARGIN, cursorY);
          cursorY += lineHeight;
        }
      };

      doc.setTextColor(16, 24, 32);
      writeParagraph("EcoClaim Auditor - Greenwashing Risk Report", 18, 8, true);
      cursorY += 2;
      writeParagraph(`Source: ${sourceLabel ?? "Unknown"}`, 10, 5.5);
      writeParagraph(`Generated: ${new Date().toLocaleString()}`, 10, 5.5);
      writeParagraph(`Analysis engine: ${result.analysisEngine === "llm" ? "LLM-powered" : "Heuristic (offline)"}`, 10, 5.5);
      cursorY += 4;

      writeParagraph(`Overall Greenwashing Risk Score: ${result.overallScore} / 100`, 14, 7, true);
      writeParagraph(`Risk Level: ${result.riskLevel}`, 12, 6.5, true);
      cursorY += 4;

      writeParagraph(`Flagged Claims (${result.flaggedClaims.length})`, 14, 7, true);
      cursorY += 1;

      result.flaggedClaims.forEach((claim, index) => {
        ensureSpace(10);
        writeParagraph(`${index + 1}. "${claim.originalText}"`, 10.5, 5.5, true);
        writeParagraph(`Severity: ${severityToLabel(claim.severity)}`, 9.5, 5);
        writeParagraph(
          `Evidence status: ${claim.evidenceStatus.replace("_", " ")} (${Math.round(claim.confidence * 100)}% screening confidence)`,
          9.5,
          5
        );
        writeParagraph(`Critique: ${claim.critiqueText}`, 9.5, 5);
        writeParagraph(`Regulation Tip: ${claim.regulationTip}`, 9.5, 5);
        cursorY += 3;
      });

      cursorY += 2;
      writeParagraph(`Missing Metrics (${result.missingMetrics.length})`, 14, 7, true);
      cursorY += 1;
      result.missingMetrics.forEach((metric) => {
        writeParagraph(`\u2022 ${metric}`, 9.5, 5.5);
      });

      cursorY += 4;
      writeParagraph("AI-Suggested Compliant Copy", 14, 7, true);
      cursorY += 1;
      writeParagraph(result.remediatedCopy, 9.5, 5.2);

      const filenameSafeSource = (sourceLabel ?? "audit").replace(/[^a-z0-9]+/gi, "-").slice(0, 40);
      doc.save(`ecoclaim-audit-${filenameSafeSource || "report"}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button variant="secondary" icon={<Download className="h-4 w-4" />} loading={exporting} onClick={handleExport}>
      Export Report (PDF)
    </Button>
  );
}
