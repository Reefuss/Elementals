// Elementals — full collectible card pool

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "diamond";
export type ElementKey = "ROCK" | "PAPER" | "SCISSORS";
export type SpecialKey = "BLOCK" | "RAINBOW" | "RESHUFFLE" | "DISCARD_TRAP" | "REVIVE";

export interface CardVariant {
  id:           string;
  type:         "element" | "special" | "diamond";
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
  /** Engine dispatch key — "complex_*" = shown in UI but not yet active */
  effectType:   string;
  effectParam?: number;
  effectParam2?: number;
}

// ─────────────────────────────────────────────
//  Builder helpers
// ─────────────────────────────────────────────

const RARITY_MAX: Record<Rarity, number> = {
  common: 3, uncommon: 3, rare: 2, epic: 1, legendary: 1, diamond: 1,
};

// ── Effect table ──────────────────────────────────────────────────────────────
// effectType constants (prefixed for clarity in engine dispatch):
//   "none"                     — no effect
//   "draw_on_lose:N"           — draw N if you lose
//   "draw_on_win:N"            — draw N if you win
//   "draw_on_tie:N"            — draw N if tie
//   "draw_after:N"             — always draw N after round
//   "opp_discard_after:N"      — opponent discards N after round (regardless of outcome)
//   "opp_skip_draw_after"      — opponent skips next draw
//   "score_bonus_win:N"        — gain +N extra score if win
//   "score_after:N"            — always gain N score after round
//   "tie_wins"                 — ties become wins for you this round
//   "persistent_tie_wins"      — wins ties for rest of match
//   "lose_becomes_tie"         — losses become ties for you this round
//   "point_block_lose"         — if you lose, opponent scores 0
//   "opp_draw_penalty:N"       — opponent draws N less next round
//   "opp_discard_win:N"        — opponent discards N if you win
//   "opp_discard_lose:N"       — opponent discards N if you lose
//   "opp_discard_all_win"      — opponent discards entire hand if you win
//   "immune"                   — ignore opponent's card effect this round
//   "immune_next"              — immune to effects next round
//   "next_value_bonus:N"       — +N to your card next round
//   "persistent_value_bonus:N" — +N for 2 rounds
//   "persistent_value_bonus_perm:N" — +N permanent (rest of match)
//   "value_bonus_and_tie_wins:N" — +N value AND tie wins
//   "value_bonus_on_tie:N"     — +N next round if this round was a tie
//   "opp_value_penalty:N"      — opponent's card -N next round
//   "opp_type_restrict:N"      — opponent can't repeat same type for N rounds
//   "opp_score_lock:N"         — opponent can't score for N rounds
//   "opp_score_lock_win:N"     — opponent can't score N rounds if you win
//   "opp_no_special:N"         — opponent can't play specials for N rounds
//   "first_win_bonus:N"        — first win in match gives +N extra
//   "negate_opp"               — negate opponent's card effect this round
//   "negate_opp_next"          — negate opponent's card effect next round
//   "opp_skip_draw_win"        — opponent skips draw if you win (they lose)
//   "opp_skip_draw_lose"       — opponent skips draw if you lose (they win)
//   "opp_draw_penalty_on_tie:N"— opponent draws N less if this round ties
//   "complex_*"                — described but not yet implemented

type FxEntry = { effect: string; effectType: string; effectParam?: number; effectParam2?: number };

