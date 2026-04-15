# Game Rules

## Core Principles
*   **Physics-based:** All movement, collisions, and interactions are governed by a 2D physics engine.
*   **Deterministic:** Given the same initial state and robot scripts, a match will always produce the same outcome.
*   **Real-time:** The game simulation runs continuously, with updates broadcast to clients.
*   **Script-driven:** Robots' actions are solely determined by the logic provided in user scripts.

## Robot Attributes
*   **Position:** (Vector2: x, y) - Current location in the arena.
*   **Velocity:** (Vector2: vx, vy) - Current speed and direction.
*   **Rotation:** (Float) - Current orientation (e.g., in radians).
*   **Health:** (Integer) - Hit points. Reaching 0 means destruction.
*   **Energy:** (Integer) - Resource consumed by actions (movement, firing, scanning).
*   **Radius:** (Float) - Physical size for collision detection.
*   **Sensor Range:** (Float) - Maximum distance robots can "see" or detect other robots/obstacles.
*   **Weapon Cooldown:** (Float) - Time until the robot can fire again.
*   **Abilities:** (List of Strings/Enums) - Special skills a robot might have (e.g., shield, dash).

## Movement
*   **Acceleration/Deceleration:** Robots can accelerate up to a `MAX_SPEED` and decelerate. Movement is continuous and physics-based.
*   **Rotation:** Robots can rotate to change their facing direction.
*   **Collision:** Robots collide with arena walls and other robots. Collisions incur a small amount of damage based on impact velocity.

## Energy System
*   **Energy Consumption:**
    *   `MOVE_COST`: Energy consumed per unit of distance moved.
    *   `ROTATE_COST`: Energy consumed per unit of rotation.
    *   `FIRE_COST`: Energy consumed per shot fired.
    *   `SCAN_COST`: Energy consumed per scan.
    *   `ABILITY_COST`: Energy consumed for using special abilities.
*   **Energy Regeneration:** Robots passively regenerate a small amount of energy per game tick.
*   **Energy Depletion:** If a robot runs out of energy, it cannot perform energy-consuming actions until it regenerates.

## Vision and Scanning
*   **Line of Sight:** Robots can only "see" other robots or objects that are within their `Sensor Range` and not obstructed by walls or other opaque objects.
*   **Scanning:** A robot can perform an active scan action to detect other robots within its `Sensor Range`. The scan returns information (e.g., ID, position, health) about detected robots.

## Combat
*   **Weapons:** Robots are equipped with a basic weapon (e.g., projectile launcher).
*   **Firing:** Firing consumes energy and incurs a `Weapon Cooldown`.
*   **Damage:** Projectiles deal damage upon impact. Damage can be affected by factors like range and target armor (if implemented).
*   **Destruction:** A robot is destroyed when its health reaches 0. Destroyed robots are removed from the arena.

## Arena
*   **Boundaries:** Robots are confined to an 800×600 arena. Arena walls reflect robots and destroy projectiles.
*   **Obstacles:** The arena contains static obstacle zones, each with distinct behavior defined by its type.

## Obstacle Types — The 3 Pillars

The arena uses exactly 3 obstacle types. Each type has a distinct visual, behavior, and projectile interaction:

| Type | Visual | Behaviour | Projectiles |
|------|--------|-----------|-------------|
| **SOLID** (Wall) | Tall dark-blue glowing box | **Impassable.** Robots cannot enter. Velocity is reflected on contact (wall-slide physics). | **Destroyed on impact.** |
| **TRAP** (Slowdown Zone) | Flat spinning Pulse-Blue disc (floor-level) | **Walkable.** Reduces robot velocity by **60%** while the robot's center is inside the zone. Effect is instant-on / instant-off — no lingering timer. | **Pass through.** |
| **LAVA** (Damage Zone) | Low pulsing Neon-Red hexagonal platform | **Walkable.** Deducts **5 HP per second** (continuous, `deltaTime`-accurate) while the robot's center is inside the zone. | **Pass through.** |

### Obstacle Rules
*   TRAP and LAVA zones are **not stackable** — a robot inside both receives the most severe effect per category.
*   SOLID walls have a **1-cell padding** in the A\* pathfinder grid to account for robot radius, ensuring robots never clip through corners.
*   The pathfinder routes robots **around** LAVA (cost ×5) and **preferably around** TRAP zones (cost ×3) when alternative paths exist. Robots will enter these zones if no clear path exists.

## Match End Conditions
*   **Last Robot Standing:** The match ends when only one robot remains. That robot (and its user) is declared the winner.
*   **Time Limit:** If a `MATCH_TIME_LIMIT` is reached, the robot with the highest health/score (tie-breaking rules apply) is declared the winner.
*   **Disconnection/Forfeit:** If all robots from a user disconnect or a user forfeits, their robots are removed from the match.

## Implemented Commands (AliScript)
The current version of Logic Arena uses **AliScript** for robot control. The following commands are fully implemented:

### Movement
*   `MOVE`: Basic forward movement.
*   `MOVE_FAST`: Double-speed forward movement.
*   `BACKUP`: Backward movement.
*   `STOP`: Immediate halt.
*   `PATHFIND`: Automated navigation toward the nearest target using A*.

### Combat
*   `FIRE`: Primary weapon discharge (500ms cooldown).
*   `BURST_FIRE`: High-intensity firing mode.

### Logic & Conditions
*   `IF [condition] THEN [command]`: Conditional execution.
*   `spotted`: Boolean - Enemy in sensor range.
*   `health < [number]`: Health threshold check.
*   `distance < [number]` / `distance > [number]`: Range checks.

For detailed documentation, refer to `docs/aliscript-language.md`.


