/**
 * Zustand store — single source of truth for all client UI state.
 * The server is authoritative; this store just mirrors what the server sends.
 */

import { create } from "zustand";
import { ClientGameState, Element } from "@/lib/game/types";

export type AppScreen =
  | "menu"
  | "queue"
  | "match_found"
  | "game"
  | "result";

interface GameStore {
  // ── Identity ──────────────────────────────────────────────
  playerId:  string | null;
  username:  string;
  setPlayerId: (id: string) => void;
  setUsername: (name: string) => void;

  // ── Navigation ────────────────────────────────────────────
  screen:    AppScreen;
  setScreen: (s: AppScreen) => void;

  // ── Queue ─────────────────────────────────────────────────
  queuePosition: number;
  setQueuePosition: (pos: number) => void;

  // ── Match found transition ────────────────────────────────
  matchOpponent: { id: string; username: string } | null;
  matchRoomId:   string | null;
  setMatchFound: (roomId: string, opponent: { id: string; username: string }) => void;

  // ── Game state (mirror of server) ─────────────────────────
  gameState: ClientGameState | null;
  setGameState: (state: ClientGameState) => void;

  // ── Local UI ephemeral state ──────────────────────────────
  selectedCardId:    string | null;
  setSelectedCardId: (id: string | null) => void;

  opponentJustPlayed: boolean;
  setOpponentJustPlayed: (v: boolean) => void;

  opponentDisconnected: { username: string; reconnectGraceMs: number } | null;
  setOpponentDisconnected: (info: { username: string; reconnectGraceMs: number } | null) => void;

  rainbowMyChoice: Element | null;
  setRainbowMyChoice: (el: Element | null) => void;

  // ── Reset ─────────────────────────────────────────────────
  resetGame: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Identity
  playerId:    null,
  username:    "",
  setPlayerId: (id) => set({ playerId: id }),
  setUsername: (name) => set({ username: name }),

  // Navigation
  screen:    "menu",
  setScreen: (s) => set({ screen: s }),

  // Queue
  queuePosition:    0,
  setQueuePosition: (pos) => set({ queuePosition: pos }),

  // Match
  matchOpponent: null,
  matchRoomId:   null,
  setMatchFound: (roomId, opponent) =>
    set({ matchOpponent: opponent, matchRoomId: roomId }),

  // Game state
  gameState:    null,
  setGameState: (state) => set({ gameState: state }),

  // UI ephemeral
  selectedCardId:    null,
  setSelectedCardId: (id) => set({ selectedCardId: id }),

  opponentJustPlayed:    false,
  setOpponentJustPlayed: (v) => set({ opponentJustPlayed: v }),

  opponentDisconnected:    null,
  setOpponentDisconnected: (info) => set({ opponentDisconnected: info }),

  rainbowMyChoice:    null,
  setRainbowMyChoice: (el) => set({ rainbowMyChoice: el }),

  // Reset clears game-specific state but keeps identity
  resetGame: () =>
    set({
      gameState:            null,
      selectedCardId:       null,
      opponentJustPlayed:   false,
      opponentDisconnected: null,
      rainbowMyChoice:      null,
      matchOpponent:        null,
      matchRoomId:          null,
      screen:               "menu",
    }),
}));
