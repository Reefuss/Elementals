"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PACK_TYPES, PackType, CardVariant, ALL_CARDS,
  openPack, PITY_POINTS_PER_PACK, getPityPrice,
  calcDuplicatePity, Rarity,
} from "@/lib/game/cardPool";
import { getThemeStyle } from "@/lib/game/artThemes";
import { usePlayerStore } from "@/store/playerStore";
import { useCollectionStore } from "@/store/collectionStore";
import { CardDetailModal } from "@/components/game/CardDetailModal";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
//  Rarity config
// ─────────────────────────────────────────────

const RARITY_LABEL: Record<Rarity, string> = {
  common: "C", uncommon: "U", rare: "R", epic: "E", legendary: "L",
};

const RARITY_BADGE: Record<Rarity, string> = {
  common:    "text-white/35 border-white/15",
  uncommon:  "text-teal-300 border-teal-400/40",
  rare:      "text-blue-300 border-blue-400/50",
  epic:      "text-purple-300 border-purple-400/60",
  legendary: "text-amber-300 border-amber-400/70",
};

const RARITY_GLOW: Record<Rarity, string> = {
  common:    "",
  uncommon:  "0 0 14px 2px rgba(45,212,191,0.25)",
  rare:      "0 0 20px 4px rgba(99,102,241,0.40)",
  epic:      "0 0 30px 6px rgba(168,85,247,0.50)",
  legendary: "0 0 40px 10px rgba(251,191,36,0.60)",
};

const elementIcon: Record<string, string> = { ROCK: "✊", SCISSORS: "✌", PAPER: "✋" };

// ─────────────────────────────────────────────
//  Card face — artTheme-driven visuals
// ─────────────────────────────────────────────

