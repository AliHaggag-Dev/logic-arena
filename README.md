<div align="center">

```
██╗      ██████╗  ██████╗ ██╗ ██████╗     █████╗ ██████╗ ███████╗███╗   ██╗ █████╗
██║     ██╔═══██╗██╔════╝ ██║██╔════╝    ██╔══██╗██╔══██╗██╔════╝████╗  ██║██╔══██╗
██║     ██║   ██║██║  ███╗██║██║         ███████║██████╔╝█████╗  ██╔██╗ ██║███████║
██║     ██║   ██║██║   ██║██║██║         ██╔══██║██╔══██╗██╔══╝  ██║╚██╗██║██╔══██║
███████╗╚██████╔╝╚██████╔╝██║╚██████╗    ██║  ██║██║  ██║███████╗██║ ╚████║██║  ██║
╚══════╝ ╚═════╝  ╚═════╝ ╚═╝ ╚═════╝    ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝
```

**Program your robot. Outsmart your opponent. Dominate the arena.**

[![TypeScript](https://img.shields.io/badge/TypeScript-99.5%25-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Three.js](https://img.shields.io/badge/Three.js-r3f-black?style=flat-square&logo=three.js)](https://threejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=flat-square&logo=socket.io)](https://socket.io/)

[**Live Demo**](#) · [**Documentation**](#project-documentation) · [**Report Bug**](https://github.com/Ali-Haggag7/logic-arena/issues)

</div>

---

## What is Logic Arena?

Logic Arena is a **competitive coding platform** where developers write scripts in **AliScript** — a custom domain-specific language — to control autonomous robots that battle in a physics-driven 3D arena. Think LeetCode meets StarCraft.

> *"The best robot isn't the fastest — it's the most intelligent."*

Unlike traditional games, **you don't play Logic Arena with a keyboard**. You program your robot's behavior before the match, and watch your logic execute in real-time against opponents. Every win is a proof of your algorithmic thinking.

---

## ✨ Features

### 🤖 AliScript — Custom Combat Language
Write robot behavior scripts using Logic Arena's own programming language. Commands like `MOVE_FORWARD`, `FIRE_LASER`, `IF distance < 300 THEN FIRE`, and `ACTIVATE_SHIELD` give your robot its intelligence. The script engine parses, validates, and executes your logic in a sandboxed environment.

### ⚡ Real-Time Physics Engine
Built on a custom game engine with vector-based physics, collision detection, and projectile simulation. The engine runs server-side at 20 ticks/second, broadcasting state to all clients via **Socket.io**. Every movement, rotation, and impact is computed with precision.

### 🎮 3D Arena Renderer
The battle arena is rendered in **Three.js / React Three Fiber** — a full 3D environment with dynamic lighting, obstacle geometry, robot meshes, and particle effects. What you see is exactly what the physics engine computed.

### 🎬 Match Replay System
Every match is recorded as a series of snapshots (every 500ms). After the battle, you can watch a full **2D canvas replay** with frame-by-frame playback, speed control (0.5x / 1x / 2x), and a scrubber timeline. Analyze exactly where your strategy won or lost.

### 🏆 Tournament Bracket System
Run 4-player or 8-player tournaments with automatic bracket generation. The system handles quarter-finals → semi-finals → finals progression, automatically advancing winners. A live SVG bracket visualization updates in real-time as matches complete.

### 📊 Operator Profile & Match History
Every player has a full stats dashboard showing total matches, wins, losses, win rate %, and a complete match history table with opponent names, results, and durations — all pulled from live database queries.

### 📖 Interactive AliScript Docs
An in-app documentation page with a live **script playground** — type AliScript commands and see them parsed instantly. Includes a full command reference table with category filters.

### 🥇 Neural Rankings (Leaderboard)
Global leaderboard ranked by performance. Every match outcome updates player ranks in the database.

---

## 🏗️ Architecture

Logic Arena is a **pnpm monorepo** with three distinct packages:

```
logic-arena/
├── apps/
│   ├── client/          # Next.js 15 — Frontend
│   └── server/          # NestJS 11 — Backend API + WebSocket
└── packages/
    └── engine/          # Shared Game Engine (TypeScript)
```

### Data Flow

```
[Player writes AliScript] 
        ↓
[Client sends script via Socket.io]
        ↓
[NestJS MatchGateway — script sandboxed in engine]
        ↓
[Game Engine: physics tick every 50ms]
        ↓
[State broadcast to all clients]
        ↓
[Three.js renders the frame]
        ↓
[Snapshot saved to PostgreSQL every 500ms]
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React Three Fiber, TypeScript |
| Backend | NestJS 11, Socket.io, JWT Auth |
| Game Engine | Custom TypeScript engine (shared package) |
| Database | PostgreSQL + Prisma ORM |
| Monorepo | pnpm workspaces |
| Styling | CSS-in-JS, Cyberpunk design system |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database

### Installation

```bash
# Clone the repo
git clone https://github.com/Ali-Haggag7/logic-arena.git
cd logic-arena

# Install all dependencies
pnpm install

# Set up environment variables
cp apps/server/.env.example apps/server/.env
# Fill in DATABASE_URL, DIRECT_URL, JWT_SECRET
```

### Database Setup

```bash
cd apps/server
npx prisma db push
npx prisma generate
```

### Running the Project

```bash
# Terminal 1 — Start the backend
pnpm --filter server start:dev

# Terminal 2 — Start the frontend
pnpm --filter client dev
```

Open [http://localhost:3000](http://localhost:3000) — register an account and enter the arena.

---

## 🎮 How to Play

1. **Register** an account and log in
2. Go to **BATTLE_LOBBY** and join or create a match
3. Open the **Script Console** inside the arena
4. Write your AliScript strategy:

```
IF distance < 400 THEN FIRE_LASER
IF health < 30 THEN ACTIVATE_SHIELD
MOVE_FORWARD
IF distance < 200 THEN LAUNCH_MISSILE
```

5. Hit **EXECUTE** — your robot follows your logic in real-time
6. After the match, review your **Match Replay** to learn from every frame

---

## 📜 AliScript Reference

| Command | Category | Description |
|---------|----------|-------------|
| `MOVE_FORWARD` | Movement | Move robot forward |
| `MOVE_BACKWARD` | Movement | Move robot backward |
| `MOVE_LEFT` / `MOVE_RIGHT` | Movement | Strafe left / right |
| `FIRE_LASER` | Combat | Fire laser projectile |
| `LAUNCH_MISSILE` | Combat | Launch high-damage missile |
| `ACTIVATE_SHIELD` | Defense | Activate damage shield |
| `IF [condition] THEN [command]` | Logic | Conditional execution |
| `WAIT` | Control | Pause execution |

---

## 📁 Project Documentation

| Document | Description |
|----------|-------------|
| [System Architecture](./docs/system-architecture.md) | Data flow, components, security model |
| [Script Sandboxing](./docs/script-sandboxing.md) | Browser-side script isolation approaches |
| [ERD Diagram](./docs/erd-diagram.md) | Full database schema |
| [Game Rules](./docs/game-rules.md) | Physics, combat, and scoring rules |
| [Folder Structure](./docs/folder-structure.md) | Monorepo layout and conventions |

---

## 🗺️ Roadmap

- [x] Custom AliScript language engine
- [x] Real-time multiplayer with Socket.io
- [x] 3D arena renderer (Three.js / R3F)
- [x] JWT authentication system
- [x] Match history & player profiles
- [x] Match replay system
- [x] Tournament bracket system
- [x] Interactive AliScript documentation
- [ ] AliScript WHILE loops & variables
- [ ] Field of View (FOV) system
- [ ] Fog of War
- [ ] Training Mode (vs. AI bot)
- [ ] Racing Mode (reach the endpoint)
- [ ] Docker + Redis for production scaling
- [ ] University competition admin panel

---

## 👨‍💻 Author

**Ali Haggag** — Computer Science Student, building the future of competitive programming education.

[![GitHub](https://img.shields.io/badge/GitHub-Ali--Haggag7-181717?style=flat-square&logo=github)](https://github.com/Ali-Haggag7)

---

<div align="center">

**Logic Arena** — *Where code becomes combat.*

⭐ Star this repo if it impressed you

</div>