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

## [0.7.0] - The Sensory Update & Visual Stability

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

## [0.8.0] - The Sentient Intelligence Update - 2026-04-09

A massive leap from reactive bots to intelligent autonomous agents with full sensory and tactical capabilities.

### Technical Scars and Resolutions:
- **Issue: The Parser Bottleneck:** Fixed a major bug where commands on the same line (e.g., `MOVE FIRE`) were ignored. Resolved by implementing mandatory line-break appending (`\n`).
- **Issue: Type Mismatch (TS2339):** Resolved TypeScript build errors by implementing proper type guards for `ActionStatements` and `SetStatements` on the server.
- **Issue: Visual De-sync:** Fixed the "Static Vision" bug by binding the 3D Vision Cone and Robot Mesh directly to the `robot.rotation` state.
- **Issue: UI Overflow:** Re-engineered the Command Library to use a **Drop-up** mechanism with hidden scrollbars for a cleaner "Hacker" aesthetic.

### Key Technical Achievement:
- **Turing-Complete-ish Control:** The AliScript engine now handles complex, stateful behaviors, making the robots 100% script-driven. No default movement; every twitch is commanded by logic.

### Current Status:
- The system is now a **Stable Tactical Simulator**. We have FOV, Logic, VFX, and Audio working in perfect harmony.
- Ready for: **v1.2.0 - Pathfinding & Obstacle Avoidance**.

## [1.0.0-beta] - The Trinity Refactor - 2026-04-10

### Major Structural Overhaul:
- **Client Atomization:** Dismantled the "God Files" into a hook-driven architecture.
- **Engine Optimization:** Refactored core physics and collision logic for better maintainability.
- **Logic-Parser Decoupling:** Separated the AliScript interpreter from the view layer. The parser now functions as a pure logical entity, making it ready for server-side integration.

### Technical Scars and Resolutions:
- **Issue: Parser-View Dependency:** Fixed a tight coupling where the `logic-parser` was too dependent on client-side state. Now uses a clean, event-driven interface.
- **Issue: R3F Hook Deadlock:** Resolved the Canvas-context error by re-engineering the component tree.
- **Issue: TS Type Fragmentation:** Unified types across the workspace.

### Current Status:
- The "Trinity" (Client, Engine, Parser) is now fully modular. Ready for Server Refactoring.

## [1.0.1-beta] - The Physics & Combat Patch

### Bug Fixes:
- **Obstacle Adhesion Fix:** Resolved an issue where robots would permanently stick to red obstacles. Implemented a cooldown-based separation logic.
- **Ghost Respawn Fix:** Fixed a major combat bug where respawned robots became "invincible" due to stale collision references in the physics engine.
- **Physics Synchronization:** Improved projectile hit detection in `collision-projectiles.ts` to ensure 100% accuracy against newly spawned agents.

### Current Status:
- Combat is now stable. Robots can reliably take damage after respawning, and movement is no longer hindered by static obstacle "gluing".

## [1.1.0-beta] - The Server Modularity & Monorepo Polish - 2026-04-11

### Major Structural Overhaul:
- **The Backend Decoupling:** Successfully dismantled the 600+ line "God Object" (`game.service.ts`) into a clean, domain-specific architecture (`logic-evaluator`, `action-executor`, `pathfinder`, and `combat-math`).

### Technical Scars and Resolutions:
- **Issue: The Infinite Stun-Lock (Trap Loop):** Fixed a critical physics bug where robots were permanently stuck in traps. Resolved by removing the forced velocity reset and implementing a 1500ms "immunity window" post-stun so robots can step out of the hitbox.
- **Issue: Terminal & UI Event Spam:** Resolved massive lag caused by the engine evaluating and broadcasting `MOVE` vs `FIRE` commands 60 times a second. Implemented a 250ms throttle/debounce on socket emissions.
- **Issue: Monorepo Config Hell:** Overcame strict TypeScript 5+ compilation errors. Replaced legacy `baseUrl` with native path mapping, synced `module` and `moduleResolution` to `Node16`, and explicitly defined `rootDir` to bridge cross-package imports cleanly.

### Key Technical Achievement:
- **Domain-Driven Server Architecture:** The game server is now highly modular. Network sockets, AST logic evaluation, A* pathfinding, and physics execution are fully isolated, making the backend incredibly scalable and easy to debug.

