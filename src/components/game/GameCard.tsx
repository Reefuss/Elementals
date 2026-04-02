"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card, CardType, Element, SpecialType } from "@/lib/game/types";
import { CARD_MAP } from "@/lib/game/cardPool";
import { SoundEngine } from "@/lib/sound/engine";

// ─────────────────────────────────────────────
//  Element SVG icons
// ─────────────────────────────────────────────

function RockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <path
        d="M16 44 Q8 36 12 24 Q16 12 28 10 Q40 8 48 18 Q56 28 52 40 Q48 52 36 54 Q24 56 16 44Z"
        fill="currentColor"
      />
      <path
        d="M22 38 Q18 30 22 22 Q26 16 34 16"
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <circle cx="19" cy="20" r="8" stroke="currentColor" strokeWidth="4" fill="none" />
      <circle cx="19" cy="44" r="8" stroke="currentColor" strokeWidth="4" fill="none" />
      <line x1="25" y1="25" x2="57" y2="52" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="25" y1="39" x2="57" y2="12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function PaperIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <rect x="12" y="8" width="40" height="48" rx="5" fill="currentColor" opacity="0.9" />
      <line x1="20" y1="22" x2="44" y2="22" stroke="rgba(0,0,0,0.25)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="30" x2="44" y2="30" stroke="rgba(0,0,0,0.25)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="38" x2="36" y2="38" stroke="rgba(0,0,0,0.25)" strokeWidth="2.5" strokeLinecap="round" />
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

function ReshuffleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="4,28 4,12 20,12" />
      <path d="M4 12 C 4 12, 20 4, 32 12 S 52 28, 60 20" />
      <polyline points="60,36 60,52 44,52" />
      <path d="M60 52 C 60 52, 44 60, 32 52 S 12 36, 4 44" />
    </svg>
  );
}

function TrapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="4" />
      <line x1="18" y1="18" x2="46" y2="46" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="32" r="6" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function ReviveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M32 56 V 24" />
      <path d="M20 36 L 32 24 L 44 36" />
      <path d="M16 56 Q 16 44 32 44 Q 48 44 48 56" />
    </svg>
  );
}

function DiamondIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      <polygon
        points="32,4 58,24 32,60 6,24"
        fill="currentColor"
        opacity="0.85"
      />
      <polygon
        points="32,4 58,24 32,32"
        fill="rgba(255,255,255,0.2)"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────
//  Theme per card type
// ─────────────────────────────────────────────

interface CardTheme {
  bg:         string;
  border:     string;
  iconColor:  string;
  nameColor:  string;
  glow:       string;
  valueColor: string;
  label:      string;
}

