"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { usePlayerStore } from "@/store/playerStore";
import { useCollectionStore } from "@/store/collectionStore";
import { useMissionStore, MISSION_MILESTONES } from "@/store/missionStore";
import { useSocket } from "@/hooks/useSocket";
import { getStoredUsername, setStoredUsername } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QueueState } from "@/components/lobby/QueueState";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
//  Typewriter
// ─────────────────────────────────────────────

function Typewriter({ text, startDelay = 0 }: { text: string; startDelay?: number }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    const timer = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) clearInterval(iv);
      }, 55);
      return () => clearInterval(iv);
    }, startDelay);
    return () => clearTimeout(timer);
  }, [text, startDelay]);
  return <>{displayed || "\u00A0"}</>;
}

// ─────────────────────────────────────────────
//  Match Found overlay
// ─────────────────────────────────────────────

function MatchFoundOverlay({ opponent }: { opponent: { username: string } | null }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="absolute w-32 h-32 rounded-full border-2 border-indigo-400" />
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1.8, delay: 0.4 }}
          className="absolute w-32 h-32 rounded-full border-2 border-indigo-400" />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-5xl">✦</motion.div>
        <div>
          <p className="text-sm text-white/50 uppercase tracking-widest mb-2">Match Found</p>
          <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
            className="font-display text-3xl font-bold text-white">
            vs <span className="text-indigo-300">
              <Typewriter text={opponent?.username ?? "…"} startDelay={1200} />
            </span>
          </motion.h2>
        </div>
        <p className="text-xs text-white/30">Preparing the arena…</p>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  How to Play modal
// ─────────────────────────────────────────────

