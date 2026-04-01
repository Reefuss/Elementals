"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn, formatTimer, isTimerDanger } from "@/lib/utils";
import { TURN_DURATION_MS } from "@/lib/game/constants";

interface TurnTimerProps {
  msLeft:   number;
  visible:  boolean;
}

export function TurnTimer({ msLeft, visible }: TurnTimerProps) {
  if (!visible) return null;

  const fraction = msLeft / TURN_DURATION_MS;
  const danger   = isTimerDanger(msLeft);
  const radius   = 22;
  const circ     = 2 * Math.PI * radius;
  const dash     = circ * fraction;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        {/* Track */}
        <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
          <circle
            cx="28" cy="28" r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="3"
          />
          {/* Progress */}
          <motion.circle
            cx="28" cy="28" r={radius}
            fill="none"
            stroke={danger ? "#ef4444" : "#818cf8"}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ - dash}
            animate={{ stroke: danger ? "#ef4444" : "#818cf8" }}
          />
        </svg>

        {/* Number */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            key={Math.ceil(msLeft / 1000)}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "font-display text-lg font-bold leading-none",
              danger ? "text-red-400" : "text-white"
            )}
          >
            {formatTimer(msLeft)}
          </motion.span>
        </div>
      </div>

      <span className="text-[10px] text-white/40 uppercase tracking-wider">
        {danger ? "Hurry!" : "Timer"}
      </span>
    </div>
  );
}
