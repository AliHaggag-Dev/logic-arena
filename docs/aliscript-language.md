# AliScript Language Reference

## Overview
AliScript is a simple, line-based scripting language specifically designed for programming combat robots within the Logic Arena environment. It allows operators to define autonomous behaviors for their neural cores using a high-level, human-readable syntax.

## Syntax Rules
- **Case Insensitive**: Commands and conditions can be written in uppercase or lowercase.
- **One Statement Per Line**: Each instruction must reside on its own line.
- **Comments**: Use `//` to add comments. Anything following `//` on a line is ignored by the compiler.

## Commands Reference

### Movement Commands
- `MOVE`: Moves the robot forward in its current rotation direction.
- `MOVE_FAST`: Moves the robot forward at 2x the standard speed.
- `BACKUP`: Moves the robot backward relative to its current rotation.
- `STOP`: Immediately halts all movement and velocity.
- `PATHFIND`: Activates the A* pathfinding algorithm to navigate toward the nearest enemy while avoiding obstacles.

### Combat Commands  
- `FIRE`: Fires a standard projectile at the nearest enemy. Has a 500ms cooldown.
- `BURST_FIRE`: A rapid-fire variant that discharges multiple rounds in quick succession.

### Conditional Logic
`IF [condition] THEN [command]`

### Available Conditions
- `spotted`: Evaluates to true when an enemy robot is within the sensor range.
- `health < [number]`: True if the robot's current health is below the specified threshold.
- `distance < [number]`: True if the nearest enemy is closer than the specified distance.
- `distance > [number]`: True if the nearest enemy is further than the specified distance.

### Variables (SET)
- `SET [varname] = [value]`: Assigns a value to a user-defined variable.
- Example: `SET rotation = 1.57`

### Memory Variables (read-only)
- `health`: Current robot health (0-100).
- `distance`: Distance to the nearest detected enemy.
- `spotted`: Boolean state indicating if an enemy is in sensor range.
- `rotation`: Current robot rotation in radians.
- `target_vx`, `target_vy`: The velocity vectors of the current target.
- `last_spotted_x`, `last_spotted_y`: The last known global coordinates of the enemy.

## Example Scripts

### Aggressive Sniper
```
IF spotted THEN FIRE
IF distance < 200 THEN BACKUP
IF distance > 400 THEN PATHFIND
```

### Safe Mode (Defensive)
```
IF health < 30 THEN BACKUP
IF spotted THEN FIRE
PATHFIND
```

### Brawler
```
MOVE_FAST
IF spotted THEN BURST_FIRE
IF health < 50 THEN BACKUP
```

## Energy System
Each action (movement and firing) consumes energy. Robots regenerate energy passively over time. Complex commands like `BURST_FIRE` and `MOVE_FAST` consume energy at a significantly higher rate.

## Tips & Tricks
- **Hybrid Tactics**: Combine `PATHFIND` with `FIRE` to create aggressive bots that hunt down their targets.
- **Evasive Maneuvers**: Use `BACKUP` when health is low or the enemy is too close to maintain a tactical advantage.
- **Energy Management**: `BURST_FIRE` is powerful for securing kills but can leave you drained and vulnerable if used recklessly.
