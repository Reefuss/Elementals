import {
  ActiveEffect,
  Card,
  CardType,
  ClientGameState,
  Element,
  GamePhase,
  MatchResult,
  OpponentView,
  RoundOutcome,
  RoundResult,
  SelfView,
  ServerGame,
  ServerPlayer,
  SpecialType,
  WinReason,
} from "../src/lib/game/types";
import { CARD_MAP } from "../src/lib/game/cardPool";
import {
  DRAW_PER_ROUND,
  INITIAL_HAND_SIZE,
  RESHUFFLE_HAND_SIZE,
  TURN_DURATION_MS,
} from "../src/lib/game/constants";
import { buildDeckFromCards, drawCards, shuffle } from "../src/lib/game/deck";
import {
  areBothOutOfCards,
  hasWon,
  isValidPlay,
  resolveCards,
  resolveRainbowTiebreak,
} from "../src/lib/game/rules";

type StateCallback    = (roomId: string) => void;
type GameOverCallback = (roomId: string, result: MatchResult) => void;
type AutoPlayCallback = (roomId: string, playerId: string, cardId: string) => void;

interface InternalGame extends ServerGame {
  cardCache:       Map<string, Card>;
  reconnectTimers: Map<string, ReturnType<typeof setTimeout>>;
  /** Stored match result when game ends — so getClientState can always include it */
  finalResult:     MatchResult | null;
}

export class GameManager {
  private games = new Map<string, InternalGame>();

  onStateSync: StateCallback    = () => {};
  onGameOver:  GameOverCallback = () => {};
  onAutoPlay:  AutoPlayCallback = () => {};

  // ───────────────────────────────────────────────────────────
  //  Game lifecycle
  // ───────────────────────────────────────────────────────────

  createGame(
    p1: { id: string; username: string; socketId: string; deckCards?: Record<string, number> },
    p2: { id: string; username: string; socketId: string; deckCards?: Record<string, number> },
    roomId: string
  ): InternalGame {
    const makePlayer = (info: typeof p1): ServerPlayer => ({
      id:            info.id,
      username:      info.username,
      socketId:      info.socketId,
      deck:          buildDeckFromCards(info.deckCards ?? {}),
      hand:          [],
      discard:       [],
      voided:        [],
      score:         0,
      connected:     true,
      drawModifier:  0,
      firstWinUsed:  false,
    });

    const game: InternalGame = {
      roomId,
      phase:           GamePhase.WAITING,
      round:           0,
      players:         [makePlayer(p1), makePlayer(p2)],
      plays:           new Map(),
      results:         [],
      activeEffects:   [],
      turnStartedAt:   null,
      turnTimer:       null,
      rainbowTiebreak: null,
      revivePick:      null,
      cardCache:       new Map(),
      reconnectTimers: new Map(),
      finalResult:     null,
    };

    this.games.set(roomId, game);
    this.startRound(game);
    return game;
  }

  private startRound(game: InternalGame): void {
    game.round++;
    game.plays.clear();
    game.cardCache.clear();
    game.rainbowTiebreak = null;
    game.revivePick      = null;

    const baseDrawCount = game.round === 1 ? INITIAL_HAND_SIZE : DRAW_PER_ROUND;
    for (const player of game.players) {
      const actualDraw = Math.max(0, baseDrawCount + player.drawModifier);
      player.drawModifier = 0;
      const drawn = drawCards(player.deck, actualDraw);
      player.hand.push(...drawn);
    }

    // Tick down persistent active effects
    game.activeEffects = game.activeEffects
      .map((e) => e.roundsRemaining === -1 ? e : { ...e, roundsRemaining: e.roundsRemaining - 1 })
      .filter((e) => e.roundsRemaining !== 0);

    const [p1, p2] = game.players;
    if (areBothOutOfCards(p1.hand, p1.deck, p2.hand, p2.deck)) {
      this.endGame(game, null, "both_out_of_cards");
      return;
    }

    game.phase         = GamePhase.PLAYING;
    game.turnStartedAt = Date.now();
    this.scheduleTurnTimer(game);
    this.onStateSync(game.roomId);
  }

  private scheduleTurnTimer(game: InternalGame): void {
    if (game.turnTimer) clearTimeout(game.turnTimer);
    game.turnTimer = setTimeout(() => {
      this.handleTurnTimeout(game.roomId);
    }, TURN_DURATION_MS);
  }

  private handleTurnTimeout(roomId: string): void {
    const game = this.games.get(roomId);
    if (!game || game.phase !== GamePhase.PLAYING) return;
    for (const player of game.players) {
      if (!game.plays.has(player.id) && player.hand.length > 0) {
        const card = player.hand[Math.floor(Math.random() * player.hand.length)];
        this.onAutoPlay(roomId, player.id, card.id);
      }
    }
  }

