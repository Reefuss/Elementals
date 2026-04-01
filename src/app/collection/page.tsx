"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_CARDS, CardVariant, Rarity } from "@/lib/game/cardPool";
import { useCollectionStore } from "@/store/collectionStore";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

const rarityLabel: Record<Rarity, string> = { common: "C", rare: "R", epic: "E" };
const rarityBadge: Record<Rarity, string> = {
  common: "text-white/40 border-white/20",
  rare:   "text-blue-300 border-blue-400/40",
  epic:   "text-purple-300 border-purple-400/60",
};
const rarityGlow: Record<Rarity, string> = {
  common: "",
  rare:   "0 0 18px 3px rgba(99,102,241,0.3)",
  epic:   "0 0 28px 6px rgba(168,85,247,0.4)",
};
const elementGradient: Record<string, string> = {
  SUN:  "from-amber-900/70 to-slate-900/90",
  MOON: "from-blue-950/70 to-slate-900/90",
  STAR: "from-purple-950/70 to-slate-900/90",
};
const elementIcon: Record<string, string>  = { SUN: "☀", MOON: "☽", STAR: "★" };
const elementColor: Record<string, string> = { SUN: "text-amber-400", MOON: "text-blue-300", STAR: "text-purple-400" };

type FilterRarity  = "all" | Rarity;
type FilterElement = "all" | "SUN" | "MOON" | "STAR" | "special";
type FilterOwned   = "all" | "owned" | "unowned";

// ─────────────────────────────────────────────
//  Card grid item
// ─────────────────────────────────────────────

function CollectionCard({
  card,
  qty,
  onClick,
}: {
  card: CardVariant;
  qty: number;
  onClick: () => void;
}) {
  const owned = qty > 0;
  const grad  = card.element ? elementGradient[card.element] : "from-slate-800/80 to-slate-900/90";
  const icon  = card.element
    ? elementIcon[card.element]
    : card.specialType === "BLOCK" ? "🛡" : "🌈";
  const tc    = card.element ? elementColor[card.element] : "text-white";

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-between rounded-2xl border p-2.5 overflow-hidden",
        "bg-gradient-to-b aspect-[3/4] w-full",
        grad,
        owned ? rarityBadge[card.rarity].split(" ")[1] : "border-white/[0.07]",
        !owned && "opacity-40"
      )}
      style={{ boxShadow: owned ? rarityGlow[card.rarity] : undefined }}
    >
      {/* Rarity badge */}
      <div className="flex items-center justify-between w-full">
        {card.value && (
          <span className="text-[9px] font-bold text-white/50">+{card.value}</span>
        )}
        <span className={cn("ml-auto text-[9px] font-bold border rounded px-1", rarityBadge[card.rarity])}>
          {rarityLabel[card.rarity]}
        </span>
      </div>

      {/* Icon */}
      <span className={cn("text-4xl my-1", tc)}>{icon}</span>

      {/* Name */}
      <p className="text-[8px] text-white/50 truncate w-full text-center">{card.displayName}</p>

      {/* Quantity badge */}
      {qty > 0 && (
        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black/60 text-[8px] font-bold text-white flex items-center justify-center">
          {qty}
        </div>
      )}
    </motion.button>
  );
}

// ─────────────────────────────────────────────
//  Card preview modal
// ─────────────────────────────────────────────

