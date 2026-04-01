"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { POINTS_TO_WIN } from "@/lib/game/constants";

interface ScoreboardProps {
  myScore:       number;
  opponentScore: number;
  myUsername:    string;
  opponentName:  string;
  compact?:      boolean;
}

function ScorePip({ filled, animateIn }: { filled: boolean; animateIn: boolean }) {
  return (
    <motion.div
      initial={animateIn ? { scale: 0, opacity: 0 } : {}}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      className={cn(
        "w-5 h-5 rounded-full border-2 transition-all duration-300",
        filled
          ? "bg-indigo-400 border-indigo-300 shadow-[0_0_12px_rgba(129,140,248,0.8)]"
          : "bg-transparent border-white/20"
      )}
    />
  );
}

export function Scoreboard({
  myScore,
  opponentScore,
  myUsername,
  opponentName,
  compact,
}: ScoreboardProps) {
  const pips = Array.from({ length: POINTS_TO_WIN }, (_, i) => i);

  return (
    <div className={cn(
      "flex items-center justify-center gap-6",
      compact ? "scale-90" : ""
    )}>
      {/* Player score */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs text-white/50 font-medium truncate max-w-[80px]">
          {myUsername}
        </span>
        <div className="flex gap-2">
          {pips.map((i) => (
            <ScorePip key={i} filled={i < myScore} animateIn={i === myScore - 1} />
          ))}
        </div>
        <motion.span
          key={myScore}
          initial={{ scale: 1.6, color: "#818cf8" }}
          animate={{ scale: 1,   color: "#ffffff" }}
          transition={{ duration: 0.4 }}
          className="font-display text-2xl font-bold"
        >
          {myScore}
        </motion.span>
      </div>

      {/* VS divider */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-white/20 text-xs font-display tracking-[0.3em]">VS</div>
        <div className="w-px h-10 bg-white/10" />
      </div>

      {/* Opponent score */}
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs text-white/50 font-medium truncate max-w-[80px]">
          {opponentName}
        </span>
        <div className="flex gap-2">
          {pips.map((i) => (
            <ScorePip key={i} filled={i < opponentScore} animateIn={i === opponentScore - 1} />
          ))}
        </div>
        <motion.span
          key={opponentScore}
          initial={{ scale: 1.6, color: "#818cf8" }}
          animate={{ scale: 1,   color: "#ffffff" }}
          transition={{ duration: 0.4 }}
          className="font-display text-2xl font-bold"
        >
          {opponentScore}
        </motion.span>
      </div>
    </div>
  );
}
