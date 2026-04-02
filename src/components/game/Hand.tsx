"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/lib/game/types";
import { CARD_MAP } from "@/lib/game/cardPool";
import { GameCard } from "./GameCard";
import { cn } from "@/lib/utils";

interface HandProps {
  cards:           Card[];
  selectedCardId:  string | null;
  disabled:        boolean;
  onSelectCard:    (cardId: string) => void;
}

// ─────────────────────────────────────────────
//  Card detail preview modal
// ─────────────────────────────────────────────

function CardPreviewModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const variant    = card.variantId ? CARD_MAP[card.variantId] : null;
  const effectText = variant?.effect ?? "";
  const cardName   = variant?.displayName ?? "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.75, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0 }}
        exit={{    scale: 0.85, opacity: 0, y: 10 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col items-center gap-4"
      >
        <GameCard card={card} size="lg" />

        {(cardName || effectText) && (
          <div className="glass rounded-2xl p-4 w-full max-w-xs border border-white/10 text-center">
            {cardName && (
              <p className="font-display text-base font-bold text-white">{cardName}</p>
            )}
            {variant && (
              <p className="text-[11px] text-white/40 capitalize mt-0.5">
                {variant.rarity} · {variant.type}
              </p>
            )}
            {effectText && (
              <p className="text-xs text-white/70 mt-2 leading-relaxed">{effectText}</p>
            )}
            {variant?.flavorText && (
              <p className="text-[10px] text-white/25 italic mt-2">"{variant.flavorText}"</p>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  Hand
// ─────────────────────────────────────────────

export function Hand({ cards, selectedCardId, disabled, onSelectCard }: HandProps) {
  const count = cards.length;
  const [isMobile,    setIsMobile]    = useState(false);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const cardSize = isMobile ? "sm" : "md";

  const handleCardClick = (card: Card) => {
    onSelectCard(card.id);
    setPreviewCard(card);
  };

  return (
    <>
      <div className="flex items-end justify-center" style={{ minHeight: isMobile ? 130 : 180 }}>
        <div
          className="relative flex items-end justify-center"
          style={{ gap: count > 6 ? 2 : (isMobile ? 6 : 12) }}
        >
          <AnimatePresence mode="popLayout">
            {cards.map((card, i) => {
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
                  transition={{ type: "spring", stiffness: 320, damping: 28, delay: i * 0.12 }}
                  style={{ zIndex: i }}
                  className="relative"
                >
                  <GameCard
                    card={card}
                    selected={card.id === selectedCardId}
                    disabled={disabled}
                    size={cardSize}
                    onClick={() => handleCardClick(card)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {previewCard && (
          <CardPreviewModal
            card={previewCard}
            onClose={() => setPreviewCard(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
