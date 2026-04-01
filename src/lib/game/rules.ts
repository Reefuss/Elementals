/**
 * Server-authoritative rules engine.
 * Pure functions — no side effects, no I/O.
 * Both server and client import this for display logic;
 * only the server uses it to mutate authoritative state.
 *
 * Priority order (highest first):
 *   1. DISCARD_TRAP
 *   2. BLOCK
 *   3. REVIVE
 *   4. RESHUFFLE
 *   5. DIAMOND
 *   6. RAINBOW
 *   7. ELEMENT (normal resolution)
 */

import {
  Card,
  CardType,
  Element,
  SpecialType,
  RoundOutcome,
  RoundResult,
  WinReason,
} from "./types";
import { ELEMENT_BEAT_MAP, POINTS_TO_WIN } from "./constants";

// ─────────────────────────────────────────────
//  Element dominance
// ─────────────────────────────────────────────

export function elementBeats(a: Element, b: Element): boolean {
  return ELEMENT_BEAT_MAP[a] === b;
}

// ─────────────────────────────────────────────
//  Card type helpers
// ─────────────────────────────────────────────

function isSpecial(card: Card, t: SpecialType): boolean {
  return card.type === CardType.SPECIAL && card.specialType === t;
}

// ─────────────────────────────────────────────
//  Round resolution
// ─────────────────────────────────────────────

export interface RoundResolution {
  outcome:         RoundOutcome;
  reason:          WinReason;
  /** Index 0 or 1 of the winning player, or null on tie */
  winnerIndex:     0 | 1 | null;
  needsTiebreak:   boolean;
  /** true = enter RAINBOW_TIEBREAK, false/undefined = normal flow */
  needsRevivePick: boolean;
  /** Which player indices need to pick from discard (0, 1, or both) */
  revivePickFor:   Array<0 | 1>;
  /** Which player index's card is voided (sent to void pile), if any */
  voidedIndex?:    0 | 1;
}

/**
 * Resolve a round given the two played cards.
 * p1Card belongs to players[0], p2Card to players[1].
 *
 * Priority (highest → lowest):
 *   DISCARD_TRAP > BLOCK > REVIVE > RESHUFFLE > DIAMOND > RAINBOW > ELEMENT
 */
