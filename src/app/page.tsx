"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { useSocketInit } from "@/hooks/useSocket";
import { useSocket } from "@/hooks/useSocket";
import { getStoredPlayerId, getStoredUsername, setStoredPlayerId, setStoredUsername } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { QueueState } from "@/components/lobby/QueueState";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

// ─────────────────────────────────────────────
//  Match Found transition overlay
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
        animate={{ scale: 1,   opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.1 }}
        className="flex flex-col items-center gap-6 text-center"
      >
        {/* Flash ring */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 3, opacity: 0 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="absolute w-32 h-32 rounded-full border-2 border-indigo-400"
        />

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-5xl"
        >
          ✦
        </motion.div>

        <div>
          <p className="text-sm text-white/50 uppercase tracking-widest mb-2">Match Found</p>
          <h2 className="font-display text-3xl font-bold text-white">
            vs <span className="text-indigo-300">{opponent?.username ?? "…"}</span>
          </h2>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="glass rounded-3xl p-8 w-full max-w-lg mx-4 border border-white/10 overflow-y-auto max-h-[80vh]"
      >
        <h2 className="font-display text-2xl font-bold text-white mb-6 text-center">
          How to Play
        </h2>
        <div className="space-y-4 text-sm text-white/70 leading-relaxed">
          <Rule emoji="🎯" title="Goal">
            First player to collect <strong className="text-white">3 points</strong> wins.
          </Rule>
          <Rule emoji="🃏" title="Your Deck">
            20 cards: 5 Sun, 5 Moon, 5 Star, and 5 Special. Draw 4 to start, then 1 per round.
          </Rule>
          <Rule emoji="⚔️" title="Elements">
            <span className="text-sun-400 font-semibold">Sun</span> beats{" "}
            <span className="text-star-400 font-semibold">Star</span> ·{" "}
            <span className="text-star-400 font-semibold">Star</span> beats{" "}
            <span className="text-moon-300 font-semibold">Moon</span> ·{" "}
            <span className="text-moon-300 font-semibold">Moon</span> beats{" "}
            <span className="text-sun-400 font-semibold">Sun</span>
          </Rule>
          <Rule emoji="💎" title="Same Element">
            Higher value wins (+8 &gt; +5 &gt; +3). Equal values tie.
          </Rule>
          <Rule emoji="🛡" title="Block">
            Cancels all effects. No points awarded.
          </Rule>
          <Rule emoji="🌈" title="Rainbow">
            Beats any element. Rainbow vs Rainbow triggers a secret element vote — winner takes the point.
          </Rule>
          <Rule emoji="⏱" title="Timer">
            30 seconds per turn. A random card is auto-played if time runs out.
          </Rule>
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
      <div>
        <span className="font-semibold text-white">{title}: </span>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const socket = useSocket();
  useSocketInit(); // wire up server→client events globally

  const {
    screen,
    setScreen,
    username,
    setUsername,
    playerId,
    setPlayerId,
    queuePosition,
    setQueuePosition,
    matchOpponent,
    matchRoomId,
  } = useGameStore();

  const [localUsername, setLocalUsername] = useState("");
  const [queueError,    setQueueError]    = useState("");
  const [showHowTo,     setShowHowTo]     = useState(false);

  // Restore identity on mount
  useEffect(() => {
    let id = getStoredPlayerId();
    if (!id) { id = uuidv4(); setStoredPlayerId(id); }
    setPlayerId(id);

    const saved = getStoredUsername();
    if (saved) { setLocalUsername(saved); setUsername(saved); }
  }, []);

  // Navigate to game room once match is found and transition completes
  useEffect(() => {
    if (screen === "game" && matchRoomId) {
      router.push(`/game/${matchRoomId}`);
    }
  }, [screen, matchRoomId, router]);

  const handleQueue = () => {
    const name = localUsername.trim();
    if (!name) { setQueueError("Please enter a username."); return; }
    if (name.length > 20) { setQueueError("Username max 20 characters."); return; }
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

  return (
    <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
      <AnimatePresence mode="wait">
        {/* ── Queue screen ─────────────────────────── */}
        {screen === "queue" && (
          <motion.div
            key="queue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <QueueState
              position={queuePosition}
              username={username}
              onCancel={handleCancelQueue}
            />
          </motion.div>
        )}

        {/* ── Main menu ────────────────────────────── */}
        {(screen === "menu" || screen === "result") && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{ opacity: 0, y: -16  }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-10 px-6 w-full max-w-sm"
          >
            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="text-5xl"
              >
                ✦
              </motion.div>
              <h1 className="font-display text-5xl font-bold text-white tracking-tight">
                ELEMENTALS
              </h1>
              <p className="text-sm text-white/40 tracking-[0.25em] uppercase">
                Cosmic Card Duel
              </p>
            </div>

            {/* Element icons */}
            <div className="flex gap-6 text-2xl">
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0 }}
                className="text-sun-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"
              >☀</motion.span>
              <motion.span
                animate={{ rotate: [0, -15, 15, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                className="text-moon-300 drop-shadow-[0_0_8px_rgba(147,197,253,0.8)]"
              >☽</motion.span>
              <motion.span
                animate={{ rotate: [0, 20, -20, 0] }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                className="text-star-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]"
              >★</motion.span>
            </div>

            {/* Username input */}
            <div className="w-full flex flex-col gap-2">
              <label className="text-xs text-white/50 uppercase tracking-widest pl-1">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Enter your name…"
                value={localUsername}
                maxLength={20}
                onChange={(e) => { setLocalUsername(e.target.value); setQueueError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleQueue()}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border text-white placeholder-white/20",
                  "bg-white/5 backdrop-blur-sm",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-500/60",
                  "transition-all duration-200",
                  queueError
                    ? "border-red-500/50"
                    : "border-white/10 hover:border-white/20 focus:border-indigo-400/50"
                )}
              />
              {queueError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 pl-1"
                >
                  {queueError}
                </motion.p>
              )}
            </div>

            {/* CTA */}
            <div className="w-full flex flex-col gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={handleQueue}
                className="w-full font-display tracking-wider text-base"
              >
                ✦ Enter Queue
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => setShowHowTo(true)}
                className="w-full text-white/40 hover:text-white"
              >
                How to Play
              </Button>
            </div>

            <p className="text-xs text-white/20 text-center">
              Share this page with a friend and queue together to match up instantly.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match found overlay */}
      <AnimatePresence>
        {screen === "match_found" && (
          <MatchFoundOverlay opponent={matchOpponent} />
        )}
      </AnimatePresence>

      {/* How to play */}
      <AnimatePresence>
        {showHowTo && <HowToPlay onClose={() => setShowHowTo(false)} />}
      </AnimatePresence>
    </div>
  );
}
