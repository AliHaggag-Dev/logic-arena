import { Brain, Radar, Search, ServerCrash, Shield, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AlgorithmChallenge {
  title: string;
  badge: LucideIcon;
  description: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  concept: string;
  code: string;
  color: string;
}

export const ALGORITHM_CHALLENGES: AlgorithmChallenge[] = [
  {
    title: 'Spiral Search Pattern',
    badge: Search,
    description: 'Continuously rotate the FOV with SCAN until an enemy enters vision, then engage. Classic search algorithm applied to robot combat.',
    difficulty: 'BEGINNER',
    concept: 'FOV Sweep / Detection Loop',
    color: 'var(--docs-cyan)',
    code:
      `// ── Spiral Search Pattern ──────────────────────
// Uses SCAN to rotate the FOV cone until CAN_SEE_ENEMY
// becomes true, then switches to combat mode.

WHILE TRUE DO
  IF CAN_SEE_ENEMY THEN
    // Target acquired — eliminate
    PATHFIND
    IF distance < 200 THEN
      FIRE
    END
  ELSE
    // Sweep the environment
    SCAN
    SET rotation = rotation + 0.08
    MOVE
    WAIT 1
  END
END`,
  },
  {
    title: 'Energy-Efficient Sniper',
    badge: Zap,
    description: 'Only fire when energy is sufficient and the enemy is visible. Waits during STASIS for energy to recover. Maximises the Efficiency Score metric.',
    difficulty: 'INTERMEDIATE',
    concept: 'Resource-Aware Decision Making',
    color: 'var(--docs-purple)',
    code:
      `// ── Energy-Efficient Sniper ────────────────────
// Optimises damage-per-energy-unit to achieve a
// high EFFICIENCY_SCORE at match end.
// NOTE: SCAN is BLOCKED during STASIS — use WAIT instead.

WHILE TRUE DO
  IF IN_STASIS THEN
    // Cannot act — wait for energy to recover (regen: +3/tick)
    WAIT 5
  ELSE
    IF MY_ENERGY < 30 THEN
      // Conserve — stop and let STASIS trigger regen
      STOP
      WAIT 3
    ELSE
      IF CAN_SEE_ENEMY THEN
        IF ENERGY_PCT > 60 THEN
          BURST_FIRE
        ELSE
          FIRE
        END
      ELSE
        SCAN
        MOVE
      END
    END
  END
END`,
  },
  {
    title: 'Defensive Regeneration Loop',
    badge: Shield,
    description: 'Detect STASIS entry, back away from the last known enemy position, and wait for energy to recover before re-engaging.',
    difficulty: 'ADVANCED',
    concept: 'State Machine / Stasis Recovery',
    color: 'var(--docs-orange)',
    code:
      `// ── Defensive Regeneration Loop ────────────────
// A two-state machine: COMBAT and RECOVERY.
// Switches states based on IN_STASIS and ENERGY_PCT.
// NOTE: SCAN is BLOCKED during STASIS — only WAIT/SET work.

SET mode = 0

WHILE TRUE DO
  IF IN_STASIS THEN
    // Forced recovery — SCAN blocked, SET still works
    SET mode = 1
    WAIT 4
  ELSE
    IF mode == 1 THEN
      // Just exited stasis — retreat before re-engaging
      IF ENERGY_PCT < 50 THEN
        BACKUP
        WAIT 2
      ELSE
        SET mode = 0
      END
    ELSE
      // Normal combat mode
      IF CAN_SEE_ENEMY THEN
        IF distance < 180 THEN
          FIRE
        ELSE
          PATHFIND
        END
      ELSE
        SCAN
        SET rotation = rotation + 0.12
      END
    END
  END
END`,
  },
  {
    title: 'Sensor Array Targeting',
    badge: Radar,
    description: 'Use GET_ALL_VISIBLE_ENEMIES() to gather all targets as a data structure, then write a minimum-health search in AliScript to always fire at the weakest enemy. The ultimate test of your algorithm skills.',
    difficulty: 'ADVANCED',
    concept: 'Array Processing / Min-Search / RAYCAST LOS',
    color: 'var(--docs-pink)',
    code:
      `// ── Sensor Array Targeting ─────────────────────
// Phase 1 Advanced: gather ALL visible enemies,
// find the weakest via a manual min-search loop,
// verify Line-of-Sight with RAYCAST, then fire.

FUNCTION findWeakest
  SET enemies = GET_ALL_VISIBLE_ENEMIES()
  SET n = LENGTH(enemies)
  IF n == 0 THEN RETURN END
  SET best = enemies[0]
  SET i = 1
  WHILE i < n DO
    SET e = enemies[i]
    IF e[3] < best[3] THEN
      SET best = e
    END
    SET i = i + 1
  END
  // Compute relative angle to target for LOS check
  SET tx = best[1]
  SET ty = best[2]
  SET absAngle = ATAN2(ty - POSITION_Y, tx - POSITION_X)
  SET relAngle = absAngle - rotation
  SET los = RAYCAST(relAngle)
  IF los >= best[0] THEN
    SET rotation = absAngle
    FIRE
  END
END

WHILE TRUE DO
  CALL findWeakest
  IF NOT CAN_SEE_ENEMY THEN
    SCAN
    MOVE
  END
END`,
  },
  {
    title: 'The Dictionary State Machine',
    badge: Brain,
    description: 'AliScript natively executes your code top-to-bottom every tick (10 times a second). You don\'t need an infinite WHILE TRUE DO loop! Use an initialization flag to preserve state across ticks using the new Dictionary syntax.',
    difficulty: 'ADVANCED',
    concept: 'State Machines / Game Loop Architecture',
    color: 'var(--docs-rose)',
    code:
      `// ── The Dictionary State Machine ───────────────
// Scripts run 10 times a second automatically.
// Initialize your state dictionary ONCE at the top.

IF NOT initialized THEN
  SET state = { mode: "SCAN", target_id: 0 }
  SET initialized = TRUE
END

// Main Game Loop Logic (Executes every tick)
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
    // Target lost, return to scanning
    SET state.mode = "SCAN"
  END
END`,
  },
  {
    title: 'The TLE Optimization',
    badge: ServerCrash,
    description: 'AliScript enforces a hard cap of 2,000 AST-node evaluations per tick. Brute-force O(N²) nested loops will crash your robot mid-combat with a [FATAL] TLE error. Learn to write O(N) linear scans or O(N log N) algorithms to stay under quota.',
    difficulty: 'ADVANCED',
    concept: 'Complexity Analysis / Instruction Quota',
    color: 'var(--docs-red)',
    code:
      `// ── The TLE Optimization ───────────────────────
// BAD: O(N²) brute-force — WILL trigger TLE crash
// if enemies array is large enough.
// (Each inner WHILE burns quota against the outer)

// SET enemies = GET_ALL_VISIBLE_ENEMIES()
// SET n = LENGTH(enemies)
// SET i = 0
// WHILE i < n DO             // outer loop
//   SET j = 0
//   WHILE j < n DO           // inner loop — quota killer
//     SET j = j + 1
//   END
//   SET i = i + 1
// END

// GOOD: O(N) single-pass min-health search
// Stays well within 2,000 ops even for large arrays.

SET enemies = GET_ALL_VISIBLE_ENEMIES()
SET n = LENGTH(enemies)
IF n == 0 THEN
  SCAN
  MOVE
ELSE
  SET best = enemies[0]
  SET i = 1
  WHILE i < n DO
    IF enemies[i][3] < best[3] THEN
      SET best = enemies[i]
    END
    SET i = i + 1
  END
  SET rotation = ATAN2(best[2] - POSITION_Y, best[1] - POSITION_X)
  FIRE
END`,
  },
];
