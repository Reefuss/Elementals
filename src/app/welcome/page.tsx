"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { setStoredUsername } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import { useCollectionStore } from "@/store/collectionStore";
import { useMissionStore } from "@/store/missionStore";
import { usePlayerStore } from "@/store/playerStore";
import { cn } from "@/lib/utils";

type Stage = "title" | "name";

export default function WelcomePage() {
  const router          = useRouter();
  const setUsername     = useGameStore((s) => s.setUsername);
  const initCollection    = useCollectionStore((s) => s.initialize);
  const resetMissions     = useMissionStore((s) => s.resetIfNewDay);
  const grantStarterCoins = usePlayerStore((s) => s.grantStarterCoins);

  const [stage,       setStage]       = useState<Stage>("title");
  const [name,        setName]        = useState("");
  const [nameError,   setNameError]   = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [titleReady,  setTitleReady]  = useState(false);

  // Stagger in the title elements
  useEffect(() => {
    const t = setTimeout(() => setTitleReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  const handleTitleClick = () => {
    if (!titleReady) return;
    setStage("name");
  };

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed)           { setNameError("Enter a name to continue."); return; }
    if (trimmed.length > 20){ setNameError("Max 20 characters."); return; }

    setSubmitting(true);
    setStoredUsername(trimmed);
    setUsername(trimmed);
    initCollection();
    resetMissions();
    grantStarterCoins();

    // Small delay for the transition to feel intentional
    setTimeout(() => router.replace("/"), 400);
  };

  return (
    <div className="fixed inset-0 bg-cosmic-950 flex flex-col items-center justify-center overflow-hidden">

      {/* Background particle field */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left:   `${(i * 17 + 5) % 100}%`,
            top:    `${(i * 23 + 8) % 100}%`,
            width:  i % 3 === 0 ? 2 : i % 3 === 1 ? 1.5 : 1,
            height: i % 3 === 0 ? 2 : i % 3 === 1 ? 1.5 : 1,
            backgroundColor:
              i % 3 === 0 ? "rgba(251,191,36,0.5)"
              : i % 3 === 1 ? "rgba(147,197,253,0.5)"
              : "rgba(192,132,252,0.5)",
          }}
          animate={{ opacity: [0.2, 0.8, 0.2], y: [0, -12, 0] }}
          transition={{
            duration: 3 + (i % 4),
            repeat: Infinity,
            delay: (i * 0.3) % 3,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* ── Title stage ── */}
      <AnimatePresence mode="wait">
        {stage === "title" && (
          <motion.div
            key="title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-5 cursor-pointer select-none"
            onClick={handleTitleClick}
          >
            {/* Element trinity */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="flex gap-6 text-3xl"
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0], y: [0, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 0 }}
                className="text-amber-400 drop-shadow-[0_0_14px_rgba(251,191,36,0.9)]"
              >✊</motion.span>
              <motion.span
                animate={{ rotate: [0, -15, 15, 0], y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.6 }}
                className="text-blue-300 drop-shadow-[0_0_14px_rgba(147,197,253,0.9)]"
              >✌</motion.span>
              <motion.span
                animate={{ rotate: [0, 20, -20, 0], y: [0, -4, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1.2 }}
                className="text-purple-400 drop-shadow-[0_0_14px_rgba(192,132,252,0.9)]"
              >✋</motion.span>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <h1 className="font-display text-[2.1rem] font-bold text-white tracking-[0.15em] uppercase">
                Elementals
              </h1>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1.4, duration: 0.6, ease: "easeOut" }}
                className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mt-2"
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.6 }}
                className="text-[10px] text-white/30 tracking-[0.25em] uppercase mt-1.5"
              >
                Card Battle
              </motion.p>
            </motion.div>

            {/* Tap to continue */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: titleReady ? 1 : 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-xs text-white/40 tracking-widest uppercase"
            >
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                Tap to continue
              </motion.span>
            </motion.p>
          </motion.div>
        )}

        {/* ── Name entry stage ── */}
        {stage === "name" && (
          <motion.div
            key="name"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-5 w-full max-w-sm px-6"
          >
            {/* Small logo */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex gap-3 text-xl">
                <span className="text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]">✊</span>
                <span className="text-blue-300 drop-shadow-[0_0_10px_rgba(147,197,253,0.8)]">✌</span>
                <span className="text-purple-400 drop-shadow-[0_0_10px_rgba(192,132,252,0.8)]">✋</span>
              </div>
              <p className="font-display text-base font-bold text-white tracking-widest uppercase">Elementals</p>
            </div>

            {/* Name form */}
            <div className="w-full flex flex-col gap-2.5">
              <div className="text-center">
                <p className="font-display text-base font-bold text-white">Choose your name</p>
                <p className="text-[11px] text-white/35 mt-0.5">This is how other players will see you.</p>
              </div>

              <input
                type="text"
                placeholder="Enter your name…"
                value={name}
                maxLength={20}
                autoFocus
                onChange={(e) => { setName(e.target.value); setNameError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className={cn(
                  "w-full px-4 py-2.5 rounded-xl border text-white placeholder-white/20 text-sm text-center",
                  "bg-white/5 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/60",
                  "transition-all duration-200",
                  nameError
                    ? "border-red-500/50"
                    : "border-white/10 hover:border-white/20 focus:border-indigo-400/50"
                )}
              />

              <AnimatePresence>
                {nameError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-red-400 text-center"
                  >
                    {nameError}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={submitting}
                className={cn(
                  "w-full py-2.5 rounded-xl font-display font-bold text-sm tracking-wider transition-all duration-200",
                  submitting
                    ? "bg-indigo-600/30 text-indigo-300/50 border border-indigo-500/20 cursor-not-allowed"
                    : "bg-indigo-600/40 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-600/60 hover:border-indigo-400/60"
                )}
              >
                {submitting ? "Entering…" : "✦ Start Playing"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
