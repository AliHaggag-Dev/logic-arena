# CHANGELOG

## 2026-04-05

### [0.2.0] - The Server-Engine Integration

The `packages/engine` module has been successfully integrated with the NestJS server using WebSockets. This crucial step merged the core game logic with the server architecture, enabling real-time communication and game state synchronization.

**Technical Scars and Resolutions:**

*   **Issue:** Fixed 'Module not found' by reconfiguring `outDir` in `nest-cli.json` and switching to manual `node dist/...` execution.
*   **Issue:** Resolved PowerShell-specific errors by replacing `rm -rf` with `Remove-Item` and `&&` with `;`.
*   **Issue:** Handled `EADDRINUSE` by identifying and killing ghost processes on ports 3000/3001 using `taskkill`.

**Key Technical Achievement:**

*   Successfully linked `@logic-arena/engine` using `pnpm` workspace syntax.

**Current Status:** The server operates at 60 FPS (or 30), and robot position broadcasting is functioning efficiently, providing a synchronized and seamless gaming experience.

## [0.3.0] - The Visual Pulse & State Synchronization

Successfully synchronized the Backend physics engine with the Frontend Canvas renderer, achieving 60 FPS neon-glow robot movement.

### Technical Scars and Resolutions:
- **Issue:** Fixed 'Array(0)' state issue by enforcing a **Singleton Pattern** using `@Global()` in `GameModule`, ensuring Gateway and Service share the same engine instance.
- **Issue:** Resolved TypeScript compilation errors in Monorepo by fixing `isolatedModules` conflicts and correctly using `export type` for shared interfaces.
- **Issue:** Fixed Frontend rendering lag by correcting object mapping (accessing `position.x` instead of `x`) and implementing `requestAnimationFrame` for smooth Canvas drawing.

### Key Technical Achievement:
- Established a stable **Full-Stack Event Pipeline**: GameLoop (Engine) -> Socket.io (Server) -> HTML5 Canvas (Client).

### Current Status: 
- Neon robots are dynamically moving in the Arena with zero lag, fully synchronized with server-side physics.

## [0.4.0] - The Combat Engine & Lethal Logic (2026-04-06)

Successfully transformed the visual simulation into a functional **Combat Engine**, implementing projectiles, health mechanics, and advanced collision physics.

### Technical Scars and Resolutions:
- **Issue:** Resolved `data.robots is not iterable` error by implementing **Payload Guarding** in the Frontend to handle both legacy Arrays and new GameState Objects.
- **Issue:** Fixed **Projectile Ghosting** (bullets disappearing instantly) by offsetting the spawn point (`ROBOT_RADIUS + 5`) to prevent self-collision on frame zero.
- **Issue:** Overcame **Monorepo Build Path** hell by identifying the nested `dist` structure (`dist/apps/server/src/main.js`) and correcting the execution path.
- **Issue:** Optimized **Rendering Layers** by reversing the draw order (Robots -> Projectiles) to ensure high-visibility neon sparks.

### Key Technical Achievement:
- Developed a **Bidirectional Combat Pipeline**: Server triggers `fire()` -> Engine calculates trajectory/collision -> Client renders dynamic Health Bars and Neon Sparks.
- Implemented **Elastic Robot-to-Robot Collisions** with overlap resolution to prevent physics "clipping".

### Current Status:
- The Arena is now a "Live Warzone". Robots fire synchronized projectiles, sustain damage, and enter a "Dead State" upon zero health. The foundation for the Logic Compiler is now 100% solid.

## [0.5.0] - The Birth of AliScript (The Logic Compiler) - 2026-04-07

Successfully implemented a custom **Logic Parser** and **Execution Engine**, allowing players to program robot behavior using a simplified scripting language (AliScript).

