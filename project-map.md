# Logic Arena — Project Map

## Overview

Competitive real-time robot battle simulator. TypeScript monorepo (pnpm workspaces).
Players write AliScript to program robots that fight in real-time 3D arena battles.

---

## Monorepo Structure

```
logic-arena/
├── apps/
│   ├── client/          # Next.js 16 App Router frontend (269 src files)
│   └── server/          # NestJS 11 backend (139 src files)
├── packages/
│   ├── engine/          # @logic-arena/engine — Core game engine (15 src files)
│   └── logic-parser/    # @logic-arena/logic-parser — AliScript parser
├── docs/                # Architecture, game rules, ERD, language reference
├── docker-compose.yml   # Redis + Server + Client
└── tsconfig.json        # Root TypeScript config
```

### Packages

| Package | Path | Entry | Description |
|---------|------|-------|-------------|
| `engine` | `packages/engine/` | `src/index.ts` | Game loop, physics (collision, raycast, spatial grid), FOV, energy/STASIS |
| `logic-parser` | `packages/logic-parser/` | `src/index.ts` | Lexer, parser, AST types for AliScript |

### Apps

| App | Path | Tech | Port | Description |
|-----|------|------|------|-------------|
| `server` | `apps/server/` | NestJS 11 + Prisma + Redis + Socket.IO | 3001 | Auth, matches, tournaments, scripts, campaign, users |
| `client` | `apps/client/` | Next.js 16 + R3F + Tailwind v4 | 3000 | Arena 3D, dashboard, settings, auth, docs |

### Infrastructure

- **Database**: PostgreSQL via Prisma ORM (6 models)
- **Cache**: Redis (Upstash) — profiles, leaderboard, rate limiting, challenge state, JWT sessions
- **Auth**: JWT via HttpOnly cookie (`la_session`) + Bearer fallback, Google/GitHub OAuth
- **CDN**: Cloudinary for avatar uploads
- **WebSocket**: Socket.IO with Redis adapter (multi-instance)
- **CI/CD**: GitHub Actions deploy workflow

---

## Feature Progress

### ✅ User Preferences (Settings) — COMPLETED

Full user preferences system spanning client UI ↔ API ↔ DB ↔ Redis cache.

**Server — Data Layer** (`apps/server/src/modules/users/`):

| File | Responsibility |
|------|---------------|
| `types.ts` | `ArenaPreferences` & `NotificationSettings` interfaces, Redis key helper, defaults |
| `users.dto.ts` | `UpdateArenaPreferencesDto` & `UpdateNotificationSettingsDto` (class-validator) |
| `users.controller.ts` | `PUT /users/preferences`, `PUT /users/notifications` endpoints |
| `users-command.service.ts` | Merges partial prefs into DB JSON columns, invalidates Redis cache |
| `prisma/schema.prisma` | `arenaPreferences Json?` + `notificationSettings Json?` on User model |

**Client — Settings UI** (`apps/client/src/app/(dashboard)/settings/`):

| File | Responsibility |
|------|---------------|
| `page.tsx` | Section orchestrator (identity, security, appearance, arena, notifications) |
| `components/SettingsLayout.tsx` | Desktop (2-col sidebar) / Mobile (accordion) layout |
| `components/Shared.tsx` | Primitives: `SectionHeader`, `SaveButton`, `Toggle`, `SettingsInput` |
| `components/PreferencesSection.tsx` | Arena prefs UI: default robot, graphics quality, sound, music. Debounced save (800ms), optimistic updates, guest lock |
| `components/NotificationsSection.tsx` | Notification toggles: challenge reqs, tournament alerts, match results |
| `components/IdentitySection.tsx` | Avatar upload, username/email editing |
| `components/SecuritySection.tsx` | Password change, account deletion with confirmation |
| `components/AppearanceSection.tsx` | Theme picker (cyberpunk/light/desert) via `next-themes` |

**Arena Integration** (`apps/client/src/app/arena/page.tsx`): Reads `soundFx` and `graphicsQuality` from preferences on mount.

**Pattern**: `useState` + `useEffect` load from `GET /users/profile`, debounced `PUT` on change, optimistic updates with rollback.

---

