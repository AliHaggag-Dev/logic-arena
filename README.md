<div align="center">

```
██╗      ██████╗  ██████╗ ██╗ ██████╗     █████╗ ██████╗ ███████╗███╗   ██╗ █████╗
██║     ██╔═══██╗██╔════╝ ██║██╔════╝    ██╔══██╗██╔══██╗██╔════╝████╗  ██║██╔══██╗
██║     ██║   ██║██║  ███╗██║██║         ███████║██████╔╝█████╗  ██╔██╗ ██║███████║
██║     ██║   ██║██║   ██║██║██║         ██╔══██║██╔══██╗██╔══╝  ██║╚██╗██║██╔══██║
███████╗╚██████╔╝╚██████╔╝██║╚██████╗    ██║  ██║██║  ██║███████╗██║ ╚████║██║  ██║
╚══════╝ ╚═════╝  ╚═════╝ ╚═╝ ╚═════╝    ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝
```

**v2.3.0 | Program your robot. Outsmart your opponent. Dominate the arena.**

[![TypeScript](https://img.shields.io/badge/TypeScript-97.5%25-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Three.js](https://img.shields.io/badge/Three.js-r3f-black?style=flat-square&logo=three.js)](https://threejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=flat-square&logo=socket.io)](https://socket.io/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa)](https://logicarena.dev)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

[**Live Demo (v2.3.0)**](https://logicarena.dev) · [**Documentation**](#project-documentation) · [**Report Bug**](https://github.com/Ali-Haggag7/logic-arena/issues)

</div>

---

## What is Logic Arena?

Logic Arena is a **competitive coding platform** where developers write scripts in **AliScript** — a custom domain-specific language — to control autonomous robots that battle in a physics-driven 3D arena. Think LeetCode meets StarCraft.

> *"The best robot isn't the fastest — it's the most intelligent."*

Unlike traditional games, **you don't play Logic Arena with a keyboard**. You program your robot's behavior before the match, and watch your logic execute in real-time against opponents. Every win is a proof of your algorithmic thinking.

---

## ✨ Features

### 🤖 AliScript v2.2 — Custom Combat Language
Write robot behavior scripts using Logic Arena's custom language. Supports `AND`/`OR`/`!=`/`<=`/`>=` operators, parenthesis grouping, `BURST_FIRE` 3-shot spreads, and a full operator precedence tower. Strict server-side execution sandboxing limits script size, logic timeouts, whitelisted commands, and applies execution rate limiting.

### ⚡ Real-Time Physics & FOV System
Features vector-based physics, collision detection, and projectile simulations running at 20 ticks/second. Robots possess an FOV (Field of View) and SCAN system tracking 15-degree rotation behavior. Tactical choices consume points through a new robust Energy & STASIS system.

### 🎮 3D Arena Renderer
The battle arena is rendered in **Three.js / React Three Fiber** — a full 3D environment with dynamic lighting, obstacle geometry, robot meshes, and particle effects synchronized via **Socket.io**.

### 🎨 Multi-Theme System & Mobile-First Interface
Toggle between Cyberpunk, Light, and Desert themes. A fully mobile-first dashboard experience uses `MobileNav` and a smart `MobileHeader` for app-like feeling, completely customizable via a 5-section Settings page.

### 📱 PWA Support & Production Scalability
Fully Progressive Web App support ensures it's installable locally with offline pages, safe-area mapping, and theme syncing. Backed by Redis presence and a Dockerized backend infrastructure for production.

### 🎬 Replay Systems & Tournament Brackets
Post-match 2D canvas replay with playback control. Run 4/8-player tournaments with automatic bracket generation and live SVG updates.

### 🏆 Global Challenges & Campaign Mode
Progress through a 10-level solo Campaign Mode or dynamically initiate challenges against active opponents globally across the dashboard.

---

## 🏗️ Architecture

Logic Arena is a **pnpm monorepo** with distinct decoupled packages:

```text
logic-arena/
├── apps/
│   ├── client/          # Next.js 16 — Frontend (App Router, PWA)
│   └── server/          # NestJS 11 — Backend API + WebSocket
└── packages/
    ├── engine/          # Shared Game Engine (TypeScript)
    └── logic-parser/    # AST Parser & AliScript Evaluator
```

### Data Flow

```text
[Player writes AliScript v2.2] 
        ↓
[Client sends script via request payload / Socket.io]
        ↓
[Server parses & evaluates AST securely]
        ↓
[Game Engine: physics tick every 50ms (20 ticks/sec)]
        ↓
[State broadcast to all clients]
        ↓
[React Three Fiber renders the frame]
        ↓
[Snapshot saved to database every 500ms]
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React Three Fiber, TypeScript |
| Backend | NestJS 11, Socket.io, JWT Auth |
| Production / Scaling | Docker + Nginx, Redis (Upstash) for presence + rate limiting |
| Packages / Engine | Custom typescript engine, logic-parser |
| Database | PostgreSQL + Prisma ORM |
| PWA Integration | Service Worker |
| Monorepo | pnpm workspaces |
| Styling | Multi-theme system, TailwindCSS |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL database
- Redis instance

### Installation

```bash
# Clone the repo
git clone https://github.com/Ali-Haggag7/logic-arena.git
cd logic-arena

# Install all dependencies
pnpm install

# Set up environment variables
cp apps/server/.env.example apps/server/.env
# Fill in DATABASE_URL, DIRECT_URL, JWT_SECRET, REDIS_URL
```

### Database & Redis Setup

```bash
cd apps/server
npx prisma db push
npx prisma generate

# Ensure your Redis instance is ready and accessible based on your REDIS_URL
```

### Running the Project

```bash
# Start the full stack development environment synchronously
pnpm run dev:all
```

Open [http://localhost:3000](http://localhost:3000) — register an account and enter the arena.

---

## 🎮 How to Play

1. **Register** an account and log in
2. Go to **BATTLE_LOBBY** and join or create a match
3. Open the **Script Console** inside the arena
4. Write your AliScript strategy:

```text
IF distance < 400
  FIRE
END
MOVE_FAST
```

5. Hit **EXECUTE** — your robot follows your logic in real-time
6. After the match, review your **Match Replay** to learn from every frame

---

## 📜 AliScript v2.2 Reference

| Category | Commands / Operators |
|----------|-------------|
| **Movement** | `MOVE`, `MOVE_FAST`, `BACKUP`, `STOP`, `PATHFIND` |
| **Actions** | `FIRE`, `BURST_FIRE`, `SCAN`, `WAIT` |
| **Variables/State** | `SET` |
| **Control Flow** | `IF` / `ELSE` / `END`, `WHILE` / `DO` / `END` |
| **Logic/Operators** | `AND`, `OR`, `NOT`, `!=`, `<=`, `>=`, parentheses grouping |
| **Functions** | `FUNCTION`, `CALL` |
| **Booleans** | `TRUE`, `FALSE` |

---

## 📁 Project Documentation

| Document | Description |
|----------|-------------|
| [System Architecture](./docs/system-architecture.md) | Data flow, components, security model |
| [Script Sandboxing](./docs/script-sandboxing.md) | Server-side script isolation approaches |
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
- [x] AliScript WHILE loops & variables (done in v1.8.0)
- [x] FOV system (done)
- [x] Training Mode (done in v1.8.0)
- [x] Racing Mode (done in v1.8.0)
- [x] Docker + Redis for production (done in v2.0.0)
- [x] Multi-theme system
- [x] PWA support
- [x] Mobile-first dashboard
- [x] Campaign Mode
- [x] Script sandboxing
- [ ] Fog of War
- [ ] Energy System UI
- [ ] University competition admin panel
- [ ] AliScript IDE with syntax highlighting
- [ ] Spectator mode

---
<div align="center">

## 👨‍💻 Author

**Ali Haggag** — Computer Science Student, building the future of competitive programming education.

[![GitHub](https://img.shields.io/badge/GitHub-Ali--Haggag7-181717?style=flat-square&logo=github)](https://github.com/Ali-Haggag7)
[![Gmail](https://img.shields.io/badge/Gmail-Ali--Haggag7-red?style=flat-square&logo=gmail)](mailto:ali.haggag2005@gmail.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Ali--Haggag7-0077B5?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/ali-haggag7/)
[![Portfolio](https://img.shields.io/badge/Portfolio-Ali--Haggag7-180d2f?style=flat-square&logo=portfolio)](https://alihaggag.me/)

---

**Logic Arena** — *Where code becomes combat.*

⭐ Star this repo if it impressed you

</div>