function HowToPlay({ onClose }: { onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-3xl p-8 w-full max-w-lg mx-4 border border-white/10 overflow-y-auto max-h-[80vh]">
        <h2 className="font-display text-2xl font-bold text-white mb-6 text-center">How to Play</h2>
        <div className="space-y-4 text-sm text-white/70 leading-relaxed">
          <Rule emoji="🎯" title="Goal">First to collect <strong className="text-white">3 points</strong> wins.</Rule>
          <Rule emoji="🃏" title="Deck">20 cards — Sun, Moon, Star, and Specials. Draw 4 to start, then 1 per round.</Rule>
          <Rule emoji="⚔️" title="Elements">
            <span className="text-amber-400 font-semibold">Sun</span> beats{" "}
            <span className="text-purple-400 font-semibold">Star</span> ·{" "}
            <span className="text-purple-400 font-semibold">Star</span> beats{" "}
            <span className="text-blue-300 font-semibold">Moon</span> ·{" "}
            <span className="text-blue-300 font-semibold">Moon</span> beats{" "}
            <span className="text-amber-400 font-semibold">Sun</span>
          </Rule>
          <Rule emoji="💎" title="Same Element">Higher value wins (+8 &gt; +5 &gt; +3). Ties score nothing.</Rule>
          <Rule emoji="🛡" title="Block">Cancels all effects. No points awarded.</Rule>
          <Rule emoji="🌈" title="Rainbow">Beats any element. Rainbow vs Rainbow triggers a secret element vote.</Rule>
          <Rule emoji="⏱" title="Timer">30 seconds per turn. A random card is auto-played if time runs out.</Rule>
        </div>
        <div className="mt-8 flex justify-center">
          <Button variant="secondary" onClick={onClose}>Got it</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Rule({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="text-lg flex-shrink-0 mt-0.5">{emoji}</span>
      <div><span className="font-semibold text-white">{title}: </span>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Hub cards
// ─────────────────────────────────────────────

function MissionSnippet() {
  const router        = useRouter();
  const gamesPlayed   = useMissionStore((s) => s.gamesPlayedToday);
  const claimed       = useMissionStore((s) => s.claimedMilestones);
  const packPending   = useMissionStore((s) => s.packRewardPending);

  return (
    <motion.button
      onClick={() => router.push("/missions")}
      whileTap={{ scale: 0.97 }}
      className="w-full glass rounded-2xl p-4 border border-white/[0.08] text-left hover:border-indigo-500/30 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Daily Missions</span>
        {packPending && (
          <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full px-2 py-0.5">
            Claim Pack ✦
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {MISSION_MILESTONES.map((m) => {
          const done    = gamesPlayed >= m;
          const claimed_ = claimed.includes(m);
          return (
            <div key={m} className="flex-1">
              <div className={cn(
                "h-1 rounded-full transition-all duration-500",
                claimed_ ? "bg-indigo-400" : done ? "bg-indigo-400/60" : "bg-white/10"
              )} />
              <p className="text-[10px] text-white/30 mt-1">{m} game{m > 1 ? "s" : ""}</p>
            </div>
          );
        })}
      </div>
    </motion.button>
  );
}

function PackSnippet() {
  const router = useRouter();
  return (
    <motion.button
      onClick={() => router.push("/packs")}
      whileTap={{ scale: 0.97 }}
      className="w-full glass rounded-2xl p-4 border border-amber-500/20 text-left hover:border-amber-400/40 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-amber-400/70 uppercase tracking-widest">Featured</span>
          <p className="font-display text-base font-bold text-white mt-0.5">Eclipse Pack</p>
          <p className="text-xs text-white/40 mt-0.5">Enhanced epic odds · 1,200 coins</p>
        </div>
        <div className="w-12 h-16 rounded-xl bg-gradient-to-b from-amber-900/80 to-slate-900/80 border border-amber-500/30
          flex items-center justify-center text-xl">
          ✦
        </div>
      </div>
    </motion.button>
  );
}

function StatsRow() {
  const stats = usePlayerStore((s) => s.stats);
  const total = stats.gamesPlayed;
  const winRate = total > 0 ? Math.round((stats.wins / total) * 100) : 0;
  return (
    <div className="flex gap-3 text-center">
      {[
        { label: "Wins",   value: stats.wins   },
        { label: "Losses", value: stats.losses },
        { label: "Win %",  value: `${winRate}%` },
      ].map(({ label, value }) => (
        <div key={label} className="flex-1 glass rounded-xl py-2 border border-white/[0.06]">
          <p className="font-display text-lg font-bold text-white">{value}</p>
          <p className="text-[10px] text-white/40 uppercase tracking-wide mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────

export default function HomePage() {
  const socket = useSocket();

  const { screen, setScreen, username, setUsername, setQueuePosition, matchOpponent } = useGameStore();
  const initCollection = useCollectionStore((s) => s.initialize);
  const resetMissions  = useMissionStore((s) => s.resetIfNewDay);

  const [localUsername, setLocalUsername] = useState("");
  const [queueError,    setQueueError]    = useState("");
  const [showHowTo,     setShowHowTo]     = useState(false);

  // One-time init on mount
  useEffect(() => {
    initCollection();
    resetMissions();
    const saved = getStoredUsername();
    if (saved) { setLocalUsername(saved); setUsername(saved); }
  }, []);

  const handleQueue = () => {
    const name = localUsername.trim();
    if (!name)          { setQueueError("Please enter a name."); return; }
    if (name.length > 20) { setQueueError("Max 20 characters."); return; }
    setQueueError("");
    setStoredUsername(name);
    setUsername(name);
    socket.emit("queue:join", { username: name }, (err) => {
      if (err) { setQueueError(err); return; }
      setScreen("queue");
    });
  };

  const handleCancelQueue = () => {
    socket.emit("queue:leave");
    setQueuePosition(0);
    setScreen("menu");
  };

  const showMenu = screen === "menu" || screen === "result";

  return (
    <div className="h-full relative overflow-hidden">

      {/* ── Queue overlay ── */}
      <AnimatePresence>
        {screen === "queue" && (
          <motion.div key="queue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-30">
            <QueueState
              position={useGameStore.getState().queuePosition}
              username={username}
              onCancel={handleCancelQueue}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Hub ── */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            key="hub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full overflow-y-auto"
          >
            <div className="flex flex-col gap-5 px-4 py-6 max-w-md mx-auto">

              {/* Hero */}
              <div className="flex flex-col items-center gap-3 py-4">
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-4xl">✦</motion.div>
                <h1 className="font-display text-4xl font-bold text-white tracking-tight">ELEMENTALS</h1>
                <div className="flex gap-5 text-xl">
                  <motion.span animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0 }}
                    className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">☀</motion.span>
                  <motion.span animate={{ rotate: [0, -12, 12, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    className="text-blue-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.8)]">☽</motion.span>
                  <motion.span animate={{ rotate: [0, 18, -18, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    className="text-purple-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]">★</motion.span>
                </div>
              </div>

              {/* Stats row */}
              <StatsRow />

              {/* Battle section */}
              <div className="glass rounded-2xl p-5 border border-white/[0.08] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/50 uppercase tracking-widest">Battle</span>
                  <span className="text-xs text-white/30">Win: +100 coins · Loss: +30 coins</span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs text-white/50 uppercase tracking-widest pl-1">Your Name</label>
                  <input
                    type="text"
                    placeholder="Enter your name…"
                    value={localUsername}
                    maxLength={20}
                    onChange={(e) => { setLocalUsername(e.target.value); setQueueError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleQueue()}
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl border text-white placeholder-white/20 text-sm",
                      "bg-white/5 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60",
                      "transition-all duration-200",
                      queueError
                        ? "border-red-500/50"
                        : "border-white/10 hover:border-white/20 focus:border-indigo-400/50"
                    )}
                  />
                  {queueError && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400 pl-1">{queueError}</motion.p>
                  )}
                </div>

                <Button variant="primary" size="lg" onClick={handleQueue}
                  className="w-full font-display tracking-wider">
                  ✦ Enter Queue
                </Button>

                <button onClick={() => setShowHowTo(true)}
                  className="text-xs text-white/30 hover:text-white/50 transition-colors text-center">
                  How to Play
                </button>
              </div>

              {/* Daily missions snippet */}
              <MissionSnippet />

              {/* Featured pack */}
              <PackSnippet />

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match found overlay */}
      <AnimatePresence>
        {screen === "match_found" && <MatchFoundOverlay opponent={matchOpponent} />}
      </AnimatePresence>

      {/* How to play */}
      <AnimatePresence>
        {showHowTo && <HowToPlay onClose={() => setShowHowTo(false)} />}
      </AnimatePresence>
    </div>
  );
}
