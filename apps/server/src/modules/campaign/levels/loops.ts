import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const LOOPS_LEVELS: CampaignLevel[] = [
  {
    id: 'loop-01',
    tabId: 'loops',
    order: 1,
    title: 'PULSE DRUM',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    description:
      'Five pulses, then a pause. The drum fires exactly 5 shots in sequence (one per tick), then moves right for 3 ticks before resetting. A mechanical heartbeat with a fixed period of 8 ticks. Count the beats to find the silence.',
    hint: 'The 3-tick movement pause after 5 shots is your attack window. Time your assault for ticks 6-8 of each cycle.',
    enemyScript: `IF NOT init THEN
  SET i = 0
  SET init = 1
END
IF i < 5 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  ELSE
    SCAN
  END
  SET i = i + 1
ELSE
  IF i < 8 THEN
    MOVE RIGHT
    SET i = i + 1
  ELSE
    SET i = 0
  END
END`,
  },
  {
    id: 'loop-02',
    tabId: 'loops',
    order: 2,
    title: 'PATROL CIRCUIT',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    description:
      'It patrols a fixed circuit using waypoints: moves to point A (200, 300), then B (600, 300), then back to A, firing whenever it reaches a waypoint and detects you. A predictable back-and-forth loop with known fire positions.',
    hint: 'It fires only at the two waypoint positions. Stay away from (200,300) and (600,300) to avoid all shots.',
    enemyScript: `IF NOT init THEN
  SET phase = 0
  SET init = 1
END
IF phase == 0 THEN
  SET _SYS_TARGET_X = 200
  SET _SYS_TARGET_Y = 300
  IF _SYS_AT_TARGET == 1 THEN
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
      FIRE
    END
    SET phase = 1
    SET _SYS_AT_TARGET = 0
  ELSE
    MOVE
  END
ELSE
  SET _SYS_TARGET_X = 600
  SET _SYS_TARGET_Y = 300
  IF _SYS_AT_TARGET == 1 THEN
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
      FIRE
    END
    SET phase = 0
    SET _SYS_AT_TARGET = 0
  ELSE
    MOVE
  END
END`,
  },
  {
    id: 'loop-03',
    tabId: 'loops',
    order: 3,
    title: 'ADAPTIVE VORTEX',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'It orbits the arena center in a circle. Every 8 ticks it reverses orbit direction. During clockwise rotation it fires on sight. During counter-clockwise it only scans. The vortex switches direction like a spinning top — you must time strikes to the correct spin phase.',
    hint: 'Counter-clockwise phase (no firing) is your safe window. Count 8 ticks to know when it swaps.',
    enemyScript: `IF NOT init THEN
  SET tick = 0
  SET orbitDir = 1
  SET init = 1
END
SET tick = tick + 1
IF tick > 8 THEN
  SET tick = 0
  SET orbitDir = orbitDir * -1
END
IF orbitDir > 0 THEN
  SET _SYS_ORBIT_X = 400
  SET _SYS_ORBIT_Y = 300
  SET _SYS_ORBIT_R = 150
ELSE
  SET _SYS_ORBIT_X = 400
  SET _SYS_ORBIT_Y = 300
  SET _SYS_ORBIT_R = -150
END
SET _SYS_FACE_X = 400
SET _SYS_FACE_Y = 300
IF orbitDir > 0 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  END
ELSE
  SCAN
END
MOVE`,
  },
  {
    id: 'loop-04',
    tabId: 'loops',
    order: 4,
    title: 'RAMP PROTOCOL',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'Each round fires an increasing number of shots: round 1 fires 1 shot, round 2 fires 2, round 3 fires 3, then resets. Between rounds it moves to the next waypoint. A ramping crescendo: 1+2+3 = 6 shots per full cycle, with the heaviest burst last.',
    hint: 'Round 3 fires 3 rapid shots — the most dangerous. Destroy it before round 3 or hide during it. The movement between rounds is your opening.',
    enemyScript: `IF NOT init THEN
  SET round = 1
  SET shots = 0
  SET init = 1
END
IF shots < round THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  ELSE
    SCAN
  END
  SET shots = shots + 1
ELSE
  SET _SYS_STRAFE = 1
  MOVE
  SET round = round + 1
  SET shots = 0
  IF round > 3 THEN
    SET round = 1
  END
END`,
  },
  {
    id: 'loop-05',
    tabId: 'loops',
    order: 5,
    title: 'SEEK AND DESTROY',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'A search loop: it patrols between 4 waypoints. At each waypoint it scans 360 degrees. If it detects you, it locks on and fires 3 times before continuing to the next waypoint. If it does not detect you, it moves on immediately. You must break the search pattern.',
    hint: 'Hide during its scan at each waypoint. It only fires when it finds you — if all scans miss, it is harmless.',
    enemyScript: `IF NOT init THEN
  SET wp = 0
  SET burstLeft = 0
  SET init = 1
END
IF burstLeft > 0 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  END
  FIRE
  SET burstLeft = burstLeft - 1
ELSE
  IF wp == 0 THEN
    SET _SYS_TARGET_X = 200
    SET _SYS_TARGET_Y = 150
  END
  IF wp == 1 THEN
    SET _SYS_TARGET_X = 600
    SET _SYS_TARGET_Y = 150
  END
  IF wp == 2 THEN
    SET _SYS_TARGET_X = 600
    SET _SYS_TARGET_Y = 450
  END
  IF wp == 3 THEN
    SET _SYS_TARGET_X = 200
    SET _SYS_TARGET_Y = 450
  END
  IF _SYS_AT_TARGET == 1 THEN
    SET _SYS_SCAN_SWEEP_DEG = 360
    SCAN
    SET _SYS_SCAN_SWEEP_DEG = 0
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      SET burstLeft = 3
    END
    SET wp = wp + 1
    SET _SYS_AT_TARGET = 0
    IF wp > 3 THEN
      SET wp = 0
    END
  ELSE
    MOVE
  END
END`,
  },
  {
    id: 'loop-06',
    tabId: 'loops',
    order: 6,
    title: 'ECHO CHAMBER',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'Nested loops: an outer loop runs 3 cycles. Each outer cycle, an inner loop fires a number of shots equal to the outer index + 1 (1, 2, 3 shots). Between outer cycles, it strafes to reposition. 6 total shots compressed into a cage of echoes with variable intensity.',
    hint: 'The third outer cycle fires 3 shots — the heaviest burst. The strafe reposition between cycles is your attack window.',
    enemyScript: `IF NOT init THEN
  SET outer = 0
  SET inner = 0
  SET repos = 0
  SET init = 1
END
IF outer < 3 THEN
  IF repos > 0 THEN
    SET _SYS_STRAFE = -1
    MOVE
    SET repos = repos - 1
  ELSE
    SET maxInner = outer + 1
    IF inner < maxInner THEN
      IF VISIBLE_ENEMY_COUNT > 0 THEN
        SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
        FIRE
      ELSE
        SCAN
      END
      SET inner = inner + 1
    ELSE
      SET inner = 0
      SET outer = outer + 1
      SET repos = 2
    END
  END
ELSE
  SET outer = 0
END`,
  },
  {
    id: 'loop-07',
    tabId: 'loops',
    order: 7,
    title: 'DECIMATOR MK-IV',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It runs a damage-tracking loop. It fires each tick it sees you and counts successful shots. After accumulating 4 confirmed sightings, it enters overdrive: speed doubles and it switches to burst fire for 5 ticks. Overdrive resets the counter. A bot that accelerates with engagement — the longer you are visible, the deadlier it becomes.',
    hint: 'Break line-of-sight frequently to prevent the counter from reaching 4. Stay hidden for 2+ ticks between engagements to keep it in normal mode.',
    enemyScript: `IF NOT init THEN
  SET sightCount = 0
  SET overdrive = 0
  SET init = 1
END
IF overdrive > 0 THEN
  SET _SYS_SPEED_MULT = 2
  SET _SYS_FACE_X = NEAREST_VISIBLE_X
  SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    BURST_FIRE
  END
  MOVE
  SET overdrive = overdrive - 1
  IF overdrive == 0 THEN
    SET _SYS_SPEED_MULT = 1
  END
ELSE
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
    SET sightCount = sightCount + 1
    IF sightCount >= 4 THEN
      SET overdrive = 5
      SET sightCount = 0
    END
    MOVE
  ELSE
    SCAN
    MOVE RIGHT
  END
END`,
  },
  {
    id: 'loop-08',
    tabId: 'loops',
    order: 8,
    title: 'SINE WAVE',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It moves in a sine wave pattern using a tick counter modulo 10. Phases 0-2: strafe right. Phase 3: fire. Phases 4-6: strafe left. Phase 7: fire. Phases 8-9: orbit center. A wave oscillation with precisely timed fire peaks at the extremes of each oscillation.',
    hint: 'Fires happen exactly at phases 3 and 7. Position yourself at the center of the wave — its strafing carries it away from you at fire time.',
    enemyScript: `IF NOT init THEN
  SET tick = 0
  SET init = 1
END
SET phase = tick % 10
IF phase < 3 THEN
  SET _SYS_STRAFE = 1
  MOVE
ELSE
  IF phase == 3 THEN
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
      FIRE
    END
  ELSE
    IF phase < 7 THEN
      SET _SYS_STRAFE = -1
      MOVE
    ELSE
      IF phase == 7 THEN
        IF VISIBLE_ENEMY_COUNT > 0 THEN
          SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
          FIRE
        END
      ELSE
        SET _SYS_ORBIT_X = 400
        SET _SYS_ORBIT_Y = 300
        SET _SYS_ORBIT_R = 100
        MOVE
      END
    END
  END
END
SET tick = tick + 1`,
  },
  {
    id: 'loop-09',
    tabId: 'loops',
    order: 9,
    title: 'CONVERGENCE ENGINE',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'Two counters converge: A starts at 0 going up, B starts at 6 going down. Each tick both advance. When A < B: it patrols and fires single shots. When A == B (convergence): it triggers a 3-tick BURST_FIRE frenzy with speed boost. After convergence it resets. The convergence point is tick 3 — a countdown to maximum violence.',
    hint: 'Convergence happens at tick 3. The burst frenzy lasts 3 ticks. Either kill it before tick 3 or survive ticks 3-5, then attack during the reset.',
    enemyScript: `IF NOT init THEN
  SET a = 0
  SET b = 6
  SET frenzy = 0
  SET init = 1
END
IF frenzy > 0 THEN
  SET _SYS_SPEED_MULT = 2
  SET _SYS_FACE_X = NEAREST_VISIBLE_X
  SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    BURST_FIRE
  END
  SET _SYS_STRAFE = 1
  MOVE
  SET frenzy = frenzy - 1
  IF frenzy == 0 THEN
    SET _SYS_SPEED_MULT = 1
    SET a = 0
    SET b = 6
  END
ELSE
  IF a < b THEN
    SET a = a + 1
    SET b = b - 1
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
      FIRE
      MOVE
    ELSE
      SCAN
      MOVE RIGHT
    END
  ELSE
    SET frenzy = 3
  END
END`,
  },
  {
    id: 'loop-10',
    tabId: 'loops',
    order: 10,
    title: 'INFINITE NEMESIS',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'A perpetual loop with an internal evolution counter. It tracks total damage dealt via a hit counter. Every 3 hits, it evolves: evolution 0 = normal fire, evolution 1 = strafe + fire, evolution 2 = orbit + burst fire, evolution 3 = speed-boosted orbit + FOV lock + burst. Each evolution is permanent — the longer the fight, the more lethal it becomes. There is no reset.',
    hint: 'It evolves every 3 hits — not shots, HITS. If you can dodge consistently, it stays in evolution 0. Alternatively, rush it down before it evolves past 1.',
    enemyScript: `IF NOT init THEN
  SET hitCounter = 0
  SET evolution = 0
  SET prevEnemyHp = 100
  SET init = 1
END
SET enemies = GET_ALL_VISIBLE_ENEMIES()
SET len = LENGTH(enemies)
IF len > 0 THEN
  SET curHp = enemies[0][3]
  IF curHp < prevEnemyHp THEN
    SET hitCounter = hitCounter + 1
    IF hitCounter >= 3 THEN
      SET hitCounter = 0
      IF evolution < 3 THEN
        SET evolution = evolution + 1
      END
    END
  END
  SET prevEnemyHp = curHp
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  IF evolution == 0 THEN
    FIRE
    MOVE
  ELSE
    IF evolution == 1 THEN
      SET _SYS_STRAFE = 1
      FIRE
      MOVE
    ELSE
      IF evolution == 2 THEN
        SET _SYS_ORBIT_X = NEAREST_VISIBLE_X
        SET _SYS_ORBIT_Y = NEAREST_VISIBLE_Y
        SET _SYS_ORBIT_R = 120
        SET _SYS_FACE_X = NEAREST_VISIBLE_X
        SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
        BURST_FIRE
        MOVE
      ELSE
        SET _SYS_SPEED_MULT = 1.8
        SET _SYS_ORBIT_X = NEAREST_VISIBLE_X
        SET _SYS_ORBIT_Y = NEAREST_VISIBLE_Y
        SET _SYS_ORBIT_R = -80
        SET _SYS_FACE_X = NEAREST_VISIBLE_X
        SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
        BURST_FIRE
        MOVE
      END
    END
  END
ELSE
  SCAN
  MOVE RIGHT
END`,
  },
];