export function resolveCards(p1Card: Card, p2Card: Card): RoundResolution {
  const p1IsTrap     = isSpecial(p1Card, SpecialType.DISCARD_TRAP);
  const p2IsTrap     = isSpecial(p2Card, SpecialType.DISCARD_TRAP);
  const p1IsBlock    = isSpecial(p1Card, SpecialType.BLOCK);
  const p2IsBlock    = isSpecial(p2Card, SpecialType.BLOCK);
  const p1IsRevive   = isSpecial(p1Card, SpecialType.REVIVE);
  const p2IsRevive   = isSpecial(p2Card, SpecialType.REVIVE);
  const p1IsReshuffle = isSpecial(p1Card, SpecialType.RESHUFFLE);
  const p2IsReshuffle = isSpecial(p2Card, SpecialType.RESHUFFLE);
  const p1IsDiamond  = p1Card.type === CardType.DIAMOND;
  const p2IsDiamond  = p2Card.type === CardType.DIAMOND;
  const p1IsRainbow  = isSpecial(p1Card, SpecialType.RAINBOW);
  const p2IsRainbow  = isSpecial(p2Card, SpecialType.RAINBOW);

  // ── Priority 1: DISCARD_TRAP ──────────────────────────────
  if (p1IsTrap && p2IsTrap) {
    return tie(WinReason.DISCARD_TRAP_MUTUAL);
  }
  if (p1IsTrap) {
    return { ...win(0, WinReason.DISCARD_TRAP), voidedIndex: 1 };
  }
  if (p2IsTrap) {
    return { ...win(1, WinReason.DISCARD_TRAP), voidedIndex: 0 };
  }

  // ── Priority 2: BLOCK ─────────────────────────────────────
  if (p1IsBlock || p2IsBlock) {
    return tie(WinReason.BLOCK_NEGATES);
  }

  // ── Priority 3: REVIVE ────────────────────────────────────
  if (p1IsRevive && p2IsRevive) {
    return {
      outcome:         RoundOutcome.TIE,
      reason:          WinReason.REVIVE_MUTUAL,
      winnerIndex:     null,
      needsTiebreak:   false,
      needsRevivePick: true,
      revivePickFor:   [0, 1],
    };
  }
  if (p1IsRevive) {
    // p1 sacrifices round to pick from discard
    return {
      ...win(1, WinReason.REVIVE_FORFEIT),
      needsRevivePick: true,
      revivePickFor:   [0],
    };
  }
  if (p2IsRevive) {
    return {
      ...win(0, WinReason.REVIVE_FORFEIT),
      needsRevivePick: true,
      revivePickFor:   [1],
    };
  }

  // ── Priority 4: RESHUFFLE ─────────────────────────────────
  if (p1IsReshuffle && p2IsReshuffle) {
    return tie(WinReason.RESHUFFLE_MUTUAL);
  }
  if (p1IsReshuffle) {
    // p1 reshuffles, opponent wins round
    return win(1, WinReason.RESHUFFLE);
  }
  if (p2IsReshuffle) {
    return win(0, WinReason.RESHUFFLE);
  }

  // ── Priority 5: DIAMOND ───────────────────────────────────
  if (p1IsDiamond && p2IsDiamond) {
    const v1 = (p1Card as { value: number }).value;
    const v2 = (p2Card as { value: number }).value;
    if (v1 > v2) return win(0, WinReason.DIAMOND_VALUE);
    if (v2 > v1) return win(1, WinReason.DIAMOND_VALUE);
    return tie(WinReason.DIAMOND_TIE);
  }
  if (p1IsDiamond) return win(0, WinReason.DIAMOND);
  if (p2IsDiamond) return win(1, WinReason.DIAMOND);

  // ── Priority 6: RAINBOW ───────────────────────────────────
  if (p1IsRainbow && p2IsRainbow) {
    return {
      outcome:         RoundOutcome.TIE,
      reason:          WinReason.RAINBOW_TIEBREAK,
      winnerIndex:     null,
      needsTiebreak:   true,
      needsRevivePick: false,
      revivePickFor:   [],
    };
  }
  if (p1IsRainbow) return win(0, WinReason.RAINBOW_BEATS);
  if (p2IsRainbow) return win(1, WinReason.RAINBOW_BEATS);

  // ── Priority 7: ELEMENT ───────────────────────────────────
  if (p1Card.type === CardType.ELEMENT && p2Card.type === CardType.ELEMENT) {
    if (p1Card.element === p2Card.element) {
      if (p1Card.value > p2Card.value) return win(0, WinReason.HIGHER_VALUE);
      if (p2Card.value > p1Card.value) return win(1, WinReason.HIGHER_VALUE);
      return tie(WinReason.SAME_VALUE_TIE);
    }
    if (elementBeats(p1Card.element, p2Card.element)) return win(0, WinReason.ELEMENT_BEATS);
    return win(1, WinReason.ELEMENT_BEATS);
  }

  // Fallback (should not occur with valid state)
  return tie(WinReason.SAME_VALUE_TIE);
}

// ─────────────────────────────────────────────
//  Resolution builder helpers
// ─────────────────────────────────────────────

function win(idx: 0 | 1, reason: WinReason): RoundResolution {
  return {
    outcome:         idx === 0 ? RoundOutcome.PLAYER_ONE_WINS : RoundOutcome.PLAYER_TWO_WINS,
    reason,
    winnerIndex:     idx,
    needsTiebreak:   false,
    needsRevivePick: false,
    revivePickFor:   [],
  };
}

function tie(reason: WinReason): RoundResolution {
  return {
    outcome:         RoundOutcome.TIE,
    reason,
    winnerIndex:     null,
    needsTiebreak:   false,
    needsRevivePick: false,
    revivePickFor:   [],
  };
}

// ─────────────────────────────────────────────
//  Rainbow tiebreak
// ─────────────────────────────────────────────

