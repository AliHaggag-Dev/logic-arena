# 🤖 Logic Arena — Rotation System Guide

## The 3 Rotation Controls (Simplified)

| Name | What it controls | Affects movement? | Affects vision? |
|------|-----------------|-------------------|-----------------|
| `rotation` (or `angle` / `rot`) | **Robot body & tracks** | ✅ Yes — MOVE goes this direction | ❌ No |
| `fovDirection` | **Scanner cone (eyes)** | ❌ No | ✅ Yes — CAN_SEE_ENEMY checks this |
| `lockVision` | **Links the two together** | — | — |

> [!IMPORTANT]
> `rotation`, `angle`, and `rot` are **100% identical**. They are aliases for the same thing. Use whichever you prefer.

---

## How Each One Works

### `rotation` — The Body / Tracks
- Controls **which direction the robot drives** when you use `MOVE` or `MOVE_FAST`
- When the robot moves, physics automatically updates `rotation` to face the direction of travel
- Setting it manually (`SET rotation = 1.57`) turns the body and changes the movement direction
- **Does NOT affect the scanner cone at all**

### `fovDirection` — The Scanner Eyes
- Controls **which direction the FOV cone points**
- This is the cone you see on screen — the colored fan shape
- `CAN_SEE_ENEMY` returns `TRUE` only if the enemy is inside this cone
- Setting it manually (`SET fovDirection = 3.14`) turns only the scanner, not the body
- **Does NOT affect body direction or movement at all**

### `lockVision` — The Link Button
- When **ON** (`LINKED`): the scanner automatically follows the body every tick. Wherever the body points, the scanner points too. They move as one unit.
- When **OFF** (`FREE`): the scanner and body are completely independent. You can aim them in totally different directions.
- **Auto-disables**: If `lockVision` is ON and you manually set `rotation` OR `fovDirection`, it automatically turns OFF. This prevents conflicts.
- **Toggle button**: There's a dedicated `[ LOCK_VISION ]` button in the HUD toolbar (amber/yellow color).

---

## Common Angle Values

| Value | Direction |
|-------|-----------|
| `0` | Right (East) → |
| `1.57` | Down (South) ↓ |
| `3.14` | Left (West) ← |
| `-1.57` or `4.71` | Up (North) ↑ |

---

## Example Scripts

### 1. Basic — Move and shoot what you see
```
SET lockVision = TRUE
MOVE
WHILE TRUE DO
  IF CAN_SEE_ENEMY THEN
    FIRE
  END
END
```
**What it does:** lockVision links the scanner to the body. The robot moves forward. Since the scanner follows the body, it shoots anything in front of it.

### 2. Rear-View Scanner — Eyes in the back of the head
```
SET rotation = 0
SET fovDirection = 3.14
MOVE
WHILE TRUE DO
  IF CAN_SEE_ENEMY THEN
    FIRE
  END
END
```
**What it does:** The robot drives **right** (rotation=0) but the scanner points **left** (fovDirection=3.14). So the robot is literally driving forward while watching behind it. If an enemy appears behind it, it fires.

### 3. Sweep Scanner — Spinning radar while moving
```
MOVE
WHILE TRUE DO
  SCAN
  IF CAN_SEE_ENEMY THEN
    FIRE
  END
END
```
**What it does:** `SCAN` rotates the scanner by 15° each call. The robot drives forward while the scanner sweeps a full 360° around it. When the sweep finds an enemy, it fires.

### 4. Lock, then break for manual aim
```
SET lockVision = TRUE
SET rotation = 1.57
MOVE
WAIT 20
SET fovDirection = 0
WHILE TRUE DO
  IF CAN_SEE_ENEMY THEN
    FIRE
  END
END
```
**What it does:** First, links scanner to body and drives south. After 20 ticks, manually sets fovDirection — this **automatically disables lockVision**. The robot keeps driving south, but the scanner now points east. From this point, body and scanner are independent.

### 5. Face-to-face standoff — Don't move, just guard
```
SET fovDirection = 0
WHILE TRUE DO
  IF CAN_SEE_ENEMY THEN
    FIRE
  END
END
```
**What it does:** Robot stands still. Scanner points east. If any enemy enters the scanner cone from the east side, it fires. The robot never moves.

---

## Conflict Resolution Rules

| Scenario | What happens |
|----------|-------------|
| `lockVision` is ON, you use `SET rotation = X` | lockVision auto-disables. Body turns to X. Scanner stays at its last position. |
| `lockVision` is ON, you use `SET fovDirection = X` | lockVision auto-disables. Scanner turns to X. Body stays at its last position. |
| `lockVision` is ON, you use `MOVE` | Body rotates from physics. Scanner follows because lockVision is still ON. |
| `lockVision` is ON, you use `SCAN` | Scanner rotates +15°. lockVision is **still ON** (SCAN doesn't trigger the auto-disable since it's a command, not a SET). On next tick, lockVision re-syncs scanner to body. |
| `lockVision` is OFF, you use `MOVE` | Body rotates from physics. Scanner stays frozen wherever it was. |
| `lockVision` is OFF, you use `SET rotation = X` | Body turns. Scanner unaffected. |

> [!TIP]
> If you want the simplest setup where the robot aims where it walks, just start your script with `SET lockVision = TRUE` or click the LOCK_VISION button.
