"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { OpponentView } from "@/lib/game/types";
import { CardBack } from "./GameCard";

interface OpponentAreaProps {
  opponent: OpponentView;
}

export function OpponentArea({ opponent }: OpponentAreaProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      {/* Username + connection */}
      <div className="flex flex-col gap-0.5 min-w-[120px]">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-semibold text-white truncate max-w-[140px]">
            {opponent.username}
          </span>
          {!opponent.connected && (
            <span className="text-[9px] uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-400/20 px-1.5 py-0.5 rounded-full">
              Away
            </span>
          )}
        </div>
        <span className="text-[11px] text-white/40">
          {opponent.deckCount} in deck
        </span>
      </div>

      {/* Hand representation */}
      <div className="flex items-end gap-1">
        {Array.from({ length: opponent.handCount }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.04, type: "spring", stiffness: 300 }}
          >
            <CardBack size="sm" />
          </motion.div>
        ))}
        {opponent.handCount === 0 && (
          <span className="text-xs text-white/30 italic">No cards</span>
        )}
      </div>

      {/* Score */}
      <div className="flex flex-col items-end gap-0.5 min-w-[48px]">
        <motion.span
          key={opponent.score}
          initial={{ scale: 1.5, color: "#818cf8" }}
          animate={{ scale: 1,   color: "#ffffff" }}
          transition={{ duration: 0.3 }}
          className="font-display text-2xl font-bold"
        >
          {opponent.score}
        </motion.span>
        <span className="text-[10px] text-white/30 uppercase tracking-wider">pts</span>
      </div>
    </div>
  );
}
