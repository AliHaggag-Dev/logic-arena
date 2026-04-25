# Game Rules

## Core Principles
*   **Physics-based:** All movement, collisions, and interactions are governed by a 2D physics engine.
*   **Deterministic:** Given the same initial state and robot scripts, a match will always produce the same outcome.
*   **Real-time:** The game simulation runs continuously, with updates broadcast to clients via delta differences.
*   **Script-driven:** Robots' actions are solely determined by the logic provided in user scripts (AliScript).

## Robot Attributes
*   **Position:** (Vector2: x, y) - Current location in the arena.
*   **Velocity:** (Vector2: vx, vy) - Current speed and direction.
*   **Rotation:** (Float) - Current orientation in radians.
*   **Health:** (Integer) - Hit points. Reaching 0 means destruction.
*   **Energy:** (Integer) - Resource consumed by actions (movement, firing, scanning). Max is 1000.
*   **Radius:** (Float) - Physical size for collision detection.
*   **Sensor Range:** (Float) - Maximum distance robots can "see" objects.
*   **FOV Angle:** (Float) - Angle of vision strictly calculating observable bounds (Default 120°).

## Movement
*   **Acceleration/Deceleration:** Robots can accelerate up to a maximum speed. Movement is continuous.
*   **Rotation:** Robots can rotate to change their facing direction natively.
*   **Collision:** Robots collide with arena walls and other robots natively incurring minimal damage cleanly.

## Energy System & STASIS
*   **Energy Consumption:** 
    *   `MOVE` / `BACKUP`: 2 energy per tick.
    *   `MOVE_FAST`: 5 energy per tick.
    *   `PATHFIND`: 3 energy per tick.
    *   `SCAN`: 5 energy per call.
    *   `FIRE`: 50 energy per shot.
    *   `BURST_FIRE`: 150 energy per burst.
*   **Energy Regeneration:** Robots passively regenerate **3 energy per tick**.
*   **STASIS:** If a robot's energy drops to 0, it enters a `STASIS` condition. During STASIS, all energy-intensive commands (`MOVE`, `FIRE`, `PATHFIND`, etc.) are completely blocked until energy passively regenerates back up to **50 energy or higher**. (Note: `SCAN` can still be executed in STASIS).

## Vision and Scanning
*   **Line of Sight:** Robots can only "see" other robots or objects that are within their `Sensor Range` and bounded natively within their FOV Cone Angle.
*   **Scanning:** A robot can perform an active `SCAN` action to sweep its environment (+15° rotation of the scanner per call independant of the body), fetching precise distances and velocities cleanly tracking targets explicitly avoiding blind spots securely.

## Combat
*   **Firing (`FIRE`):** Consumes 50 energy and incurs a 500ms cooldown. Fires a single projectile natively.
*   **Burst Firing (`BURST_FIRE`):** Consumes 150 energy. Fires 3 projectiles exactly uniformly dispersed cleanly at `-8°`, `0°`, and `+8°` natively ensuring a horizontal spread staggering opponents perfectly gracefully natively.
*   **Damage:** Projectiles deal damage upon impact and are destroyed upon target contact cleanly natively resolving array memory instantly.
*   **Destruction:** A robot is destroyed when its health reaches 0. 

## Arena
*   **Boundaries:** Robots are confined to an 800×600 arena. Walls reflect robots and destroy projectiles natively smoothly.
*   **Obstacle Zones — The 3 Pillars:**
    *   **SOLID (Wall)**: Impassable. Rebounds velocity. Destroys projectiles. Pathfinder padding ensures smooth corner-taking logically cleanly structurally safely.
    *   **TRAP (Slowdown Zone)**: Walkable. Reduces velocity by 60% cleanly inside bounding frames continuously smoothly natively. Projectiles pass through safely.
    *   **LAVA (Damage Zone)**: Walkable. Deducts 5 HP per second synchronously via strictly precise `deltaTime` physics natively. Pathfinder heavily penalizes routing across natively preferring wider detours securely recursively strictly correctly.

## Match End Conditions
*   **Win Conditions:**
    *   **COMBAT:** Last Robot Standing dynamically.
    *   **RACING:** Specific waypoint completion algorithms dynamically resolved.
*   **Draws:** Resolved cleanly if mutual destruction occurs precisely equally simultaneously completely natively structurally gracefully strictly.
