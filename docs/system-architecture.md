# System Architecture (Logic Arena)

Logic Arena utilizes a modern, decoupled monorepo architecture built with Node.js and TypeScript.

## Core Pillars
1. **Frontend (Next.js 16)**: Renders the Cyberpunk UI, dashboards, and the 3D Canvas via React Three Fiber.
2. **Backend (NestJS 11)**: Manages APIs, WebSockets, Match Orchestration, Tournaments, and the Black Market.
3. **Physics Engine (Headless TypeScript)**: Calculates deterministic 2D physics and collisions at 20 ticks/sec.
4. **AliScript Parser**: Tokenizes, parses, and securely evaluates user scripts via a strict AST engine.
5. **Database & Cache**: PostgreSQL (via Prisma ORM) for persistence, and Redis for real-time presence, state caching, and throttling.

## The Match Pipeline (Real-Time Synchronicity)
The most complex part of Logic Arena is maintaining perfect synchronization between the backend physics engine and the 3D visual frontend.

1. **Script Injection**: Players deploy their code via the API. The server stores the script payload in memory via the `MatchGateway`.
2. **The Game Loop**: Inside the NestJS server, a `setInterval` runs at exactly 50ms (20 TPS).
3. **AST Evaluation**: Every tick, the `MatchEngine` passes the arena state to the `LogicEvaluator`, which parses and executes the AliScript AST for each robot.
4. **Physics Application**: The evaluator applies velocity forces (`MOVE`), triggers projectiles (`FIRE`), and manages collisions against walls and obstacles (SOLID, LAVA, TRAP).
5. **Delta Diffing**: The server compares the new state with the previous tick's state. It only broadcasts *changes* (e.g., if a robot didn't move, its coordinates are omitted from the payload) using the `match.delta-diff.ts` logic.
6. **Client Interpolation**: The Next.js client receives the delta payload via Socket.IO. The React Three Fiber `useFrame` hook uses `THREE.Vector3.lerp()` to smoothly interpolate robot meshes between the 20hz server ticks at a fluid 60 FPS on the client's screen.

## Campaign Match Pipeline
Campaign battles use a dedicated `CampaignFightRunner` instead of the multiplayer room loop.

1. The client emits `campaignFight` with a level id, player script, spawn data, and obstacle layout.
2. The server validates level access, loads the hidden enemy script, creates a `MatchEngine`, and stores a `CampaignSession` keyed by user id.
3. The session interval runs every 50ms. Each interval advances 3 fixed physics steps at `1 / 60`, evaluates robot logic every 6 fixed steps, and emits `campaignFrame`.
4. The match ends on combat win condition or when `stepCount >= CAMPAIGN_MATCH_MAX_STEPS`. `CAMPAIGN_MATCH_MAX_STEPS` is imported from `@logic-arena/engine/constants` by both server and client so the timer cannot drift.
5. On completion, the server emits `campaignFightResult` with winner, completion token, final tick, and `fightDurationTicks`. The client uses the streamed frame buffer for temporary replay controls.

### Pause and Resume
Campaign pause is authoritative on the server:

* `campaign:pause` sets `CampaignSession.paused = true`, records `pauseStartedAt = Date.now()`, and emits `campaign:pause-state`.
* While paused, the session loop returns before physics, logic, win checks, and frame advancement.
* `campaign:resume` calculates the paused duration, increments `totalPausedMs`, calls `MatchEngine.shiftTimestamps(pausedDuration)`, clears `pauseStartedAt`, and emits the updated pause state.

The timestamp shift updates `Robot.hitWallTimestamp`, `Robot.shieldHitTimestamp`, and active mine `Obstacle.createdAt` values. Cooldowns driven by virtual simulation time are already frozen by the paused loop, while the remaining wall-clock fields are moved forward so wall-hit sensors, shield-hit feedback, and mine arming are not shortened by real time spent paused.

## Replay Architecture
Multiplayer matches persist snapshot replay data in `Match.replayData` and expose it through `GET /users/matches/:matchId/replay`. Campaign level fights keep a temporary in-memory frame buffer on the client during the current level session. The campaign replay overlay is positioned over the canvas and provides play/pause, scrub, reset, and speed controls without changing the canvas aspect ratio.

## Workspace Exports and Build Order
Shared constants live in `packages/engine/src/constants.ts` and are consumed through subpath imports such as `@logic-arena/engine/constants`. Production Docker builds compile `@logic-arena/logic-parser` and `@logic-arena/engine` before compiling `apps/server`, then copy their `dist/` outputs into runtime space. The server `tsconfig` includes wildcard aliases for shared package subpaths so local pnpm links and clean container builds resolve the same way.

## Performance Architecture
Recent performance work focused on both Lighthouse page scores and arena runtime stability.

* Public and campaign pages use canonical metadata, reduced client-only work, dynamic imports for heavy components, and deferred analytics/GTM loading.
* React Three Fiber motion is decoupled from React state through an `InterpolationBuffer`, direct mesh mutation in `useFrame`, and UI snapshots throttled to 10 FPS.
* Environment rendering avoids per-frame object allocations, consolidates frame loops, uses instancing for repeated debris/asteroids, and avoids manual GLTF texture disposal so shared caches remain valid.
* Arena state cleanup clears interpolation snapshots, selected robot ids, socket user ids, training stats, and stale map themes on mount/unmount to avoid ghost state after soft navigation.

## Admin Command Center & Analytics
The architecture includes a comprehensive Admin subsystem located at `/admin`.
* **Throttling**: The admin tier utilizes a strict 300 requests/minute rate limit to prevent heavy analytics queries from degrading public gameplay.
* **Health & Security APIs**: Live monitoring of DB/Redis status, heap memory, and authentication metrics.

## PWA & Mobile-First Execution
Logic Arena heavily utilizes Next.js Route Groups and responsive designs.
* **Mobile Block Editor**: On mobile, the traditional code editor is replaced by a drag-and-drop Block Editor (`@dnd-kit`), avoiding mobile system keyboard occlusions. The blocks compile dynamically to AliScript before submission.
* **Layout Isolation**: The 3D arena renders entirely outside the main DOM tree of the dashboard, preventing React reconciliation overhead (Zero Re-render pipeline) and ensuring buttery smooth 60fps performance.

## Known Runtime Constraints
* Campaign replay frames are temporary for the active level session; persisted replay review remains the `/replay/[matchId]` path for completed multiplayer matches.
* Campaign pause currently shifts known wall-clock fields (`hitWallTimestamp`, `shieldHitTimestamp`, active mine `createdAt`). New `Date.now()`-backed engine fields must be added to `MatchEngine.shiftTimestamps()` when introduced.
* STASIS blocks AliScript execution for the affected robot until energy recovers; scripts must be written so they can restart cleanly after a STASIS reset.

## Security Architecture (4-Layer Defense)
1. **Perimeter Layer**: Global rate-limiting via Redis to thwart brute force attacks, along with HttpOnly cookies for JWT authentication.
2. **Execution Sandbox**: The `logic-parser` package is 100% sandboxed. There is no `eval()`. Code is converted to an AST and interpreted node-by-node, guaranteeing it cannot access Node.js APIs or infinite loops (enforced by TLE quotas).
3. **Database Layer**: Prisma ORM prevents SQL injection and enforces structural data integrity.
4. **Frontend Layer**: React intrinsically protects against XSS, and Zod validates all API payload schemas.
