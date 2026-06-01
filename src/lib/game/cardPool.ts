// Elementals — full collectible card pool v2

export type Rarity = "common" | "uncommon" | "rare" | "diamond" | "epic" | "legendary";
export type ElementKey = "ROCK" | "PAPER" | "SCISSORS";
export type SpecialKey = "STALL" | "RESHUFFLE" | "DISCARD_TRAP" | "REVIVE";

export interface CardVariant {
  id:           string;
  type:         "element" | "special";
  element?:     ElementKey;
  specialType?: SpecialKey;
  value?:       number;
  rarity:       Rarity;
  displayName:  string;
  flavorText:   string;
  artTheme:     string;
  setId:        string;
  maxPerDeck:   number;
  /** Human-readable effect shown on the card */
  effect:       string;
  effectType:   string;
  effectParam?: number;
}

// ─────────────────────────────────────────────
//  Builder helpers
// ─────────────────────────────────────────────

const RARITY_MAX: Record<Rarity, number> = {
  common: 3, uncommon: 2, rare: 2, epic: 1, legendary: 1, diamond: 1,
};

function el(
  id: string, element: ElementKey, value: 3 | 5 | 8 | 12 | 15,
  rarity: Rarity, displayName: string, artTheme: string,
  flavorText: string, effect = "No effect.", effectType = "none"
): CardVariant {
  return { id, type: "element", element, value, rarity, displayName,
    artTheme, flavorText, effect, effectType, setId: "base",
    maxPerDeck: RARITY_MAX[rarity] };
}

function sp(
  id: string, specialType: SpecialKey,
  rarity: Rarity, displayName: string, artTheme: string,
  flavorText: string, effect: string
): CardVariant {
  return { id, type: "special", specialType, rarity, displayName,
    artTheme, flavorText, effect, effectType: "none", setId: "base", maxPerDeck: 1 };
}

// ─────────────────────────────────────────────
//  All cards — 66 total
// ─────────────────────────────────────────────

