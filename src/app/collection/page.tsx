"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_CARDS, CardVariant, Rarity } from "@/lib/game/cardPool";
import { getThemeStyle } from "@/lib/game/artThemes";
import { useCollectionStore } from "@/store/collectionStore";
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

type FilterRarity  = "all" | Rarity;
type FilterElement = "all" | "ROCK" | "SCISSORS" | "PAPER" | "special";
type FilterOwned   = "all" | "owned" | "unowned";

// ─────────────────────────────────────────────
//  Card grid item
// ─────────────────────────────────────────────

function CollectionCard({ card, qty, onClick }: {
  card: CardVariant; qty: number; onClick: () => void;
}) {
  const owned  = qty > 0;
  const theme  = getThemeStyle(card.artTheme);
  const icon   = card.element
    ? elementIcon[card.element]
    : card.specialType === "BLOCK" ? "🛡" : "🌈";

  const isLegendary = card.rarity === "legendary";

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-between rounded-2xl border p-2 overflow-hidden",
        `bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo}`,
        "aspect-[3/4] w-full",
        owned ? RARITY_BADGE[card.rarity].split(" ")[1] : "border-white/[0.07]",
        !owned && "opacity-35 grayscale"
      )}
      style={{ boxShadow: owned ? (RARITY_GLOW[card.rarity] || undefined) : undefined }}
    >
      {/* Legendary shimmer */}
      {isLegendary && owned && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.1) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      )}

      {/* Rarity badge */}
      <div className="flex items-center justify-between w-full z-10">
        {card.value && <span className="text-[8px] font-bold text-white/50">+{card.value}</span>}
        <span className={cn("ml-auto text-[8px] font-bold border rounded px-0.5", RARITY_BADGE[card.rarity])}>
          {RARITY_LABEL[card.rarity]}
        </span>
      </div>

      {/* Icon */}
      <span className={cn("text-3xl z-10", theme.textColor)}>{icon}</span>

      {/* Name */}
      <p className="text-[7px] text-white/45 truncate w-full text-center z-10 leading-tight">
        {card.displayName}
      </p>

      {/* Owned quantity badge */}
      {qty > 0 && (
        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black/60 text-[8px] font-bold text-white flex items-center justify-center z-20">
          {qty}
        </div>
      )}
    </motion.button>
  );
}

// ─────────────────────────────────────────────
//  Card preview modal
// ─────────────────────────────────────────────

function CardPreview({ card, qty, onClose }: {
  card: CardVariant; qty: number; onClose: () => void;
}) {
  const theme = getThemeStyle(card.artTheme);
  const icon  = card.element
    ? elementIcon[card.element]
    : card.specialType === "BLOCK" ? "🛡" : "🌈";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1,   opacity: 1 }}
        exit={{ scale: 0.85,   opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col items-center gap-5"
      >
        {/* Large card */}
        <div
          className={cn(
            "w-44 h-60 rounded-3xl border-2 p-4 flex flex-col items-center justify-between overflow-hidden relative",
            `bg-gradient-to-b ${theme.bgFrom} ${theme.bgTo}`,
            RARITY_BADGE[card.rarity].split(" ")[1]
          )}
          style={{ boxShadow: RARITY_GLOW[card.rarity] || "none" }}
        >
          {card.rarity === "legendary" && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
              style={{
                background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.12), transparent)",
                backgroundSize: "200% 100%",
              }}
            />
          )}
          <div className="flex items-center justify-between w-full z-10">
            {card.value && <span className="text-xs font-bold text-white/60">+{card.value}</span>}
            <span className={cn("ml-auto text-[10px] font-bold border rounded px-1.5 py-0.5", RARITY_BADGE[card.rarity])}>
              {RARITY_LABEL[card.rarity]}
            </span>
          </div>
          <span className={cn("text-6xl z-10", theme.textColor)}>{icon}</span>
          <p className="text-xs text-white/60 text-center z-10">{card.displayName}</p>
        </div>

        {/* Info card */}
        <div className="glass rounded-2xl p-5 w-full max-w-xs border border-white/10 text-center">
          <p className="font-display text-lg font-bold text-white">{card.displayName}</p>
          <p className={cn("text-xs mt-0.5 capitalize", RARITY_BADGE[card.rarity].split(" ")[0])}>
            {card.rarity} · {card.type}
          </p>
          <p className="text-xs text-white/30 italic mt-2 leading-relaxed">"{card.flavorText}"</p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div>
              <p className="font-bold text-white">{qty}</p>
              <p className="text-white/40 text-xs">Owned</p>
            </div>
            <div>
              <p className="font-bold text-white">{card.maxPerDeck}</p>
              <p className="text-white/40 text-xs">Max/Deck</p>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="text-xs text-white/30 hover:text-white/50 transition-colors">
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  Page
// ─────────────────────────────────────────────

