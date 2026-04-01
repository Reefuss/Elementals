"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PACK_TYPES, PackType, CardVariant, ALL_CARDS, CARD_MAP,
  openPack, PITY_POINTS_PER_PACK, PITY_SHOP_PRICES,
} from "@/lib/game/cardPool";
import { usePlayerStore } from "@/store/playerStore";
import { useCollectionStore } from "@/store/collectionStore";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
//  Rarity helpers
// ─────────────────────────────────────────────

const rarityLabel: Record<string, string> = { common: "C", rare: "R", epic: "E" };
const rarityColor: Record<string, string> = {
  common: "text-white/40 border-white/20",
  rare:   "text-blue-300 border-blue-400/40",
  epic:   "text-purple-300 border-purple-400/60",
};
const rarityGlow: Record<string, string> = {
  common: "",
  rare:   "0 0 20px 4px rgba(99,102,241,0.35)",
  epic:   "0 0 32px 8px rgba(168,85,247,0.5)",
};
const elementGradient: Record<string, string> = {
  SUN:  "from-amber-900/80 to-slate-900/80",
  MOON: "from-blue-950/80 to-slate-900/80",
  STAR: "from-purple-950/80 to-slate-900/80",
};
const elementIcon: Record<string, string> = { SUN: "☀", MOON: "☽", STAR: "★" };
const elementText: Record<string, string> = {
  SUN: "text-amber-400", MOON: "text-blue-300", STAR: "text-purple-400",
};

// ─────────────────────────────────────────────
//  Card face (used in reveal + collection)
// ─────────────────────────────────────────────

