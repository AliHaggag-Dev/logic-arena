# Folder Structure

This project follows a strict monorepo architecture managed by `pnpm workspaces`. It enforces a clean separation of concerns between the frontend (Next.js), the backend API (NestJS), and the core physics engine.

```text
logic-arena/
├── apps/
│   ├── client/                  # Next.js 16 Frontend (App Router, PWA)
│   │   ├── public/              # Static assets, 3D GLB models, sounds
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/         # Next.js route handlers
│   │   │   │   ├── (auth)/      # Login, Register, Password Recovery layouts
│   │   │   │   ├── (dashboard)/ # Main app: Dashboard, Leaderboard, Black Market, Garage, Tournaments, Campaign
│   │   │   │   ├── (public)/    # Static pages: Docs, Privacy, Terms
│   │   │   │   ├── arena/       # The 3D Battle Arena & Spectator Views
│   │   │   │   └── layout.tsx
│   │   │   ├── components/      # Shared Atomic UI (Buttons, Modals, Navbars)
│   │   │   ├── context/         # React Context (Auth, Socket)
│   │   │   ├── hooks/           # Custom hooks (useGameState, useMediaQuery)
│   │   │   ├── lib/             # API client, utility functions
│   │   │   └── providers/       # Theme and global state providers
│   │   └── tailwind.config.ts
│   │
│   ├── server/                  # NestJS 11 Backend
│   │   ├── prisma/              # PostgreSQL schema & migrations
│   │   ├── src/
│   │   │   ├── common/          # Guards, Interceptors, PrismaService, RedisService
│   │   │   ├── game/
│   │   │   │   └── core/        # Logic evaluator & block executors
│   │   │   ├── modules/
│   │   │   │   ├── auth/        # JWT Auth, Google/GitHub OAuth, OTP
│   │   │   │   ├── users/       # Profiles, Black Market, Leaderboard, Combat Stats
│   │   │   │   ├── tournaments/ # Bracket generation and lifecycle
│   │   │   │   ├── campaign/    # LeetCode-style level orchestration
│   │   │   │   ├── scripts/     # CRUD for AliScript payloads
│   │   │   │   └── matches/
│   │   │   │       ├── gateway/ # Socket.io orchestration, Spectator mode, Delta diffing
│   │   │   │       └── match.engine.ts
│   │   │   └── main.ts
│   │   └── Dockerfile
│   │
├── packages/
│   ├── engine/                  # Headless 2D Physics Engine
│   │   └── src/
│   │       ├── core/            # Robot updater, bounding boxes
│   │       ├── physics/         # Spatial vectors, collision detection, Raycasting
│   │       └── pathfinder/      # A* navigation grid
│   └── logic-parser/            # Custom Compiler
│       └── src/                 # Tokenizer, AST Parser for AliScript
│
├── docs/                        # Project documentation
│   ├── aliscript-language.md
│   ├── erd-diagram.md
│   ├── folder-structure.md
│   ├── game-rules.md
│   ├── script-sandboxing.md
│   └── system-architecture.md
│
├── docker-compose.yml           # Local production orchestration
└── package.json
```

## Architectural Rationale

### 1. Monorepo Isolation (`apps/` vs `packages/`)
By extracting the `engine` and `logic-parser` into their own NPM packages within the workspace, we guarantee that the backend evaluator and frontend replay viewer can both depend on the exact same deterministic physics code without circular dependencies.

### 2. Next.js Route Groups
The `apps/client` heavily utilizes Next.js Route Groups (`(auth)`, `(dashboard)`, `(public)`) to isolate entirely different UX layouts. The `(dashboard)` contains the sidebar and sticky header, while the `arena/` directory sits outside of all layouts to maximize canvas rendering performance.

### 3. NestJS CQRS Pattern
Inside the backend `modules/`, complex domains like `users` and `tournaments` follow a Command Query Responsibility Segregation (CQRS) pattern. Read operations (e.g., getting a profile or leaderboard) go through a `QueryService` optimized with Redis. Write operations (e.g., buying a Black Market item) go through a `CommandService` using Prisma SQL transactions.

### 4. Decomposed WebSocket Gateway
The `apps/server/src/modules/matches/gateway/` uniquely separates the massive Socket.io responsibilities into focused domains:
- `match.state.ts`: Tracks all active sockets, matches, and spectator viewers in memory.
- `match.loop.ts`: The central 50ms interval loop driving the `engine`.
- `match.delta-diff.ts`: Compresses state payloads by only broadcasting values that changed since the last tick.
- `match.persistence.ts`: Flushes completed match telemetry to PostgreSQL.