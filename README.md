<div align="center">

```
██╗      ██████╗  ██████╗ ██╗ ██████╗     █████╗ ██████╗ ███████╗███╗   ██╗ █████╗
██║     ██╔═══██╗██╔════╝ ██║██╔════╝    ██╔══██╗██╔══██╗██╔════╝████╗  ██║██╔══██╗
██║     ██║   ██║██║  ███╗██║██║         ███████║██████╔╝█████╗  ██╔██╗ ██║███████║
██║     ██║   ██║██║   ██║██║██║         ██╔══██║██╔══██╗██╔══╝  ██║╚██╗██║██╔══██║
███████╗╚██████╔╝╚██████╔╝██║╚██████╗    ██║  ██║██║  ██║███████╗██║ ╚████║██║  ██║
╚══════╝ ╚═════╝  ╚═════╝ ╚═╝ ╚═════╝    ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═╝  ╚═╝
```

**v3.1.0 | Program your robot. Outsmart your opponent. Dominate the arena.**

[![TypeScript](https://img.shields.io/badge/TypeScript-97.5%25-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs)](https://nestjs.com/)
[![Three.js](https://img.shields.io/badge/Three.js-r3f-black?style=flat-square&logo=three.js)](https://threejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-010101?style=flat-square&logo=socket.io)](https://socket.io/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa)](https://logicarena.dev)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![Live](https://img.shields.io/badge/Live-logicarena.dev-22d3ee?style=flat-square&logo=vercel)](https://logicarena.dev)

[**Live Demo (v2.9.0)**](https://logicarena.dev) · [**Documentation**](#project-documentation) · [**Report Bug**](https://github.com/Ali-Haggag7/logic-arena/issues)

</div>

---

## What is Logic Arena?

Logic Arena is a **competitive coding platform** where developers write scripts in **AliScript** — a custom domain-specific language — to control autonomous robots that battle in a physics-driven 3D arena. Think LeetCode meets StarCraft.

> *"The best robot isn't the fastest — it's the most intelligent."*

Unlike traditional games, **you don't play Logic Arena with a keyboard**. You program your robot's behavior before the match, and watch your logic execute in real-time against opponents. Every win is a proof of your algorithmic thinking.

---

## ✨ Core Features

### 🤖 AliScript v2.5 — Custom Combat Language
Write robot behavior scripts using Logic Arena's custom language. Now supports **Dictionaries, State Machines, Dot Notation**, advanced sensory arrays, and **Swarm Intelligence** via a secure broadcast protocol. Strict server-side execution sandboxing limits script size, logic timeouts (TLE quotas), whitelisted commands, and applies execution rate limiting.

### ⚡ Real-Time Physics & FOV System
Features vector-based physics, collision detection, and projectile simulations running at 20 ticks/second. Robots possess an FOV (Field of View) and SCAN system tracking 15-degree rotation behavior. Tactical choices consume points through a robust Energy & STASIS system.

### 🎮 3D Arena Renderer & Garage
The battle arena is rendered in **Three.js / React Three Fiber** — a full 3D environment with dynamic lighting, obstacle geometry, AAA robot meshes, and particle effects synchronized via **Socket.io**. Unlock and equip unique custom robot chassis models in the **Garage**.

### 💼 Economy & Black Market
Earn progression through battles and campaigns, and spend your currency in the **Black Market** to unlock custom paints, premium tracer rounds, and elite chassis models.

### 🏆 Global Leaderboard & Spectator Mode
Watch top-tier players clash in real time. The **Spectator Mode** features a zero-payload overhead architecture allowing users to securely "watch" live matches directly from the Global Leaderboard, complete with live viewer counts.

### 🌍 Campaign & LeetCode-Style Challenges
Progress through a multi-stage **Algorithmic Warfare Campaign** where each level tests specific logic paradigms, or dynamically initiate challenges against active opponents globally across the dashboard.

### 🛡️ Enterprise-Grade Security
Built with a 4-Layer security architecture:
1. **Perimeter:** HttpOnly Cookies & rate limiting.
2. **Database:** ORM payload protection and sanitization.
3. **Execution:** AliScript AST Sandbox hardening & memory quotas.
4. **Frontend:** React XSS DOM protection.

### 📱 PWA Support & Multi-Theme System
Toggle between Cyberpunk, Light, and Obsidian Ember themes. Fully Progressive Web App support ensures it's installable locally with offline pages, safe-area mapping, and a frictionless mobile-first dashboard experience.

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
[Player writes AliScript v2.5] 
        ↓
[Client sends script via request payload / Socket.io]
        ↓
[Server parses & evaluates AST securely in Sandbox]
        ↓
[Game Engine: physics tick every 50ms (20 ticks/sec)]
        ↓
[State delta broadcast to Match Room + Spectators]
        ↓
[React Three Fiber renders the frame]
        ↓
[Snapshot saved to database / Redis every tick]
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React Three Fiber, Framer Motion, TailwindCSS |
| Backend | NestJS 11, Socket.io, JWT Auth, Cloudinary (Avatars) |
| Production / Scaling | Docker + Nginx, Redis (Upstash) for presence + rate limiting |
| Packages / Engine | Custom typescript physics engine, AST logic-parser |
| Database | PostgreSQL + Prisma ORM |
| PWA Integration | Service Worker, webmanifest |
| Monorepo | pnpm workspaces |

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
# Fill in DATABASE_URL, DIRECT_URL, JWT_SECRET, REDIS_URL, CLOUDINARY keys
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

1. **Register** an account and log in.
2. Go to **Lobby** and challenge an opponent or join the **Campaign**.
3. Open the **Script Console** inside the arena.
4. Write your AliScript strategy:

```text
IF GET_DISTANCE(ENEMY) < 400
  FIRE
END
MOVE_FAST
```

5. Hit **EXECUTE** — your robot follows your logic in real-time.
6. Check the **Leaderboard** to track your global ranking and combat analytics.

---

## 📜 AliScript v2.5 Reference

| Category | Commands / Operators |
|----------|-------------|
| **Movement** | `MOVE`, `MOVE_FAST`, `BACKUP`, `STOP`, `PATHFIND` |
| **Actions** | `FIRE`, `BURST_FIRE`, `SCAN`, `WAIT` |
| **Variables/Data** | `SET`, Dictionaries (`state.mode = "attack"`), State Machines |
| **Control Flow** | `IF` / `ELSE` / `END`, `WHILE` / `DO` / `END` |
| **Logic/Operators** | `AND`, `OR`, `NOT`, `!=`, `<=`, `>=`, parentheses grouping |
| **Sensing** | `GET_DISTANCE()`, `GET_HEALTH()`, `GET_ENERGY()` |
| **Functions** | `FUNCTION`, `CALL` |
| **Swarm/Comms** | `BROADCAST`, `RECEIVE` |

---

## 📁 Project Documentation

| Document | Description |
|----------|-------------|
| [System Architecture](./docs/system-architecture.md) | Data flow, backend services, security model |
| [Script Sandboxing](./docs/script-sandboxing.md) | Server-side AST script isolation & TLE quotas |
| [ERD Diagram](./docs/erd-diagram.md) | Full PostgreSQL database schema |
| [Game Rules](./docs/game-rules.md) | Physics, combat, Energy system, and scoring rules |
| [Folder Structure](./docs/folder-structure.md) | Monorepo layout and architectural conventions |
| [AliScript Language](./docs/aliscript-language.md) | Complete language syntax and reference guide |
| [Rotation System Guide](./docs/rotation-system-guide.md) | Deep dive into robot FOV and scanner mechanics |

---

## 🗺️ Roadmap Progress

- [x] Custom AliScript language engine (v2.5)
- [x] Real-time multiplayer with Socket.io
- [x] 3D arena renderer (Three.js / R3F)
- [x] OAuth + JWT authentication system
- [x] Match history, Radar charts & Combat Analytics
- [x] Match replay system (2D Canvas)
- [x] Tournament bracket system
- [x] Dictionaries & State Machines
- [x] Swarm Intelligence (Broadcast protocol)
- [x] Black Market & Economy System
- [x] Robot Garage (Custom AAA 3D Models)
- [x] Docker + Redis for production scale
- [x] Live Spectator Mode & Viewer counts
- [x] PWA support & Mobile-first dashboard
- [x] LeetCode-style Campaign Mode
- [x] 4-Layer Architecture Security Hardening
- [ ] Fog of War
- [ ] University competition admin panel
- [ ] AliScript IDE with syntax highlighting

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