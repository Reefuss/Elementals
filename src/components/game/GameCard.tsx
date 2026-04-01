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
    case Element.SUN:
      return {
        bg:         "bg-gradient-to-b from-[#1f1400] to-[#0f0900]",
        border:     "border-sun-500/40",
        iconColor:  "text-sun-400",
        nameColor:  "text-sun-300",
        glow:       "shadow-sun-glow",
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
  size?:     "xs" | "sm" | "md" | "lg";
  onClick?:  () => void;
  className?: string;
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
                  "border-sun-400":    card.type === CardType.ELEMENT && card.element === Element.SUN,
                  "border-moon-300":   card.type === CardType.ELEMENT && card.element === Element.MOON,
                  "border-star-400":   card.type === CardType.ELEMENT && card.element === Element.STAR,
                  "border-block-400":  isBlock,
                  "border-emerald-400": isReshuffle,
                  "border-red-400":    isTrap,
                  "border-amber-400":  isRevive,
                  "border-cyan-400":   isDiamond,
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
        {card.type === CardType.ELEMENT && card.element === Element.SUN  && <SunIcon      className={cn(dims.icon, theme.iconColor)} />}
        {card.type === CardType.ELEMENT && card.element === Element.MOON && <MoonIcon     className={cn(dims.icon, theme.iconColor)} />}
        {card.type === CardType.ELEMENT && card.element === Element.STAR && <StarIcon     className={cn(dims.icon, theme.iconColor)} />}
        {isBlock      && <BlockIcon      className={cn(dims.icon, theme.iconColor)} />}
        {isRainbow    && <RainbowIcon    className={cn(dims.icon)} />}
        {isReshuffle  && <ReshuffleIcon  className={cn(dims.icon, theme.iconColor)} />}
        {isTrap       && <TrapIcon       className={cn(dims.icon, theme.iconColor)} />}
        {isRevive     && <ReviveIcon     className={cn(dims.icon, theme.iconColor)} />}
        {isDiamond    && <DiamondIcon    className={cn(dims.icon, theme.iconColor)} />}
      </div>

      {/* Bottom label */}
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
