"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCollectionStore } from "@/store/collectionStore";
import { useMissionStore, MISSION_MILESTONES } from "@/store/missionStore";
import { usePlayerStore } from "@/store/playerStore";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
//  Hub cards
// ─────────────────────────────────────────────

function MissionCard() {
  const router      = useRouter();
  const gamesPlayed = useMissionStore((s) => s.gamesPlayedToday);
  const claimed     = useMissionStore((s) => s.claimedMilestones);
  const packPending = useMissionStore((s) => s.packRewardPending);
  const nextMilestone = MISSION_MILESTONES.find((m) => !claimed.includes(m));
  const allDone       = claimed.length >= MISSION_MILESTONES.length;

  return (
    <motion.button
      onClick={() => router.push("/missions")}
      whileTap={{ scale: 0.97 }}
      className="w-full glass rounded-2xl border border-white/[0.08] hover:border-indigo-500/30 transition-colors text-left overflow-hidden"
    >
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-base">✅</span>
            <span className="text-xs font-semibold text-white/60 uppercase tracking-widest">Daily Missions</span>
          </div>
          {packPending && (
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full px-2 py-0.5 font-semibold">
              Claim Pack ✦
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          {MISSION_MILESTONES.map((m) => {
            const done     = gamesPlayed >= m;
            const claimed_ = claimed.includes(m);
            return (
              <div key={m} className="flex-1">
                <div className={cn(
                  "h-1.5 rounded-full transition-all duration-500",
                  claimed_ ? "bg-indigo-400" : done ? "bg-indigo-400/50" : "bg-white/10"
                )} />
                <p className="text-[9px] text-white/30 mt-1 text-center">{m}g</p>
              </div>
            );
          })}
        </div>
        {!allDone && nextMilestone && (
          <p className="text-[10px] text-white/40 mt-2">
            {gamesPlayed}/{nextMilestone} games · next reward
          </p>
        )}
      </div>
    </motion.button>
  );
}

function PackCard() {
  const router = useRouter();
  const coins  = usePlayerStore((s) => s.coins);

  return (
    <motion.button
      onClick={() => router.push("/packs")}
      whileTap={{ scale: 0.97 }}
      className="w-full glass rounded-2xl border border-amber-500/20 hover:border-amber-400/40 transition-colors text-left overflow-hidden"
    >
      <div className="px-4 py-4 flex items-center gap-4">
        <div className="relative flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden
          bg-gradient-to-b from-amber-900/80 to-slate-900/80 border border-amber-500/30
          flex items-center justify-center">
          <motion.div
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.12), transparent)",
              backgroundSize: "200% 100%",
            }}
          />
          <span className="text-2xl z-10">✦</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-amber-400/70 uppercase tracking-widest">Featured Pack</p>
          <p className="font-display text-base font-bold text-white mt-0.5">Eclipse Pack</p>
          <p className="text-xs text-white/40 mt-0.5">Enhanced epic odds</p>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-[10px] text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
              1,200 coins
            </span>
            {coins >= 1200 && (
              <span className="text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">
                Affordable!
              </span>
            )}
          </div>
        </div>
        <span className="text-white/20 text-lg flex-shrink-0">›</span>
      </div>
    </motion.button>
  );
}

function QuickTile({ icon, label, sub, onClick, accent }: {
  icon: string; label: string; sub: string; onClick: () => void; accent?: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "flex-1 glass rounded-2xl border border-white/[0.08] text-left transition-colors",
        accent ?? "hover:border-indigo-500/30"
      )}
    >
      <div className="px-4 py-4 flex flex-col gap-1.5">
        <span className="text-xl">{icon}</span>
        <p className="font-display text-sm font-bold text-white">{label}</p>
        <p className="text-[10px] text-white/40">{sub}</p>
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────
//  Page
// ─────────────────────────────────────────────

export default function HomePage() {
  const router         = useRouter();
  const initCollection = useCollectionStore((s) => s.initialize);
  const resetMissions  = useMissionStore((s) => s.resetIfNewDay);

  useEffect(() => {
    initCollection();
    resetMissions();
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex flex-col gap-4 px-4 py-6 max-w-md mx-auto">

        {/* Hero */}
        <div className="flex flex-col items-center gap-3 py-6">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl"
          >✦</motion.div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">ELEMENTALS</h1>
          <div className="flex gap-5 text-xl">
            <motion.span animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0 }}
              className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">✊</motion.span>
            <motion.span animate={{ rotate: [0, -12, 12, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              className="text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.8)]">✌</motion.span>
            <motion.span animate={{ rotate: [0, 18, -18, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              className="text-purple-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]">✋</motion.span>
          </div>
        </div>

        {/* Quick tiles */}
        <div className="flex gap-3">
          <QuickTile icon="⚔️" label="Battle" sub="Find a match"
            onClick={() => router.push("/battle")}
            accent="hover:border-indigo-500/30" />
          <QuickTile icon="🃏" label="Collection" sub="View cards"
            onClick={() => router.push("/collection")}
            accent="hover:border-purple-500/30" />
        </div>

        {/* Featured pack */}
        <PackCard />

        {/* Daily missions */}
        <MissionCard />

      </div>
    </div>
  );
}
