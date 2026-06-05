import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const ARRAYS_LEVELS: CampaignLevel[] = [
  {
    id: 'arr-01',
    tabId: 'arrays',
    order: 1,
    title: 'ECHO LATTICE',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'Array indexing with cyclic iterator',
    description:
      'It processes a hardcoded movement array: [1, 0, -1, 0]. Positive means move forward, negative means backup, zero means stop and fire. A fixed sequence of physical actions you must decode.',
    hints: [
      'The pattern is move, shoot, backup, shoot. It repeats every 4 seconds. Exploit the backup phase.',
      'On second 2 (index 1) and second 4 (index 3) it fires (cmd == 0). On second 3 (index 2) it backs up — this is your safest advance window. The backup second puts distance between you and its aim.',
      'Approach during the backup tick (cmd == -1, index 2). Your script: SET t = t + 1, track t%4. When t%4 == 2, advance and FIRE. When t%4 == 3 (its fire tick), strafe to dodge.',
    ],
    enemyScript: `IF NOT init THEN
  SET cmds = [1, 0, -1, 0]
  SET i = 0
  SET init = 1
END
SET cmd = cmds[i]
IF cmd == 1 THEN
  MOVE
ELSE
  IF cmd == -1 THEN
    BACKUP
  ELSE
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
      FIRE
    END
    STOP
  END
END
SET i = i + 1
IF i > 3 THEN
  SET i = 0
END`,
    maxTicks: 900,
    enemyHealth: 80,
    starThresholds: { three: 300, two: 600, one: 900 },
  },
  {
    id: 'arr-02',
    tabId: 'arrays',
    order: 2,
    title: 'SEQUENCE WALKER',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'Strafe-direction array read',
    description:
      'It reads from a strafe direction array: [1, 1, -1, -1]. It strafes right twice, then left twice, firing if you are visible. A choreographed lateral dance.',
    hints: [
      'The array dictates its strafe. Follow its lateral movement and anticipate the reversal.',
      'It fires every second you are visible — the strafe array only changes its movement direction, not its fire rate. Strafe in the SAME direction as the enemy: you both move right, creating a parallel path that is hard for its rotation to track.',
      'Counter-strafe strategy: when it strafes right (index 0-1), strafe left. When it goes left (index 2-3), strafe right. You cross its aim vector and its rotation lags behind. Use: SET _SYS_STRAFE = -1 when it strafes right.',
    ],
    enemyScript: `IF NOT init THEN
  SET strafes = [1, 1, -1, -1]
  SET i = 0
  SET init = 1
END
SET _SYS_STRAFE = strafes[i]
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  FIRE
ELSE
  SCAN
END
MOVE
SET i = i + 1
IF i > 3 THEN
  SET i = 0
END`,
    maxTicks: 900,
    enemyHealth: 80,
    starThresholds: { three: 300, two: 600, one: 900 },
  },
  {
    id: 'arr-03',
    tabId: 'arrays',
    order: 3,
    title: 'SWARM VECTOR',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'GET_ALL_VISIBLE_ENEMIES with array iteration',
    description:
      'It fetches ALL visible enemies into an array and iterates over them. It targets the one with the lowest health. You must act as the lowest-health target to manipulate its aggro.',
    hints: [
      'Use `GET_ALL_VISIBLE_ENEMIES()` mechanics. It always attacks the weakest. If you are weak, it will lock onto you with a speed-boosted advance.',
      'The enemy array format is [distance, x, y, health]. It targets enemies[i][3] (health index). Keep your HP high by dodging well — let it lock onto a lower-health target if any exist. Strafe to dodge its advance.',
      'Pattern: avoid taking damage (the enemy prioritizes lowest HP). Use MOVE perpendicular to its advance path. If distance < 150 and VISIBLE_ENEMY_COUNT > 0, BACKUP immediately to maintain safe distance from its 1.5x speed chase.',
    ],
    enemyScript: `IF NOT init THEN
  SET init = 1
END
SET enemies = GET_ALL_VISIBLE_ENEMIES()
SET len = LENGTH(enemies)
IF len > 0 THEN
  SET best = enemies[0]
  SET i = 1
  WHILE i < len DO
    SET e = enemies[i]
    IF e[3] < best[3] THEN
      SET best = e
    END
    SET i = i + 1
  END
  SET rotation = ATAN2(best[2] - POSITION_Y, best[1] - POSITION_X)
  SET _SYS_SPEED_MULT = 1.5
  FIRE
  MOVE
ELSE
  SCAN
  MOVE RIGHT
END`,
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'arr-04',
    tabId: 'arrays',
    order: 4,
    title: 'BURST TABLE',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Variable-burst-count array lookup',
    description:
      'Its fire pattern is encoded in an array: [2, 1, 3, 1]. Each value is the number of shots it fires per cycle. Four cycles, variable intensity. It locks FOV and strafes while bursting.',
    hints: [
      'Cycle 3 fires 3 shots — the heaviest burst. Dodge during cycle 3, attack during cycles 2 and 4.',
      "Cycle 2 fires only 1 shot — the lightest. Cycle 4 also fires 1 shot. These are your best attack windows. After cycle 3's 3 shots, there's a movement second before cycle 4 begins — use that transition.",
      'Track the cycle index in your own counter. Cycle durations: 2,1,3,1 shots + 1 transition second each = 4+4+4+4 = 16 total seconds per full cycle. Attack during cycles with bursts[i]==1 (lightest fire cycles).',
    ],
    enemyScript: `IF NOT init THEN
  SET bursts = [2, 1, 3, 1]
  SET cycle = 0
  SET shots = 0
  SET init = 1
END
IF shots < bursts[cycle] THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET _SYS_FACE_X = NEAREST_VISIBLE_X
    SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  ELSE
    SCAN
  END
  SET _SYS_STRAFE = 1
  MOVE
  SET shots = shots + 1
ELSE
  SET shots = 0
  SET cycle = cycle + 1
  IF cycle > 3 THEN
    SET cycle = 0
  END
  MOVE RIGHT
END`,
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'arr-05',
    tabId: 'arrays',
    order: 5,
    title: 'WAYPOINT RUNNER',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Parallel X/Y coordinate arrays for navigation',
    description:
      'It follows a waypoint coordinates array: [[200, 200], [600, 200], [600, 400], [200, 400]]. It uses the exact rail system to navigate. Upon reaching each waypoint, it executes a burst fire.',
    hints: [
      'The coordinates form a rectangle. It stops and fires at the corners. Attack while it transits the edges.',
      'The four burst-fire corners are (200,200), (600,200), (600,400), (200,400). Position yourself at the center (400, 300) — you are always equidistant and safe from its corner bursts. Attack while it transits edges toward you.',
      'Best attack position: stay near (400,300). Use: IF VISIBLE_ENEMY_COUNT > 0 AND distance < 350 THEN FIRE END, MOVE. The enemy travels predictable paths and you can track its position on the rectangle edges.',
    ],
    enemyScript: `IF NOT init THEN
  SET wpx = [200, 600, 600, 200]
  SET wpy = [200, 200, 400, 400]
  SET wp = 0
  SET init = 1
END
SET _SYS_TARGET_X = wpx[wp]
SET _SYS_TARGET_Y = wpy[wp]
IF _SYS_AT_TARGET == 1 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    BURST_FIRE
  ELSE
    SCAN
  END
  SET wp = wp + 1
  IF wp > 3 THEN
    SET wp = 0
  END
  SET _SYS_AT_TARGET = 0
ELSE
  MOVE
END`,
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'arr-06',
    tabId: 'arrays',
    order: 6,
    title: 'PRIORITY QUEUE',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Min-distance array scan for nearest target',
    description:
      'It processes targets by maintaining an internal priority array of threats based on distance. It loops through all visible enemies, sorting them into a pseudo-priority queue. Closest target receives an orbital strike.',
    hints: [
      'It always orbits and fires at the absolute closest target. Manipulate your distance to control its orbit center.',
      'The orbit radius is fixed at 100 units. If you stay at exactly 100 units from the orbit center, you are ON the orbit path — it rotates around you. Move perpendicular to the orbit to step off and fire at its known position.',
      'The orbit is centered on YOU (best[1], best[2] from the array). Move in a large circle at radius > 200: it cannot orbit effectively at that scale and falls back to chasing. Use: SET _SYS_ORBIT_R = 200 to maintain a counter-orbit.',
    ],
    enemyScript: `IF NOT init THEN
  SET init = 1
END
SET enemies = GET_ALL_VISIBLE_ENEMIES()
SET len = LENGTH(enemies)
IF len > 0 THEN
  SET best = enemies[0]
  SET i = 1
  WHILE i < len DO
    SET e = enemies[i]
    IF e[0] < best[0] THEN
      SET best = e
    END
    SET i = i + 1
  END
  SET _SYS_ORBIT_X = best[1]
  SET _SYS_ORBIT_Y = best[2]
  SET _SYS_ORBIT_R = 100
  SET _SYS_FACE_X = best[1]
  SET _SYS_FACE_Y = best[2]
  SET rotation = ATAN2(best[2] - POSITION_Y, best[1] - POSITION_X)
  FIRE
  MOVE
ELSE
  SCAN
  MOVE RIGHT
END`,
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'arr-07',
    tabId: 'arrays',
    order: 7,
    title: 'OVERDRIVE MATRIX',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Speed-multiplier array with burst trigger',
    description:
      'A multi-dimensional speed multiplier matrix: [0.5, 1.0, 2.0, 1.0]. It iterates this array to modulate its target speed. At 2.0 speed, it also activates burst fire. You must survive the overdrive cycle.',
    hints: [
      'Cycle 3 is speed 2.0 + burst fire. Predict the tempo changes and prepare for the sudden rush.',
      'Each speed phase lasts exactly 5 seconds (second counter > 5 advances index). Phase sequence: 30 seconds total. Overdrive (index 2, mults[2]=2.0) is seconds 11-15. Retreat away from the enemy 5 seconds BEFORE overdrive begins.',
      'Phase timing: index 0 (slow, 0.5x) = seconds 1-5, index 1 (normal) = 6-10, index 2 (overdrive 2x + burst) = 11-15, index 3 (normal) = 16-20, then reset. Start your attack at second 16 when overdrive ends.',
    ],
    enemyScript: `IF NOT init THEN
  SET mults = [0.5, 1, 2, 1]
  SET tick = 0
  SET idx = 0
  SET init = 1
END
SET _SYS_SPEED_MULT = mults[idx]
IF mults[idx] == 2 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    BURST_FIRE
  ELSE
    SCAN
  END
ELSE
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  ELSE
    SCAN
  END
END
MOVE
SET tick = tick + 1
IF tick > 5 THEN
  SET tick = 0
  SET idx = idx + 1
  IF idx > 3 THEN
    SET idx = 0
  END
END`,
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'arr-08',
    tabId: 'arrays',
    order: 8,
    title: 'TWIN ARRAYS',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Parallel arrays: orbit radius + shot count',
    description:
      'It cross-references two arrays: one for orbit radii [80, -100, 150, -80] and one for burst counts [1, 2, 1, 3]. Positive radius means clockwise, negative means counter-clockwise. Parallel data structures driving complex movement and attack.',
    hints: [
      'Index 3 has radius -80 (tight counter-clockwise orbit) and fires 3 shots. Break line of sight when it tightens the circle.',
      'Index 1 has radius -100 (wide CCW orbit) and fires 2 shots. Index 2 has radius 150 (wide CW orbit) and fires 1 shot — this is the lightest burst. Time your heavy attack during index 2.',
      'Each index phase lasts counts[idx] shots before advancing. Total shots before cycling: 1+2+1+3 = 7. After the 7th shot (index 3 done), a movement second resets to index 0. Attack during that reset second and during index 2 (1 shot only).',
    ],
    enemyScript: `IF NOT init THEN
  SET radii = [80, -100, 150, -80]
  SET counts = [1, 2, 1, 3]
  SET idx = 0
  SET shots = 0
  SET init = 1
END
IF shots < counts[idx] THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET _SYS_ORBIT_X = NEAREST_VISIBLE_X
    SET _SYS_ORBIT_Y = NEAREST_VISIBLE_Y
    SET _SYS_ORBIT_R = radii[idx]
    SET _SYS_FACE_X = NEAREST_VISIBLE_X
    SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  ELSE
    SCAN
  END
  MOVE
  SET shots = shots + 1
ELSE
  SET shots = 0
  SET idx = idx + 1
  IF idx > 3 THEN
    SET idx = 0
  END
  MOVE RIGHT
END`,
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'arr-09',
    tabId: 'arrays',
    order: 9,
    title: 'RING BUFFER',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Circular buffer distance sliding window analysis',
    description:
      'It stores your last 5 detected distances in a circular buffer array. It computes the average. If the average is decreasing (you are approaching), it reverses defense mode and orbits outwards. If you are fleeing, it speeds up to chase. A sliding-window temporal analysis algorithm.',
    hints: [
      'It calculates average distance over time. Approach erratically to corrupt its ring buffer and prevent it from adopting an optimal combat stance.',
      'The buffer fills over the first 5 seconds. During fill (filled < 5), it uses standard fire. Only after second 5 does it start orbit-switching. Exploit this early window: rush it in the first 5 seconds for maximum damage while it is in simple mode.',
      'After the buffer fills: maintain a constant distance (prev_avg == avg). It will neither BURST orbit outward nor speed-chase. Hold a steady 200-bot range. Use: IF distance > 220 THEN MOVE ELSE IF distance < 180 THEN BACKUP END and FIRE each tick.',
    ],
    enemyScript: `IF NOT init THEN
  SET buf = [0, 0, 0, 0, 0]
  SET head = 0
  SET filled = 0
  SET prev_avg = 0
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET buf[head] = distance
  SET head = head + 1
  IF head > 4 THEN
    SET head = 0
  END
  IF filled < 5 THEN
    SET filled = filled + 1
  END

  SET sum = buf[0] + buf[1] + buf[2] + buf[3] + buf[4]
  SET avg = sum / 5

  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  IF filled == 5 THEN
    IF avg < prev_avg THEN
      SET _SYS_ORBIT_X = NEAREST_VISIBLE_X
      SET _SYS_ORBIT_Y = NEAREST_VISIBLE_Y
      SET _SYS_ORBIT_R = -120
      SET _SYS_SPEED_MULT = 1.5
      BURST_FIRE
    ELSE
      SET _SYS_ORBIT_R = 0
      SET _SYS_SPEED_MULT = 2
      FIRE
    END
  ELSE
    SET _SYS_ORBIT_R = 0
    FIRE
  END
  SET prev_avg = avg
  MOVE
ELSE
  SCAN
  MOVE RIGHT
END`,
    maxTicks: 1500,
    enemyHealth: 150,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
  {
    id: 'arr-10',
    tabId: 'arrays',
    order: 10,
    title: 'ARRAY OVERLORD',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'RAYCAST line-of-sight array filtering with PUSH/POP',
    description:
      'It uses `GET_ALL_VISIBLE_ENEMIES` and constructs an array of threats. It then iterates the array, applies RAYCAST to check for line-of-sight on each, and caches valid targets into a secondary array. It then pops from this target array to unleash a relentless barrage while strafing dynamically. O(N) array filtering in real-time.',
    hints: [
      'It explicitly uses RAYCAST to filter out blocked targets. Hide behind obstacles; if the raycast hits the wall first, it removes you from its target array and ignores you.',
      'RAYCAST returns the hit distance along a relative angle. If losHit < e[0] (your distance), the wall blocks you. Position yourself so an obstacle is between you and the enemy — you will be removed from its target array entirely.',
      'The PUSH/POP pattern: targets array fills during the WHILE loop, then it pops one target per tick. If the array empties, it falls back to SCAN/MOVE RIGHT. Exploit the scan phase: FIRE while it scans. Use obstacles to stay out of its RAYCAST for as long as possible.',
    ],
    enemyScript: `IF NOT init THEN
  SET init = 1
END
SET targets = []
SET enemies = GET_ALL_VISIBLE_ENEMIES()
SET len = LENGTH(enemies)
IF len > 0 THEN
  SET i = 0
  WHILE i < len DO
    SET e = enemies[i]
    SET absAim = ATAN2(e[2] - POSITION_Y, e[1] - POSITION_X)
    SET relAim = absAim - rotation
    SET losHit = RAYCAST(relAim)
    IF losHit >= e[0] THEN
      SET tmp = PUSH(targets, e)
    END
    SET i = i + 1
  END
END

SET tLen = LENGTH(targets)
IF tLen > 0 THEN
  SET focus = POP(targets)
  SET _SYS_FACE_X = focus[1]
  SET _SYS_FACE_Y = focus[2]
  SET rotation = ATAN2(focus[2] - POSITION_Y, focus[1] - POSITION_X)
  SET _SYS_STRAFE = 1
  BURST_FIRE
  MOVE
ELSE
  SCAN
  MOVE RIGHT
END`,
    maxTicks: 1500,
    enemyHealth: 180,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
];
