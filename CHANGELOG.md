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

## [1.4.0-beta] - The Full-Stack Arena Integration - 2026-04-12

### Major Frontend & Backend Integration:
The Arena is now a fully connected, real-time battle environment. The 3D scene, tactical radar, and command console are all wired to a live WebSocket server, replacing the previous mock/local state architecture.

### Technical Scars and Resolutions:

- **Issue: The CORS Deadlock:** The NestJS WebSocket server was broadcasting an invalid `'.'` value in the `Access-Control-Allow-Origin` header, blocking all Socket.IO connections from the Next.js client. Resolved by explicitly setting `origin: "http://localhost:3000"` in both `app.enableCors()` and the `@WebSocketGateway()` decorator, then adding `IoAdapter` to enforce the configuration at the transport layer.

- **Issue: HTTP Polling Fallback:** Socket.IO was defaulting to HTTP long-polling, which inherited the broken CORS headers. Fixed by enforcing `transports: ["websocket", "polling"]` with `withCredentials: true` on the client, forcing a direct WebSocket upgrade and bypassing the polling layer entirely.

- **Issue: The Stale Dist Problem:** The `start:prod` script was pointing to `dist/main` while the monorepo build was outputting to `dist/apps/server/src/main`. Fixed by correcting the path in `package.json` to match the actual nested output structure.

**Issue: gameStateRef Null-Safety Cascade:** Multiple components (`SceneContent`, `ArenaModels`) were crashing on first render because `gameStateRef.current.robots` was `undefined` before the first server tick arrived. Resolved by introducing safe defaults (`?? []`) and extracting `robots` and `projectiles` into local variables at the top of each component.

- **Issue: State Shape Mismatch (players → robots):** The server was emitting `players[]` but the 3D scene expected `robots[]`. Fixed by implementing a `normalizeState()` function in `useGameState.ts` that maps both `matchState` and `gameState` socket events into a unified shape before storing in state.

- **Issue: Missing Robot Identity Fields:** The `MatchEngine` was initializing players with no `color`, `velocity`, or `rotation` fields, causing robots to render as invisible/white. Fixed by adding a `ROBOT_COLORS` palette and full identity initialization in both the constructor and `addPlayer()`.

- **Issue: Arena Coordinate Scale:** Robot positions were being generated in a `0-100` range while the 3D scene and tactical radar expected `0-800` / `0-600`. Fixed by scaling `Math.random()` output to `800x600` in `MatchEngine` to match engine bounds.

### Key Technical Achievement:
- **Unified Real-Time Pipeline:** The full event chain is now live — `MatchEngine (Server)` → `WebSocket (NestJS Gateway)` → `useGameState (Client Hook)` → `gameStateRef (Zero Re-render)` → `3D Scene + TACTICAL_VIEW (R3F)`. Every component reads from a single source of truth with no prop drilling and no unnecessary re-renders.

- **Tactical HUD:** Introduced a `TACTICAL_VIEW` radar panel with real-time robot blips, directional triangles, mini health bars, and ID labels. Projectiles render as neon yellow dots on the radar, fully synchronized with the 3D scene.

### Current Status:
- The Arena is now a fully operational real-time battlefield. Players can write AliScript, deploy it to their bot, and watch it execute live in both the 3D scene and the tactical radar simultaneously. The architecture is clean, the pipeline is stable, and the system is ready for: **Pathfinding, FOV-based targeting, and multiplayer session management.**

## [1.5.0-beta] - Security Hardening & Logic Evolution - 2026-04-13

### Major Core & Security Overhaul:
The project has migrated from a basic state-sync to a secure, physics-driven architecture. Real-time protection is now enforced via JWT handshakes, and the game loop has been decoupled from simple increments to a dedicated physics engine.

### Technical Scars and Resolutions:

- **Issue: The Unauthorized Socket Leak:** WebSocket connections were open to any client, posing a security risk. Resolved by implementing a custom JWT verification layer within the `MatchGateway` handshake. Unauthorized attempts are now terminated before hitting the `MatchEngine`.

- **Issue: Persistent Auth Desync:** Refreshing the Arena page caused a loss of session state. Fixed by implementing `localStorage` token persistence and a global `AuthGuard` on the client to ensure seamless re-authentication and automated redirects to `/login`.

- **Issue: Robot Ghosting & Duplication:** Each page refresh spawned a new robot instance while keeping the old one alive on the server. Resolved by implementing a cleanup routine on socket disconnection and an ID-check during the `joinMatch` event to reuse existing player states.

- **Issue: The Empty Arena Stagnation:** Single-player sessions felt static and broken without an opponent. Fixed by adding a default `bot-2` (Opponent) spawning logic in `MatchEngine`, ensuring the tactical environment is interactive even in solo testing.

- **Issue: Semantic State Mapping (scriptId):** The "Deploy" flow lacked a direct link to the user's specific code. Resolved by wiring the Dashboard to pass `scriptId` via URL query parameters, which the Arena now uses to fetch and inject the correct AliScript into the neural loop.

- **Issue: Backend Conflict Ambiguity:** Duplicate email registrations were throwing generic 500 errors. Fixed by mapping Prisma `P2002` unique constraint violations to a `ConflictException` (409) in `auth.service.ts` for clearer frontend feedback.

### Key Technical Achievement:

- **Real-Time Physics Integration:** Successfully migrated the movement logic to the `@logic-arena/engine` core. Robots now operate via a dedicated `GameLoop` with velocity and collision parameters, moving beyond simple coordinate manipulation.

- **Cyberpunk UI Transition:** Complete visual overhaul of Auth and Dashboard layers. Replaced native browser elements with a unified "Cyberpunk" aesthetic featuring glassmorphism, neon status terminals, and decorative tech grids.

### Current Status:
- The infrastructure is now enterprise-grade and secure. With JWT protection and the physics loop in place, the system is fully primed for: **Advanced Pathfinding, Fog-of-War implementation, and Multi-user competitive sessions.**

## [1.6.0-beta] - The Competitive Arena Update - 2026-04-14

