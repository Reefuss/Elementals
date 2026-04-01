import { v4 as uuidv4 } from "uuid";
import { Card, CardType, Element, SpecialType, ElementCard, SpecialCard } from "./types";
import { DECK_TEMPLATE } from "./constants";

/** Build a fresh, shuffled 20-card deck. */
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
        value:   entry.value as 3 | 5 | 8,
      };
      return card;
    }
  });

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
