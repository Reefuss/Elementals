"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "rock" | "scissors" | "paper";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?:  Variant;
  size?:     Size;
  loading?:  boolean;
  children:  React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-indigo-500 to-indigo-700 text-white border border-indigo-400/30 " +
    "shadow-[0_4px_20px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_28px_rgba(99,102,241,0.6)]",
  secondary:
    "glass text-white border border-white/10 hover:border-white/20 hover:bg-white/5",
  ghost:
    "text-white/70 hover:text-white hover:bg-white/5",
  danger:
    "bg-gradient-to-b from-red-600 to-red-800 text-white border border-red-500/30",
  rock:
    "bg-gradient-to-b from-rock-500 to-rock-700 text-cosmic-900 font-semibold border border-rock-400/30 " +
    "shadow-rock-glow hover:shadow-[0_6px_32px_rgba(251,191,36,0.7)]",
  scissors:
    "bg-gradient-to-b from-scissors-400 to-scissors-600 text-cosmic-900 font-semibold border border-scissors-300/30 " +
    "shadow-scissors-glow",
  paper:
    "bg-gradient-to-b from-paper-400 to-paper-600 text-white font-semibold border border-paper-300/30 " +
    "shadow-paper-glow",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8  px-4  text-sm  rounded-lg",
  md: "h-11 px-6  text-sm  rounded-xl",
  lg: "h-14 px-10 text-base rounded-2xl",
};

export function Button({
  variant  = "primary",
  size     = "md",
  loading  = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.03, y: -1 }}
      whileTap={isDisabled  ? {} : { scale: 0.97, y: 0  }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={isDisabled}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 font-display tracking-wide",
        "transition-colors duration-200 focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
        "focus-visible:ring-offset-cosmic-900",
        "disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </span>
      )}
      <span className={cn("flex items-center gap-2", loading && "invisible")}>
        {children}
      </span>
    </motion.button>
  );
}
