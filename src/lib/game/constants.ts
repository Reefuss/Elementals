/** Rounds required to win the match (first to win this many rounds wins) */
export const POINTS_TO_WIN = 2;

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

/** Element beat order: Sun > Star > Moon > Sun */
export const ELEMENT_BEAT_MAP: Record<string, string> = {
  SUN:  "STAR",
  STAR: "MOON",
  MOON: "SUN",
} as const;

export const CARD_VALUES = [3, 5, 8] as const;
export type CardValue = (typeof CARD_VALUES)[number];

/**
 * Legacy deck template — kept for fallback / testing.
 * The live game now builds decks from player collections.
 * 5 element cards per element (2×+3, 2×+5, 1×+8), 3 Block, 2 Rainbow = 20 cards.
 */
export const DECK_TEMPLATE = [
  // Sun
  { element: "SUN",  value: 3 },
  { element: "SUN",  value: 3 },
  { element: "SUN",  value: 5 },
  { element: "SUN",  value: 5 },
  { element: "SUN",  value: 8 },
  // Moon
  { element: "MOON", value: 3 },
  { element: "MOON", value: 3 },
  { element: "MOON", value: 5 },
  { element: "MOON", value: 5 },
  { element: "MOON", value: 8 },
  // Star
  { element: "STAR", value: 3 },
  { element: "STAR", value: 3 },
  { element: "STAR", value: 5 },
  { element: "STAR", value: 5 },
  { element: "STAR", value: 8 },
  // Special
  { special: "BLOCK" },
  { special: "BLOCK" },
  { special: "BLOCK" },
  { special: "RAINBOW" },
  { special: "RAINBOW" },
] as const;
