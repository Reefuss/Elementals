export interface ArtThemeStyle {
  bgFrom:    string; // tailwind gradient-from class
  bgTo:      string; // tailwind gradient-to class
  textColor: string; // icon / value text color
  glowColor: string; // CSS box-shadow rgba
}

export const ART_THEME_STYLES: Record<string, ArtThemeStyle> = {
  // ── Rock ─────────────────────────────────────────────
  rock_solid:        { bgFrom: "from-amber-900/70",    bgTo: "to-slate-900/90",   textColor: "text-amber-400",   glowColor: "rgba(251,191,36,0.45)"  },
  rock_forge:        { bgFrom: "from-orange-900/70",   bgTo: "to-stone-900/90",   textColor: "text-orange-400",  glowColor: "rgba(249,115,22,0.45)"  },
  rock_ancient:      { bgFrom: "from-yellow-900/70",   bgTo: "to-zinc-900/90",    textColor: "text-yellow-400",  glowColor: "rgba(234,179,8,0.45)"   },
  rock_titan:        { bgFrom: "from-amber-800/60",    bgTo: "to-indigo-950/90",  textColor: "text-amber-300",   glowColor: "rgba(252,211,77,0.45)"  },
  // ── Scissors ─────────────────────────────────────────
  scissors_sharp:    { bgFrom: "from-blue-900/70",     bgTo: "to-slate-950/90",   textColor: "text-blue-300",    glowColor: "rgba(147,197,253,0.45)" },
  scissors_blade:    { bgFrom: "from-indigo-900/70",   bgTo: "to-slate-900/90",   textColor: "text-indigo-300",  glowColor: "rgba(165,180,252,0.45)" },
  scissors_swift:    { bgFrom: "from-sky-900/70",      bgTo: "to-slate-950/90",   textColor: "text-sky-300",     glowColor: "rgba(125,211,252,0.45)" },
  scissors_void:     { bgFrom: "from-cyan-950/70",     bgTo: "to-slate-900/90",   textColor: "text-cyan-300",    glowColor: "rgba(103,232,249,0.45)" },
  // ── Paper ─────────────────────────────────────────────
  paper_scroll:      { bgFrom: "from-purple-900/70",   bgTo: "to-slate-900/90",   textColor: "text-purple-400",  glowColor: "rgba(192,132,252,0.45)" },
  paper_parchment:   { bgFrom: "from-violet-950/70",   bgTo: "to-gray-950/90",    textColor: "text-violet-400",  glowColor: "rgba(167,139,250,0.45)" },
  paper_arcane:      { bgFrom: "from-fuchsia-900/70",  bgTo: "to-slate-900/90",   textColor: "text-fuchsia-400", glowColor: "rgba(232,121,249,0.45)" },
  paper_void:        { bgFrom: "from-purple-800/60",   bgTo: "to-indigo-950/90",  textColor: "text-purple-300",  glowColor: "rgba(216,180,254,0.45)" },
  // ── Block ────────────────────────────────────────────
  block_null:        { bgFrom: "from-slate-800/70",    bgTo: "to-gray-950/90",    textColor: "text-slate-300",   glowColor: "rgba(100,116,139,0.35)" },
  block_stone:       { bgFrom: "from-stone-800/70",    bgTo: "to-slate-950/90",   textColor: "text-stone-300",   glowColor: "rgba(120,113,108,0.35)" },
  // ── Rainbow ──────────────────────────────────────────
  rainbow_prismatic: { bgFrom: "from-violet-900/70",   bgTo: "to-fuchsia-950/90", textColor: "text-white",       glowColor: "rgba(255,255,255,0.35)" },
};

export function getThemeStyle(artTheme: string): ArtThemeStyle {
  return ART_THEME_STYLES[artTheme] ?? ART_THEME_STYLES["block_null"];
}