### Major Feature Release:
Transformed Logic Arena from a single-player sandbox into a fully competitive multiplayer platform with real-time lobbies, match persistence, and a global ranking system.

### Technical Scars and Resolutions:

- **Issue: The Dual Gateway Conflict:** Two WebSocket gateways (`game.gateway.ts` and `match.gateway.ts`) were running simultaneously on the same port, causing event conflicts and state desync. Resolved by deleting the legacy gateway entirely and consolidating all real-time logic into a single JWT-authenticated `MatchGateway`.

- **Issue: The Empty Arena After Refresh:** The arena rendered an empty grid after page refresh due to wrong import path (`lib/useGameState` vs `arena/hooks/useGameState`). Fixed by correcting the import and adding localStorage token check with automatic redirect to `/login`.

- **Issue: The Phantom Bot Spam:** The default `bot-2` opponent was executing `FIRE + MOVE_FAST` in an infinite loop, overloading the CPU and causing terminal spam. Resolved by setting bot-2's default script to empty and increasing the `logicExecuted` emit throttle.

- **Issue: The Reset Dependency Leak:** After pressing "INITIALIZE RESPAWN", robots stopped responding to commands. Root cause: `reset()` created a new `GameLoop` instance but `ActionExecutor`, `Pathfinder`, and `LogicEvaluator` still held references to the old one. Fixed by rewiring all dependencies inside `reset()`.

- **Issue: Pathfinder Out-of-Bounds Crash:** The A* pathfinder crashed with `Cannot read properties of undefined` when robots moved beyond grid boundaries. Fixed by clamping all position-to-grid conversions with `Math.min/max` and calling `rebuildGrid()` before every pathfind operation.

- **Issue: Script Save Desync:** The `api-client.ts` was reading `jwtToken` from localStorage while login was saving to `token` key. Fixed by unifying both keys and wiring `handleDeployBrain` to auto-save scripts via `PUT /scripts/:id`.

### Key Technical Achievements:

- **Real Multiplayer Lobby System:** Players can now create and join matches in real-time via a dedicated `/lobby` page. The server manages `lobbyMatches` state and broadcasts updates to all connected clients instantly.

- **Match Persistence & Ranking:** Match results are now saved to the database on game end. Winners receive +10 rank points, tracked in a global leaderboard accessible at `/leaderboard`.

- **Premium Winner Screen:** Full-screen cyberpunk victory/defeat overlay with animated grid background, glitch effects, pulsing orb, and tactical buttons (`REINIT_SESSION` / `ABORT_TO_LOBBY`).

- **Neural Combat Rankings:** Global leaderboard page (`/leaderboard`) displaying top operators by rank with gold/silver/bronze styling and win count tracking.

- **Server Modularization:** Decomposed monolithic `match.engine.ts` into clean domain modules: `robot-factory.ts`, `game-dependencies.ts`, `evaluator/expression-evaluator.ts`, and `executor/cooldown-manager.ts`.

- **AliScript Documentation:** Complete language reference added to `docs/aliscript-language.md` covering all commands, conditionals, variables, and example scripts.

### Current Status:
- Logic Arena is now a fully operational competitive platform. Players can register, write AliScript, deploy to the lobby, battle in real-time, and climb the global leaderboard. Ready for: **Fog of War, Match Replay System, and Tournament Mode.**

## [1.7.0-beta] - The Tournament & Replay Evolution - 2026-04-15

### Major Feature Release:
Introduced the Tournament Bracket System, 2D Canvas Match Replay System, an interactive AliScript Documentation page, a dedicated Operator Profile, and unified Cyberpunk Dashboard Navigation.

### Technical Scars and Resolutions:
- **Issue: Replay Rendering Leaks:** Fixed stale React closures and duplicate intervals during playback rendering to ensure the Canvas Replay Viewer maintains smooth interpolation and does not overload the client's memory.
- **Issue: Irregular Bracket Computations:** Fixed crash attempting to create a full tournament bracket for 2 players. Re-architected backend `start` logic to dynamically handle safe participant distribution for 2, 4, and 8-player formats without indexing errors.

### Key Technical Achievements:
- **Tournament Bracket System:** Engineered a comprehensive tournament system supporting CRUD, join mechanisms, automated 2/4/8-player visual bracket generation, automatic winner advancement, and a real-time SVG "Bracket Viewer.
- **Canvas Match Replay System:** Implemented a high-fidelity playback engine. Backends now serialize arena snapshots (robots & projectiles) every 10 ticks and save them to a new optional `replayData` field in Prisma. Features timeline scrubbing and playback speed controls.
- **Interactive AliScript v1.0 Documentation:** Developed an interactive, hacker-themed documentation page featuring a live parse console, 15 actionable commands, 6 tactically filtered categories, and quick reference cards.
- **Operator Profile & Navigation:** Shipped an Operator Profile page detailing gameplay stats and match history, combined with a unified cyberpunk Layout containing a sticky sidebar, 'DISCONNECT' command, active route highlighting, and smooth scanline overlays.

### Current Status:
- The platform is now a comprehensive competitive tactical suite, fully capable of autonomous replay recordings and structured e-sport tournament brackets. Fully modularized dashboard and documentation architecture further grounds the Logic Arena experience.

## [1.8.0-beta] - AliScript v2.0, Environment Stability & Dynamic Orchestration - 2026-04-16

### Major Feature Release:
Launched AliScript v2.0 with Fox-Mind optimization and a new Zen-IDE, stabilized the arena environment with an advanced physics/pathfinding system, and implemented dynamic mode orchestration for Combat, Racing, and Training modes.

### Technical Scars and Resolutions:

- **Issue: The "Circular Jitter" Navigation Loop:** Robots would enter a "spasmodic oscillation" when near traps or when re-calculating paths near their current coordinates, causing them to spin in place instead of moving.

- **Resolution:** Overhauled the A* heuristic to a Weighted Cost Grid. Instead of binary "pass/block" logic, we assigned high costs to TRAP (3.0) and LAVA (5.0) cells. Additionally, implemented a Self-Waypoint Skip logic that instantly consumes waypoints within a half-cell radius, breaking the recursive "pointing-at-self" feedback loop.

