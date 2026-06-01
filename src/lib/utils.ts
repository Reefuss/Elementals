import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Card, CardType, Element, SpecialType } from "./game/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStoredPlayerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("elementals_player_id_v2");
}

export function setStoredPlayerId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("elementals_player_id_v2", id);
}

export function getStoredUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("elementals_username_v2");
}

export function setStoredUsername(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("elementals_username_v2", name);
}

/** Element → Tailwind color key */
export function elementColorKey(element: Element): "rock" | "scissors" | "paper" {
  switch (element) {
    case Element.ROCK:     return "rock";
    case Element.SCISSORS: return "scissors";
    case Element.PAPER:    return "paper";
  }
}

/** Returns the CSS glow shadow class for a card */
export function cardGlowClass(card: Card): string {
  if (card.type === CardType.SPECIAL) {
    switch (card.specialType) {
      case SpecialType.STALL:        return "shadow-[0_0_20px_4px_rgba(100,116,139,0.4)]";
      case SpecialType.RESHUFFLE:    return "shadow-[0_0_20px_4px_rgba(52,211,153,0.4)]";
      case SpecialType.DISCARD_TRAP: return "shadow-[0_0_20px_4px_rgba(248,113,113,0.4)]";
      case SpecialType.REVIVE:       return "shadow-[0_0_20px_4px_rgba(251,191,36,0.4)]";
    }
  }
  switch (card.element) {
    case Element.ROCK:     return "shadow-rock-glow";
    case Element.SCISSORS: return "shadow-scissors-glow";
    case Element.PAPER:    return "shadow-paper-glow";
  }
}

/** Returns the gradient border color for a card */
export function cardBorderColor(card: Card): string {
  if (card.type === CardType.SPECIAL) {
    switch (card.specialType) {
      case SpecialType.STALL:        return "from-slate-400 to-slate-600";
      case SpecialType.RESHUFFLE:    return "from-emerald-400 to-emerald-600";
      case SpecialType.DISCARD_TRAP: return "from-red-400 to-red-600";
      case SpecialType.REVIVE:       return "from-amber-400 to-amber-600";
    }
  }
  switch (card.element) {
    case Element.ROCK:     return "from-rock-400 to-rock-600";
    case Element.SCISSORS: return "from-scissors-300 to-scissors-600";
    case Element.PAPER:    return "from-paper-300 to-paper-700";
  }
}

export function formatTimer(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return String(s);
}

/** Returns true if the timer is in "danger" zone (< 8 s) */
export function isTimerDanger(ms: number): boolean {
  return ms < 8000;
}
