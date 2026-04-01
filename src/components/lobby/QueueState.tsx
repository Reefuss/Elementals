"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QueueStateProps {
  position:  number;
  username:  string;
  onCancel:  () => void;
}

export function QueueState({ position, username, onCancel }: QueueStateProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(elapsed / 60000)).padStart(2, "0");
  const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, "0");

  return (
    <div className="flex flex-col items-center justify-center h-full gap-12 px-6">
      {/* Cosmic orb */}
      <div className="relative flex items-center justify-center w-48 h-48">
        {/* Pulse rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-indigo-400/30"
            initial={{ width: 64, height: 64, opacity: 0.7 }}
            animate={{ width: 192, height: 192, opacity: 0 }}
            transition={{
              duration: 2.5,
              delay:    i * 0.8,
              repeat:   Infinity,
              ease:     "easeOut",
            }}
          />
        ))}

        {/* Core orb */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={cn(
            "w-24 h-24 rounded-full",
            "bg-gradient-to-br from-indigo-500/80 via-purple-600/60 to-blue-700/60",
            "shadow-[0_0_40px_rgba(99,102,241,0.6),0_0_80px_rgba(99,102,241,0.25)]",
            "flex items-center justify-center"
          )}
        >
          {/* Orbiting star */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute w-full h-full"
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2
                         w-3 h-3 rounded-full bg-sun-400
                         shadow-[0_0_8px_rgba(251,191,36,0.8)]"
            />
          </motion.div>

          {/* Inner glyph */}
          <span className="text-2xl select-none">✦</span>
        </motion.div>
      </div>

      {/* Text */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="font-display text-2xl font-bold text-white">
          Searching for opponent…
        </h2>
        <p className="text-sm text-white/50">
          You are <span className="text-white font-semibold">{username}</span>
          {position > 0 && ` · Position ${position} in queue`}
        </p>
        <p className="text-xs text-white/30 font-mono tracking-wider mt-1">
          {mm}:{ss}
        </p>
      </div>

      {/* Tips carousel */}
      <TipCarousel />

      <Button variant="ghost" size="md" onClick={onCancel} className="text-white/40 hover:text-white">
        Cancel
      </Button>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Rotating tips
// ─────────────────────────────────────────────

const TIPS = [
  "Sun beats Star, Star beats Moon, Moon beats Sun.",
  "Block cancels any card — even Rainbow.",
  "Rainbow beats every element… until it meets another Rainbow.",
  "Higher values win when two of the same element clash.",
  "You have 30 seconds to play each round.",
];

function TipCarousel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % TIPS.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      key={idx}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="glass-light rounded-2xl px-6 py-4 max-w-xs text-center"
    >
      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Tip</p>
      <p className="text-sm text-white/70 leading-relaxed">{TIPS[idx]}</p>
    </motion.div>
  );
}
