// Card pool, pack definitions, economy constants for Elementals

export type Rarity = "common" | "rare" | "epic";
export type ElementKey = "SUN" | "MOON" | "STAR";

export interface CardVariant {
  id: string;
  type: "element" | "special";
  element?: ElementKey;
  specialType?: "BLOCK" | "RAINBOW";
  value?: 3 | 5 | 8;
  rarity: Rarity;
  displayName: string;
  maxPerDeck: number;
}

export const ALL_CARDS: CardVariant[] = [
  { id: "sun_3",   type: "element", element: "SUN",  value: 3, rarity: "common", displayName: "Sun +3",   maxPerDeck: 3 },
  { id: "sun_5",   type: "element", element: "SUN",  value: 5, rarity: "rare",   displayName: "Sun +5",   maxPerDeck: 3 },
  { id: "sun_8",   type: "element", element: "SUN",  value: 8, rarity: "epic",   displayName: "Sun +8",   maxPerDeck: 2 },
  { id: "moon_3",  type: "element", element: "MOON", value: 3, rarity: "common", displayName: "Moon +3",  maxPerDeck: 3 },
  { id: "moon_5",  type: "element", element: "MOON", value: 5, rarity: "rare",   displayName: "Moon +5",  maxPerDeck: 3 },
  { id: "moon_8",  type: "element", element: "MOON", value: 8, rarity: "epic",   displayName: "Moon +8",  maxPerDeck: 2 },
  { id: "star_3",  type: "element", element: "STAR", value: 3, rarity: "common", displayName: "Star +3",  maxPerDeck: 3 },
  { id: "star_5",  type: "element", element: "STAR", value: 5, rarity: "rare",   displayName: "Star +5",  maxPerDeck: 3 },
  { id: "star_8",  type: "element", element: "STAR", value: 8, rarity: "epic",   displayName: "Star +8",  maxPerDeck: 2 },
  { id: "block",   type: "special", specialType: "BLOCK",   rarity: "rare",  displayName: "Block",   maxPerDeck: 3 },
  { id: "rainbow", type: "special", specialType: "RAINBOW", rarity: "epic",  displayName: "Rainbow", maxPerDeck: 2 },
];

export const CARD_MAP: Record<string, CardVariant> = Object.fromEntries(
  ALL_CARDS.map((c) => [c.id, c])
);

// ─────────────────────────────────────────────
//  Pack definitions
// ─────────────────────────────────────────────

export interface PackType {
  id: string;
  name: string;
  tagline: string;
  cost: number;
  cardsPerPack: number;
  rarityWeights: { common: number; rare: number; epic: number };
  guaranteedRare: boolean;
  accentColor: string;
  bgFrom: string;
  bgTo: string;
}

export const PACK_TYPES: PackType[] = [
  {
    id: "cosmos",
    name: "Cosmos Pack",
    tagline: "Drawn from the celestial archives",
    cost: 500,
    cardsPerPack: 5,
    rarityWeights: { common: 0.65, rare: 0.28, epic: 0.07 },
    guaranteedRare: false,
    accentColor: "#818cf8",
    bgFrom: "from-indigo-950",
    bgTo: "to-slate-900",
  },
  {
    id: "eclipse",
    name: "Eclipse Pack",
    tagline: "Forged in the celestial eclipse",
    cost: 1200,
    cardsPerPack: 5,
    rarityWeights: { common: 0.40, rare: 0.43, epic: 0.17 },
    guaranteedRare: true,
    accentColor: "#f59e0b",
    bgFrom: "from-amber-950",
    bgTo: "to-slate-900",
  },
];

// ─────────────────────────────────────────────
//  Economy constants
// ─────────────────────────────────────────────

// New players start with the default 20-card deck already owned
export const DEFAULT_COLLECTION: Record<string, number> = {
  sun_3: 2,  sun_5: 2,  sun_8: 1,
  moon_3: 2, moon_5: 2, moon_8: 1,
  star_3: 2, star_5: 2, star_8: 1,
  block: 3,  rainbow: 2,
};

export const STARTING_COINS     = 500;
export const PITY_POINTS_PER_PACK = 10;
export const COINS_WIN          = 100;
export const COINS_LOSS         = 30;

export const PITY_SHOP_PRICES: Record<string, number> = {
  sun_3: 5,   moon_3: 5,   star_3: 5,
  sun_5: 15,  moon_5: 15,  star_5: 15,  block: 15,
  sun_8: 40,  moon_8: 40,  star_8: 40,  rainbow: 60,
};

// ─────────────────────────────────────────────
//  Deck validation
// ─────────────────────────────────────────────

export const DECK_RULES = {
  totalCards:      20,
  minElementCards: 12,
  maxSpecialCards: 5,
  maxRainbow:      2,
};

export interface DeckValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDeck(
  cards: Record<string, number>
): DeckValidationResult {
  const errors: string[] = [];
  const total = Object.values(cards).reduce((s, n) => s + n, 0);

  if (total !== DECK_RULES.totalCards)
    errors.push(`Must be exactly ${DECK_RULES.totalCards} cards (currently ${total}).`);

  let elementCount = 0;
  let specialCount = 0;
  let rainbowCount = 0;

  for (const [id, qty] of Object.entries(cards)) {
    if (qty <= 0) continue;
    const v = CARD_MAP[id];
    if (!v) { errors.push(`Unknown card: ${id}`); continue; }
    if (qty > v.maxPerDeck)
      errors.push(`Max ${v.maxPerDeck}× ${v.displayName} per deck.`);
    if (v.type === "element") elementCount += qty;
    if (v.type === "special") specialCount += qty;
    if (v.specialType === "RAINBOW") rainbowCount += qty;
  }

  if (elementCount < DECK_RULES.minElementCards)
    errors.push(`Need at least ${DECK_RULES.minElementCards} element cards.`);
  if (specialCount > DECK_RULES.maxSpecialCards)
    errors.push(`Max ${DECK_RULES.maxSpecialCards} special cards.`);
  if (rainbowCount > DECK_RULES.maxRainbow)
    errors.push(`Max ${DECK_RULES.maxRainbow} Rainbow cards.`);

  return { valid: errors.length === 0, errors };
}

// ─────────────────────────────────────────────
//  Pack opening
// ─────────────────────────────────────────────

export function openPack(packType: PackType): CardVariant[] {
  const results: CardVariant[] = [];

  for (let i = 0; i < packType.cardsPerPack; i++) {
    const roll = Math.random();
    let rarity: Rarity;
    if (roll < packType.rarityWeights.epic) rarity = "epic";
    else if (roll < packType.rarityWeights.epic + packType.rarityWeights.rare) rarity = "rare";
    else rarity = "common";

    const pool = ALL_CARDS.filter((c) => c.rarity === rarity);
    results.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  // Guaranteed rare: if enabled and no rare/epic was pulled, replace last card
  if (packType.guaranteedRare && results.every((c) => c.rarity === "common")) {
    const rarePool = ALL_CARDS.filter((c) => c.rarity === "rare");
    results[results.length - 1] =
      rarePool[Math.floor(Math.random() * rarePool.length)];
  }

  return results;
}