  // ───────────────────────────────────────────────────────────
  //  Card play
  // ───────────────────────────────────────────────────────────

  processPlay(
    roomId: string,
    playerId: string,
    cardId: string
  ): { error?: string } {
    const game = this.games.get(roomId);
    if (!game)                             return { error: "Game not found." };
    if (game.phase !== GamePhase.PLAYING)  return { error: "Not the playing phase." };
    if (game.plays.has(playerId))          return { error: "Already played this round." };

    const player = game.players.find((p) => p.id === playerId);
    if (!player)                           return { error: "Player not in this game." };
    if (!isValidPlay(cardId, player.hand)) return { error: "Card not in hand." };

    const card = player.hand.find((c) => c.id === cardId)!;

    // Enforce opp_no_special restriction
    const noSpecialEffect = game.activeEffects.find(
      (e) => e.type === "opp_no_special" && e.forPlayerId !== playerId
    );
    if (noSpecialEffect && card.type === CardType.SPECIAL) {
      return { error: "You cannot play special cards this round." };
    }

    // Enforce opp_type_restrict restriction
    const typeRestrictEffect = game.activeEffects.find(
      (e) => e.type === "opp_type_restrict" && e.forPlayerId !== playerId && e.restrictType
    );
    if (typeRestrictEffect?.restrictType) {
      const lastResult = game.results[game.results.length - 1];
      const myLastCard = lastResult
        ? (game.players[0].id === playerId ? lastResult.playerOneCard : lastResult.playerTwoCard)
        : null;
      if (myLastCard && card.type === myLastCard.type) {
        const sameElement = card.type === CardType.ELEMENT && myLastCard.type === CardType.ELEMENT &&
          card.element === myLastCard.element;
        if (sameElement) return { error: "You cannot play the same element type this round." };
      }
    }

    game.cardCache.set(cardId, card);
    player.hand = player.hand.filter((c) => c.id !== cardId);
    game.plays.set(playerId, cardId);

    this.onStateSync(game.roomId);

    if (game.plays.size === 2) {
      this.resolveRound(game);
    }

    return {};
  }