const CARD_EFFECTS: Record<string, FxEntry> = {
  // ══ ROCK ═════════════════════════════════════════════════════════════════════
  s01: { effect: "No effect.", effectType: "none" },
  s02: { effect: "No effect.", effectType: "none" },
  s03: { effect: "No effect.", effectType: "none" },
  s04: { effect: "No effect.", effectType: "none" },
  s05: { effect: "No effect.", effectType: "none" },

  // ══ SCISSORS ═════════════════════════════════════════════════════════════════
  m01: { effect: "No effect.", effectType: "none" },
  m02: { effect: "No effect.", effectType: "none" },
  m03: { effect: "No effect.", effectType: "none" },
  m04: { effect: "No effect.", effectType: "none" },
  m05: { effect: "No effect.", effectType: "none" },

  // ══ PAPER ═════════════════════════════════════════════════════════════════════
  t01: { effect: "No effect.", effectType: "none" },
  t02: { effect: "No effect.", effectType: "none" },
  t03: { effect: "No effect.", effectType: "none" },
  t04: { effect: "No effect.", effectType: "none" },
  t05: { effect: "No effect.", effectType: "none" },

  // ══ BLOCK ════════════════════════════════════════════════════════════════════
  b01: { effect: "Cancel round — no points awarded.", effectType: "none" },

  // ══ RAINBOW (diamonds) ═══════════════════════════════════════════════════════
  r01: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },
  r02: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },
  r03: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },
  r04: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },
  r05: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },
  r06: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },

  // ══ RESHUFFLE ════════════════════════════════════════════════════════════════
  rs01: { effect: "Sacrifice this round: shuffle your discard pile back into your deck.", effectType: "none" },

  // ══ DISCARD TRAP ═════════════════════════════════════════════════════════════
  dt01: { effect: "Void opponent's played card — removed from the match.", effectType: "none" },

  // ══ REVIVE ═══════════════════════════════════════════════════════════════════
  rv01: { effect: "Sacrifice this round: pick 1 card back from your discard pile.", effectType: "none" },

  // ══ DIAMOND ══════════════════════════════════════════════════════════════════
  d01: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },
  d02: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },
  d03: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },
  d04: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },
  d05: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },
  d06: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },
};

function el(
  id: string, element: ElementKey, value: 3 | 5 | 8 | 12 | 15,
  rarity: Rarity, displayName: string, artTheme: string, flavorText: string
): CardVariant {
  const fx = CARD_EFFECTS[id] ?? { effect: "No effect.", effectType: "none" };
  return { id, type: "element", element, value, rarity, displayName,
    artTheme, flavorText, ...fx, setId: "base", maxPerDeck: RARITY_MAX[rarity] };
}

function sp(
  id: string, specialType: SpecialKey,
  rarity: Rarity, displayName: string, artTheme: string,
  flavorText: string, maxPerDeck: number
): CardVariant {
  const fx = CARD_EFFECTS[id] ?? { effect: "No effect.", effectType: "none" };
  return { id, type: "special", specialType, rarity, displayName,
    artTheme, flavorText, ...fx, setId: "base", maxPerDeck };
}

function dm(
  id: string, value: number,
  rarity: Rarity, displayName: string, artTheme: string,
  flavorText: string
): CardVariant {
  const fx = CARD_EFFECTS[id] ?? { effect: "Beats all element cards.", effectType: "none" };
  return { id, type: "diamond", value, rarity, displayName,
    artTheme, flavorText, ...fx, setId: "base", maxPerDeck: 1 };
}

// ─────────────────────────────────────────────
//  All cards
// ─────────────────────────────────────────────

