# System Architecture (v2.9.0)

Logic Arena utilizes a modular, full-stack monorepo architecture built for performance, security, and real-time multiplayer orchestration.

## 🏗️ High-Level Infrastructure

| Component | Technology | Responsibility |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16, React Three Fiber, TailwindCSS | SSR routing, 3D Canvas rendering, Dashboard UI, PWA support |
| **Backend API** | NestJS 11, JWT | User management, Auth, Black Market economy, Tournaments, DB interaction |
| **Real-time Server**| NestJS WebSocket Gateway (Socket.io) | Match synchronization, Spectator Mode, Delta-diff broadcasting |
| **Caching Layer** | Redis (Upstash / Local Docker) | Leaderboard rankings, online presence, rate limiting, replay caching |
| **Game Engine** | Custom TypeScript Engine | Deterministic 2D Physics, A* Pathfinding, FOV Raycasting |
| **Logic Parser** | Custom AST Evaluator | Sandboxed execution of AliScript, State Machines, Swarm Intelligence |
| **Database** | PostgreSQL + Prisma ORM | Persistent storage (Users, Scripts, Matches, Preferences, Loadouts) |
| **CDN** | Cloudinary | Secure Avatar image hosting and optimization |

---

## 🔄 Core Data Flow

### 1. Pre-Match (Dashboard & Garage)
- Users authenticate via OAuth (Google/GitHub) or local credentials.
- Users manage their scripts, equip chassis and paints in the Garage, and view the Leaderboard.
- Heavy reads (Leaderboards, Match History) are served instantly from the **Redis Cache Layer**.
- Writes (Purchasing items, Equipping loadouts) go through strict CQRS (Command Query Responsibility Segregation) pipelines to PostgreSQL.

### 2. Match Initialization
- Users enter the `Lobby` and issue a challenge or join a Tournament/Campaign.
- The **Match Gateway** instantiates a `MatchEngine` and retrieves the players' selected AliScript logic from the database.
- The initial arena layout, obstacles, and robot loadouts (health, chassis models, tracer colors) are passed to the clients.

### 3. The 50ms Real-Time Tick Loop
- The engine operates at **20 ticks per second** (50ms per tick).
- **Evaluation:** The server-side AST Sandbox evaluates each robot's script for the current tick, generating intent (move, shoot, rotate).
- **Physics Engine:** Resolves collisions, movement, pathfinding (A*), and FOV constraints based on intent.
- **Delta-Diff Compression:** The server compares the new state to the previous state and broadcasts a highly compressed "delta diff" payload via Socket.io.
- **Client Rendering:** React Three Fiber (R3F) receives the delta diff and smoothly interpolates robot positions and projectile trajectories at 60+ FPS locally.

### 4. Spectator Mode (Zero-Overhead Orchestration)
- Non-players clicking "Watch" are connected to the active Match Room with an `isSpectator` socket flag.
- The server strips their ability to send game commands (firing, movement).
- Spectators receive the identical delta-diff broadcast stream without forcing the engine to duplicate logic loops.

---

## 🛡️ 4-Layer Security Architecture

Logic Arena is built like a bank vault. Because users submit custom code to run on our servers, security is our absolute highest priority.

### Layer 1: Perimeter Hardening
- **HttpOnly Cookies:** JWT tokens are never exposed to `localStorage` or JavaScript, completely nullifying XSS token theft.
- **ThrottlerModule:** Global rate limiting is applied via Redis to prevent DDoS and API abuse.
- **CORS & Helmets:** Strict origin policies ensure only `logicarena.dev` can interact with the backend sockets.

### Layer 2: Database & Payload Protection
- **Zod Validation:** Every incoming payload is deeply verified against strict schemas before hitting the database.
- **Prisma Transactions:** Economy transactions (Black Market purchases) use ACID-compliant atomic transactions to prevent race conditions or duplicate spending.
- **CQRS:** Read operations are strictly segregated from mutation commands.

### Layer 3: Execution Sandbox (AliScript TLE & Isolation)
- **No `eval()`:** AliScript is parsed into an Abstract Syntax Tree (AST). It is never executed as native JavaScript.
- **Memory Quotas:** Each robot gets a strictly isolated memory map. Cross-robot memory contamination is impossible.
- **Time Limit Exceeded (TLE):** A deterministic quota system tracks instruction execution counts per tick (e.g., maximum `WHILE` loop iterations). Scripts exceeding their quota are halted instantly to prevent CPU starvation.

### Layer 4: Frontend XSS Protection
- React natively escapes all DOM inputs.
- Custom parsers sanitize markdown and user-generated text (like script names and usernames) before rendering.
- **Cloudinary Signatures:** Avatar uploads are verified server-side with secret signatures, preventing users from bypassing size limits or uploading malicious files.