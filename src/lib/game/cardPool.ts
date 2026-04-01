// Elementals — full 100-card collectible pool

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type ElementKey = "SUN" | "MOON" | "STAR";

export interface CardVariant {
  id:           string;
  type:         "element" | "special";
  element?:     ElementKey;
  specialType?: "BLOCK" | "RAINBOW";
  value?:       3 | 5 | 8;
  rarity:       Rarity;
  displayName:  string;
  flavorText:   string;
  artTheme:     string;
  setId:        string;
  maxPerDeck:   number;
}

// ─────────────────────────────────────────────
//  Builder helpers
// ─────────────────────────────────────────────

const RARITY_MAX: Record<Rarity, number> = {
  common: 3, uncommon: 3, rare: 2, epic: 1, legendary: 1,
};

function el(
  id: string, element: ElementKey, value: 3 | 5 | 8,
  rarity: Rarity, displayName: string, artTheme: string, flavorText: string
): CardVariant {
  return { id, type: "element", element, value, rarity, displayName,
    artTheme, flavorText, setId: "base", maxPerDeck: RARITY_MAX[rarity] };
}

function sp(
  id: string, specialType: "BLOCK" | "RAINBOW",
  rarity: Rarity, displayName: string, artTheme: string,
  flavorText: string, maxPerDeck: number
): CardVariant {
  return { id, type: "special", specialType, rarity, displayName,
    artTheme, flavorText, setId: "base", maxPerDeck };
}

// ─────────────────────────────────────────────
//  All 100 cards
// ─────────────────────────────────────────────

