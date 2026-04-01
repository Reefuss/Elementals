/** Points required to win the match */
export const POINTS_TO_WIN = 3;

/** Cards drawn at game start */
export const INITIAL_HAND_SIZE = 4;

/** Cards drawn at the start of each subsequent round */
export const DRAW_PER_ROUND = 1;

/** Cards drawn after a Reshuffle (hand is shuffled back into deck first) */
export const RESHUFFLE_HAND_SIZE = 3;

/** Server-enforced turn duration in milliseconds */
export const TURN_DURATION_MS = 30_000;

/** Grace period for reconnection before forfeit (ms) */
export const RECONNECT_GRACE_MS = 30_000;

/** Beat order: Rock > Scissors > Paper > Rock */
export const ELEMENT_BEAT_MAP: Record<string, string> = {
  ROCK:     "SCISSORS",
  SCISSORS: "PAPER",
  PAPER:    "ROCK",
} as const;

export const CARD_VALUES = [3, 5, 8] as const;
export type CardValue = (typeof CARD_VALUES)[number];

/**
 * Legacy deck template — kept for fallback / testing.
 * The live game now builds decks from player collections.
 * 5 element cards per element (2×+3, 2×+5, 1×+8), 3 Block, 2 Rainbow = 20 cards.
 */
export const DECK_TEMPLATE = [
  // Rock
  { element: "ROCK",     value: 3 },
  { element: "ROCK",     value: 3 },
  { element: "ROCK",     value: 5 },
  { element: "ROCK",     value: 5 },
  { element: "ROCK",     value: 8 },
  // Paper
  { element: "PAPER",    value: 3 },
  { element: "PAPER",    value: 3 },
  { element: "PAPER",    value: 5 },
  { element: "PAPER",    value: 5 },
  { element: "PAPER",    value: 8 },
  // Scissors
  { element: "SCISSORS", value: 3 },
  { element: "SCISSORS", value: 3 },
  { element: "SCISSORS", value: 5 },
  { element: "SCISSORS", value: 5 },
  { element: "SCISSORS", value: 8 },
  // Special
  { special: "BLOCK" },
  { special: "BLOCK" },
  { special: "BLOCK" },
  { special: "RAINBOW" },
  { special: "RAINBOW" },
] as const;
