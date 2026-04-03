import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Card, CardType, Element, SpecialType } from "./game/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStoredPlayerId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("elementals_player_id");
}

export function setStoredPlayerId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("elementals_player_id", id);
}

export function getStoredUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("elementals_username");
}

export function setStoredUsername(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("elementals_username", name);
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
    if (card.specialType === SpecialType.RAINBOW) return "shadow-rainbow-glow";
    return "shadow-block-glow";
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
    if (card.specialType === SpecialType.RAINBOW)
      return "from-pink-500 via-yellow-400 via-green-400 to-blue-500";
    return "from-block-400 to-block-600";
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