export const ALL_CARDS: CardVariant[] = [

  // ══ ROCK — 5 cards ══════════════════════════════════════════════════════
  el("s01","ROCK", 3,"common",    "Pebble",          "rock_solid",  "Small. Determined."),
  el("s02","ROCK", 5,"uncommon",  "Boulder",         "rock_solid",  "Immovable. Until it isn't."),
  el("s03","ROCK", 8,"rare",      "Stonefist",       "rock_solid",  "The punch that ended the argument."),
  el("s04","ROCK",12,"epic",      "Titan's Knuckle", "rock_titan",  "Left an impression."),
  el("s05","ROCK",15,"legendary", "Terra Absolute",  "rock_titan",  "The ground beneath all grounds."),

  // ══ SCISSORS — 5 cards ══════════════════════════════════════════════════
  el("m01","SCISSORS", 3,"common",    "Nail Scissors", "scissors_sharp", "Precise. Personal."),
  el("m02","SCISSORS", 5,"uncommon",  "Garden Shears", "scissors_swift", "Trims what overreaches."),
  el("m03","SCISSORS", 8,"rare",      "Katana Edge",   "scissors_swift", "The draw is half the cut."),
  el("m04","SCISSORS",12,"epic",      "Splitting Edge","scissors_void",  "It divided the atom once."),
  el("m05","SCISSORS",15,"legendary", "Edge Eternal",  "scissors_void",  "Still sharp. Always."),

  // ══ PAPER — 5 cards ═════════════════════════════════════════════════════
  el("t01","PAPER", 3,"common",    "Sticky Note",   "paper_scroll",    "Written. Forgotten. Found."),
  el("t02","PAPER", 5,"uncommon",  "Blueprint",     "paper_parchment", "The plan behind the thing."),
  el("t03","PAPER", 8,"rare",      "Signed Decree", "paper_arcane",    "Once sealed, no one argued."),
  el("t04","PAPER",12,"epic",      "Codex Eternis", "paper_void",      "Every law. Every word. One book."),
  el("t05","PAPER",15,"legendary", "Word Eternal",  "paper_void",      "Written once. True forever."),

  // ══ BLOCK — 1 card ══════════════════════════════════════════════════════
  sp("b01","BLOCK","uncommon", "Null Ward", "block_null", "It stops everything. Even hope.", 3),

  // ══ RAINBOW (diamonds) — 6 cards ══════���════════════════════════���════════
  dm("r01", 20, "diamond", "Spectrum Shard",    "rainbow_prismatic", "A small piece of everything."),
  dm("r02", 20, "diamond", "Chromatic Surge",   "rainbow_prismatic", "Every frequency, at once."),
  dm("r03", 20, "diamond", "Prism Gate",        "rainbow_prismatic", "Walk through, become color."),
  dm("r04", 20, "diamond", "Iris Veil",         "rainbow_prismatic", "The goddess wears the sky."),
  dm("r05", 20, "diamond", "Bifrost Bridge",    "rainbow_prismatic", "All realms, connected."),
  dm("r06", 20, "diamond", "Prismatic Genesis", "rainbow_prismatic", "The first light, split."),

  // ══ RESHUFFLE — 1 card ══════════════════════════════════════════════════
  sp("rs01","RESHUFFLE","uncommon", "Tide Turn",  "reshuffle_flow", "The current shifts. So do you.", 2),

  // ══ DISCARD TRAP — 1 card ═══════════════════════════════════════════════
  sp("dt01","DISCARD_TRAP","uncommon", "Void Snare", "trap_dark", "It swallows what it catches.", 2),

  // ══ REVIVE — 1 card ═════════════════════════════════════════════════════
  sp("rv01","REVIVE","uncommon", "Echo Recall", "revive_light", "The past answers when called.", 1),

  // ══ DIAMOND — 6 cards ═══════════════════════════════════════════════════
  dm("d01", 20, "diamond", "Diamond Shard",     "diamond_prismatic", "A fragment of absolute clarity."),
  dm("d02", 20, "diamond", "Crystal Core",      "diamond_prismatic", "Compressed under infinite pressure."),
  dm("d03", 20, "diamond", "Faceted Aegis",     "diamond_prismatic", "Cuts through everything it touches."),
  dm("d04", 20, "diamond", "Prism Absolute",    "diamond_prismatic", "Light enters. Truth exits."),
  dm("d05", 20, "diamond", "Eternal Diamond",   "diamond_prismatic", "Formed at the birth of the universe."),
  dm("d06", 20, "diamond", "The Apex Crystal",  "diamond_prismatic", "Harder than any element. Any law."),
];

export const CARD_MAP: Record<string, CardVariant> = Object.fromEntries(
  ALL_CARDS.map((c) => [c.id, c])
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
    rarityWeights: { common: 0.50, uncommon: 0.32, rare: 0.12, epic: 0.05, legendary: 0.01 },
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
    rarityWeights: { common: 0.15, uncommon: 0.35, rare: 0.32, epic: 0.15, legendary: 0.03 },
    guarantees:   [{ slot: 4, minRarity: "epic" }],
    accentColor:  "#f59e0b",
    bgFrom:       "from-amber-950",
    bgTo:         "to-slate-900",
  },
];

// ─────────────────────────────────────────────
//  Economy constants
// ─────────────────────────────────────────────

export const DEFAULT_COLLECTION: Record<string, number> = {
  // Rock: 3× common, 3× uncommon
  s01: 3, s02: 3,
  // Scissors: 3× common, 3× uncommon
  m01: 3, m02: 3,
  // Paper: 3× common, 3× uncommon
  t01: 3, t02: 3,
  // Specials
  b01: 2, rs01: 2, dt01: 1, rv01: 1,
  // (25th card: 1 random +8 element rare, granted in initialize())
};

