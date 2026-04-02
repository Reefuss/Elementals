"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_CARDS, CARD_MAP, CardVariant, Rarity, validateDeck, DECK_RULES } from "@/lib/game/cardPool";
import { useDeckStore, SavedDeck } from "@/store/deckStore";
import { useCollectionStore } from "@/store/collectionStore";
import { cn } from "@/lib/utils";
import { GameCard } from "@/components/game/GameCard";
import { Card, CardType, Element, SpecialType } from "@/lib/game/types";

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function variantToCard(v: CardVariant): Card {
  if (v.type === "element") {
    return { id: v.id, type: CardType.ELEMENT, element: v.element as Element, value: v.value as 3|5|8, variantId: v.id };
  }
  if (v.type === "special") {
    return { id: v.id, type: CardType.SPECIAL, specialType: v.specialType as SpecialType, variantId: v.id };
  }
  return { id: v.id, type: CardType.DIAMOND, value: v.value!, variantId: v.id };
}

function cardTotal(cards: Record<string, number>) {
  return Object.values(cards).reduce((s, n) => s + n, 0);
}

// ─────────────────────────────────────────────
//  Auto-build: 7 rock + 7 scissors + 7 paper (highest rarity), fill rest with utility
// ─────────────────────────────────────────────

const RARITY_ORDER: Rarity[] = ["legendary", "epic", "rare", "uncommon", "common"];
const ri = (r: Rarity) => RARITY_ORDER.indexOf(r);

function autoBuildDeck(owned: Record<string, number>): Record<string, number> {
  const result: Record<string, number> = {};

  const pickElement = (element: string, target: number) => {
    const candidates = ALL_CARDS
      .filter((c) => c.type === "element" && c.element === element && (owned[c.id] ?? 0) > 0)
      .sort((a, b) => ri(a.rarity) - ri(b.rarity));

    let picked = 0;
    for (const card of candidates) {
      if (picked >= target) break;
      const available = Math.min(owned[card.id] ?? 0, card.maxPerDeck);
      const toAdd = Math.min(available, target - picked);
      if (toAdd > 0) { result[card.id] = (result[card.id] ?? 0) + toAdd; picked += toAdd; }
    }
  };

  pickElement("ROCK",     7);
  pickElement("SCISSORS", 7);
  pickElement("PAPER",    7);

  // Fill remaining 4 slots: specials first (highest rarity), then elements
  const remaining = () => 25 - cardTotal(result);
  const utility = ALL_CARDS
    .filter((c) => (owned[c.id] ?? 0) > 0)
    .sort((a, b) => {
      if (a.type === "special" && b.type !== "special") return -1;
      if (b.type === "special" && a.type !== "special") return 1;
      if (a.type === "diamond" && b.type !== "diamond") return -1;
      if (b.type === "diamond" && a.type !== "diamond") return 1;
      return ri(a.rarity) - ri(b.rarity);
    });

  for (const card of utility) {
    if (remaining() <= 0) break;
    const inDeck    = result[card.id] ?? 0;
    const available = Math.min(owned[card.id] ?? 0, card.maxPerDeck) - inDeck;
    if (available <= 0) continue;
    const toAdd = Math.min(available, remaining());
    result[card.id] = inDeck + toAdd;
  }

  return result;
}

// ─────────────────────────────────────────────
//  Card grid item — "Add Cards" pool
// ─────────────────────────────────────────────

