import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CardVariant, DEFAULT_COLLECTION } from "@/lib/game/cardPool";

interface CollectionStore {
  /** variantId → quantity owned */
  owned: Record<string, number>;
  initialized: boolean;

  /** Add cards received from pack opening */
  addCards(cards: CardVariant[]): void;
  getQuantity(variantId: string): number;
  /** Seed with default starter cards on first launch */
  initialize(): void;
}

export const useCollectionStore = create<CollectionStore>()(
  persist(
    (set, get) => ({
      owned:       {},
      initialized: false,

      addCards: (cards) =>
        set((s) => {
          const next = { ...s.owned };
          for (const card of cards) {
            next[card.id] = (next[card.id] ?? 0) + 1;
          }
          return { owned: next };
        }),

      getQuantity: (variantId) => get().owned[variantId] ?? 0,

      initialize: () => {
        if (get().initialized) return;
        set({ owned: { ...DEFAULT_COLLECTION }, initialized: true });
      },
    }),
    { name: "elementals-collection" }
  )
);
