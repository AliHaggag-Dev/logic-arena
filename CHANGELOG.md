# CHANGELOG

## 2026-04-05

### [0.2.0] - The Server-Engine Integration

The `packages/engine` module has been successfully integrated with the NestJS server using WebSockets. This crucial step merged the core game logic with the server architecture, enabling real-time communication and game state synchronization.

**Technical Scars and Resolutions:**

* **Issue:** Fixed 'Module not found' by reconfiguring `outDir` in `nest-cli.json` and switching to manual `node dist/...` execution.
* **Issue:** Resolved PowerShell-specific errors by replacing `rm -rf` with `Remove-Item` and `&&` with `;`.
* **Issue:** Handled `EADDRINUSE` by identifying and killing ghost processes on ports 3000/3001 using `taskkill`.

**Key Technical Achievement:**

* Successfully linked `@logic-arena/engine` using `pnpm` workspace syntax.

**Current Status:** The server operates at 60 FPS (or 30), and robot position broadcasting is functioning efficiently, providing a synchronized and seamless gaming experience.

## [0.3.0] - The Visual Pulse & State Synchronization

Successfully synchronized the Backend physics engine with the Frontend Canvas renderer, achieving 60 FPS neon-glow robot movement.

### Technical Scars and Resolutions

* **Issue:** Fixed 'Array(0)' state issue by enforcing a **Singleton Pattern** using `@Global()` in `GameModule`, ensuring Gateway and Service share the same engine instance.

* **Issue:** Resolved TypeScript compilation errors in Monorepo by fixing `isolatedModules` conflicts and correctly using `export type` for shared interfaces.
* **Issue:** Fixed Frontend rendering lag by correcting object mapping (accessing `position.x` instead of `x`) and implementing `requestAnimationFrame` for smooth Canvas drawing.

### Key Technical Achievement

* Established a stable **Full-Stack Event Pipeline**: GameLoop (Engine) -> Socket.io (Server) -> HTML5 Canvas (Client).

### Current Status

* Neon robots are dynamically moving in the Arena with zero lag, fully synchronized with server-side physics.

## [0.4.0] - The Combat Engine & Lethal Logic (2026-04-06)

Successfully transformed the visual simulation into a functional **Combat Engine**, implementing projectiles, health mechanics, and advanced collision physics.

### Technical Scars and Resolutions

* **Issue:** Resolved `data.robots is not iterable` error by implementing **Payload Guarding** in the Frontend to handle both legacy Arrays and new GameState Objects.

* **Issue:** Fixed **Projectile Ghosting** (bullets disappearing instantly) by offsetting the spawn point (`ROBOT_RADIUS + 5`) to prevent self-collision on frame zero.
* **Issue:** Overcame **Monorepo Build Path** hell by identifying the nested `dist` structure (`dist/apps/server/src/main.js`) and correcting the execution path.
* **Issue:** Optimized **Rendering Layers** by reversing the draw order (Robots -> Projectiles) to ensure high-visibility neon sparks.

### Key Technical Achievement

* Developed a **Bidirectional Combat Pipeline**: Server triggers `fire()` -> Engine calculates trajectory/collision -> Client renders dynamic Health Bars and Neon Sparks.

* Implemented **Elastic Robot-to-Robot Collisions** with overlap resolution to prevent physics "clipping".

### Current Status

* The Arena is now a "Live Warzone". Robots fire synchronized projectiles, sustain damage, and enter a "Dead State" upon zero health. The foundation for the Logic Compiler is now 100% solid.

## [0.5.0] - The Birth of AliScript (The Logic Compiler) - 2026-04-07

Successfully implemented a custom **Logic Parser** and **Execution Engine**, allowing players to program robot behavior using a simplified scripting language (AliScript).

### Technical Scars and Resolutions

* **Issue: The "Recursive Firing" Bug:** Fixed robots firing like machine guns by implementing an **Edge-Triggered Logic Latch** (Only trigger action when condition state changes from `false` to `true`).

* **Issue: Monorepo Path Resolution:** Overcame `MODULE_NOT_FOUND` errors by correctly mapping `@logic-arena/logic-parser` in `tsconfig.json` and ensuring the package is built into `/dist` before server execution.
* **Issue: Socket.io Dependency Loop:** Resolved frontend lag and connection drops by stabilizing the `useEffect` hooks in `Arena.tsx`, ensuring the socket listener remains active without unnecessary re-renders.
* **Issue: TypeScript Type Mismatch:** Fixed `number` vs `string` indexer errors in the `logicStates` Map by normalizing AST indices to string keys.

### Key Technical Achievement

* **Custom Compiler Pipeline:** Created a full flow from **String Script** -> **Lexer/Parser** -> **AST** -> **Server-side Evaluation** -> **Real-time Execution**.

* **Visual Debugging Suite:** Integrated **Neon Tracer Lines** and **Live Logic Logs** to provide immediate feedback on script performance.

### Current Status

* The Arena now has a "Brain". Robots are no longer puppets; they are autonomous agents responding to logical conditions. The system is ready for the next level: **Pathfinding & FOV (Field of View)**.

## [0.6.0] - The Stateful Mind & Predictive Prep - 2026-04-08

Elevated the **AliScript Engine** from reactive to stateful, enabling robots to remember past states and prepare for kinematic calculations.

### Technical Scars and Resolutions

* **Issue: The Memory-less Robot:** Fixed the inability to track state changes by implementing a `Map`-based persistent memory per robot instance on the server.

* **Issue: Static Targeting:** Added velocity identifiers (`target_vx`, `target_vy`) to lay the groundwork for Predictive Aiming algorithms.
* **Issue: UI Bottleneck:** Resolved the single-robot control limitation by adding a Neon-styled Robot Switcher in the `CommandConsole`.

### Key Technical Achievement

* **Stateful Logic Execution:** Successfully deployed scripts using `SET` variables that compare across execution frames (e.g., Counter-attack logic based on health delta).

### Current Status

* Robots now possess **Persistent Intelligence**. They can remember, compare, and react to environmental changes over time. The bridge between raw physics and high-level strategy is officially built. Ready for: **The 3D Visual Overhaul & Predictive Aiming Challenges**.

## [0.7.0] - The Sensory Update & Visual Stability

Finalized the core user experience by merging high-performance visuals with a responsive spatial audio system and optimizing the 3D rendering pipeline.

### Technical Scars and Resolutions

* **Issue: Rendering Crash (External Assets):** Overcame fatal `Failed to fetch` errors from external GLB providers by implementing **Procedural Neon Models** built with native Three.js geometries, ensuring 100% offline stability.

* **Issue: Performance Lag (Bloom Overhead):** Resolved major FPS drops by transitioning to a **Stealth Matte Aesthetic**, removing heavy post-processing shaders while maintaining a premium Cyberpunk look.
* **Issue: Silent Combat & Autoplay Policy:** Integrated a robust audio engine using `use-sound` and implemented an interaction-based unlock to bypass browser audio restrictions.

### Key Technical Achievement

* **Unified Feedback Loop:** Successfully synchronized **Multi-Sensory Feedback** where a single logic event (e.g., `health < last_h`) triggers a simultaneous visual flash, particle burst, and spatial audio "hit" sound.

* **Procedural Asset Pipeline:** Engineered a lightweight, shader-based robot model system that responds dynamically to state changes (color, rotation, and hovering) without external dependencies.

### Current Status

* The Arena is now **Fully Interactive & Battle-Ready**. Players receive instant visual and auditory confirmation for every logical event. The foundation is rock-solid for the next massive leap: **Advanced AI Tactics (v1.0.0 Pre-Alpha)**.

## [0.8.0] - The Sentient Intelligence Update - 2026-04-09

A massive leap from reactive bots to intelligent autonomous agents with full sensory and tactical capabilities.

### Technical Scars and Resolutions

* **Issue: The Parser Bottleneck:** Fixed a major bug where commands on the same line (e.g., `MOVE FIRE`) were ignored. Resolved by implementing mandatory line-break appending (`\n`).

* **Issue: Type Mismatch (TS2339):** Resolved TypeScript build errors by implementing proper type guards for `ActionStatements` and `SetStatements` on the server.
* **Issue: Visual De-sync:** Fixed the "Static Vision" bug by binding the 3D Vision Cone and Robot Mesh directly to the `robot.rotation` state.
* **Issue: UI Overflow:** Re-engineered the Command Library to use a **Drop-up** mechanism with hidden scrollbars for a cleaner "Hacker" aesthetic.

### Key Technical Achievement

* **Turing-Complete-ish Control:** The AliScript engine now handles complex, stateful behaviors, making the robots 100% script-driven. No default movement; every twitch is commanded by logic.

### Current Status

* The system is now a **Stable Tactical Simulator**. We have FOV, Logic, VFX, and Audio working in perfect harmony.

* Ready for: **v1.2.0 - Pathfinding & Obstacle Avoidance**.

## [1.0.0-beta] - The Trinity Refactor - 2026-04-10

### Major Structural Overhaul

* **Client Atomization:** Dismantled the "God Files" into a hook-driven architecture.

* **Engine Optimization:** Refactored core physics and collision logic for better maintainability.
* **Logic-Parser Decoupling:** Separated the AliScript interpreter from the view layer. The parser now functions as a pure logical entity, making it ready for server-side integration.

### Technical Scars and Resolutions

* **Issue: Parser-View Dependency:** Fixed a tight coupling where the `logic-parser` was too dependent on client-side state. Now uses a clean, event-driven interface.

* **Issue: R3F Hook Deadlock:** Resolved the Canvas-context error by re-engineering the component tree.
* **Issue: TS Type Fragmentation:** Unified types across the workspace.

### Current Status

* The "Trinity" (Client, Engine, Parser) is now fully modular. Ready for Server Refactoring.

## [1.0.1-beta] - The Physics & Combat Patch

### Bug Fixes

* **Obstacle Adhesion Fix:** Resolved an issue where robots would permanently stick to red obstacles. Implemented a cooldown-based separation logic.

* **Ghost Respawn Fix:** Fixed a major combat bug where respawned robots became "invincible" due to stale collision references in the physics engine.
* **Physics Synchronization:** Improved projectile hit detection in `collision-projectiles.ts` to ensure 100% accuracy against newly spawned agents.

### Current Status

* Combat is now stable. Robots can reliably take damage after respawning, and movement is no longer hindered by static obstacle "gluing".

## [1.1.0-beta] - The Server Modularity & Monorepo Polish - 2026-04-11

### Major Structural Overhaul

* **The Backend Decoupling:** Successfully dismantled the 600+ line "God Object" (`game.service.ts`) into a clean, domain-specific architecture (`logic-evaluator`, `action-executor`, `pathfinder`, and `combat-math`).

### Technical Scars and Resolutions

* **Issue: The Infinite Stun-Lock (Trap Loop):** Fixed a critical physics bug where robots were permanently stuck in traps. Resolved by removing the forced velocity reset and implementing a 1500ms "immunity window" post-stun so robots can step out of the hitbox.

* **Issue: Terminal & UI Event Spam:** Resolved massive lag caused by the engine evaluating and broadcasting `MOVE` vs `FIRE` commands 60 times a second. Implemented a 250ms throttle/debounce on socket emissions.
* **Issue: Monorepo Config Hell:** Overcame strict TypeScript 5+ compilation errors. Replaced legacy `baseUrl` with native path mapping, synced `module` and `moduleResolution` to `Node16`, and explicitly defined `rootDir` to bridge cross-package imports cleanly.

