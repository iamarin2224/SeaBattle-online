# Classic Sea Battle — Real-Time Multiplayer Web Game

A browser-based naval strategy game inspired by vintage hand-drawn ballpoint pen notebooks on warm graph paper. Features real-time 1v1 multiplayer, tactical air support, anti-air defense systems, radar scanning, an in-game coin economy, and solo practice against naval AI.

---

## 🎨 Art Direction & Visual Identity

The interface captures the tactile aesthetic of an illustrated nautical notebook:
- **Warm graph-paper background**: Textured ivory parchment (`#F7F0DD` / `#FFFCF4`) with pale-blue gridlines (`#C7D9E7`).
- **Blue ballpoint pen sketches**: Dark indigo outlines (`#302A78`) and inner deck lines.
- **Top-down naval vessels**: Hand-drawn SVG illustrations spanning full ship lengths (Aircraft Carrier, Battleship, Cruiser, Submarine, Destroyer).
- **Damage markings**: Aggressive red pencil `X` crosses for confirmed hits, hand-drawn splash ripples for misses, and cartoon puff smoke clouds for sunk vessels.
- **Tactical overlays**: Diagonal red pencil hatching for anti-air defended rows, radar wave pulses, and targeting sector reticles.
- **Authentic sound effects**: Procedural Web Audio API sound synthesizer (pencil scratch, water splash, cannon explosion, sonar ping, coin chime, fanfare) with instant global mute toggle.

---

## 🚀 System Architecture

```
Classic Sea Battle
├── client/                     # Next.js 16 (App Router) + React 19 + Tailwind CSS + Socket.IO Client
│   ├── src/
│   │   ├── app/                # Layout, Page, and Global Paper Styling
│   │   ├── components/         # Grid, Ship & Nautical Illustrations, Player Badges
│   │   ├── features/           # Lobby, Ship Placement, Battle, Tactical Arsenal, Victory Modal
│   │   ├── lib/                # Audio Synthesizer, Socket Manager, Solo AI Bot
│   │   └── types/              # Game & Combat Domain Types
├── server/                     # Persistent Node.js + Express + TypeScript + Socket.IO Server
│   ├── src/
│   │   ├── game/               # Board math, Ship validation, Combat engine, Filtered state snapshots
│   │   ├── rooms/              # Room lifecycle, 6-char room codes, Token hashing, Reconnect grace
│   │   ├── socket/             # Typed Socket.IO event handlers
│   │   ├── validation/         # Zod schemas for all client payloads
│   │   ├── app.ts              # Express app with CORS and /health endpoint
│   │   └── config.ts           # Game rules, economy, and power-up configs
│   └── tests/                  # 23 Unit & Integration tests (Vitest)
└── package.json                # Root convenience scripts
```

---

## ⚓ Game Rules & Mechanics

### 1. Board & Fleet
- **Grid**: Default 15×15 (Rows A–O, Columns 1–15). Also supports 10×10 Classic (Rows A–J, Columns 1–10).
- **Fleet**: 5 ships occupying 17 cells:
  - **Aircraft Carrier** (5 cells)
  - **Battleship** (4 cells)
  - **Cruiser** (3 cells)
  - **Submarine** (3 cells)
  - **Destroyer** (2 cells)
- Ships can be placed horizontally or vertically. Ships cannot overlap or exceed board bounds.

### 2. Tactical Arsenal (Advanced Mode)
- **Row Airstrike** (10 coins): Bomber aircraft strikes all 15 cells of a chosen enemy row. Blocked if the opponent has active Air Defence on that row!
- **Carpet Bomb** (15 coins): Heavy bomber blankets a 3×3 sector centered on the target coordinate (clamped to board edges).
- **Radar Scan** (8 coins): Scans a 3×3 sector and returns the count of enemy ship cells detected without damaging them or revealing exact coordinates.
- **Air Defence** (12 coins): Deploys anti-air batteries on a friendly row (visualized with diagonal red pencil hatching). Intercepts and completely nullifies the next enemy Row Airstrike on that row.
- **Precision Strike** (6 coins): Guided missile targeting a high-value single coordinate.

### 3. Economy
- Both players start with **100 coins**.
- **+2 coins** awarded for each successful hit.
- **+5 coins** awarded for sinking an enemy vessel.
- **+25 coins** awarded to match winner (**+10 coins** consolation to loser).
- Coins reset to 100 on every fresh match/rematch. All deductions and awards are strictly server-authoritative and idempotent.

### 4. Hidden Information Security
- **Strict Privacy**: The server holds authoritative state. Every outbound client payload (`getFilteredGameState`) strips all un-hit enemy ship coordinates. The enemy fleet cannot be inspected via developer tools or network payloads.

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js v18+ (tested on Node v25)
- npm v9+

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd SeaBattle-online

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 2. Run Tests

Execute the comprehensive 23-test suite covering placement, bounds, overlapping, hit/miss detection, ship sinking, victory detection, air defense interception, radar filtering, coin economy, and live Socket.IO multiplayer flows:

```bash
npm run test
```

### 3. Start Development Servers

Run the backend and frontend in separate terminals:

**Terminal 1 (Backend Server):**
```bash
npm run dev:server
# Server starts at http://localhost:4000
```

**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
# Next.js starts at http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Production Deployment Guide

### A. Deploy Persistent Backend to Render

1. Create a **New Web Service** on [Render](https://render.com/).
2. Connect your Git repository.
3. Configure the service:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Health Check Path**: `/health`
4. Set Environment Variables:
   - `PORT`: `4000` (or Render's automatic `$PORT`)
   - `CORS_ORIGIN`: `https://your-frontend-app.vercel.app` (your Vercel frontend URL)
5. Deploy. Copy your Render service URL (e.g., `https://sea-battle-server.onrender.com`).

> ⚠️ **Note on In-Memory Rooms**: Match states are held in server memory for maximum real-time performance. If the server instance restarts, active in-memory rooms are reset.

---

### B. Deploy Frontend to Vercel

1. Import your Git repository into [Vercel](https://vercel.com/).
2. In Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
3. Add Environment Variable:
   - `NEXT_PUBLIC_SOCKET_URL`: `https://sea-battle-server.onrender.com` (your Render backend URL)
4. Deploy.

---

## 🧪 Tested Capabilities

- [x] Room creation with collision-resistant 6-character room codes (`K7PX4Q`)
- [x] Shareable direct join links (`?room=CODE`)
- [x] Session tokens and 60-second grace period reconnection
- [x] 15×15 Extended and 10×10 Classic board sizing
- [x] Full manual ship placement with rotation (`R` key) and auto-placement algorithm
- [x] Server-authoritative turn alternating and combat resolution
- [x] Tactical Arsenal abilities: Row Airstrike, Carpet Bomb, Radar Scan, Air Defence, Precision Strike
- [x] Air defense interception of airstrikes
- [x] Zero-leak hidden information projection
- [x] Procedural Web Audio API sound effects with mute toggle
- [x] Rematch agreement workflow
- [x] Solo practice mode against intelligent hunt-and-seek AI