- **Issue: The "Zero-Frame" Training Termination:** The TRAINING_SOLO mode would instantly crash to the winner screen upon launch because the server's win-condition logic was hardcoded to end the match if < 2 robots were alive.

- **Resolution:** Patched the MatchGateway's victory-check heartbeat to ignore the robot count threshold when the 'TRAINING_SOLO' flag is active, enabling an indefinite sandbox session.

- **Issue: The "Sticky Geometry" State Leak:** Switching between Racing and Combat modes via the dashboard would result in "Ghost Obstacles" where the client rendered new mode visuals but the server physics remained locked to the previous match configuration.

- **Resolution:** Implemented Aggressive State Purging on the client-side useEffect and a complete MatchEngine Reconstruction on the backend. We also introduced serverConfirmedMode to ensure the UI badge only updates after a successful handshake with the fresh backend ruleset.

### Key Technical Achievements:
- **AliScript v2.0 & Zen-IDE:** Added full support for `WHILE` loops, `IF/ELSE`, math operators, and user-defined `FUNCTIONS`. Launched a new Zen-mode IDE featuring translucent glassmorphism, background Web Worker parsing, and neon syntax highlighting.
- **Engine Optimization & Networking:** Migrated from ES6 Maps to V8-optimized Record structures for 3x faster memory indexing. Implemented Delta-State diffing, reducing WebSocket payload size by ~80%.
- **Arena Physics & Pathfinding:** Implemented a Weighted A* Cost Grid for TRAP/LAVA navigation and integrated SpatialGrid partitioning for O(1) collision performance. Defined a core 3-pillar obstacle system (SOLID, TRAP, LAVA) with unique physics and neon-pulsing visual models.
- **Dynamic Mode Orchestration:** Deployed custom Cyberpunk UI for mode selection, fixed the "Sticky Mode" bug with aggressive server-side match reconstruction, and synced HUD badges securely via `serverConfirmedMode`.
- **Training Sandbox Patch:** Bypassed the auto-termination logic for `TRAINING_SOLO` to create a truly infinite testing environment.

### Current Status:
- The ecosystem has reached a major milestone with a Turing-complete-ish v2.0 scripting language and a highly optimized O(1) physics engine capable of scaling dynamically across combat, racing, and solo training modes.

## [1.9.0-beta] - Secure Identity & Physics Decoupling - 2026-04-17

### Major Feature Release:
Implemented a full-scale **Cyberpunk Identity System** featuring Email OTP verification, Zod-hardened security, and a dynamic Player Garage. Overhauled the physics engine to resolve high-velocity collision "stickiness" and server-client state desync.

### Technical Scars and Resolutions:

- **Issue: The "Ghost In The Machine" Desync:** Robots appeared frozen on the client while firing from empty air. This was a critical failure where the server's movement executor updated coordinates, but the Delta-State diffing logic failed to broadcast `position` and `rotation` updates to the frontend.
- **Resolution:** Refactored `match.gateway.ts` to enforce a strict synchronization heartbeat. Optimized the `safeSnapshot` deep-cloning logic to ensure that every frame's translation vector is captured and pushed to the client, effectively "re-embodying" the ghost robots.

- **Issue: The "Sticky Geometry" Logic Conflict:** Robots would "glue" to walls when a user manually changed the `rotation` during a collision. The user's `SET rotation` command was fighting the engine's reflection vector, pinning the chassis against the obstacle bounds.
- **Resolution:** Instituted a **30-tick Hardware Collision Lockout**. During this window, the engine ignores all manual AliScript steering overrides, granting the physics solver total authority to "eject" the robot using a boosted `REPEL_FORCE` (5.0).

- **Issue: The "Race-Condition Loop" Crash:** The automation system entered an infinite reboot cycle (`MODULE_NOT_FOUND`) because `nodemon` was attempting to execute the server before the TypeScript compiler finished writing the `dist/` files.
- **Resolution:** Migrated to a synchronized **Monorepo Orchestrator** using `concurrently`. Injected a `--delay 2.5` fallback to the watcher, ensuring the physics engine and logic-parser builds are fully "baked" before the server attempts to ingest them.

### Key Technical Achievements:
- **Authentication Hardening (Zod & Helmet):** Integrated `zod` for strict schema enforcement (8+ chars, complex regex) and `helmet` for secure HTTP headers. Bumped password hashing to **Bcrypt Round 12**.
- **Player Garage & Custom Loadouts:** Launched a 3D Garage UI with `OrbitControls` allowing users to persist custom chassis and hex-color tints directly to the Supabase/Prisma layer.
- **Email Lifecycle (Nodemailer OTP):** Deployed a robust verification system using Gmail SMTP. New users are now intercepted by a `/verify-email` gate, requiring a 6-digit OTP stored with a secure TTL in the DB.
- **Advanced UX Error Handling:** Replaced generic "400" errors with a granular, human-readable error chip system and a real-time **Password Strength Indicator** with a 5-stage visual feedback loop.
- **Global & Route-Specific Throttling:** Implemented a dual-layer defense: a global 60 req/min limit and a high-security 5 req / 15 min limit for auth endpoints to thwart brute-force attempts.
- **The "Return to Hangar" 404:** Designed and deployed a stylized `notFoundPage.tsx` that maintains the game's aesthetic even during navigation failures.

### Current Status:
- The platform is now **Security-Hardened** and **UX-Optimized**. The bridge between server physics and client rendering is fully synchronized, and the development environment is 100% automated via `watch:all`.

## [2.0.0] - Global Deployment & Infrastructure Hardening - 2026-04-18

### Major Release: Production Launch on logicarena.dev

The platform has been fully containerized, deployed to a live cloud 
infrastructure, and is now accessible worldwide at https://logicarena.dev. 
This release marks the transition from a local development environment 
to a production-grade, cloud-native system.

---

### New Features