### Key Technical Achievement

* **Domain-Driven Server Architecture:** The game server is now highly modular. Network sockets, AST logic evaluation, A* pathfinding, and physics execution are fully isolated, making the backend incredibly scalable and easy to debug.

### Current Status

* The backend codebase is now just as clean and atomic as the frontend "Trinity" refactor. The TypeScript compiler is 100% happy, and the physics engine is handling traps and respawns flawlessly.

## [1.2.0-beta] - The Rendering & UX Revolution

### Major Frontend Overhaul

* **The Atomic CommandConsole:** Dismantled the monolithic `CommandConsole` component into a fine-grained atomic design system (`BotSelector`, `ScriptEditor`, `CommandsDatabase`, `PrebuiltScripts`, `ReferencePanel`), reducing the main shell to under 70 lines.

### Technical Scars and Resolutions

* **Issue: The Cyberpunk HUD:** Replaced standard UI borders with deep glassmorphism (`backdrop-blur`) and neon tactical accents, establishing a consistent sci-fi aesthetic across the entire command interface.

* **Issue: The Snap Position Bug:** Robots were teleporting between server ticks instead of moving smoothly. Fixed by decoupling server position updates from the render loop — introduced a `targetPosition` ref that the `useFrame` hook lerps toward every frame using a frame-rate independent formula (`1 - Math.pow(0.01, delta * 10)`).

* **Issue: Layout Hierarchy Conflicts:** Resolved all UI overlapping issues by wrapping the left panel in a strict `flex-column` hierarchy, eliminating absolute positioning conflicts between the console and the 3D arena.

### Key Technical Achievement

* **60 FPS Smooth Interpolation:** Robot movement now interpolates at a true 60 FPS regardless of server tick rate. The `THREE.Vector3.lerp()` approach ensures buttery-smooth motion with zero jitter, even under network latency.

### Current Status

* The client rendering pipeline is now fully optimized. The CommandConsole is modular and maintainable, robot movement is visually fluid, and the UI hierarchy is conflict-free. Both frontend and backend are now production-grade in architecture.

## [1.3.0-beta] - The Performance Revolution & Character Identity

### Major Performance Overhaul

* **The React Re-render Death Spiral Elimination:** Replaced the main `gameState`
  useState with a `useRef` for zero re-renders. The 3D canvas now reads directly
  from `gameStateRef.current` inside `useFrame`, completely decoupling the rendering
  pipeline from React's reconciliation cycle.

### Technical Scars and Resolutions

* **Issue: 3,862ms Scripting Bottleneck:** Profiling revealed JavaScript was
  choking the main thread at 60x/second state updates. Fixed by implementing a
  dual-state architecture — `gameStateRef` updates instantly with zero re-renders,
  while a throttled `uiState` updates the DOM at 10x/sec only.

* **Issue: Per-frame Mesh Traverse:** The hit flash effect was calling
  `clonedScene.traverse()` every frame, creating massive CPU overhead. Fixed by
  pre-caching the mesh list in `useMemo` and iterating the cached array instead.

* **Issue: Unnecessary Scene Re-cloning:** The `color` prop was incorrectly
  included in `useMemo` deps, causing full GLB scene re-cloning on every render.
  Removed from deps since robot color is stable at runtime.

* **Issue: Projectile Jitter:** Laser projectiles were snapping between server
  positions at 20 FPS. Fixed by adding frame-rate independent lerp interpolation
  using `1 - Math.pow(0.001, delta * 20)`.

* **Issue: Camera Aspect Ratio:** The arena appeared square due to camera angle.
  Fixed by adjusting `PerspectiveCamera` position from `[0, 18, 18]` to
  `[0, 22, 14]` for correct 20x15 arena perspective.

### Key Technical Achievement

* **Unique Robot Identity System:** Replaced procedural geometry robots with
  unique GLB character models. Bot-1 uses a futuristic flying robot (224KB,
  animated) and Bot-2 uses a mech warrior (2MB, combat stance). Implemented via
  conditional `Bot1Model`/`Bot2Model` components with `useGLTF.preload()` for
  zero duplicate loading.

* **Zero Re-render 3D Pipeline:** The rendering architecture now follows R3F best
  practices — all rapid game state flows through refs, never through React state,
  achieving true 60 FPS with near-zero scripting overhead.

### Current Status

* The performance bottleneck has been eliminated. Scripting time dropped from
  3,862ms to near zero. The arena renders at true 60 FPS with unique robot
  characters, smooth projectile interpolation, and a fully decoupled rendering
  pipeline that scales cleanly for future features.

## [1.4.0-beta] - The Full-Stack Arena Integration - 2026-04-12

### Major Frontend & Backend Integration

The Arena is now a fully connected, real-time battle environment. The 3D scene, tactical radar, and command console are all wired to a live WebSocket server, replacing the previous mock/local state architecture.

### Technical Scars and Resolutions

* **Issue: The CORS Deadlock:** The NestJS WebSocket server was broadcasting an invalid `'.'` value in the `Access-Control-Allow-Origin` header, blocking all Socket.IO connections from the Next.js client. Resolved by explicitly setting `origin: "http://localhost:3000"` in both `app.enableCors()` and the `@WebSocketGateway()` decorator, then adding `IoAdapter` to enforce the configuration at the transport layer.

* **Issue: HTTP Polling Fallback:** Socket.IO was defaulting to HTTP long-polling, which inherited the broken CORS headers. Fixed by enforcing `transports: ["websocket", "polling"]` with `withCredentials: true` on the client, forcing a direct WebSocket upgrade and bypassing the polling layer entirely.

* **Issue: The Stale Dist Problem:** The `start:prod` script was pointing to `dist/main` while the monorepo build was outputting to `dist/apps/server/src/main`. Fixed by correcting the path in `package.json` to match the actual nested output structure.

**Issue: gameStateRef Null-Safety Cascade:** Multiple components (`SceneContent`, `ArenaModels`) were crashing on first render because `gameStateRef.current.robots` was `undefined` before the first server tick arrived. Resolved by introducing safe defaults (`?? []`) and extracting `robots` and `projectiles` into local variables at the top of each component.

* **Issue: State Shape Mismatch (players → robots):** The server was emitting `players[]` but the 3D scene expected `robots[]`. Fixed by implementing a `normalizeState()` function in `useGameState.ts` that maps both `matchState` and `gameState` socket events into a unified shape before storing in state.

* **Issue: Missing Robot Identity Fields:** The `MatchEngine` was initializing players with no `color`, `velocity`, or `rotation` fields, causing robots to render as invisible/white. Fixed by adding a `ROBOT_COLORS` palette and full identity initialization in both the constructor and `addPlayer()`.

* **Issue: Arena Coordinate Scale:** Robot positions were being generated in a `0-100` range while the 3D scene and tactical radar expected `0-800` / `0-600`. Fixed by scaling `Math.random()` output to `800x600` in `MatchEngine` to match engine bounds.

### Key Technical Achievement

* **Unified Real-Time Pipeline:** The full event chain is now live — `MatchEngine (Server)` → `WebSocket (NestJS Gateway)` → `useGameState (Client Hook)` → `gameStateRef (Zero Re-render)` → `3D Scene + TACTICAL_VIEW (R3F)`. Every component reads from a single source of truth with no prop drilling and no unnecessary re-renders.

* **Tactical HUD:** Introduced a `TACTICAL_VIEW` radar panel with real-time robot blips, directional triangles, mini health bars, and ID labels. Projectiles render as neon yellow dots on the radar, fully synchronized with the 3D scene.

### Current Status

* The Arena is now a fully operational real-time battlefield. Players can write AliScript, deploy it to their bot, and watch it execute live in both the 3D scene and the tactical radar simultaneously. The architecture is clean, the pipeline is stable, and the system is ready for: **Pathfinding, FOV-based targeting, and multiplayer session management.**

## [1.5.0-beta] - Security Hardening & Logic Evolution - 2026-04-13

### Major Core & Security Overhaul

The project has migrated from a basic state-sync to a secure, physics-driven architecture. Real-time protection is now enforced via JWT handshakes, and the game loop has been decoupled from simple increments to a dedicated physics engine.

### Technical Scars and Resolutions

* **Issue: The Unauthorized Socket Leak:** WebSocket connections were open to any client, posing a security risk. Resolved by implementing a custom JWT verification layer within the `MatchGateway` handshake. Unauthorized attempts are now terminated before hitting the `MatchEngine`.

* **Issue: Persistent Auth Desync:** Refreshing the Arena page caused a loss of session state. Fixed by implementing `localStorage` token persistence and a global `AuthGuard` on the client to ensure seamless re-authentication and automated redirects to `/login`.

* **Issue: Robot Ghosting & Duplication:** Each page refresh spawned a new robot instance while keeping the old one alive on the server. Resolved by implementing a cleanup routine on socket disconnection and an ID-check during the `joinMatch` event to reuse existing player states.

* **Issue: The Empty Arena Stagnation:** Single-player sessions felt static and broken without an opponent. Fixed by adding a default `bot-2` (Opponent) spawning logic in `MatchEngine`, ensuring the tactical environment is interactive even in solo testing.

* **Issue: Semantic State Mapping (scriptId):** The "Deploy" flow lacked a direct link to the user's specific code. Resolved by wiring the Dashboard to pass `scriptId` via URL query parameters, which the Arena now uses to fetch and inject the correct AliScript into the neural loop.

* **Issue: Backend Conflict Ambiguity:** Duplicate email registrations were throwing generic 500 errors. Fixed by mapping Prisma `P2002` unique constraint violations to a `ConflictException` (409) in `auth.service.ts` for clearer frontend feedback.

### Key Technical Achievement

* **Real-Time Physics Integration:** Successfully migrated the movement logic to the `@logic-arena/engine` core. Robots now operate via a dedicated `GameLoop` with velocity and collision parameters, moving beyond simple coordinate manipulation.

* **Cyberpunk UI Transition:** Complete visual overhaul of Auth and Dashboard layers. Replaced native browser elements with a unified "Cyberpunk" aesthetic featuring glassmorphism, neon status terminals, and decorative tech grids.

### Current Status

* The infrastructure is now enterprise-grade and secure. With JWT protection and the physics loop in place, the system is fully primed for: **Advanced Pathfinding, Fog-of-War implementation, and Multi-user competitive sessions.**

## [1.6.0-beta] - The Competitive Arena Update - 2026-04-14

### Major Feature Release

Transformed Logic Arena from a single-player sandbox into a fully competitive multiplayer platform with real-time lobbies, match persistence, and a global ranking system.

### Technical Scars and Resolutions

* **Issue: The Dual Gateway Conflict:** Two WebSocket gateways (`game.gateway.ts` and `match.gateway.ts`) were running simultaneously on the same port, causing event conflicts and state desync. Resolved by deleting the legacy gateway entirely and consolidating all real-time logic into a single JWT-authenticated `MatchGateway`.

* **Issue: The Empty Arena After Refresh:** The arena rendered an empty grid after page refresh due to wrong import path (`lib/useGameState` vs `arena/hooks/useGameState`). Fixed by correcting the import and adding localStorage token check with automatic redirect to `/login`.