### Technical Scars and Resolutions:
- **Issue: The "Recursive Firing" Bug:** Fixed robots firing like machine guns by implementing an **Edge-Triggered Logic Latch** (Only trigger action when condition state changes from `false` to `true`).
- **Issue: Monorepo Path Resolution:** Overcame `MODULE_NOT_FOUND` errors by correctly mapping `@logic-arena/logic-parser` in `tsconfig.json` and ensuring the package is built into `/dist` before server execution.
- **Issue: Socket.io Dependency Loop:** Resolved frontend lag and connection drops by stabilizing the `useEffect` hooks in `Arena.tsx`, ensuring the socket listener remains active without unnecessary re-renders.
- **Issue: TypeScript Type Mismatch:** Fixed `number` vs `string` indexer errors in the `logicStates` Map by normalizing AST indices to string keys.

### Key Technical Achievement:
- **Custom Compiler Pipeline:** Created a full flow from **String Script** -> **Lexer/Parser** -> **AST** -> **Server-side Evaluation** -> **Real-time Execution**.
- **Visual Debugging Suite:** Integrated **Neon Tracer Lines** and **Live Logic Logs** to provide immediate feedback on script performance.

### Current Status:
- The Arena now has a "Brain". Robots are no longer puppets; they are autonomous agents responding to logical conditions. The system is ready for the next level: **Pathfinding & FOV (Field of View)**.

## [0.6.0] - The Stateful Mind & Predictive Prep - 2026-04-08

Elevated the **AliScript Engine** from reactive to stateful, enabling robots to remember past states and prepare for kinematic calculations.

### Technical Scars and Resolutions:
- **Issue: The Memory-less Robot:** Fixed the inability to track state changes by implementing a `Map`-based persistent memory per robot instance on the server.
- **Issue: Static Targeting:** Added velocity identifiers (`target_vx`, `target_vy`) to lay the groundwork for Predictive Aiming algorithms.
- **Issue: UI Bottleneck:** Resolved the single-robot control limitation by adding a Neon-styled Robot Switcher in the `CommandConsole`.

### Key Technical Achievement:
- **Stateful Logic Execution:** Successfully deployed scripts using `SET` variables that compare across execution frames (e.g., Counter-attack logic based on health delta).

### Current Status:
- Robots now possess **Persistent Intelligence**. They can remember, compare, and react to environmental changes over time. The bridge between raw physics and high-level strategy is officially built. Ready for: **The 3D Visual Overhaul & Predictive Aiming Challenges**.

## [0.7.0] - The Sensory Update & Visual Stability - 2026-04-08

Finalized the core user experience by merging high-performance visuals with a responsive spatial audio system and optimizing the 3D rendering pipeline.

### Technical Scars and Resolutions:
- **Issue: Rendering Crash (External Assets):** Overcame fatal `Failed to fetch` errors from external GLB providers by implementing **Procedural Neon Models** built with native Three.js geometries, ensuring 100% offline stability.
- **Issue: Performance Lag (Bloom Overhead):** Resolved major FPS drops by transitioning to a **Stealth Matte Aesthetic**, removing heavy post-processing shaders while maintaining a premium Cyberpunk look.
- **Issue: Silent Combat & Autoplay Policy:** Integrated a robust audio engine using `use-sound` and implemented an interaction-based unlock to bypass browser audio restrictions.

### Key Technical Achievement:
- **Unified Feedback Loop:** Successfully synchronized **Multi-Sensory Feedback** where a single logic event (e.g., `health < last_h`) triggers a simultaneous visual flash, particle burst, and spatial audio "hit" sound.
- **Procedural Asset Pipeline:** Engineered a lightweight, shader-based robot model system that responds dynamically to state changes (color, rotation, and hovering) without external dependencies.

### Current Status:
- The Arena is now **Fully Interactive & Battle-Ready**. Players receive instant visual and auditory confirmation for every logical event. The foundation is rock-solid for the next massive leap: **Advanced AI Tactics (v1.0.0 Pre-Alpha)**.