  private resolveRound(game: InternalGame): void {
    if (game.turnTimer) { clearTimeout(game.turnTimer); game.turnTimer = null; }

    const [p1, p2] = game.players;
    const p1Card   = game.cardCache.get(game.plays.get(p1.id)!)!;
    const p2Card   = game.cardCache.get(game.plays.get(p2.id)!)!;

    // ── Look up card effect variants ──────────────────────────
    const p1Variant = p1Card.variantId ? CARD_MAP[p1Card.variantId] : null;
    const p2Variant = p2Card.variantId ? CARD_MAP[p2Card.variantId] : null;

    // ── Negation / immunity checks ────────────────────────────
    // negate_opp from current card: each player can negate the other
    const p1NegatesP2 = p1Variant?.effectType === "negate_opp" ||
      game.activeEffects.some((e) => (e.type === "negate_opp" || e.type === "negate_opp_next") && e.forPlayerId === p1.id);
    const p2NegatesP1 = p2Variant?.effectType === "negate_opp" ||
      game.activeEffects.some((e) => (e.type === "negate_opp" || e.type === "negate_opp_next") && e.forPlayerId === p2.id);

    // immune: player ignores effects applied to them by opponent
    const p1Immune = p1Variant?.effectType === "immune" ||
      game.activeEffects.some((e) => (e.type === "immune" || e.type === "immune_next") && e.forPlayerId === p1.id);
    const p2Immune = p2Variant?.effectType === "immune" ||
      game.activeEffects.some((e) => (e.type === "immune" || e.type === "immune_next") && e.forPlayerId === p2.id);

    // p1's effect is active unless p2 negates it
    const p1EffActive = !p2NegatesP1;
    const p2EffActive = !p1NegatesP2;

    // ── Value bonuses from active effects (applied before resolveCards) ──
    function applyValueBonus(card: Card, bonus: number): Card {
      if (bonus === 0) return card;
      if (card.type === CardType.ELEMENT)
        return { ...card, value: Math.max(1, card.value + bonus) } as Card;
      if (card.type === CardType.DIAMOND)
        return { ...card, value: Math.max(1, card.value + bonus) } as Card;
      return card;
    }

    const p1ValueBonus = game.activeEffects
      .filter((e) => ["next_value_bonus","persistent_value_bonus","persistent_value_bonus_perm"].includes(e.type) && e.forPlayerId === p1.id)
      .reduce((s, e) => s + (e.value ?? 0), 0);
    const p2ValueBonus = game.activeEffects
      .filter((e) => ["next_value_bonus","persistent_value_bonus","persistent_value_bonus_perm"].includes(e.type) && e.forPlayerId === p2.id)
      .reduce((s, e) => s + (e.value ?? 0), 0);
    const p1ValuePenalty = p2Immune ? 0 : game.activeEffects
      .filter((e) => e.type === "opp_value_penalty" && e.forPlayerId === p2.id)
      .reduce((s, e) => s + (e.value ?? 0), 0);
    const p2ValuePenalty = p1Immune ? 0 : game.activeEffects
      .filter((e) => e.type === "opp_value_penalty" && e.forPlayerId === p1.id)
      .reduce((s, e) => s + (e.value ?? 0), 0);

    // value_bonus_and_tie_wins also contributes value bonus
    const p1ValueBonusAndTie = (p1EffActive && p1Variant?.effectType === "value_bonus_and_tie_wins") ? (p1Variant.effectParam ?? 0) : 0;
    const p2ValueBonusAndTie = (p2EffActive && p2Variant?.effectType === "value_bonus_and_tie_wins") ? (p2Variant.effectParam ?? 0) : 0;

    const p1CardEff = applyValueBonus(p1Card, p1ValueBonus + p1ValueBonusAndTie - p1ValuePenalty);
    const p2CardEff = applyValueBonus(p2Card, p2ValueBonus + p2ValueBonusAndTie - p2ValuePenalty);

    const resolution = resolveCards(p1CardEff, p2CardEff);

    // ── Outcome modifications (tie_wins, lose_becomes_tie) ────
    let effectiveWinnerIndex = resolution.winnerIndex;
    let effectiveOutcome     = resolution.outcome;
    let effectiveReason      = resolution.reason;

    if (effectiveWinnerIndex === null && !resolution.needsTiebreak) {
      // Tie: check tie_wins
      const p1TieWins = (p1EffActive && (p1Variant?.effectType === "tie_wins" || p1Variant?.effectType === "value_bonus_and_tie_wins")) ||
        game.activeEffects.some((e) => e.type === "persistent_tie_wins" && e.forPlayerId === p1.id);
      const p2TieWins = (p2EffActive && (p2Variant?.effectType === "tie_wins" || p2Variant?.effectType === "value_bonus_and_tie_wins")) ||
        game.activeEffects.some((e) => e.type === "persistent_tie_wins" && e.forPlayerId === p2.id);
      if (p1TieWins && !p2TieWins) {
        effectiveWinnerIndex = 0;
        effectiveOutcome     = RoundOutcome.PLAYER_ONE_WINS;
        effectiveReason      = WinReason.CARD_EFFECT_TIE_WIN;
      } else if (p2TieWins && !p1TieWins) {
        effectiveWinnerIndex = 1;
        effectiveOutcome     = RoundOutcome.PLAYER_TWO_WINS;
        effectiveReason      = WinReason.CARD_EFFECT_TIE_WIN;
      }
    } else if (effectiveWinnerIndex === 1 && !p2Immune && p1EffActive && p1Variant?.effectType === "lose_becomes_tie") {
      // p1 lost but has lose_becomes_tie
      effectiveWinnerIndex = null;
      effectiveOutcome     = RoundOutcome.TIE;
      effectiveReason      = WinReason.CARD_EFFECT_TIE_WIN;
    } else if (effectiveWinnerIndex === 0 && !p1Immune && p2EffActive && p2Variant?.effectType === "lose_becomes_tie") {
      effectiveWinnerIndex = null;
      effectiveOutcome     = RoundOutcome.TIE;
      effectiveReason      = WinReason.CARD_EFFECT_TIE_WIN;
    }

    // ── Special pre-result side effects ──────────────────────

    // Discard Trap: void the loser's card, trap card goes to trap player's discard
    if (resolution.voidedIndex !== undefined) {
      const voidedPlayer = game.players[resolution.voidedIndex];
      const trapPlayer   = game.players[resolution.voidedIndex === 0 ? 1 : 0];
      const voidedCard   = game.cardCache.get(game.plays.get(voidedPlayer.id)!)!;
      const trapCard     = game.cardCache.get(game.plays.get(trapPlayer.id)!)!;
      voidedPlayer.voided.push(voidedCard);
      trapPlayer.discard.push(trapCard);
    }

    // Reshuffle: return remaining hand to deck and draw RESHUFFLE_HAND_SIZE
    const isReshuffleRound =
      resolution.reason === WinReason.RESHUFFLE ||
      resolution.reason === WinReason.RESHUFFLE_MUTUAL;
    if (isReshuffleRound) {
      for (const player of game.players) {
        const playedCard = game.cardCache.get(game.plays.get(player.id)!);
        if (!playedCard) continue;
        const isReshuffle =
          playedCard.type === "SPECIAL" &&
          (playedCard as { specialType: string }).specialType === SpecialType.RESHUFFLE;
        if (isReshuffle) {
          // Shuffle remaining hand back into deck, then draw 3
          player.deck  = shuffle([...player.deck, ...player.hand]);
          player.hand  = [];
          player.hand  = drawCards(player.deck, RESHUFFLE_HAND_SIZE);
          player.discard.push(playedCard);
        }
      }
    }

    // Handle rainbow tiebreak
    if (resolution.needsTiebreak) {
      game.phase           = GamePhase.RAINBOW_TIEBREAK;
      game.rainbowTiebreak = { attempt: 1, choices: new Map() };
      this.onStateSync(game.roomId);
      return;
    }

    // ── Score the round ───────────────────────────────────────
    let winnerId: string | null = null;

    // Helper to discard N random cards from a player's hand
    const discardRandom = (player: ServerPlayer, n: number) => {
      const count = Math.min(n, player.hand.length);
      for (let i = 0; i < count; i++) {
        const idx  = Math.floor(Math.random() * player.hand.length);
        const card = player.hand.splice(idx, 1)[0];
        player.discard.push(card);
      }
    };

    if (effectiveWinnerIndex === 0) {
      const scoreLocked = game.activeEffects.some((e) => e.type === "opp_score_lock" && e.forPlayerId === p2.id);
      if (!scoreLocked) {
        p1.score++;
        if (p1EffActive && p1Variant?.effectType === "score_bonus_win")
          p1.score += (p1Variant.effectParam ?? 1);
        if (p1EffActive && p1Variant?.effectType === "first_win_bonus" && !p1.firstWinUsed) {
          p1.score += (p1Variant.effectParam ?? 1);
          p1.firstWinUsed = true;
        }
      }
      winnerId = p1.id;
      // opp_discard_win
      if (!p2Immune && p1EffActive && p1Variant?.effectType === "opp_discard_win")
        discardRandom(p2, p1Variant.effectParam ?? 1);
      if (!p2Immune && p1EffActive && p1Variant?.effectType === "opp_discard_all_win")
        discardRandom(p2, p2.hand.length);
      // opp_skip_draw_win → penalize opponent's next draw fully
      if (!p2Immune && p1EffActive && p1Variant?.effectType === "opp_skip_draw_win")
        p2.drawModifier -= 99;
      // opp_score_lock_win
      if (!p2Immune && p1EffActive && p1Variant?.effectType === "opp_score_lock_win") {
        game.activeEffects.push({ type: "opp_score_lock", forPlayerId: p1.id, roundsRemaining: p1Variant.effectParam ?? 1 });
      }
    } else if (effectiveWinnerIndex === 1) {
      // point_block_lose: if p1 has this and lost, p2 doesn't score
      const pointBlocked = !p1Immune && p1EffActive && p1Variant?.effectType === "point_block_lose";
      const scoreLocked  = game.activeEffects.some((e) => e.type === "opp_score_lock" && e.forPlayerId === p1.id);
      if (!pointBlocked && !scoreLocked) {
        p2.score++;
        if (p2EffActive && p2Variant?.effectType === "score_bonus_win")
          p2.score += (p2Variant.effectParam ?? 1);
        if (p2EffActive && p2Variant?.effectType === "first_win_bonus" && !p2.firstWinUsed) {
          p2.score += (p2Variant.effectParam ?? 1);
          p2.firstWinUsed = true;
        }
      }
      winnerId = p2.id;
      if (!p1Immune && p2EffActive && p2Variant?.effectType === "opp_discard_win")
        discardRandom(p1, p2Variant.effectParam ?? 1);
      if (!p1Immune && p2EffActive && p2Variant?.effectType === "opp_discard_all_win")
        discardRandom(p1, p1.hand.length);
      if (!p1Immune && p2EffActive && p2Variant?.effectType === "opp_skip_draw_win")
        p1.drawModifier -= 99;
      if (!p1Immune && p2EffActive && p2Variant?.effectType === "opp_score_lock_win") {
        game.activeEffects.push({ type: "opp_score_lock", forPlayerId: p2.id, roundsRemaining: p2Variant.effectParam ?? 1 });
      }
    }

    // ── score_after: always gain N (regardless of outcome) ───
    if (p1EffActive && p1Variant?.effectType === "score_after")
      p1.score += (p1Variant.effectParam ?? 1);
    if (p2EffActive && p2Variant?.effectType === "score_after")
      p2.score += (p2Variant.effectParam ?? 1);

    // ── Draw effects ──────────────────────────────────────────
    const isTieRound = effectiveWinnerIndex === null;
    const p1Won      = effectiveWinnerIndex === 0;
    const p2Won      = effectiveWinnerIndex === 1;

    // p1 draw bonuses
    if (p1EffActive) {
      if (p1Variant?.effectType === "draw_after")
        p1.drawModifier += (p1Variant.effectParam ?? 1);
      if (p1Variant?.effectType === "draw_on_win" && p1Won)
        p1.drawModifier += (p1Variant.effectParam ?? 1);
      if (p1Variant?.effectType === "draw_on_lose" && p2Won)
        p1.drawModifier += (p1Variant.effectParam ?? 1);
      if (p1Variant?.effectType === "draw_on_tie" && isTieRound)
        p1.drawModifier += (p1Variant.effectParam ?? 1);
    }
    // p2 draw bonuses
    if (p2EffActive) {
      if (p2Variant?.effectType === "draw_after")
        p2.drawModifier += (p2Variant.effectParam ?? 1);
      if (p2Variant?.effectType === "draw_on_win" && p2Won)
        p2.drawModifier += (p2Variant.effectParam ?? 1);
      if (p2Variant?.effectType === "draw_on_lose" && p1Won)
        p2.drawModifier += (p2Variant.effectParam ?? 1);
      if (p2Variant?.effectType === "draw_on_tie" && isTieRound)
        p2.drawModifier += (p2Variant.effectParam ?? 1);
    }
    // opp draw penalties from p1's card
    if (!p2Immune && p1EffActive) {
      if (p1Variant?.effectType === "opp_draw_penalty")
        p2.drawModifier -= (p1Variant.effectParam ?? 1);
      if (p1Variant?.effectType === "opp_skip_draw_after")
        p2.drawModifier -= 99;
      if (p1Variant?.effectType === "opp_skip_draw_lose" && p2Won)
        p2.drawModifier -= 99;
      if (p1Variant?.effectType === "opp_draw_penalty_on_tie" && isTieRound)
        p2.drawModifier -= (p1Variant.effectParam ?? 1);
      if (p1Variant?.effectType === "opp_discard_lose" && p2Won)
        discardRandom(p2, p1Variant.effectParam ?? 1);
      if (p1Variant?.effectType === "opp_discard_after")
        discardRandom(p2, p1Variant.effectParam ?? 1);
    }
    // opp draw penalties from p2's card
    if (!p1Immune && p2EffActive) {
      if (p2Variant?.effectType === "opp_draw_penalty")
        p1.drawModifier -= (p2Variant.effectParam ?? 1);
      if (p2Variant?.effectType === "opp_skip_draw_after")
        p1.drawModifier -= 99;
      if (p2Variant?.effectType === "opp_skip_draw_lose" && p1Won)
        p1.drawModifier -= 99;
      if (p2Variant?.effectType === "opp_draw_penalty_on_tie" && isTieRound)
        p1.drawModifier -= (p2Variant.effectParam ?? 1);
      if (p2Variant?.effectType === "opp_discard_lose" && p1Won)
        discardRandom(p1, p2Variant.effectParam ?? 1);
      if (p2Variant?.effectType === "opp_discard_after")
        discardRandom(p1, p2Variant.effectParam ?? 1);
    }

    // ── Queue persistent active effects ───────────────────────
    const pushEffect = (e: ActiveEffect) => game.activeEffects.push(e);

    if (p1EffActive && p1Variant) {
      switch (p1Variant.effectType) {
        case "persistent_tie_wins":
          if (!game.activeEffects.some((e) => e.type === "persistent_tie_wins" && e.forPlayerId === p1.id))
            pushEffect({ type: "persistent_tie_wins", forPlayerId: p1.id, roundsRemaining: -1 });
          break;
        case "next_value_bonus":
          pushEffect({ type: "next_value_bonus", forPlayerId: p1.id, roundsRemaining: 1, value: p1Variant.effectParam ?? 1 });
          break;
        case "persistent_value_bonus":
          pushEffect({ type: "persistent_value_bonus", forPlayerId: p1.id, roundsRemaining: 2, value: p1Variant.effectParam ?? 1 });
          break;
        case "persistent_value_bonus_perm":
          pushEffect({ type: "persistent_value_bonus_perm", forPlayerId: p1.id, roundsRemaining: -1, value: p1Variant.effectParam ?? 1 });
          break;
        case "value_bonus_on_tie":
          if (isTieRound)
            pushEffect({ type: "next_value_bonus", forPlayerId: p1.id, roundsRemaining: 1, value: p1Variant.effectParam ?? 1 });
          break;
        case "opp_value_penalty":
          if (!p2Immune)
            pushEffect({ type: "opp_value_penalty", forPlayerId: p1.id, roundsRemaining: 1, value: p1Variant.effectParam ?? 1 });
          break;
        case "opp_score_lock":
          if (!p2Immune)
            pushEffect({ type: "opp_score_lock", forPlayerId: p2.id, roundsRemaining: p1Variant.effectParam ?? 1 });
          break;
        case "opp_no_special":
          if (!p2Immune)
            pushEffect({ type: "opp_no_special", forPlayerId: p1.id, roundsRemaining: p1Variant.effectParam ?? 1 });
          break;
        case "opp_type_restrict":
          if (!p2Immune)
            pushEffect({ type: "opp_type_restrict", forPlayerId: p1.id, roundsRemaining: p1Variant.effectParam ?? 1, restrictType: "same" });
          break;
        case "negate_opp_next":
          pushEffect({ type: "negate_opp_next", forPlayerId: p1.id, roundsRemaining: 1 });
          break;
        case "immune_next":
          pushEffect({ type: "immune_next", forPlayerId: p1.id, roundsRemaining: 1 });
          break;
      }
    }
    if (p2EffActive && p2Variant) {
      switch (p2Variant.effectType) {
        case "persistent_tie_wins":
          if (!game.activeEffects.some((e) => e.type === "persistent_tie_wins" && e.forPlayerId === p2.id))
            pushEffect({ type: "persistent_tie_wins", forPlayerId: p2.id, roundsRemaining: -1 });
          break;
        case "next_value_bonus":
          pushEffect({ type: "next_value_bonus", forPlayerId: p2.id, roundsRemaining: 1, value: p2Variant.effectParam ?? 1 });
          break;
        case "persistent_value_bonus":
          pushEffect({ type: "persistent_value_bonus", forPlayerId: p2.id, roundsRemaining: 2, value: p2Variant.effectParam ?? 1 });
          break;
        case "persistent_value_bonus_perm":
          pushEffect({ type: "persistent_value_bonus_perm", forPlayerId: p2.id, roundsRemaining: -1, value: p2Variant.effectParam ?? 1 });
          break;
        case "value_bonus_on_tie":
          if (isTieRound)
            pushEffect({ type: "next_value_bonus", forPlayerId: p2.id, roundsRemaining: 1, value: p2Variant.effectParam ?? 1 });
          break;
        case "opp_value_penalty":
          if (!p1Immune)
            pushEffect({ type: "opp_value_penalty", forPlayerId: p2.id, roundsRemaining: 1, value: p2Variant.effectParam ?? 1 });
          break;
        case "opp_score_lock":
          if (!p1Immune)
            pushEffect({ type: "opp_score_lock", forPlayerId: p1.id, roundsRemaining: p2Variant.effectParam ?? 1 });
          break;
        case "opp_no_special":
          if (!p1Immune)
            pushEffect({ type: "opp_no_special", forPlayerId: p2.id, roundsRemaining: p2Variant.effectParam ?? 1 });
          break;
        case "opp_type_restrict":
          if (!p1Immune)
            pushEffect({ type: "opp_type_restrict", forPlayerId: p2.id, roundsRemaining: p2Variant.effectParam ?? 1, restrictType: "same" });
          break;
        case "negate_opp_next":
          pushEffect({ type: "negate_opp_next", forPlayerId: p2.id, roundsRemaining: 1 });
          break;
        case "immune_next":
          pushEffect({ type: "immune_next", forPlayerId: p2.id, roundsRemaining: 1 });
          break;
      }
    }

    const voidedCardOf =
      resolution.voidedIndex !== undefined
        ? game.players[resolution.voidedIndex].id
        : undefined;

    const result: RoundResult = {
      roundNumber:   game.round,
      playerOneCard: p1Card,
      playerTwoCard: p2Card,
      outcome:       effectiveOutcome,
      reason:        effectiveReason,
      winnerId,
      scoreAfter:    { [p1.id]: p1.score, [p2.id]: p2.score },
      voidedCardOf,
    };

    game.results.push(result);

    // Discard played cards — skip if already handled by trap or reshuffle side effects
    if (resolution.voidedIndex === undefined && !isReshuffleRound) {
      p1.discard.push(p1Card);
      p2.discard.push(p2Card);
    }

    // Handle Revive pick phase
    if (resolution.needsRevivePick && resolution.revivePickFor.length > 0) {
      const waitingFor = new Set(
        resolution.revivePickFor.map((idx) => game.players[idx].id)
      );
      // Only allow pick if the player actually has cards in discard
      const actualWaiters = new Set<string>();
      for (const pId of waitingFor) {
        const p = game.players.find((pl) => pl.id === pId)!;
        if (p.discard.length > 0) actualWaiters.add(pId);
      }

      if (actualWaiters.size > 0) {
        game.revivePick = { waitingFor: actualWaiters, picked: new Map() };
        game.phase      = GamePhase.REVIVE_PICK;
        this.onStateSync(game.roomId);
        return;
      }
    }

    game.phase = GamePhase.REVEALING;
    this.onStateSync(game.roomId);
    setTimeout(() => this.afterReveal(game), 4000);
  }

