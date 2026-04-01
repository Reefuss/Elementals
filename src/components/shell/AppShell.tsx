"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getStoredUsername } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";

const NAV_ITEMS = [
  { href: "/",           label: "Home",       icon: HomeIcon       },
  { href: "/collection", label: "Collection", icon: GridIcon       },
  { href: "/battle",     label: "Battle",     icon: SwordsIcon     },
] as const;

/** Wraps non-game pages with top currency bar + bottom nav */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname    = usePathname();
  const router      = useRouter();
  const coins = usePlayerStore((s) => s.coins);
  const pity  = usePlayerStore((s) => s.pityPoints);

  const hideShell = pathname.startsWith("/game/") || pathname === "/welcome";

  // Redirect to welcome screen if no username is stored
  useEffect(() => {
    if (hideShell) return;
    if (!getStoredUsername()) {
      router.replace("/welcome");
    }
  }, [pathname]);

  // Hide shell entirely on game arena and welcome pages
  if (hideShell) return <>{children}</>;

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

function SwordsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
      <line x1="5" y1="14" x2="9" y2="18" />
      <line x1="7" y1="21" x2="3" y2="17" />
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
