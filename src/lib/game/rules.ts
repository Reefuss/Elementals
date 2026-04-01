/**
 * Server-authoritative rules engine.
 * Pure functions — no side effects, no I/O.
 * Both server and client import this for display logic;
 * only the server uses it to mutate authoritative state.
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

/** Returns true if element `a` beats element `b` per game rules. */
export function elementBeats(a: Element, b: Element): boolean {
  return ELEMENT_BEAT_MAP[a] === b;
}

// ─────────────────────────────────────────────
//  Round resolution
// ─────────────────────────────────────────────

export interface RoundResolution {
  outcome:        RoundOutcome;
  reason:         WinReason;
  /** Index 0 or 1 of the winning player, or null on tie */
  winnerIndex:    0 | 1 | null;
  needsTiebreak:  boolean;
}

/**
 * Resolve a round given the two played cards.
 * p1Card belongs to players[0], p2Card to players[1].
 */
export function resolveCards(p1Card: Card, p2Card: Card): RoundResolution {
  const p1IsBlock   = p1Card.type === CardType.SPECIAL && p1Card.specialType === SpecialType.BLOCK;
  const p2IsBlock   = p2Card.type === CardType.SPECIAL && p2Card.specialType === SpecialType.BLOCK;
  const p1IsRainbow = p1Card.type === CardType.SPECIAL && p1Card.specialType === SpecialType.RAINBOW;
  const p2IsRainbow = p2Card.type === CardType.SPECIAL && p2Card.specialType === SpecialType.RAINBOW;

  // ── Block always negates ──
  if (p1IsBlock || p2IsBlock) {
    return {
      outcome:       RoundOutcome.TIE,
      reason:        WinReason.BLOCK_NEGATES,
      winnerIndex:   null,
      needsTiebreak: false,
    };
  }

  // ── Rainbow vs Rainbow → tiebreak needed ──
  if (p1IsRainbow && p2IsRainbow) {
    return {
      outcome:       RoundOutcome.TIE,
      reason:        WinReason.RAINBOW_TIEBREAK,
      winnerIndex:   null,
      needsTiebreak: true,
    };
  }

  // ── Rainbow beats element ──
  if (p1IsRainbow) {
    return {
      outcome:       RoundOutcome.PLAYER_ONE_WINS,
      reason:        WinReason.RAINBOW_BEATS,
      winnerIndex:   0,
      needsTiebreak: false,
    };
  }
  if (p2IsRainbow) {
    return {
      outcome:       RoundOutcome.PLAYER_TWO_WINS,
      reason:        WinReason.RAINBOW_BEATS,
      winnerIndex:   1,
      needsTiebreak: false,
    };
  }

  // ── Element vs Element ──
  if (p1Card.type === CardType.ELEMENT && p2Card.type === CardType.ELEMENT) {
    if (p1Card.element === p2Card.element) {
      // Same element — compare value
      if (p1Card.value > p2Card.value) {
        return {
          outcome:       RoundOutcome.PLAYER_ONE_WINS,
          reason:        WinReason.HIGHER_VALUE,
          winnerIndex:   0,
          needsTiebreak: false,
        };
      }
      if (p2Card.value > p1Card.value) {
        return {
          outcome:       RoundOutcome.PLAYER_TWO_WINS,
          reason:        WinReason.HIGHER_VALUE,
          winnerIndex:   1,
          needsTiebreak: false,
        };
      }
      return {
        outcome:       RoundOutcome.TIE,
        reason:        WinReason.SAME_VALUE_TIE,
        winnerIndex:   null,
        needsTiebreak: false,
      };
    }

    // Different element — check dominance
    if (elementBeats(p1Card.element, p2Card.element)) {
      return {
        outcome:       RoundOutcome.PLAYER_ONE_WINS,
        reason:        WinReason.ELEMENT_BEATS,
        winnerIndex:   0,
        needsTiebreak: false,
      };
    }
    return {
      outcome:       RoundOutcome.PLAYER_TWO_WINS,
      reason:        WinReason.ELEMENT_BEATS,
      winnerIndex:   1,
      needsTiebreak: false,
    };
  }

  // Should not reach here with a valid game state
  return {
    outcome:       RoundOutcome.TIE,
    reason:        WinReason.SAME_VALUE_TIE,
    winnerIndex:   null,
    needsTiebreak: false,
  };
}

/**
 * Resolve the Rainbow vs Rainbow tiebreak.
 * Returns the winner index or null if both picked the same element.
 */
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
  if (card.type === CardType.SPECIAL) {
    return card.specialType === SpecialType.BLOCK ? "Block" : "Rainbow";
  }
  const elementName =
    card.element.charAt(0) + card.element.slice(1).toLowerCase();
  return `${elementName} +${card.value}`;
}

export function resultMessage(
  result: RoundResult,
  selfId: string
): { headline: string; sub: string } {
  if (result.winnerId === null) {
    if (result.reason === WinReason.BLOCK_NEGATES)
      return { headline: "Blocked!", sub: "No points awarded." };
    if (result.reason === WinReason.SAME_VALUE_TIE)
      return { headline: "Tie!", sub: "Same element, same power." };
    return { headline: "Tie!", sub: "No points this round." };
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
    default:                         return "";
  }
}