  // ───────────────────────────────────────────────────────────
  //  Revive pick
  // ───────────────────────────────────────────────────────────

  processRevivePick(
    roomId: string,
    playerId: string,
    cardId: string
  ): { error?: string } {
    const game = this.games.get(roomId);
    if (!game)                              return { error: "Game not found." };
    if (game.phase !== GamePhase.REVIVE_PICK) return { error: "Not in revive pick phase." };
    if (!game.revivePick)                   return { error: "No revive pick active." };
    if (!game.revivePick.waitingFor.has(playerId)) return { error: "Not waiting for your pick." };
    if (game.revivePick.picked.has(playerId))      return { error: "Already picked." };

    const player = game.players.find((p) => p.id === playerId);
    if (!player)  return { error: "Player not found." };

    const cardInDiscard = player.discard.find((c) => c.id === cardId);
    if (!cardInDiscard) return { error: "Card not in discard pile." };

    // Move card from discard to top of deck (drawn at start of next round)
    player.discard = player.discard.filter((c) => c.id !== cardId);
    player.deck.push(cardInDiscard);
    game.revivePick.picked.set(playerId, cardId);

    // Check if all required players have picked
    const allPicked = [...game.revivePick.waitingFor].every((pid) =>
      game.revivePick!.picked.has(pid)
    );

    if (allPicked) {
      game.revivePick = null;
      game.phase      = GamePhase.REVEALING;
      this.onStateSync(game.roomId);
      setTimeout(() => this.afterReveal(game), 4000);
    } else {
      this.onStateSync(game.roomId);
    }

    return {};
  }

