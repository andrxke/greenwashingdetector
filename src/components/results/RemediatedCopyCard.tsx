"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Check, Copy, Sparkles } from "lucide-react";
import { useState } from "react";

interface RemediatedCopyCardProps {
  remediatedCopy: string;
}

export function RemediatedCopyCard({ remediatedCopy }: RemediatedCopyCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(remediatedCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-accent" />
          <CardTitle>Suggested Revision (Requires Review)</CardTitle>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-base-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/5"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </CardHeader>
      <div className="whitespace-pre-wrap rounded-xl border border-accent/20 bg-accent/5 p-5 text-sm leading-relaxed text-slate-200">
        {remediatedCopy}
      </div>
    </Card>
  );
}
