"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { useGame } from "@/hooks/useGame";
import { useSocket, useSocketInit } from "@/hooks/useSocket";
import { GamePhase } from "@/lib/game/types";

import { Hand }               from "@/components/game/Hand";
import { BattleArena }        from "@/components/game/BattleArena";
import { OpponentArea }       from "@/components/game/OpponentArea";
import { Scoreboard }         from "@/components/game/Scoreboard";
import { MatchResultScreen }  from "@/components/game/MatchResult";
import { RainbowTiebreak }    from "@/components/game/RainbowTiebreak";
import { Button }             from "@/components/ui/button";
import { cn }                 from "@/lib/utils";

// ─────────────────────────────────────────────
//  Loading screen
// ─────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <p className="font-display text-sm text-white/40 tracking-wider">Loading arena…</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Disconnect banner
// ─────────────────────────────────────────────

function DisconnectBanner({ username }: { username: string }) {
  return (
    <motion.div
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0,   opacity: 1 }}
      exit={{ y: -48, opacity: 0 }}
      className="absolute top-0 inset-x-0 z-30 flex justify-center pt-3 pointer-events-none"
    >
      <div className="glass rounded-xl px-5 py-2.5 border border-orange-400/20 pointer-events-auto">
        <p className="text-sm text-orange-300">
          <span className="font-semibold">{username}</span> disconnected — waiting for reconnect…
        </p>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  Play button
// ─────────────────────────────────────────────

function PlayButton({
  disabled,
  onClick,
}: {
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: disabled ? 0 : 1, y: 0 }}
      className="flex justify-center pt-2"
    >
      <Button
        variant="primary"
        size="lg"
        disabled={disabled}
        onClick={onClick}
        className="font-display tracking-widest text-sm"
      >
        Play Card ✦
      </Button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  Phase status chip
// ─────────────────────────────────────────────

function PhaseChip({ phase }: { phase: GamePhase }) {
  const labels: Partial<Record<GamePhase, string>> = {
    [GamePhase.PLAYING]:          "Your Turn",
    [GamePhase.REVEALING]:        "Reveal",
    [GamePhase.RAINBOW_TIEBREAK]: "Rainbow Duel",
    [GamePhase.WAITING]:          "Starting…",
  };
  const label = labels[phase];
  if (!label) return null;

  return (
    <motion.span
      key={phase}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider",
        phase === GamePhase.PLAYING         && "bg-indigo-500/20 text-indigo-300 border border-indigo-400/30",
        phase === GamePhase.REVEALING       && "bg-amber-500/20  text-amber-300  border border-amber-400/30",
        phase === GamePhase.RAINBOW_TIEBREAK && "bg-pink-500/20   text-pink-300   border border-pink-400/30",
        phase === GamePhase.WAITING         && "bg-white/5       text-white/40   border border-white/10",
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {label}
    </motion.span>
  );
}

// ─────────────────────────────────────────────
//  Game Page
// ─────────────────────────────────────────────