  // ───────────────────────────────────────────────────────────
  //  After reveal
  // ───────────────────────────────────────────────────────────

  private afterReveal(game: InternalGame): void {
    if (!this.games.has(game.roomId)) return;

    const [p1, p2] = game.players;
    if (hasWon(p1.score)) { this.endGame(game, p1.id, "score"); return; }
    if (hasWon(p2.score)) { this.endGame(game, p2.id, "score"); return; }
    if (areBothOutOfCards(p1.hand, p1.deck, p2.hand, p2.deck)) {
      this.endGame(game, null, "both_out_of_cards");
      return;
    }

    this.startRound(game);
  }

  // ───────────────────────────────────────────────────────────
  //  Rainbow tiebreak
  // ───────────────────────────────────────────────────────────

  processRainbowChoice(
    roomId: string,
    playerId: string,
    element: Element
  ): { error?: string } {
    const game = this.games.get(roomId);
    if (!game)                                     return { error: "Game not found." };
    if (game.phase !== GamePhase.RAINBOW_TIEBREAK) return { error: "Not in tiebreak." };
    if (!game.rainbowTiebreak)                     return { error: "No tiebreak active." };
    if (game.rainbowTiebreak.choices.has(playerId)) return { error: "Already chose." };

    game.rainbowTiebreak.choices.set(playerId, element);
    this.onStateSync(game.roomId);

    if (game.rainbowTiebreak.choices.size === 2) {
      this.concludeRainbowTiebreak(game);
    }

    return {};
  }