export const ALL_CARDS: CardVariant[] = [

  // ══ SUN — 28 cards ══════════════════════════════════════════════════════
  el("s01","SUN",3,"common",   "Sunstone Shard",    "sol_radiant",      "A fragment of crystallized dawn."),
  el("s02","SUN",3,"common",   "Dawn Spark",        "sol_blazing",      "The first light. Still warm."),
  el("s03","SUN",3,"common",   "Ember Wisp",        "sol_ancient",      "Small, but persistent."),
  el("s04","SUN",3,"common",   "Solar Fleck",       "sol_celestial",    "One particle of a billion."),
  el("s05","SUN",3,"common",   "Hearthfire",        "sol_radiant",      "Ancient warmth, remembered."),
  el("s06","SUN",3,"common",   "Goldleaf",          "sol_blazing",      "Autumn's last gift."),
  el("s07","SUN",3,"uncommon", "Torch Spirit",      "sol_ancient",      "It chooses who it lights."),
  el("s08","SUN",3,"uncommon", "Dusk Ember",        "sol_celestial",    "The sun's final breath."),
  el("s09","SUN",5,"uncommon", "Sunbeam",           "sol_radiant",      "Direct. Unyielding."),
  el("s10","SUN",5,"uncommon", "Solar Wind",        "sol_blazing",      "200 miles per second."),
  el("s11","SUN",5,"uncommon", "Firebird Feather",  "sol_ancient",      "It still burns."),
  el("s12","SUN",5,"uncommon", "Brass Idol",        "sol_celestial",    "They prayed to it for centuries."),
  el("s13","SUN",5,"rare",     "Solstice",          "sol_radiant",      "The longest moment of the year."),
  el("s14","SUN",5,"rare",     "Phoenix Ascent",    "sol_blazing",      "Ash is just patience."),
  el("s15","SUN",5,"rare",     "Helios Chariot",    "sol_ancient",      "The sky shook when he rode."),
  el("s16","SUN",5,"rare",     "Radiant Lance",     "sol_celestial",    "Light, made violent."),
  el("s17","SUN",8,"rare",     "Solar Drake",       "sol_radiant",      "A dragon born inside a star."),
  el("s18","SUN",8,"rare",     "Ra's Eye",          "sol_blazing",      "It sees everything."),
  el("s19","SUN",8,"rare",     "Suncore",           "sol_ancient",      "15 million degrees at rest."),
  el("s20","SUN",8,"epic",     "Amaterasu",         "sol_celestial",    "When she hid, the world went dark."),
  el("s21","SUN",8,"epic",     "Celestial Furnace", "sol_radiant",      "Where new suns are forged."),
  el("s22","SUN",8,"epic",     "Grand Solaris",     "sol_blazing",      "Its orbits take centuries."),
  el("s23","SUN",8,"epic",     "Ignition Throne",   "sol_ancient",      "Vacant since the first age."),
  el("s24","SUN",8,"epic",     "The Eternal Noon",  "sol_celestial",    "No shadows. No mercy."),
  el("s25","SUN",8,"epic",     "Nova Sovereign",    "sol_radiant",      "Commands the death of stars."),
  el("s26","SUN",8,"legendary","Sunfire Axiom",     "sol_blazing",      "The equation that started everything."),
  el("s27","SUN",8,"legendary","First Light",       "sol_ancient",      "Before the sun had a name."),
  el("s28","SUN",8,"legendary","Sol Invictus",      "sol_celestial",    "The unconquered sun."),

  // ══ MOON — 28 cards ═════════════════════════════════════════════════════
  el("m01","MOON",3,"common",   "Moonpetal",         "luna_tidal",       "White as new snow."),
  el("m02","MOON",3,"common",   "Tidedrop",          "luna_dream",       "The ocean, in miniature."),
  el("m03","MOON",3,"common",   "Silver Mist",       "luna_mythic",      "It moves without wind."),
  el("m04","MOON",3,"common",   "Night Dew",         "luna_spectral",    "Cold and honest."),
  el("m05","MOON",3,"common",   "Pale Wisp",         "luna_tidal",       "Lost, but still lit."),
  el("m06","MOON",3,"common",   "Crescent Sliver",   "luna_dream",       "Even a sliver is enough."),
  el("m07","MOON",3,"uncommon", "Lunar Echo",        "luna_mythic",      "Sound, reflected from the moon."),
  el("m08","MOON",3,"uncommon", "Selene's Tear",     "luna_spectral",    "She cried when Endymion slept."),
  el("m09","MOON",5,"uncommon", "Moonbeam",          "luna_tidal",       "Silence you can almost touch."),
  el("m10","MOON",5,"uncommon", "Tidal Pull",        "luna_dream",       "The sea obeys."),
  el("m11","MOON",5,"uncommon", "Silver Owl",        "luna_mythic",      "Watches from above. Always."),
  el("m12","MOON",5,"uncommon", "Dream Veil",        "luna_spectral",    "Sleep, or something like it."),
  el("m13","MOON",5,"rare",     "Waning Ritual",     "luna_tidal",       "Performed at every moonset."),
  el("m14","MOON",5,"rare",     "Moonwolf",          "luna_dream",       "Howls at what it cannot reach."),
  el("m15","MOON",5,"rare",     "Artemis' Arrow",    "luna_mythic",      "Never misses."),
  el("m16","MOON",5,"rare",     "Lune Specter",      "luna_spectral",    "She died on a full moon."),
  el("m17","MOON",8,"rare",     "Abyssal Tide",      "luna_tidal",       "The deep answers the moon's call."),
  el("m18","MOON",8,"rare",     "Luna Shrine",       "luna_dream",       "Still active after 4,000 years."),
  el("m19","MOON",8,"rare",     "Selene's Crown",    "luna_mythic",      "She placed it in the sky herself."),
  el("m20","MOON",8,"epic",     "Tsukuyomi",         "luna_spectral",    "God of night. Rival to the sun."),
  el("m21","MOON",8,"epic",     "Silver Leviathan",  "luna_tidal",       "It surfaces during full moons."),
  el("m22","MOON",8,"epic",     "The Pale Watch",    "luna_dream",       "Never looks away."),
  el("m23","MOON",8,"epic",     "Umbral Court",      "luna_mythic",      "Convenes only in darkness."),
  el("m24","MOON",8,"epic",     "Lunar Recursion",   "luna_spectral",    "A moon reflected in itself."),
  el("m25","MOON",8,"epic",     "Tidal God",         "luna_tidal",       "The sea is its body."),
  el("m26","MOON",8,"legendary","Moon Axiom",        "luna_dream",       "Gravity, made visible."),
  el("m27","MOON",8,"legendary","Last Night",        "luna_mythic",      "The dark before the dawn. Final."),
  el("m28","MOON",8,"legendary","Luna Absoluta",     "luna_spectral",    "Everything consumed by pale light."),

  // ══ STAR — 28 cards ═════════════════════════════════════════════════════
  el("t01","STAR",3,"common",   "Stardust",          "star_cosmic",      "The building blocks of everything."),
  el("t02","STAR",3,"common",   "Comet Chip",        "star_void",        "Cold and fast."),
  el("t03","STAR",3,"common",   "Void Spark",        "star_nova",        "Static at the edge of nothing."),
  el("t04","STAR",3,"common",   "Astral Fleck",      "star_constellation","One point among billions."),
  el("t05","STAR",3,"common",   "Shooting Wish",     "star_cosmic",      "Make one before it fades."),
  el("t06","STAR",3,"common",   "Nebula Whisper",    "star_void",        "Color that takes millennia to form."),
  el("t07","STAR",3,"uncommon", "Pulsar Beat",       "star_nova",        "288 rotations per second."),
  el("t08","STAR",3,"uncommon", "Binary Glint",      "star_constellation","They'll orbit each other forever."),
  el("t09","STAR",5,"uncommon", "Starfall",          "star_cosmic",      "They fall every night. We just don't look."),
  el("t10","STAR",5,"uncommon", "Quasar Jet",        "star_void",        "Brighter than a trillion suns."),
  el("t11","STAR",5,"uncommon", "Celestial Shard",   "star_nova",        "A constellation, broken."),
  el("t12","STAR",5,"uncommon", "Orion's Belt",      "star_constellation","Hunters knew them first."),
  el("t13","STAR",5,"rare",     "Meteor Surge",      "star_cosmic",      "The atmosphere turns them to fire."),
  el("t14","STAR",5,"rare",     "Constellation Blade","star_void",       "Only visible from the right angle."),
  el("t15","STAR",5,"rare",     "Nova Bloom",        "star_nova",        "A death that outshines a galaxy."),
  el("t16","STAR",5,"rare",     "Astral Hound",      "star_constellation","It follows star maps home."),
  el("t17","STAR",8,"rare",     "Void Rift",         "star_cosmic",      "Reality has edges."),
  el("t18","STAR",8,"rare",     "Gemini Clash",      "star_void",        "Even twins fight."),
  el("t19","STAR",8,"rare",     "Supernova Shell",   "star_nova",        "Expanding at 10% the speed of light."),
  el("t20","STAR",8,"epic",     "Sirius Prime",      "star_constellation","25 times more luminous than our sun."),
  el("t21","STAR",8,"epic",     "Star Wyrm",         "star_cosmic",      "Swims through dark matter."),
  el("t22","STAR",8,"epic",     "The Architect",     "star_void",        "Every star, planned."),
  el("t23","STAR",8,"epic",     "Quantum Bloom",     "star_nova",        "All positions simultaneously."),
  el("t24","STAR",8,"epic",     "Astral Fracture",   "star_constellation","The sky split at the seams."),
  el("t25","STAR",8,"epic",     "Zenith Omen",       "star_cosmic",      "One star directly above. Watching."),
  el("t26","STAR",8,"legendary","Star Axiom",        "star_void",        "The formula for light itself."),
  el("t27","STAR",8,"legendary","Event Horizon",     "star_nova",        "Light can't leave. Neither can you."),
  el("t28","STAR",8,"legendary","Stellar Absolute",  "star_constellation","All stars. One point. Infinite."),

  // ══ BLOCK — 10 cards ════════════════════════════════════════════════════
  sp("b01","BLOCK","common",    "Null Ward",         "block_null",       "It stops everything. Even hope.",      3),
  sp("b02","BLOCK","common",    "Stone Veil",        "block_stone",      "Ancient defense. Still holds.",        3),
  sp("b03","BLOCK","uncommon",  "Void Plate",        "block_null",       "It absorbs. Never reflects.",          2),
  sp("b04","BLOCK","uncommon",  "Aegis Fragment",    "block_stone",      "Even pieces of a myth are powerful.",  2),
  sp("b05","BLOCK","rare",      "Null Tide",         "block_null",       "Cancels all waves.",                   2),
  sp("b06","BLOCK","rare",      "Absolute Zero",     "block_stone",      "Nothing moves at this temperature.",   2),
  sp("b07","BLOCK","epic",      "The Silence",       "block_null",       "More powerful than any sound.",        1),
  sp("b08","BLOCK","epic",      "Nemesis Mirror",    "block_stone",      "Reflects only failure.",               1),
  sp("b09","BLOCK","epic",      "Oblivion Wall",     "block_null",       "No one has seen the other side.",      1),
  sp("b10","BLOCK","legendary", "Eschaton Guard",    "block_stone",      "The last shield at the end of time.",  1),

  // ══ RAINBOW — 6 cards ═══════════════════════════════════════════════════
  sp("r01","RAINBOW","rare",      "Spectrum Shard",    "rainbow_prismatic","A small piece of everything.",         2),
  sp("r02","RAINBOW","rare",      "Chromatic Surge",   "rainbow_prismatic","Every frequency, at once.",            2),
  sp("r03","RAINBOW","epic",      "Prism Gate",        "rainbow_prismatic","Walk through, become color.",          1),
  sp("r04","RAINBOW","epic",      "Iris Veil",         "rainbow_prismatic","The goddess wears the sky.",           1),
  sp("r05","RAINBOW","legendary", "Bifrost Bridge",    "rainbow_prismatic","All realms, connected.",               1),
  sp("r06","RAINBOW","legendary", "Prismatic Genesis", "rainbow_prismatic","The first light, split.",              1),
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
  slot:       number; // 0-indexed
  minRarity:  Rarity;
}

