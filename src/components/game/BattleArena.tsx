"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardType, Element, GamePhase, RoundResult, WinReason, SpecialType } from "@/lib/game/types";
import { GameCard, CardBack, CardSlot } from "./GameCard";
import { TurnTimer } from "./TurnTimer";
import { SoundEngine } from "@/lib/sound/engine";

// ─────────────────────────────────────────────
//  Reveal step timeline (ms from entering REVEALING)
// ─────────────────────────────────────────────
// 0     → step 1: anticipation — both CardBacks pulse, glow ring fires
// 300   → step 2: opponent card flips
// 750   → step 3: your card flips
// 1300  → step 4: evaluate — winner scales, loser dims
// 1850  → result banner (driven by animation delay, not step)

const STEP_OPP_FLIP  = 300;
const STEP_SELF_FLIP = 750;
const STEP_EVALUATE  = 1300;

// ─────────────────────────────────────────────
//  Reason line
// ─────────────────────────────────────────────

function reasonLine(result: RoundResult): string {
  const cap = (s: string) => s[0] + s.slice(1).toLowerCase();
  switch (result.reason) {
    case WinReason.ELEMENT_BEATS: {
      const beats: Record<string, string> = { ROCK: "SCISSORS", SCISSORS: "PAPER", PAPER: "ROCK" };
      const p1 = result.playerOneCard;
      const p2 = result.playerTwoCard;
      if (p1.type === CardType.ELEMENT && p2.type === CardType.ELEMENT) {
        const [winner, loser] = beats[p1.element] === p2.element
          ? [p1.element, p2.element]
          : [p2.element, p1.element];
        return `${cap(winner)} beats ${cap(loser)}`;
      }
      return "";
    }
    case WinReason.HIGHER_VALUE:        return "Higher value wins";
    case WinReason.RAINBOW_BEATS:       return "Rainbow conquers all";
    case WinReason.BLOCK_NEGATES:       return "Block cancels the round";
    case WinReason.SAME_VALUE_TIE:      return "Equal power — tie";
    case WinReason.RAINBOW_TIEBREAK:    return "Rainbow duel settled it";
    case WinReason.DIAMOND:             return "Diamond beats all elements";
    case WinReason.DIAMOND_VALUE:       return "Higher diamond value wins";
    case WinReason.DIAMOND_TIE:         return "Equal diamonds — tie";
    case WinReason.DISCARD_TRAP:        return "Card voided by trap";
    case WinReason.DISCARD_TRAP_MUTUAL: return "Both traps fired — mutual void";
    case WinReason.REVIVE_FORFEIT:      return "Round sacrificed to revive";
    case WinReason.REVIVE_MUTUAL:       return "Both players revive a card";
    case WinReason.RESHUFFLE:           return "Hand reshuffled";
    case WinReason.RESHUFFLE_MUTUAL:    return "Both hands reshuffled";
    default: return "";
  }
}

// Per-card-type winner glow color
function elementGlow(card: Card | undefined): string {
  if (!card) return "0 0 28px 8px rgba(129,140,248,0.7)";
  if (card.type === CardType.DIAMOND) return "0 0 28px 8px rgba(34,211,238,0.7)";
  if (card.type === CardType.SPECIAL) {
    if (card.specialType === SpecialType.RAINBOW)      return "0 0 28px 8px rgba(199,119,255,0.7)";
    if (card.specialType === SpecialType.DISCARD_TRAP) return "0 0 28px 8px rgba(248,113,113,0.7)";
    if (card.specialType === SpecialType.REVIVE)       return "0 0 28px 8px rgba(251,191,36,0.7)";
    return "0 0 28px 8px rgba(129,140,248,0.7)";
  }
  const map: Record<Element, string> = {
    [Element.ROCK]:     "0 0 28px 8px rgba(251,191,36,0.7)",
    [Element.SCISSORS]: "0 0 28px 8px rgba(147,197,253,0.7)",
    [Element.PAPER]:    "0 0 28px 8px rgba(232,121,249,0.7)",
  };
  return map[card.element];
}

// ─────────────────────────────────────────────
//  Props
// ─────────────────────────────────────────────

interface BattleArenaProps {
  phase:             GamePhase;
  round:             number;
  msLeft:            number;
  selfHasPlayed:     boolean;
  opponentHasPlayed: boolean;
  selfPlayedCard?:   Card;
  lastResult?:       RoundResult | null;
  selfId:            string;
  selfIsPlayerOne?:  boolean;
  isDragging?:       boolean;
  dropZoneRef?:      React.RefObject<HTMLDivElement>;
}

