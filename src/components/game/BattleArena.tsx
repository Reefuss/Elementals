"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, GamePhase, RoundResult } from "@/lib/game/types";
import { GameCard, CardBack, CardSlot } from "./GameCard";
import { TurnTimer } from "./TurnTimer";
import { cardDisplayName } from "@/lib/game/rules";

interface BattleArenaProps {
  phase:           GamePhase;
  round:           number;
  msLeft:          number;
  selfHasPlayed:   boolean;
  opponentHasPlayed: boolean;
  selfPlayedCard?: Card;       // card self played this round (if any, hidden to opp)
  lastResult?:     RoundResult | null;
  selfId:          string;
}

export function BattleArena({
  phase,
  round,
  msLeft,
  selfHasPlayed,
  opponentHasPlayed,
  selfPlayedCard,
  lastResult,
  selfId,
}: BattleArenaProps) {
  const isRevealing = phase === GamePhase.REVEALING;
  const isPlaying   = phase === GamePhase.PLAYING;

  // During REVEALING, show both real cards from lastResult
  const revealedSelfCard =
    isRevealing && lastResult
      ? (lastResult.winnerId === selfId || lastResult.winnerId === null)
        ? undefined  // use lastResult cards directly
        : undefined
      : undefined;

  // Identify which card in lastResult belongs to self
  // We assume players[0] = p1, but client only knows their own id.
  // The result embeds scoreAfter keyed by playerId, so we check winnerId.
  const p1Card = lastResult?.playerOneCard;
  const p2Card = lastResult?.playerTwoCard;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-4">
      {/* Round indicator */}
      <div className="flex items-center gap-4">
        <div className="h-px w-16 bg-white/10" />
        <span className="font-display text-xs tracking-[0.3em] text-white/40 uppercase">
          Round {round}
        </span>
        <div className="h-px w-16 bg-white/10" />
      </div>

      {/* Battle field */}
      <div className="flex items-center gap-8">
        {/* Opponent's slot */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-white/30">Opponent</span>
          <AnimatePresence mode="wait">
            {isRevealing && p2Card ? (
              <motion.div
                key="opp-reveal"
                initial={{ rotateY: 90, scale: 0.9 }}
                animate={{ rotateY: 0,  scale: 1   }}
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
              >
                <GameCard card={p2Card} size="lg" />
              </motion.div>
            ) : opponentHasPlayed ? (
              <motion.div
                key="opp-back"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <CardBack size="lg" pulse />
              </motion.div>
            ) : (
              <CardSlot size="lg" label="Waiting…" />
            )}
          </AnimatePresence>
        </div>

        {/* Center: timer + VS */}
        <div className="flex flex-col items-center gap-3">
          <TurnTimer
            msLeft={msLeft}
            visible={isPlaying && !selfHasPlayed}
          />
          {!isPlaying && (
            <div className="font-display text-white/20 text-xs tracking-[0.4em]">VS</div>
          )}
        </div>

        {/* Self's slot */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-white/30">You</span>
          <AnimatePresence mode="wait">
            {isRevealing && p1Card ? (
              <motion.div
                key="self-reveal"
                initial={{ rotateY: 90, scale: 0.9 }}
                animate={{ rotateY: 0,  scale: 1   }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <GameCard card={p1Card} size="lg" />
              </motion.div>
            ) : selfHasPlayed && selfPlayedCard ? (
              <motion.div
                key="self-played"
                initial={{ y: -20, scale: 0.9, opacity: 0 }}
                animate={{ y: 0,   scale: 1,   opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <GameCard card={selfPlayedCard} size="lg" played />
              </motion.div>
            ) : (
              <CardSlot size="lg" label={selfHasPlayed ? "Played" : "Play a card"} />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Status message */}
      <AnimatePresence mode="wait">
        {isPlaying && (
          <motion.div
            key="playing-msg"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-white/40 text-center"
          >
            {selfHasPlayed
              ? "Waiting for opponent…"
              : opponentHasPlayed
              ? "Opponent is ready — make your move!"
              : "Choose a card from your hand"}
          </motion.div>
        )}
        {isRevealing && lastResult && (
          <RoundResultBanner result={lastResult} selfId={selfId} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Inline round result banner (lives in arena)
// ─────────────────────────────────────────────

function RoundResultBanner({
  result,
  selfId,
}: {
  result: RoundResult;
  selfId: string;
}) {
  const youWon = result.winnerId === selfId;
  const tie    = result.winnerId === null;

  return (
    <motion.div
      key="result-banner"
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0,  scale: 1   }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={cn(
        "px-6 py-3 rounded-2xl text-center",
        "border font-display",
        tie    && "border-white/10 bg-white/5 text-white/60",
        youWon && "border-indigo-400/40 bg-indigo-500/10 text-indigo-300",
        !tie && !youWon && "border-red-400/30 bg-red-500/10 text-red-300"
      )}
    >
      <div className="text-lg font-bold">
        {tie ? "Tie Round" : youWon ? "Point Won!" : "Point Lost"}
      </div>
    </motion.div>
  );
}