function CardGridItem({ card, ownedQty, inDeck, canAdd, onAdd, onRemove }: {
  card: CardVariant; ownedQty: number; inDeck: number;
  canAdd: boolean; onAdd?: () => void; onRemove?: () => void;
}) {
  const displayCard = variantToCard(card);
  return (
    <div className={cn("flex flex-col items-center gap-1.5", ownedQty === 0 && "opacity-25 pointer-events-none")}>
      <div className="relative">
        <GameCard card={displayCard} size="md" onClick={canAdd ? onAdd : undefined} />
        {inDeck > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 border border-indigo-400
            flex items-center justify-center text-[10px] font-bold text-white">
            {inDeck}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onRemove} disabled={!inDeck}
          className={cn("w-6 h-6 rounded-full text-sm flex items-center justify-center transition-colors",
            inDeck ? "bg-white/10 hover:bg-red-500/20 text-white/60 hover:text-red-400" : "bg-white/5 text-white/15 cursor-not-allowed")}>
          −
        </button>
        <button onClick={onAdd} disabled={!canAdd}
          className={cn("w-6 h-6 rounded-full text-sm flex items-center justify-center transition-colors",
            canAdd ? "bg-white/10 hover:bg-indigo-500/20 text-white/60 hover:text-indigo-400" : "bg-white/5 text-white/15 cursor-not-allowed")}>
          +
        </button>
      </div>
      {ownedQty > 0 && (
        <p className="text-[9px] text-white/30">×{ownedQty} owned · max {card.maxPerDeck}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Deck list screen
// ─────────────────────────────────────────────

function DeckListScreen({ decks, activeDeckId, onSelect, onCreate }: {
  decks: SavedDeck[]; activeDeckId: string | null;
  onSelect: (d: SavedDeck) => void; onCreate: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {decks.length === 0 ? (
        <div className="text-center py-16 text-white/30">
          <p className="text-4xl mb-3">✦</p>
          <p className="text-sm">No decks yet.</p>
          <p className="text-xs mt-1">Create one to get started.</p>
        </div>
      ) : (
        decks.map((deck, i) => {
          const total      = cardTotal(deck.cards);
          const validation = validateDeck(deck.cards);
          const isActive   = deck.id === activeDeckId;
          return (
            <motion.button
              key={deck.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(deck)}
              className={cn(
                "glass rounded-2xl p-4 border text-left flex items-center gap-4 transition-colors",
                isActive ? "border-indigo-500/40 bg-indigo-500/5" : "border-white/[0.08] hover:border-white/15"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0",
                "bg-gradient-to-b from-indigo-900/60 to-slate-900/60 border",
                isActive ? "border-indigo-500/40" : "border-white/10")}>
                {isActive ? "✦" : "○"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{deck.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-white/40">{total}/25</span>
                  {validation.valid ? <span className="text-xs text-indigo-400">Ready</span>
                    : <span className="text-xs text-red-400">Invalid</span>}
                  {isActive && (
                    <span className="text-xs text-indigo-300 border border-indigo-500/30 rounded-full px-1.5">Active</span>
                  )}
                </div>
              </div>
              <span className="text-white/20 text-lg">›</span>
            </motion.button>
          );
        })
      )}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onCreate}
        className="glass rounded-2xl p-4 border border-dashed border-white/15 hover:border-indigo-500/40
          text-white/40 hover:text-indigo-300 transition-colors flex items-center justify-center gap-2 text-sm"
      >
        <span className="text-lg">+</span> New Deck
      </motion.button>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Deck editor
// ─────────────────────────────────────────────

function DeckEditor({ deck, owned, onSave, onDelete, onBack, onSetActive, isActive }: {
  deck: SavedDeck; owned: Record<string, number>;
  onSave: (cards: Record<string, number>) => void;
  onDelete: () => void; onBack: () => void;
  onSetActive: () => void; isActive: boolean;
}) {
  const [cards,     setCards]     = useState<Record<string, number>>({ ...deck.cards });
  const [renaming,  setRenaming]  = useState(false);
  const [nameInput, setNameInput] = useState(deck.name);
  const { renameDeck } = useDeckStore();

  const total      = cardTotal(cards);
  const validation = validateDeck(cards);

  const addCard = (card: CardVariant) => {
    const current = cards[card.id] ?? 0;
    if (total >= DECK_RULES.maxCards)     return;
    if (current >= card.maxPerDeck)       return;
    if (current >= (owned[card.id] ?? 0)) return;
    setCards((prev) => ({ ...prev, [card.id]: current + 1 }));
  };

  const removeCard = (cardId: string) => {
    setCards((prev) => {
      const next = { ...prev };
      if ((next[cardId] ?? 0) > 0) next[cardId]--;
      return next;
    });
  };

  const handleRename = () => {
    const name = nameInput.trim();
    if (name && name !== deck.name) renameDeck(deck.id, name);
    setRenaming(false);
  };

  const handleAutoBuild = () => {
    setCards(autoBuildDeck(owned));
  };

  // Expand deck into ordered individual card slots for the "In Deck" grid
  const deckCardList: CardVariant[] = [];
  for (const card of ALL_CARDS) {
    const qty = cards[card.id] ?? 0;
    for (let i = 0; i < qty; i++) deckCardList.push(card);
  }

  // Sort pool: owned first, then by type/element, then rarity
  const poolSorted = [...ALL_CARDS].sort((a, b) => {
    const aOwned = (owned[a.id] ?? 0) > 0 ? 0 : 1;
    const bOwned = (owned[b.id] ?? 0) > 0 ? 0 : 1;
    if (aOwned !== bOwned) return aOwned - bOwned;
    if (a.type !== b.type) return a.type === "element" ? -1 : 1;
    if (a.element !== b.element) return (a.element ?? "").localeCompare(b.element ?? "");
    return ri(a.rarity) - ri(b.rarity);
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="glass rounded-2xl p-4 border border-white/[0.08] flex items-center justify-between gap-3">
        <button onClick={onBack} className="text-white/40 hover:text-white transition-colors text-sm shrink-0">
          ‹ Back
        </button>
        {renaming ? (
          <input autoFocus value={nameInput} onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleRename} onKeyDown={(e) => e.key === "Enter" && handleRename()}
            className="flex-1 bg-transparent text-center text-white font-medium text-sm focus:outline-none border-b border-indigo-500/50" />
        ) : (
          <button onClick={() => setRenaming(true)}
            className="flex-1 text-center text-white font-medium text-sm hover:text-indigo-300 transition-colors">
            {deck.name} ✎
          </button>
        )}
        <button onClick={onDelete} className="text-red-400/50 hover:text-red-400 transition-colors text-xs shrink-0">
          Delete
        </button>
      </div>

      {/* Stats row: count · Auto Build · Set Active */}
      <div className="flex items-center justify-between gap-2">
        <span className={cn("text-sm font-medium shrink-0",
          total === 25 ? "text-white" : total > 25 ? "text-red-400" : "text-white/50")}>
          {total} / 25
        </span>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAutoBuild}
          className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20
            border border-indigo-500/30 text-indigo-300 hover:text-indigo-200
            text-xs font-semibold transition-colors"
        >
          ✦ Auto Build
        </motion.button>

        {isActive
          ? <span className="text-xs text-indigo-300 border border-indigo-500/30 rounded-full px-2.5 py-1 shrink-0">Active</span>
          : <button onClick={onSetActive}
              className="text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-full px-2.5 py-1 transition-colors shrink-0">
              Set Active
            </button>
        }
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-300",
            total === 25 ? "bg-indigo-500" : total > 25 ? "bg-red-500" : "bg-white/25")}
          style={{ width: `${Math.min((total / 25) * 100, 100)}%` }} />
      </div>

      {/* Validation errors */}
      {!validation.valid && total > 0 && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex flex-col gap-0.5">
          {validation.errors.map((e) => (
            <p key={e} className="text-xs text-red-400">{e}</p>
          ))}
        </div>
      )}

      {/* ── In Deck — compact slot grid ── */}
      <div className="glass rounded-2xl p-4 border border-white/[0.08]">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-3">
          In Deck <span className="text-white/20 normal-case font-normal">· tap to remove</span>
        </p>

        {deckCardList.length === 0 ? (
          <p className="text-xs text-white/20 text-center py-6">
            No cards yet — use Auto Build or add from the pool below.
          </p>
        ) : (
          <div className="grid grid-cols-5 gap-1">
            {deckCardList.map((card, idx) => (
              <div key={`${card.id}-${idx}`} className="w-full aspect-[3/4]">
                <GameCard
                  card={variantToCard(card)}
                  size="sm"
                  showEffect
                  className="!w-full !h-full"
                  onClick={() => removeCard(card.id)}
                />
              </div>
            ))}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, 25 - deckCardList.length) }).map((_, i) => (
              <div key={`empty-${i}`}
                className="w-full aspect-[3/4] rounded-2xl border-2 border-dashed border-white/[0.07] bg-white/[0.01]" />
            ))}
          </div>
        )}
      </div>

      {/* ── Add Cards pool ── */}
      <div className="glass rounded-2xl p-4 border border-white/[0.08]">
        <p className="text-xs text-white/40 uppercase tracking-widest mb-4">Add Cards</p>
        <div className="grid grid-cols-3 gap-3 justify-items-center">
          {poolSorted.map((card) => {
            const ownedQty = owned[card.id] ?? 0;
            const inDeck   = cards[card.id] ?? 0;
            const canAdd   = ownedQty > 0 && inDeck < card.maxPerDeck && total < 25 && inDeck < ownedQty;
            return (
              <CardGridItem
                key={card.id}
                card={card}
                ownedQty={ownedQty}
                inDeck={inDeck}
                canAdd={canAdd}
                onAdd={() => addCard(card)}
                onRemove={inDeck > 0 ? () => removeCard(card.id) : undefined}
              />
            );
          })}
        </div>
      </div>

      {/* Save */}
      <div className="sticky bottom-0 pt-2 pb-1 bg-cosmic-900/60 backdrop-blur-sm">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { onSave(cards); onBack(); }}
          className={cn(
            "w-full py-3 rounded-xl font-semibold text-sm transition-colors",
            validation.valid && total === 25
              ? "bg-indigo-600 hover:bg-indigo-500 text-white"
              : "bg-white/5 text-white/30 cursor-not-allowed border border-white/10"
          )}
        >
          {validation.valid && total === 25 ? "Save Deck" : "Invalid Deck"}
        </motion.button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Page