  private concludeRainbowTiebreak(game: InternalGame): void {
    const tb      = game.rainbowTiebreak!;
    const [p1, p2] = game.players;
    const c1       = tb.choices.get(p1.id)!;
    const c2       = tb.choices.get(p2.id)!;
    const res      = resolveRainbowTiebreak(c1, c2);

    if (res.winnerIndex === null) {
      tb.attempt++;
      tb.choices.clear();
      this.onStateSync(game.roomId);
      return;
    }

    const winner = game.players[res.winnerIndex];
    winner.score++;

    const p1Card = game.cardCache.get(game.plays.get(p1.id)!)!;
    const p2Card = game.cardCache.get(game.plays.get(p2.id)!)!;

    p1.discard.push(p1Card);
    p2.discard.push(p2Card);

    const result: RoundResult = {
      roundNumber:   game.round,
      playerOneCard: p1Card,
      playerTwoCard: p2Card,
      outcome:
        res.winnerIndex === 0 ? RoundOutcome.PLAYER_ONE_WINS : RoundOutcome.PLAYER_TWO_WINS,
      reason:      WinReason.RAINBOW_TIEBREAK,
      winnerId:    winner.id,
      scoreAfter:  { [p1.id]: p1.score, [p2.id]: p2.score },
    };

    game.results.push(result);
    game.rainbowTiebreak = null;
    game.phase           = GamePhase.REVEALING;
    this.onStateSync(game.roomId);

    setTimeout(() => this.afterReveal(game), 4000);
  }