/** The rare cards one of which is randomly granted on first init */
export const STARTER_RARES = ["s03", "m03", "t03"] as const;

export const STARTING_COINS       = 1000;
export const PITY_POINTS_PER_PACK = 10;
export const COINS_WIN            = 100;
export const COINS_LOSS           = 30;

const RARITY_PITY_PRICES: Record<Rarity, number> = {
  common: 5, uncommon: 10, rare: 20, epic: 50, legendary: 120, diamond: 300,
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
  minCards:        25,
  maxCards:        25,
  minElementCards: 9,
  maxSpecialCards: 5,
  maxRainbow:      2,
  maxBlock:        3,
  maxReshuffle:    2,
  maxDiscardTrap:  2,
  maxRevive:       1,
  maxDiamond:      1,
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
      `Deck must be ${DECK_RULES.minCards}–${DECK_RULES.maxCards} cards (currently ${total}).`
    );
  }

  let elementCount   = 0;
  let specialCount   = 0;
  let rainbowCount   = 0;
  let blockCount     = 0;
  let reshuffleCount = 0;
  let trapCount      = 0;
  let reviveCount    = 0;
  let diamondCount   = 0;

  for (const [id, qty] of Object.entries(cards)) {
    if (qty <= 0) continue;
    const v = CARD_MAP[id];
    if (!v) { errors.push(`Unknown card: ${id}`); continue; }
    if (qty > v.maxPerDeck)
      errors.push(`Max ${v.maxPerDeck}× ${v.displayName} per deck.`);

    if (v.type === "element") elementCount += qty;
    if (v.type === "diamond") diamondCount += qty;
    if (v.type === "special") {
      specialCount += qty;
      if (v.specialType === "RAINBOW")      rainbowCount   += qty;
      if (v.specialType === "BLOCK")        blockCount     += qty;
      if (v.specialType === "RESHUFFLE")    reshuffleCount += qty;
      if (v.specialType === "DISCARD_TRAP") trapCount      += qty;
      if (v.specialType === "REVIVE")       reviveCount    += qty;
    }
  }

  if (elementCount < DECK_RULES.minElementCards)
    errors.push(`Need at least ${DECK_RULES.minElementCards} element cards.`);
  if (specialCount > DECK_RULES.maxSpecialCards)
    errors.push(`Max ${DECK_RULES.maxSpecialCards} special cards total.`);
  if (rainbowCount > DECK_RULES.maxRainbow)
    errors.push(`Max ${DECK_RULES.maxRainbow} Rainbow cards.`);
  if (blockCount > DECK_RULES.maxBlock)
    errors.push(`Max ${DECK_RULES.maxBlock} Block cards.`);
  if (reshuffleCount > DECK_RULES.maxReshuffle)
    errors.push(`Max ${DECK_RULES.maxReshuffle} Reshuffle cards.`);
  if (trapCount > DECK_RULES.maxDiscardTrap)
    errors.push(`Max ${DECK_RULES.maxDiscardTrap} Discard Trap cards.`);
  if (reviveCount > DECK_RULES.maxRevive)
    errors.push(`Max ${DECK_RULES.maxRevive} Revive card.`);
  if (diamondCount > DECK_RULES.maxDiamond)
    errors.push(`Max ${DECK_RULES.maxDiamond} Diamond card.`);

  return { valid: errors.length === 0, errors };
}

// ─────────────────────────────────────────────
//  Pack opening
// ─────────────────────────────────────────────

const RARITY_ORDER: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary", "diamond"];
function rarityIndex(r: Rarity) { return RARITY_ORDER.indexOf(r); }

function rollRarity(weights: PackRarityWeights): Rarity {
  const roll = Math.random();
  if (roll < weights.legendary) return "legendary";
  if (roll < weights.legendary + weights.epic) return "epic";
  if (roll < weights.legendary + weights.epic + weights.rare) return "rare";
  if (roll < weights.legendary + weights.epic + weights.rare + weights.uncommon) return "uncommon";
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
