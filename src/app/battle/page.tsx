"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { useSocket } from "@/hooks/useSocket";
import { useDeckStore } from "@/store/deckStore";
import { validateDeck } from "@/lib/game/cardPool";
import { getStoredUsername } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
          <Rule emoji="🃏" title="Deck">24–25 cards — Elements, Specials, and optional Diamond. Draw 4 to start, then 1 per round.</Rule>
          <Rule emoji="⚔️" title="Elements">
            <span className="text-amber-400 font-semibold">Sun</span> beats{" "}
            <span className="text-purple-400 font-semibold">Star</span> ·{" "}
            <span className="text-purple-400 font-semibold">Star</span> beats{" "}
            <span className="text-blue-300 font-semibold">Moon</span> ·{" "}
            <span className="text-blue-300 font-semibold">Moon</span> beats{" "}
            <span className="text-amber-400 font-semibold">Sun</span>
          </Rule>
          <Rule emoji="💎" title="Same Element">Higher value wins (+8 &gt; +5 &gt; +3). Ties score nothing.</Rule>
          <Rule emoji="🛡" title="Block">Cancels all effects. No points awarded. Highest priority after Discard Trap.</Rule>
          <Rule emoji="🌈" title="Rainbow">Beats any element. Rainbow vs Rainbow triggers a secret element vote.</Rule>
          <Rule emoji="🔄" title="Reshuffle">Sacrifice the round — return your hand to the deck and draw 3 fresh cards.</Rule>
          <Rule emoji="⛔" title="Discard Trap">Voids the opponent's played card permanently. Highest priority card.</Rule>
          <Rule emoji="✨" title="Revive">Sacrifice the round to bring one card back from your discard pile.</Rule>
          <Rule emoji="💠" title="Diamond">Beats all element cards. Diamond vs Diamond: higher value wins.</Rule>
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
//  Queue overlay
// ─────────────────────────────────────────────