  // ───────────────────────────────────────────────────────────
  //  Game over
  // ───────────────────────────────────────────────────────────

  endGame(
    game: InternalGame,
    winnerId: string | null,
    reason: MatchResult["reason"]
  ): void {
    if (game.turnTimer) { clearTimeout(game.turnTimer); game.turnTimer = null; }
    const [p1, p2] = game.players;

    const matchResult: MatchResult = {
      winnerId,
      reason,
      finalScores: { [p1.id]: p1.score, [p2.id]: p2.score },
      rounds:      game.results,
    };

    game.finalResult = matchResult;
    game.phase       = GamePhase.GAME_OVER;
    this.onStateSync(game.roomId);
    this.onGameOver(game.roomId, matchResult);
  }

  // ───────────────────────────────────────────────────────────
  //  Forfeit
  // ───────────────────────────────────────────────────────────

  forfeitGame(roomId: string, forfeitingPlayerId: string): boolean {
    const game = this.games.get(roomId);
    if (!game) return false;
    if (game.phase === GamePhase.GAME_OVER) return false;
    const opp = game.players.find((p) => p.id !== forfeitingPlayerId);
    if (!opp) return false;
    this.endGame(game, opp.id, "forfeit");
    return true;
  }

  // ───────────────────────────────────────────────────────────
  //  Disconnect / reconnect
  // ───────────────────────────────────────────────────────────

