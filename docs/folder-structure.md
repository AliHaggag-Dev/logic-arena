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
│   │   │   │   ├── (admin)/     # Admin Command Center and Analytics
│   │   │   │   ├── (dashboard)/ # Main app: Dashboard, Leaderboard, Black Market, Garage, Tournaments, Campaign
│   │   │   │   ├── (public)/    # Static pages: Docs, Privacy, Terms, Contact
│   │   │   │   ├── arena/       # The 3D Battle Arena & Spectator Views
│   │   │   │   └── layout.tsx
│   │   │   ├── components/      # Shared Atomic UI (Buttons, Modals, Navbars, 3D elements)
│   │   │   ├── context/         # React Context (Auth, Socket)
│   │   │   ├── hooks/           # Custom hooks (useGameState, useMediaQuery, useAdmin)
│   │   │   ├── lib/             # API client, utility functions, styling utilities
│   │   │   └── providers/       # Theme, Audio, and global state providers
│   │   └── tailwind.config.ts
│   │
│   ├── server/                  # NestJS 11 Backend
│   │   ├── prisma/              # PostgreSQL schema & migrations
│   │   ├── src/
│   │   │   ├── common/          # Guards, Interceptors, PrismaService, RedisService, Throttling
│   │   │   ├── game/
│   │   │   │   └── core/        # Logic evaluator & block executors, engine wrappers
│   │   │   ├── modules/
│   │   │   │   ├── admin/       # Admin analytics, feedback hub, health APIs
│   │   │   │   ├── auth/        # JWT Auth, Google/GitHub OAuth, OTP validation
│   │   │   │   ├── chatbot/     # Aria AI insights and tutoring
│   │   │   │   ├── users/       # Profiles, Black Market, Leaderboard, Combat Stats
│   │   │   │   ├── tournaments/ # Bracket generation and lifecycle
│   │   │   │   ├── campaign/    # LeetCode-style level orchestration
│   │   │   │   ├── scripts/     # CRUD for AliScript payloads
│   │   │   │   └── matches/
│   │   │   │       ├── gateway/ # Socket.io orchestration, CampaignSession runner, Spectator mode, Delta diffing
│   │   │   │       └── engine/  # Mode orchestration (Racing, Combat, Capture), hazards, mode managers
│   │   │   └── main.ts
│   │   └── Dockerfile
│   │
│   ├── ai-agent/                # AI Chatbot processing logic (Optional microservice)
│
├── packages/
│   ├── engine/                  # Headless 2D Physics Engine
│   │   └── src/
│   │       ├── constants.ts     # Shared arena, obstacle, and campaign timing constants
│   │       ├── core/            # Robot updater, bounding boxes, GameLoop
│   │       ├── physics/         # Spatial vectors, collision detection, Raycasting
│   │       ├── abilities/       # Tactical super powers (Cloak, Teleport, Mine, etc.)
│   │       └── pathfinder/      # Weighted A* navigation grid
│   └── logic-parser/            # Custom Compiler
│       └── src/                 # Tokenizer, AST Parser for AliScript Block & Text Editor
│
├── docs/                        # Project documentation
│   ├── aliscript-language.md
│   ├── arena-environments-modes.md
│   ├── erd-diagram.md
│   ├── folder-structure.md
│   ├── game-rules.md
│   ├── rotation-system-guide.md
│   ├── script-sandboxing.md
│   ├── system-architecture.md
│   └── website-guide.md
│
├── docker-compose.yml           # Production orchestration (DB, Server, Client, Redis)
└── package.json
```

## Architectural Rationale

### 1. Monorepo Isolation (`apps/` vs `packages/`)
By extracting the `engine` and `logic-parser` into their own NPM packages within the workspace, we guarantee that the backend evaluator and frontend replay viewer can both depend on the exact same deterministic physics code without circular dependencies.

### 2. Next.js Route Groups
The `apps/client` heavily utilizes Next.js Route Groups (`(auth)`, `(dashboard)`, `(public)`, `(admin)`) to isolate entirely different UX layouts. The `(dashboard)` contains the sidebar and sticky header, while the `arena/` directory sits outside of all layouts to maximize canvas rendering performance.

### 3. NestJS CQRS Pattern
Inside the backend `modules/`, complex domains like `users` and `tournaments` follow a Command Query Responsibility Segregation (CQRS) pattern. Read operations (e.g., getting a profile or leaderboard) go through a `QueryService` optimized with Redis. Write operations (e.g., buying a Black Market item) go through a `CommandService` using Prisma SQL transactions.

### 4. Decomposed WebSocket Gateway
The `apps/server/src/modules/matches/gateway/` uniquely separates the massive Socket.io responsibilities into focused domains:
- `match.state.ts`: Tracks all active sockets, matches, and spectator viewers in memory.
- `match.loop.ts`: The central interval loop driving the `engine`.
- `match.campaign.ts`: Dedicated server-side campaign fight runner with `CampaignSession`, pause/resume, fixed-step streaming, and completion-token emission.
- `match.delta-diff.ts`: Compresses state payloads by only broadcasting values that changed since the last tick (Delta compression).
- `match.persistence.ts`: Flushes completed match telemetry and replay snapshots to PostgreSQL.

### 5. Shared Subpath Exports
Shared engine constants are imported through `@logic-arena/engine/constants`, including `CAMPAIGN_MATCH_MAX_STEPS`. Keep constants in `packages/engine/src/constants.ts` and update package subpath exports when adding new shared runtime values.

### 6. Match Engine Domain Modules
The server-side `MatchEngine` delegates environment hazards to `MatchHazards` and game-mode variant setup to `MatchModeManager`. This keeps KOTH, CTF, Survival, Racing, lava, ice, and cyber EMP behavior out of the core tick orchestration.
