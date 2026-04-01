"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/lib/game/types";
import { Modal } from "@/components/ui/modal";
import { GameCard } from "./GameCard";

interface RevivePickProps {
  open:         boolean;
  discardPile:  Card[];
  needsPick:    boolean;
  waitingForOp: boolean;
  onPick:       (cardId: string) => void;
}

export function RevivePick({
  open,
  discardPile,
  needsPick,
  waitingForOp,
  onPick,
}: RevivePickProps) {
  return (
    <Modal open={open} title="Revive">
      <div className="flex flex-col items-center gap-5">
        <AnimatePresence mode="wait">
          {waitingForOp && !needsPick ? (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-3 py-4"
            >
              <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-white/50">Waiting for opponent to revive…</span>
            </motion.div>
          ) : needsPick ? (
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-4 w-full"
            >
              <p className="text-sm text-white/60 text-center">
                Pick a card from your discard pile to return to your hand.
              </p>

              {discardPile.length === 0 ? (
                <p className="text-xs text-white/30 py-4">Your discard pile is empty.</p>
              ) : (
                <div className="flex flex-wrap justify-center gap-3 max-h-60 overflow-y-auto py-2">
                  {discardPile.map((card, i) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <GameCard
                        card={card}
                        size="sm"
                        onClick={() => onPick(card.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
