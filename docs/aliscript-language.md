# AliScript Language Reference (v3.0 — Phase 1: Advanced Sensors)

> **AliScript** is the custom scripting language powering Logic Arena's combat robots.  
> Write algorithms. Implement sorting. Fire when you have line-of-sight. Win.

---

## Table of Contents

1. [Syntax Rules](#syntax-rules)
2. [Control Flow](#control-flow)
3. [Movement & Actions](#movement--actions)
4. [Read-Only Identifiers](#read-only-identifiers)
5. [Math Standard Library](#math-standard-library)
6. [Arrays](#arrays)
7. [Dictionaries & Hash Maps ⭐ NEW](#dictionaries--hash-maps--new)
8. [Advanced Tactics: Game Loop Architecture](#advanced-tactics-game-loop-architecture)
9. [Advanced Sensors](#advanced-sensors)
10. [Swarm Intelligence ⭐ NEW](#swarm-intelligence--new)
11. [Status Query Functions](#status-query-functions)
12. [Energy System](#energy-system)
13. [Battle Tactics Examples](#battle-tactics-examples)

---

## Syntax Rules

| Rule | Detail |
| :--- | :--- |
| **Block keywords** | Conditionals and loops require explicit `THEN` / `DO` openers and `END` terminators |
| **Case insensitive** | `MOVE`, `move`, `Move` — all identical |
| **Comments** | `//` single-line comments |
| **Grouping** | Parentheses supported in all expressions: `SET x = (a + b) * 2` |
| **Strings** | Double-quoted string literals: `SET label = "hello"` |

---

## Control Flow

```aliascript
// Conditionals
IF health < 50 THEN
  BACKUP
ELSE
  FIRE
END

// Loops (auto-capped at 10 iterations/tick)
WHILE CAN_SEE_ENEMY DO
  FIRE
  WAIT 1
END

// Counted loop
FOR i = 0 TO LENGTH(arr) DO
  SET val = arr[i]
END

// Functions with parameters
FUNCTION aim(tx, ty)
  SET rotation = ATAN2(ty - POSITION_Y, tx - POSITION_X)
END

CALL aim(NEAREST_VISIBLE_X, NEAREST_VISIBLE_Y)
FIRE

// Early exit
BREAK     // exit innermost loop
CONTINUE  // skip to next iteration
RETURN    // return from function (optionally with a value)
```

---

## Movement & Actions

| Command | Energy Cost | Blocked in STASIS | Description |
| :--- | :---: | :---: | :--- |
| `MOVE` | 2/tick | ✅ | Standard forward propulsion |
| `MOVE_FAST` | 4/tick | ✅ | 2× speed, 2× energy cost |
| `BACKUP` | 2/tick | ✅ | Reverse thrust |
| `PATHFIND` | 3/tick | ✅ | A\* pathfinding toward nearest visible enemy |
| `STOP` | Free | ❌ | Halt all movement |
| `FIRE` | 8/shot | ✅ | Single precision shot (25 HP damage) |
| `BURST_FIRE` | 18/burst | ✅ | 3-shot burst at −8°, 0°, +8° (up to 24 HP) |
| `SCAN` | 3/call | ✅ | Rotate FOV cone +15°, populates scan memory |
| `WAIT N` | Free | ❌ | Suspend execution for N ticks (60 ticks ≈ 1s) |
| `SET var = expr` | Free | ❌ | Assign a variable. Executes even in STASIS |

---

## Read-Only Identifiers

### Self & Movement

| Identifier | Type | Description |
| :--- | :---: | :--- |
| `health` | `number` | Current HP (0–100) |
| `rotation` / `angle` / `rot` | `number` | Body facing angle in radians. **Writable** via `SET` |
| `fovDirection` | `number` | Scanner cone angle. Independent from body. **Writable** |
| `lockVision` | `flag` | `SET lockVision = TRUE` to sync scanner to body every tick |

### Energy

| Identifier | Type | Description |
| :--- | :---: | :--- |
| `MY_ENERGY` | `number` | Current energy (0–100) |
| `ENERGY_PCT` | `number` | Energy as percentage (0–100) |
| `IN_STASIS` | `boolean` | True when energy ≤ 0. Cleared at energy ≥ 20 |

### FOV / Visibility

| Identifier | Type | Description |
| :--- | :---: | :--- |
| `CAN_SEE_ENEMY` | `boolean` | True if any enemy is in the FOV cone |
| `VISIBLE_ENEMY_COUNT` | `number` | Count of enemies currently in FOV cone |
| `NEAREST_VISIBLE_X` / `_Y` | `number` | Coordinates of the nearest visible enemy |
| `FOV_ANGLE` | `number` | Current cone angle in degrees (default 120°) |
| `CAN_SEE_OBSTACLE` | `boolean` | True if any obstacle is in FOV cone |
| `NEAREST_OBSTACLE_TYPE` | `string` | `"SOLID"` / `"TRAP"` / `"LAVA"` / `"FINISH_LINE"` / `"NONE"` |
| `NEAREST_OBSTACLE_DISTANCE` | `number` | Distance to nearest visible obstacle |
| `distance` | `number` | Distance to nearest visible enemy (`Infinity` if none) |
| `spotted` | `boolean` | Alias for `CAN_SEE_ENEMY` |

### Advanced Targeting

| Identifier | Type | Description |
| :--- | :---: | :--- |
| `target_vx` / `target_vy` | `number` | Velocity of nearest enemy (use with `bullet_speed` for predictive lead shots) |
| `bullet_speed` | `number` | Projectile velocity constant: `400` arena units/sec |

---

## Math Standard Library

All math functions are expression-level — use them inside `SET`, `IF`, `WHILE`, and as arguments to other functions.

| Function | Returns | Description |
| :--- | :---: | :--- |
| `ABS(x)` | `number` | Absolute value |
| `SQRT(x)` | `number` | Square root. Negative inputs clamped to `0` |
| `POW(base, exp)` | `number` | Exponentiation: `base ^ exp` |
| `SIN(x)` | `number` | Sine (radians) |
| `COS(x)` | `number` | Cosine (radians) |
| `TAN(x)` | `number` | Tangent (radians) |
| `ATAN2(y, x)` | `number` | Angle in radians from origin to point `(x, y)` — **the aiming function** |
| `MIN(a, b)` | `number` | Smaller of two values |
| `MAX(a, b)` | `number` | Larger of two values |
| `FLOOR(x)` | `integer` | Round down |
| `CEIL(x)` | `integer` | Round up |
| `ROUND(x)` | `integer` | Round to nearest |
| `LOG(x)` | `number` | Natural logarithm. `x` must be `> 0` |
| `RANDOM()` | `number` | Random float in `[0.0, 1.0)` |

### Example — Predictive Aiming with ATAN2

```aliascript
// Lead-shot calculation: fire where the enemy WILL BE,
// not where they ARE right now.

SET ex  = NEAREST_VISIBLE_X
SET ey  = NEAREST_VISIBLE_Y
SET dx  = ex - POSITION_X
SET dy  = ey - POSITION_Y
SET d   = SQRT(dx * dx + dy * dy)

// Time for bullet to reach current enemy position
SET t   = d / bullet_speed

// Predicted position
SET px  = ex + target_vx * t
SET py  = ey + target_vy * t

// Aim body at predicted position and fire
SET rotation = ATAN2(py - POSITION_Y, px - POSITION_X)
FIRE
```

---

## Arrays

AliScript supports first-class arrays with literal syntax, index access, and standard operations.

### Declaration & Access

```aliascript
// Declare an array literal
SET angles = [0, 0.785, 1.57, 2.356]

// Read by zero-based index
SET a = angles[0]   // → 0

// Write by index
SET angles[2] = 1.6

// Nested arrays (array-of-arrays) — used by GET_ALL_VISIBLE_ENEMIES
SET matrix = [[1, 2], [3, 4]]
SET val = matrix[0][1]   // → 2
```

### Array Operation Reference

| Operation | Returns | Description |
| :--- | :---: | :--- |
| `SET arr = [v0, v1, ...]` | `array` | Declare an array literal |
| `arr[index]` | `value` | Read at zero-based index. `undefined` if out of bounds |
| `SET arr[index] = val` | `—` | Write at zero-based index. Index must be in bounds |
| `LENGTH(arr)` | `number` | Number of elements (or character count for strings) |
| `PUSH(arr, value)` | `number` | Append to end. Returns new length |
| `POP(arr)` | `value` | Remove and return last element. `undefined` if empty |

### Example — Bubble Sort in AliScript

```aliascript
// Sort an array of distances ascending (bubble sort)
// Demonstrates: nested loops, array indexing, PUSH/POP

FUNCTION bubbleSort(arr)
  SET n = LENGTH(arr)
  SET i = 0
  WHILE i < n DO
    SET j = 0
    WHILE j < n - i - 1 DO
      IF arr[j] > arr[j + 1] THEN
        SET tmp   = arr[j]
        SET arr[j] = arr[j + 1]
        SET arr[j + 1] = tmp
      END
      SET j = j + 1
    END
    SET i = i + 1
  END
END
```

---

## Dictionaries & Hash Maps ⭐ NEW

AliScript supports object literals (Dictionaries) allowing you to store key-value pairs and build complex state machines.

### Declaration & Access

```aliascript
// Declare an object literal
SET state = { mode: "HUNT", target_id: 4 }

// Read via dot notation
SET current_mode = state.mode

// Read via bracket notation (dynamic indexing)
SET current_mode = state["mode"]

// Mutating assignment
SET state.mode = "EVADE"
SET state["target_id"] = 12
```

### Dictionary Operation Reference

| Operation | Returns | Description |
| :--- | :---: | :--- |
| `SET obj = { key: "val" }` | `object` | Declare an object literal. Keys can be identifiers or strings. |
| `obj.key` | `value` | Access or modify via dot notation. |
| `obj["key"]` | `value` | Access or modify via bracket notation. |
| `SET obj.key = val` | `—` | Update a property on an existing object. |

---

## Advanced Tactics: Game Loop Architecture

AliScript runs from top to bottom **every single tick** (10 times a second). This means variables initialized at the top of your script will reset every fraction of a second.

To build an advanced state machine that persists across ticks, you don't need a `WHILE TRUE DO` loop. Instead, use an initialization flag (`IF NOT initialized THEN`) to preserve your State Dictionary.

### The Dictionary State Machine

```aliascript
// 1. Initialize State ONCE
IF NOT initialized THEN
  SET state = { mode: "SCAN", target_id: 0 }
  SET initialized = TRUE
END

// 2. Evaluate current state every tick
IF state.mode == "SCAN" THEN
  IF CAN_SEE_ENEMY THEN
    SET state.mode = "ENGAGE"
  ELSE
    SCAN
    SET rotation = rotation + 0.1
    MOVE
  END
END

IF state.mode == "ENGAGE" THEN
  IF CAN_SEE_ENEMY THEN
    FIRE
  ELSE
    SET state.mode = "SCAN"
  END
END
```

---

## Advanced Sensors

> Phase 1 introduces two new **expression-level sensor functions** that return rich data structures,
> turning your AliScript into a true algorithmic battleground.

---

### `GET_ALL_VISIBLE_ENEMIES()`

**Returns:** `Array<[distance, x, y, health]>`

Snapshots every alive enemy currently inside this robot's FOV cone into a flat array-of-arrays.
Each element is a `[number, number, number, number]` sub-array.

| Index | Field | Type | Description |
| :---: | :--- | :---: | :--- |
| `[0]` | `distance` | `number` | Distance in arena units from this robot to the enemy |
| `[1]` | `x` | `number` | Enemy position X (rounded to nearest integer) |
| `[2]` | `y` | `number` | Enemy position Y (rounded to nearest integer) |
| `[3]` | `health` | `number` | Enemy health points (0–100, rounded) |

> ⚠️ **Enemies are returned UNSORTED.** This is intentional — players must implement
> their own sorting algorithm (min-search, bubble sort, quicksort) to find their priority target.
> An empty array `[]` is returned when no enemies are in FOV. Always call `LENGTH()` before indexing.

```aliascript
// Find and fire at the WEAKEST visible enemy (min-health search)
SET enemies = GET_ALL_VISIBLE_ENEMIES()
SET count   = LENGTH(enemies)

IF count > 0 THEN
  SET weakest = enemies[0]
  SET i = 1

  WHILE i < count DO
    SET e = enemies[i]
    IF e[3] < weakest[3] THEN
      SET weakest = e
    END
    SET i = i + 1
  END

  // Aim at weakest and fire
  SET rotation = ATAN2(weakest[2] - POSITION_Y, weakest[1] - POSITION_X)
  FIRE
END
```

---

### `RAYCAST(angle)`

**Returns:** `number` (distance in arena units, 1 — FOV range)

Fires an invisible physics ray from the robot's current position in the direction
`robot.rotation + angle`. `angle` is a **relative radian offset** from the robot's body facing direction.

**Hit priority (first solid object wins):**

1. Arena boundary wall
2. Any `SOLID` obstacle (TRAP and LAVA are transparent — bullets fly through them)
3. Any alive robot (enemy **or** friendly — true physical occlusion)

Returns the FOV range constant (`300` by default) when nothing is hit within sensor range.

| Argument | Value | Fires direction |
| :---: | :---: | :--- |
| `RAYCAST(0)` | 0 rad | Straight ahead |
| `RAYCAST(-1.57)` | −π/2 | 90° left |
| `RAYCAST(1.57)` | +π/2 | 90° right |
| `RAYCAST(3.14)` | ±π | Directly behind |
| `RAYCAST(-0.785)` | −π/4 | 45° left |
| `RAYCAST(0.785)` | +π/4 | 45° right |

```aliascript
// ── 3-Ray Sonar Obstacle Avoidance ────────────────────────────────────────
SET front = RAYCAST(0)
SET left  = RAYCAST(-0.785)   // 45° left
SET right = RAYCAST(0.785)    // 45° right

IF front < 60 THEN
  // Obstacle dead ahead — steer toward the clearer side
  IF left > right THEN
    SET rotation = rotation - 0.3
  ELSE
    SET rotation = rotation + 0.3
  END
END

MOVE

// ── Line-of-Sight check before firing ─────────────────────────────────────
// Verifies no obstacle (or teammate) blocks the shot path
IF CAN_SEE_ENEMY THEN
  SET absAim  = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  SET relAim  = absAim - rotation
  SET losHit  = RAYCAST(relAim)

  // If raycast hits something CLOSER than the enemy, there is an obstruction
  IF losHit >= distance THEN
    SET rotation = absAim
    FIRE
  END
END
```

---

## Swarm Intelligence ⭐ NEW

AliScript natively supports Inter-Robot Communication via a secure, zero-latency mesh network. Use the `BROADCAST` and `RECEIVE` functions to coordinate your team.

### `BROADCAST(data)`

**Returns:** `number` (Count of teammates that successfully received the message)

Sends a deep-copy of `data` (dictionary, array, string, or number) to the inbox of every alive teammate.
The payload is safely copied to prevent cross-robot memory aliasing.

```aliascript
// Broadcast a target to all allies
IF CAN_SEE_ENEMY THEN
  SET count = BROADCAST({ type: "TARGET", x: NEAREST_VISIBLE_X, y: NEAREST_VISIBLE_Y })
END
```

> **Note:** Returns `0` if no data is provided or no alive teammates exist.

---

### `RECEIVE()`

**Returns:** `Array` of received messages

Atomically drains this robot's inbox and returns the full array of messages received since the last `RECEIVE()` call. The inbox is cleared immediately after reading.

```aliascript
// Process all incoming messages
SET msgs = RECEIVE()
SET len = LENGTH(msgs)

IF len > 0 THEN
  // Get the most recent message (last in array)
  SET latest = msgs[len - 1]
  
  IF latest.type == "TARGET" THEN
    // Move to broadcasted target
    SET rotation = ATAN2(latest.y - POSITION_Y, latest.x - POSITION_X)
    MOVE
  END
END
```

> **Note:** Calling `RECEIVE()` when the inbox is empty returns `[]`. Messages are delivered exactly once.

---

## Status Query Functions

These functions **print** their result to the in-game log panel. They do **not** return a value.

| Function | Returns (log only) | Description |
| :--- | :---: | :--- |
| `GET_HEALTH()` | `number` (0–100) | Current HP |
| `GET_ENERGY()` | `number` (0–100) | Current energy |
| `GET_ENERGY_PCT()` | `number` (0–100) | Energy as percentage |
| `GET_DISTANCE()` | `number` \| `"Infinity"` | Distance to nearest visible enemy |
| `GET_POSITION()` | `string` `{x, y}` | Current arena position |
| `GET_ROTATION()` | `number` | Body facing angle in radians |
| `GET_FOV_DIR()` | `number` | Scanner facing angle in radians |
| `GET_VISIBLE_COUNT()` | `number` | Enemies currently in FOV |
| `GET_OBSTACLE_TYPE()` | `string` | Type of nearest visible obstacle |
| `GET_OBSTACLE_DISTANCE()` | `number` \| `"Infinity"` | Distance to nearest obstacle |

---

## Energy System

Robots have a shared energy pool that powers all actions. STASIS (energy depleted) blocks movement and combat but not logic.

### Energy Costs

| Command | Cost | Blocked in STASIS |
| :--- | :---: | :---: |
| `MOVE` | 2/tick | ✅ |
| `MOVE_FAST` | 4/tick | ✅ |
| `BACKUP` | 2/tick | ✅ |
| `PATHFIND` | 3/tick | ✅ |
| `SCAN` | 3/call | ✅ |
| `FIRE` | 8/shot | ✅ |
| `BURST_FIRE` | 18/burst | ✅ |
| `STOP` | Free | ❌ |
| `WAIT` | Free | ❌ |
| `SET` / Logic | Free | ❌ |

> **Regen rate:** +3 energy/tick (60 energy/sec at 20 tps). STASIS exits at ≥ 20 energy (~0.33s recovery from 0).

---

## Battle Tactics Examples

### The Stalker

```aliascript
SCAN
WHILE NOT scanned_spotted DO
  SET rotation = rotation + 0.1
  WAIT 2
  SCAN
END
PATHFIND
IF scanned_distance < 200 THEN FIRE END
```

### The Turret

```aliascript
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

### The Jitterbug

```aliascript
SET offset = 1
WHILE TRUE DO
  MOVE_FAST
  SET rotation = rotation + (offset * 0.5)
  SET offset = offset * -1
  IF CAN_SEE_ENEMY THEN FIRE END
  WAIT 3
END
```

### The Sensor Array Hunter ⭐ NEW

```aliascript
// Gathers ALL visible enemies, targets weakest via min-search,
// verifies LOS with RAYCAST before committing the trigger.

FUNCTION huntWeakest
  SET enemies = GET_ALL_VISIBLE_ENEMIES()
  SET n = LENGTH(enemies)
  IF n == 0 THEN RETURN END

  // Min-health linear search
  SET best = enemies[0]
  SET i = 1
  WHILE i < n DO
    SET e = enemies[i]
    IF e[3] < best[3] THEN
      SET best = e
    END
    SET i = i + 1
  END

  // Compute aim angle (absolute)
  SET absAngle = ATAN2(best[2] - POSITION_Y, best[1] - POSITION_X)

  // Line-of-Sight verification via RAYCAST
  SET losHit = RAYCAST(absAngle - rotation)
  IF losHit >= best[0] THEN
    SET rotation = absAngle
    FIRE
  END
END

WHILE TRUE DO
  CALL huntWeakest
  IF NOT CAN_SEE_ENEMY THEN
    SCAN
    MOVE
  END
END
```
