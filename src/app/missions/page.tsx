"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMissionStore, MISSION_MILESTONES, MILESTONE_COIN_REWARDS } from "@/store/missionStore";
import { usePlayerStore } from "@/store/playerStore";
import { useCollectionStore } from "@/store/collectionStore";
import { openPack, PACK_TYPES, PITY_POINTS_PER_PACK } from "@/lib/game/cardPool";
import { cn } from "@/lib/utils";

const MISSION_LABELS: Record<number, string> = {
  1: "Play 1 game",
  2: "Play 2 games",
  3: "Play 3 games",
};

const MISSION_REWARDS: Record<number, string> = {
  1: "+50 coins",
  2: "+50 coins",
  3: "Free Cosmos Pack",
};

export default function MissionsPage() {
  const gamesPlayed   = useMissionStore((s) => s.gamesPlayedToday);
  const claimed       = useMissionStore((s) => s.claimedMilestones);
  const packPending   = useMissionStore((s) => s.packRewardPending);
  const packClaimed   = useMissionStore((s) => s.packRewardClaimed);
  const claimMilestone = useMissionStore((s) => s.claimMilestone);
  const claimPackReward = useMissionStore((s) => s.claimPackReward);

  const addCoins    = usePlayerStore((s) => s.addCoins);
  const addPity     = usePlayerStore((s) => s.addPityPoints);
  const addCards    = useCollectionStore((s) => s.addCards);

  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleClaim = (m: typeof MISSION_MILESTONES[number]) => {
    const ok = claimMilestone(m);
    if (!ok) return;
    const coins = MILESTONE_COIN_REWARDS[m];
    if (coins > 0) {
      addCoins(coins);
      showToast(`+${coins} coins!`);
    }
  };

  const handleClaimPack = () => {
    const ok = claimPackReward();
    if (!ok) return;
    const cosmosPack = PACK_TYPES.find((p) => p.id === "cosmos")!;
    const cards = openPack(cosmosPack);
    addCards(cards);
    addPity(PITY_POINTS_PER_PACK);
    showToast("Cosmos Pack opened! Cards added to collection.");
  };

  const totalGames = 3;
  const progress   = Math.min(gamesPlayed, totalGames);
  const pct        = (progress / totalGames) * 100;

  return (
    <div className="min-h-full px-4 py-6 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Daily Missions</h1>
        <p className="text-sm text-white/40 mt-1">Resets at midnight · {progress}/{totalGames} games played</p>
      </div>

      {/* Overall progress bar */}
      <div className="mb-8">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Mission cards */}
      <div className="flex flex-col gap-3 mb-6">
        {MISSION_MILESTONES.map((m, idx) => {
          const done       = gamesPlayed >= m;
          const isClaimed  = claimed.includes(m);
          const canClaim   = done && !isClaimed && m !== 3;

          return (
            <motion.div
              key={m}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={cn(
                "glass rounded-2xl p-4 border flex items-center gap-4 transition-colors",
                isClaimed  ? "border-indigo-500/30 bg-indigo-500/5"  :
                done       ? "border-white/15"                        :
                             "border-white/[0.07]"
              )}
            >
              {/* Status icon */}
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-base",
                isClaimed  ? "bg-indigo-500/20 text-indigo-300" :
                done       ? "bg-white/10 text-white"            :
                             "bg-white/5 text-white/20"
              )}>
                {isClaimed ? "✓" : done ? "!" : String(m)}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", isClaimed ? "text-white/50 line-through" : "text-white")}>
                  {MISSION_LABELS[m]}
                </p>
                <p className="text-xs text-white/40 mt-0.5">{MISSION_REWARDS[m]}</p>
              </div>

              {/* Claim button (for coin milestones) */}
              {canClaim && (
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleClaim(m)}
                  className="shrink-0 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/40
                    text-indigo-300 text-xs font-semibold hover:bg-indigo-500/30 transition-colors"
                >
                  Claim
                </motion.button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Pack reward card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className={cn(
          "glass rounded-2xl p-5 border flex flex-col gap-4 transition-colors",
          packClaimed   ? "border-white/[0.07] opacity-60" :
          packPending   ? "border-amber-500/40 bg-amber-500/5" :
                          "border-white/[0.07]"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0",
            "bg-gradient-to-b from-indigo-900/80 to-slate-900/80 border",
            packPending ? "border-amber-500/40" : "border-white/10"
          )}>
            ✦
          </div>
          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-0.5">
              Mission Reward
            </p>
            <p className="font-display text-base font-bold text-white">Cosmos Pack</p>
            <p className="text-xs text-white/40 mt-0.5">Complete all 3 daily missions</p>
          </div>
        </div>

        {packPending && !packClaimed && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleClaimPack}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40
              text-amber-300 font-semibold text-sm hover:bg-amber-500/30 transition-colors"
          >
            ✦ Claim Free Pack
          </motion.button>
        )}
        {packClaimed && (
          <p className="text-xs text-center text-white/30">Claimed today · Resets at midnight</p>
        )}
        {!packPending && !packClaimed && (
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </motion.div>

      {/* Toast */}
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
