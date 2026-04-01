"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/lib/game/types";
import { GameCard } from "./GameCard";
import { cn } from "@/lib/utils";

interface HandProps {
  cards:           Card[];
  selectedCardId:  string | null;
  disabled:        boolean;
  onSelectCard:    (cardId: string) => void;
}

/**
 * Renders the player's hand of cards in a fan/row layout.
 * Cards are evenly spaced and slightly fanned.
 */
export function Hand({ cards, selectedCardId, disabled, onSelectCard }: HandProps) {
  const count = cards.length;

  return (
    <div className="flex items-end justify-center" style={{ minHeight: 180 }}>
      <div
        className="relative flex items-end justify-center"
        style={{
          // Overlap cards slightly when there are many
          gap: count > 6 ? 4 : 12,
        }}
      >
        <AnimatePresence mode="popLayout">
          {cards.map((card, i) => {
            // Subtle fan rotation
            const midpoint = (count - 1) / 2;
            const offset   = i - midpoint;
            const rotation = count > 1 ? offset * 2.5 : 0;
            const yOffset  = Math.abs(offset) * 4;

            return (
              <motion.div
                key={card.id}
                layout
                initial={{ y: 80, opacity: 0, rotate: rotation }}
                animate={{ y: yOffset, opacity: 1, rotate: rotation }}
                exit={{ y: 80, opacity: 0 }}
                transition={{
                  type:      "spring",
                  stiffness: 320,
                  damping:   28,
                  delay:     i * 0.05,
                }}
                style={{ zIndex: i }}
                className="relative"
              >
                <GameCard
                  card={card}
                  selected={card.id === selectedCardId}
                  disabled={disabled}
                  size="md"
                  onClick={() => onSelectCard(card.id)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
