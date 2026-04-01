"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardType, Element, SpecialType } from "@/lib/game/types";
import { SoundEngine } from "@/lib/sound/engine";

// ─────────────────────────────────────────────
//  Element SVG icons
// ─────────────────────────────────────────────

function SunIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <circle cx="32" cy="32" r="14" fill="currentColor" />
      {[0,45,90,135,180,225,270,315].map((deg) => (
        <line
          key={deg}
          x1="32" y1="32"
          x2={32 + 26 * Math.cos((deg * Math.PI) / 180)}
          y2={32 + 26 * Math.sin((deg * Math.PI) / 180)}
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <path
        d="M48 35.5A20 20 0 1 1 28.5 16a16 16 0 1 0 19.5 19.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <polygon
        points="32,4 39.5,24 62,24 44,37.5 51,58 32,45.5 13,58 20,37.5 2,24 24.5,24"
        fill="currentColor"
      />
    </svg>
  );
}

function BlockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <path
        d="M32 4L6 16v16c0 14 11.4 27.1 26 31 14.6-3.9 26-17 26-31V16L32 4Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M32 16L18 22v10c0 8.5 6.8 16.5 14 19 7.2-2.5 14-10.5 14-19V22L32 16Z"
        fill="rgba(0,0,0,0.35)"
      />
    </svg>
  );
}

function RainbowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M4 44a28 28 0 0 1 56 0" stroke="#ff6b6b" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M10 44a22 22 0 0 1 44 0" stroke="#ffd93d" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M16 44a16 16 0 0 1 32 0" stroke="#6bcb77" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M22 44a10 10 0 0 1 20 0" stroke="#4d96ff" strokeWidth="5" strokeLinecap="round" fill="none"/>
      <path d="M27 44a5 5 0 0 1 10 0"   stroke="#c77dff" strokeWidth="5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// ─────────────────────────────────────────────
//  Theme per card type
// ─────────────────────────────────────────────

interface CardTheme {
  bg:          string;
  border:      string;
  iconColor:   string;
  nameColor:   string;
  glow:        string;
  glowHover:   string;
  valueColor:  string;
  label:       string;
}

function getCardTheme(card: Card): CardTheme {
  if (card.type === CardType.SPECIAL) {
    if (card.specialType === SpecialType.RAINBOW) {
      return {
        bg:         "bg-gradient-to-b from-[#1a0d30] to-[#0d0820]",
        border:     "border-transparent",
        iconColor:  "text-white",
        nameColor:  "text-white",
        glow:       "shadow-rainbow-glow",
        glowHover:  "[--glow-hover:0_0_40px_12px_rgba(199,119,255,0.7)]",
        valueColor: "text-white/80",
        label:      "Rainbow",
      };
    }
    return {
      bg:         "bg-gradient-to-b from-[#151520] to-[#0d0d18]",
      border:     "border-block-500/40",
      iconColor:  "text-block-400",
      nameColor:  "text-block-300",
      glow:       "shadow-block-glow",
      glowHover:  "",
      valueColor: "text-block-300/60",
      label:      "Block",
    };
  }

  switch (card.element) {
    case Element.SUN:
      return {
        bg:         "bg-gradient-to-b from-[#1f1400] to-[#0f0900]",
        border:     "border-sun-500/40",
        iconColor:  "text-sun-400",
        nameColor:  "text-sun-300",
        glow:       "shadow-sun-glow",
        glowHover:  "",
        valueColor: "text-sun-400",
        label:      "Sun",
      };
    case Element.MOON:
      return {
        bg:         "bg-gradient-to-b from-[#05101e] to-[#020810]",
        border:     "border-moon-500/40",
        iconColor:  "text-moon-300",
        nameColor:  "text-moon-200",
        glow:       "shadow-moon-glow",
        glowHover:  "",
        valueColor: "text-moon-300",
        label:      "Moon",
      };
    case Element.STAR:
      return {
        bg:         "bg-gradient-to-b from-[#160a1f] to-[#0a0510]",
        border:     "border-star-500/40",
        iconColor:  "text-star-400",
        nameColor:  "text-star-300",
        glow:       "shadow-star-glow",
        glowHover:  "",
        valueColor: "text-star-400",
        label:      "Star",
      };
  }
}

// ─────────────────────────────────────────────
//  Main card component
// ─────────────────────────────────────────────

interface GameCardProps {
  card:      Card;
  selected?: boolean;
  disabled?: boolean;
  played?:   boolean;
  revealed?: boolean;
  size?:     "xs" | "sm" | "md" | "lg";
  onClick?:  () => void;
  className?: string;
  /** Animate in from a direction */
  animateIn?: "bottom" | "top" | "none";
}

const cardSizes = {
  xs: { outer: "w-12 h-16",  icon: "w-5 h-5",   name: "text-[7px]",  val: "text-xs" },
  sm: { outer: "w-20 h-28",  icon: "w-8 h-8",   name: "text-[9px]",  val: "text-sm" },
  md: { outer: "w-28 h-40",  icon: "w-12 h-12",  name: "text-xs",    val: "text-lg" },
  lg: { outer: "w-36 h-52",  icon: "w-16 h-16",  name: "text-sm",    val: "text-2xl" },
};

