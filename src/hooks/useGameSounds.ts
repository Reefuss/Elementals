"use client";

import { useEffect, useRef } from "react";
import { GamePhase, WinReason } from "@/lib/game/types";
import { SoundEngine } from "@/lib/sound/engine";
import type { ClientGameState } from "@/lib/game/types";

/**
 * Fires sounds at the right moments in game state.
 * Designed around Hearthstone's "key beats" principle:
 * sounds mark cast + hit, not constant background chatter.
 */
export function useGameSounds(
  gameState: ClientGameState | null,
  msLeft: number,
  selfId: string
) {
  const prevPhase    = useRef<GamePhase | null>(null);
  const prevScore    = useRef<number>(0);
  const prevMsLeft   = useRef<number>(30000);
  const tickThrottle = useRef<boolean>(false);
  // Track scheduled timeouts so we can cancel on unmount
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function schedule(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  }

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  // ── Game state transitions ────────────────────────────────────
  useEffect(() => {
    if (!gameState) return;

    const { phase, self, lastResult } = gameState;
    const prev = prevPhase.current;

    if (prev !== phase) {
      // PLAYING → REVEALING: stagger two card flip sounds to match visual delays
      if (phase === GamePhase.REVEALING && prev === GamePhase.PLAYING) {
        schedule(() => SoundEngine.play("card_flip"), 300);  // opponent flips
        schedule(() => SoundEngine.play("card_flip"), 850);  // you flip

        // Play result sound after both cards are visible + banner has appeared
        if (lastResult) {
          const tie    = lastResult.winnerId === null;
          const youWon = lastResult.winnerId === selfId;
          const block  = lastResult.reason === WinReason.BLOCK_NEGATES;

          schedule(() => {
            if (block)       SoundEngine.play("round_block");
            else if (tie)    SoundEngine.play("round_tie");
            else if (youWon) SoundEngine.play("round_win");
            else             SoundEngine.play("round_lose");
          }, 1850);

          // Score pip pop for winner
          if (youWon && !tie && !block) {
            schedule(() => SoundEngine.play("point_pop"), 2300);
          }
        }
      }

      prevPhase.current = phase;
    }

    // Score incremented outside of reveal (e.g. reconnect)
    if (self.score > prevScore.current) {
      prevScore.current = self.score;
    } else {
      prevScore.current = self.score;
    }
  }, [gameState, selfId]);

  // ── Timer sounds ─────────────────────────────────────────────
  useEffect(() => {
    const prev = prevMsLeft.current;

    if (msLeft > 0 && msLeft < 8000) {
      const prevSec = Math.ceil(prev / 1000);
      const currSec = Math.ceil(msLeft / 1000);

      if (currSec < prevSec && !tickThrottle.current) {
        tickThrottle.current = true;
        if (msLeft < 5000) {
          SoundEngine.play("timer_urgent");
        } else {
          SoundEngine.play("timer_tick");
        }
        setTimeout(() => { tickThrottle.current = false; }, 850);
      }
    }

    prevMsLeft.current = msLeft;
  }, [msLeft]);
}