* **Issue: The Phantom Bot Spam:** The default `bot-2` opponent was executing `FIRE + MOVE_FAST` in an infinite loop, overloading the CPU and causing terminal spam. Resolved by setting bot-2's default script to empty and increasing the `logicExecuted` emit throttle.

* **Issue: The Reset Dependency Leak:** After pressing "INITIALIZE RESPAWN", robots stopped responding to commands. Root cause: `reset()` created a new `GameLoop` instance but `ActionExecutor`, `Pathfinder`, and `LogicEvaluator` still held references to the old one. Fixed by rewiring all dependencies inside `reset()`.

* **Issue: Pathfinder Out-of-Bounds Crash:** The A* pathfinder crashed with `Cannot read properties of undefined` when robots moved beyond grid boundaries. Fixed by clamping all position-to-grid conversions with `Math.min/max` and calling `rebuildGrid()` before every pathfind operation.

* **Issue: Script Save Desync:** The `api-client.ts` was reading `jwtToken` from localStorage while login was saving to `token` key. Fixed by unifying both keys and wiring `handleDeployBrain` to auto-save scripts via `PUT /scripts/:id`.

### Key Technical Achievements

* **Real Multiplayer Lobby System:** Players can now create and join matches in real-time via a dedicated `/lobby` page. The server manages `lobbyMatches` state and broadcasts updates to all connected clients instantly.

* **Match Persistence & Ranking:** Match results are now saved to the database on game end. Winners receive +10 rank points, tracked in a global leaderboard accessible at `/leaderboard`.

* **Premium Winner Screen:** Full-screen cyberpunk victory/defeat overlay with animated grid background, glitch effects, pulsing orb, and tactical buttons (`REINIT_SESSION` / `ABORT_TO_LOBBY`).

* **Neural Combat Rankings:** Global leaderboard page (`/leaderboard`) displaying top operators by rank with gold/silver/bronze styling and win count tracking.

* **Server Modularization:** Decomposed monolithic `match.engine.ts` into clean domain modules: `robot-factory.ts`, `game-dependencies.ts`, `evaluator/expression-evaluator.ts`, and `executor/cooldown-manager.ts`.

* **AliScript Documentation:** Complete language reference added to `docs/aliscript-language.md` covering all commands, conditionals, variables, and example scripts.

### Current Status

* Logic Arena is now a fully operational competitive platform. Players can register, write AliScript, deploy to the lobby, battle in real-time, and climb the global leaderboard. Ready for: **Fog of War, Match Replay System, and Tournament Mode.**

## [1.7.0-beta] - The Tournament & Replay Evolution - 2026-04-15

### Major Feature Release

Introduced the Tournament Bracket System, 2D Canvas Match Replay System, an interactive AliScript Documentation page, a dedicatedUserProfile, and unified Cyberpunk Dashboard Navigation.

### Technical Scars and Resolutions

* **Issue: Replay Rendering Leaks:** Fixed stale React closures and duplicate intervals during playback rendering to ensure the Canvas Replay Viewer maintains smooth interpolation and does not overload the client's memory.

* **Issue: Irregular Bracket Computations:** Fixed crash attempting to create a full tournament bracket for 2 players. Re-architected backend `start` logic to dynamically handle safe participant distribution for 2, 4, and 8-player formats without indexing errors.

### Key Technical Achievements

* **Tournament Bracket System:** Engineered a comprehensive tournament system supporting CRUD, join mechanisms, automated 2/4/8-player visual bracket generation, automatic winner advancement, and a real-time SVG "Bracket Viewer.

* **Canvas Match Replay System:** Implemented a high-fidelity playback engine. Backends now serialize arena snapshots (robots & projectiles) every 10 ticks and save them to a new optional `replayData` field in Prisma. Features timeline scrubbing and playback speed controls.
* **Interactive AliScript v1.0 Documentation:** Developed an interactive, hacker-themed documentation page featuring a live parse console, 15 actionable commands, 6 tactically filtered categories, and quick reference cards.
* **Operator Profile & Navigation:** Shipped aUserProfile page detailing gameplay stats and match history, combined with a unified cyberpunk Layout containing a sticky sidebar, 'DISCONNECT' command, active route highlighting, and smooth scanline overlays.

### Current Status

* The platform is now a comprehensive competitive tactical suite, fully capable of autonomous replay recordings and structured e-sport tournament brackets. Fully modularized dashboard and documentation architecture further grounds the Logic Arena experience.

## [1.8.0-beta] - AliScript v2.0, Environment Stability & Dynamic Orchestration - 2026-04-16

### Major Feature Release

Launched AliScript v2.0 with Fox-Mind optimization and a new Zen-IDE, stabilized the arena environment with an advanced physics/pathfinding system, and implemented dynamic mode orchestration for Combat, Racing, and Training modes.

### Technical Scars and Resolutions

* **Issue: The "Circular Jitter" Navigation Loop:** Robots would enter a "spasmodic oscillation" when near traps or when re-calculating paths near their current coordinates, causing them to spin in place instead of moving.

* **Resolution:** Overhauled the A* heuristic to a Weighted Cost Grid. Instead of binary "pass/block" logic, we assigned high costs to TRAP (3.0) and LAVA (5.0) cells. Additionally, implemented a Self-Waypoint Skip logic that instantly consumes waypoints within a half-cell radius, breaking the recursive "pointing-at-self" feedback loop.

* **Issue: The "Zero-Frame" Training Termination:** The TRAINING_SOLO mode would instantly crash to the winner screen upon launch because the server's win-condition logic was hardcoded to end the match if < 2 robots were alive.

* **Resolution:** Patched the MatchGateway's victory-check heartbeat to ignore the robot count threshold when the 'TRAINING_SOLO' flag is active, enabling an indefinite sandbox session.

* **Issue: The "Sticky Geometry" State Leak:** Switching between Racing and Combat modes via the dashboard would result in "Ghost Obstacles" where the client rendered new mode visuals but the server physics remained locked to the previous match configuration.

* **Resolution:** Implemented Aggressive State Purging on the client-side useEffect and a complete MatchEngine Reconstruction on the backend. We also introduced serverConfirmedMode to ensure the UI badge only updates after a successful handshake with the fresh backend ruleset.

### Key Technical Achievements

* **AliScript v2.0 & Zen-IDE:** Added full support for `WHILE` loops, `IF/ELSE`, math operators, and user-defined `FUNCTIONS`. Launched a new Zen-mode IDE featuring translucent glassmorphism, background Web Worker parsing, and neon syntax highlighting.

* **Engine Optimization & Networking:** Migrated from ES6 Maps to V8-optimized Record structures for 3x faster memory indexing. Implemented Delta-State diffing, reducing WebSocket payload size by ~80%.
* **Arena Physics & Pathfinding:** Implemented a Weighted A* Cost Grid for TRAP/LAVA navigation and integrated SpatialGrid partitioning for O(1) collision performance. Defined a core 3-pillar obstacle system (SOLID, TRAP, LAVA) with unique physics and neon-pulsing visual models.
* **Dynamic Mode Orchestration:** Deployed custom Cyberpunk UI for mode selection, fixed the "Sticky Mode" bug with aggressive server-side match reconstruction, and synced HUD badges securely via `serverConfirmedMode`.
* **Training Sandbox Patch:** Bypassed the auto-termination logic for `TRAINING_SOLO` to create a truly infinite testing environment.

### Current Status

* The ecosystem has reached a major milestone with a Turing-complete-ish v2.0 scripting language and a highly optimized O(1) physics engine capable of scaling dynamically across combat, racing, and solo training modes.

## [1.9.0-beta] - Secure Identity & Physics Decoupling - 2026-04-17

### Major Feature Release

Implemented a full-scale **Cyberpunk Identity System** featuring Email OTP verification, Zod-hardened security, and a dynamic Player Garage. Overhauled the physics engine to resolve high-velocity collision "stickiness" and server-client state desync.

### Technical Scars and Resolutions

* **Issue: The "Ghost In The Machine" Desync:** Robots appeared frozen on the client while firing from empty air. This was a critical failure where the server's movement executor updated coordinates, but the Delta-State diffing logic failed to broadcast `position` and `rotation` updates to the frontend.
* **Resolution:** Refactored `match.gateway.ts` to enforce a strict synchronization heartbeat. Optimized the `safeSnapshot` deep-cloning logic to ensure that every frame's translation vector is captured and pushed to the client, effectively "re-embodying" the ghost robots.

* **Issue: The "Sticky Geometry" Logic Conflict:** Robots would "glue" to walls when a user manually changed the `rotation` during a collision. The user's `SET rotation` command was fighting the engine's reflection vector, pinning the chassis against the obstacle bounds.
* **Resolution:** Instituted a **30-tick Hardware Collision Lockout**. During this window, the engine ignores all manual AliScript steering overrides, granting the physics solver total authority to "eject" the robot using a boosted `REPEL_FORCE` (5.0).

* **Issue: The "Race-Condition Loop" Crash:** The automation system entered an infinite reboot cycle (`MODULE_NOT_FOUND`) because `nodemon` was attempting to execute the server before the TypeScript compiler finished writing the `dist/` files.
* **Resolution:** Migrated to a synchronized **Monorepo Orchestrator** using `concurrently`. Injected a `--delay 2.5` fallback to the watcher, ensuring the physics engine and logic-parser builds are fully "baked" before the server attempts to ingest them.

### Key Technical Achievements

* **Authentication Hardening (Zod & Helmet):** Integrated `zod` for strict schema enforcement (8+ chars, complex regex) and `helmet` for secure HTTP headers. Bumped password hashing to **Bcrypt Round 12**.

* **Player Garage & Custom Loadouts:** Launched a 3D Garage UI with `OrbitControls` allowing users to persist custom chassis and hex-color tints directly to the Supabase/Prisma layer.
* **Email Lifecycle (Nodemailer OTP):** Deployed a robust verification system using Gmail SMTP. New users are now intercepted by a `/verify-email` gate, requiring a 6-digit OTP stored with a secure TTL in the DB.
* **Advanced UX Error Handling:** Replaced generic "400" errors with a granular, human-readable error chip system and a real-time **Password Strength Indicator** with a 5-stage visual feedback loop.
* **Global & Route-Specific Throttling:** Implemented a dual-layer defense: a global 60 req/min limit and a high-security 5 req / 15 min limit for auth endpoints to thwart brute-force attempts.
* **The "Return to Hangar" 404:** Designed and deployed a stylized `notFoundPage.tsx` that maintains the game's aesthetic even during navigation failures.

### Current Status

* The platform is now **Security-Hardened** and **UX-Optimized**. The bridge between server physics and client rendering is fully synchronized, and the development environment is 100% automated via `watch:all`.

## [2.0.0] - Global Deployment & Infrastructure Hardening - 2026-04-18

### Major Release: Production Launch on logicarena.dev

The platform has been fully containerized, deployed to a live cloud
infrastructure, and is now accessible worldwide at <https://logicarena.dev>.
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

* The platform is now **live in production** at <https://logicarena.dev>.
All core game systems are operational. The infrastructure is
containerized, SSL-secured, and deployable via a single
`docker compose pull && docker compose up -d` command.

## [2.1.0] - The Identity, UI Evolution & Mobile-First Transformation - 2026-04-21

### Major Feature Release

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

* Logic Arena is now a **visually cohesive, theme-aware, mobile-first
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