// ─────────────────────────────────────────────
//  Component
// ─────────────────────────────────────────────

export function BattleArena({
  phase, round, msLeft, selfHasPlayed, opponentHasPlayed,
  selfPlayedCard, lastResult, selfId, selfIsPlayerOne, isDragging, dropZoneRef,
}: BattleArenaProps) {
  const isRevealing = phase === GamePhase.REVEALING;
  const isPlaying   = phase === GamePhase.PLAYING;

  // Drives the cinematic sequence during REVEALING
  // 0 = idle, 1 = anticipation, 2 = opp flipped, 3 = self flipped, 4 = evaluated
  const [revealStep, setRevealStep] = useState(0);
  // Tracks which flash has fired (changes key to re-trigger AnimatePresence)
  const [oppFlashKey,  setOppFlashKey]  = useState(0);
  const [selfFlashKey, setSelfFlashKey] = useState(0);

  useEffect(() => {
    if (phase !== GamePhase.REVEALING) {
      setRevealStep(0);
      return;
    }
    // Play tension drone the instant REVEALING starts
    SoundEngine.play("tension_build");
    setRevealStep(1);

    const t1 = setTimeout(() => { setRevealStep(2); setOppFlashKey(k => k + 1);  }, STEP_OPP_FLIP);
    const t2 = setTimeout(() => { setRevealStep(3); setSelfFlashKey(k => k + 1); }, STEP_SELF_FLIP);
    const t3 = setTimeout(() => setRevealStep(4), STEP_EVALUATE);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [phase]);

  const p1Card = lastResult?.playerOneCard;
  const p2Card = lastResult?.playerTwoCard;

  // Use server-authoritative player order
  const selfCard = selfIsPlayerOne !== false ? p1Card : p2Card;
  const oppCard  = selfIsPlayerOne !== false ? p2Card : p1Card;

  const selfWon = isRevealing && lastResult?.winnerId === selfId;
  const oppWon  = isRevealing && lastResult?.winnerId !== null && lastResult?.winnerId !== selfId;
  const tied    = isRevealing && lastResult?.winnerId === null;

  const winnerCard = selfWon ? selfCard : oppWon ? oppCard : undefined;

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-3">

      {/* ── Round indicator ────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="h-px w-16 bg-white/10" />
        <AnimatePresence mode="wait">
          <motion.span
            key={round}
            initial={{ opacity: 0, scale: 1.4 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="font-display text-xs tracking-[0.3em] text-white/40 uppercase"
          >
            Round {round}
          </motion.span>
        </AnimatePresence>
        <div className="h-px w-16 bg-white/10" />
      </div>

      {/* ── Battle field ───────────────────────────── */}
      <div className="relative flex items-center gap-6">

        {/* Anticipation glow ring — step 1 only */}
        <AnimatePresence>
          {revealStep === 1 && (
            <motion.div
              key="anticipation-ring"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute -inset-6 rounded-3xl pointer-events-none"
              style={{ boxShadow: "0 0 40px 8px rgba(129,140,248,0.25)", border: "1px solid rgba(129,140,248,0.15)" }}
            />
          )}
        </AnimatePresence>

        {/* ── Opponent slot ──────────────────────── */}
        <div className="relative flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-white/30">Opponent</span>

          {/* Impact flash on flip */}
          <AnimatePresence>
            {isRevealing && revealStep >= 2 && (
              <motion.div
                key={`opp-flash-${oppFlashKey}`}
                initial={{ opacity: 0.55 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="absolute inset-0 rounded-2xl bg-white pointer-events-none z-20"
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isRevealing && oppCard ? (
              <motion.div
                key="opp-reveal"
                initial={{ rotateY: 90, scale: 0.9 }}
                animate={revealStep >= 4
                  ? { rotateY: 0, scale: oppWon ? 1.08 : tied ? 1 : 0.9, opacity: oppWon ? 1 : tied ? 0.7 : 0.42 }
                  : { rotateY: 0, scale: 1 }
                }
                style={revealStep >= 4 && oppWon
                  ? { filter: `drop-shadow(${elementGlow(oppCard)})` }
                  : revealStep >= 4 && !tied
                  ? { filter: "grayscale(0.5)" }
                  : {}
                }
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: revealStep < 2 ? 0.2 : 0 }}
              >
                <GameCard card={oppCard} size="md" />
              </motion.div>
            ) : opponentHasPlayed ? (
              <motion.div
                key="opp-back"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={revealStep === 1
                  ? { scale: [1, 1.06, 1, 1.06, 1], opacity: 1 }
                  : { scale: 1, opacity: 1 }
                }
                transition={revealStep === 1
                  ? { duration: 0.3, repeat: 0 }
                  : { type: "spring", stiffness: 300, damping: 24 }
                }
              >
                <CardBack size="md" pulse />
              </motion.div>
            ) : (
              <CardSlot size="md" label="Waiting…" />
            )}
          </AnimatePresence>
        </div>

        {/* ── Center: timer / VS / clash ─────────── */}
        <div className="flex flex-col items-center gap-3 w-14">
          <TurnTimer msLeft={msLeft} visible={isPlaying && !selfHasPlayed} />

          {!isPlaying && (
            <AnimatePresence mode="wait">
              {revealStep >= 4 && !tied ? (
                <motion.div
                  key="clash"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={cn(
                    "font-display text-sm font-bold",
                    selfWon ? "text-indigo-400" : oppWon ? "text-red-400" : "text-white/20"
                  )}
                >
                  {selfWon ? "▶" : "◀"}
                </motion.div>
              ) : (
                <motion.div
                  key="vs"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-display text-white/20 text-xs tracking-[0.4em]"
                >
                  VS
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* ── Self slot ──────────────────────────── */}
        <div className="relative flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-white/30">You</span>
          {/* Invisible drop zone ref anchor — sized to match the card slot */}
          {!selfHasPlayed && !isRevealing && (
            <div ref={dropZoneRef} className="absolute inset-0 pointer-events-none" />
          )}

          {/* Impact flash on flip */}
          <AnimatePresence>
            {isRevealing && revealStep >= 3 && (
              <motion.div
                key={`self-flash-${selfFlashKey}`}
                initial={{ opacity: 0.55 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="absolute inset-0 rounded-2xl bg-white pointer-events-none z-20"
              />
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {isRevealing && selfCard ? (
              <motion.div
                key="self-reveal"
                initial={{ rotateY: 90, scale: 0.9 }}
                animate={revealStep >= 4
                  ? { rotateY: 0, scale: selfWon ? 1.08 : tied ? 1 : 0.9, opacity: selfWon ? 1 : tied ? 0.7 : 0.42 }
                  : { rotateY: 0, scale: 1 }
                }
                style={revealStep >= 4 && selfWon
                  ? { filter: `drop-shadow(${elementGlow(selfCard)})` }
                  : revealStep >= 4 && !tied
                  ? { filter: "grayscale(0.5)" }
                  : {}
                }
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: revealStep < 3 ? 0.75 : 0 }}
              >
                <GameCard card={selfCard} size="md" />
              </motion.div>
            ) : selfHasPlayed ? (
              <motion.div
                key="self-played"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={revealStep === 1
                  ? { scale: [1, 1.06, 1, 1.06, 1], opacity: 1 }
                  : { scale: 1, opacity: 1 }
                }
                transition={revealStep === 1
                  ? { duration: 0.3, repeat: 0 }
                  : { type: "spring", stiffness: 300, damping: 24 }
                }
              >
                <CardBack size="md" pulse />
              </motion.div>
            ) : (
              <CardSlot size="md" label="Play a card" />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Status / result ────────────────────────── */}
      <AnimatePresence mode="wait">
        {isPlaying && (
          <motion.div
            key="playing-msg"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-white/40 text-center"
          >
            {selfHasPlayed
              ? "Waiting for opponent…"
              : opponentHasPlayed
              ? "Opponent is ready — make your move!"
              : "Choose a card from your hand"}
          </motion.div>
        )}
        {isRevealing && lastResult && (
          <RoundResultBanner result={lastResult} selfId={selfId} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Result banner
// ─────────────────────────────────────────────

function RoundResultBanner({ result, selfId }: { result: RoundResult; selfId: string }) {
  const youWon = result.winnerId === selfId;
  const tie    = result.winnerId === null;
  const reason = reasonLine(result);

  return (
    <motion.div
      key="result-banner"
      initial={{ opacity: 0, y: 16, scale: 0.88 }}
      animate={{ opacity: 1, y: 0,  scale: 1   }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 340, damping: 24, delay: 1.85 }}
      className={cn(
        "px-6 py-3 rounded-2xl text-center border font-display",
        tie    && "border-white/10  bg-white/5       text-white/60",
        youWon && "border-indigo-400/50 bg-indigo-500/15 text-indigo-300",
        !tie && !youWon && "border-red-400/40 bg-red-500/10 text-red-300"
      )}
    >
      <div className="text-xl font-bold">
        {tie ? "Tie Round" : youWon ? "Point Won!" : "Point Lost"}
      </div>
      {reason && <div className="text-xs opacity-60 mt-1">{reason}</div>}
    </motion.div>
  );
}