export const ALL_CARDS: CardVariant[] = [

  // ══ ROCK — 20 cards ══════════════════════════════════════════════════════
  // Commons ×9
  el("r01","ROCK", 3,"common",   "Pebble",          "rock_solid",  "Small. Determined."),
  el("r02","ROCK", 3,"common",   "Gravel Shard",    "rock_solid",  "Sharp edges. Humble origins."),
  el("r03","ROCK", 3,"common",   "Cobblestone",     "rock_solid",  "Worn by a thousand boots."),
  el("r04","ROCK", 3,"common",   "Flint Chip",      "rock_solid",  "Strike it. Make fire."),
  el("r05","ROCK", 3,"common",   "Rubble",          "rock_solid",  "What remains after."),
  el("r06","ROCK", 3,"common",   "River Stone",     "rock_solid",  "Smoothed by patience."),
  el("r07","ROCK", 3,"common",   "Fieldstone",      "rock_solid",  "Gathered without ceremony."),
  el("r08","ROCK", 3,"common",   "Duststone",       "rock_solid",  "Ancient. Forgotten."),
  el("r09","ROCK", 3,"common",   "Mudrock",         "rock_solid",  "The earth, compressed."),
  // Uncommons ×6
  el("r10","ROCK", 5,"uncommon", "Quarry Block",    "rock_forge",  "Cut with intent."),
  el("r11","ROCK", 5,"uncommon", "Boulder",         "rock_forge",  "Immovable. Until it isn't."),
  el("r12","ROCK", 5,"uncommon", "Obsidian Shard",  "rock_forge",  "Glass that cuts through glass."),
  el("r13","ROCK", 5,"uncommon", "Granite Fist",    "rock_forge",  "The punch that left a mark."),
  el("r14","ROCK", 5,"uncommon", "Iron Ore",        "rock_forge",  "Raw potential, unrefined."),
  el("r15","ROCK", 5,"uncommon", "Basalt Chunk",    "rock_forge",  "Born from ancient heat."),
  // Rares ×4
  el("r16","ROCK", 8,"rare",     "Stonefist",       "rock_ancient","The argument ender."),
  el("r17","ROCK", 8,"rare",     "Tectonic Plate",  "rock_ancient","It moves. Slowly. Terribly."),
  el("r18","ROCK", 8,"rare",     "Warhammer Head",  "rock_ancient","Forged for one purpose."),
  el("r19","ROCK", 8,"rare",     "Avalanche",       "rock_ancient","There is no stopping it."),
  // Diamond ×1
  el("r20","ROCK",12,"diamond",  "Terra Absolute",  "rock_titan",  "The ground beneath all grounds.",
    "Beats all non-Diamond. Loses only to Diamond Paper."),

  // ══ SCISSORS — 20 cards ══════════════════════════════════════════════════
  // Commons ×9
  el("sc01","SCISSORS", 3,"common",   "Nail Scissors",    "scissors_sharp","Precise. Personal."),
  el("sc02","SCISSORS", 3,"common",   "Tin Snip",         "scissors_sharp","It cuts what it's given."),
  el("sc03","SCISSORS", 3,"common",   "Craft Scissors",   "scissors_sharp","Made for making things."),
  el("sc04","SCISSORS", 3,"common",   "Fraying Edge",     "scissors_sharp","Still sharp enough."),
  el("sc05","SCISSORS", 3,"common",   "Pinking Shear",    "scissors_sharp","Leaves a zigzag memory."),
  el("sc06","SCISSORS", 3,"common",   "Snipped Thread",   "scissors_sharp","The story, cut short."),
  el("sc07","SCISSORS", 3,"common",   "Cutting Blade",    "scissors_sharp","One purpose. Fulfilled."),
  el("sc08","SCISSORS", 3,"common",   "Serrated Tip",     "scissors_sharp","Catches what smooth misses."),
  el("sc09","SCISSORS", 3,"common",   "Rusted Shear",     "scissors_sharp","Neglected. Not harmless."),
  // Uncommons ×6
  el("sc10","SCISSORS", 5,"uncommon", "Garden Shears",    "scissors_blade","Trims what overreaches."),
  el("sc11","SCISSORS", 5,"uncommon", "Barber's Blade",   "scissors_blade","Clean lines. No mercy."),
  el("sc12","SCISSORS", 5,"uncommon", "Tailor's Shears",  "scissors_blade","Cuts to fit."),
  el("sc13","SCISSORS", 5,"uncommon", "Surgical Scissors","scissors_blade","Steady hand required."),
  el("sc14","SCISSORS", 5,"uncommon", "Sheet Metal Snips","scissors_blade","Through steel, not paper."),
  el("sc15","SCISSORS", 5,"uncommon", "Hedge Trimmer",    "scissors_blade","Order from chaos."),
  // Rares ×4
  el("sc16","SCISSORS", 8,"rare",     "Katana Edge",      "scissors_swift","The draw is half the cut."),
  el("sc17","SCISSORS", 8,"rare",     "War Scythe",       "scissors_swift","Harvests more than grain."),
  el("sc18","SCISSORS", 8,"rare",     "Guillotine Blade", "scissors_swift","Swift. Final."),
  el("sc19","SCISSORS", 8,"rare",     "Razor Judgement",  "scissors_swift","It has decided."),
  // Diamond ×1
  el("sc20","SCISSORS",12,"diamond",  "Edge Eternal",     "scissors_void", "Still sharp. Always.",
    "Beats all non-Diamond. Loses only to Diamond Rock."),

  // ══ PAPER — 20 cards ════════════════════════════════════════════════════
  // Commons ×9
  el("p01","PAPER", 3,"common",   "Sticky Note",    "paper_scroll",  "Written. Forgotten. Found."),
  el("p02","PAPER", 3,"common",   "Receipt",        "paper_scroll",  "Proof it happened."),
  el("p03","PAPER", 3,"common",   "Newspaper",      "paper_scroll",  "Today's truth. Tomorrow's lining."),
  el("p04","PAPER", 3,"common",   "Blank Page",     "paper_scroll",  "Everything begins here."),
  el("p05","PAPER", 3,"common",   "Folded Note",    "paper_scroll",  "Passed in secret."),
  el("p06","PAPER", 3,"common",   "Paper Crane",    "paper_scroll",  "Folded with hope."),
  el("p07","PAPER", 3,"common",   "Scrap Sheet",    "paper_scroll",  "Torn from something larger."),
  el("p08","PAPER", 3,"common",   "Torn Receipt",   "paper_scroll",  "Half a record."),
  el("p09","PAPER", 3,"common",   "Crumpled Leaf",  "paper_scroll",  "Discarded. Reconsidered."),
  // Uncommons ×6
  el("p10","PAPER", 5,"uncommon", "Parchment Scrap","paper_parchment","Older than it looks."),
  el("p11","PAPER", 5,"uncommon", "Legal Brief",    "paper_parchment","Arguments, bound."),
  el("p12","PAPER", 5,"uncommon", "Blueprint",      "paper_parchment","The plan behind the thing."),
  el("p13","PAPER", 5,"uncommon", "Sealed Letter",  "paper_parchment","Not meant for you."),
  el("p14","PAPER", 5,"uncommon", "Wanted Poster",  "paper_parchment","Someone's in trouble."),
  el("p15","PAPER", 5,"uncommon", "Carbon Copy",    "paper_parchment","An exact reproduction."),
  // Rares ×4
  el("p16","PAPER", 8,"rare",     "Ancient Map",    "paper_arcane",  "It leads somewhere true."),
  el("p17","PAPER", 8,"rare",     "Burning Scroll", "paper_arcane",  "Read it before it's gone."),
  el("p18","PAPER", 8,"rare",     "Writ of Authority","paper_arcane","Once sealed, none argued."),
  el("p19","PAPER", 8,"rare",     "Signed Decree",  "paper_arcane",  "Law made manifest."),
  // Diamond ×1
  el("p20","PAPER",12,"diamond",  "Word Eternal",   "paper_void",    "Written once. True forever.",
    "Beats all non-Diamond. Loses only to Diamond Scissors."),

  // ══ SPECIAL — 6 cards ════════════════════════════════════════════════════
  sp("st01","STALL",        "uncommon","Dead Weight",   "stall_void",
     "The weight that goes nowhere.", "Round ends in tie. Both cards return to hand. Both draw 1."),
  sp("st02","STALL",        "uncommon","Null Tide",     "stall_null",
     "A wave that cancels itself.",   "Round ends in tie. Both cards return to hand. Both draw 1."),
  sp("rs01","RESHUFFLE",    "uncommon","Second Wind",   "reshuffle_flow",
     "The current shifts. So do you.","Both players shuffle hand into deck and redraw 3."),
  sp("rs02","RESHUFFLE",    "uncommon","Cycle Break",   "reshuffle_cycle",
     "Reset. Begin again.",           "Both players shuffle hand into deck and redraw 3."),
  sp("dt01","DISCARD_TRAP", "rare",    "Void Snare",    "trap_dark",
     "It swallows what it catches.",  "Resolves first. Opponent's played card is permanently removed from the match."),
  sp("rv01","REVIVE",       "rare",    "Echo Recall",   "revive_light",
     "The past answers when called.", "You lose this round. Choose any card from your discard pile and return it to hand."),

];