* **Settings Page (5 Sections):** Launched a fullusersettings
  experience with:UserIdentity (username/email updates), Security
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
  from sidebar. Connected indicator fills freed sidebar space.

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

* Logic Arena codebase is now fully modular with no critical-path
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
 userprecedence tower (OR→AND→comparison→arithmetic→unary→primary),
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
  `astar.ts` (A*core only), `index.ts` (clean re-exports). Zero
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

* **Issue — "The AliScriptUserBlindspot":**
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

* Every major server module is now SOLID-compliant with no file
  exceeding ~150 lines. The AliScript engine is audited, tested,
  and handles alluseredge cases. The A* pathfinder is O(log n)
  and zig-zag free. The PWA is live with native-feeling pull-to-refresh
  and full Android theme sync. Ready for: **Fog of War, Energy System
  UI, and University Competition features.**

## [2.4.0] - The Arena Engine Overhaul & Vision Reckoning - 2026-04-26

Shipped a complete arena engine stabilization pass — fixing the STASIS
energy system from the ground up, resolving a months-long rotation
coordinate mismatch between server and client, eliminating every
pathfinding oscillation pattern, and delivering a pixel-perfect FOV
cone that matches server logic down to the radian.

---

### New Features

* **Rotation System v2.0 — Three Independent Controls:**
  Formally separated `rotation` (body/tracks), `fovDirection` (scanner
  eye), and `lockVision` (link toggle) into three fully independent
  systems. Added a dedicated amber `[ LOCK_VISION: LINKED/FREE ]` toggle
  button to both DesktopHUD and MobileTopRightHUD. Auto-disables lockVision
  on any manual `SET rotation` or `SET fovDirection` call. Visual cone
  and server isInCone detection are now mathematically identical.

* **Rotation System Guide in Docs:**
  Added a full amber-themed `◎ ROTATION SYSTEM v2.0` section to the
  docs page with 4 sub-sections: THE 3 CONTROLS table, COMMON ANGLES
  cardinal grid, CONFLICT RESOLUTION table, and 5 interactive example
  scripts with LOAD_TO_CORE buttons. Added `docs/rotation-system.md`
  to the docs folder for permanent reference.

* **Script Card Delete + Icon Bar Redesign:**
  Added delete functionality to dashboard script cards with inline
  confirmation (`CONFIRM DELETE? [YES] [NO]`, 3s auto-cancel) and
  optimistic UI (instant removal, restore on failure). Replaced 3
  wide buttons with a compact 4-icon action bar using lucide-react:
  Pencil (edit), Swords (lobby), Trophy (arena), Trash2 (delete).
  Touch-friendly `w-12 h-12` targets on mobile.

* **Deploy Brain — Engine Only:**
  Removed the silent auto-save that was persisting every Deploy Brain
  action to the database. Deploy now sends script to the engine only.
  Scripts are exclusively managed from the Garage/Dashboard editor.

---

### Energy System — The Long Road to STASIS

This release marks the end of a multi-week battle to make the energy
and STASIS system work correctly. Every issue below was a real blocker
that required a full diagnosis cycle.

* **Issue — "The Phantom Regen" (Energy Never Depleted):**
  The regen rate (+3/tick) was running unconditionally every tick,
  offsetting the combined cost of SCAN+MOVE (5/tick) and making STASIS
  mathematically unreachable. The robot would drain 5 and recover 3
  simultaneously, producing a net -2 that took ~50 ticks — but regen
  kept kicking in mid-drain and the robot never hit zero.

  **Resolution:** Regen now runs ONLY when `robot.inStasis === true`.
  Zero regen while active. The robot drains freely and recharges only
  during STASIS.