export interface PackType {
  id:           string;
  name:         string;
  tagline:      string;
  cost:         number;
  cardsPerPack: number;
  /** Default weights used for most slots */
  rarityWeights: PackRarityWeights;
  /** Per-slot guarantees: if rolled rarity is below minRarity, reroll from minRarity+ pool */
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

/** New players start with a full 20-card playable deck already owned */
export const DEFAULT_COLLECTION: Record<string, number> = {
  s01: 2, s09: 2, s17: 1,   // Sun +3, +5, +8
  m01: 2, m09: 2, m17: 1,   // Moon +3, +5, +8
  t01: 2, t09: 2, t17: 1,   // Star +3, +5, +8
  b01: 3,                    // Block ×3
  r01: 2,                    // Rainbow ×2
};

export const STARTING_COINS       = 500;
export const PITY_POINTS_PER_PACK = 10;
export const COINS_WIN            = 100;
export const COINS_LOSS           = 30;

const RARITY_PITY_PRICES: Record<Rarity, number> = {
  common: 5, uncommon: 10, rare: 20, epic: 50, legendary: 120,
};

export function getPityPrice(card: CardVariant): number {
  return RARITY_PITY_PRICES[card.rarity];
}

/** Flat lookup for any consumers that want a quick price by id */
export const PITY_SHOP_PRICES: Record<string, number> = Object.fromEntries(
  ALL_CARDS.map((c) => [c.id, getPityPrice(c)])
);

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
  valid:  boolean;
  errors: string[];
}

export function validateDeck(cards: Record<string, number>): DeckValidationResult {
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
    if (v.type === "element")         elementCount += qty;
    if (v.type === "special")         specialCount += qty;
    if (v.specialType === "RAINBOW")  rainbowCount += qty;
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

const RARITY_ORDER: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
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

/**
 * Returns bonus pity points earned from duplicate cards in this pull.
 * Duplicates beyond maxPerDeck earn 50% of the card's pity price.
 */
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