function MiniCard({ card, className }: { card: CardVariant; className?: string }) {
  const grad  = card.element ? elementGradient[card.element] : "from-slate-800 to-slate-900";
  const icon  = card.element ? elementIcon[card.element] : card.specialType === "BLOCK" ? "🛡" : "🌈";
  const tc    = card.element ? elementText[card.element] : "text-white";

  return (
    <div className={cn(
      "relative flex flex-col items-center justify-between rounded-2xl border p-2 overflow-hidden",
      "bg-gradient-to-b", grad,
      rarityColor[card.rarity].split(" ")[1],
      className,
    )}>
      <div className="flex items-center justify-between w-full">
        {card.value && (
          <span className="text-[9px] font-bold text-white/60">+{card.value}</span>
        )}
        <span className={cn("text-[9px] font-bold border rounded px-1", rarityColor[card.rarity])}>
          {rarityLabel[card.rarity]}
        </span>
      </div>
      <span className={cn("text-3xl", tc)}>{icon}</span>
      <p className="text-[8px] text-white/50 truncate w-full text-center">{card.displayName}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Pack card in store
// ─────────────────────────────────────────────

function PackStoreCard({
  pack,
  coins,
  onBuy,
}: {
  pack: PackType;
  coins: number;
  onBuy: (pack: PackType) => void;
}) {
  const canAfford = coins >= pack.cost;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "glass rounded-3xl p-6 border flex flex-col gap-5",
        `bg-gradient-to-b ${pack.bgFrom}/30 ${pack.bgTo}/30`,
        pack.id === "eclipse" ? "border-amber-500/30" : "border-indigo-500/20"
      )}
      style={{ boxShadow: pack.id === "eclipse" ? `0 0 40px -10px ${pack.accentColor}40` : undefined }}
    >
      {/* Pack art */}
      <div className="flex justify-center">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "w-28 h-36 rounded-2xl border-2 flex items-center justify-center text-5xl",
            `bg-gradient-to-b ${pack.bgFrom} ${pack.bgTo}`,
          )}
          style={{ borderColor: pack.accentColor + "50", boxShadow: `0 0 24px 4px ${pack.accentColor}30` }}
        >
          ✦
        </motion.div>
      </div>

      {/* Info */}
      <div className="text-center">
        <p className="font-display text-xl font-bold text-white">{pack.name}</p>
        <p className="text-sm text-white/40 mt-1">{pack.tagline}</p>
        <div className="flex justify-center gap-4 mt-3 text-xs text-white/30">
          <span>Common {Math.round(pack.rarityWeights.common * 100)}%</span>
          <span className="text-blue-400">Rare {Math.round(pack.rarityWeights.rare * 100)}%</span>
          <span className="text-purple-400">Epic {Math.round(pack.rarityWeights.epic * 100)}%</span>
        </div>
        {pack.guaranteedRare && (
          <p className="text-xs text-amber-400/70 mt-1">Guaranteed rare+</p>
        )}
      </div>

      {/* Buy button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => canAfford && onBuy(pack)}
        className={cn(
          "w-full py-3 rounded-xl font-semibold text-sm transition-all",
          canAfford
            ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"
            : "bg-white/5 text-white/25 cursor-not-allowed border border-white/10"
        )}
      >
        {canAfford ? `Open for ${pack.cost.toLocaleString()} coins` : `Need ${(pack.cost - coins).toLocaleString()} more coins`}
      </motion.button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  Pack opening cinematic
// ─────────────────────────────────────────────

type RevealState = "idle" | "burst" | "revealed";

function PackOpening({
  pack,
  cards,
  onDone,
}: {
  pack: PackType;
  cards: CardVariant[];
  onDone: () => void;
}) {
  const [phase, setPhase]         = useState<"shake" | "burst" | "reveal">("shake");
  const [revealIndex, setReveal]  = useState(-1); // which card is currently in focus
  const [revealedSet, setRevealed] = useState<Set<number>>(new Set());
  const [allDone, setAllDone]     = useState(false);

  // Auto-advance: shake for 900ms, then burst
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("burst"), 900);
    const t2 = setTimeout(() => {
      setPhase("reveal");
      setReveal(0);
    }, 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const advanceReveal = useCallback(() => {
    if (allDone) return;
    const next = revealIndex + 1;

    // Mark current as revealed
    setRevealed((prev) => new Set([...prev, revealIndex]));

    if (next >= cards.length) {
      setAllDone(true);
    } else {
      setReveal(next);
    }
  }, [revealIndex, allDone, cards.length]);

  // Auto-advance commons after 900ms; pause on rare/epic for tap
  useEffect(() => {
    if (phase !== "reveal" || revealIndex < 0 || allDone) return;
    const current = cards[revealIndex];
    if (current.rarity === "common") {
      const t = setTimeout(advanceReveal, 900);
      return () => clearTimeout(t);
    }
    // rare / epic require a tap — no auto-advance
  }, [phase, revealIndex, allDone, cards, advanceReveal]);

  if (phase === "shake" || phase === "burst") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
        <motion.div
          animate={phase === "shake"
            ? { x: [0, -8, 8, -6, 6, 0], rotate: [0, -3, 3, -2, 2, 0] }
            : { scale: [1, 1.4, 0], opacity: [1, 1, 0] }
          }
          transition={{ duration: phase === "shake" ? 0.8 : 0.6, ease: "easeOut" }}
          className={cn(
            "w-36 h-48 rounded-3xl border-2 flex items-center justify-center text-6xl",
            `bg-gradient-to-b ${pack.bgFrom} ${pack.bgTo}`,
          )}
          style={{ borderColor: pack.accentColor + "70" }}
        >
          ✦
        </motion.div>
        {phase === "burst" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="absolute inset-0 bg-white/10 pointer-events-none"
          />
        )}
      </div>
    );
  }

  // Reveal phase
  if (!allDone) {
    const card   = cards[revealIndex];
    const isEpic = card.rarity === "epic";
    const isRare = card.rarity === "rare";
    const tapNeeded = isRare || isEpic;

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 cursor-pointer select-none"
        onClick={tapNeeded ? advanceReveal : undefined}
      >
        {/* Epic beam */}
        {isEpic && (
          <motion.div
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 0.25 }}
            className="absolute inset-x-0 top-0 bottom-0 bg-gradient-to-b from-purple-500 to-transparent pointer-events-none"
          />
        )}

        {/* Card counter */}
        <p className="absolute top-8 text-xs text-white/30 uppercase tracking-widest">
          Card {revealIndex + 1} of {cards.length}
        </p>

        {/* Rarity badge */}
        {(isRare || isEpic) && (
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "absolute top-20 font-display text-sm font-bold uppercase tracking-widest",
              isEpic ? "text-purple-400" : "text-blue-400"
            )}
          >
            {isEpic ? "✦ Epic Pull! ✦" : "✦ Rare ✦"}
          </motion.p>
        )}

        {/* The card */}
        <motion.div
          key={revealIndex}
          initial={{ rotateY: 90, scale: 0.8, opacity: 0 }}
          animate={{ rotateY: 0, scale: 1, opacity: 1 }}
          transition={{ duration: isEpic ? 0.7 : isRare ? 0.5 : 0.35, type: "spring", stiffness: 200, damping: 20 }}
          style={{ boxShadow: rarityGlow[card.rarity] || undefined }}
          className="w-40 h-56"
        >
          <MiniCard card={card} className="w-full h-full" />
        </motion.div>

        {/* Tap prompt for rare/epic */}
        {tapNeeded && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            className="absolute bottom-12 text-xs text-white/40 uppercase tracking-widest"
          >
            Tap to continue
          </motion.p>
        )}
      </div>
    );
  }

  // All revealed — summary
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col items-center bg-black/95 overflow-y-auto py-10 px-4"
    >
      <p className="font-display text-xl font-bold text-white mb-2">Pack Summary</p>
      <p className="text-sm text-white/40 mb-8">{pack.name}</p>

      <div className="flex gap-3 justify-center flex-wrap max-w-sm mb-10">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{ boxShadow: rarityGlow[card.rarity] || undefined }}
            className="w-24 h-32"
          >
            <MiniCard card={card} className="w-full h-full" />
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-white/30 mb-6">+{PITY_POINTS_PER_PACK} pity points earned</p>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onDone}
        className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
      >
        Done
      </motion.button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  Pity shop