// ─────────────────────────────────────────────

export default function DecksPage() {
  const { decks, activeDeckId, createDeck, updateDeck, deleteDeck, setActiveDeck } = useDeckStore();
  const owned = useCollectionStore((s) => s.owned);

  const [editing,    setEditing]    = useState<SavedDeck | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName,    setNewName]    = useState("");

  const handleCreate = () => {
    const name = newName.trim() || `Deck ${decks.length + 1}`;
    const deck = createDeck(name);
    setNewName("");
    setShowCreate(false);
    setEditing(deck);
  };

  return (
    <div className="min-h-full px-4 py-6 max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Decks</h1>
        <p className="text-sm text-white/40 mt-1">
          {decks.length} deck{decks.length !== 1 ? "s" : ""} · 25 cards required
        </p>
      </div>

      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div key="editor" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
            <DeckEditor
              deck={editing} owned={owned}
              onSave={(cards) => updateDeck(editing.id, cards)}
              onDelete={() => { deleteDeck(editing.id); setEditing(null); }}
              onBack={() => setEditing(null)}
              onSetActive={() => setActiveDeck(editing.id)}
              isActive={editing.id === activeDeckId}
            />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
            <DeckListScreen
              decks={decks} activeDeckId={activeDeckId}
              onSelect={setEditing} onCreate={() => setShowCreate(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-3xl p-6 w-full max-w-sm border border-white/10"
            >
              <p className="font-display text-lg font-bold text-white text-center mb-5">Name your deck</p>
              <input autoFocus type="text" placeholder="My Deck…" value={newName}
                maxLength={30} onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm
                  placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 mb-5" />
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={handleCreate}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
