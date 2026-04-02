// Elementals — full collectible card pool

export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
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
  common: 3, uncommon: 3, rare: 2, epic: 1, legendary: 1,
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
  s01: { effect: "If you lose, opponent skips their next draw.",           effectType: "opp_skip_draw_lose" },
  s02: { effect: "If you win, opponent discards their lowest-value card.", effectType: "complex_opp_discard_lowest" },
  s03: { effect: "On tie, opponent draws nothing next turn.",              effectType: "opp_draw_penalty_on_tie", effectParam: 99 },
  s04: { effect: "No effect.",                                             effectType: "none" },
  s05: { effect: "If you lose, draw 1 card.",                              effectType: "draw_on_lose", effectParam: 1 },
  s06: { effect: "Reveal 1 random card from opponent's hand.",             effectType: "complex_reveal_one" },
  s07: { effect: "On tie, your next card gains +1 value.",                 effectType: "value_bonus_on_tie", effectParam: 1 },
  s08: { effect: "Opponent cannot play the same card type next round.",    effectType: "opp_type_restrict", effectParam: 1 },
  s09: { effect: "If you win, opponent skips their next draw.",            effectType: "opp_skip_draw_win" },
  s10: { effect: "If you win, opponent discards 1 random card.",           effectType: "opp_discard_win", effectParam: 1 },
  s11: { effect: "Immune to removal and discard effects.",                 effectType: "immune" },
  s12: { effect: "Next round, your card gains +2 value.",                  effectType: "next_value_bonus", effectParam: 2 },
  s13: { effect: "If you win, opponent discards 2 random cards.",          effectType: "opp_discard_win", effectParam: 2 },
  s14: { effect: "Opponent cannot play special cards next round.",         effectType: "opp_no_special", effectParam: 1 },
  s15: { effect: "Both players discard their hands and redraw 3 cards.",  effectType: "complex_both_redraw" },
  s16: { effect: "If you win, destroy opponent's special card.",           effectType: "complex_destroy_special" },
  s17: { effect: "Opponent discards their hand and redraws 2 cards.",      effectType: "complex_opp_redraw" },
  s18: { effect: "If you would lose, it becomes a tie instead.",           effectType: "lose_becomes_tie" },
  s19: { effect: "Opponent must replay the same card next round.",         effectType: "complex_opp_replay_same" },
  s20: { effect: "If you win, gain +2 points instead of +1.",              effectType: "score_bonus_win", effectParam: 1 },
  s21: { effect: "Opponent cannot win next round — tie is the maximum.",   effectType: "opp_score_lock", effectParam: 1 },
  s22: { effect: "Immune to all card effects this round.",                 effectType: "immune" },
  s23: { effect: "Double your card's value this round.",                   effectType: "complex_double_value" },
  s24: { effect: "Opponent cannot play special cards for 2 rounds.",       effectType: "opp_no_special", effectParam: 2 },
  s25: { effect: "If you lose, replay the round once.",                    effectType: "complex_replay_on_lose" },
  s26: { effect: "Reset both players' hands to 3 new cards.",              effectType: "complex_both_hand_reset" },
  s27: { effect: "You win all ties for the rest of the match.",            effectType: "persistent_tie_wins" },
  s28: { effect: "If you win, opponent discards their entire hand.",       effectType: "opp_discard_all_win" },

  // ══ SCISSORS ═════════════════════════════════════════════════════════════════
  m01: { effect: "If tie, you win instead.",                               effectType: "tie_wins" },
  m02: { effect: "Opponent draws 1 less card next turn.",                  effectType: "opp_draw_penalty", effectParam: 1 },
  m03: { effect: "Draw 1 card after this round.",                          effectType: "draw_after", effectParam: 1 },
  m04: { effect: "Opponent reveals their card slightly early.",            effectType: "complex_early_reveal" },
  m05: { effect: "No effect.",                                             effectType: "none" },
  m06: { effect: "If you lose, opponent discards 1 random card.",         effectType: "opp_discard_lose", effectParam: 1 },
  m07: { effect: "Opponent's next card loses 2 value.",                    effectType: "opp_value_penalty", effectParam: 2 },
  m08: { effect: "If you win, opponent discards 1 card.",                  effectType: "opp_discard_win", effectParam: 1 },
  m09: { effect: "If you win, draw 2 cards.",                              effectType: "draw_on_win", effectParam: 2 },
  m10: { effect: "Opponent cannot play the same card type next round.",    effectType: "opp_type_restrict", effectParam: 1 },
  m11: { effect: "Ignore opponent's card effect this round.",              effectType: "immune" },
  m12: { effect: "No effect.",                                             effectType: "none" },
  m13: { effect: "+1 to your card's value; win ties instead of replaying.",effectType: "value_bonus_and_tie_wins", effectParam: 1 },
  m14: { effect: "Double your card's value this round.",                   effectType: "complex_double_value" },
  m15: { effect: "If you win, draw 1 card.",                               effectType: "draw_on_win", effectParam: 1 },
  m16: { effect: "If you win, destroy opponent's highest-value card.",     effectType: "complex_destroy_highest" },
  m17: { effect: "If you win, opponent's played card is removed from the match.", effectType: "complex_void_opp_on_win" },
  m18: { effect: "If you win, opponent skips their entire next turn.",     effectType: "complex_skip_opp_turn" },
  m19: { effect: "Opponent cannot draw any cards next turn.",              effectType: "opp_draw_penalty", effectParam: 99 },
  m20: { effect: "Opponent discards half their hand (rounded down).",      effectType: "complex_opp_discard_half" },
  m21: { effect: "Play 2 cards this round; take the better result.",       effectType: "complex_twin_fang" },
  m22: { effect: "If you win, opponent discards their entire hand.",       effectType: "opp_discard_all_win" },
  m23: { effect: "If you win, next round is automatically a tie.",         effectType: "complex_auto_tie_next" },
  m24: { effect: "This card is always treated as +8 value.",               effectType: "none" },
  m25: { effect: "If you win, opponent's played card is permanently removed.", effectType: "complex_void_opp_on_win" },
  m26: { effect: "You cannot lose this round.",                            effectType: "complex_cannot_lose" },
  m27: { effect: "If you win, gain +2 points instead of +1.",              effectType: "score_bonus_win", effectParam: 1 },
  m28: { effect: "All your cards gain +2 value for the rest of the match.", effectType: "persistent_value_bonus_perm", effectParam: 2 },

  // ══ PAPER ═════════════════════════════════════════════════════════════════════
  t01: { effect: "See opponent's card after lock-in, before reveal.",      effectType: "complex_peek" },
  t02: { effect: "Opponent draws 1 less card next turn.",                  effectType: "opp_draw_penalty", effectParam: 1 },
  t03: { effect: "Opponent's next draw comes from their discard pile.",    effectType: "complex_opp_discard_draw" },
  t04: { effect: "No effect — pure bluff.",                                effectType: "none" },
  t05: { effect: "If you lose, draw 1 card.",                              effectType: "draw_on_lose", effectParam: 1 },
  t06: { effect: "On tie, draw +1 card.",                                  effectType: "draw_on_tie", effectParam: 1 },
  t07: { effect: "On tie, both players automatically replay the same cards.", effectType: "complex_replay_tie" },
  t08: { effect: "Draw 1 card, then discard 1 card.",                      effectType: "complex_draw_discard" },
  t09: { effect: "If you lose, opponent gains no point.",                  effectType: "point_block_lose" },
  t10: { effect: "Next round, your card gains +2 value.",                  effectType: "next_value_bonus", effectParam: 2 },
  t11: { effect: "Opponent cannot see your card until reveal.",            effectType: "complex_hide" },
  t12: { effect: "Opponent cannot play the same card type next round.",    effectType: "opp_type_restrict", effectParam: 1 },
  t13: { effect: "If you win, opponent discards 1 random card.",           effectType: "opp_discard_win", effectParam: 1 },
  t14: { effect: "View opponent's full hand.",                             effectType: "complex_view_hand" },
  t15: { effect: "Win ties instead of replaying.",                         effectType: "tie_wins" },
  t16: { effect: "No effect.",                                             effectType: "none" },
  t17: { effect: "No effect.",                                             effectType: "none" },
  t18: { effect: "If you lose, opponent's played card is removed from the match.", effectType: "complex_remove_opp_on_lose" },
  t19: { effect: "Negate opponent's card effect.",                         effectType: "negate_opp" },
  t20: { effect: "For 2 rounds, your cards gain +2 value.",               effectType: "persistent_value_bonus", effectParam: 2 },
  t21: { effect: "Draw until you have 5 cards in hand (once per match).", effectType: "complex_draw_to_five" },
  t22: { effect: "If you win, gain +2 points instead of +1.",              effectType: "score_bonus_win", effectParam: 1 },
  t23: { effect: "After reveal, copy opponent's card value (not type).",   effectType: "complex_copy_value" },
  t24: { effect: "Opponent's next card has no effect.",                    effectType: "negate_opp_next" },
  t25: { effect: "You cannot lose ties for the rest of the match.",        effectType: "persistent_tie_wins" },
  t26: { effect: "Your first win this match gives +2 points.",             effectType: "first_win_bonus", effectParam: 1 },
  t27: { effect: "If you win, opponent cannot score next round.",          effectType: "opp_score_lock_win", effectParam: 1 },
  t28: { effect: "Once: replay any card from your discard pile.",          effectType: "complex_discard_replay" },

  // ══ BLOCK ════════════════════════════════════════════════════════════════════
  b01: { effect: "Cancel round — no points awarded.",                      effectType: "none" },
  b02: { effect: "Cancel round + draw 1 card.",                            effectType: "draw_after", effectParam: 1 },
  b03: { effect: "Cancel round + opponent discards 1 random card.",        effectType: "opp_discard_after", effectParam: 1 },
  b04: { effect: "Cancel round + immune to effects next round.",           effectType: "immune_next" },
  b05: { effect: "Cancel round + opponent cannot score next round.",       effectType: "opp_score_lock", effectParam: 1 },
  b06: { effect: "Cancel round + opponent skips their next draw.",         effectType: "opp_skip_draw_after" },
  b07: { effect: "Cancel round + all opponent effects are negated next round.", effectType: "negate_opp_next" },
  b08: { effect: "Cancel round + reflect opponent's card effect back at them.", effectType: "complex_reflect" },
  b09: { effect: "Cancel round + remove opponent's played card from the match.", effectType: "complex_void_opp" },
  b10: { effect: "Cancel round + gain 1 point.",                           effectType: "score_after", effectParam: 1 },

  // ══ RAINBOW ══════════════════════════════════════════════════════════════════
  r01: { effect: "Choose your element AFTER both cards are revealed.",     effectType: "complex_choose_after" },
  r02: { effect: "All your cards gain +2 this round.",                     effectType: "complex_all_plus2" },
  r03: { effect: "Choose the best outcome after both cards are revealed.", effectType: "complex_choose_outcome" },
  r04: { effect: "Opponent cannot see your card until after reveal.",      effectType: "complex_hide" },
  r05: { effect: "Choose ANY element after reveal — works against any type.", effectType: "complex_choose_any" },
  r06: { effect: "If you win, gain +2 points instead of +1.",              effectType: "score_bonus_win", effectParam: 1 },

  // ══ RESHUFFLE ════════════════════════════════════════════════════════════════
  rs01: { effect: "Reverse the winner — the loser wins instead.",           effectType: "complex_reverse_winner" },
  rs02: { effect: "Draw 2 cards immediately after reshuffling.",            effectType: "draw_after", effectParam: 2 },
  rs03: { effect: "Reset both players' hands and redraw 3 each.",          effectType: "complex_both_redraw" },
  rs04: { effect: "Replay your last played card automatically.",            effectType: "complex_replay_last" },
  rs05: { effect: "Replay this round with the same cards.",                 effectType: "complex_replay_same" },
  rs06: { effect: "Swap outcomes — your win becomes a loss and vice versa.", effectType: "complex_swap_outcomes" },

  // ══ DISCARD TRAP ═════════════════════════════════════════════════════════════
  dt01: { effect: "Void opponent's played card — removed from the match.",  effectType: "none" },
  dt02: { effect: "Void opponent's played card + cancel their effect.",     effectType: "none" },
  dt03: { effect: "Void opponent's played card + negate their next effect.", effectType: "negate_opp_next" },
  dt04: { effect: "Void opponent's played card + steal 1 card from their hand.", effectType: "complex_steal" },
  dt05: { effect: "Void opponent's played card + lock their next card (they must replay it).", effectType: "complex_lock_card" },
  dt06: { effect: "Void opponent's played card + cancel all effects this round.", effectType: "none" },

  // ══ REVIVE ═══════════════════════════════════════════════════════════════════
  rv01: { effect: "Sacrifice this round: pick 1 card back from your discard pile.", effectType: "none" },
  rv02: { effect: "Sacrifice this round: pick 1 from discard + draw 1 card.", effectType: "draw_after", effectParam: 1 },
  rv03: { effect: "If you lose, replay the round — otherwise revive as normal.", effectType: "complex_replay_on_lose" },
  rv04: { effect: "Sacrifice this round: pick any card back (including voided cards).", effectType: "none" },

  // ══ DIAMOND ══════════════════════════════════════════════════════════════════
  d01: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },
  d02: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },
  d03: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },
  d04: { effect: "Beats all element cards. Higher value wins vs other diamonds.", effectType: "none" },
  d05: { effect: "Beats all element and special cards except Block.",       effectType: "none" },
  d06: { effect: "Ignore opponent's effect and apply it to them instead.", effectType: "complex_reflect" },
};

