import { v4 as uuidv4 } from "uuid";
import {
  Card, CardType, Element, SpecialType,
  ElementCard, SpecialCard, DiamondCard,
} from "./types";
import { DECK_TEMPLATE } from "./constants";
import { CARD_MAP } from "./cardPool";

/** Build a fresh, shuffled 20-card legacy deck (used as fallback / testing). */
export function createDeck(): Card[] {
  const deck: Card[] = DECK_TEMPLATE.map((entry) => {
    if ("special" in entry) {
      const card: SpecialCard = {
        id:          uuidv4(),
        type:        CardType.SPECIAL,
        specialType: entry.special as SpecialType,
      };
      return card;
    } else {
      const card: ElementCard = {
        id:      uuidv4(),
        type:    CardType.ELEMENT,
        element: entry.element as Element,
        value:   entry.value as 3 | 5 | 8 | 12,
      };
      return card;
    }
  });

  return shuffle(deck);
}

/**
 * Build a shuffled game deck from a saved deck's card-id→count mapping.
 * Each card in the collection gets a fresh UUID so hands are trackable.
 * Falls back to createDeck() if the provided mapping is empty or unknown.
 */
export function buildDeckFromCards(savedCards: Record<string, number>): Card[] {
  const deck: Card[] = [];

  for (const [variantId, qty] of Object.entries(savedCards)) {
    if (qty <= 0) continue;
    const variant = CARD_MAP[variantId];
    if (!variant) continue;

    for (let i = 0; i < qty; i++) {
      if (variant.type === "element") {
        const card: ElementCard = {
          id:        uuidv4(),
          type:      CardType.ELEMENT,
          element:   variant.element as Element,
          value:     variant.value as 3 | 5 | 8 | 12,
          variantId: variantId,
        };
        deck.push(card);
      } else if (variant.type === "special") {
        const card: SpecialCard = {
          id:          uuidv4(),
          type:        CardType.SPECIAL,
          specialType: variant.specialType as SpecialType,
          variantId:   variantId,
        };
        deck.push(card);
      } else if (variant.type === "diamond") {
        const card: DiamondCard = {
          id:        uuidv4(),
          type:      CardType.DIAMOND,
          value:     variant.value as number,
          variantId: variantId,
        };
        deck.push(card);
      }
    }
  }

  if (deck.length === 0) return createDeck();
  return shuffle(deck);
}

/** Fisher-Yates shuffle — returns a new array. */
export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Draw `count` cards from the top of `deck`.
 * Mutates the deck array in-place.
 * Returns the drawn cards.
 */
export function drawCards(deck: Card[], count: number): Card[] {
  const drawn: Card[] = [];
  for (let i = 0; i < count && deck.length > 0; i++) {
    drawn.push(deck.pop()!);
  }
  return drawn;
}