export function resolveRainbowTiebreak(
  p1Choice: Element,
  p2Choice: Element
): { winnerIndex: 0 | 1 | null } {
  if (p1Choice === p2Choice) return { winnerIndex: null };
  if (elementBeats(p1Choice, p2Choice)) return { winnerIndex: 0 };
  return { winnerIndex: 1 };
}

// ─────────────────────────────────────────────
//  Game-level helpers
// ─────────────────────────────────────────────

export function hasWon(score: number): boolean {
  return score >= POINTS_TO_WIN;
}

export function isValidPlay(cardId: string, hand: Card[]): boolean {
  return hand.some((c) => c.id === cardId);
}

export function areBothOutOfCards(
  p1Hand: Card[],
  p1Deck: Card[],
  p2Hand: Card[],
  p2Deck: Card[]
): boolean {
  return (
    p1Hand.length === 0 &&
    p1Deck.length === 0 &&
    p2Hand.length === 0 &&
    p2Deck.length === 0
  );
}

// ─────────────────────────────────────────────
//  Display helpers (used on both client and server)
// ─────────────────────────────────────────────

export function cardDisplayName(card: Card): string {
  if (card.type === CardType.DIAMOND) return `Diamond ×${card.value}`;
  if (card.type === CardType.SPECIAL) {
    switch (card.specialType) {
      case SpecialType.BLOCK:        return "Block";
      case SpecialType.RAINBOW:      return "Rainbow";
      case SpecialType.RESHUFFLE:    return "Reshuffle";
      case SpecialType.DISCARD_TRAP: return "Discard Trap";
      case SpecialType.REVIVE:       return "Revive";
    }
  }
  const elementName = card.element.charAt(0) + card.element.slice(1).toLowerCase();
  return `${elementName} +${card.value}`;
}

export function resultMessage(
  result: RoundResult,
  selfId: string
): { headline: string; sub: string } {
  if (result.winnerId === null) {
    switch (result.reason) {
      case WinReason.BLOCK_NEGATES:     return { headline: "Blocked!", sub: "No points awarded." };
      case WinReason.SAME_VALUE_TIE:    return { headline: "Tie!", sub: "Same element, same power." };
      case WinReason.DISCARD_TRAP_MUTUAL: return { headline: "Mutual Trap!", sub: "Both cards voided." };
      case WinReason.REVIVE_MUTUAL:     return { headline: "Both Revive", sub: "Each player picks a card back." };
      case WinReason.RESHUFFLE_MUTUAL:  return { headline: "Both Reshuffle", sub: "Hands reshuffled, draw 3." };
      case WinReason.DIAMOND_TIE:       return { headline: "Diamond Tie", sub: "Equal diamond values." };
      default:                          return { headline: "Tie!", sub: "No points this round." };
    }
  }
  const youWon = result.winnerId === selfId;
  return {
    headline: youWon ? "You Win!" : "Opponent Wins",
    sub:      winReasonLabel(result.reason, youWon),
  };
}

function winReasonLabel(reason: WinReason, youWon: boolean): string {
  const subject = youWon ? "Your card" : "Opponent's card";
  switch (reason) {
    case WinReason.ELEMENT_BEATS:    return `${subject} dominated the element clash.`;
    case WinReason.HIGHER_VALUE:     return `${subject} had higher power.`;
    case WinReason.RAINBOW_BEATS:    return `${subject}'s Rainbow conquered all.`;
    case WinReason.RAINBOW_TIEBREAK: return `${subject} chose wisely in the Rainbow duel.`;
    case WinReason.DIAMOND:          return `${subject}'s Diamond beats all elements.`;
    case WinReason.DIAMOND_VALUE:    return `${subject}'s Diamond had higher value.`;
    case WinReason.DISCARD_TRAP:     return youWon ? "Your trap voided the opponent's card." : "Opponent's trap voided your card.";
    case WinReason.REVIVE_FORFEIT:   return youWon ? "Opponent sacrificed the round to revive." : "You sacrificed the round to revive.";
    case WinReason.RESHUFFLE:        return youWon ? "Opponent reshuffled their hand." : "You reshuffled your hand.";
    default:                         return "";
  }
}
