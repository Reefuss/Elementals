// ─────────────────────────────────────────────
//  Core enumerations
// ─────────────────────────────────────────────

export enum Element {
  SUN  = "SUN",
  MOON = "MOON",
  STAR = "STAR",
}

export enum SpecialType {
  BLOCK   = "BLOCK",
  RAINBOW = "RAINBOW",
}

export enum CardType {
  ELEMENT = "ELEMENT",
  SPECIAL = "SPECIAL",
}

export enum GamePhase {
  /** Waiting for both players to be ready */
  WAITING            = "WAITING",
  /** Players choosing a card to play */
  PLAYING            = "PLAYING",
  /** Both cards submitted, awaiting reveal */
  REVEALING          = "REVEALING",
  /** Rainbow vs Rainbow tiebreak in progress */
  RAINBOW_TIEBREAK   = "RAINBOW_TIEBREAK",
  /** Game over */
  GAME_OVER          = "GAME_OVER",
}

export enum RoundOutcome {
  PLAYER_ONE_WINS = "PLAYER_ONE_WINS",
  PLAYER_TWO_WINS = "PLAYER_TWO_WINS",
  TIE             = "TIE",
}

export enum WinReason {
  ELEMENT_BEATS     = "ELEMENT_BEATS",
  HIGHER_VALUE      = "HIGHER_VALUE",
  RAINBOW_BEATS     = "RAINBOW_BEATS",
  BLOCK_NEGATES     = "BLOCK_NEGATES",
  SAME_VALUE_TIE    = "SAME_VALUE_TIE",
  RAINBOW_TIEBREAK  = "RAINBOW_TIEBREAK",
}

// ─────────────────────────────────────────────
//  Card model
// ─────────────────────────────────────────────

export interface ElementCard {
  id:      string;
  type:    CardType.ELEMENT;
  element: Element;
  value:   3 | 5 | 8;
}

export interface SpecialCard {
  id:          string;
  type:        CardType.SPECIAL;
  specialType: SpecialType;
}

export type Card = ElementCard | SpecialCard;

// ─────────────────────────────────────────────
//  Round / match results
// ─────────────────────────────────────────────

export interface RoundResult {
  roundNumber: number;
  playerOneCard: Card;
  playerTwoCard: Card;
  outcome:   RoundOutcome;
  reason:    WinReason;
  /** playerId of winner, or null on tie */
  winnerId:  string | null;
  scoreAfter: { [playerId: string]: number };
}

export interface MatchResult {
  /** playerId of match winner, or null for draw */
  winnerId:    string | null;
  reason:      "score" | "both_out_of_cards";
  finalScores: { [playerId: string]: number };
  rounds:      RoundResult[];
}

// ─────────────────────────────────────────────
//  Player views (server-side full / client-safe partial)
// ─────────────────────────────────────────────

/** Full server-side player state — never sent to the client as-is */
export interface ServerPlayer {
  id:        string;
  username:  string;
  socketId:  string;
  deck:      Card[];
  hand:      Card[];
  score:     number;
  connected: boolean;
}

/** Safe player info sent to the opponent */
export interface OpponentView {
  id:          string;
  username:    string;
  score:       number;
  handCount:   number;
  deckCount:   number;
  hasPlayed:   boolean;
  connected:   boolean;
}

/** Full view of yourself */
export interface SelfView {
  id:        string;
  username:  string;
  score:     number;
  hand:      Card[];
  deckCount: number;
  hasPlayed: boolean;
}

// ─────────────────────────────────────────────
//  Client-facing game state
// ─────────────────────────────────────────────

export interface ClientGameState {
  roomId:        string;
  phase:         GamePhase;
  round:         number;
  self:          SelfView;
  opponent:      OpponentView;
  turnStartedAt: number | null;   // epoch ms — used to drive client-side timer
  lastResult:    RoundResult | null;
  matchResult:   MatchResult | null;
  rainbowTiebreak: {
    attempt:      number;
    myChoice:     Element | null;
    waitingForOp: boolean;
  } | null;
}

// ─────────────────────────────────────────────
//  Server-side full game state
// ─────────────────────────────────────────────

export interface ServerGame {
  roomId:         string;
  phase:          GamePhase;
  round:          number;
  players:        [ServerPlayer, ServerPlayer];
  /** cardId keyed by playerId */
  plays:          Map<string, string>;
  results:        RoundResult[];
  turnStartedAt:  number | null;
  turnTimer:      ReturnType<typeof setTimeout> | null;
  rainbowTiebreak: {
    attempt: number;
    choices: Map<string, Element>;
  } | null;
}