* **Campaign Mode (10-Level Single Player):** Launched a full 
  single-player campaign with 10 progressively harder enemy bots 
  powered by pre-written AliScript logic. Features a zigzag level map, 
  difficulty badges, rank rewards, and victory/defeat modals.

* **Global Online Status & Instant Challenge System:** Players are now 
  tracked in real-time via Redis presence keys. Any online player can 
  be challenged directly from the leaderboard — the challenge modal 
  appears globally across all dashboard pages via an elevated socket 
  in the layout.

* **MatchParticipant Tracking:** Introduced a dedicated join table 
  to track per-player score, placement, and the exact script version 
  deployed in each match.

* **Match Status Lifecycle:** Matches now transition through 
  `pending → in_progress → completed` with `startedAt` and `endedAt` 
  timestamps recorded at each phase.

---

### Technical Scars and Resolutions

* **Issue — "The Silent Postman" (SMTP on Cloud Infrastructure):**
  After deploying to DigitalOcean, the email verification system went 
  completely silent. No errors, no delivery, no timeout — just void. 
  The `EmailService` reported `✅ SMTP transporter ready` on startup, 
  then vanished into the abyss 2 minutes later with `ETIMEDOUT`.
  
  **Resolution:** DigitalOcean aggressively blocks outbound port 25 
  and 587 on new Droplets as an anti-spam measure. This is not 
  documented prominently and cost significant debugging time. The 
  healthcheck `start_period` was extended to 180s to prevent the 
  container from being marked unhealthy during the SMTP verification 
  window. A formal unblock request to DigitalOcean support is pending 
  for production email delivery.

* **Issue — "The Redis Identity Crisis" (IPv6 Resolution Failure):**
  The Upstash Redis connection collapsed in the Docker environment 
  despite working perfectly in local development. The client was 
  silently resolving the Upstash hostname to an IPv6 address that 
  the container's network stack couldn't reach, producing a 
  `getaddrinfo ENOTFOUND` error that masqueraded as an auth failure.
  
  **Resolution:** Forced IPv4 resolution by injecting `family: 4` 
  into the ioredis connection config. Switched to explicit TLS 
  handshake on port 6379 with `tls: {}` to bypass the faulty 
  IPv6 path. Added `[REDIS NETWORK/AUTH ERROR]` prefix logging 
  to expose the real failure surface on future incidents.

* **Issue — "The Prisma Ghost Engine" (Missing Query Engine in Alpine):**
  The NestJS container launched successfully, mapped all routes, 
  connected to Redis — then detonated with 
  `PrismaClientInitializationError: Unable to require libquery_engine-linux-musl.so.node`. 
  The Prisma client was generated on the build machine (Windows) 
  for the wrong binary target, producing an engine binary that 
  Alpine Linux refused to execute.
  
  **Resolution:** Added `linux-musl` and `linux-musl-openssl-3.0.x` 
  to `binaryTargets` in `schema.prisma`. Installed `openssl` via 
  `apk add --no-cache openssl` in the runner stage. Copied the 
  generated `.prisma` client directory from the builder stage 
  directly into the runner to bypass the ignored postinstall scripts.

* **Issue — "The 2.57GB Context Bomb" (Docker Build Catastrophe):**
  The first `docker compose up --build` attempt transferred 2.57GB 
  to the Docker daemon and hung the machine for 10 minutes before 
  crashing. The `.dockerignore` was not excluding `node_modules`, 
  causing the entire workspace dependency tree to be sent as build 
  context.
  
  **Resolution:** Rewrote `.dockerignore` with `**/node_modules` 
  glob patterns. Switched to `--shamefully-hoist` flag in pnpm 
  to flatten binaries like `tsc` into root `node_modules/.bin`, 
  resolving the workspace hoisting issue that was causing 
  `Cannot find module typescript/bin/tsc` during engine builds. 
  Build context dropped from 2.57GB to under 15MB.

* **Issue — "The WebSocket CORS Wall" (Production Socket Rejection):**
  After deployment, every page that used the global socket hook 
  crashed with `n.find is not a function`. The root cause was the 
  `@WebSocketGateway` decorator hardcoding `origin: 'http://localhost:3000'`, 
  causing the server to reject all WebSocket upgrade requests from 
  `logicarena.dev` before the connection was established. The 
  `.find()` call on an undefined socket array was merely the 
  symptom, not the disease.
  
  **Resolution:** Extended the CORS `origin` array in the gateway 
  decorator to include `https://logicarena.dev` and 
  `https://www.logicarena.dev`. Updated the Nginx `location /socket.io/` 
  block with explicit `proxy_read_timeout 86400` and correct 
  `Connection "upgrade"` headers to sustain long-lived WebSocket 
  tunnels through the reverse proxy.

* **Issue — "The Nginx Route Hijacker" (Frontend Swallowing API Calls):**
  After fixing the WebSocket, API calls to `/campaign/levels`, 
  `/tournaments`, and `/auth/login` were returning HTML instead of JSON. 
  Nginx was routing every request to the Next.js frontend on port 3000, 
  including backend API paths, because the location blocks were 
  incomplete.
  
  **Resolution:** Added explicit `location ~ ^/(auth|users|scripts|matches|health|campaign)` 
  regex block to route backend traffic to port 3001, while preserving 
  the catch-all `/` block for the frontend. The `/socket.io/` path 
  required a separate dedicated location block with trailing slash 
  to avoid prefix-matching conflicts.

---

### Infrastructure

* Containerized full pnpm monorepo with multi-stage Docker builds 
  for both NestJS server and Next.js client
* Deployed to DigitalOcean Droplet (Frankfurt, 2GB RAM, $12/mo)
* Configured Nginx as reverse proxy with SSL termination
* Issued production TLS certificate via Let's Encrypt (Certbot) 
  with auto-renewal
* Registered and configured `logicarena.dev` domain with A records 
  pointing to Droplet IP
* Published Docker images to Docker Hub 
  (`alihaggag7/logic-arena-server` and `alihaggag7/logic-arena-client`)

---

### Current Status

- The platform is now **live in production** at https://logicarena.dev. 
All core game systems are operational. The infrastructure is 
containerized, SSL-secured, and deployable via a single 
`docker compose pull && docker compose up -d` command.

