"use client";

import type { RiskLevel } from "@/lib/types";
import { riskLevelToColor } from "@/lib/utils";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

interface RiskGaugeProps {
  score: number;
  riskLevel: RiskLevel;
}

const RADIUS = 84;
const STROKE_WIDTH = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function RiskGauge({ score, riskLevel }: RiskGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const motionValue = useMotionValue(0);
  const color = riskLevelToColor(riskLevel);

  const dashOffset = useTransform(motionValue, (value) => CIRCUMFERENCE - (value / 100) * CIRCUMFERENCE);

  useEffect(() => {
    const controls = animate(motionValue, score, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => setDisplayScore(Math.round(value))
    });
    return () => controls.stop();
  }, [score, motionValue]);

  return (
    <div className="relative flex h-56 w-56 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={STROKE_WIDTH}
        />
        <motion.circle
          cx="100"
          cy="100"
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-5xl font-bold tabular-nums text-white"
        >
          {displayScore}
        </motion.span>
        <span className="mt-1 text-xs uppercase tracking-widest text-slate-500">Risk Score</span>
        <span
          className="mt-3 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide"
          style={{ color, borderColor: `${color}66`, backgroundColor: `${color}1a` }}
        >
          {riskLevel} Risk
        </span>
      </div>
    </div>
  );
}