function getCardTheme(card: Card): CardTheme {
  if (card.type === CardType.DIAMOND) {
    return {
      bg:         "bg-gradient-to-b from-[#0a1a2a] to-[#050d15]",
      border:     "border-cyan-400/50",
      iconColor:  "text-cyan-300",
      nameColor:  "text-cyan-200",
      glow:       "shadow-[0_0_20px_4px_rgba(34,211,238,0.5)]",
      valueColor: "text-cyan-300",
      label:      "Diamond",
    };
  }

  if (card.type === CardType.SPECIAL) {
    switch (card.specialType) {
      case SpecialType.RAINBOW:
        return {
          bg:         "bg-gradient-to-b from-[#1a0d30] to-[#0d0820]",
          border:     "border-transparent",
          iconColor:  "text-white",
          nameColor:  "text-white",
          glow:       "shadow-rainbow-glow",
          valueColor: "text-white/80",
          label:      "Rainbow",
        };
      case SpecialType.RESHUFFLE:
        return {
          bg:         "bg-gradient-to-b from-[#0a1f1a] to-[#050f0c]",
          border:     "border-emerald-500/40",
          iconColor:  "text-emerald-400",
          nameColor:  "text-emerald-300",
          glow:       "shadow-[0_0_20px_4px_rgba(52,211,153,0.4)]",
          valueColor: "text-emerald-400/60",
          label:      "Reshuffle",
        };
      case SpecialType.DISCARD_TRAP:
        return {
          bg:         "bg-gradient-to-b from-[#1f0a0a] to-[#0f0505]",
          border:     "border-red-500/40",
          iconColor:  "text-red-400",
          nameColor:  "text-red-300",
          glow:       "shadow-[0_0_20px_4px_rgba(248,113,113,0.4)]",
          valueColor: "text-red-400/60",
          label:      "Discard Trap",
        };
      case SpecialType.REVIVE:
        return {
          bg:         "bg-gradient-to-b from-[#1a1000] to-[#0d0800]",
          border:     "border-amber-500/40",
          iconColor:  "text-amber-400",
          nameColor:  "text-amber-300",
          glow:       "shadow-[0_0_20px_4px_rgba(251,191,36,0.4)]",
          valueColor: "text-amber-400/60",
          label:      "Revive",
        };
      default: // BLOCK
        return {
          bg:         "bg-gradient-to-b from-[#151520] to-[#0d0d18]",
          border:     "border-block-500/40",
          iconColor:  "text-block-400",
          nameColor:  "text-block-300",
          glow:       "shadow-block-glow",
          valueColor: "text-block-300/60",
          label:      "Block",
        };
    }
  }

  // CardType.ELEMENT
  switch (card.element) {
    case Element.ROCK:
      return {
        bg:         "bg-gradient-to-b from-[#1f1400] to-[#0f0900]",
        border:     "border-rock-500/40",
        iconColor:  "text-rock-400",
        nameColor:  "text-rock-300",
        glow:       "shadow-rock-glow",
        valueColor: "text-rock-400",
        label:      "Rock",
      };
    case Element.SCISSORS:
      return {
        bg:         "bg-gradient-to-b from-[#05101e] to-[#020810]",
        border:     "border-scissors-500/40",
        iconColor:  "text-scissors-300",
        nameColor:  "text-scissors-200",
        glow:       "shadow-scissors-glow",
        valueColor: "text-scissors-300",
        label:      "Scissors",
      };
    case Element.PAPER:
      return {
        bg:         "bg-gradient-to-b from-[#160a1f] to-[#0a0510]",
        border:     "border-paper-500/40",
        iconColor:  "text-paper-400",
        nameColor:  "text-paper-300",
        glow:       "shadow-paper-glow",
        valueColor: "text-paper-400",
        label:      "Paper",
      };
    default:
      return {
        bg: "bg-gradient-to-b from-[#151520] to-[#0d0d18]",
        border: "border-block-500/40",
        iconColor: "text-block-400",
        nameColor: "text-block-300",
        glow: "shadow-block-glow",
        valueColor: "text-block-300/60",
        label: "",
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
  size?:     "xs" | "sm" | "md" | "lg";
  onClick?:  () => void;
  className?: string;
  animateIn?: "bottom" | "top" | "none";
}

const cardSizes = {
  xs: { outer: "w-12 h-16",  icon: "w-5 h-5",   name: "text-[7px]",  val: "text-xs",   effect: "" },
  sm: { outer: "w-20 h-28",  icon: "w-8 h-8",   name: "text-[9px]",  val: "text-sm",   effect: "" },
  md: { outer: "w-28 h-48",  icon: "w-10 h-10",  name: "text-[9px]", val: "text-lg",   effect: "text-[6.5px]" },
  lg: { outer: "w-36 h-60",  icon: "w-13 h-13",  name: "text-xs",    val: "text-2xl",  effect: "text-[8px]" },
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
  const theme      = getCardTheme(card);
  const dims       = cardSizes[size];
  const effectText = card.variantId ? (CARD_MAP[card.variantId]?.effect ?? "") : "";

  const isRainbow     = card.type === CardType.SPECIAL && card.specialType === SpecialType.RAINBOW;
  const isBlock       = card.type === CardType.SPECIAL && card.specialType === SpecialType.BLOCK;
  const isReshuffle   = card.type === CardType.SPECIAL && card.specialType === SpecialType.RESHUFFLE;
  const isTrap        = card.type === CardType.SPECIAL && card.specialType === SpecialType.DISCARD_TRAP;
  const isRevive      = card.type === CardType.SPECIAL && card.specialType === SpecialType.REVIVE;
  const isDiamond     = card.type === CardType.DIAMOND;

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

      {/* Diamond shimmer overlay */}
      {isDiamond && (
        <motion.div
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ background: "linear-gradient(135deg, transparent 30%, rgba(34,211,238,0.2) 50%, transparent 70%)" }}
        />
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
                  "border-rock-400":     card.type === CardType.ELEMENT && card.element === Element.ROCK,
                  "border-scissors-300": card.type === CardType.ELEMENT && card.element === Element.SCISSORS,
                  "border-paper-400":    card.type === CardType.ELEMENT && card.element === Element.PAPER,
                  "border-block-400":    isBlock,
                  "border-emerald-400":  isReshuffle,
                  "border-red-400":      isTrap,
                  "border-amber-400":    isRevive,
                  "border-cyan-400":     isDiamond,
                })
          )}
        />
      )}

      {/* Value badge (top-left) */}
      {card.type === CardType.ELEMENT && (
        <div className={cn(
          "absolute top-2 left-2 text-[10px] font-bold leading-none px-1.5 py-0.5 rounded",
          "bg-black/40",
          theme.valueColor
        )}>
          +{card.value}
        </div>
      )}
      {isDiamond && (
        <div className={cn(
          "absolute top-2 left-2 text-[10px] font-bold leading-none px-1.5 py-0.5 rounded",
          "bg-black/40",
          theme.valueColor
        )}>
          {card.value}
        </div>
      )}

      {/* Type label (top-right) */}
      <div className={cn(
        "absolute top-2 right-2 text-[9px] uppercase tracking-widest font-semibold opacity-60",
        theme.nameColor
      )}>
        {card.type === CardType.ELEMENT ? card.element.slice(0, 3)
          : isDiamond ? "DMD"
          : isRainbow ? "RBW"
          : isBlock   ? "BLK"
          : isReshuffle ? "RSH"
          : isTrap ? "TRP"
          : "RVV"}
      </div>

      {/* Central icon */}
      <div className="flex-1 flex items-center justify-center w-full">
        {card.type === CardType.ELEMENT && card.element === Element.ROCK     && <RockIcon     className={cn(dims.icon, theme.iconColor)} />}
        {card.type === CardType.ELEMENT && card.element === Element.SCISSORS && <ScissorsIcon className={cn(dims.icon, theme.iconColor)} />}
        {card.type === CardType.ELEMENT && card.element === Element.PAPER    && <PaperIcon    className={cn(dims.icon, theme.iconColor)} />}
        {isBlock      && <BlockIcon      className={cn(dims.icon, theme.iconColor)} />}
        {isRainbow    && <RainbowIcon    className={cn(dims.icon)} />}
        {isReshuffle  && <ReshuffleIcon  className={cn(dims.icon, theme.iconColor)} />}
        {isTrap       && <TrapIcon       className={cn(dims.icon, theme.iconColor)} />}
        {isRevive     && <ReviveIcon     className={cn(dims.icon, theme.iconColor)} />}
        {isDiamond    && <DiamondIcon    className={cn(dims.icon, theme.iconColor)} />}
      </div>

      {/* Bottom label + effect */}
      <div className="w-full flex flex-col items-center gap-0.5">
        <div className={cn(
          "w-full text-center font-display leading-none",
          dims.name, theme.nameColor
        )}>
          {card.type === CardType.ELEMENT
            ? `${theme.label} +${card.value}`
            : isDiamond
            ? `${theme.label} ×${card.value}`
            : theme.label}
        </div>
        {dims.effect && effectText && (
          <p className={cn(
            "w-full text-center leading-tight line-clamp-3 opacity-60 px-0.5",
            dims.effect, theme.nameColor
          )}>
            {effectText}
          </p>
        )}
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
      <div className="absolute inset-2 rounded-xl opacity-50" />
      <div className="absolute inset-4 rounded-lg opacity-30" />
      <div className="w-6 h-6 opacity-20">
        <DiamondIcon className="text-white" />
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