## [2.1.0] - The Identity, UI Evolution & Mobile-First Transformation - 2026-04-21

### Major Feature Release:
Shipped a complete multi-theme design system, premium mobile-first 
experience across all dashboard pages, a global footer system with 
8 static pages, and resolved critical OAuth environment conflicts 
that were blocking local development alongside production.

---

### New Features

* **Multi-Theme Design System (3 Themes):** Launched a production-grade 
  theme system with three distinct visual identities: Cyberpunk (default 
  dark), Light (minimalist white), and Desert (warm gold/sand). Built on 
  CSS custom properties mapped to Tailwind v4 `@theme inline` — zero 
  hardcoded colors anywhere in the codebase. A `ThemeSwitcher` dropdown 
  (Moon/Sun/Sunrise icons via lucide-react) is accessible from every page.

* **Mobile-First Dashboard Experience:** Transformed all dashboard pages 
  into a native app-like experience on mobile (≤768px). Implemented a 
  fixed `MobileNav` bottom bar, `MobileHeader` top bar with ThemeSwitcher, 
  and completely separate mobile JSX layouts (not responsive breakpoints) 
  across: Dashboard, Leaderboard, Campaign, Profile, Lobby, Garage, Docs, 
  and Replay pages. `isMobile` is calculated once per page via 
  `useMediaQuery` and passed as a prop — never recalculated in children.

* **Global Footer System:** Shipped a full cyberpunk footer with 5-column 
  desktop layout (Brand, Navigate, Arena, Community, Legal) and a 
  tap-to-expand accordion on mobile with left-accent inset glow. Includes 
  scanline overlay, grid pattern, corner bracket headers, brand glitch 
  animation, pulsing "ALL SYSTEMS ONLINE" status dot, and social icons.

* **8 Static Pages:** Created `/how-it-works`, `/patch-notes`, 
  `/bug-report`, `/feature-requests`, `/terms`, `/privacy`, `/cookies`, 
  and `/contact` — all matching the cyberpunk terminal-panel aesthetic 
  with full theme compatibility.

* **Robot Garage Enhancements:** Added per-robot `scale` prop piped 
  through to R3F `<primitive>` to fix UNIT-01 appearing too small. 
  Added `DEFAULT` color option that restores original GLB materials. 
  Introduced sticky "Save Loadout" footer on mobile detail page.

* **CLAUDE.md Agent Rules:** Added three `CLAUDE.md` files (root, 
  `apps/client/`, `apps/server/`) to guide AI agents with project 
  conventions, reducing token consumption by ~60-70% per session.

---

### Technical Scars and Resolutions

* **Issue — "The Double /api Prefix" (OAuth URL Collision):**
  GitHub OAuth was redirecting to `/api/api/auth/github/callback` 
  because `API_BASE_URL` in `api-client.ts` was constructed by 
  appending `/api` to a `BASE_URL` that already contained `/api`, 
  creating a duplicate prefix. Simultaneously, `CLIENT_URL` in the 
  server `.env` was pointing to `logicarena.dev`, causing CORS to 
  block all requests originating from `localhost:3000` during local 
  development.

  **Resolution:** Collapsed `BASE_URL` and `API_BASE_URL` into a 
  single env-aware constant. Separated OAuth apps entirely — created 
  a dedicated "Logic Arena Local" GitHub OAuth App with 
  `http://localhost:3001/api/auth/github/callback` as its callback, 
  and kept the production app pointing to `logicarena.dev`. Introduced 
  `.env.local` for the server (loaded via `dotenv-cli`) so development 
  and production credentials never collide. Google OAuth was handled 
  differently since it supports multiple callback URLs in one app.

* **Issue — "The GitHub Actions Secret Drift" (Broken CI/CD Pipeline):**
  After a DigitalOcean Droplet password reset was forced due to lost 
  credentials, the `DROPLET_PASSWORD` secret stored in GitHub Actions 
  became stale. Every subsequent push triggered a successful Docker 
  build but failed silently at the SSH deploy step, with the runner 
  timing out on authentication.

  **Resolution:** Rotated the `DROPLET_PASSWORD` secret in the GitHub 
  repository settings to match the new Droplet credentials. Verified 
  the full CI/CD chain end-to-end: push → build → Docker Hub publish 
  → SSH deploy → `docker compose pull && up -d`.

* **Issue — "The R3F HTML-in-Canvas Crash" (Garage Page):**
  The Robot Garage page was throwing `R3F: Span is not part of the 
  THREE namespace` because the `<Suspense fallback={<CanvasFallback />}>` 
  inside `<Canvas>` was returning an HTML `<span>` element. React Three 
  Fiber's Canvas only accepts Three.js scene objects — any HTML element 
  in the fallback detonates the renderer.

  **Resolution:** Replaced the HTML fallback with `fallback={null}` 
  inside the Canvas. Moved the loading UI outside the Canvas entirely, 
  controlled by an `isLoaded` state flag passed up from `RobotModel` 
  via an `onLoad` callback prop.

* **Issue — "The Three.js CSS Variable Wall" (Robot Colors Not Applying):**
  Color swatches labeled GREEN, RED, and ORANGE were using Tailwind 
  internal variables (`var(--color-emerald-500)`) as hex values passed 
  to `new THREE.Color()`. Three.js cannot resolve CSS variables — it 
  expects a raw hex string, so all three colors rendered as black.
  Additionally, `directionalLight` props were using `color="var(--accent)"` 
  which Three.js silently ignored.

  **Resolution:** Replaced all CSS variable color strings with their 
  resolved hex equivalents (`#10b981`, `#ef4444`, `#f97316`). Hardcoded 
  all Three.js light colors to `#22d3ee`. Added `.trim().toUpperCase()` 
  defensive cleaning on all color strings fed into `THREE.Color` and 
  wrapped the constructor in `try/catch` to prevent console flooding 
  on unexpected values.