### Current Status:
- The backend codebase is now just as clean and atomic as the frontend "Trinity" refactor. The TypeScript compiler is 100% happy, and the physics engine is handling traps and respawns flawlessly.

## [1.2.0-beta] - The Rendering & UX Revolution

### Major Frontend Overhaul:

- **The Atomic CommandConsole:** Dismantled the monolithic `CommandConsole` component into a fine-grained atomic design system (`BotSelector`, `ScriptEditor`, `CommandsDatabase`, `PrebuiltScripts`, `ReferencePanel`), reducing the main shell to under 70 lines.

### Technical Scars and Resolutions:

- **Issue: The Cyberpunk HUD:** Replaced standard UI borders with deep glassmorphism (`backdrop-blur`) and neon tactical accents, establishing a consistent sci-fi aesthetic across the entire command interface.

- **Issue: The Snap Position Bug:** Robots were teleporting between server ticks instead of moving smoothly. Fixed by decoupling server position updates from the render loop — introduced a `targetPosition` ref that the `useFrame` hook lerps toward every frame using a frame-rate independent formula (`1 - Math.pow(0.01, delta * 10)`).

- **Issue: Layout Hierarchy Conflicts:** Resolved all UI overlapping issues by wrapping the left panel in a strict `flex-column` hierarchy, eliminating absolute positioning conflicts between the console and the 3D arena.

### Key Technical Achievement:

- **60 FPS Smooth Interpolation:** Robot movement now interpolates at a true 60 FPS regardless of server tick rate. The `THREE.Vector3.lerp()` approach ensures buttery-smooth motion with zero jitter, even under network latency.

### Current Status:

- The client rendering pipeline is now fully optimized. The CommandConsole is modular and maintainable, robot movement is visually fluid, and the UI hierarchy is conflict-free. Both frontend and backend are now production-grade in architecture.

## [1.3.0-beta] - The Performance Revolution & Character Identity

### Major Performance Overhaul:

- **The React Re-render Death Spiral Elimination:** Replaced the main `gameState` 
  useState with a `useRef` for zero re-renders. The 3D canvas now reads directly 
  from `gameStateRef.current` inside `useFrame`, completely decoupling the rendering 
  pipeline from React's reconciliation cycle.

### Technical Scars and Resolutions:

- **Issue: 3,862ms Scripting Bottleneck:** Profiling revealed JavaScript was 
  choking the main thread at 60x/second state updates. Fixed by implementing a 
  dual-state architecture — `gameStateRef` updates instantly with zero re-renders, 
  while a throttled `uiState` updates the DOM at 10x/sec only.

- **Issue: Per-frame Mesh Traverse:** The hit flash effect was calling 
  `clonedScene.traverse()` every frame, creating massive CPU overhead. Fixed by 
  pre-caching the mesh list in `useMemo` and iterating the cached array instead.

- **Issue: Unnecessary Scene Re-cloning:** The `color` prop was incorrectly 
  included in `useMemo` deps, causing full GLB scene re-cloning on every render. 
  Removed from deps since robot color is stable at runtime.

- **Issue: Projectile Jitter:** Laser projectiles were snapping between server 
  positions at 20 FPS. Fixed by adding frame-rate independent lerp interpolation 
  using `1 - Math.pow(0.001, delta * 20)`.

- **Issue: Camera Aspect Ratio:** The arena appeared square due to camera angle. 
  Fixed by adjusting `PerspectiveCamera` position from `[0, 18, 18]` to 
  `[0, 22, 14]` for correct 20x15 arena perspective.

### Key Technical Achievement:

- **Unique Robot Identity System:** Replaced procedural geometry robots with 
  unique GLB character models. Bot-1 uses a futuristic flying robot (224KB, 
  animated) and Bot-2 uses a mech warrior (2MB, combat stance). Implemented via 
  conditional `Bot1Model`/`Bot2Model` components with `useGLTF.preload()` for 
  zero duplicate loading.

- **Zero Re-render 3D Pipeline:** The rendering architecture now follows R3F best 
  practices — all rapid game state flows through refs, never through React state, 
  achieving true 60 FPS with near-zero scripting overhead.

### Current Status:

- The performance bottleneck has been eliminated. Scripting time dropped from 
  3,862ms to near zero. The arena renders at true 60 FPS with unique robot 
  characters, smooth projectile interpolation, and a fully decoupled rendering 
  pipeline that scales cleanly for future features.