  handleDisconnect(roomId: string, playerId: string): void {
    const game = this.games.get(roomId);
    if (!game) return;
    const player = game.players.find((p) => p.id === playerId);
    if (player) { player.connected = false; }
    this.onStateSync(game.roomId);
  }

  handleReconnect(roomId: string, playerId: string, newSocketId: string): boolean {
    const game = this.games.get(roomId);
    if (!game) return false;
    const player = game.players.find((p) => p.id === playerId);
    if (!player) return false;
    player.socketId  = newSocketId;
    player.connected = true;
    this.onStateSync(game.roomId);
    return true;
  }

  // ───────────────────────────────────────────────────────────
  //  Client state projection
  // ───────────────────────────────────────────────────────────

  getClientState(roomId: string, playerId: string): ClientGameState | null {
    const game = this.games.get(roomId);
    if (!game) return null;

    const selfIdx = game.players.findIndex((p) => p.id === playerId);
    if (selfIdx === -1) return null;

    const self = game.players[selfIdx];
    const opp  = game.players[selfIdx === 0 ? 1 : 0];

    const selfView: SelfView = {
      id:           self.id,
      username:     self.username,
      score:        self.score,
      hand:         self.hand,
      deckCount:    self.deck.length,
      discardPile:  self.discard,
      hasPlayed:    game.plays.has(self.id),
      activeEffects: game.activeEffects
        .filter((e) => e.forPlayerId === self.id)
        .map(({ type, roundsRemaining, value }) => ({ type, roundsRemaining, value })),
    };

    const oppView: OpponentView = {
      id:           opp.id,
      username:     opp.username,
      score:        opp.score,
      handCount:    opp.hand.length,
      deckCount:    opp.deck.length,
      discardCount: opp.discard.length,
      hasPlayed:    game.plays.has(opp.id),
      connected:    opp.connected,
    };

    let rainbowTiebreak: ClientGameState["rainbowTiebreak"] = null;
    if (game.rainbowTiebreak) {
      const myChoice  = game.rainbowTiebreak.choices.get(playerId) ?? null;
      const oppChose  = game.rainbowTiebreak.choices.has(opp.id);
      rainbowTiebreak = {
        attempt:      game.rainbowTiebreak.attempt,
        myChoice,
        waitingForOp: myChoice !== null && !oppChose,
      };
    }

    let revivePick: ClientGameState["revivePick"] = null;
    if (game.revivePick && game.phase === GamePhase.REVIVE_PICK) {
      const needsPick    = game.revivePick.waitingFor.has(playerId) &&
                           !game.revivePick.picked.has(playerId);
      const waitingForOp = game.revivePick.waitingFor.has(opp.id) &&
                           !game.revivePick.picked.has(opp.id);
      revivePick = { needsPick, waitingForOp };
    }

    return {
      roomId:          game.roomId,
      phase:           game.phase,
      round:           game.round,
      self:            selfView,
      opponent:        oppView,
      turnStartedAt:   game.turnStartedAt,
      selfIsPlayerOne: selfIdx === 0,
      lastResult:      game.results[game.results.length - 1] ?? null,
      matchResult:     game.finalResult,
      rainbowTiebreak,
      revivePick,
    };
  }

  getPlayerRoom(playerId: string): string | null {
    for (const [roomId, game] of this.games) {
      if (game.players.some((p) => p.id === playerId)) return roomId;
    }
    return null;
  }

  getGame(roomId: string): InternalGame | undefined {
    return this.games.get(roomId);
  }

  destroyGame(roomId: string): void {
    const game = this.games.get(roomId);
    if (game?.turnTimer) clearTimeout(game.turnTimer);
    for (const t of game?.reconnectTimers.values() ?? []) clearTimeout(t);
    this.games.delete(roomId);
  }
}
