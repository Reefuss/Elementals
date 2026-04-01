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
export function elementColorKey(element: Element): "sun" | "moon" | "star" {
  switch (element) {
    case Element.SUN:  return "sun";
    case Element.MOON: return "moon";
    case Element.STAR: return "star";
  }
}

/** Returns the CSS glow shadow class for a card */
export function cardGlowClass(card: Card): string {
  if (card.type === CardType.SPECIAL) {
    if (card.specialType === SpecialType.RAINBOW) return "shadow-rainbow-glow";
    return "shadow-block-glow";
  }
  switch (card.element) {
    case Element.SUN:  return "shadow-sun-glow";
    case Element.MOON: return "shadow-moon-glow";
    case Element.STAR: return "shadow-star-glow";
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
    case Element.SUN:  return "from-sun-400 to-sun-600";
    case Element.MOON: return "from-moon-300 to-moon-600";
    case Element.STAR: return "from-star-300 to-star-700";
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