function el(
  id: string, element: ElementKey, value: 3 | 5 | 8,
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

  // ══ ROCK — 28 cards ═════════════════════════════════════════════════════
  el("s01","ROCK",3,"common",   "Pebble",            "rock_solid",   "Small. Determined."),
  el("s02","ROCK",3,"common",   "Gravel Shard",      "rock_forge",   "Broken from something greater."),
  el("s03","ROCK",3,"common",   "Cobblestone",       "rock_ancient", "Worn smooth by a thousand boots."),
  el("s04","ROCK",3,"common",   "Flint Chip",        "rock_titan",   "Sparked fire for the first time."),
  el("s05","ROCK",3,"common",   "Rubble",            "rock_solid",   "What's left after the wall falls."),
  el("s06","ROCK",3,"common",   "River Stone",       "rock_forge",   "Patient. Polished."),
  el("s07","ROCK",3,"uncommon", "Fieldstone",        "rock_ancient", "Pulled from the earth by bare hands."),
  el("s08","ROCK",3,"uncommon", "Quarry Block",      "rock_titan",   "Cut with effort. Placed with care."),
  el("s09","ROCK",5,"uncommon", "Boulder",           "rock_solid",   "Immovable. Until it isn't."),
  el("s10","ROCK",5,"uncommon", "Obsidian Shard",    "rock_forge",   "Born in fire. Sharper than steel."),
  el("s11","ROCK",5,"uncommon", "Granite Fist",      "rock_ancient", "The mountain's preferred weapon."),
  el("s12","ROCK",5,"uncommon", "Iron Ore",          "rock_titan",   "Potential, unrefined."),
  el("s13","ROCK",5,"rare",     "Stonefist",         "rock_solid",   "The punch that ended the argument."),
  el("s14","ROCK",5,"rare",     "Basalt Column",     "rock_forge",   "Geometric. Natural. Inevitable."),
  el("s15","ROCK",5,"rare",     "Tectonic Plate",    "rock_ancient", "Slow. Unstoppable."),
  el("s16","ROCK",5,"rare",     "Warhammer Head",    "rock_titan",   "The handle broke. The head did not."),
  el("s17","ROCK",8,"rare",     "Avalanche",         "rock_solid",   "There was a mountain here."),
  el("s18","ROCK",8,"rare",     "Monolith",          "rock_forge",   "They built temples around it."),
  el("s19","ROCK",8,"rare",     "Seismic Core",      "rock_ancient", "The earth's heartbeat."),
  el("s20","ROCK",8,"epic",     "Titan's Knuckle",   "rock_titan",   "Left an impression."),
  el("s21","ROCK",8,"epic",     "Continental Shelf", "rock_solid",   "The ocean floor calls it ceiling."),
  el("s22","ROCK",8,"epic",     "Bedrock",           "rock_forge",   "You can't dig deeper than this."),
  el("s23","ROCK",8,"epic",     "Crust Fragment",    "rock_ancient", "A piece of the planet's skin."),
  el("s24","ROCK",8,"epic",     "Petrified Giant",   "rock_titan",   "It was moving once."),
  el("s25","ROCK",8,"epic",     "Obsidian Throne",   "rock_solid",   "Forged where magma meets silence."),
  el("s26","ROCK",8,"legendary","Pangaea Shard",      "rock_forge",   "From when there was only one land."),
  el("s27","ROCK",8,"legendary","The Unmoved",        "rock_ancient", "Everything else moved around it."),
  el("s28","ROCK",8,"legendary","Terra Absolute",     "rock_titan",   "The ground beneath all grounds."),

  // ══ SCISSORS — 28 cards ═════════════════════════════════════════════════
  el("m01","SCISSORS",3,"common",   "Nail Scissors",     "scissors_sharp",  "Precise. Personal."),
  el("m02","SCISSORS",3,"common",   "Tin Snip",          "scissors_blade",  "Built for the ordinary cut."),
  el("m03","SCISSORS",3,"common",   "Craft Scissors",    "scissors_swift",  "Left-handed by accident."),
  el("m04","SCISSORS",3,"common",   "Fraying Edge",      "scissors_void",   "Still cuts. Barely."),
  el("m05","SCISSORS",3,"common",   "Pinking Shear",     "scissors_sharp",  "The zigzag serves a purpose."),
  el("m06","SCISSORS",3,"common",   "Snipped Thread",    "scissors_blade",  "The loose end, dealt with."),
  el("m07","SCISSORS",3,"uncommon", "Garden Shears",     "scissors_swift",  "Trims what overreaches."),
  el("m08","SCISSORS",3,"uncommon", "Barber's Blade",    "scissors_void",   "A clean cut. No discussion."),
  el("m09","SCISSORS",5,"uncommon", "Tailor's Shears",   "scissors_sharp",  "Fabric yields without complaint."),
  el("m10","SCISSORS",5,"uncommon", "Hedge Trimmer",     "scissors_blade",  "The boundary is where you say it is."),
  el("m11","SCISSORS",5,"uncommon", "Surgical Scissors", "scissors_swift",  "Makes the incision. Then leaves."),
  el("m12","SCISSORS",5,"uncommon", "Sheet Metal Snips", "scissors_void",   "Industrial. Unforgiving."),
  el("m13","SCISSORS",5,"rare",     "Fencing Foil",      "scissors_sharp",  "Tip before the blade."),
  el("m14","SCISSORS",5,"rare",     "Shear Force",       "scissors_blade",  "Two edges meeting at one point."),
  el("m15","SCISSORS",5,"rare",     "Katana Edge",       "scissors_swift",  "The draw is half the cut."),
  el("m16","SCISSORS",5,"rare",     "Cold Chisel",       "scissors_void",   "Hammered into the gap."),
  el("m17","SCISSORS",8,"rare",     "War Scythe",        "scissors_sharp",  "Repurposed for a different harvest."),
  el("m18","SCISSORS",8,"rare",     "Guillotine Blade",  "scissors_blade",  "Clean. Final."),
  el("m19","SCISSORS",8,"rare",     "Razor Judgement",   "scissors_swift",  "No hesitation."),
  el("m20","SCISSORS",8,"epic",     "Splitting Edge",    "scissors_void",   "It divided the atom once."),
  el("m21","SCISSORS",8,"epic",     "Twin Fang",         "scissors_sharp",  "Forged as one. Used as two."),
  el("m22","SCISSORS",8,"epic",     "The Severance",     "scissors_blade",  "Some bonds are meant to break."),
  el("m23","SCISSORS",8,"epic",     "Blade of Ends",     "scissors_swift",  "Everything terminates somewhere."),
  el("m24","SCISSORS",8,"epic",     "Infinite Cut",      "scissors_void",   "Still in motion."),
  el("m25","SCISSORS",8,"epic",     "Rift Shear",        "scissors_sharp",  "Cuts through more than matter."),
  el("m26","SCISSORS",8,"legendary","Scissor Absolute",  "scissors_blade",  "The cut that cannot be undone."),
  el("m27","SCISSORS",8,"legendary","Final Snip",        "scissors_swift",  "What comes after can't come back."),
  el("m28","SCISSORS",8,"legendary","Edge Eternal",      "scissors_void",   "Still sharp. Always."),

  // ══ PAPER — 28 cards ════════════════════════════════════════════════════
  el("t01","PAPER",3,"common",   "Sticky Note",       "paper_scroll",  "Written. Forgotten. Found."),
  el("t02","PAPER",3,"common",   "Receipt",           "paper_parchment","Proof of what it cost."),
  el("t03","PAPER",3,"common",   "Newspaper",         "paper_arcane",  "The first draft of history."),
  el("t04","PAPER",3,"common",   "Blank Page",        "paper_void",    "Potential, unwritten."),
  el("t05","PAPER",3,"common",   "Folded Note",       "paper_scroll",  "Passed under the table."),
  el("t06","PAPER",3,"common",   "Paper Crane",       "paper_parchment","It took patience."),
  el("t07","PAPER",3,"uncommon", "Carbon Copy",       "paper_arcane",  "The duplicate that outlasted the original."),
  el("t08","PAPER",3,"uncommon", "Parchment Scrap",   "paper_void",    "Old enough to matter."),
  el("t09","PAPER",5,"uncommon", "Legal Brief",       "paper_scroll",  "Every word considered."),
  el("t10","PAPER",5,"uncommon", "Blueprint",         "paper_parchment","The plan behind the thing."),
  el("t11","PAPER",5,"uncommon", "Sealed Letter",     "paper_arcane",  "The contents changed everything."),
  el("t12","PAPER",5,"uncommon", "Wanted Poster",     "paper_void",    "Someone is looking for you."),
  el("t13","PAPER",5,"rare",     "Printed Manifesto", "paper_scroll",  "The words that started it."),
  el("t14","PAPER",5,"rare",     "Ancient Map",       "paper_parchment","It was right. They just couldn't read it."),
  el("t15","PAPER",5,"rare",     "Signed Decree",     "paper_arcane",  "Once sealed, no one argued."),
  el("t16","PAPER",5,"rare",     "Ink Flood",         "paper_void",    "Too many words at once."),
  el("t17","PAPER",8,"rare",     "Burning Scroll",    "paper_scroll",  "The library remembered."),
  el("t18","PAPER",8,"rare",     "Dead Sea Fragment", "paper_parchment","Two thousand years old. Still relevant."),
  el("t19","PAPER",8,"rare",     "Writ of Authority", "paper_arcane",  "Signed by someone no one questions."),
  el("t20","PAPER",8,"epic",     "Codex Eternis",     "paper_void",    "Every law. Every word. One book."),
  el("t21","PAPER",8,"epic",     "Infinite Scroll",   "paper_scroll",  "Still unrolling."),
  el("t22","PAPER",8,"epic",     "The Proclamation",  "paper_parchment","When it was read, the world changed."),
  el("t23","PAPER",8,"epic",     "Arcane Tome",       "paper_arcane",  "You can read it. You can't understand it."),
  el("t24","PAPER",8,"epic",     "Sealed Grimoire",   "paper_void",    "The seal is why it still exists."),
  el("t25","PAPER",8,"epic",     "Paper Absolute",    "paper_scroll",  "Wraps the world."),
  el("t26","PAPER",8,"legendary","First Written Word", "paper_parchment","Before this, everything was silence."),
  el("t27","PAPER",8,"legendary","The Final Draft",    "paper_arcane",  "Nothing changes after this."),
  el("t28","PAPER",8,"legendary","Word Eternal",       "paper_void",    "Written once. True forever."),

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

  // ══ RESHUFFLE — 6 cards ═════════════════════════════════════════════════
  sp("rs01","RESHUFFLE","common",   "Tide Turn",         "reshuffle_flow",  "The current shifts. So do you.",      2),
  sp("rs02","RESHUFFLE","common",   "Second Wind",       "reshuffle_flow",  "Breathe in. Start again.",             2),
  sp("rs03","RESHUFFLE","uncommon", "Cycle Break",       "reshuffle_arc",   "What was lost returns.",               2),
  sp("rs04","RESHUFFLE","uncommon", "Recurrence",        "reshuffle_arc",   "Every loop ends with a beginning.",    2),
  sp("rs05","RESHUFFLE","rare",     "Temporal Fold",     "reshuffle_arc",   "The past becomes the future.",         1),
  sp("rs06","RESHUFFLE","epic",     "Paradox Engine",    "reshuffle_arc",   "It runs on contradiction.",            1),

  // ══ DISCARD TRAP — 6 cards ══════════════════════════════════════════════
  sp("dt01","DISCARD_TRAP","common",   "Void Snare",      "trap_dark",   "It swallows what it catches.",         2),
  sp("dt02","DISCARD_TRAP","common",   "Null Trap",       "trap_dark",   "Simple. Permanent.",                   2),
  sp("dt03","DISCARD_TRAP","uncommon", "Erasure Mark",    "trap_arcane", "One touch and it's gone.",             2),
  sp("dt04","DISCARD_TRAP","uncommon", "Oblivion Hook",   "trap_arcane", "You can't pull back what it takes.",   2),
  sp("dt05","DISCARD_TRAP","rare",     "Soul Cage",       "trap_arcane", "It doesn't destroy. It keeps.",        1),
  sp("dt06","DISCARD_TRAP","epic",     "Null Edict",      "trap_dark",   "The highest authority of nothing.",    1),

  // ══ REVIVE — 4 cards ════════════════════════════════════════════════════
  sp("rv01","REVIVE","uncommon", "Echo Recall",      "revive_light", "The past answers when called.",          1),
  sp("rv02","REVIVE","rare",     "Soul Return",      "revive_light", "Death is a delay, not an end.",          1),
  sp("rv03","REVIVE","epic",     "Phoenix Memory",   "revive_light", "What burned once can burn again.",       1),
  sp("rv04","REVIVE","legendary","Eternal Recall",   "revive_light", "Nothing is ever truly gone.",            1),

  // ══ DIAMOND — 6 cards ═══════════════════════════════════════════════════
  dm("d01", 10, "rare",      "Diamond Shard",     "diamond_prismatic", "A fragment of absolute clarity."),
  dm("d02", 12, "rare",      "Crystal Core",      "diamond_prismatic", "Compressed under infinite pressure."),
  dm("d03", 14, "epic",      "Faceted Aegis",     "diamond_prismatic", "Cuts through everything it touches."),
  dm("d04", 16, "epic",      "Prism Absolute",    "diamond_prismatic", "Light enters. Truth exits."),
  dm("d05", 18, "legendary", "Eternal Diamond",   "diamond_prismatic", "Formed at the birth of the universe."),
  dm("d06", 20, "legendary", "The Apex Crystal",  "diamond_prismatic", "Harder than any element. Any law."),
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
  // Rock: 3 common, 2 uncommon, 1 rare
  s01: 3, s09: 2, s17: 1,
  // Scissors: 3 common + 1, 2 uncommon, 1 rare
  m01: 3, m02: 1, m09: 2, m17: 1,
  // Paper: 3 common, 2 uncommon, 2 rare
  t01: 3, t09: 2, t17: 2,
  // Block ×2, Reshuffle ×2, Revive ×1  (5 specials, total = 25)
  b01: 2,
  rs01: 2,
  rv01: 1,
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
