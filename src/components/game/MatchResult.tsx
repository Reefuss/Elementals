"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MatchResult as IMatchResult } from "@/lib/game/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { POINTS_TO_WIN } from "@/lib/game/constants";
import { SoundEngine } from "@/lib/sound/engine";

interface MatchResultProps {
  result:    IMatchResult;
  selfId:    string;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function MatchResultScreen({
  result,
  selfId,
  onPlayAgain,
  onMainMenu,
}: MatchResultProps) {
  const youWon  = result.winnerId === selfId;
  const isTie   = result.winnerId === null;

  const myScore  = result.finalScores[selfId] ?? 0;
  const oppScore = Object.entries(result.finalScores).find(([id]) => id !== selfId)?.[1] ?? 0;

  const [phase, setPhase] = useState(0);
  const [counted, setCounted] = useState({ my: 0, opp: 0 });

  useEffect(() => {
    // Play win/lose fanfare timed with the title slam (phase 1 at 500ms)
    const t0 = setTimeout(() => {
      SoundEngine.play(youWon ? "match_win" : isTie ? "round_tie" : "match_lose");
    }, 500);
    const t1 = setTimeout(() => setPhase(1), 500);
    const t2 = setTimeout(() => setPhase(2), 1300);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase < 2) return;
    const iv = setInterval(() => {
      setCounted((prev) => {
        const nextMy  = prev.my  < myScore  ? prev.my  + 1 : myScore;
        const nextOpp = prev.opp < oppScore ? prev.opp + 1 : oppScore;
        if (nextMy === myScore && nextOpp === oppScore) clearInterval(iv);
        return { my: nextMy, opp: nextOpp };
      });
    }, 250);
    return () => clearInterval(iv);
  }, [phase, myScore, oppScore]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Particles */}
      {(youWon || isTie) && <Particles won={youWon} />}

      {/* Phase 1: Big title slams in */}
      <AnimatePresence>
        {phase >= 1 && phase < 2 && (
          <motion.div
            key="title-standalone"
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="relative z-10 flex items-center justify-center"
          >
            <span
              className={cn(
                "font-display font-bold tracking-tight text-center",
                isTie    && "text-6xl sm:text-8xl text-white/80",
                youWon   && "text-6xl sm:text-8xl bg-gradient-to-b from-yellow-200 to-indigo-400 bg-clip-text text-transparent",
                !isTie && !youWon && "text-5xl text-red-400"
              )}
            >
              {isTie ? "Draw!" : youWon ? "Victory!" : "Defeat"}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 2+: Full card */}
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div
            key="result-card"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative z-10 glass rounded-3xl p-10 w-full max-w-sm mx-4 text-center border border-white/10"
          >
            {/* Result icon */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0   }}
              transition={{ type: "spring", stiffness: 350, damping: 22, delay: 0.1 }}
              className="mb-4"
            >
              <span className="text-6xl leading-none block">
                {isTie ? "🌗" : youWon ? "✨" : "💫"}
              </span>
            </motion.div>

            {/* Title inside card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ delay: 0.2 }}
              className="mb-2"
            >
              <span
                className={cn(
                  "font-display font-bold tracking-tight",
                  isTie    && "text-4xl text-white/80",
                  youWon   && "text-4xl bg-gradient-to-b from-yellow-200 to-indigo-400 bg-clip-text text-transparent",
                  !isTie && !youWon && "text-4xl text-red-400"
                )}
              >
                {isTie ? "Draw!" : youWon ? "Victory!" : "Defeat"}
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-sm text-white/50 mb-8"
            >
              {result.reason === "both_out_of_cards"
                ? "Both players ran out of cards."
                : isTie
                ? "A perfectly balanced duel."
                : youWon
                ? `You reached ${POINTS_TO_WIN} points first!`
                : `Opponent reached ${POINTS_TO_WIN} points first.`}
            </motion.p>

            {/* Score summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ delay: 0.35 }}
              className="flex justify-center gap-8 mb-8"
            >
              <div className="flex flex-col items-center">
                <span className="font-display text-3xl font-bold text-white">{counted.my}</span>
                <span className="text-xs text-white/40 mt-1">You</span>
              </div>
              <div className="text-white/20 text-xl font-display self-center">–</div>
              <div className="flex flex-col items-center">
                <span className="font-display text-3xl font-bold text-white">{counted.opp}</span>
                <span className="text-xs text-white/40 mt-1">Opponent</span>
              </div>
            </motion.div>

            {/* Round history */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="flex justify-center gap-1 mb-8"
            >
              {result.rounds.map((r, i) => {
                const won = r.winnerId === selfId;
                const tie = r.winnerId === null;
                return (
                  <div
                    key={i}
                    title={`Round ${r.roundNumber}`}
                    className={cn(
                      "w-4 h-4 rounded-full border",
                      tie    && "border-white/20 bg-white/10",
                      won    && "border-indigo-400/60 bg-indigo-500/30",
                      !tie && !won && "border-red-400/40 bg-red-500/20"
                    )}
                  />
                );
              })}
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0  }}
              transition={{ delay: 0.5 }}
              className="flex flex-col gap-3"
            >
              <Button variant="primary" size="lg" onClick={onPlayAgain} className="w-full">
                Play Again
              </Button>
              <Button variant="ghost" size="md" onClick={onMainMenu} className="w-full">
                Main Menu
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  Particle burst
// ─────────────────────────────────────────────

function Particles({ won }: { won: boolean }) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id:    i,
    x:     Math.random() * 100,
    y:     Math.random() * 60 + 20,
    delay: Math.random() * 0.6,
    size:  Math.random() * 6 + 4,
    dur:   Math.random() * 1.5 + 1.5,
    color: won
      ? ["#818cf8", "#c084fc", "#fbbf24", "#34d399"][i % 4]
      : ["#9ca3af", "#6b7280"][i % 2],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: "100vh", opacity: 1 }}
          animate={{
            y:       `${p.y}vh`,
            opacity: [1, 1, 0],
            rotate:  [0, 180, 360],
          }}
          transition={{
            duration: p.dur,
            delay:    p.delay,
            ease:     "easeOut",
          }}
          style={{
            position: "absolute",
            width:    p.size,
            height:   p.size,
            borderRadius: "50%",
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}
