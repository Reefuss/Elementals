"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ALL_CARDS, CardVariant, Rarity } from "@/lib/game/cardPool";
import { useCollectionStore } from "@/store/collectionStore";
import { CardDetailModal } from "@/components/game/CardDetailModal";
import { GameCard } from "@/components/game/GameCard";
import { Card, CardType, Element, SpecialType } from "@/lib/game/types";
import { cn } from "@/lib/utils";


const elementIcon: Record<string, string> = { ROCK: "✊", SCISSORS: "✌", PAPER: "✋" };

type FilterRarity  = "all" | Rarity;
type FilterElement = "all" | "ROCK" | "SCISSORS" | "PAPER" | "special";
type FilterOwned   = "all" | "owned" | "unowned";

function variantToCard(v: CardVariant): Card {
  if (v.type === "element") {
    return { id: v.id, type: CardType.ELEMENT, element: v.element as Element, value: v.value as 3|5|8|12|15, variantId: v.id };
  }
  return { id: v.id, type: CardType.SPECIAL, specialType: v.specialType as SpecialType, variantId: v.id };
}

// ─────────────────────────────────────────────
//  Card grid item
// ─────────────────────────────────────────────

function CollectionCard({ card, qty, onClick }: {
  card: CardVariant; qty: number; onClick: () => void;
}) {
  const owned = qty > 0;
  return (
    <div className={cn("relative cursor-pointer", !owned && "opacity-35 grayscale")} onClick={onClick}>
      <div className="w-full aspect-[3/4]">
        <GameCard card={variantToCard(card)} size="sm" className="!w-full !h-full" />
      </div>
      {qty > 1 && (
        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-black/60 text-[8px] font-bold text-white flex items-center justify-center z-20">
          {qty}
        </div>
      )}
    </div>
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

      {preview && (
        <CardDetailModal
          card={preview}
          owned={owned[preview.id] ?? 0}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