const RARITY_ORDER: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

export default function CollectionPage() {
  const owned = useCollectionStore((s) => s.owned);

  const [filterRarity,  setFilterRarity]  = useState<FilterRarity>("all");
  const [filterElement, setFilterElement] = useState<FilterElement>("all");
  const [filterOwned,   setFilterOwned]   = useState<FilterOwned>("all");
  const [search,        setSearch]        = useState("");
  const [preview,       setPreview]       = useState<CardVariant | null>(null);

  const filtered = ALL_CARDS.filter((c) => {
    if (filterRarity !== "all" && c.rarity !== filterRarity) return false;
    if (filterElement !== "all") {
      if (filterElement === "special") { if (c.type !== "special") return false; }
      else if (c.element !== filterElement) return false;
    }
    if (filterOwned === "owned"   && !(owned[c.id] > 0)) return false;
    if (filterOwned === "unowned" &&  (owned[c.id] > 0)) return false;
    if (search && !c.displayName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalOwned    = ALL_CARDS.filter((c) => (owned[c.id] ?? 0) > 0).length;
  const totalVariants = ALL_CARDS.length;

  return (
    <div className="min-h-full px-4 py-6 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold text-white">Collection</h1>
        <p className="text-sm text-white/40 mt-1">{totalOwned} / {totalVariants} discovered</p>
      </div>

      {/* Completion bar */}
      <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-5">
        <motion.div
          className="h-full bg-indigo-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(totalOwned / totalVariants) * 100}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>

      {/* Search */}
      <input
        type="text" placeholder="Search cards…" value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm
          placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 mb-4"
      />

      {/* Filters */}
      <div className="flex flex-col gap-2 mb-5">
        {/* Rarity */}
        <div className="flex gap-1.5 flex-wrap">
          {(["all", ...RARITY_ORDER] as FilterRarity[]).map((r) => (
            <button key={r} onClick={() => setFilterRarity(r)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-colors capitalize",
                filterRarity === r
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "text-white/30 hover:text-white/50"
              )}>
              {r === "all" ? "All" : r}
            </button>
          ))}
        </div>
        {/* Element */}
        <div className="flex gap-1.5 flex-wrap">
          {(["all", "ROCK", "SCISSORS", "PAPER", "special"] as FilterElement[]).map((el) => (
            <button key={el} onClick={() => setFilterElement(el)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                filterElement === el
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "text-white/30 hover:text-white/50"
              )}>
              {el === "all" ? "All Types" : el === "special" ? "Special"
                : `${elementIcon[el]} ${el[0] + el.slice(1).toLowerCase()}`}
            </button>
          ))}
        </div>
        {/* Owned */}
        <div className="flex gap-1.5">
          {(["all", "owned", "unowned"] as FilterOwned[]).map((o) => (
            <button key={o} onClick={() => setFilterOwned(o)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium transition-colors capitalize",
                filterOwned === o
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "text-white/30 hover:text-white/50"
              )}>
              {o === "all" ? "All" : o}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-white/25 mb-3">{filtered.length} cards</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <p className="text-4xl mb-3">✦</p>
          <p className="text-sm">No cards match these filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {filtered.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.02, 0.4) }}
            >
              <CollectionCard
                card={card}
                qty={owned[card.id] ?? 0}
                onClick={() => setPreview(card)}
              />
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {preview && (
          <CardPreview card={preview} qty={owned[preview.id] ?? 0} onClose={() => setPreview(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