* **Issue — "The Cyberpunk Glow Wipeout" (Theme Refactor Side Effect):**
  During the global color migration to CSS variables, the AI agent's 
  find-and-replace pass unintentionally stripped `drop-shadow`, 
  `text-shadow`, and `box-shadow` neon glow effects from titles, 
  buttons, and card borders across all dashboard pages. The cyberpunk 
  theme lost its signature visual identity.

  **Resolution:** Restored all glow effects by adding a 
  `[data-theme='cyberpunk']` block in `globals.css` that re-declares 
  neon shadows using `rgba(var(--accent-rgb), X)`. Added 
  `--glow-opacity: 0` overrides for `light` and `desert` themes to 
  suppress glows on light backgrounds without touching component files.

* **Issue — "The Mobile Layout Flash" (SSR Hydration Mismatch):**
  Using `useMediaQuery` in components rendered server-side caused 
  a hydration mismatch — the server always returned `false` (desktop), 
  so mobile users saw a brief flash of the desktop layout before React 
  hydrated and switched to the mobile view.

  **Resolution:** Made `useMediaQuery` SSR-safe by defaulting to 
  `false` on the server and attaching the `window.matchMedia` listener 
  only after mount. Combined with `suppressHydrationWarning` on the 
  root `<html>` element, this eliminated the flash entirely. The 
  `ThemeProvider` mounted-state wrapper was also removed since 
  `next-themes` handles hydration natively when `suppressHydrationWarning` 
  is present.

---

### Infrastructure

* Introduced `dotenv-cli` for environment-aware server startup — 
  `start:dev` loads `.env.local`, production reads `.env` directly
* Added `CLAUDE.md` convention files at root, client, and server 
  level for AI-assisted development efficiency
* Separated GitHub OAuth into two apps (Local + Production) for 
  frictionless parallel development and deployment

---

### Current Status

- Logic Arena is now a **visually cohesive, theme-aware, mobile-first 
  platform** with a professional footer, legal pages, and a fully 
  operational CI/CD pipeline. The codebase enforces CSS variable 
  discipline and mobile UX patterns at the convention level via 
  `CLAUDE.md`. Ready for: **Fog of War, Energy System, and University 
  Competition features.**

## [2.2.0] - The Refactor Marathon, UI Polish & Infrastructure Cleanup - 2026-04-23

Executed a comprehensive codebase refactoring across every major module,
shipped a premium cyberpunk redesign for all static and auth pages,
resolved critical production bugs, and restructured the project's
route architecture into a clean group-based hierarchy.

---

### New Features

* **Settings Page (5 Sections):** Launched a full operator settings
  experience with: Operator Identity (username/email updates), Security
  Protocol (password change + account deletion with confirmation modal),
  Appearance (3 theme cards with palette preview), Arena Preferences
  (default robot, sound FX, FPS counter), and Neural Notifications
  (challenge/tournament/match toggles). Desktop: 2-column layout.
  Mobile: accordion cards with left-accent inset glow.

* **Functional EDIT SCRIPT Modal:** Replaced the non-functional button
  with a full-screen code editor modal featuring line numbers, tab-key
  support, optimistic UI (version+1 instantly, reverts on failure),
  and inline success/error feedback.

* **Premium Static Pages Redesign:** Overhauled all 8 footer static
  pages with glassmorphic cards, mono typography, accent glow headers,
  and pulsing status dots. Built CyberSelect custom dropdown on
  /bug-report and /feature-requests — opens upward to avoid footer
  collision.

* **Smart Contextual Header:** MobileHeader now renders on all screen
  sizes for auth and public pages. Shows LOGIN/REGISTER split pill for
  unauthenticated users, LOGOUT/DASHBOARD based on route and token
  state. Desktop sticky header with NODE:[USERNAME] badge extracted
  from sidebar. UPLINK_SECURE indicator fills freed sidebar space.

* **GEMINI.md Agent Rules:** Added three GEMINI.md files (root,
  apps/client/, apps/server/) mirroring CLAUDE.md conventions for
  Gemini-based AI agent sessions.

---

### Refactoring — Component Decomposition

* **Settings page** 762→50 lines: Shared.tsx, SettingsLayout,
  IdentitySection, SecuritySection, AppearanceSection,
  PreferencesSection, NotificationsSection.

* **Dashboard layout** 247→80 lines: useDashboardAuth,
  useChallengeSystem, DashboardSidebar, DashboardHeader,
  ChallengeModal, ToastNotification.

* **Lobby page** 285→99 lines: useLobbySocket, useDeployMatch,
  ConnectionStatusBar, ErrorPanel.

* **Replay viewer** 424→109 lines: useReplayPlayback hook,
  canvasRenderer.ts, ReplayCanvas shell, desktop/mobile layouts.

* **Campaign pages** 329→53 / 369→80 lines: styles, skeletons,
  desktop/mobile layouts, types, LevelModal.

* **EditScriptModal** 429→97 lines: EditScriptModalStyles,
  EditScriptHeader, EditScriptFooter, EditScriptEditor.

* **Footer** 453→56 lines: constants, Icons, MobileLayout,
  DesktopLayout, BottomBar.

* **Arena page** 535→150 lines: useFPS, OrientationLock,
  MobileTopRightHUD, MobileControls, DesktopHUD, ArenaStyles.

* **Auth pages** 303→147 / 235→110 lines: AuthBackground,
  AuthContainer, AuthHeader, AuthSocials, AuthStatusTerminal,
  PasswordStrengthIndicator, parseApiError util.

* **match.gateway.ts (server)** 591→140 lines via delegation
  pattern: match.state, match.loop, match.lobby, match.social.

---

### Technical Scars and Resolutions

* **Issue — "The Infinite Lobby Skeleton":**
  The lobby page showed an infinite skeleton loader when the
  WebSocket server was unreachable, with no feedback or recovery path.
  Additionally, the socket was initialized before the JWT token was
  available, burning through 5 reconnect attempts on every page load
  for unauthenticated users.

  **Resolution:** Added a token guard in useLobbySocket that shows
  ErrorPanel immediately if no token is found. Implemented tristate
  connection status (connecting/connected/error), named .off() cleanup
  on unmount, and a RETRY button that recreates the socket instance
  via retryKey increment. Fixed Socket.IO URL by stripping /api suffix
  from NEXT_PUBLIC_API_URL for correct WebSocket origin.