export const CARD_MAP: Record<string, CardVariant> = Object.fromEntries(
  ALL_CARDS.map((c) => [c.id, c])
);

/** Set of diamond-rarity card IDs — used by the rules engine for fast lookup */
export const DIAMOND_CARD_IDS = new Set(
  ALL_CARDS.filter((c) => c.rarity === "diamond").map((c) => c.id)
);

// ─────────────────────────────────────────────
//  Pack system
// ─────────────────────────────────────────────

export interface PackRarityWeights {
  common:    number;
  uncommon:  number;
  rare:      number;
  epic:      number;
  legendary: number;
  diamond:   number;
}

export interface PackSlotGuarantee {
  slot:       number;
  minRarity:  Rarity;
}

export interface PackType {
  id:           string;
  name:         string;
  tagline:      string;
  cost:         number;
  cardsPerPack: number;
  rarityWeights: PackRarityWeights;
  guarantees:   PackSlotGuarantee[];
  accentColor:  string;
  bgFrom:       string;
  bgTo:         string;
}

export const PACK_TYPES: PackType[] = [
  {
    id:           "cosmos",
    name:         "Cosmos Pack",
    tagline:      "Drawn from the celestial archives",
    cost:         500,
    cardsPerPack: 5,
    rarityWeights: { common: 0.55, uncommon: 0.30, rare: 0.12, epic: 0, legendary: 0, diamond: 0.03 },
    guarantees:   [{ slot: 4, minRarity: "rare" }],
    accentColor:  "#818cf8",
    bgFrom:       "from-indigo-950",
    bgTo:         "to-slate-900",
  },
  {
    id:           "eclipse",
    name:         "Eclipse Pack",
    tagline:      "Forged in the celestial eclipse",
    cost:         1200,
    cardsPerPack: 5,
    rarityWeights: { common: 0.10, uncommon: 0.28, rare: 0.42, epic: 0, legendary: 0, diamond: 0.20 },
    guarantees:   [{ slot: 4, minRarity: "rare" }],
    accentColor:  "#f59e0b",
    bgFrom:       "from-amber-950",
    bgTo:         "to-slate-900",
  },
];

// ─────────────────────────────────────────────
//  Economy constants
// ─────────────────────────────────────────────

export const DEFAULT_COLLECTION: Record<string, number> = {
  // Rock commons ×3 each
  r01: 3, r02: 3, r03: 3,
  // Scissors commons ×3 each
  sc01: 3, sc02: 3, sc03: 3,
  // Paper commons ×3 each
  p01: 3, p02: 3, p03: 3,
  // One of each special type
  st01: 1, rs01: 1, dt01: 1, rv01: 1,
};

export const STARTING_COINS       = 1000;
export const PITY_POINTS_PER_PACK = 10;
export const COINS_WIN            = 100;
export const COINS_LOSS           = 30;

