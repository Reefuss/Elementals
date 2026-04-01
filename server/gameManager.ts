import {
  Card,
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
      id:        info.id,
      username:  info.username,
      socketId:  info.socketId,
      deck:      buildDeckFromCards(info.deckCards ?? {}),
      hand:      [],
      discard:   [],
      voided:    [],
      score:     0,
      connected: true,
    });

    const game: InternalGame = {
      roomId,
      phase:           GamePhase.WAITING,
      round:           0,
      players:         [makePlayer(p1), makePlayer(p2)],
      plays:           new Map(),
      results:         [],
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

    const drawCount = game.round === 1 ? INITIAL_HAND_SIZE : DRAW_PER_ROUND;
    for (const player of game.players) {
      const drawn = drawCards(player.deck, drawCount);
      player.hand.push(...drawn);
    }

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

    const resolution = resolveCards(p1Card, p2Card);

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

    // Score the round
    let winnerId: string | null = null;
    if (resolution.winnerIndex === 0) { p1.score++; winnerId = p1.id; }
    if (resolution.winnerIndex === 1) { p2.score++; winnerId = p2.id; }

    const voidedCardOf =
      resolution.voidedIndex !== undefined
        ? game.players[resolution.voidedIndex].id
        : undefined;

    const result: RoundResult = {
      roundNumber:   game.round,
      playerOneCard: p1Card,
      playerTwoCard: p2Card,
      outcome:       resolution.outcome,
      reason:        resolution.reason,
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

    // Move card from discard back to hand
    player.discard = player.discard.filter((c) => c.id !== cardId);
    player.hand.push(cardInDiscard);
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
      id:          self.id,
      username:    self.username,
      score:       self.score,
      hand:        self.hand,
      deckCount:   self.deck.length,
      discardPile: self.discard,
      hasPlayed:   game.plays.has(self.id),
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