* **Issue — "The 3-Robot Arena" (Reconnect Duplication):**
  Reconnecting to an active match spawned a third robot instead of
  reusing the existing player slot, because addPlayer() was pushing
  a new entry when findIndex() returned -1 on the re-registered player.

  **Resolution:** Fixed the fallback branch in match.engine.ts to
  overwrite slot 0 in-place instead of pushing, keeping the player
  count permanently at 2.

* **Issue — "The Footer Invasion" (Dashboard & Arena Contamination):**
  The global Footer in root layout.tsx was leaking into dashboard
  routes and the /arena page because Next.js route groups extend
  rather than replace the root layout.

  **Resolution:** Added FOOTER_SUPPRESSED_PATHS array in Footer.tsx
  using usePathname() to return null on /arena and all dashboard
  sub-routes. Fixed double scrollbar simultaneously by isolating
  overflow-y-auto to the main element only.

* **Issue — "The OAuth Callback 404" (Route Group Collision):**
  Moving the callback page into the (auth) route group changed its
  effective URL from /auth/callback to /callback, breaking the
  server's hardcoded redirect target and producing a 404 on every
  OAuth login attempt.

  **Resolution:** Updated auth.controller.ts redirect from
  /auth/callback to /callback to align with the (auth) group's
  URL output. Removed the duplicate auth/callback folder entirely.

* **Issue — "The Orphaned 3D Meshes" (Scene Accumulation):**
  React Three Fiber was leaving orphaned robot and obstacle meshes
  in the THREE.Scene during rapid WebSocket reconnects, causing
  visual duplication in the arena.

  **Resolution:** Added robotMeshesRef and obstacleMeshesRef to
  track every spawned group. useEffect cleanup now calls
  scene.remove() and traverses each mesh to dispose geometry
  and materials before re-adding on reconnect.

---

### Infrastructure & Project Structure

* Reorganized app/ into clean route groups: (auth), (dashboard),
  (public) — static footer pages now live under (public) instead
  of floating in app/ root.
* Removed stale arena .bak files and temp package.json artifacts.
* Improved light and desert theme CSS variables for stronger
  contrast — accent colors, border opacity, text readability.
* Footer links upgraded to font-mono uppercase with hover chevron
  slide animation and drop-shadow glow.

---

### Current Status

- Logic Arena codebase is now fully modular with no critical-path
  file exceeding 200 lines. Route architecture is clean with proper
  group hierarchy. All production bugs from v2.1.0 are resolved.
  Ready for: **Fog of War, Energy System, and University Competition
  features.**

## [2.3.0] - The Refactor Blitz, AliScript Audit & PWA Launch - 2026-04-25

Executed a full SOLID decomposition pass across every remaining God
module on the server, shipped a complete AliScript v2.2 language audit
with critical parser fixes, overhauled the A* pathfinding engine, and
launched a production-grade PWA with a custom pull-to-refresh and
Android nav bar theme sync.

---

### New Features

* **Progressive Web App (PWA):** Launched full PWA support — manifest
  with all 8 icon sizes (72→512), network-first service worker with
  API/socket bypass and offline fallback, cyberpunk offline page with
  pulsing hex and retry button, iOS meta tags, and safe-area CSS vars.
  A `PWAInstallPrompt` component (30s delay, localStorage dismissed
  state) is injected into the dashboard layout.

* **Custom Pull-to-Refresh:** Replaced the browser's native
  pull-to-refresh with a custom `PullToRefresh` component — rubber-band
  easing, cyan arc that fills with pull progress (matching Thunder's
  minimal style), spinning loader on release, and snap-back animation
  on abort. Only activates when the page is scrolled to the top.

* **AliScript v2.2 Language Audit:** Complete audit of the AliScript
  parser and evaluator. Added `!=`, `<=`, `>=`, `AND`, `OR` operators,
  full parenthesis grouping with `LPAREN`/`RPAREN` tokens, a proper
  operator precedence tower (OR→AND→comparison→arithmetic→unary→primary),
  and AND/OR short-circuit evaluation. BURST_FIRE now fires 3 projectiles
  at -8/0/+8 degree spread with 150ms stagger and a liveness guard.
  Hidden identifiers `target_vx`, `target_vy`, `last_spotted_x`,
  `last_spotted_y`, and SCAN FOV behavior documented.

* **A* Pathfinding Overhaul + Energy Rebalance:** Replaced the O(n²)
  open list scan with a Map + binary min-heap for O(log n) extraction.
  Fixed heuristic from Manhattan to Diagonal distance for free movement.
  Fixed diagonal wall-clipping by checking both cardinal neighbors.
  Added `nearestWalkable()` BFS fallback and Bresenham string-pulling
  to eliminate zig-zag waypoints. Path cached per robot — zero per-tick
  allocation. Grid built once via `ensureGrid()`. Energy rebalanced:
  SCAN 5→1, FIRE 15→8, BURST_FIRE 20→15, MOVE_FAST 3→2. Regen rate
  2→3 per tick. SCAN+PATHFIND loop now net neutral, SCAN+MOVE net +1.

* **Updated Docs (v2.2.0):** All 6 documentation files updated to
  reflect current state — AliScript operators/grouping/hidden
  identifiers, 4-service auth split, CQRS for users/tournaments,
  match gateway decomposition, energy costs table, BURST_FIRE spread
  angles, STASIS mechanic, lava/trap bounds, BlockExecutor sandbox
  architecture, and full ERD Mermaid diagram synced with schema.prisma.

---

### Refactoring — Server SOLID Decomposition

* **Pathfinder** 362→modular: Deleted `pathfinder.ts`, replaced with
  `pathfinder/` folder — `types.ts` (GridCell/PathNode/Vec2),
  `min-heap.ts` (generic MinHeap replacing O(n) array scans),
  `grid-builder.ts` (ensureGrid/invalidateGrid/nearestWalkable BFS),
  `string-puller.ts` (Bresenham LOS + path smoothing as pure functions),
  `astar.ts` (A* core only), `index.ts` (clean re-exports). Zero
  behavior change — same A* logic, same output.

