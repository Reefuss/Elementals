"use client";

import { useEffect, useRef, useCallback } from "react";
import { getSocket, AppSocket } from "@/lib/socket/client";
import { useGameStore } from "@/store/gameStore";
import { ClientGameState, GamePhase } from "@/lib/game/types";
import { setStoredPlayerId, setStoredUsername } from "@/lib/utils";

/**
 * Initialises the socket connection and wires up all server→client events.
 * Must be mounted once at the app root level.
 */
export function useSocketInit(): AppSocket | null {
  const socketRef = useRef<AppSocket | null>(null);

  const {
    playerId,
    username,
    setPlayerId,
    setGameState,
    setScreen,
    setQueuePosition,
    setMatchFound,
    setOpponentJustPlayed,
    setOpponentDisconnected,
    screen,
    matchRoomId,
  } = useGameStore();

  useEffect(() => {
    const storedId = typeof window !== "undefined"
      ? localStorage.getItem("elementals_player_id") ?? undefined
      : undefined;

    const socket = getSocket(storedId);
    socketRef.current = socket;

    if (!storedId && socket.id) {
      // First connection — use socket.id as stable playerId until server assigns one
    }

    // ── queue:status ──────────────────────────────────────────
    socket.on("queue:status", ({ position }) => {
      useGameStore.getState().setQueuePosition(position);
    });

    // ── match:found ───────────────────────────────────────────
    socket.on("match:found", ({ roomId, opponent }) => {
      setMatchFound(roomId, opponent);
      setScreen("match_found");
      // After a short cinematic delay, navigate to game
      setTimeout(() => setScreen("game"), 3000);
    });

    // ── game:state ────────────────────────────────────────────
    socket.on("game:state", (state: ClientGameState) => {
      setGameState(state);
      if (state.phase === GamePhase.GAME_OVER) {
        setScreen("result");
      }
    });

    // ── game:opponent_played ──────────────────────────────────
    socket.on("game:opponent_played", () => {
      setOpponentJustPlayed(true);
      setTimeout(() => useGameStore.getState().setOpponentJustPlayed(false), 2000);
    });

    // ── game:opponent_disconnected ────────────────────────────
    socket.on("game:opponent_disconnected", (payload) => {
      setOpponentDisconnected(payload);
    });

    // ── game:opponent_reconnected ─────────────────────────────
    socket.on("game:opponent_reconnected", () => {
      setOpponentDisconnected(null);
    });

    return () => {
      socket.off("queue:status");
      socket.off("match:found");
      socket.off("game:state");
      socket.off("game:opponent_played");
      socket.off("game:opponent_disconnected");
      socket.off("game:opponent_reconnected");
    };
  }, []);

  return socketRef.current;
}

/** Returns a stable socket reference for use in game components. */
export function useSocket(): AppSocket {
  const storedId = typeof window !== "undefined"
    ? localStorage.getItem("elementals_player_id") ?? undefined
    : undefined;
  return getSocket(storedId);
}
