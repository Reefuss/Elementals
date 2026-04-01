import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          950: "#020208",
          900: "#050510",
          800: "#08081a",
          700: "#0d0d28",
          600: "#131338",
          500: "#1a1a4e",
          400: "#22226a",
        },
        rock: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          glow: "#FFD700",
        },
        scissors: {
          50:  "#f0f4ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          glow: "#93c5fd",
        },
        paper: {
          50:  "#fdf4ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d946ef",
          600: "#c026d3",
          700: "#a21caf",
          glow: "#e879f9",
        },
        block: {
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          glow: "#9ca3af",
        },
      },
      fontFamily: {
        display: ["Cinzel", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "rock-glow":     "0 0 20px 4px rgba(251, 191, 36, 0.4), 0 0 60px 10px rgba(251, 191, 36, 0.15)",
        "scissors-glow": "0 0 20px 4px rgba(147, 197, 253, 0.4), 0 0 60px 10px rgba(147, 197, 253, 0.15)",
        "paper-glow":    "0 0 20px 4px rgba(232, 121, 249, 0.4), 0 0 60px 10px rgba(232, 121, 249, 0.15)",
        "block-glow":  "0 0 20px 4px rgba(156, 163, 175, 0.4), 0 0 60px 10px rgba(156, 163, 175, 0.15)",
        "rainbow-glow":"0 0 20px 4px rgba(255, 100, 200, 0.5), 0 0 60px 10px rgba(100, 200, 255, 0.15)",
        "card":        "0 4px 24px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.4)",
        "card-hover":  "0 8px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.5)",
        "panel":       "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
      keyframes: {
        "queue-pulse": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%":       { opacity: "1",   transform: "scale(1.08)" },
        },
        "orbit": {
          from: { transform: "rotate(0deg) translateX(60px) rotate(0deg)" },
          to:   { transform: "rotate(360deg) translateX(60px) rotate(-360deg)" },
        },
        "score-pop": {
          "0%":   { transform: "scale(1)" },
          "50%":  { transform: "scale(1.6)" },
          "100%": { transform: "scale(1)" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        "reveal-flash": {
          "0%":   { opacity: "0", transform: "scale(0.8)" },
          "60%":  { opacity: "1", transform: "scale(1.05)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "queue-pulse": "queue-pulse 2s ease-in-out infinite",
        "orbit":       "orbit 4s linear infinite",
        "score-pop":   "score-pop 0.4s ease-in-out",
        "shimmer":     "shimmer 2s linear infinite",
        "float":       "float 3s ease-in-out infinite",
        "reveal":      "reveal-flash 0.4s ease-out forwards",
      },
      backgroundImage: {
        "star-field": "radial-gradient(ellipse at 20% 50%, #1a1a4e 0%, #050510 70%)",
        "rainbow-card":
          "linear-gradient(135deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff)",
      },
    },
  },
  plugins: [],
};

export default config;
