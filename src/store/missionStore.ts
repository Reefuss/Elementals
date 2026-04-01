import { create } from "zustand";
import { persist } from "zustand/middleware";

/** The 3 daily milestones: play 1 / 2 / 3 games */
export const MISSION_MILESTONES = [1, 2, 3] as const;
export type Milestone = (typeof MISSION_MILESTONES)[number];

export const MILESTONE_COIN_REWARDS: Record<Milestone, number> = {
  1: 50,
  2: 50,
  3: 0, // milestone 3 gives a free pack, not coins
};

interface MissionStore {
  /** ISO date string "2026-04-01" — resets daily */
  date: string;
  gamesPlayedToday: number;
  /** Which milestones have been claimed today */
  claimedMilestones: Milestone[];
  /** Whether the pack reward (3rd milestone) has been claimed */
  packRewardPending: boolean;
  packRewardClaimed: boolean;

  /** Call after any match ends */
  recordGame(): { newMilestones: Milestone[] };
  claimMilestone(m: Milestone): boolean;
  claimPackReward(): boolean;
  /** Call on app mount to reset if it's a new day */
  resetIfNewDay(): void;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export const useMissionStore = create<MissionStore>()(
  persist(
    (set, get) => ({
      date:               todayString(),
      gamesPlayedToday:   0,
      claimedMilestones:  [],
      packRewardPending:  false,
      packRewardClaimed:  false,

      recordGame: () => {
        const s = get();
        const newCount = s.gamesPlayedToday + 1;
        // Which milestones just became reachable (not yet claimed)?
        const newMilestones: Milestone[] = MISSION_MILESTONES.filter(
          (m) => newCount >= m && !s.claimedMilestones.includes(m)
        );
        const packPending =
          newCount >= 3 && !s.packRewardClaimed;
        set({
          gamesPlayedToday:  newCount,
          packRewardPending: s.packRewardPending || packPending,
        });
        return { newMilestones };
      },

      claimMilestone: (m) => {
        const s = get();
        if (s.claimedMilestones.includes(m)) return false;
        if (s.gamesPlayedToday < m) return false;
        set({ claimedMilestones: [...s.claimedMilestones, m] });
        return true;
      },

      claimPackReward: () => {
        const s = get();
        if (s.packRewardClaimed || !s.packRewardPending) return false;
        set({ packRewardPending: false, packRewardClaimed: true });
        return true;
      },

      resetIfNewDay: () => {
        const today = todayString();
        if (get().date !== today) {
          set({
            date:              today,
            gamesPlayedToday:  0,
            claimedMilestones: [],
            packRewardPending: false,
            packRewardClaimed: false,
          });
        }
      },
    }),
    { name: "elementals-missions" }
  )
);
