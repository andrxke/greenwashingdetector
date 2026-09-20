import { cx } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Tone = "neutral" | "low" | "medium" | "high" | "accent";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  low: "bg-yellow-400/15 text-yellow-300 border-yellow-400/30",
  medium: "bg-orange-400/15 text-orange-300 border-orange-400/30",
  high: "bg-red-400/15 text-red-300 border-red-400/30",
  accent: "bg-accent/15 text-accent border-accent/30"
};

export function Badge({ tone = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium uppercase tracking-wide",
        TONE_CLASSES[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
