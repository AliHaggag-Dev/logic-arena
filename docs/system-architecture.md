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

## Admin Command Center & Analytics
The architecture includes a comprehensive Admin subsystem located at `/admin`.
* **Throttling**: The admin tier utilizes a strict 300 requests/minute rate limit to prevent heavy analytics queries from degrading public gameplay.
* **Health & Security APIs**: Live monitoring of DB/Redis status, heap memory, and authentication metrics.

## PWA & Mobile-First Execution
Logic Arena heavily utilizes Next.js Route Groups and responsive designs.
* **Mobile Block Editor**: On mobile, the traditional code editor is replaced by a drag-and-drop Block Editor (`@dnd-kit`), avoiding mobile system keyboard occlusions. The blocks compile dynamically to AliScript before submission.
* **Layout Isolation**: The 3D arena renders entirely outside the main DOM tree of the dashboard, preventing React reconciliation overhead (Zero Re-render pipeline) and ensuring buttery smooth 60fps performance.

## Security Architecture (4-Layer Defense)
1. **Perimeter Layer**: Global rate-limiting via Redis to thwart brute force attacks, along with HttpOnly cookies for JWT authentication.
2. **Execution Sandbox**: The `logic-parser` package is 100% sandboxed. There is no `eval()`. Code is converted to an AST and interpreted node-by-node, guaranteeing it cannot access Node.js APIs or infinite loops (enforced by TLE quotas).
3. **Database Layer**: Prisma ORM prevents SQL injection and enforces structural data integrity.
4. **Frontend Layer**: React intrinsically protects against XSS, and Zod validates all API payload schemas.