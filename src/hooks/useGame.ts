"use client";

import { useCallback, useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { useSocket } from "./useSocket";
import { Element, GamePhase } from "@/lib/game/types";
import { TURN_DURATION_MS } from "@/lib/game/constants";

/** Encapsulates all game actions and derived state. */
export function useGame() {
  const socket = useSocket();
  const {
    gameState,
    selectedCardId,
    setSelectedCardId,
    opponentJustPlayed,
    opponentDisconnected,
  } = useGameStore();

  // ── Derived ──────────────────────────────────────────────
  const isMyTurn =
    gameState?.phase === GamePhase.PLAYING && !gameState.self.hasPlayed;

  const isWaiting =
    gameState?.phase === GamePhase.PLAYING && gameState.self.hasPlayed;

  const isRevealing = gameState?.phase === GamePhase.REVEALING;

  const isRainbowTiebreak = gameState?.phase === GamePhase.RAINBOW_TIEBREAK;

  const isRevivePick = gameState?.phase === GamePhase.REVIVE_PICK;

  const isGameOver = gameState?.phase === GamePhase.GAME_OVER;

  // ── Timer ─────────────────────────────────────────────────
  const [msLeft, setMsLeft] = useState<number>(TURN_DURATION_MS);

  useEffect(() => {
    if (!gameState?.turnStartedAt || gameState.phase !== GamePhase.PLAYING) {
      setMsLeft(TURN_DURATION_MS);
      return;
    }

    const update = () => {
      const elapsed = Date.now() - gameState.turnStartedAt!;
      setMsLeft(Math.max(0, TURN_DURATION_MS - elapsed));
    };

    update();
    const id = setInterval(update, 200);
    return () => clearInterval(id);
  }, [gameState?.turnStartedAt, gameState?.phase]);

  // ── Actions ───────────────────────────────────────────────

  const selectCard = useCallback(
    (cardId: string) => {
      if (!isMyTurn) return;
      setSelectedCardId(cardId === selectedCardId ? null : cardId);
    },
    [isMyTurn, selectedCardId, setSelectedCardId]
  );

  const playCard = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!selectedCardId) { reject("No card selected."); return; }
      socket.emit("game:play", { cardId: selectedCardId }, (err) => {
        if (err) { reject(err); return; }
        setSelectedCardId(null);
        resolve();
      });
    });
  }, [socket, selectedCardId, setSelectedCardId]);

  const submitRainbowChoice = useCallback(
    (element: Element): Promise<void> => {
      return new Promise((resolve, reject) => {
        socket.emit("game:rainbow_choice", { element }, (err) => {
          if (err) { reject(err); return; }
          resolve();
        });
      });
    },
    [socket]
  );

  const submitRevivePick = useCallback(
    (cardId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        socket.emit("game:revive_pick", { cardId }, (err) => {
          if (err) { reject(err); return; }
          resolve();
        });
      });
    },
    [socket]
  );

  return {
    gameState,
    selectedCardId,
    selectCard,
    playCard,
    submitRainbowChoice,
    submitRevivePick,
    isMyTurn,
    isWaiting,
    isRevealing,
    isRainbowTiebreak,
    isRevivePick,
    isGameOver,
    msLeft,
    opponentJustPlayed,
    opponentDisconnected,
  };
}
