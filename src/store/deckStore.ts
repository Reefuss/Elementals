import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface SavedDeck {
  id: string;
  name: string;
  /** variantId → count */
  cards: Record<string, number>;
  createdAt: number;
  updatedAt: number;
}

interface DeckStore {
  decks: SavedDeck[];
  activeDeckId: string | null;

  createDeck(name: string): SavedDeck;
  updateDeck(id: string, cards: Record<string, number>): void;
  renameDeck(id: string, name: string): void;
  deleteDeck(id: string): void;
  setActiveDeck(id: string): void;
  getDeck(id: string): SavedDeck | undefined;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export const useDeckStore = create<DeckStore>()(
  persist(
    (set, get) => ({
      decks:        [],
      activeDeckId: null,

      createDeck: (name) => {
        const now  = Date.now();
        const deck: SavedDeck = {
          id:        makeId(),
          name,
          cards:     {},
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          decks:        [...s.decks, deck],
          activeDeckId: s.activeDeckId ?? deck.id,
        }));
        return deck;
      },

      updateDeck: (id, cards) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === id ? { ...d, cards, updatedAt: Date.now() } : d
          ),
        })),

      renameDeck: (id, name) =>
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === id ? { ...d, name, updatedAt: Date.now() } : d
          ),
        })),

      deleteDeck: (id) =>
        set((s) => {
          const remaining = s.decks.filter((d) => d.id !== id);
          return {
            decks:        remaining,
            activeDeckId:
              s.activeDeckId === id
                ? (remaining[0]?.id ?? null)
                : s.activeDeckId,
          };
        }),

      setActiveDeck: (id) => set({ activeDeckId: id }),

      getDeck: (id) => get().decks.find((d) => d.id === id),
    }),
    { name: "elementals-decks" }
  )
);