function CardPreview({
  card,
  qty,
  onClose,
}: {
  card: CardVariant;
  qty: number;
  onClose: () => void;
}) {
  const grad = card.element ? elementGradient[card.element] : "from-slate-800/80 to-slate-900/90";
  const icon = card.element ? elementIcon[card.element] : card.specialType === "BLOCK" ? "🛡" : "🌈";
  const tc   = card.element ? elementColor[card.element] : "text-white";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col items-center gap-5"
      >
        {/* Large card */}
        <div
          className={cn(
            "w-44 h-60 rounded-3xl border-2 p-4 flex flex-col items-center justify-between",
            "bg-gradient-to-b", grad,
            rarityBadge[card.rarity].split(" ")[1]
          )}
          style={{ boxShadow: rarityGlow[card.rarity] || "none" }}
        >
          <div className="flex items-center justify-between w-full">
            {card.value && <span className="text-xs font-bold text-white/60">+{card.value}</span>}
            <span className={cn("ml-auto text-[10px] font-bold border rounded px-1.5 py-0.5", rarityBadge[card.rarity])}>
              {rarityLabel[card.rarity]}
            </span>
          </div>
          <span className={cn("text-6xl", tc)}>{icon}</span>
          <p className="text-xs text-white/60 text-center">{card.displayName}</p>
        </div>

        {/* Info */}
        <div className="glass rounded-2xl p-5 w-full max-w-xs border border-white/10 text-center">
          <p className="font-display text-lg font-bold text-white">{card.displayName}</p>
          <p className="text-xs text-white/40 mt-1 capitalize">{card.rarity} · {card.type}</p>
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

export default function CollectionPage() {
  const owned = useCollectionStore((s) => s.owned);

  const [filterRarity,  setFilterRarity]  = useState<FilterRarity>("all");
  const [filterElement, setFilterElement] = useState<FilterElement>("all");
  const [filterOwned,   setFilterOwned]   = useState<FilterOwned>("all");
  const [search,        setSearch]        = useState("");
  const [preview,       setPreview]       = useState<CardVariant | null>(null);

  const filtered = ALL_CARDS.filter((c) => {
    if (filterRarity  !== "all" && c.rarity !== filterRarity) return false;
    if (filterElement !== "all") {
      if (filterElement === "special") { if (c.type !== "special") return false; }
      else if (c.element !== filterElement) return false;
    }
    if (filterOwned === "owned"   && !(owned[c.id] > 0)) return false;
    if (filterOwned === "unowned" &&  (owned[c.id] > 0)) return false;
    if (search && !c.displayName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalOwned   = ALL_CARDS.filter((c) => (owned[c.id] ?? 0) > 0).length;
  const totalVariants = ALL_CARDS.length;

  return (
    <div className="min-h-full px-4 py-6 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-display text-2xl font-bold text-white">Collection</h1>
        <p className="text-sm text-white/40 mt-1">{totalOwned} / {totalVariants} cards discovered</p>
      </div>

      {/* Progress bar */}
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
        type="text"
        placeholder="Search cards…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm
          placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 mb-4"
      />

      {/* Filters */}
      <div className="flex flex-col gap-2 mb-5">
        {/* Rarity */}
        <div className="flex gap-2">
          {(["all", "common", "rare", "epic"] as FilterRarity[]).map((r) => (
            <button key={r} onClick={() => setFilterRarity(r)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize",
                filterRarity === r
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "text-white/30 hover:text-white/50"
              )}>
              {r === "all" ? "All Rarities" : r}
            </button>
          ))}
        </div>
        {/* Element */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "SUN", "MOON", "STAR", "special"] as FilterElement[]).map((el) => (
            <button key={el} onClick={() => setFilterElement(el)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                filterElement === el
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "text-white/30 hover:text-white/50"
              )}>
              {el === "all" ? "All Elements" : el === "special" ? "Special" :
                `${elementIcon[el]} ${el[0] + el.slice(1).toLowerCase()}`}
            </button>
          ))}
        </div>
        {/* Owned */}
        <div className="flex gap-2">
          {(["all", "owned", "unowned"] as FilterOwned[]).map((o) => (
            <button key={o} onClick={() => setFilterOwned(o)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize",
                filterOwned === o
                  ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40"
                  : "text-white/30 hover:text-white/50"
              )}>
              {o === "all" ? "All" : o}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <p className="text-4xl mb-3">✦</p>
          <p className="text-sm">No cards match these filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2.5">
          {filtered.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.025 }}
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

      {/* Card preview modal */}
      <AnimatePresence>
        {preview && (
          <CardPreview
            card={preview}
            qty={owned[preview.id] ?? 0}
            onClose={() => setPreview(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
