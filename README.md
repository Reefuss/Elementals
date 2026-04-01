# Elementals — Cosmic Card Duel

A production-quality, real-time 1v1 competitive browser card game built with Next.js, TypeScript, Socket.IO, Framer Motion, and Tailwind CSS.

---

## Resolved Rules / Assumptions

| Issue | Resolution |
|---|---|
| Deck says "5 of each element" with 3 value variants | Each element gets: +3 ×2, +5 ×2, +8 ×1 = 5 cards |
| Special cards: "3 Block + 2 Rainbow" | = 5 cards ✓ matches stated total |
| Draw mechanic unspecified after turn 1 | Draw 4 at game start, draw 1 at the start of each subsequent round |
| Turn duration unspecified | 30-second server-enforced timer; auto-plays random card on expiry |

---

## Architecture

```
elementals/
├── server/                   Custom Node server (Express + Socket.IO + Next.js)
│   ├── index.ts              Entry point — serves both HTTP and WebSockets
│   ├── matchmaker.ts         Queue management and match pairing
│   ├── gameManager.ts        Authoritative server-side game state and rules application
│   └── socketHandlers.ts     Socket.IO event routing
│
├── src/
│   ├── lib/
│   │   ├── game/
│   │   │   ├── types.ts      All shared TypeScript types and enums
│   │   │   ├── constants.ts  Game constants (deck template, timings, etc.)
│   │   │   ├── deck.ts       Deck creation and shuffling
│   │   │   └── rules.ts      Pure rules engine (imported by server + client)
│   │   ├── socket/
│   │   │   ├── events.ts     Typed Socket.IO event contracts
│   │   │   └── client.ts     Singleton socket client factory
│   │   └── utils.ts          Utility helpers (cn, localStorage, card colors)
│   │
│   ├── store/
│   │   └── gameStore.ts      Zustand global state store
│   │
│   ├── hooks/
│   │   ├── useSocket.ts      Socket initialisation and event wiring
│   │   └── useGame.ts        Game actions and derived state
│   │
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx    Animated button component
│   │   │   └── modal.tsx     Animated modal component
│   │   ├── game/
│   │   │   ├── GameCard.tsx      Card component (all states + back + slot)
│   │   │   ├── Hand.tsx          Player hand with fan layout
│   │   │   ├── Scoreboard.tsx    Score pips + numeric display
│   │   │   ├── BattleArena.tsx   Central battlefield + reveal
│   │   │   ├── OpponentArea.tsx  Opponent info strip
│   │   │   ├── TurnTimer.tsx     Circular countdown timer
│   │   │   ├── RainbowTiebreak.tsx  Rainbow vs Rainbow modal
│   │   │   └── MatchResult.tsx   Victory / Defeat / Draw screen
│   │   └── lobby/
│   │       └── QueueState.tsx    Animated matchmaking waiting screen
│   │
│   └── app/
│       ├── globals.css           Design system: fonts, starfield, animations
│       ├── layout.tsx            Root layout
│       ├── page.tsx              Main menu + queue + match-found transition
│       └── game/[roomId]/
│           └── page.tsx          Game room — arena, hand, controls
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- npm 9+

### Steps

```bash
# 1. Clone / navigate into the project
cd Elementals

# 2. Install dependencies
npm install

# 3. Copy environment config
cp .env.example .env.local

# 4. Start the server (Next.js + Socket.IO on port 3001)
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in **two separate browser windows** to test 1v1 locally.

> Tip: Open one window in normal mode and one in incognito, or use two different browsers.

---

## Testing Multiplayer Locally

1. `npm run dev`
2. Open `http://localhost:3001` in Window A — enter a name, click **Enter Queue**
3. Open `http://localhost:3001` in Window B — enter a different name, click **Enter Queue**
4. Match starts automatically — play cards in both windows simultaneously

---

## Deployment

### Option A: Railway / Render / Fly.io (Node.js server)

```bash
# Build
npm run build

# Start (production)
npm start
```

Set environment variable:
```
PORT=3000
NODE_ENV=production
```

### Option B: Vercel + Separate Socket Server

Not recommended because Vercel functions are stateless (no persistent Socket.IO state). Deploy the server directory to Railway/Fly.io and set:
```
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
```

### Option C: Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
ENV NODE_ENV=production
CMD ["npm", "start"]
```

---

## Game Design Reference

### Element Interactions
```
Sun  ──beats──▶ Star
Star ──beats──▶ Moon
Moon ──beats──▶ Sun
```

### Special Cards
| Card | Effect |
|---|---|
| Block (×3) | Cancels all cards — no point awarded |
| Rainbow (×2) | Beats any element; vs Rainbow → tiebreak |

### Rainbow Tiebreak
Both players secretly pick Sun / Star / Moon.
Same element → re-vote. Winner of the rock-paper-scissors takes the point.

### Deck per Player (20 cards)
| Card | Count |
|---|---|
| Sun +3 | 2 |
| Sun +5 | 2 |
| Sun +8 | 1 |
| Moon +3 | 2 |
| Moon +5 | 2 |
| Moon +8 | 1 |
| Star +3 | 2 |
| Star +5 | 2 |
| Star +8 | 1 |
| Block | 3 |
| Rainbow | 2 |
| **Total** | **20** |

---

## Future Enhancements

- [ ] Persistent accounts + ELO rating
- [ ] Animated card dealing on game start
- [ ] Sound design (card play SFX, reveal sting, win fanfare)
- [ ] Custom card art per element
- [ ] Best-of-5 / best-of-7 match modes
- [ ] Spectator mode
- [ ] Mobile layout
- [ ] Replay viewer
- [ ] In-game chat
- [ ] Ranked matchmaking