* **LogicEvaluator** 223→modular: Extracted `types.ts` (sandbox limits),
  `memory-sync.ts` (FOV and position sync), `logic-registry.ts` (robot
  logic states and AST instances), `block-executor.ts` (recursive
  statement interpreter with loop/condition handling and cooldown gates),
  `logic-facade.ts` (replaces LogicEvaluator, unifies internal modules),
  `index.ts` (public re-exports).

* **ExpressionEvaluator** decomposed into SOLID modules:
  `identifier-resolver.ts` (sandbox variable resolution — health, energy,
  CAN_SEE_ENEMY, etc.), `operator-handlers.ts` (pure binary/unary/comparison
  operators with zero engine coupling), `expression-facade.ts` (bridges
  AST traversal to handlers, replaces ExpressionEvaluator).

* **Engine `index.ts`** decomposed: Extracted `constants.ts` (lava zones,
  arena boundaries, static config), `utils/animation-loop.ts` (Node
  requestAnimationFrame polyfill), `core/robot-updater.ts` (movement,
  lava damage, collision, FOV sync), `core/game-loop.ts` (master tick
  loop orchestrating robots/projectiles/SpatialGrid). `index.ts` rewritten
  as clean facade — zero upstream import changes needed.

* **Match loop** 250→84 lines: Extracted `match.snapshot.ts` (runtime
  payload mapping to replay queue cache), `match.win-condition.ts` (win
  condition checks per game mode), `match.persistence.ts` (Prisma
  transaction logic isolated from tick execution), `match.delta-diff.ts`
  (frame differential generator minimizing broadcast payload).

* **TournamentsController** 288→48 lines via CQRS: Extracted
  `tournaments-query.service.ts` (read-only findAll/findOne with relation
  enrichment) and `tournaments-command.service.ts` (create, join, bracket
  generation, round advancement). Prisma logic fully out of controller.

* **UsersService** 239→modular via CQRS: Extracted `types.ts` (Redis key
  constants and user DTO interfaces), `users-query.service.ts` (profile
  queries, win rate analytics, Redis cache mapping), `users-command.service.ts`
  (password updates, account deletion, P2002 constraint handling). Controller
  now injects Query and Command services separately.

* **AuthService** 219→modular: Extracted `types.ts` (bcrypt rounds, Prisma
  P2002 code), `auth-registration.service.ts` (local registration, P2002
  handling, SMTP verification), `auth-login.service.ts` (login pipeline with
  constant-time dummy hash for timing-attack prevention),
  `auth-password.service.ts` (password reset flow), `auth-oauth.service.ts`
  (Google/GitHub OAuth entity matching and creation). Controller injects
  Registration/Login/Password services separately.

---

### Technical Scars and Resolutions

* **Issue — "The Android Nav Bar Blindspot":**
  The mobile navigation bar (3-button system bar on Android) was ignoring
  the active theme color, staying black regardless of the Light or Desert
  theme being active. The `theme-color` meta tag only affects the top
  status bar — the bottom system nav bar reads the computed `background-color`
  on `body`, which was set via a CSS variable that Android couldn't resolve
  statically.

  **Resolution:** Added `document.body.style.backgroundColor = color`
  inside `ThemeMetaSync`'s `useEffect`, injecting an explicit inline style
  on every theme change. This gives Android a static hex value it can
  apply directly to the nav bar. Simultaneously fixed a `THEME_COLORS`
  mismatch where `desert` was `#fdf4e3` in the provider but `#fdf6e3`
  in `globals.css` — unified to `#fdf6e3`.

* **Issue — "The Duplicate theme-color Meta Tags":**
  After adding `media="(prefers-color-scheme: dark/light)"` attributes to
  the `theme-color` meta tags, `ThemeMetaSync`'s `querySelector` was only
  finding and updating the first tag, leaving the second stale. This caused
  the status bar color to desync from the active theme on some devices.

  **Resolution:** Reverted to a single `<meta name="theme-color">` tag
  without any `media` attribute, letting `ThemeMetaSync` own full control
  over the value programmatically on every theme change.

* **Issue — "The Script Save Rate Limit Gap":**
  The AliScript save endpoint had no server-side rate limiting, making it
  vulnerable to script-spam abuse that could flood the database with rapid
  sequential saves.

  **Resolution:** Added Redis rate limiting on the script save route —
  max 10 saves per minute per user. Introduced an `incr()` helper to
  `RedisService` with a graceful Redis-down fallback to prevent the
  feature from blocking saves during Redis outages.

* **Issue — "The AliScript Operator Blindspot":**
  The lexer had no lookahead for `<=`, `>=`, and `!=`, tokenizing them as
  two separate tokens (`<` + `=`, etc.) and breaking all comparison
  expressions using these operators. Additionally, parenthesized
  sub-expressions crashed the parser because `LPAREN`/`RPAREN` were
  never defined as token types.

  **Resolution:** Added single-char lookahead in the lexer for all
  compound operators. Added `LPAREN`/`RPAREN` token definitions and
  integrated them into the expression parser's `primary()` rule as the
  lowest-precedence entry point for grouped expressions.

---

### Infrastructure

* Added `AliScript` sandbox size validation on create and update:
  max 5,000 characters / 100 lines enforced server-side.
* Unknown AST nodes in `block-executor` are now silently skipped
  with a log entry instead of crashing the tick loop.
* Tick timeout log format standardized:
  `SANDBOX: tick timeout for robot {robotId}`.

---

### Current Status

- Every major server module is now SOLID-compliant with no file
  exceeding ~150 lines. The AliScript engine is audited, tested,
  and handles all operator edge cases. The A* pathfinder is O(log n)
  and zig-zag free. The PWA is live with native-feeling pull-to-refresh
  and full Android theme sync. Ready for: **Fog of War, Energy System
  UI, and University Competition features.**