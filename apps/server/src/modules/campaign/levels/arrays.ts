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
    description:
      'It processes a hardcoded movement array: [1, 0, -1, 0]. Positive means move forward, negative means backup, zero means stop and fire. A fixed sequence of physical actions you must decode.',
    hint: 'The pattern is move, shoot, backup, shoot. It repeats every 4 ticks. Exploit the backup phase.',
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
    description:
      'It reads from a strafe direction array: [1, 1, -1, -1]. It strafes right twice, then left twice, firing if you are visible. A choreographed lateral dance.',
    hint: 'The array dictates its strafe. Follow its lateral movement and anticipate the reversal.',
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
    description:
      'It fetches ALL visible enemies into an array and iterates over them. It targets the one with the lowest health. You must act as the lowest-health target to manipulate its aggro.',
    hint: 'Use \`GET_ALL_VISIBLE_ENEMIES()\` mechanics. It always attacks the weakest. If you are weak, it will lock onto you with a speed-boosted advance.',
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
    description:
      'Its fire pattern is encoded in an array: [2, 1, 3, 1]. Each value is the number of shots it fires per cycle. Four cycles, variable intensity. It locks FOV and strafes while bursting.',
    hint: 'Cycle 3 fires 3 shots — the heaviest burst. Dodge during cycle 3, attack during cycles 2 and 4.',
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
    description:
      'It follows a waypoint coordinates array: [[200, 200], [600, 200], [600, 400], [200, 400]]. It uses the exact rail system to navigate. Upon reaching each waypoint, it executes a burst fire.',
    hint: 'The coordinates form a rectangle. It stops and fires at the corners. Attack while it transits the edges.',
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
    description:
      'It processes targets by maintaining an internal priority array of threats based on distance. It loops through all visible enemies, sorting them into a pseudo-priority queue. Closest target receives an orbital strike.',
    hint: 'It always orbits and fires at the absolute closest target. Manipulate your distance to control its orbit center.',
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
    description:
      'A multi-dimensional speed multiplier matrix: [0.5, 1.0, 2.0, 1.0]. It iterates this array to modulate its target speed. At 2.0 speed, it also activates burst fire. You must survive the overdrive cycle.',
    hint: 'Cycle 3 is speed 2.0 + burst fire. Predict the tempo changes and prepare for the sudden rush.',
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
    description:
      'It cross-references two arrays: one for orbit radii [80, -100, 150, -80] and one for burst counts [1, 2, 1, 3]. Positive radius means clockwise, negative means counter-clockwise. Parallel data structures driving complex movement and attack.',
    hint: 'Index 3 has radius -80 (tight counter-clockwise orbit) and fires 3 shots. Break line of sight when it tightens the circle.',
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
    description:
      'It stores your last 5 detected distances in a circular buffer array. It computes the average. If the average is decreasing (you are approaching), it reverses polarity and orbits outwards. If you are fleeing, it speeds up to chase. A sliding-window temporal analysis algorithm.',
    hint: 'It calculates average distance over time. Approach erratically to corrupt its ring buffer and prevent it from adopting an optimal combat stance.',
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
    description:
      'It uses `GET_ALL_VISIBLE_ENEMIES` and constructs an array of threats. It then iterates the array, applies RAYCAST to check for line-of-sight on each, and caches valid targets into a secondary array. It then pops from this target array to unleash a relentless barrage while strafing dynamically. O(N) array filtering in real-time.',
    hint: 'It explicitly uses RAYCAST to filter out blocked targets. Hide behind obstacles; if the raycast hits the wall first, it removes you from its target array and ignores you.',
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
