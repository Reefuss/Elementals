import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STARTING_COINS, COINS_WIN, COINS_LOSS, PITY_POINTS_PER_PACK } from "@/lib/game/cardPool";

interface PlayerStats {
  wins: number;
  losses: number;
  gamesPlayed: number;
}

interface PlayerStore {
  coins: number;
  pityPoints: number;
  stats: PlayerStats;

  addCoins(amount: number): void;
  /** Returns false if insufficient funds. */
  spendCoins(amount: number): boolean;
  addPityPoints(amount: number): void;
  /** Returns false if insufficient pity. */
  spendPityPoints(amount: number): boolean;
  /** Call after a match ends. Returns coins earned. */
  recordMatch(won: boolean): number;
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set, get) => ({
      coins:      STARTING_COINS,
      pityPoints: 0,
      stats:      { wins: 0, losses: 0, gamesPlayed: 0 },

      addCoins: (amount) =>
        set((s) => ({ coins: s.coins + amount })),

      spendCoins: (amount) => {
        if (get().coins < amount) return false;
        set((s) => ({ coins: s.coins - amount }));
        return true;
      },

      addPityPoints: (amount) =>
        set((s) => ({ pityPoints: s.pityPoints + amount })),

      spendPityPoints: (amount) => {
        if (get().pityPoints < amount) return false;
        set((s) => ({ pityPoints: s.pityPoints - amount }));
        return true;
      },

      recordMatch: (won) => {
        const reward = won ? COINS_WIN : COINS_LOSS;
        set((s) => ({
          coins: s.coins + reward,
          stats: {
            wins:        s.stats.wins        + (won ? 1 : 0),
            losses:      s.stats.losses      + (won ? 0 : 1),
            gamesPlayed: s.stats.gamesPlayed + 1,
          },
        }));
        return reward;
      },
    }),
    { name: "elementals-player" }
  )
);