export default function GamePage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();

  useSocketInit(); // ensure events are wired

  const {
    gameState,
    selectedCardId,
    selectCard,
    playCard,
    submitRainbowChoice,
    isMyTurn,
    isWaiting,
    isRevealing,
    isRainbowTiebreak,
    isGameOver,
    msLeft,
    opponentDisconnected,
  } = useGame();

  const {
    resetGame,
    setScreen,
    matchRoomId,
  } = useGameStore();

  const [playError, setPlayError] = useState<string | null>(null);

  // Verify we're in the right room
  useEffect(() => {
    // If we have gameState and the roomId doesn't match, redirect home
    if (gameState && gameState.roomId !== params.roomId) {
      router.replace("/");
    }
  }, [gameState, params.roomId, router]);

  const handlePlayCard = async () => {
    try {
      setPlayError(null);
      await playCard();
    } catch (e) {
      setPlayError(typeof e === "string" ? e : "Failed to play card.");
      setTimeout(() => setPlayError(null), 3000);
    }
  };

  const handlePlayAgain = () => {
    resetGame();
    router.push("/");
  };

  const handleMainMenu = () => {
    resetGame();
    router.push("/");
  };

  // ── No state yet — loading ──
  if (!gameState) return <LoadingState />;

  const { self, opponent, phase, round, lastResult, rainbowTiebreak } = gameState;

  // Find the card self played (still in cache via lastResult or from hand before it was removed)
  // Since card is removed from hand on play, we reconstruct from lastResult during REVEALING
  // During PLAYING/after play, we show the played indicator without the card face
  const selfPlayedCard =
    phase === GamePhase.REVEALING && lastResult
      ? undefined // BattleArena handles reveal from lastResult
      : undefined;

  return (
    <div className="h-full flex flex-col relative overflow-hidden select-none">
      {/* Disconnect banner */}
      <AnimatePresence>
        {opponentDisconnected && (
          <DisconnectBanner username={opponentDisconnected.username} />
        )}
      </AnimatePresence>

      {/* ── Opponent area ─────────────────────── */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="glass border-b border-white/05 flex-shrink-0"
      >
        <OpponentArea opponent={opponent} />
      </motion.div>

      {/* ── Center: scoreboard + arena ────────── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 overflow-hidden">
        {/* Scoreboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl px-6 py-3 flex items-center gap-4"
        >
          <Scoreboard
            myScore={self.score}
            opponentScore={opponent.score}
            myUsername={self.username}
            opponentName={opponent.username}
          />
          <div className="w-px h-8 bg-white/10" />
          <PhaseChip phase={phase} />
        </motion.div>

        {/* Battle arena */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="w-full max-w-xl"
        >
          <BattleArena
            phase={phase}
            round={round}
            msLeft={msLeft}
            selfHasPlayed={self.hasPlayed}
            opponentHasPlayed={opponent.hasPlayed}
            selfPlayedCard={selfPlayedCard}
            lastResult={lastResult}
            selfId={self.id}
          />
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {playError && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-red-400"
            >
              {playError}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── Player area ───────────────────────── */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0,  opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
        className="glass border-t border-white/05 flex-shrink-0 pb-4"
      >
        {/* Player info bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2">
          <div>
            <p className="font-display text-sm font-semibold text-white">{self.username}</p>
            <p className="text-[11px] text-white/40">{self.deckCount} in deck</p>
          </div>
          <div className="flex flex-col items-end">
            <motion.span
              key={self.score}
              initial={{ scale: 1.4, color: "#818cf8" }}
              animate={{ scale: 1,   color: "#ffffff" }}
              className="font-display text-2xl font-bold"
            >
              {self.score}
            </motion.span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">pts</span>
          </div>
        </div>

        {/* Hand */}
        <div className="px-4">
          <Hand
            cards={self.hand}
            selectedCardId={selectedCardId}
            disabled={!isMyTurn || phase === GamePhase.REVEALING}
            onSelectCard={selectCard}
          />
        </div>

        {/* Play button — only shown when card is selected and it's my turn */}
        <div className="px-4">
          <PlayButton
            disabled={!selectedCardId || !isMyTurn}
            onClick={handlePlayCard}
          />
        </div>
      </motion.div>

      {/* ── Rainbow Tiebreak modal ─────────────── */}
      <RainbowTiebreak
        open={isRainbowTiebreak}
        attempt={rainbowTiebreak?.attempt ?? 1}
        myChoice={rainbowTiebreak?.myChoice ?? null}
        waitingForOp={rainbowTiebreak?.waitingForOp ?? false}
        onChoose={submitRainbowChoice}
      />

      {/* ── Match result overlay ──────────────── */}
      <AnimatePresence>
        {isGameOver && gameState.matchResult && (
          <MatchResultScreen
            result={gameState.matchResult}
            selfId={self.id}
            onPlayAgain={handlePlayAgain}
            onMainMenu={handleMainMenu}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
