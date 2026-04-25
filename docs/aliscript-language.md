# AliScript Language Reference (v2.0 Fox Mind Update)

## Overview
AliScript is a simple, line-based scripting language specifically designed for programming combat robots within the Logic Arena environment. The v2.0 update introduces block-based execution, variables, neural pathways (functions), and mathematical operators.

## Syntax Rules
- **Block Formatting**: Conditionals and loops require explicit block keywords (`THEN`, `DO`) and must be terminated with `END`.
- **Case Insensitive**: Keywords can be written in uppercase or lowercase.
- **Comments**: Use `//` to add comments.
- **Parentheses**: Mathematical and logical expressions support grouping using parentheses. Example: `SET x = (a + b) * 2`

## Commands Reference

### Structural Flow
- `SET [var] = expression`: Defines memory allocation. Example: `SET limit = (10 % 3) + 1`
- `IF [condition] THEN ... ELSE ... END`: Branching conditionals.
- `WHILE [condition] DO ... END`: Loops over a block of code (Max 10 iterations/tick limit applied automatically).
- `FUNCTION [name] ... END`: Define a modular routine.
- `CALL [name]`: Invoke a defined modular routine.

### Movement & Haptic Constraints
- `MOVE`: Moves the robot forward.
- `MOVE_FAST`: 2x standard speed, drains extra energy.
- `BACKUP`: Retreats from the facing angle.
- `STOP`: Halts all movement.
- `PATHFIND`: Computes A* navigation to the nearest enemy.
- `WAIT [ticks]`: Suspends code execution for the defined cycles (60 ticks = 1 second).

### Sensors & Combat
- `SCAN`: Rotates the FOV cone +15° per call (sweeping the environment) and populates `scanned_distance`, `scanned_angle`, and `scanned_spotted`. Cost: 5 energy (not blocked by STASIS).
- `FIRE`: Standard projectile (500ms cooldown).
- `BURST_FIRE`: Rapid multi-fire variant. Fires 3 projectiles simultaneously at angles -8°, 0°, and +8°.

### Math & Logic
Operators `+`, `-`, `*`, `/`, `%` are supported in calculations.
New logical and comparative operators:
- `!=`, `<=`, `>=`, `<`, `>`, `==`
- `AND`, `OR`, `NOT`
Constants: `TRUE`, `FALSE`

### Memory Interface

#### Read-Only — Core
- `health`: Core Integrity (0–100).
- `rotation` / `angle` / `rot`: Facing angle in radians. All three are writable via `SET`.
- `fovDirection`: Scanner FOV cone angle — independent from body rotation. Writable via `SET`.
- `lockVision`: SET to `TRUE` to sync `fovDirection` to `rotation` every tick.
- `distance`: Distance to nearest **visible** (in-FOV) enemy. `Infinity` if none.
- `spotted`: TRUE if any enemy is within the FOV cone. Alias for `CAN_SEE_ENEMY`.
- `bullet_speed`: Projectile velocity constant (400 arena units/sec).

#### Read-Only — Energy
- `MY_ENERGY`: Current energy level (0–1000).
- `ENERGY_PCT`: Energy as a percentage (0–100).
- `IN_STASIS`: TRUE when energy ≤ 0. Movement and fire are blocked until energy ≥ 50.

#### Read-Only — FOV / Visibility
- `CAN_SEE_ENEMY`: TRUE if one or more enemies are within the current FOV cone.
- `VISIBLE_ENEMY_COUNT`: Number of enemies currently within the FOV cone.
- `NEAREST_VISIBLE_X` / `NEAREST_VISIBLE_Y`: Coordinates of the nearest visible enemy (own position if none).
- `FOV_ANGLE`: Current FOV cone angle in degrees (default 120°).

#### Read-Only — Scan Memory (populated by `SCAN`)
- `scanned_distance`: Distance to nearest visible enemy as of the last `SCAN` call.
- `scanned_angle`: Angle toward nearest visible enemy as of the last `SCAN` call.
- `scanned_spotted`: TRUE if any enemy was visible during the last `SCAN`.

#### Read-Only — Advanced Targeting (Hidden Identifiers)
- `target_vx`: Velocity of the nearest visible enemy on the X axis. Useful for predictive leading shots.
- `target_vy`: Velocity of the nearest visible enemy on the Y axis.
- `last_spotted_x`: Last **known** X position of the nearest visible enemy. Retained between ticks — updated only when the enemy is within FOV.
- `last_spotted_y`: Last **known** Y position of the nearest visible enemy.

## Battle Tactics (High-Level Examples)

### 1. The Stalker
Uses a continuous scan loop to acquire targets out of normal range, calculating offsets.
```aliscript
SCAN
WHILE NOT scanned_spotted DO
  SET rotation = rotation + 0.1
  WAIT 2
  SCAN
END
PATHFIND
IF scanned_distance < 200 THEN FIRE
```

### 2. The Turret
Remains stationary, waiting for optimal burst engagements to conserve energy.
```aliscript
FUNCTION defend
  SCAN
  IF scanned_distance < 150 THEN
    BURST_FIRE
    WAIT 10
  ELSE
    SET rotation = rotation + 0.05
  END
END

STOP
WHILE TRUE DO
  CALL defend
END
```

### 3. The Jitterbug
Utilizes math offsets to move erratically, dodging projectiles while maintaining a general forward sweep.
```aliscript
SET offset = 1

WHILE TRUE DO
  MOVE_FAST
  SET rotation = rotation + (offset * 0.5)
  SET offset = offset * -1
  IF spotted THEN FIRE
  WAIT 3
END
```

## Energy System
Each action (movement and firing) consumes energy. Robots regenerate energy passively over time (3 energy per tick). Complex commands like `BURST_FIRE` and `MOVE_FAST` consume energy at a significantly higher rate.

### Energy Costs Table
| Command | Energy Cost | blocked by STASIS |
| :--- | :--- | :--- |
| `MOVE` | 2 per tick | Yes |
| `MOVE_FAST` | 5 per tick | Yes |
| `BACKUP` | 2 per tick | Yes |
| `STOP` | 0 | No |
| `PATHFIND` | 3 per tick | Yes |
| `SCAN` | 5 per call | No |
| `FIRE` | 50 per shot | Yes |
| `BURST_FIRE` | 150 per burst | Yes |
| `WAIT` | 0 | No |
| `SET` / Logic | 0 | No |
