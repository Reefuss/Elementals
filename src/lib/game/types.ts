// ─────────────────────────────────────────────
//  Core enumerations
// ─────────────────────────────────────────────

export enum Element {
  ROCK     = "ROCK",
  PAPER    = "PAPER",
  SCISSORS = "SCISSORS",
}

export enum SpecialType {
  BLOCK        = "BLOCK",
  RAINBOW      = "RAINBOW",
  RESHUFFLE    = "RESHUFFLE",
  DISCARD_TRAP = "DISCARD_TRAP",
  REVIVE       = "REVIVE",
}

export enum CardType {
  ELEMENT = "ELEMENT",
  SPECIAL = "SPECIAL",
  DIAMOND = "DIAMOND",
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
  /** One or both players must pick a card from their discard pile (Revive) */
  REVIVE_PICK        = "REVIVE_PICK",
  /** Game over */
  GAME_OVER          = "GAME_OVER",
}

export enum RoundOutcome {
  PLAYER_ONE_WINS = "PLAYER_ONE_WINS",
  PLAYER_TWO_WINS = "PLAYER_TWO_WINS",
  TIE             = "TIE",
}

export enum WinReason {
  // Element resolution
  ELEMENT_BEATS       = "ELEMENT_BEATS",
  HIGHER_VALUE        = "HIGHER_VALUE",
  SAME_VALUE_TIE      = "SAME_VALUE_TIE",
  // Rainbow
  RAINBOW_BEATS       = "RAINBOW_BEATS",
  RAINBOW_TIEBREAK    = "RAINBOW_TIEBREAK",
  // Block
  BLOCK_NEGATES       = "BLOCK_NEGATES",
  // Diamond
  DIAMOND             = "DIAMOND",
  DIAMOND_VALUE       = "DIAMOND_VALUE",
  DIAMOND_TIE         = "DIAMOND_TIE",
  // Special actions
  DISCARD_TRAP        = "DISCARD_TRAP",
  DISCARD_TRAP_MUTUAL = "DISCARD_TRAP_MUTUAL",
  REVIVE_FORFEIT      = "REVIVE_FORFEIT",
  REVIVE_MUTUAL       = "REVIVE_MUTUAL",
  RESHUFFLE           = "RESHUFFLE",
  RESHUFFLE_MUTUAL    = "RESHUFFLE_MUTUAL",
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

export interface DiamondCard {
  id:    string;
  type:  CardType.DIAMOND;
  /** Diamond value — beats all element cards; higher wins against other diamonds */
  value: number;
}

export type Card = ElementCard | SpecialCard | DiamondCard;

// ─────────────────────────────────────────────
//  Round / match results
// ─────────────────────────────────────────────

export interface RoundResult {
  roundNumber:   number;
  playerOneCard: Card;
  playerTwoCard: Card;
  outcome:       RoundOutcome;
  reason:        WinReason;
  /** playerId of winner, or null on tie */
  winnerId:      string | null;
  scoreAfter:    { [playerId: string]: number };
  /** playerId whose card was sent to the void (by Discard Trap), if any */
  voidedCardOf?: string;
}

export interface MatchResult {
  /** playerId of match winner, or null for draw */
  winnerId:    string | null;
  reason:      "score" | "both_out_of_cards" | "forfeit";
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
  /** Cards played and discarded this game (normal discard) */
  discard:   Card[];
  /** Cards permanently removed from the game (by Discard Trap) */
  voided:    Card[];
  score:     number;
  connected: boolean;
}

/** Safe player info sent to the opponent */
export interface OpponentView {
  id:           string;
  username:     string;
  score:        number;
  handCount:    number;
  deckCount:    number;
  discardCount: number;
  hasPlayed:    boolean;
  connected:    boolean;
}

/** Full view of yourself */
export interface SelfView {
  id:          string;
  username:    string;
  score:       number;
  hand:        Card[];
  deckCount:   number;
  discardPile: Card[];
  hasPlayed:   boolean;
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
  /** Present during REVIVE_PICK phase */
  revivePick: {
    /** This player must pick a card from their discard pile */
    needsPick:    boolean;
    /** Waiting for the opponent to finish their pick */
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
  /** Present during REVIVE_PICK phase: which players still need to pick */
  revivePick: {
    waitingFor: Set<string>;
    /** cardId chosen, keyed by playerId */
    picked: Map<string, string>;
  } | null;
}
