"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";
import { useMissionStore } from "@/store/missionStore";

const NAV_ITEMS = [
  { href: "/",           label: "Home",       icon: HomeIcon       },
  { href: "/packs",      label: "Packs",      icon: PackIcon       },
  { href: "/collection", label: "Collection", icon: GridIcon       },
  { href: "/decks",      label: "Decks",      icon: LayersIcon     },
  { href: "/missions",   label: "Missions",   icon: CheckIcon      },
] as const;

/** Wraps non-game pages with top currency bar + bottom nav */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide shell entirely on the game arena page
  if (pathname.startsWith("/game/")) return <>{children}</>;

  const coins      = usePlayerStore((s) => s.coins);
  const pity       = usePlayerStore((s) => s.pityPoints);
  const gamesPlayed = useMissionStore((s) => s.gamesPlayedToday);
  const claimed    = useMissionStore((s) => s.claimedMilestones);
  const missionDot = gamesPlayed > 0 && claimed.length < 3;

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ── */}
      <div className="shrink-0 border-b border-white/[0.06]">
        <div className="max-w-[800px] mx-auto flex items-center justify-between px-4 py-2">
          <span className="font-display text-sm font-bold tracking-widest text-white/60 uppercase">
            Elementals
          </span>
          <div className="flex items-center gap-3">
            {/* Coins */}
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
              <CoinIcon className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-display text-xs font-bold text-amber-300">
                {coins.toLocaleString()}
              </span>
            </div>
            {/* Pity */}
            <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1">
              <StarSmallIcon className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-display text-xs font-bold text-purple-300">
                {pity}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page content ── */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      {/* ── Bottom nav ── */}
      <nav className="shrink-0 border-t border-white/[0.06] bg-cosmic-900/80 backdrop-blur-md">
        <div className="max-w-[800px] mx-auto flex items-stretch">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
            const hasDot = href === "/missions" && missionDot;

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex-1 flex flex-col items-center pt-1 pb-2.5 gap-1 transition-colors",
                  active ? "text-indigo-400" : "text-white/35 hover:text-white/60"
                )}
              >
                {/* Indicator sits flush above the icon */}
                <div className="w-8 h-0.5 mb-1.5 rounded-full overflow-hidden">
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="w-full h-full rounded-full bg-indigo-400"
                    />
                  )}
                </div>
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {hasDot && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  )}
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Inline SVG icons (no external dep)
// ─────────────────────────────────────────────

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function PackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function LayersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 12l3 3 5-5" />
    </svg>
  );
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="12" r="9" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#92400e" fontWeight="bold">C</text>
    </svg>
  );
}

function StarSmallIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <polygon points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9" />
    </svg>
  );
}
