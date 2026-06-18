# Game Rules & Mechanics

## Core Principles
* **Physics-based:** All movement, collisions, and interactions are governed by a deterministic 2D physics engine. Campaign battles advance fixed 60 FPS physics steps on a 50ms server frame interval.
* **Deterministic Execution:** Given the same initial state and robot scripts, a match will always produce the exact same outcome.
* **Real-time Delta-Sync:** The game simulation runs continuously on the server, with highly compressed state changes (deltas) broadcast to clients and spectators via WebSockets.
* **Script-driven:** You do not pilot your robot. Robots are completely autonomous, their actions solely determined by the logic provided in your AliScript code.

## Robot Attributes
* **Position:** (Vector2: x, y) - Current location in the arena.
* **Velocity:** (Vector2: vx, vy) - Current speed and direction vector.
* **Rotation:** (Float) - Current orientation in radians.
* **Health:** (Integer) - Hit points. Starts at 100. Reaching 0 means destruction.
* **Energy:** (Integer) - Resource consumed by actions (movement, firing, scanning, abilities). Max is 100.
* **Radius:** (Float) - Physical size for collision detection.
* **Sensor Range:** (Float) - Maximum distance robots can "see" objects via raycasting or FOV arrays.
* **FOV Angle:** (Float) - Angle of vision strictly calculating observable bounds (Default 120°).

## Movement
* **Acceleration/Deceleration:** Robots accelerate up to a maximum speed based on chassis weight.
* **Rotation:** Robots rotate to change their facing direction. The scanner can rotate independently from the body chassis.
* **Collision:** Robots physically collide with arena walls and other robots, incurring a slight loss of velocity.

## Energy System & STASIS
* **Energy Consumption:** 
    * `MOVE` / `BACKUP`: 2 energy per tick.
    * `MOVE_FAST`: 4 energy per tick.
    * `PATHFIND`: 3 energy per tick.
    * `SCAN`: 3 energy per call.
    * `FIRE`: 8 energy per shot.
    * `BURST_FIRE`: 18 energy per burst.
* **Energy Capacity:** Maximum energy is **100**.
* **Energy Regeneration:** Robots regenerate **3 energy per tick** while in STASIS.
* **STASIS:** If a robot's energy drops to 0 or below, it enters a `STASIS` condition. During STASIS, execution is blocked completely, including `WHILE` loop bodies and commands such as `MOVE`, `FIRE`, `PATHFIND`, and `SCAN`. Energy regenerates during STASIS, and execution resumes only after energy reaches **20 or higher** with a clean runtime state.

## Tactical Super Powers (Abilities)
Robots can deploy advanced abilities to gain tactical advantages.
* **SHIELD**: Absorbs incoming damage for a short duration.
* **CLOAK**: Turns the robot invisible to enemy FOV/sensors.
* **DASH**: Instantaneous burst of high-speed velocity.
* **TELEPORT**: Blink a short distance forward instantly.
* **MINE**: Drop an explosive trap that detonates when enemies approach.
* **TAUNT**: Force enemies within range to lock onto you temporarily.

## Vision and Scanning
* **Line of Sight:** Robots can only "see" other robots or objects that are within their `Sensor Range` and bounded within their FOV Cone Angle. Solid obstacles block Line of Sight.
* **Scanning:** A robot can perform an active `SCAN` action to sweep its environment (+15° rotation of the scanner per call independent of the body), fetching precise distances and tracking targets outside its immediate frontal vision.
* **Raycasting:** Robots can fire invisible physics rays at precise angles to detect incoming walls or verify clear line-of-sight before firing a weapon.

## Combat
* **Firing (`FIRE`):** Consumes 8 energy per shot. Precision shot dealing 25 Damage.
* **Burst Firing (`BURST_FIRE`):** Consumes 18 energy per burst. Fires 3 projectiles uniformly dispersed at `-8°`, `0°`, and `+8°`, creating a horizontal spread that is difficult to dodge at mid-range.
* **Damage:** Projectiles deal damage upon impact and are destroyed upon contact with a solid object or robot.
* **Destruction:** A robot is destroyed when its health reaches 0. 

## Arena Environment
* **Boundaries:** Robots are confined to an 800×600 arena grid. Walls reflect robots and destroy projectiles.
* **Obstacle Zones:**
    * **SOLID (Wall)**: Impassable. Rebounds velocity. Destroys projectiles. A* Pathfinder padding ensures robots take smooth corners around walls.
    * **TRAP (Slowdown Zone)**: Walkable. Reduces velocity by 60% while inside the zone. Projectiles pass through safely.
    * **LAVA (Damage Zone)**: Walkable. Deducts 5 HP per second synchronously via tick physics. The Pathfinder heavily penalizes routing across lava, preferring wider safe detours.

## Match Modes & Win Conditions
* **COMBAT (1v1 / FFA):** Last Robot Standing. If the time limit is reached, the robot with the highest remaining health wins.
* **CAPTURE:** Control specific map zones for a duration to earn points.
* **SURVIVAL:** Outlast endless waves of increasingly difficult NPC enemies or environmental hazards.
* **RACING:** Specific waypoint completion algorithms dynamically resolved. The first robot to touch all checkpoints wins.
* **CAMPAIGN:** Single-player LeetCode-style algorithmic challenges. You must defeat pre-programmed boss robots or navigate puzzle maps within strict memory or TLE constraints.
* **TOURNAMENTS:** 4 or 8 player structured brackets. Matches run concurrently, and winners automatically advance to the semi-finals and finals. Spectators can watch these matches live.

## Campaign Match Flow
Campaign levels run as live server-streamed fights rather than client-side reconstructions.

1. The client submits the player script and level payload over Socket.IO.
2. The server creates a `CampaignSession` with a `MatchEngine`, interval handle, step count, logic counter, pause state, and scan tracking.
3. Every 50ms, the server advances 3 fixed physics steps of `1 / 60` seconds and evaluates AliScript every 6 fixed steps.
4. The server emits `campaignFrame` payloads containing robots, projectiles, scan activity, and the authoritative tick.
5. The fight ends on win condition or at `CAMPAIGN_MATCH_MAX_STEPS` (`60 * 60`, one minute of fixed simulation steps).

### Campaign Pause and Replay
* `campaign:pause` freezes the server session before physics, logic, frame emission, and timeout checks advance.
* `campaign:resume` shifts wall-clock combat timestamps forward by the exact paused duration, including wall-hit timestamps, shield-hit timestamps, and mine arming timestamps.
* The client receives `campaign:pause-state` with `paused` and `tick`, so UI controls stay synchronized with the server.
* Completed campaign fights keep the streamed frames in memory for immediate replay controls: play/pause, scrub, reset, and speed cycling. This is a review tool for the current level session, not a persisted database replay.

## Victory, Stars, and Rewards
Campaign victory modals count points and stars immediately after `campaignFightResult`. Best-star tracking preserves the user's highest historical star result for a level; replaying a level can improve the star record without downgrading it.