export function GameCard({
  card,
  selected  = false,
  disabled  = false,
  played    = false,
  size      = "md",
  onClick,
  className,
  animateIn = "none",
}: GameCardProps) {
  const theme = getCardTheme(card);
  const dims  = cardSizes[size];

  const isRainbow = card.type === CardType.SPECIAL && card.specialType === SpecialType.RAINBOW;
  const isBlock   = card.type === CardType.SPECIAL && card.specialType === SpecialType.BLOCK;

  const initial =
    animateIn === "bottom" ? { y: 80, opacity: 0 } :
    animateIn === "top"    ? { y: -80, opacity: 0 } :
    { y: 0, opacity: 1 };

  return (
    <motion.div
      initial={initial}
      animate={{ y: selected ? -24 : 0, opacity: 1, scale: selected ? 1.06 : 1 }}
      whileHover={disabled || played ? {} : { y: selected ? -24 : -10, scale: selected ? 1.06 : 1.04 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      onClick={disabled ? undefined : () => {
        SoundEngine.play(selected ? "card_deselect" : "card_select");
        onClick?.();
      }}
      className={cn(
        "relative flex flex-col items-center justify-between",
        "rounded-2xl border cursor-pointer",
        "transition-shadow duration-300",
        dims.outer,
        theme.bg,
        theme.border,
        selected ? theme.glow : "",
        disabled && "opacity-40 cursor-not-allowed",
        played   && "opacity-70",
        "p-3",
        className
      )}
    >
      {/* Rainbow shimmer overlay */}
      {isRainbow && (
        <div className="absolute inset-0 rounded-2xl opacity-20 rainbow-shimmer pointer-events-none" />
      )}

      {/* Selection ring */}
      {selected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "absolute -inset-[3px] rounded-[18px] pointer-events-none",
            isRainbow
              ? "rainbow-shimmer opacity-80"
              : cn("border-2", {
                  "border-sun-400":   card.type === CardType.ELEMENT && card.element === Element.SUN,
                  "border-moon-300":  card.type === CardType.ELEMENT && card.element === Element.MOON,
                  "border-star-400":  card.type === CardType.ELEMENT && card.element === Element.STAR,
                  "border-block-400": isBlock,
                })
          )}
        />
      )}

      {/* Card power badge (top-left) */}
      {card.type === CardType.ELEMENT && (
        <div className={cn(
          "absolute top-2 left-2 text-[10px] font-bold leading-none px-1.5 py-0.5 rounded",
          "bg-black/40",
          theme.valueColor
        )}>
          +{card.value}
        </div>
      )}

      {/* Element label (top-right) */}
      <div className={cn(
        "absolute top-2 right-2 text-[9px] uppercase tracking-widest font-semibold opacity-60",
        theme.nameColor
      )}>
        {card.type === CardType.ELEMENT ? card.element.slice(0, 3) : (isRainbow ? "RBW" : "BLK")}
      </div>

      {/* Central icon */}
      <div className="flex-1 flex items-center justify-center w-full">
        {card.type === CardType.ELEMENT && card.element === Element.SUN  && <SunIcon  className={cn(dims.icon, theme.iconColor)} />}
        {card.type === CardType.ELEMENT && card.element === Element.MOON && <MoonIcon className={cn(dims.icon, theme.iconColor)} />}
        {card.type === CardType.ELEMENT && card.element === Element.STAR && <StarIcon className={cn(dims.icon, theme.iconColor)} />}
        {isBlock   && <BlockIcon   className={cn(dims.icon, theme.iconColor)} />}
        {isRainbow && <RainbowIcon className={cn(dims.icon)} />}
      </div>

      {/* Bottom label */}
      <div className={cn(
        "w-full text-center font-display leading-none",
        dims.name, theme.nameColor
      )}>
        {card.type === CardType.ELEMENT
          ? `${theme.label} +${card.value}`
          : theme.label}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  Face-down card back
// ─────────────────────────────────────────────

interface CardBackProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  pulse?: boolean;
}

export function CardBack({ size = "md", className, pulse }: CardBackProps) {
  const dims = cardSizes[size];
  return (
    <motion.div
      animate={pulse ? { scale: [1, 1.04, 1] } : {}}
      transition={pulse ? { repeat: Infinity, duration: 1.5 } : {}}
      className={cn(
        "relative rounded-2xl card-back",
        "flex items-center justify-center",
        dims.outer,
        className
      )}
    >
      {/* Pattern */}
      <div className="absolute inset-2 rounded-xl opacity-50" />
      <div className="absolute inset-4 rounded-lg opacity-30" />
      <div className="w-6 h-6 opacity-20">
        <StarIcon className="text-white" />
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
//  Empty card slot
// ─────────────────────────────────────────────

export function CardSlot({ size = "md", label }: { size?: "xs" | "sm" | "md" | "lg"; label?: string }) {
  const dims = cardSizes[size];
  return (
    <div className={cn(
      "flex items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02]",
      dims.outer
    )}>
      {label && <span className="text-xs text-white/20">{label}</span>}
    </div>
  );
}
