"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CardVariant, Rarity } from "@/lib/game/cardPool";
import { GameCard } from "./GameCard";
import { Card, CardType, Element, SpecialType } from "@/lib/game/types";
import { cn } from "@/lib/utils";

const RARITY_BADGE: Record<Rarity, string> = {
  common:    "text-white/35 border-white/15",
  uncommon:  "text-teal-300 border-teal-400/40",
  rare:      "text-blue-300 border-blue-400/50",
  epic:      "text-purple-300 border-purple-400/60",
  legendary: "text-amber-300 border-amber-400/70",
};

function variantToDisplayCard(v: CardVariant): Card {
  if (v.type === "element") {
    return {
      id:        v.id,
      type:      CardType.ELEMENT,
      element:   v.element as Element,
      value:     v.value as 3 | 5 | 8 | 12,
      variantId: v.id,
    };
  }
  if (v.type === "special") {
    return {
      id:          v.id,
      type:        CardType.SPECIAL,
      specialType: v.specialType as SpecialType,
      variantId:   v.id,
    };
  }
  return {
    id:        v.id,
    type:      CardType.DIAMOND,
    value:     v.value!,
    variantId: v.id,
  };
}

interface CardDetailModalProps {
  card:    CardVariant;
  owned:   number;        // quantity owned; 0 = not owned
  onClose: () => void;
}

export function CardDetailModal({ card, owned, onClose }: CardDetailModalProps) {
  const displayCard = variantToDisplayCard(card);
  const notOwned    = owned === 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.75, opacity: 0, y: 20 }}
          animate={{ scale: 1,    opacity: 1, y: 0 }}
          exit={{    scale: 0.85, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center gap-4"
        >
          {/* Card graphic — dimmed if not owned */}
          <div className={cn(notOwned && "opacity-50")}>
            <GameCard card={displayCard} size="lg" />
          </div>

          {/* Description panel — always full opacity */}
          <div className="glass rounded-2xl p-5 w-full max-w-xs border border-white/10 text-center">
            <p className="font-display text-lg font-bold text-white">{card.displayName}</p>
            <p className={cn("text-xs mt-0.5 capitalize", RARITY_BADGE[card.rarity].split(" ")[0])}>
              {card.rarity} · {card.type}
              {card.element && ` · ${card.element}`}
            </p>

            {card.effect && card.effect !== "No effect." && (
              <div className="mt-3 px-2 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                <p className="text-xs font-semibold text-indigo-300 mb-1">Effect</p>
                <p className="text-xs text-white/75 leading-relaxed">{card.effect}</p>
              </div>
            )}

            <p className="text-[10px] text-white/25 italic mt-3 leading-relaxed">
              "{card.flavorText}"
            </p>

            <div className="mt-4 flex justify-center gap-6 text-sm">
              <div>
                <p className="font-bold text-white">{owned}</p>
                <p className="text-white/40 text-xs">Owned</p>
              </div>
              <div>
                <p className="font-bold text-white">{card.maxPerDeck}</p>
                <p className="text-white/40 text-xs">Max/Deck</p>
              </div>
              {card.value && (
                <div>
                  <p className="font-bold text-white">+{card.value}</p>
                  <p className="text-white/40 text-xs">Value</p>
                </div>
              )}
            </div>
          </div>

          <button onClick={onClose} className="text-xs text-white/30 hover:text-white/50 transition-colors">
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