function QueueOverlay({ username, onCancel }: { username: string; onCancel: () => void }) {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const iv = setInterval(() => setDots((d) => d.length >= 3 ? "." : d + "."), 600);
    return () => clearInterval(iv);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-8 bg-cosmic-950/80 backdrop-blur-sm"
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="text-5xl"
      >⚔️</motion.div>
      <div className="text-center">
        <p className="font-display text-xl font-bold text-white">Finding opponent{dots}</p>
        <p className="text-sm text-white/40 mt-1">Playing as <span className="text-white/70">{username}</span></p>
      </div>
      <button
        onClick={onCancel}
        className="px-6 py-2 rounded-full border border-white/20 text-sm text-white/50 hover:text-white/80 hover:border-white/40 transition-colors"
      >
        Cancel
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────

export default function BattlePage() {
  const socket = useSocket();
  const router = useRouter();

  const { screen, setScreen, username, setUsername, setQueuePosition, matchOpponent } = useGameStore();
  const decks        = useDeckStore((s) => s.decks);
  const activeDeckId = useDeckStore((s) => s.activeDeckId);

  const [showHowTo, setShowHowTo] = useState(false);

  useEffect(() => {
    const saved = getStoredUsername();
    if (saved) setUsername(saved);
  }, []);

  // Deck validity
  const activeDeck = decks.find((d) => d.id === activeDeckId);
  const deckValid  = activeDeck ? validateDeck(activeDeck.cards).valid : false;
  const hasAnyDeck = decks.length > 0;

  const handleQueue = () => {
    if (!deckValid) return;
    const name = (username || getStoredUsername() || "").trim();
    if (!name) return;
    socket.emit("queue:join", { username: name, deckCards: activeDeck?.cards ?? {} }, (err) => {
      if (err) return;
      setScreen("queue");
    });
  };

  const handleCancelQueue = () => {
    socket.emit("queue:leave");
    setQueuePosition(0);
    setScreen("menu");
  };

  const isQueuing = screen === "queue";

  return (
    <div className="h-full relative overflow-hidden">

      {/* ── Queue overlay ── */}
      <AnimatePresence>
        {isQueuing && (
          <QueueOverlay username={username} onCancel={handleCancelQueue} />
        )}
      </AnimatePresence>

      {/* ── Match found overlay ── */}
      <AnimatePresence>
        {screen === "match_found" && <MatchFoundOverlay opponent={matchOpponent} />}
      </AnimatePresence>

      {/* ── How to play ── */}
      <AnimatePresence>
        {showHowTo && <HowToPlay onClose={() => setShowHowTo(false)} />}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="h-full overflow-y-auto">
        <div className="flex flex-col max-w-md mx-auto">

          {/* Hero banner */}
          <div className="relative h-52 overflow-hidden flex items-center justify-center bg-gradient-to-b from-indigo-950 to-cosmic-950">
            {/* Floating element orbs */}
            <motion.div animate={{ y: [0, -12, 0], x: [0, 6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-8 left-12 text-4xl text-amber-400 drop-shadow-[0_0_16px_rgba(251,191,36,0.8)]">☀</motion.div>
            <motion.div animate={{ y: [0, 10, 0], x: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
              className="absolute top-10 right-14 text-3xl text-blue-300 drop-shadow-[0_0_16px_rgba(147,197,253,0.8)]">☽</motion.div>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
              className="absolute bottom-10 right-10 text-3xl text-purple-400 drop-shadow-[0_0_16px_rgba(192,132,252,0.8)]">★</motion.div>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
              className="absolute bottom-12 left-10 text-2xl text-teal-300 drop-shadow-[0_0_12px_rgba(94,234,212,0.7)]">☽</motion.div>

            <div className="relative z-10 text-center">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="text-6xl mb-2"
              >⚔️</motion.div>
              <h1 className="font-display text-2xl font-bold text-white tracking-wider">Battle</h1>
              <p className="text-xs text-white/40 mt-1">Win: +100 coins · Loss: +30 coins</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-4 px-4 py-5">

            {/* Versus card */}
            <div className="glass rounded-2xl border border-white/[0.08] overflow-hidden">
              <div className="px-5 pt-5 pb-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-base font-bold text-white">Versus</p>
                    <p className="text-xs text-white/40 mt-0.5">1v1 real-time matchmaking</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl">
                    ⚔️
                  </div>
                </div>

                {/* Deck check */}
                {!hasAnyDeck ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
                      <span className="text-amber-400 text-sm">⚠</span>
                      <p className="text-xs text-amber-300">You need a deck to battle.</p>
                    </div>
                    <button
                      onClick={() => router.push("/decks")}
                      className="w-full py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-semibold hover:bg-amber-500/25 transition-colors"
                    >
                      Build a Deck →
                    </button>
                  </div>
                ) : !deckValid ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
                      <span className="text-amber-400 text-sm">⚠</span>
                      <p className="text-xs text-amber-300">
                        {activeDeck
                          ? `"${activeDeck.name}" is not valid.`
                          : "No active deck selected."}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push("/decks")}
                      className="w-full py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium hover:bg-indigo-500/20 transition-colors"
                    >
                      Fix Deck →
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                    <span className="text-emerald-400 text-sm">✓</span>
                    <p className="text-xs text-emerald-300">
                      Deck: <span className="font-semibold">{activeDeck!.name}</span>
                    </p>
                    <button
                      onClick={() => router.push("/decks")}
                      className="ml-auto text-[10px] text-white/30 hover:text-white/60 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleQueue}
                  disabled={!deckValid}
                  className={cn(
                    "w-full font-display tracking-wider",
                    !deckValid && "opacity-40 cursor-not-allowed"
                  )}
                >
                  ✦ Find Match
                </Button>
              </div>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => router.push("/decks")}
                className="glass rounded-2xl p-4 border border-white/[0.08] flex flex-col items-center gap-2 hover:border-indigo-500/30 transition-colors"
              >
                <span className="text-2xl">🃏</span>
                <span className="text-xs font-semibold text-white/70">Decks</span>
                <span className="text-[10px] text-white/30">Build &amp; manage</span>
              </button>
              <button
                onClick={() => setShowHowTo(true)}
                className="glass rounded-2xl p-4 border border-white/[0.08] flex flex-col items-center gap-2 hover:border-indigo-500/30 transition-colors"
              >
                <span className="text-2xl">📖</span>
                <span className="text-xs font-semibold text-white/70">Guide</span>
                <span className="text-[10px] text-white/30">How to play</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
