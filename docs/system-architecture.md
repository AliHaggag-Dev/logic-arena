# System Architecture (v2.2.0)

## Data Flow

1.  **User Interaction (Client-side - Next.js/React App Router):**
    *   Users interact with the web application through a Next.js frontend, structured by route groups: `(auth)`, `(dashboard)`, and `(public)`.
    *   Actions like logging in, creating/editing robot scripts, joining/creating matches are sent to the NestJS backend via REST API calls.
    *   Real-time match data (robot positions, health, events) is received from the NestJS backend via Socket.io.

2.  **Backend Processing (Server-side - NestJS):**
    *   **Authentication & Authorization:** Separated into 4 pure services (Registration, Login, Password, OAuth) to secure API endpoints logically.
    *   **User/Tournament Management (CQRS):** Separated strongly into Query (read operations, caching) and Command (mutate operations, DB writes) services for maximum scalability.
    *   **Match Orchestration:**
        *   Retrieves participating robot scripts from the database.
        *   The Match Gateway is decomposed into snapshot, state, persistence, and loop manager submodules.
        *   Feeds robot scripts to the Game Engine's internal tick synchronizer.
        *   Receives real-time updates and delta differences via WebSockets.

3.  **Game Engine (Dedicated Module/Packages):**
    *   The `engine` package acts as the standalone core containing the Physics, Memory Sync, Object definitions, and the `pathfinder/` logic (A* navigation).
    *   The backend's `game/core/evaluator/` module handles the `logic-parser` execution securely within an isolated `block-executor.ts` architecture mapping raw syntax trees to physical commands.
    *   Calculates physics deterministically without direct references to upstream user constraints.

4.  **Database (PostgreSQL via Prisma ORM):**
    *   Stores user profiles, OAuth links, scripts, and match telemetry (including compact replica tracking logs).

## Security

**Isolated Execution Environment for User Scripts:**

To prevent malicious user scripts from compromising the server, each robot script executes within a strictly isolated AST (Abstract Syntax Tree) block-execution sandbox.

*   **Server-side Sandboxing (Logic Evaluator Architecture):**
    *   The parser maps user scripts to safe structural nodes globally without leveraging native `eval()` or unstable `vm2` libraries.
    *   The `evaluator/` layer safely maps the AST execution across individual robots maintaining isolated Memory interfaces securely restricting cross-memory access arbitrarily.
    *   Resource limits (e.g. Max 10 loop iterations per tick limit) are automatically applied to prevent denial-of-service blockages.

**API Security:**

*   **Authentication:** JWT secures REST endpoints. Users receive tokens upon login across local or OAuth strategies organically.
*   **Authorization:** Role-based access control enforces script ownership limits natively.
*   **Input Validation:** Deeply validated using Zod schemas ensuring network injection is impossible reliably formatting endpoints accurately.

**Database Security:**

*   **Password Hashing:** Stored as `bcrypt` securely natively using explicitly tuned difficulty parameters.
*   **Data Restrictions:** Unique constraints natively applied across user profiles natively blocking duplicative states cleanly executing securely.