* **Issue — "The Frozen Ghost" (STASIS Didn't Stop Movement):**
  The STASIS flag was being set correctly but the robot kept moving
  because `robot-updater.ts` was applying residual velocity to position
  every tick regardless of stasis state.

  **Resolution:** Added early return in `robot-updater.ts` when
  `robot.inStasis` — velocity zeroed, position frozen, rotation frozen,
  FOV frozen. Only `energyManager.regen()` runs during STASIS.

* **Issue — "The Spinning Corpse" (SCAN Still Running in STASIS):**
  Even after freezing movement, the SCAN command kept rotating the FOV
  cone because it had its own `case NodeType.ScanStatement` in
  `block-executor.ts` that ran after the STASIS early return.

  **Resolution:** Moved the `if (robot.inStasis) return` to before the
  for loop in `executeBlock()`, then added `if (robot.inStasis) break`
  inside the `WhileStatement` case to prevent the loop from continuing
  to invoke `executeBlock` recursively while in STASIS.

* **Issue — "The Eternal WHILE" (STASIS Didn't Stop Loop Iterations):**
  The `WHILE TRUE DO` loop was calling `executeBlock` up to
  `MAX_WHILE_ITERS` times per tick even when `inStasis` was true,
  because the early return only exited `executeBlock` — the while loop
  itself kept incrementing `iters` and re-entering.

  **Resolution:** Added `if (robot.inStasis) break` as the first check
  inside the `WhileStatement` iteration loop, preventing even a single
  iteration from firing during STASIS.

* **Issue — "The Memory Time Capsule" (STASIS Wake Resumed Old State):**
  When energy recovered and the robot exited STASIS, the `WHILE` loop
  resumed from its last iteration state, including stale variables and
  pending wait ticks. The robot behaved as if it had never been in STASIS.

  **Resolution:** Added `wasInStasis` tracking in `logic-facade.ts`.
  On the `true → false` STASIS transition, `resetRuntimeState()` wipes
  `memory{}` and clears all action cooldowns. Robot wakes up with a
  completely clean execution slate.

* **Issue — "The Identifier Shadow" (IN_STASIS Always Wrong):**
  The identifier resolver checked `if (name in memory)` before resolving
  built-in engine values. Any script that wrote `SET MY_ENERGY = 100`
  permanently shadowed the live sensor — `IN_STASIS` would freeze at
  whatever the script last wrote and never reflect actual energy drain.

  **Resolution:** Added `RESERVED_IDENTIFIERS` set in
  `identifier-resolver.ts`. Built-in engine values (`MY_ENERGY`,
  `ENERGY_PCT`, `IN_STASIS`, all FOV identifiers) now resolve from live
  `robot` state before the memory lookup — scripts can never shadow them.

* **Issue — "The Manual Command Bypass" (FIRE Costs No Energy via Override):**
  The Execute Override input in the HUD sent commands via `manualCommand`
  socket event which routed directly to `actionExecutor.executeAction()`
  without passing through the energy system. Players could FIRE for free
  indefinitely via the override console.

  **Resolution:** `receiveManualCommand` in `match.engine.ts` now routes
  through `energyManager.deduct()` before executing. STASIS gate added
  to the manual command handler — emits `STASIS` error to client when
  blocked. Costs are identical to scripted commands.

* **Issue — "The Energy Mismatch" (maxEnergy = 1000 vs costs of 1-20):**
  The energy system had `maxEnergy` set to 1000 while command costs
  ranged from 1 to 20, making STASIS take hundreds of ticks to reach.
  The docs showed different values from the engine. Three separate files
  had three different numbers.

  **Resolution:** Unified all energy values across engine, server, and
  docs: `maxEnergy = 100`, STASIS entry `≤ 0`, exit `≥ 20`. Final
  rebalanced costs: SCAN 3, MOVE 2, MOVE_FAST 4, PATHFIND 3, FIRE 8,
  BURST_FIRE 18. SCAN+MOVE loop hits STASIS in ~20 ticks (~1 second).

---

### FOV & Rotation — The Coordinate War

* **Issue — "The 90° Blindspot" (Visual Cone vs Server Logic Mismatch):**
  The FOV cone geometry was built pointing along the +X axis using
  `cos → X, sin → Z` vertices. Three.js GLTF models have their forward
  direction along +Z. The `rotation.y = -fovDirection` applied to a
  +X-pointing cone produced a permanent 90° offset — the visual cone
  was pointing left of where the server computed detection. Robots
  appeared to fire at enemies outside their visible cone.

  **Resolution:** Swapped the fan geometry vertices in `FovCone.tsx`
  to `sin → X, cos → Z` so the cone fans forward along +Z, matching
  the robot body. Applied `Math.PI / 2 - angle` coordinate mapping to
  align 2D server math (East=0, CCW+) with 3D scene orientation.
  Visual cone and `isInCone()` server check are now pixel-perfect.

* **Issue — "The Body Follows the Eye" (fovDirection Rotating the Robot):**
  `RobotModel.tsx` was prioritizing `fovDirection` over `rotation` for
  the body's 3D orientation. The check was:
  `if (typeof fovDirection === 'number') targetRot = HALF_PI - fovDirection`
  Since `fovDirection` always exists (defaults to 0), the body always
  followed the scanner — setting `SET fovDirection = 3.14` rotated the
  entire robot, not just the cone.

  **Resolution:** Robot body now exclusively uses `rotation` for its
  3D orientation. `fovDirection` is completely ignored by the body
  renderer — it is the `FovCone`'s responsibility only.

* **Issue — "The Secret Override" (SET rotation Poisoned fovDirection):**
  In `block-executor.ts`, the `AssignmentStatement` handler for rotation
  aliases was secretly writing `robot.fovDirection = val` alongside
  `robot.rotation = val`. Every `SET rotation = X` silently overrode
  the scanner direction, making `fovDirection` impossible to control
  independently.

  **Resolution:** Removed the `robot.fovDirection = val` write from
  the rotation alias handler. `SET rotation` now exclusively modifies
  the body. `SET fovDirection` exclusively modifies the scanner.
  Both auto-disable `lockVision` correctly.

---

### Pathfinding — Three Oscillation Patterns Eliminated

* **Issue — "The U-Turn at Journey's End" (Path Exhaustion Recompute):**
  When the A* path was fully consumed, the robot immediately triggered
  a full recompute from its current position. The nearest grid cell
  centre was always slightly behind the robot (e.g. at x=230 when
  robot was at x=235), so the first waypoint of the new path was
  behind the robot — causing a U-turn, overshoot, another recompute,
  and an infinite back-and-forth oscillation at the destination.

  **Resolution:** When path is exhausted and target hasn't moved
  more than 90 units, steer directly to target via `atan2` without
  rerunning A*. A* only recomputes when target genuinely repositions
  beyond the tolerance threshold.

* **Issue — "The BACKUP Rattle" (Oscillating Reverse Thrust):**
  BACKUP used `robot.rotation` to compute backward velocity. But
  `robot-updater.ts` runs `atan2(vy, vx)` every tick to face the
  direction of travel — when BACKUP set negative velocity, physics
  flipped `rotation` to face the new direction, then BACKUP computed
  "backward" from the flipped rotation and drove forward again.
  Repeat every tick → infinite rattle.

  **Resolution:** Added `facingDirection` field to the `Robot`
  interface. `MOVE`/`MOVE_FAST` store `robot.rotation` into
  `facingDirection` on execute. `BACKUP` reads `facingDirection`
  exclusively — a value that physics never touches. On first BACKUP
  call (no prior MOVE), initializes from `robot.rotation` at that
  moment and locks it. Rattle eliminated permanently.

---

### Arena Polish

* **Robot Materials:** Removed aggressive `emissiveIntensity = 0.3`
  override and `pointLight intensity={3.0}` from `RobotModel.tsx`.
  Robots now match their Garage appearance — original GLB materials
  show through. Emissive activates only on hit flash or STASIS glow.

* **Script Editor:** Fixed double scrollbar in the AliScript editor.
  Scroll now delegated exclusively to the textarea. `onScroll` listener
  syncs the syntax highlight overlay `scrollTop` programmatically.

* **Autocomplete Dropdown:** Fixed clipping — dropdown now opens upward
  (`bottom-[calc(100%+4px)]`) to avoid container overflow.

* **tsconfig Cleanup:** Removed deprecated `baseUrl: "./"` and
  `ignoreDeprecations: "6.0"` from `apps/server/tsconfig.json`.
  Docker builds now pass cleanly with TypeScript 5.7.3.

---

### Docs Updates

* Fixed stale energy costs in `COMMAND_TABLE`: MOVE 1→2, MOVE_FAST
  3→4, BACKUP 1→2, PATHFIND 2→3, SCAN 5→3, FIRE 15→8, BURST_FIRE 20→18.
* Fixed `IDENTIFIER_TABLE`: MY_ENERGY range 0-1000→0-100, IN_STASIS
  exit threshold 50→20, rotation/fovDirection/lockVision descriptions
  clarified with zero cross-contamination language.
* Added `docs/rotation-system.md` — permanent rotation system reference.

---

### Current Status

* The arena engine is now stable and mathematically consistent. What
  you see on screen is exactly what the server computes. STASIS works
  as designed. BACKUP drives backward. PATHFIND reaches its target
  without oscillating. The FOV cone fires when the enemy is inside it
  and only then. Ready for: **University Competition, Fog of War,
  and multiplayer stress testing.**

## [2.5.0] - The Arena Mastery Update — Performance, Modes & Engine Hardening - 2026-04-27

Shipped a complete performance overhaul eliminating every WebGL bottleneck
and memory leak, transformed Training and Racing modes into legendary
cyberpunk experiences, hardened the energy/STASIS system to professional
grade, and discovered a server-melting ghost match exploit that was running
dead matches at full CPU indefinitely.

---

### New Features

* **Legendary Training Mode — Cyberpunk Proving Ground:**
  Complete overhaul of TRAINING_SOLO into a high-tech underground robot
  training facility. Added `TrainingEnvironment.tsx` as a lightweight
  addon layer (no geometry duplication — unified level layout preserved).
  Added `TrainingDummy.tsx`: holographic target dummies with rotating
  octahedron core, team-color emissive glow, dynamic health ring
  (green→yellow→red), float-up damage numbers with custom CSS keyframe
  animation, and wireframe reassembly animation on respawn. Added
  `TrainingHUD.tsx`: glassmorphism training dashboard tracking session
  time, shots fired, accuracy%, damage dealt, energy consumed, and kills.
  TARGET ELIMINATED toast on dummy destroy. ENERGY DEPLETED overlay during
  STASIS. iPhone-style 2×2 square glass widget on mobile (top-left corner),
  matching tactical radar dimensions exactly.

* **Training Mode — Dummy Health & Respawn System:**
  Dummies now have real health and can die properly. Removed server
  auto-respawn loop — dummies stay dead until player manually respawns
  them. Added `dummyKilled` socket event emitted once per death. Added
  `respawnDummies` socket event — only heals `dummy-*` bots, never
  triggers full match reset. RESPAWN DUMMIES button injected into
  `MobileTopRightHUD` showing alive/total counter (e.g. 2/3), pulsing
  red when all dummies are eliminated. Robot in training mode shows
  energy bar only (yellow `#ffcc00`) — health bar hidden. Dummy health
  bar rendered in blue (`#00bbff→#0055cc`) to differentiate from energy.

* **Legendary Racing Mode — Full Time Trial Experience:**
  Complete RACING_OBSTACLES circuit redesign with strategic obstacle
  placement: One-Way Enforcer (SOLID block behind spawn forcing clockwise
  direction), The Weave (SOLID pillars on top straight requiring dodge
  logic), Mud Traps (TRAP zones with -60% velocity penalty), and Lava
  Corners (LAVA on inside lines carrying health damage risk). Introduced
  `FINISH_LINE` obstacle type to the core engine and client types. Finish
  line rendered as a glowing neon-green scanner strip via `ObstacleModel.tsx`.
  `checkWinCondition` triggers victory the instant the robot hull touches
  the `FINISH_LINE`. Added `RacingHUD`: neon-yellow TIME TRIAL dashboard
  tracking elapsed time, energy consumed, and penalties. Mobile: iPhone-style
  2×2 glassmorphism grid widget (top-left) — time/energy/penalties/target —
  perfect height match with tactical radar, zero arena obstruction.

* **LegendaryUserProfile — Radar Chart & Combat Analytics:**
  Added `combatStats Json` column to the `User` model in `schema.prisma`
  (pushed to Supabase). Full-stack combat stat pipeline: `match.persistence.ts`
  computes 5 dimensions from end-of-match robot data using a weighted rolling
  average (35% new / 65% history) and persists to `User.combatStats`. Stats:
  Efficiency (`damage/energy×100`), Aggression (`damage/200`), Defense
  (final health%), Precision (`damage/energy/80`), Speed (`energy/sec/3`).
  New profile components: `RadarChart.tsx` (pure SVG pentagon animated
  0→value with cubic ease-out, colored vertex dots and glow filter),
  `StatRing.tsx` (6 animated circular progress rings: win rate, wins, rank,
  efficiency, aggression, precision), `OperatorBadge.tsx` (tier system:
  Ghost→Circuit→Synaptic→Overdrive→Apex→Legendary). Full legendary profile
  redesign: hex avatar, dominant stat label, hero section, analytics panel.

* **GET_X() Query Functions — AliScript v2.3:**
  Added `QueryStatement` AST node type to the logic-parser lexer and parser.
  8 query functions: `GET_HEALTH()`, `GET_ENERGY()`, `GET_ENERGY_PCT()`,
  `GET_DISTANCE()`, `GET_POSITION()`, `GET_ROTATION()`, `GET_FOV_DIR()`,
  `GET_VISIBLE_COUNT()`. Executed as one-shot emit per script deployment.
  Results appear in robot speech bubble for 2 seconds and in telemetry log
  in cyan: `[QUERY] health = 80`. Dedicated `shouldEmitQuery` tracker in
  `CooldownManager`. All 8 functions added to autocomplete with cyan query
  badge. New QUERY FUNCTIONS section added to docs page.

* **PvP Match Enforcement & Robot Model Sync:**
  Default `bot-2` removed from arena when opponent connects — PvP matches
  have exactly 2 real players. `isPvP` computed dynamically from absence of
  bot participants. EXECUTE RESPAWN hidden in PvP for fair play. BotSelector
  robot switcher hidden in PvP — each player locked to their own robot.
  `selectedRobotId` fetched during matchmaking and passed to engine as `model`
  property. `ArenaModels` maps `robot.model` ID to correct GLB file dynamically.
  Players see their chosen robot and opponent's actual chosen robot. `useGameState`
  initializes `selectedRobotId` to `currentUserId` — prevents both players
  defaulting to creator's robot. `MatchLobbyManager` verifies `updateLogic`
  and `manualCommand` payloads match authenticated user — prevents cross-player
  robot hijacking.

* **Smart Script Resolution on Challenge Accept:**
  Rewrote `ArenaPage` loading phase to handle missing `scriptId` URL param.
  Checks `localStorage` cache first, falls back to fetching user scripts and
  auto-selecting the first one. Graceful error only when user has zero scripts.
  Resolves the `CRITICAL_SYSTEM_ERROR` crash on direct challenge acceptance.

---

### Performance — Six Bottlenecks Eliminated

After a comprehensive profiling audit revealed the platform was running at
a fraction of its potential, six surgical performance fixes were applied
in sequence.

* **FIX 1 — Frontend State Thrashing (Obstacles in Tick Stream):**
  Static obstacle arrays were included in every 10Hz WebSocket payload,
  forcing `ArenaModels` to reconcile 15+ `ObstacleModel` components 10
  times per second. Initialized `obstaclesRef` as a `useRef<ObstacleState[]>([])`.
  The WebSocket listener populates the ref exactly once from the initial
  payload and strips obstacles from all subsequent `setUiState` calls.
  Result: 15+ heavy obstacle components never trigger React reconciliation again.

* **FIX 2 — 3D Scene Re-renders from HUD Updates:**
  `uiState` updates were forcing `ArenaPage` and the entire `Scene3D`
  canvas to re-render up to 10 times per second. Wrapped `Scene3D` in
  `React.memo` and passed `obstaclesRef.current` (stable reference) to
  the scene instead of live `uiState`. Scene now reads from `gameStateRef`
  inside `useFrame` — completely decoupled from React lifecycle.
  Result: 3D canvas is fully insulated from HUD timer and stat updates.

* **FIX 3 — WebGL Draw Call Explosion (Individual Obstacle Meshes):**
  Every obstacle instantiated its own `THREE.BoxGeometry`,
  `THREE.MeshStandardMaterial`, and draw call. Racing Mode with 20+
  obstacles produced 20+ geometries, 20+ materials, and 20+ GPU draw
  calls simultaneously. Rewrote `ObstacleModel.tsx` as `ObstaclesInstanced`
  using `THREE.InstancedMesh`. Obstacles grouped by type (SOLID/TRAP/LAVA),
  each group rendered as one instanced mesh with `setMatrixAt()` positioning.
  Result: 30 draw calls → 4 draw calls. One geometry and one material per
  obstacle type regardless of count.

* **FIX 4 — useFrame Saturation (JS Animation Callbacks):**
  Every LAVA and TRAP obstacle ran its own `useFrame` JS callback at 60fps
  to calculate sinusoidal color pulsing. 10 lava blocks = 10 separate JS
  callbacks per frame choking the main thread. Removed all individual
  `useFrame` hooks from obstacles. Injected custom fragment shaders via
  `onBeforeCompile` into each material. A single global `useFrame` updates
  a shared `uTime` uniform. Pulse math (`sin(uTime * 1.8)`) runs entirely
  on the GPU.
  Result: 0 JS callbacks per frame for obstacle animations.

* **FIX 5 — Server Memory Leak (Replay Snapshot OOM):**
  `captureReplaySnapshot()` deep-cloned the entire game state every 50ms.
  A 5-minute Racing match generated 6,000 deep-cloned objects stored
  unboundedly in the Node.js V8 heap — a guaranteed `OutOfMemory` crash
  under concurrent load. Added `MAX_REPLAY_SNAPSHOTS = 300` constant and
  switched to 1fps capture (every 20th tick instead of every tick). Added
  ring-buffer: `if (snapshots.length > MAX) snapshots.shift()`.
  Result: V8 heap strictly bounded at 300 objects per match regardless of
  match duration. OOM crashes eliminated.

* **BONUS FIX — Static Data in Delta-Diff (Bandwidth Waste):**
  The `obstacles` and `mapBoundaries` arrays were included in every delta
  broadcast even though they never change mid-match, wasting bandwidth and
  CPU on deep-diffing static geometry 20 times per second. Added
  `STATIC_FIELDS = ['obstacles', 'mapBoundaries']` to `match.delta-diff.ts`.
  These fields are sent once in the initial full payload and completely
  excluded from all subsequent diffs.
  Result: Measurable bandwidth reduction and eliminated unnecessary
  serialization CPU cycles on every tick.

---

### Technical Scars and Resolutions

* **Issue — "The Ghost Match Massacre" (Dead Matches Running Forever):**
  The most catastrophic leak discovered in this release. When a player
  pressed "Back" or closed the browser tab, their WebSocket disconnected
  from the server — but the `MatchEngine` physics loop kept running at
  full speed indefinitely. The AliScript evaluator kept processing commands,
  the A* pathfinder kept computing paths, and the game loop kept broadcasting
  state to a room with zero connected clients. In a busy hour of play,
  hundreds of ghost matches would accumulate in memory, consuming 100% CPU
  and eventually crashing the entire backend. The server terminal was
  literally printing `MOVE_FAST` commands for players who had left minutes ago.

  **Resolution:** Wired the `MatchGateway` WebSocket disconnect lifecycle
  properly. On client disconnect: checks if the user was hosting a lobby
  and deletes it. If `numClients === 0` after disconnect, immediately calls
  `match.stop()` and destroys the engine instance from RAM. Match lifecycle
  is now strictly tied to connected client count — the moment the last player
  leaves, the match dies with them.

* **Issue — "The Shader Identity Crisis" (uTime Undeclared Identifier):**
  After moving obstacle pulse animations to GPU shaders via `onBeforeCompile`,
  the WebGL compiler crashed every obstacle material with
  `ERROR: 0:1656: 'uTime': undeclared identifier`. The `uTime` uniform was
  correctly added to `shader.uniforms` but never declared inside the GLSL
  source code before `void main()`. The GPU compiler saw a variable used
  but never defined and detonated the entire shader program, crashing the
  WebGL context on all obstacle types simultaneously.

  **Resolution:** Injected `uniform float uTime;\n` directly into the
  fragment shader source string before `void main() {` via
  `shader.fragmentShader.replace('void main() {', 'uniform float uTime;\nvoid main() {')`.
  The GLSL compiler can now resolve the uniform declaration before the
  pulse calculation executes.

* **Issue — "The Half-Circle Trap" (InstancedMesh Rotation Order):**
  After migrating obstacles to `THREE.InstancedMesh`, circular TRAP zones
  appeared as half-circles clipped through the arena floor. The Euler
  rotation was applied as `dummy.rotation.set(-90°, obstacleRotation, 0)`.
  Because Three.js applies rotations in X→Y→Z order, the -90° X tilt
  happened first, then the Y-axis rotation was applied to an already-flat
  object — causing the Y-axis to point forward/backward instead of up/down
  and flipping half the geometry underground.

  **Resolution:** Reversed the rotation application order:
  `dummy.rotation.set(0, rotationY, 0)` first (heading), then
  `dummy.rotateX(rotX)` second (tilt). With the correct order, the
  Y-rotation orients the circle correctly in the horizontal plane before
  it is laid flat on the ground.

* **Issue — "The WebGL Context Massacre" (GPU Memory Bomb):**
  Training Mode's `TrainingEnvironment.tsx` called `createCornerTexture()`
  directly inside the React render cycle to create canvas textures for
  corner markers. Because `useGameState` syncs game state from the socket
  10 times per second, the component re-rendered 10 times per second.
  With 4 corners, this was creating 40 new `<canvas>` DOM elements and
  40 new GPU `THREE.CanvasTexture` objects every single second. Within
  2 seconds, the browser's GPU memory panicked and killed the WebGL context,
  leaving a completely blank white screen.

  **Resolution:** Wrapped the texture creation in `useMemo(() => createCornerTexture(), [])`.
  The canvas and GPU texture are now generated exactly once on mount and
  reused for all 4 corners indefinitely. The WebGL context crash was
  eliminated instantly. The corner markers were subsequently removed
  entirely as they served no gameplay purpose.

* **Issue — "The Bouncy Math Simulator" (Damage Number Animation):**
  Training dummy damage numbers were implemented using Tailwind's
  `animate-bounce` class instead of a custom float-up animation. Combined
  with a broken `useEffect` cleanup, shooting the dummy rapidly spawned
  hundreds of `-10` text nodes that bounced infinitely without despawning,
  turning the arena into what could only be described as a bouncy castle
  of mathematics.

  **Resolution:** Wrote a custom `animate-float-up` CSS keyframe that
  smoothly floats numbers upward while fading out. Fixed the `damageNumbers`
  array cleanup so each hit entry expires after exactly 1 second via a
  `setTimeout` with proper state cleanup. The spawning component no longer
  returns `null` on dummy death (which was preventing the respawn animation
  from playing), ensuring the wireframe reassembly effect runs to completion.

* **Issue — "The Duplicate Speech Bubble" (Double Print Above Robot):**
  After moving the robot speech bubble inside `RobotModel.tsx` to fix
  the detachment issue (bubble trailing behind the moving robot), the
  old `SceneOverlay.tsx` was still rendering an identical bubble using
  the legacy 10Hz network tick coordinates. Players saw two speech bubbles
  simultaneously — one tracking perfectly at 60fps and one lagging behind
  at 10fps.

  **Resolution:** Deleted `SceneOverlay.tsx` entirely and removed its
  import from `SceneContent.tsx`. There is now exactly one speech bubble
  per robot, permanently locked inside the robot's local coordinate system
  at 60fps interpolation.

* **Issue — "The Ghost Re-Print After Recharge" (STASIS Wake Noise):**
  When the robot ran out of energy and entered STASIS, `resetRuntimeState()`
  was wiping the `lastExecutedAction` memory as part of its cleanup. When
  the robot recovered and re-executed the same command (e.g., `MOVE_FAST`),
  the `CooldownManager` thought it was a brand-new command and printed it
  again, creating a recurring speech bubble loop tied to the STASIS cycle.

  **Resolution:** Added a `fullReset` flag to `resetRuntimeState()`.
  STASIS exit now calls with `fullReset: false`, which clears variables
  and cooldowns but explicitly preserves the UI print history in
  `lastExecutedAction`. A command that was already printed before STASIS
  will never be re-printed after waking unless the user genuinely changes
  their script.

* **Issue — "The Floating Speech Bubble" (Bubble Detached from Robot):**
  The robot speech bubble was rendered inside `ArenaModels.tsx` at the
  10Hz WebSocket update rate, while the robot's 3D model used a 60fps
  interpolation system inside `RobotModel.tsx` to smoothly lerp between
  server positions. The bubble snapped rigidly to network positions while
  the robot glided smoothly ahead of it, leaving the text floating in empty
  space where the robot used to be.

  **Resolution:** Moved `<SpeechBubble>` directly inside the 3D model
  group in `RobotModel.tsx`. The bubble is now a child of the robot's
  local coordinate system. When the robot interpolates forward at 60fps,
  the speech bubble glides with it at pixel-perfect lockstep.

* **Issue — "The Rice Storm" (STASIS Spam Above Robot Head):**
  Every tick the robot attempted and failed a movement command due to
  insufficient energy, it emitted a STASIS notification above its head.
  Every tick it recovered just enough energy to attempt one move, it emitted
  the movement command. The robot was flip-flopping between STASIS and
  MOVE_FAST every few milliseconds, producing a continuous cascade of speech
  bubbles above the robot's head that looked like falling rice.

  **Resolution:** Completely removed all STASIS log emissions from the
  backend. The physics engine silently blocks movement and waits for energy
  to regenerate — the visual color change and energy bar are the only
  indicators. `CooldownManager.shouldEmitAction()` reduced to a single
  strict line: emit only when `actionCommand !== lastExecutedAction.get(robotId)`.
  Zero repeat prints for the same command, ever.

* **Issue — "TheUserPrecedence Disaster" (2 + 3 * 4 = 20):**
  The AliScript expression parser evaluated all binary operators
  left-to-right with equal precedence. The expression `2 + 3 * 4`
  evaluated to `(2 + 3) * 4 = 20` instead of the mathematically correct
  `2 + (3 * 4) = 14`. Every script relying on multiplication or division
  inside addition/subtraction expressions was computing wrong values
  silently — producing subtle, impossible-to-debug logical errors in
  robot behavior.

  **Resolution:** Split `parseBinaryExpression()` into two distinct
  precedence levels: `parseAddition()` for `+` and `-`, and
  `parseMultiply()` for `*`, `/`, and `%`. `parseMultiply` is called
  as the operand resolver for `parseAddition`, establishing the correct
  precedence tower: `OR → AND → comparison → addition → multiply → unary → primary`.
  Verified: `2+3*4=14`, `(2+3)*4=20`, `10-2*3=4`, `10/2+3=8`.

* **Issue — "The FOV Fire Hack" (FIRE Ignoring Vision Cone):**
  `FIRE` and `BURST_FIRE` selected targets by searching all living robots
  in the match, completely ignoring the FOV cone. A robot with its scanner
  pointing East could `FIRE` at an enemy standing directly behind it to the
  West. The FOV cone was purely cosmetic — it had zero effect on actual
  targeting. `CAN_SEE_ENEMY` and `FIRE` were operating on completely
  different datasets.

  **Resolution:** Changed target selection in `combat-executor.ts` to
  use `robot.visibleEntities.robots` exclusively. If no enemy is in the
  FOV cone, `FIRE` returns immediately with zero energy cost and zero
  cooldown consumed. Energy deduction moved inside the combat executor —
  only charged after confirming a valid visible target. `FIRE` and
  `CAN_SEE_ENEMY` now operate on the exact same FOV cone data.

* **Issue — "The WebSocket Namespace Collision" (Presence Not Registering):**
  The global socket hook was connecting to a `/api` namespace instead of
  the root namespace, preventing `handleConnection` on the gateway from
  firing and leaving all players permanently showing as "offline" on the
  leaderboard regardless of their actual online status.

  **Resolution:** Stripped the trailing `/api` from the dynamically
  constructed WebSocket URL in `useGlobalSocket.ts`. Replaced the
  hardcoded `http://localhost:3001` in `useGameState.ts` with the
  `API_BASE_URL` utility for correct production routing.

---

### Current Status

* Logic Arena is now running at peak performance with zero memory leaks,
  zero ghost matches, zero WebGL context crashes, and a mathematically
  correct AliScript expression engine. Training Mode is a fully featured
  cyberpunk proving ground. Racing Mode is a brutal time-trial circuit.
  Theuserprofile tracks real combat stats across matches. Ghost
  matches are dead. The arena is ready for: **Fog of War, multiplayer
  stress testing, and University Competition launch.**

## [2.6.0] - The Platform Polish & Intelligence Expansion - 2026-05-03

Shipped a sweeping platform-wide quality pass — a legendary theme system overhaul with two rebuilt visual identities, a comprehensive architecture and performance audit across every major dashboard page, a new sci-fi floating system hub replacing the mobile nav, full SEO infrastructure, and deep backend wiring for arena preferences and notification settings.

---

## New Features

### Legendary Theme System Overhaul — Violet Sovereign & Obsidian Ember

* Demolished and rebuilt both non-cyberpunk themes from scratch.
* **Violet Sovereign** (light) replaces the previous washed-out light theme with a prestigious deep violet accent (`#5b21b6`) on a cool slate-white base (`#f0f2fa`) — all neon glows suppressed via `filter:none` and `text-shadow:none`.
* **Obsidian Ember** (desert) reborn as volcanic luxury — near-black base (`#0e0a04`), liquid gold accent (`#f59e0b`), amber glow system.
* Cyberpunk theme untouched — remains king.
* Upgraded global font to **Space Grotesk** (300–700 weights) replacing the default — geometric, premium SaaS tier, paired with **Geist Mono** for all terminal/code elements.
* Added a 3-tier button opacity ladder per theme for unmistakable inactive/hover/active states.
* Introduced semantic color token system (`--sem-success`, `--sem-danger`, `--sem-warning`, `--sem-info`) wired into Tailwind `@theme inline` — cascades automatically across all 70+ existing files with zero component changes.
* Desert-only CSS opacity remapper via `:is()` selector boosts 196+ accent utility classes by 2–2.5× to prevent invisible-on-dark rendering.

### Sci-Fi Floating System Hub (Mobile Nav)

* Replaced the static 5th item in `MobileNav` with a dynamic **SYSTEM** hub toggle.
* Opens a floating staggered radial menu branching to Profile, Garage, Tournaments, and Settings with cubic-bezier glassmorphic animations.
* Fixed accessibility warnings in `MobileHeader` by adding explicit `type="button"` to all interactive elements.

### Arena Preferences & Notification Settings — Full Backend Wiring

* Added `arenaPreferences` and `notificationSettings` JSON columns to the `User` model in `schema.prisma`.
* Full typed interfaces, default constants, and Redis cache helpers added to backend.
* `GET /users/profile` returns both fields with backward-compatible defaults.
* Added `PUT /users/preferences` and `PUT /users/notifications` endpoints to `UsersController`.
* Frontend `PreferencesSection` and `NotificationsSection` replaced localStorage-only init with `GET /users/profile` on mount, optimistic UI updates (state changes instantly, API fires 800ms debounced), `lastSaved` ref snapshot for accurate rollback on failure, and `animate-pulse` skeleton loaders during fetch.
* Added music toggle (previously missing from UI).
* Both sections use identical architecture: profile-loaded initial state, debounced PUT, rollback with error feedback.

### Graphics Quality Selection & Arena Integration

* Added 3-column segmented button layout (`LOW / MEDIUM / HIGH`) to `PreferencesSection` tied into the debounced API update cycle.
* Arena reads `graphicsQuality` from DB and threads it into `SceneCanvas` to dynamically toggle antialiasing, DPR scaling, and background star rendering for low-end devices.

### Sound FX & Default Robot Sync from DB

* Extended arena profile fetch to read `arenaPreferences.soundFx` and `arenaPreferences.defaultRobot`.
* `soundFx` state threaded through the full prop chain: `Scene3D → SceneContent → ArenaModels`.
* `useGameSounds` now accepts an `enabled` flag — returns NOOP play functions when false.
* Added `soundFx` to `Scene3DComponentProps` type.

### Comprehensive SEO Infrastructure

* Expanded root layout metadata with Open Graph, Twitter Cards, keywords, and explicit Googlebot indexing instructions.
* Added `sitemap.ts` to dynamically generate `sitemap.xml` with proper route priorities.
* Added `robots.ts` to generate `robots.txt` — prevents crawlers from indexing private routes (`/api`, `/dashboard`, `/arena`) while pointing to the sitemap.

### PWA Icon Update

* Updated metadata in `layout.tsx` to use `logic-arena.webp` for favicon and apple-touch-icon.
* Replaced PNG icon arrays in `manifest.json` with the new `.webp` logo.
* Removed default `favicon.ico` to prevent cache overrides.

---

## Architecture & Performance Audits

### Dashboard — Full Architecture Overhaul

* Dismantled 340-line monolithic page into a unified responsive Tailwind DOM tree (deleted separate Desktop/Mobile layouts).
* Extracted data fetching into `useScripts` custom hook.
* Deleted `EditScriptModalStyles.tsx` — fully migrated to standard Tailwind.
* Eliminated JS-based `isMobile` prop pattern across `ScriptCard`, `ProtocolForm`, `CustomSelect`, and `Skeletons` in favor of native CSS media queries.
* Redesigned script card action buttons into a premium iOS-style glassmorphic **Action Pill** with backdrop-blur, seamless 1px dividers, radial hover glows, and custom floating tooltips.
* Fixed hydration mismatch on timestamps by wrapping `toLocaleDateString` in a mounted state check.
* Added granular client-side error surfacing for rate limit and content limit warnings in editor footer.
* Replaced `scripts.service.ts` unsafe `any` with strictly typed update payload interface.
* Implemented `next/dynamic` lazy loading for `EditScriptModal`.
* Wrapped `ScriptCard`, `EditScriptHeader`, and `EditScriptFooter` in `React.memo`.

### Leaderboard — Full Architecture Overhaul

* Dismantled 400-line `LeaderboardTable` into `DesktopTable`, `MobileList`, and reusable UI micro-components.
* Extracted hex colors to semantic CSS variables (`--rank-gold`, `--eff-optimal`).
* Replaced emojis with Lucide icons (`Crown`, `Swords`).
* Added **YOU** badge and row highlighting for current user.
* Fixed 5-column alignment bug.
* Implemented Redis `MGET` pipeline to batch online presence checks (1 round-trip instead of N).
* Added 20-second Redis caching layer to `/users/leaderboard`.
* Added deterministic secondary DB sort (`wonMatches`) as tie-breaker.
* Gated client polling with `document.visibilityState`.

### Lobby — Full Audit (Security, Stability, UX, Performance)

* Added Redis atomic rate limiting (`redis.incr`) on `createMatch` — max 3 matches per minute.
* Added active match check to prevent concurrent waiting matches.
* Fixed ghost lobby navigation bug with 2-second grace period in `handleDisconnect`.
* Cleanup for abandoned lobby matches when host leaves before opponent joins.
* Added `10s DEPLOY_TIMEOUT_MS` guard in `useDeployMatch`.
* Unified empty lobby state across mobile and desktop.
* Fixed socket recreation anti-pattern — migrated `useMemo` to `useRef` in `useLobbySocket`.
* Wrapped `LobbyMatchCard` in `React.memo`.
* Stripped all `useState` hover trackers — migrated to pure CSS `:hover`.
* Fixed stale closure in `useLobbySocket` via `scriptIdRef`.
* Moved inline keyframes to `globals.css`.
* Added `type="button"` to all buttons.

### Campaign — Full Audit (Security, Progression, UX, Performance)

* Added Redis completion token (60s TTL) requirement for `completeLevel` — prevents completion without winning.
* Enforced `levelId <= user.currentLevel` on `createCampaignMatch` — blocks locked level access via direct HTTP.
* Eliminated all `any` types in `MatchesController` and `CampaignController`.
* Fixed off-by-one with `CAMPAIGN_COMPLETE_SENTINEL = 11`. Level 10 now correctly shows `completed: true`.
* Added draw state (mutual destruction + `Swords` icon).
* Replaced emojis with Lucide `Skull` and `Trophy` icons.
* Added `useMemo` on `completedCount` and `currentLevel`.
* Added `403 ACCESS DENIED` branded error page.
* Added `generateMetadata` in `[id]/layout.tsx`.
* Added `[id]` loading skeleton.
* Migrated `CAMPAIGN_LEVELS` to `levels.constants.ts` for static generation.

### Profile — Full Architecture & Performance Overhaul

* Extracted `MatchHistoryTable` monolith into atomic components (`DesktopRow`, `MobileCard`, `EmptyState`, `SkeletonRow`, `ReplayButton`).
* Extracted generic shared components (`HexAvatar`, `OperatorBadge`, `ResultBadge`, `SectionHeader`, `Shimmer`, `StatCard`, `StatRing`) into `components/ui/`.
* Extracted `RadarChart` into `components/charts/`.
* Extracted layout blocks (`HeroSection`, `StatCardsSection`, `AnalyticsSection`, `MatchHistorySection`) into `components/sections/`.
* Replaced OS emojis in `RadarChart` with Lucide icons (`Zap`, `Flame`, `Shield`, `Target`, `Wind`).
* Fixed `StatCard` background appearing solid black in Light Mode via `color-mix`.
* Added `useId()` in `RadarChart` for stable SVG IDs.
* Migrated `StatCard` hover to pure CSS `color-mix` transitions.
* Memoized `RadarChart` geometry based on `size` prop.

### Garage — Full Audit (3D Models, Performance, Scale, Color Sync)

* Created `robots.constants.ts` as single source of truth with separate `cardScale` and detail-page scale per robot.
* Created `useRobotColorTint` shared hook with material disposal.
* Created `garage.css` for all keyframes.
* Extracted `Toast.tsx` and `RobotSpecs.tsx`.
* Restored real GLB 3D models in `RobotCard`.
* Fixed `UNIT-01` card scale `1.0→2.5` and `UNIT-02` `1.4→1.2`.
* Added `frameloop="demand"` on all Canvas instances.
* Auto-rotate gated by `isHoveredRef`.
* Added `useGLTF.preload()` at module level.
* Added `SkeletonUtils.clone()` per component to prevent material disposal race conditions.
* Fixed color not applying until camera interaction by adding `invalidate()` in `useEffect([color])`.
* Fixed robot turning black on rapid color switching.
* Fixed `GuestSphere` dead code.
* Fixed guest race condition with synchronous localStorage init.
* Fixed `handleSave` stale closure.
* Added Redis cache for `GET /users/profile` (TTL 30s) with invalidation on `PATCH`.

### Tournaments — Enterprise Architecture Overhaul + Full Audit

* Created `tournaments/types.ts` as single source of truth.
* Extracted `useTournamentDetail` custom hook.
* Reduced `[id]/page.tsx` from 240+ lines to orchestration shell.
* Fixed `totalRounds` calculation for 2/4/8-player brackets.
* Fixed `isEliminated` short-circuit when `isChampion` is true.
* Changed detail page poll from 3s to 10s.
* Replaced flat SVG rects with `foreignObject` glassmorphism cards.
* Added champion badge with emerald glow.
* Replaced N+1 (21 DB calls) `findOne` with single batch `findMany` + Map lookup.
* Added cache-aside in `findAll` and `findOne` — Redis keys `tournaments:list` + `tournament:{id}`. All writes invalidate both cache keys.
* Replaced sequential `await` loop in `start()` with `prisma.tournamentMatch.createMany()`.
* Added `ForbiddenException` and `BadRequestException` to `completeMatch` — prevents bracket rigging.
* Added `startError` state surfacing exact API rejection message.

### Replay — Ultra-Professional Overhaul

* Decoupled RAF loop from React state — `lerpT` tracked via `useRef`, zero re-renders at 60fps.
* Direct canvas injection via `forwardRef` — bypasses React reconciliation cycle entirely.
* React state updates throttled to 2/sec for scrubber only.
* Batched canvas draw calls for projectiles into single path.
* Removed hardcoded `420×315` canvas dimensions — renders at `800×600`, scales fluidly.
* Deleted `ReplayViewerDesktopLayout` and `ReplayViewerMobileLayout` — replaced with single responsive tree.
* Eliminated all DRY violations.
* Fixed `router: any` and `catch (e: any)` types.
* Replaced inline `textShadow` with Tailwind `drop-shadow`.
* Added `"use client"` directives across all interactive replay components.
* Fixed Legend container color — `bg-card/40` with `backdrop-blur-md`.

### Docs — Full AliScript Content Accuracy & Performance Pass

* Fixed 6 wrong energy costs in `EnergyCostSection`.
* Fixed `MAX_ENERGY` `1000→100`.
* Removed false `WAIT` regen claim.
* Fixed `SCAN` docs — blocked during `STASIS`.
* Fixed all 3 algorithm challenge scripts using `SCAN` inside `IF IN_STASIS`.
* Fixed `SAMPLE_SCRIPT` threshold `MY_ENERGY > 200 → > 60`.
* Added `AND`/`OR` operators to `COMMAND_TABLE` and `QUICK_REF`.
* Added `target_vx`/`target_vy` to `IDENTIFIER_TABLE`.
* Added `FIRE`/`BURST_FIRE` damage values.
* Marked `spotted` as legacy alias.
* Updated all `v2.0` badges to `v2.3`.
* Split `EnergyCostSection` 301 lines into `EnergyCostTable` and `EnergyDrainSimulator`.
* Extracted `IdentifierReferenceSection` into dedicated file.
* Fixed `useEffect` missing deps in `EnergyDrainSimulator`.
* Added `useMemo` to `filteredCommands` and `categories`.

---

## Technical Scars & Resolutions

### 🩹 "The Guest Operator Blackout" — Auth Modal Obstructionism

**Issue:** Unauthenticated users encountered obstructive auth modals on every page, blocking any meaningful interaction with the platform before creating an account. The Dashboard, Profile, Settings, and Arena all assumed a logged-in session and crashed or redirected aggressively on guest visits.

**Resolution:** Overhauled all four pages into a **Passive-Locked** guest architecture — non-interactive UI gates replace modal interruptions. Implemented server-side WebSocket guest identity (`guest_xxx`) for stable arena play. Deployed virtual script fallbacks for guest operators. Fixed the 3D `SkinnedMesh` vertex explosion glitch using `SkeletonUtils` cloning. Synchronized root redirect to `/login` with an intentional `[ Continue_as_Guest ]` bypass. Cleaned 40+ files to eliminate all redundant auth prompts.

---

### 🩹 "The Lucide Icon Type Crash" — Production Build Failure

**Issue:** A loose `React.ElementType` type in `SettingsLayout` caused a `'string is not assignable to never'` TypeScript crash during Next.js production build, blocking deployment.

**Resolution:** Replaced with the strict `LucideIcon` type, resolving the type inference failure and restoring clean production builds.

---

### 🩹 "The Keyboard Emoji Inconsistency" — Cross-Platform Rendering

**Issue:** Platform-dependent keyboard emojis rendered differently across Windows, macOS, and Android — breaking the cyberpunk aesthetic on non-Apple devices and producing inconsistent visual weight across UI surfaces.

**Resolution:** Replaced all keyboard emojis with consistent Lucide React icons across all client modules, ensuring pixel-identical rendering on every platform and OS.

---

### 🩹 "The Jargon Wall" — Overly Technical UI Copy

**Issue:** Several UI labels, tooltips, and status messages used internal engineering terminology that confused non-technical users without adding gameplay value.

**Resolution:** Executed a full readability pass across all client modules — replaced technical jargon with human-readable copy while preserving the cyberpunk tone and aesthetic.

---

## Current Status

Logic Arena is now a fully polished, theme-aware, SEO-indexed platform with deep backend wiring for user preferences, a legendary visual identity across all three themes, and a comprehensive architecture audit covering every major dashboard page. Every module is clean, typed, and within line limits.

**Ready for:** Fog of War, multiplayer stress testing, and University Competition launch.

## [2.7.0] - AliScript v2.4 — Deterministic Execution & Swarm Intelligence - 2026-05-04

Shipped a complete overhaul of the AliScript execution model — replacing hardware-dependent timing limits with a deterministic instruction quota system, introducing a full Swarm Intelligence API for inter-robot communication, hardening the energy economy to survive loop-heavy scripts, and upgrading the entire documentation and IDE experience to match.

---

### New Features

* **Deterministic TLE Quota System (AliScript v2.4):**
  Replaced the hardware-dependent `MAX_TICK_DURATION_MS` timestamp gate with a strict, platform-agnostic `MAX_OPERATIONS_PER_TICK` instruction quota (2,000 ops). A reference-passed `opsCounter` object threads through the block executor and tracks AST evaluations globally across all recursive `IF`, `WHILE`, and `FOR` branches. When the quota is exceeded, the engine fires a `[FATAL] TLE` error directly into the player's in-game terminal and halts execution immediately. Players can no longer bypass the limit by running on faster hardware — the quota is identical for every operator on every machine, enforcing true competitive fairness.

* **Big O Education System:**
  Overhauled the in-game UI documentation (`docsData.ts`), GitHub Markdown (`aliscript-language.md`), and Script Editor autocomplete (`constants.ts`) to formally teach Big O notation as a first-class gameplay mechanic. New documentation sections detail O(N) optimizations required to survive the 2,000-op quota, with annotated examples showing the difference between O(1) sensor reads and O(N) scanning loops. Players are now incentivized to write algorithmically efficient scripts — not just correct ones.

* **Swarm Intelligence API — `BROADCAST` & `RECEIVE`:**
  Added `BROADCAST(data)` and `RECEIVE()` to the AliScript language, enabling secure inter-robot communication between teammates. Payloads are deep-copied at the `expression-facade` layer before injection into the receiver's memory sandbox, guaranteeing full isolation — a compromised teammate script cannot corrupt the sender's state. Updated the Lexer and Parser to correctly tokenize and evaluate the new Swarm functions. Expanded UI documentation (`docsData.ts`), GitHub Markdown, and Script Editor autocomplete with a dedicated Swarm API section styled in `#34d399` emerald.

* **Dictionary & State Machine Architecture:**
  Added Dictionary (Hash Map) support to AliScript, allowing players to build complex single-variable state machines instead of managing dozens of independent variables. Extended the Lexer and AST with `LBRACE` (`{`), `RBRACE` (`}`), and `DOT` (`.`) tokens alongside `ObjectLiteral` and `MemberExpression` AST nodes. The expression parser now natively handles chained property access (`state.items[0].x`). `IndexExpression` evaluation falls back gracefully from Array index mapping to Object string key lookup (`obj['key']`). The Block Executor's mutation handler supports both Dot Notation (`SET obj.prop = val`) and Bracket Notation (`SET obj['key'] = val`). Added the `Dictionary State Machine` advanced algorithmic challenge to the UI documentation, teaching players single-tick game loop architecture. Expanded Script Editor Intellisense with a `dictionary` autocomplete category (`#f43f5e`) covering `{}`, `obj.key`, and `obj['key']` snippets.

* **Advanced Sensory Arrays (Phase 1):**
  Implemented `GET_ALL_VISIBLE_ENEMIES()`, which returns a full array of enemy snapshots sortable by any player-defined criteria, and `RAYCAST(angle)`, a DDA-based physics laser for real-time obstacle and wall mapping. Both sensors integrate obstacle data into the AST expression evaluator, allowing robots to mathematically model their physical environment. Updated Script Editor Intellisense with 28 new color-coded autocomplete entries covering the full Math Standard Library, Array functions, and Phase 1 sensors. Expanded UI documentation and `aliscript-language.md` with professional API tables, predictive aiming guides, and a full Bubble Sort example in AliScript.

* **Math Standard Library & Physics Fixes:**
  Extended the AliScript standard library with `SQRT`, `POW`, `ATAN2`, `SIN`, `COS`, `PUSH`, `POP`, and related math and array builtins to enable trigonometric calculations and advanced target tracking. Exposed `POSITION_X` and `POSITION_Y` in `identifier-resolver.ts` so robots can access their absolute global coordinates for custom pathing math.

* **Lucide Icon System in Documentation UI:**
  Upgraded the UI Documentation renderer to display premium `lucide-react` vector icons instead of plain-text emojis across all `QUICK_REF` cards and Algorithm Challenge entries. Full TypeScript type safety enforced across all icon references.

---

### Technical Scars and Resolutions

* **Issue — "The Hardware Lottery" (Timestamp-Based TLE):**
  The original `MAX_TICK_DURATION_MS` execution limit measured wall-clock milliseconds to detect infinite loops. This meant the same AliScript would pass on a fast gaming PC and fail on a low-end laptop — or vice versa, with players on slower machines hitting the limit during legitimate complex scripts. The system was fundamentally non-deterministic and impossible to document accurately: "your script might run fine" is not a spec.

  **Resolution:** Ripped out all timestamp-based logic. Replaced with an `opsCounter` object passed by reference into `executeBlock()` and incremented on every AST node evaluation. The counter is reset at the start of each tick. Hitting 2,000 ops triggers the TLE pipeline regardless of wall time. Identical quota on every machine — from a Raspberry Pi to a threadripper workstation.

* **Issue — "The Loop Energy Drain" (WHILE Burning Passive Regen):**
  A `WHILE TRUE DO` loop executing inside a single tick would dispatch redundant action calls on every iteration — each iteration incrementing energy costs as if it were a new command. A script with a tight scanning loop would burn through the entire energy bar in a single tick before the regen system could fire, instantly triggering STASIS. Players writing any loop-based logic were effectively penalized by the energy system for using the language correctly.

  **Resolution:** Implemented intra-tick action deduplication in `block-executor.ts`. Tracks the last dispatched action per robot per tick via a `lastDispatchedThisTick` map. If the same action command is dispatched more than once within a single tick, subsequent calls are short-circuited before hitting the energy manager. Energy is only deducted once per unique action per tick regardless of loop iteration count. Paired with the new passive regen rate: active robots regenerate `0.5 energy/tick`, STASIS fast-charges at `3.0 energy/tick`.

* **Issue — "The Physics Race Condition" (60FPS Loop vs 10FPS Logic):**
  The `executedCommandThisTick` flag — used to prevent the 60FPS physics loop from double-executing logic — was not being synchronized correctly between the physics update cycle and the logic evaluator. The flag would reset mid-frame, causing the physics loop to re-execute pending commands and producing ghost charging ticks where STASIS energy regen fired multiple times per real tick.

  **Resolution:** Synchronized `executedCommandThisTick` as an atomic flag reset at the start of each physics frame boundary. The 60FPS loop now reads the flag before dispatching and the logic evaluator sets it only after confirmed execution — eliminating the race window. Infinite background charging eliminated.

* **Issue — "The Swarm Sandbox Breach" (Shared Payload Reference):**
  The first implementation of `BROADCAST` passed the payload object directly into the receiver robot's memory without copying it. Since JavaScript objects are passed by reference, a receiver script modifying the received payload would mutate the original sender's data structure — breaking the isolation guarantee and allowing one robot's script to corrupt another's runtime state.

  **Resolution:** Implemented deep-copy serialization in `expression-facade.ts` using structured clone before injecting any payload into the receiver's memory sandbox. Sender object graphs are fully detached at broadcast time. Receiver mutations are invisible to the sender. The Swarm API is now cryptographically equivalent to a message-passing system with no shared memory.

---

### Current Status

* Logic Arena's scripting engine is now deterministic, fair, and algorithmically educational. The 2,000-op quota enforces Big O thinking at the gameplay level. The Swarm API unlocks coordinated multi-robot tactics. Dictionary state machines replace spaghetti variable lists. The energy economy survives loop-heavy scripts without punishing players for using control flow. Ready for: **Fog of War, University Competition launch, and multiplayer stress testing.**