// ─────────────────────────────────────────────

function PityShop() {
  const pityPoints  = usePlayerStore((s) => s.pityPoints);
  const spendPity   = usePlayerStore((s) => s.spendPityPoints);
  const addCards    = useCollectionStore((s) => s.addCards);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleBuy = (cardId: string) => {
    const cost = PITY_SHOP_PRICES[cardId];
    const card = CARD_MAP[cardId];
    if (!card || !cost) return;
    if (!spendPity(cost)) { showToast("Not enough pity points."); return; }
    addCards([card]);
    showToast(`${card.displayName} added to collection!`);
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-bold text-white">Celestial Exchange</h2>
          <p className="text-xs text-white/40 mt-0.5">Spend pity points to target specific cards</p>
        </div>
        <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1.5">
          <span className="text-xs font-bold text-purple-300">{pityPoints} pts</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {ALL_CARDS.map((card) => {
          const cost     = PITY_SHOP_PRICES[card.id];
          const canAfford = pityPoints >= cost;
          return (
            <motion.div
              key={card.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => canAfford && handleBuy(card.id)}
              className={cn(
                "glass rounded-2xl p-3 border flex flex-col items-center gap-2 cursor-pointer transition-colors",
                canAfford
                  ? "border-white/10 hover:border-indigo-500/40"
                  : "border-white/[0.05] opacity-50 cursor-not-allowed"
              )}
            >
              <MiniCard card={card} className="w-full aspect-[3/4]" />
              <div className="flex items-center gap-1">
                <span className="text-purple-400 text-[10px]">★</span>
                <span className="text-[10px] font-bold text-white/60">{cost} pts</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 24, x: "-50%" }}
            animate={{ opacity: 1, y: 0,  x: "-50%" }}
            exit={{ opacity: 0, y: 12,    x: "-50%" }}
            className="fixed bottom-24 left-1/2 bg-indigo-600/90 backdrop-blur-sm border border-indigo-400/30
              text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-xl pointer-events-none"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Page
// ─────────────────────────────────────────────

type PageState =
  | { view: "store" }
  | { view: "opening"; pack: PackType; cards: CardVariant[] };

export default function PacksPage() {
  const coins    = usePlayerStore((s) => s.coins);
  const spendCoins = usePlayerStore((s) => s.spendCoins);
  const addPity  = usePlayerStore((s) => s.addPityPoints);
  const addCards = useCollectionStore((s) => s.addCards);

  const [state, setState]  = useState<PageState>({ view: "store" });
  const [confirm, setConfirm] = useState<PackType | null>(null);

  const handleBuyIntent = (pack: PackType) => setConfirm(pack);

  const handleConfirmBuy = () => {
    if (!confirm) return;
    if (!spendCoins(confirm.cost)) { setConfirm(null); return; }
    const cards = openPack(confirm);
    addCards(cards);
    addPity(PITY_POINTS_PER_PACK);
    setState({ view: "opening", pack: confirm, cards });
    setConfirm(null);
  };

  const handleOpeningDone = () => setState({ view: "store" });

  return (
    <>
      {/* Pack opening — fullscreen cinematic */}
      <AnimatePresence>
        {state.view === "opening" && (
          <PackOpening
            key="opening"
            pack={state.pack}
            cards={state.cards}
            onDone={handleOpeningDone}
          />
        )}
      </AnimatePresence>

      {/* Store */}
      <div className="min-h-full px-4 py-6 max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-white">Pack Store</h1>
          <p className="text-sm text-white/40 mt-1">{coins.toLocaleString()} coins available</p>
        </div>

        <div className="flex flex-col gap-4">
          {PACK_TYPES.map((pack) => (
            <PackStoreCard key={pack.id} pack={pack} coins={coins} onBuy={handleBuyIntent} />
          ))}
        </div>

        <PityShop />
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4"
            onClick={() => setConfirm(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              exit={{ y: 20,    opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-6 w-full max-w-sm border border-white/10"
            >
              <p className="font-display text-lg font-bold text-white text-center mb-1">Open Pack?</p>
              <p className="text-sm text-white/50 text-center mb-6">
                Spend {confirm.cost.toLocaleString()} coins for {confirm.name}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white hover:border-white/20 transition-colors">
                  Cancel
                </button>
                <button onClick={handleConfirmBuy}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
                  Open It
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
