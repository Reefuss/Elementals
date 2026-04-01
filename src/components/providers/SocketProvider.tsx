"use client";

/**
 * Mounted once in the root layout — never unmounts during client-side navigation.
 * Owns the single socket connection and all server→client event wiring.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket/client";
import { useGameStore } from "@/store/gameStore";
import { ClientGameState, GamePhase } from "@/lib/game/types";
import { getStoredPlayerId, setStoredPlayerId } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const {
    setGameState,
    setScreen,
    setQueuePosition,
    setMatchFound,
    setOpponentJustPlayed,
    setOpponentDisconnected,
  } = useGameStore();

  useEffect(() => {
    // Stable player identity — created once, persisted in localStorage
    let playerId = getStoredPlayerId();
    if (!playerId) {
      playerId = uuidv4();
      setStoredPlayerId(playerId);
    }
    useGameStore.getState().setPlayerId(playerId);

    const socket = getSocket(playerId);

    // ── queue:status ──────────────────────────────────────────────
    socket.on("queue:status", ({ position }) => {
      setQueuePosition(position);
    });

    // ── match:found ───────────────────────────────────────────────
    socket.on("match:found", ({ roomId, opponent }) => {
      setMatchFound(roomId, opponent);
      setScreen("match_found");
      // After the match-found cinematic, navigate to game room
      setTimeout(() => {
        setScreen("game");
        router.push(`/game/${roomId}`);
      }, 4500);
    });

    // ── game:state ────────────────────────────────────────────────
    socket.on("game:state", (state: ClientGameState) => {
      setGameState(state);
      if (state.phase === GamePhase.GAME_OVER) {
        setScreen("result");
      }
    });

    // ── game:opponent_played ──────────────────────────────────────
    socket.on("game:opponent_played", () => {
      setOpponentJustPlayed(true);
      setTimeout(() => useGameStore.getState().setOpponentJustPlayed(false), 2000);
    });

    // ── game:opponent_disconnected ────────────────────────────────
    socket.on("game:opponent_disconnected", (payload) => {
      setOpponentDisconnected(payload);
    });

    // ── game:opponent_reconnected ─────────────────────────────────
    socket.on("game:opponent_reconnected", () => {
      setOpponentDisconnected(null);
    });

    // ── connection diagnostics (dev only) ─────────────────────────
    socket.on("connect", () => {
      console.log("[socket] connected:", socket.id);
    });
    socket.on("disconnect", (reason) => {
      console.log("[socket] disconnected:", reason);
    });
    socket.on("connect_error", (err) => {
      console.error("[socket] connect_error:", err.message);
    });

    // Provider never unmounts, so we intentionally do NOT clean up listeners.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
