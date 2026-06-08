import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const ARRAYS_LEVELS: CampaignLevel[] = [
  {
    id: 'arr-01',
    tabId: 'arrays',
    order: 1,
    title: 'Grid Pattern',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'Using a fixed sequence',
    description:
      'This enemy moves in a fixed sequence: move forward, stop and shoot, back up, stop and shoot. It repeats this pattern forever. Learn the pattern to beat it.',
    hints: [
      'The pattern repeats every 4 seconds. The safest time to attack is when it backs up.',
      'On second 3, it backs up without shooting. This creates distance and gives you a perfect chance to strike.',
      'Approach during the backup tick. Your script: SET t = t + 1, track t%4. When t%4 == 2, advance and FIRE. When t%4 == 3, strafe to dodge.',
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
    title: 'Step by Step',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'Following a movement pattern',
    description:
      'This bot dances sideways: two steps right, then two steps left. It shoots constantly while moving. Follow its dance steps to avoid getting hit.',
    hints: [
      'It moves right twice, then left twice. Anticipate when it will change direction.',
      'It shoots every second it sees you. Move in the SAME direction as the enemy to throw off its aim.',
      'When it moves right, you move right. When it moves left, you move left. Use: SET _SYS_STRAFE = -1 to move parallel to it.',
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
    title: 'Swarm Attack',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Finding the weakest target',
    description:
      'This enemy scans all visible targets and always attacks the one with the lowest health. Keep your health high so it focuses on something else!',
    hints: [
      'It always attacks the weakest target. If you have low health, it will chase you with extra speed.',
      'Keep your HP high by dodging well. Let it lock onto another target if there are any.',
      'Pattern: avoid taking damage. Move sideways to dodge its advance. Use BACKUP to maintain safe distance from its fast chase.',
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
    title: 'Burst Fire',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Variable burst shots',
    description:
      'Its shooting pattern changes every round: 2 shots, then 1 shot, then 3 shots, then 1 shot. Learn the rhythm and hide during the heavy bursts.',
    hints: [
      'The third round fires 3 shots — the heaviest burst. Dodge during this round, and attack during the lighter rounds.',
      'Rounds 2 and 4 only fire 1 shot. These are your best attack windows.',
      'Attack during the 1-shot cycles. Each cycle has a movement second before the next begins — use that transition.',
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
    title: 'The Runner',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Following exact coordinates',
    description:
      'This enemy runs around a rectangular path on the map. It only stops to shoot a heavy burst when it reaches a corner. Attack while it is running between corners.',
    hints: [
      'The four corners are its shooting spots. Attack while it is running the edges between corners.',
      'Stand in the center of the map (400, 300). You will be perfectly safe from its corner bursts.',
      'Best attack position: stay near (400,300). Use: IF VISIBLE_ENEMY_COUNT > 0 AND distance < 350 THEN FIRE END, MOVE.',
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
    title: 'Priority Target',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Finding the closest target',
    description:
      'This enemy scans all targets and always locks onto the closest one. It will circle around its closest target and fire heavily. Control your distance to survive.',
    hints: [
      'It always orbits and fires at the absolute closest target. Manipulate your distance to control its orbit.',
      'Its orbit radius is fixed at 100 units. Move sideways to step off its path and shoot at its known position.',
      'Move in a large circle to break its orbit. Use: SET _SYS_ORBIT_R = 200 to maintain a counter-orbit.',
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
    title: 'Overdrive',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Speed changes',
    description:
      'This bot cycles through different speeds: slow, normal, double speed, then normal again. When it reaches double speed, it unleashes a deadly burst attack. Survive the overdrive!',
    hints: [
      'The third speed phase is double speed + burst fire. Predict the tempo changes and prepare for the sudden rush.',
      'Each speed phase lasts exactly 5 seconds. Retreat away from the enemy BEFORE the fast phase begins.',
      'Attack during the slow and normal phases. Start your heavy attack immediately after the overdrive ends.',
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
    title: 'Twin Blades',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Complex movement and attack patterns',
    description:
      'This enemy uses two patterns at once: one controls how it circles you, and the other controls how many shots it fires. The patterns change together, creating a deadly dance.',
    hints: [
      'One of its phases involves a tight circle and 3 shots. Break line of sight when it tightens the circle.',
      'Its widest circle only fires 1 shot. This is the lightest burst. Time your heavy attack during this phase.',
      'After it finishes all its patterns, it stops for 1 second to reset. Attack during that reset second.',
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
    title: 'Circling Prey',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Analyzing player movement',
    description:
      'This smart enemy tracks your movement over time. If it sees you getting closer, it will back away and shoot. If you run away, it will speed up and chase you.',
    hints: [
      'It calculates if you are approaching or fleeing. Move erratically to confuse its tracking.',
      'It needs 5 seconds to analyze your movement. Rush it in the first 5 seconds for maximum damage while it is still confused.',
      'After 5 seconds: maintain a constant distance so it doesn\'t chase or run. Hold a steady 200 range.',
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
    title: 'Swarm Commander',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Advanced line-of-sight checking',
    description:
      'This ultimate boss checks for walls! It scans all targets and removes anyone hiding behind a wall from its list. Then it unloads a relentless barrage on whoever is left in the open.',
    hints: [
      'It explicitly checks for walls. Hide behind obstacles; if the boss hits the wall first, it ignores you completely.',
      'Position yourself so an obstacle is between you and the enemy — you will be safe from its attacks.',
      'Fire while it scans. Use obstacles to stay hidden for as long as possible while it attacks others.',
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
