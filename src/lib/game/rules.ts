/**
 * Server-authoritative rules engine.
 * Pure functions — no side effects, no I/O.
 * Both server and client import this for display logic;
 * only the server uses it to mutate authoritative state.
 *
 * Priority order (highest first):
 *   1. DISCARD_TRAP
 *   2. STALL
 *   3. REVIVE
 *   4. RESHUFFLE
 *   5. DIAMOND (element card with diamond rarity)
 *   6. ELEMENT (normal resolution)
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
import { DIAMOND_CARD_IDS } from "./cardPool";
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

function isDiamondCard(card: Card): boolean {
  return card.type === CardType.ELEMENT && !!card.variantId && DIAMOND_CARD_IDS.has(card.variantId);
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
 * Priority: Discard Trap → Stall → Revive → Reshuffle → Diamond → Element
 */
export function resolveCards(p1Card: Card, p2Card: Card): RoundResolution {
  const p1IsTrap      = isSpecial(p1Card, SpecialType.DISCARD_TRAP);
  const p2IsTrap      = isSpecial(p2Card, SpecialType.DISCARD_TRAP);
  const p1IsStall     = isSpecial(p1Card, SpecialType.STALL);
  const p2IsStall     = isSpecial(p2Card, SpecialType.STALL);
  const p1IsRevive    = isSpecial(p1Card, SpecialType.REVIVE);
  const p2IsRevive    = isSpecial(p2Card, SpecialType.REVIVE);
  const p1IsReshuffle = isSpecial(p1Card, SpecialType.RESHUFFLE);
  const p2IsReshuffle = isSpecial(p2Card, SpecialType.RESHUFFLE);
  const p1IsSpecial   = p1IsTrap || p1IsStall || p1IsRevive || p1IsReshuffle;
  const p2IsSpecial   = p2IsTrap || p2IsStall || p2IsRevive || p2IsReshuffle;

  // ── 1. DISCARD TRAP ───────────────────────────────────────
  if (p1IsTrap && p2IsTrap) return tie(WinReason.DISCARD_TRAP_MUTUAL);
  if (p1IsTrap) return { ...tie(WinReason.DISCARD_TRAP), voidedIndex: 1 };
  if (p2IsTrap) return { ...tie(WinReason.DISCARD_TRAP), voidedIndex: 0 };

  // ── 2. STALL ──────────────────────────────────────────────
  if (p1IsStall || p2IsStall) return tie(WinReason.STALL);

  // ── 3. REVIVE ─────────────────────────────────────────────
  if (p1IsRevive && p2IsRevive) {
    return {
      outcome: RoundOutcome.TIE, reason: WinReason.REVIVE_MUTUAL,
      winnerIndex: null, needsTiebreak: false,
      needsRevivePick: true, revivePickFor: [0, 1],
    };
  }
  if (p1IsRevive) return { ...win(1, WinReason.REVIVE_FORFEIT), needsRevivePick: true, revivePickFor: [0] };
  if (p2IsRevive) return { ...win(0, WinReason.REVIVE_FORFEIT), needsRevivePick: true, revivePickFor: [1] };

  // ── 4. RESHUFFLE ──────────────────────────────────────────
  if (p1IsReshuffle && p2IsReshuffle) return tie(WinReason.RESHUFFLE_MUTUAL);
  if (p1IsReshuffle) return win(1, WinReason.RESHUFFLE);
  if (p2IsReshuffle) return win(0, WinReason.RESHUFFLE);

  // ── 5. DIAMOND vs non-diamond ─────────────────────────────
  const p1IsDiamond = isDiamondCard(p1Card);
  const p2IsDiamond = isDiamondCard(p2Card);

  if (!p2IsSpecial && p1IsDiamond && !p2IsDiamond) return win(0, WinReason.DIAMOND_BEATS);
  if (!p1IsSpecial && p2IsDiamond && !p1IsDiamond) return win(1, WinReason.DIAMOND_BEATS);

  // ── 6. ELEMENT resolution (including diamond vs diamond) ──
  if (p1Card.type === CardType.ELEMENT && p2Card.type === CardType.ELEMENT) {
    if (p1Card.element === p2Card.element) {
      if (p1Card.value > p2Card.value) return win(0, WinReason.HIGHER_VALUE);
      if (p2Card.value > p1Card.value) return win(1, WinReason.HIGHER_VALUE);
      return tie(WinReason.SAME_VALUE_TIE);
    }
    if (elementBeats(p1Card.element, p2Card.element)) return win(0, WinReason.ELEMENT_BEATS);
    return win(1, WinReason.ELEMENT_BEATS);
  }

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
    switch (card.specialType) {
      case SpecialType.STALL:        return "Stall";
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
      case WinReason.STALL:               return { headline: "Stalled!", sub: "Both cards returned to hand. Draw 1 each." };
      case WinReason.DISCARD_TRAP:        return { headline: "Trapped!", sub: "Opponent's card removed from the match." };
      case WinReason.SAME_VALUE_TIE:      return { headline: "Tie!", sub: "Same element, same power." };
      case WinReason.DISCARD_TRAP_MUTUAL: return { headline: "Mutual Trap!", sub: "Both cards voided." };
      case WinReason.REVIVE_MUTUAL:       return { headline: "Both Revive", sub: "Each player picks a card back." };
      case WinReason.RESHUFFLE:           return { headline: "Reshuffle!", sub: "Hand reset — no points awarded." };
      case WinReason.RESHUFFLE_MUTUAL:    return { headline: "Both Reshuffle", sub: "Hands reshuffled, draw 3." };
      default:                            return { headline: "Tie!", sub: "No points this round." };
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
    case WinReason.DIAMOND_BEATS:    return `${subject}'s Diamond overpowered all.`;
    case WinReason.DISCARD_TRAP:     return youWon ? "Your trap voided the opponent's card." : "Opponent's trap voided your card.";
    case WinReason.REVIVE_FORFEIT:   return youWon ? "Opponent sacrificed the round to revive." : "You sacrificed the round to revive.";
    case WinReason.RESHUFFLE:        return youWon ? "Opponent reshuffled their hand." : "You reshuffled your hand.";
    default:                         return "";
  }
}
