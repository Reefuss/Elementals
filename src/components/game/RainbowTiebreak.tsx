"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Element } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface RainbowTiebreakProps {
  open:       boolean;
  attempt:    number;
  myChoice:   Element | null;
  waitingForOp: boolean;
  onChoose:   (element: Element) => void;
}

const ELEMENT_OPTIONS: { element: Element; label: string; icon: string; color: string }[] = [
  { element: Element.SUN,  label: "Sun",  icon: "☀",  color: "text-sun-400  border-sun-400/40  hover:bg-sun-400/10  hover:border-sun-400/80"  },
  { element: Element.MOON, label: "Moon", icon: "☽",  color: "text-moon-300 border-moon-300/40 hover:bg-moon-300/10 hover:border-moon-300/80" },
  { element: Element.STAR, label: "Star", icon: "★",  color: "text-star-400 border-star-400/40 hover:bg-star-400/10 hover:border-star-400/80" },
];

export function RainbowTiebreak({
  open,
  attempt,
  myChoice,
  waitingForOp,
  onChoose,
}: RainbowTiebreakProps) {
  return (
    <Modal open={open} title="Rainbow Clash!">
      <div className="flex flex-col items-center gap-6">
        <p className="text-sm text-white/60 text-center leading-relaxed">
          Both played <span className="text-white font-semibold">Rainbow</span>.
          Choose an element to settle this duel.
          {attempt > 1 && (
            <span className="block mt-1 text-yellow-400/80 text-xs">
              Attempt {attempt} — you matched last time!
            </span>
          )}
        </p>

        <AnimatePresence mode="wait">
          {waitingForOp ? (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-10 h-10 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-white/50">
                You chose <span className="text-white font-semibold capitalize">
                  {myChoice?.toLowerCase()}
                </span>. Waiting for opponent…
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="choices"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 w-full"
            >
              {ELEMENT_OPTIONS.map(({ element, label, icon, color }) => (
                <motion.button
                  key={element}
                  whileHover={{ scale: 1.06, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onChoose(element)}
                  disabled={!!myChoice}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-3 py-6 rounded-2xl border",
                    "transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed",
                    "bg-black/20",
                    color
                  )}
                >
                  <span className="text-3xl leading-none">{icon}</span>
                  <span className="font-display text-sm font-semibold">{label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[11px] text-white/25 text-center">
          Sun beats Star · Star beats Moon · Moon beats Sun
        </p>
      </div>
    </Modal>
  );
}
