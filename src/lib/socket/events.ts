/**
 * Typed Socket.IO event contracts.
 * Imported by both server and client for full type safety.
 */

import type { ClientGameState, Element } from "../game/types";

// ─────────────────────────────────────────────
//  Client → Server
// ─────────────────────────────────────────────

export interface ClientToServerEvents {
  /** Join matchmaking queue */
  "queue:join": (payload: { username: string }, ack: (err: string | null) => void) => void;

  /** Leave matchmaking queue */
  "queue:leave": () => void;

  /** Play a card during PLAYING phase */
  "game:play": (payload: { cardId: string }, ack: (err: string | null) => void) => void;

  /** Submit Rainbow tiebreak element choice */
  "game:rainbow_choice": (
    payload: { element: Element },
    ack: (err: string | null) => void
  ) => void;

  /** Signal ready to start next round after result reveal */
  "game:ready": () => void;

  /** Request the server to re-push the current game state (used on game page mount) */
  "game:request_state": () => void;
}

// ─────────────────────────────────────────────
//  Server → Client
// ─────────────────────────────────────────────

export interface ServerToClientEvents {
  /** Queue position update */
  "queue:status": (payload: { position: number }) => void;

  /** Match has been found — navigate to game room */
  "match:found": (payload: {
    roomId:   string;
    opponent: { id: string; username: string };
  }) => void;

  /** Full authoritative game state snapshot */
  "game:state": (state: ClientGameState) => void;

  /** Opponent submitted their card (not what the card is) */
  "game:opponent_played": () => void;

  /** Server requests Rainbow tiebreak choices */
  "game:rainbow_tiebreak": (payload: { attempt: number }) => void;

  /** Rainbow choice accepted; waiting for opponent */
  "game:rainbow_waiting": () => void;

  /** Opponent disconnected */
  "game:opponent_disconnected": (payload: { username: string; reconnectGraceMs: number }) => void;

  /** Opponent reconnected */
  "game:opponent_reconnected": (payload: { username: string }) => void;

  /** Server-side error message */
  "error:game": (payload: { code: string; message: string }) => void;
}

// ─────────────────────────────────────────────
//  Inter-server (not used externally)
// ─────────────────────────────────────────────

export interface InterServerEvents {}

// ─────────────────────────────────────────────
//  Per-socket data attached by the server
// ─────────────────────────────────────────────

export interface SocketData {
  playerId: string;
  username: string;
  roomId:   string | null;
}