const RARITY_ORDER: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "diamond"];
function rarityIndex(r: Rarity) { return RARITY_ORDER.indexOf(r); }

const RARITY_PITY_PRICES: Record<Rarity, number> = {
  common: 5, uncommon: 10, rare: 20, epic: 50, legendary: 120, diamond: 200,
};

export function getPityPrice(card: CardVariant): number {
  return RARITY_PITY_PRICES[card.rarity];
}

export const PITY_SHOP_PRICES: Record<string, number> = Object.fromEntries(
  ALL_CARDS.map((c) => [c.id, getPityPrice(c)])
);

// ─────────────────────────────────────────────
//  Deck validation
// ─────────────────────────────────────────────

export const DECK_RULES = {
  minCards:             25,
  maxCards:             25,
  minElementCards:      9,
  maxSpecialCards:      5,
  maxSingleSpecialType: 2,
};

export interface DeckValidationResult {
  valid:  boolean;
  errors: string[];
}

export function validateDeck(cards: Record<string, number>): DeckValidationResult {
  const errors: string[] = [];
  const total = Object.values(cards).reduce((s, n) => s + n, 0);

  if (total < DECK_RULES.minCards || total > DECK_RULES.maxCards) {
    errors.push(
      `Deck must be exactly ${DECK_RULES.minCards} cards (currently ${total}).`
    );
  }

  let elementCount = 0;
  let specialCount = 0;
  const specialTypeCounts: Record<string, number> = {};

  for (const [id, qty] of Object.entries(cards)) {
    if (qty <= 0) continue;
    const v = CARD_MAP[id];
    if (!v) { errors.push(`Unknown card: ${id}`); continue; }
    if (qty > v.maxPerDeck)
      errors.push(`Max ${v.maxPerDeck}× ${v.displayName} per deck.`);

    if (v.type === "element") elementCount += qty;
    if (v.type === "special") {
      specialCount += qty;
      const st = v.specialType!;
      specialTypeCounts[st] = (specialTypeCounts[st] ?? 0) + qty;
    }
  }

  if (elementCount < DECK_RULES.minElementCards)
    errors.push(`Need at least ${DECK_RULES.minElementCards} element cards.`);
  if (specialCount > DECK_RULES.maxSpecialCards)
    errors.push(`Max ${DECK_RULES.maxSpecialCards} special cards total.`);
  for (const [type, count] of Object.entries(specialTypeCounts)) {
    if (count > DECK_RULES.maxSingleSpecialType)
      errors.push(`Max ${DECK_RULES.maxSingleSpecialType} ${type.toLowerCase().replace("_", " ")} cards.`);
  }

  return { valid: errors.length === 0, errors };
}

// ─────────────────────────────────────────────
//  Pack opening
// ─────────────────────────────────────────────

function rollRarity(weights: PackRarityWeights): Rarity {
  const roll = Math.random();
  let cum = 0;
  cum += weights.diamond;    if (roll < cum) return "diamond";
  cum += weights.legendary;  if (roll < cum) return "legendary";
  cum += weights.epic;       if (roll < cum) return "epic";
  cum += weights.rare;       if (roll < cum) return "rare";
  cum += weights.uncommon;   if (roll < cum) return "uncommon";
  return "common";
}

function pickFromRarity(rarity: Rarity, minRarity?: Rarity): CardVariant {
  const isBelowMin = minRarity && rarityIndex(rarity) < rarityIndex(minRarity);
  const pool = isBelowMin
    ? ALL_CARDS.filter((c) => rarityIndex(c.rarity) >= rarityIndex(minRarity!))
    : ALL_CARDS.filter((c) => c.rarity === rarity);
  if (pool.length === 0) return ALL_CARDS[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function openPack(packType: PackType): CardVariant[] {
  const results: CardVariant[] = [];
  for (let slot = 0; slot < packType.cardsPerPack; slot++) {
    const guarantee = packType.guarantees.find((g) => g.slot === slot);
    const rarity    = rollRarity(packType.rarityWeights);
    results.push(pickFromRarity(rarity, guarantee?.minRarity));
  }
  return results;
}

// ─────────────────────────────────────────────
//  Duplicate pity conversion
// ─────────────────────────────────────────────

export function calcDuplicatePity(
  cards: CardVariant[],
  owned: Record<string, number>
): number {
  let bonus = 0;
  const tempOwned = { ...owned };
  for (const card of cards) {
    const current = tempOwned[card.id] ?? 0;
    if (current >= card.maxPerDeck) {
      bonus += Math.floor(getPityPrice(card) * 0.5);
    } else {
      tempOwned[card.id] = current + 1;
    }
  }
  return bonus;
}