## Module Maps

### Server Modules

| Module | Files | Purpose |
|--------|-------|---------|
| `common/` | 11 | Auth guard, Redis, Prisma, Cloudinary, Email, Sandbox, validation, HTTP cache interceptor |
| `auth/` | 7 + 2 strategies | JWT login, OAuth (Google/GitHub), password mgmt, registration |
| `users/` | 6 | CQRS: profiles, preferences, black market, leaderboard |
| `matches/` | 4 + 9 gateway | Match lifecycle: lobby, loop, state, persistence, social, win-condition, delta-diff |
| `scripts/` | 4 | AliScript CRUD |
| `tournaments/` | 5 | CQRS: bracket generation, tournament lifecycle |
| `campaign/` | 5 + 6 levels | 10-level AliScript challenges |
| `game/core/` | 1 + 10 evaluator + 6 executor + 6 pathfinder | Server-side game logic, AST execution, action dispatch, A* pathfinding |

### Client Routes

| Route Group | Pages | Purpose |
|-------------|-------|---------|
| `(auth)/` | 6 | Login, register, forgot/reset password, verify email, OAuth callback |
| `(dashboard)/` | 10 | Dashboard, black market, campaign, docs, garage, leaderboard, lobby, profile, replay, settings, tournaments |
| `(public)/` | 8 | Bug report, contact, cookies, feature requests, how-it-works, patch notes, privacy, terms |
| `arena/` | 1 | Battle arena with Scene3D, CommandConsole, HUD |

### Engine Subsystems

| File | Purpose |
|------|---------|
| `core/game-loop.ts` | 20 ticks/second loop orchestrating all systems |
| `core/robot-updater.ts` | Per-robot state delta application |
| `physics/collision-obstacles.ts` | Circle-rect collision against obstacles |
| `physics/collision-projectiles.ts` | Projectile hit detection + damage |
| `physics/collision-robots.ts` | Robot-robot elastic collision |
| `physics/raycast.ts` | Line-of-sight / SCAN system |
| `physics/spatial-grid.ts` | Broad-phase collision optimization |
| `physics/wall-bounds.ts` | Arena boundary enforcement |
| `energy-manager.ts` | Energy regen, STASIS detection, validation |
| `fov-calculator.ts` | Field of View cone math (120° default) |
| `sandbox-limits.ts` | Execution constraints (max iterations, timeouts) |

### Parser Subsystems

| File | Purpose |
|------|---------|
| `lexer/lexer.ts` | Tokenization with keyword recognition |
| `parser/parser.ts` | Top-level program parser |
| `parser/expression-parser.ts` | Expression parsing (binary, unary, ternary, call) |
| `parser/statement-parser.ts` | Statement parsing (if, while, for, assign, return) |
| `types/ast.types.ts` | AST node type definitions |
| `types/token.types.ts` | Token type definitions |

---

## Recent Commits (last 10)

```
0e223dd fix(client): improve UX, accessibility, and auth loading states
af0215d perf(client): memoize components and hoist static render data
6dcb5c1 perf(client): optimize R3F showroom rendering and loading
a2f5b00 fix(client): add frontend lifecycle cleanup and async cancellation guards
bc5a35c fix(cache): expand invalidation coverage and tighten HTTP cache policy
97a3178 perf(realtime): type payloads, optimize delta diff, scope lobby broadcasts
640d39a fix(backend): implement atomic writes and batch persistence for data integrity
dee7085 fix(engine): implement lifecycle cleanup and realtime leak prevention
5f75c32 perf(redis): implement P2 Redis layer
e93df3c perf(redis): implement P1 Redis caching
```

---

## Dev Commands

| Command | Description |
|---------|-------------|
| `pnpm run dev:all` | Start all services (engine watch + parser watch + server dev) |
| `pnpm --filter client run build` | Build client |
| `pnpm --filter server run build` | Build server |
| `pnpm --filter server run lint` | Lint server |
| `pnpm --filter server run test` | Run server tests |
| `pnpm --filter server run test:e2e` | Run server e2e tests |
| `pnpm add -w <pkg>` | Install dependency at root |
| `pnpm --filter <name> add <pkg>` | Install dependency in specific package |
