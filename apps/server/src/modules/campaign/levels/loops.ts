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
    conceptTaught: 'Counter-based loop with fixed period',
    description:
      'Five pulses, then a pause. The drum fires exactly 5 shots in sequence (one per tick), then moves right for 3 ticks before resetting. A mechanical heartbeat with a fixed period of 8 ticks. Count the beats to find the silence.',
    hints: [
      'The 3-tick movement pause after 5 shots is your attack window. Time your assault for ticks 6-8 of each cycle.',
      'Count with a local variable: SET t = t + 1. After each burst of 5 from the enemy, you have ticks 6, 7, 8 where it moves right without firing. Rush during those 3 ticks.',
      'SET t = t + 1. IF t > 8 THEN SET t = 0 END. IF t > 5 THEN FIRE END ELSE MOVE END. Time your FIRE commands to ticks 6-8 to maximize aggression during the enemy\'s pause.',
    ],
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
    maxTicks: 900,
    enemyHealth: 80,
    starThresholds: { three: 300, two: 600, one: 900 },
  },
  {
    id: 'loop-02',
    tabId: 'loops',
    order: 2,
    title: 'PATROL CIRCUIT',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'Waypoint loop with fire-on-arrival',
    description:
      'It patrols a fixed circuit using waypoints: moves to point A (200, 300), then B (600, 300), then back to A, firing whenever it reaches a waypoint and detects you. A predictable back-and-forth loop with known fire positions.',
    hints: [
      'It fires only at the two waypoint positions. Stay away from (200,300) and (600,300) to avoid all shots.',
      'During transit between A and B it cannot fire — only at arrival. Position yourself near the midpoint (400, 300) so you are close enough to shoot but not at either waypoint.',
      'The enemy is vulnerable DURING movement (no fire). Use MOVE to intercept its path between waypoints and fire continuously: IF VISIBLE_ENEMY_COUNT > 0 THEN SET rotation = ATAN2(...), FIRE END, MOVE.',
    ],
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
    maxTicks: 900,
    enemyHealth: 80,
    starThresholds: { three: 300, two: 600, one: 900 },
  },
  {
    id: 'loop-03',
    tabId: 'loops',
    order: 3,
    title: 'ADAPTIVE VORTEX',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Direction-toggling orbit loop',
    description:
      'It orbits the arena center in a circle. Every 8 ticks it reverses orbit direction. During clockwise rotation it fires on sight. During counter-clockwise it only scans. The vortex switches direction like a spinning top — you must time strikes to the correct spin phase.',
    hints: [
      'Counter-clockwise phase (no firing) is your safe window. Count 8 ticks to know when it swaps.',
      'It starts clockwise (fires). After 8 ticks it goes counter-clockwise (no fire, only scans). These 8 tick windows alternate. Commit to aggressive attacks in the scan-only (CCW) phase.',
      'Track the enemy\'s orbit tick: SET myTick = myTick + 1. Every 8 ticks (myTick % 8 == 0) the enemy swaps. Attack during odd windows (ticks 9-16, 25-32...) when it is in CCW/scan mode.',
    ],
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
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'loop-04',
    tabId: 'loops',
    order: 4,
    title: 'RAMP SCRIPT',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Escalating inner-loop shot count',
    description:
      'Each round fires an increasing number of shots: round 1 fires 1 shot, round 2 fires 2, round 3 fires 3, then resets. Between rounds it moves to the next waypoint. A ramping crescendo: 1+2+3 = 6 shots per full cycle, with the heaviest burst last.',
    hints: [
      'Round 3 fires 3 rapid shots — the most dangerous. Destroy it before round 3 or hide during it. The movement between rounds is your opening.',
      'Between rounds it strafes right for exactly 1 tick — that single movement tick is your safest attack window. Fire once per transition tick across all 3 rounds (3 free shots per cycle).',
      'The between-round tick: shots == round (the else branch). Use SCAN to track it, and time your FIRE on ticks where shots == round. You get 3 free windows per full cycle.',
    ],
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
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'loop-05',
    tabId: 'loops',
    order: 5,
    title: 'SEEK AND DESTROY',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Waypoint search loop with burst trigger',
    description:
      'A search loop: it patrols between 4 waypoints. At each waypoint it scans 360 degrees. If it detects you, it locks on and fires 3 times before continuing to the next waypoint. If it does not detect you, it moves on immediately. You must break the search pattern.',
    hints: [
      'Hide during its scan at each waypoint. It only fires when it finds you — if all scans miss, it is harmless.',
      'The 4 waypoints form a rectangle at (200,150), (600,150), (600,450), (200,450). It scans 360° at each corner. Stay in the center of the arena — it scans outward and may miss you there.',
      'After a burst of 3 shots it stops firing and moves to the next node. Once you take the first hit, retreat immediately — you still have 2 more shots incoming. Dodge laterally during the burst.',
    ],
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
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'loop-06',
    tabId: 'loops',
    order: 6,
    title: 'ECHO CHAMBER',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Nested outer/inner loop with strafe reposition',
    description:
      'Nested loops: an outer loop runs 3 cycles. Each outer cycle, an inner loop fires a number of shots equal to the outer index + 1 (1, 2, 3 shots). Between outer cycles, it strafes to reposition. 6 total shots compressed into a cage of echoes with variable intensity.',
    hints: [
      'The third outer cycle fires 3 shots — the heaviest burst. The strafe reposition between cycles is your attack window.',
      'Between outer cycles it strafes LEFT for 2 ticks (repos = 2). That is your window — 2 ticks of safe attack per cycle boundary. There are 3 boundaries per full loop (after 1,2,3 shots), giving 6 free ticks per full iteration.',
      'Track with a counter: SET t = t + 1. Full cycle is 1+2+3+2+2+2 = 12 ticks (shots + reposition ticks). Attack on reposition ticks (t%12 == 2, t%12 == 6, t%12 == 11 approximately).',
    ],
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
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'loop-07',
    tabId: 'loops',
    order: 7,
    title: 'DECIMATOR MK-IV',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Sight-accumulation overdrive trigger',
    description:
      'It runs a damage-tracking loop. It fires each tick it sees you and counts successful shots. After accumulating 4 confirmed sightings, it enters overdrive: speed doubles and it switches to burst fire for 5 ticks. Overdrive resets the counter. A bot that accelerates with engagement — the longer you are visible, the deadlier it becomes.',
    hints: [
      'Break line-of-sight frequently to prevent the counter from reaching 4. Stay hidden for 2+ ticks between engagements to keep it in normal mode.',
      'The counter only increments when visible — not when shots connect. Hide for even 1 tick to pause accumulation. A pattern of expose-1 hide-2 keeps sightCount at max 1, preventing overdrive entirely.',
      'Rhythm: expose for 1 tick → FIRE → hide for 2 ticks → repeat. Your script: IF t%3 == 0 THEN expose and FIRE ELSE MOVE RIGHT END. This caps the enemy\'s sightCount at 1-2 indefinitely.',
    ],
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
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'loop-08',
    tabId: 'loops',
    order: 8,
    title: 'SINE WAVE',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Modulo-based phase loop with fire peaks',
    description:
      'It moves in a sine wave pattern using a tick counter modulo 10. Phases 0-2: strafe right. Phase 3: fire. Phases 4-6: strafe left. Phase 7: fire. Phases 8-9: orbit center. A wave oscillation with precisely timed fire peaks at the extremes of each oscillation.',
    hints: [
      'Fires happen exactly at phases 3 and 7. Position yourself at the center of the wave — its strafing carries it away from you at fire time.',
      'Phase 3 fire: it has just finished strafing right (max right position). Phase 7 fire: just finished strafing left (max left). These are the two extreme positions. Fire back during the strafe phases (0-2, 4-6) when it is moving predictably.',
      'Use tick % 10 logic in your approach: attack on phases 0-2 (strafe right, no fire) and 4-6 (strafe left, no fire). Back off or dodge on phases 3 and 7 when fire triggers. Use SCAN to verify position.',
    ],
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
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'loop-09',
    tabId: 'loops',
    order: 9,
    title: 'CONVERGENCE ENGINE',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Dual-counter convergence with frenzy burst',
    description:
      'Two counters converge: A starts at 0 going up, B starts at 6 going down. Each tick both advance. When A < B: it patrols and fires single shots. When A == B (convergence): it triggers a 3-tick BURST_FIRE frenzy with speed boost. After convergence it resets. The convergence point is tick 3 — a countdown to maximum violence.',
    hints: [
      'Convergence happens at tick 3. The burst frenzy lasts 3 ticks. Either kill it before tick 3 or survive ticks 3-5, then attack during the reset.',
      'After the 3-tick frenzy it resets completely (a=0, b=6) and starts over. The reset tick is your opening — it performs no action during that exact tick. Attack immediately after the frenzy ends.',
      'Full cycle: 3 normal ticks + 3 frenzy ticks + 1 reset tick = 7 ticks. Your rhythm: attack ticks 1-2 (normal fire), dodge ticks 3-5 (frenzy), attack tick 6 (reset window), repeat.',
    ],
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
    maxTicks: 1500,
    enemyHealth: 150,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
  {
    id: 'loop-10',
    tabId: 'loops',
    order: 10,
    title: 'INFINITE NEMESIS',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Hit-count evolutionary state machine',
    description:
      'A perpetual loop with an internal evolution counter. It tracks total damage dealt via a hit counter. Every 3 hits, it evolves: evolution 0 = normal fire, evolution 1 = strafe + fire, evolution 2 = orbit + burst fire, evolution 3 = speed-boosted orbit + FOV lock + burst. Each evolution is permanent — the longer the fight, the more lethal it becomes. There is no reset.',
    hints: [
      'It evolves every 3 hits — not shots, HITS. If you can dodge consistently, it stays in evolution 0. Alternatively, rush it down before it evolves past 1.',
      'Evolution happens every 3 times your HP drops. To prevent evolution, dodge all 3 shots before it registers 3 hits. Strafe laterally every 2 ticks — single-fire evolution 0 is easy to sidestep.',
      'Rush strategy: write maximum DPS. Start with BURST_FIRE immediately. Target: kill it in evolution 0 (<3 hits to you). Use: IF VISIBLE_ENEMY_COUNT > 0 THEN SET rotation = ATAN2(...), BURST_FIRE, MOVE END with aggressive positioning.',
    ],
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
    maxTicks: 1500,
    enemyHealth: 180,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
];