function MiniCard({ card, className, onClick }: {
  card: CardVariant; className?: string; onClick?: () => void;
}) {
  const theme = getThemeStyle(card.artTheme);
  const icon  = card.element
    ? elementIcon[card.element]
    : card.specialType === "BLOCK" ? "🛡"
    : card.specialType === "RESHUFFLE" ? "↺"
    : card.specialType === "DISCARD_TRAP" ? "⊗"
    : card.specialType === "REVIVE" ? "↑"
    : "🌈";

  const isLegendary = card.rarity === "legendary";

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-between rounded-2xl border p-2 overflow-hidden",
        `bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo}`,
        RARITY_BADGE[card.rarity].split(" ")[1],
        onClick && "cursor-pointer",
        className
      )}
      style={{ boxShadow: RARITY_GLOW[card.rarity] || undefined }}
    >
      {/* Legendary shimmer overlay */}
      {isLegendary && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.12) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between w-full z-10">
        {card.value && (
          <span className="text-[9px] font-bold text-white/60">+{card.value}</span>
        )}
        <span className={cn("ml-auto text-[9px] font-bold border rounded px-1", RARITY_BADGE[card.rarity])}>
          {RARITY_LABEL[card.rarity]}
        </span>
      </div>

      {/* Icon */}
      <span className={cn("text-2xl z-10", theme.textColor)}>{icon}</span>

      {/* Name */}
      <p className="text-[7px] text-white/50 truncate w-full text-center z-10 leading-tight">
        {card.displayName}
      </p>

      {/* Effect text */}
      {card.effect && card.effect !== "No effect." && card.effect !== "No effect — pure bluff." && (
        <p className="text-[6px] text-white/30 text-center z-10 leading-tight line-clamp-2 mt-0.5">
          {card.effect}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Pack store card
// ─────────────────────────────────────────────

function PackStoreCard({
  pack, coins, onBuy,
}: { pack: PackType; coins: number; onBuy: (p: PackType) => void }) {
  const canAfford = coins >= pack.cost;
  const w = pack.rarityWeights;

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
          className={cn("w-28 h-36 rounded-2xl border-2 flex items-center justify-center text-5xl",
            `bg-gradient-to-b ${pack.bgFrom} ${pack.bgTo}`)}
          style={{ borderColor: pack.accentColor + "50", boxShadow: `0 0 24px 4px ${pack.accentColor}30` }}
        >
          ✦
        </motion.div>
      </div>

      {/* Info */}
      <div className="text-center">
        <p className="font-display text-xl font-bold text-white">{pack.name}</p>
        <p className="text-sm text-white/40 mt-1">{pack.tagline}</p>

        {/* Odds breakdown */}
        <div className="flex justify-center flex-wrap gap-x-3 gap-y-1 mt-3">
          {w.common    > 0 && <span className="text-xs text-white/30">Common {Math.round(w.common * 100)}%</span>}
          {w.uncommon  > 0 && <span className="text-xs text-teal-400/70">Uncommon {Math.round(w.uncommon * 100)}%</span>}
          {w.rare      > 0 && <span className="text-xs text-blue-400/70">Rare {Math.round(w.rare * 100)}%</span>}
          {w.epic      > 0 && <span className="text-xs text-purple-400/80">Epic {Math.round(w.epic * 100)}%</span>}
          {w.legendary > 0 && <span className="text-xs text-amber-400/80">Legendary {Math.round(w.legendary * 100)}%</span>}
        </div>

        {/* Guarantee badge */}
        {pack.guarantees.length > 0 && (
          <p className="text-xs text-amber-400/70 mt-1.5">
            Slot 5 guaranteed {pack.guarantees[0].minRarity}+
          </p>
        )}
      </div>

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
        {canAfford
          ? `Open for ${pack.cost.toLocaleString()} coins`
          : `Need ${(pack.cost - coins).toLocaleString()} more coins`}
      </motion.button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  Pack opening cinematic
// ─────────────────────────────────────────────

function PackOpening({
  pack, cards, owned, bonusPity, onDone,
}: {
  pack: PackType; cards: CardVariant[];
  owned: Record<string, number>; bonusPity: number;
  onDone: () => void;
}) {
  const [phase, setPhase]           = useState<"shake" | "burst" | "reveal">("shake");
  const [revealIndex, setReveal]    = useState(-1);
  const [allDone, setAllDone]       = useState(false);
  const [preview, setPreview]       = useState<CardVariant | null>(null);

  // Shake → burst → first card
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("burst"), 900);
    const t2 = setTimeout(() => { setPhase("reveal"); setReveal(0); }, 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const advanceReveal = useCallback(() => {
    if (allDone) return;
    const next = revealIndex + 1;
    if (next >= cards.length) setAllDone(true);
    else setReveal(next);
  }, [revealIndex, allDone, cards.length]);

  // Auto-advance commons and uncommons; pause on rare+ for tap
  useEffect(() => {
    if (phase !== "reveal" || revealIndex < 0 || allDone) return;
    const card = cards[revealIndex];
    if (card.rarity === "common" || card.rarity === "uncommon") {
      const delay = card.rarity === "uncommon" ? 1100 : 800;
      const t = setTimeout(advanceReveal, delay);
      return () => clearTimeout(t);
    }
  }, [phase, revealIndex, allDone, cards, advanceReveal]);

  // ── Shake / burst phase ──
  if (phase === "shake" || phase === "burst") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95">
        <motion.div
          animate={phase === "shake"
            ? { x: [0, -8, 8, -6, 6, 0], rotate: [0, -3, 3, -2, 2, 0] }
            : { scale: [1, 1.5, 0.1], opacity: [1, 1, 0] }
          }
          transition={{ duration: phase === "shake" ? 0.8 : 0.5 }}
          className={cn("w-36 h-48 rounded-3xl border-2 flex items-center justify-center text-6xl",
            `bg-gradient-to-b ${pack.bgFrom} ${pack.bgTo}`)}
          style={{ borderColor: pack.accentColor + "70" }}
        >
          ✦
        </motion.div>
        {phase === "burst" && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="absolute inset-0 bg-white/10 pointer-events-none"
          />
        )}
      </div>
    );
  }

  // ── All revealed → summary ──
  if (allDone) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex flex-col items-center bg-black/95 overflow-y-auto py-10 px-4"
      >
        <p className="font-display text-xl font-bold text-white mb-1">Pack Summary</p>
        <p className="text-sm text-white/40 mb-8">{pack.name}</p>

        <div className="flex gap-3 justify-center flex-wrap max-w-sm mb-8">
          {cards.map((card, i) => {
            const isDupe = (owned[card.id] ?? 0) > card.maxPerDeck;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative w-24 h-32 cursor-pointer"
                onClick={() => setPreview(card)}
              >
                <MiniCard card={card} className="w-full h-full" />
                {isDupe && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60">
                    <span className="text-[10px] text-white/70 font-semibold">DUPE</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {preview && (
          <CardDetailModal
            card={preview}
            owned={owned[preview.id] ?? 0}
            onClose={() => setPreview(null)}
          />
        )}

        <div className="flex flex-col items-center gap-1 mb-8 text-xs text-white/40">
          <span>+{PITY_POINTS_PER_PACK} pity points earned</span>
          {bonusPity > 0 && (
            <span className="text-purple-400">+{bonusPity} bonus pity from duplicates</span>
          )}
        </div>

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

  // ── Single-card reveal ──
  const card        = cards[revealIndex];
  const isLegendary = card.rarity === "legendary";
  const isEpic      = card.rarity === "epic";
  const isRare      = card.rarity === "rare";
  const needsTap    = isRare || isEpic || isLegendary;
  const theme       = getThemeStyle(card.artTheme);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 cursor-pointer select-none"
      onClick={needsTap ? advanceReveal : undefined}
    >
      {/* Legendary full-screen beam */}
      {isLegendary && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.18 }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 50% 50%, ${theme.glowColor}, transparent 70%)` }}
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{ background: "conic-gradient(from 0deg, transparent, rgba(251,191,36,0.3), transparent)" }}
          />
        </>
      )}

      {/* Epic beam */}
      {isEpic && (
        <motion.div
          initial={{ scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 0.2 }}
          className="absolute inset-x-0 top-0 bottom-0 pointer-events-none"
          style={{ background: `linear-gradient(to bottom, ${theme.glowColor}, transparent)` }}
        />
      )}

      {/* Card counter */}
      <p className="absolute top-8 text-xs text-white/25 uppercase tracking-widest">
        Card {revealIndex + 1} of {cards.length}
      </p>

      {/* Rarity banner */}
      {needsTap && (
        <motion.p
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className={cn(
            "absolute top-16 font-display text-sm font-bold uppercase tracking-[0.25em]",
            isLegendary ? "text-amber-400" : isEpic ? "text-purple-400" : "text-blue-400"
          )}
        >
          {isLegendary ? "✦ LEGENDARY ✦" : isEpic ? "✦ Epic Pull! ✦" : "✦ Rare ✦"}
        </motion.p>
      )}

      {/* Card */}
      <motion.div
        key={revealIndex}
        initial={{ rotateY: 90, scale: 0.7, opacity: 0 }}
        animate={{ rotateY: 0,  scale: 1,   opacity: 1 }}
        transition={{
          duration: isLegendary ? 0.8 : isEpic ? 0.65 : isRare ? 0.45 : 0.32,
          type: "spring", stiffness: 180, damping: 18,
        }}
        style={{ boxShadow: RARITY_GLOW[card.rarity] || undefined }}
        className="w-44 h-60"
      >
        <MiniCard card={card} className="w-full h-full" />
      </motion.div>

      {/* Flavor text */}
      {needsTap && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-24 text-xs text-white/30 italic max-w-[200px] text-center"
        >
          "{card.flavorText}"
        </motion.p>
      )}

      {/* Tap prompt */}
      {needsTap && (
        <motion.p
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: 0.6 }}
          className="absolute bottom-12 text-xs text-white/30 uppercase tracking-widest"
        >
          Tap to continue
        </motion.p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Pity shop
// ─────────────────────────────────────────────

const RARITY_ORDER: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

function PityShop() {
  const pityPoints = usePlayerStore((s) => s.pityPoints);
  const spendPity  = usePlayerStore((s) => s.spendPityPoints);
  const addCards   = useCollectionStore((s) => s.addCards);
  const owned      = useCollectionStore((s) => s.owned);

  const [filter,  setFilter]  = useState<Rarity | "all">("all");
  const [toast,   setToast]   = useState<string | null>(null);
  const [preview, setPreview] = useState<CardVariant | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const handleBuy = (card: CardVariant) => {
    const cost = getPityPrice(card);
    if (!spendPity(cost)) { showToast("Not enough pity points."); return; }
    addCards([card]);
    showToast(`${card.displayName} added to collection!`);
  };

  const visible = ALL_CARDS.filter((c) => filter === "all" || c.rarity === filter);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-display text-lg font-bold text-white">Celestial Exchange</h2>
          <p className="text-xs text-white/40 mt-0.5">Spend pity points to target any card</p>
        </div>
        <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1.5">
          <span className="text-xs font-bold text-purple-300">{pityPoints} pts</span>
        </div>
      </div>

      {/* Rarity filter */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {(["all", ...RARITY_ORDER] as (Rarity | "all")[]).map((r) => (
          <button key={r} onClick={() => setFilter(r)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium transition-colors capitalize",
              filter === r
                ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                : "text-white/30 hover:text-white/50"
            )}>
            {r === "all" ? "All" : r}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2.5">
        {visible.map((card) => {
          const cost      = getPityPrice(card);
          const canAfford = pityPoints >= cost;
          const ownedQty  = owned[card.id] ?? 0;
          return (
            <motion.div
              key={card.id}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "flex flex-col items-center gap-1",
                (!canAfford) && "opacity-50"
              )}
            >
              <MiniCard
                card={card}
                className="w-full aspect-[3/4]"
                onClick={() => setPreview(card)}
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => canAfford && handleBuy(card)}
                  disabled={!canAfford}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] transition-colors",
                    canAfford
                      ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 cursor-pointer"
                      : "text-white/25 cursor-not-allowed"
                  )}
                >
                  <span className="text-purple-400">★</span>
                  <span className="font-bold">{cost}</span>
                </button>
                {ownedQty > 0 && (
                  <span className="text-[9px] text-white/25">×{ownedQty}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {preview && (
        <CardDetailModal
          card={preview}
          owned={owned[preview.id] ?? 0}
          onClose={() => setPreview(null)}
        />
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 24, x: "-50%" }}
            animate={{ opacity: 1, y: 0,  x: "-50%" }}
            exit={{ opacity: 0,   y: 12,  x: "-50%" }}
            className="fixed bottom-24 left-1/2 bg-indigo-600/90 backdrop-blur-sm border border-indigo-400/30
              text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-xl pointer-events-none z-50"
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
  | { view: "opening"; pack: PackType; cards: CardVariant[]; bonusPity: number };

export default function PacksPage() {
  const coins      = usePlayerStore((s) => s.coins);
  const spendCoins = usePlayerStore((s) => s.spendCoins);
  const addPity    = usePlayerStore((s) => s.addPityPoints);
  const addCards   = useCollectionStore((s) => s.addCards);
  const owned      = useCollectionStore((s) => s.owned);

  const [state,   setState]   = useState<PageState>({ view: "store" });
  const [confirm, setConfirm] = useState<PackType | null>(null);

  const handleConfirmBuy = () => {
    if (!confirm) return;
    if (!spendCoins(confirm.cost)) { setConfirm(null); return; }
    const cards      = openPack(confirm);
    const bonusPity  = calcDuplicatePity(cards, owned);
    addCards(cards);
    addPity(PITY_POINTS_PER_PACK + bonusPity);
    setState({ view: "opening", pack: confirm, cards, bonusPity });
    setConfirm(null);
  };

  return (
    <>
      <AnimatePresence>
        {state.view === "opening" && (
          <PackOpening
            key="opening"
            pack={state.pack}
            cards={state.cards}
            owned={owned}
            bonusPity={state.bonusPity}
            onDone={() => setState({ view: "store" })}
          />
        )}
      </AnimatePresence>

      <div className="min-h-full px-4 py-6 max-w-md mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-white">Pack Store</h1>
          <p className="text-sm text-white/40 mt-1">{coins.toLocaleString()} coins available</p>
        </div>

        <div className="flex flex-col gap-4">
          {PACK_TYPES.map((pack) => (
            <PackStoreCard key={pack.id} pack={pack} coins={coins} onBuy={setConfirm} />
          ))}
        </div>

        <PityShop />
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4"
            onClick={() => setConfirm(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
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
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white transition-colors">
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
