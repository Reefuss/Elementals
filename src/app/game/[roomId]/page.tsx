"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/store/gameStore";
import { useGame } from "@/hooks/useGame";
import { useSocket } from "@/hooks/useSocket";
import { useGameSounds } from "@/hooks/useGameSounds";
import { Card, GamePhase } from "@/lib/game/types";
import { SoundEngine } from "@/lib/sound/engine";
import { GameCard } from "@/components/game/GameCard";

import { Hand }               from "@/components/game/Hand";
import { BattleArena }        from "@/components/game/BattleArena";
import { OpponentArea }       from "@/components/game/OpponentArea";
import { Scoreboard }         from "@/components/game/Scoreboard";
import { MatchResultScreen }  from "@/components/game/MatchResult";
import { RainbowTiebreak }    from "@/components/game/RainbowTiebreak";
import { RevivePick }         from "@/components/game/RevivePick";
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
      animate={{ y: 0, opacity: 1 }}
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
//  Phase chip
// ─────────────────────────────────────────────

function PhaseChip({ phase }: { phase: GamePhase }) {
  const labels: Partial<Record<GamePhase, string>> = {
    [GamePhase.PLAYING]:           "Your Turn",
    [GamePhase.REVEALING]:         "Reveal",
    [GamePhase.RAINBOW_TIEBREAK]:  "Rainbow Duel",
    [GamePhase.WAITING]:           "Starting…",
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
        phase === GamePhase.PLAYING          && "bg-indigo-500/20 text-indigo-300 border border-indigo-400/30",
        phase === GamePhase.REVEALING        && "bg-amber-500/20  text-amber-300  border border-amber-400/30",
        phase === GamePhase.RAINBOW_TIEBREAK && "bg-pink-500/20   text-pink-300   border border-pink-400/30",
        phase === GamePhase.WAITING          && "bg-white/5       text-white/40   border border-white/10",
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
  const socket = useSocket();

  const {
    gameState,
    selectedCardId,
    selectCard,
    playCard,
    submitRainbowChoice,
    submitRevivePick,
    isMyTurn,
    isRevealing,
    isRainbowTiebreak,
    isRevivePick,
    isGameOver,
    msLeft,
    opponentDisconnected,
  } = useGame();

  const { resetGame } = useGameStore();
  const [playError,          setPlayError]          = useState<string | null>(null);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);

  // ── Drag-to-play state ──────────────────────────────
  const dropZoneRef    = useRef<HTMLDivElement>(null);
  const dropZoneRect   = useRef<DOMRect | null>(null);
  const playCardRef    = useRef(playCard);
  const selectCardRef  = useRef(selectCard);
  useEffect(() => { playCardRef.current = playCard; }, [playCard]);
  useEffect(() => { selectCardRef.current = selectCard; }, [selectCard]);

  const [dragState, setDragState] = useState<{
    cardId: string; card: Card; x: number; y: number; active: boolean;
  } | null>(null);

  // Wire game sounds — fires at phase transitions, flips, timer beats
  useGameSounds(gameState, msLeft, gameState?.self.id ?? "");

  // On mount, ask the server to re-push current state.
  // This handles the case where game:state was emitted before this page loaded.
  useEffect(() => {
    // Unlock AudioContext on first interaction (browser policy)
    SoundEngine.unlock();
    socket.emit("game:request_state");
  }, [socket]);

  const handlePlayCard = useCallback(async () => {
    try {
      setPlayError(null);
      SoundEngine.play("card_play");
      await playCardRef.current();
    } catch (e) {
      setPlayError(typeof e === "string" ? e : "Failed to play card.");
      setTimeout(() => setPlayError(null), 3000);
    }
  }, []);

  // ── Drag handlers ────────────────────────────────────
  const handleCardDragStart = useCallback((cardId: string, e: React.PointerEvent) => {
    if (!isMyTurn || gameState?.phase === GamePhase.REVEALING) return;
    e.preventDefault();
    const card = gameState?.self.hand.find((c) => c.id === cardId);
    if (!card) return;
    // Measure drop zone position now while layout is stable
    dropZoneRect.current = dropZoneRef.current?.getBoundingClientRect() ?? null;
    setDragState({ cardId, card, x: e.clientX, y: e.clientY, active: false });
  }, [isMyTurn, gameState]);

  useEffect(() => {
    if (!dragState) return;
    const startX = dragState.x;
    const startY = dragState.y;

    const onMove = (e: PointerEvent) => {
      e.preventDefault();
      const moved = Math.abs(e.clientX - startX) > 8 || Math.abs(e.clientY - startY) > 8;
      setDragState((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY, active: prev.active || moved } : null);
    };

    const onUp = async (e: PointerEvent) => {
      // Accept any drop in the middle third of the screen (vertically)
      const midTop    = window.innerHeight * 0.25;
      const midBottom = window.innerHeight * 0.75;
      const over = e.clientY >= midTop && e.clientY <= midBottom;

      setDragState(null);
      if (over) {
        await handlePlayCard();
      } else {
        selectCardRef.current(dragState.cardId);
      }
    };

    const onCancel = () => setDragState(null);

    window.addEventListener("pointermove",  onMove,    { passive: false });
    window.addEventListener("pointerup",    onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove",  onMove);
      window.removeEventListener("pointerup",    onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!dragState]);

  const handlePlayAgain = () => {
    resetGame();
    router.push("/battle");
  };

  const handleMainMenu = () => {
    resetGame();
    router.push("/");
  };

  const handleForfeit = () => {
    socket.emit("game:forfeit", (err) => {
      if (!err) { resetGame(); router.push("/"); }
    });
  };

  if (!gameState) return <LoadingState />;

  const { self, opponent, phase, round, lastResult, rainbowTiebreak, selfIsPlayerOne } = gameState;

  return (
    <div className="h-full flex flex-col relative overflow-hidden select-none">
      <AnimatePresence>
        {opponentDisconnected && (
          <DisconnectBanner username={opponentDisconnected.username} />
        )}
      </AnimatePresence>

      {/* ── Opponent area ─── */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="border-b border-white/05 flex-shrink-0"
      >
        <OpponentArea opponent={opponent} />
      </motion.div>

      {/* ── Center ─── */}
      <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 py-2 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-4"
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
            lastResult={lastResult}
            selfId={self.id}
            selfIsPlayerOne={selfIsPlayerOne}
            isDragging={!!dragState?.active}
            dropZoneRef={dropZoneRef}
          />
        </motion.div>

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

      {/* ── Player area ─── */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="border-t border-white/05 flex-shrink-0 pb-4"
      >
        <div className="flex items-center justify-between px-6 pt-3 pb-2">
          <div>
            <p className="font-display text-sm font-semibold text-white">{self.username}</p>
            <p className="text-[11px] text-white/40">{self.deckCount} in deck</p>
            {!isGameOver && (
              <button
                onClick={() => setShowForfeitConfirm(true)}
                className="text-[10px] text-white/20 hover:text-red-400/60 transition-colors mt-0.5"
              >
                Forfeit
              </button>
            )}
          </div>
          <div className="flex flex-col items-end">
            <motion.span
              key={self.score}
              initial={{ scale: 1.4, color: "#818cf8" }}
              animate={{ scale: 1, color: "#ffffff" }}
              className="font-display text-2xl font-bold"
            >
              {self.score}
            </motion.span>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">pts</span>
          </div>
        </div>

        <div className="px-4">
          <Hand
            cards={self.hand}
            selectedCardId={selectedCardId}
            disabled={!isMyTurn || phase === GamePhase.REVEALING}
            onSelectCard={selectCard}
            draggingCardId={dragState?.cardId ?? null}
            onDragStart={handleCardDragStart}
          />
        </div>

        {/* Drag hint */}
        {isMyTurn && phase !== GamePhase.REVEALING && !dragState && (
          <p className="text-[10px] text-white/20 text-center pt-1 pb-1">
            Drag a card to the centre to play
          </p>
        )}
      </motion.div>


      {/* ── Forfeit confirm modal ─── */}
      <AnimatePresence>
        {showForfeitConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6"
            onClick={() => setShowForfeitConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-2xl p-6 w-full max-w-xs border border-white/10 text-center flex flex-col gap-4"
            >
              <p className="font-display text-lg font-bold text-white">Forfeit match?</p>
              <p className="text-sm text-white/40">Your opponent wins. You still earn 30 coins.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForfeitConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-sm text-white/60 hover:text-white/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleForfeit}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-sm text-red-300 font-semibold hover:bg-red-500/30 transition-colors"
                >
                  Forfeit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Rainbow Tiebreak modal ─── */}
      <RainbowTiebreak
        open={isRainbowTiebreak}
        attempt={rainbowTiebreak?.attempt ?? 1}
        myChoice={rainbowTiebreak?.myChoice ?? null}
        waitingForOp={rainbowTiebreak?.waitingForOp ?? false}
        onChoose={submitRainbowChoice}
      />

      {/* ── Revive Pick modal ─── */}
      <RevivePick
        open={isRevivePick}
        discardPile={self.discardPile ?? []}
        needsPick={gameState.revivePick?.needsPick ?? false}
        waitingForOp={gameState.revivePick?.waitingForOp ?? false}
        onPick={submitRevivePick}
      />

      {/* ── Match result ─── */}
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

      {/* ── Drag overlay ─── */}
      <AnimatePresence>
        {dragState?.active && (
          <>
            {/* Dim overlay */}
            <motion.div
              key="drag-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[100] pointer-events-none bg-black/65"
            />

            {/* Drop zone — middle third of screen */}
            <motion.div
              key="drop-zone-ring"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed",
                left: "5%",
                top: "25%",
                width: "90%",
                height: "50%",
                zIndex: 101,
                borderRadius: 28,
                pointerEvents: "none",
              }}
            >
              <motion.div
                animate={{ boxShadow: [
                  "0 0 0 2px rgba(129,140,248,0.5), 0 0 30px 6px rgba(129,140,248,0.2)",
                  "0 0 0 2px rgba(129,140,248,1),   0 0 60px 12px rgba(129,140,248,0.5)",
                  "0 0 0 2px rgba(129,140,248,0.5), 0 0 30px 6px rgba(129,140,248,0.2)",
                ]}}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-[28px]"
              />
              <div className="absolute inset-0 rounded-[28px] bg-indigo-500/[0.06]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-sm text-indigo-300 font-semibold tracking-widest uppercase"
                >
                  Drop here
                </motion.span>
              </div>
            </motion.div>

            {/* Ghost card following pointer */}
            <motion.div
              key="ghost-card"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.08, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                position: "fixed",
                left: dragState.x,
                top:  dragState.y,
                transform: "translate(-50%, -50%)",
                zIndex: 102,
                pointerEvents: "none",
                filter: "drop-shadow(0 0 20px rgba(129,140,248,0.8))",
              }}
            >
              <GameCard card={dragState.card} size="md" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
