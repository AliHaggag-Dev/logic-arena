import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const RECURSION_LEVELS: CampaignLevel[] = [
  {
    id: 'rec-01',
    tabId: 'recursion',
    order: 1,
    title: 'Echoes',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'Rhythm and timing',
    description:
      'This bot attacks in a two-step rhythm: first it moves forward, then it shoots a burst. It repeats this forward-and-shoot pattern endlessly.',
    hints: [
      'It only shoots on the second step of its rhythm. You can advance safely on its movement step.',
      'The pattern is exactly one safe second followed by one shooting second.',
      'Time your approach! Move closer during the safe second, and dodge or back up when it shoots.',
    ],
    enemyScript: `IF NOT init THEN
  SET depth = 1
  SET ddir = 1
  SET init = 1
END
IF depth == 1 THEN
  MOVE RIGHT
END
IF depth == 2 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    BURST_FIRE
  ELSE
    SCAN
  END
END
SET depth = depth + ddir
IF depth > 2 THEN
  SET depth = 1
  SET ddir = -1
END
IF depth < 1 THEN
  SET depth = 2
  SET ddir = 1
END`,
    maxTicks: 900,
    enemyHealth: 80,
    starThresholds: { three: 300, two: 600, one: 900 },
  },
  {
    id: 'rec-02',
    tabId: 'recursion',
    order: 2,
    title: 'Double Echo',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'Symmetric movement',
    description:
      'It moves left, moves right, and shoots twice! Then it moves right, moves left, and shoots twice again. A perfectly mirrored dance of destruction.',
    hints: [
      'It shoots twice in a row when it finishes its movement. The safe moments are when it is moving side to side.',
      'Full cycle: Move Left, Move Right, FIRE, FIRE. Then Move Right, Move Left.',
      'Use the movement seconds to advance and attack. Dodge wildly during the two consecutive fire seconds.',
    ],
    enemyScript: `IF NOT init THEN
  SET depth = 1
  SET ddir = 1
  SET init = 1
END
IF depth == 3 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  ELSE
    SCAN
  END
ELSE
  IF depth == 1 THEN
    MOVE LEFT
  ELSE
    MOVE RIGHT
  END
END
SET depth = depth + ddir
IF depth > 3 THEN
  SET depth = 3
  SET ddir = -1
END
IF depth < 1 THEN
  SET depth = 2
  SET ddir = 1
END`,
    maxTicks: 900,
    enemyHealth: 80,
    starThresholds: { three: 300, two: 600, one: 900 },
  },
  {
    id: 'rec-03',
    tabId: 'recursion',
    order: 3,
    title: 'Deep Dive',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Growing delays',
    description:
      'This enemy takes longer to charge up its attack every time. First it waits 2 seconds, then 3, then 4, up to 5 seconds before firing a massive burst!',
    hints: [
      'The time between shots grows as it charges deeper. Exploit the long waiting times.',
      'When it reaches its max charge (5 seconds), you have a huge window of 4 safe seconds to attack freely.',
      'Wait for the longest charge phase. After it fires, rush in and deal maximum damage during the long safe window.',
    ],
    enemyScript: `IF NOT init THEN
  SET depth = 1
  SET maxD = 2
  SET ddir = 1
  SET init = 1
END
IF depth == maxD THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    BURST_FIRE
  ELSE
    SCAN
  END
ELSE
  SET _SYS_STRAFE = ddir
  MOVE
END
SET depth = depth + ddir
IF depth > maxD THEN
  SET depth = maxD - 1
  SET ddir = -1
END
IF depth < 1 THEN
  SET depth = 2
  SET ddir = 1
  SET maxD = maxD + 1
  IF maxD > 5 THEN
    SET maxD = 2
  END
END`,
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'rec-04',
    tabId: 'recursion',
    order: 4,
    title: 'Mirrors',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Symmetric pausing',
    description:
      'It shoots 3 times while moving, pauses completely still for 1 second without shooting, then shoots 3 more times. That single pause is your only safe opening!',
    hints: [
      'It shoots continuously while moving. The only safe moment is when it stops completely.',
      'When it stops, it won\'t shoot. This is the ONE safe second per cycle. Attack during this exact tick.',
      'Count the shots: after 3 consecutive fire seconds, attack on the 4th second (the pause).',
    ],
    enemyScript: `IF NOT init THEN
  SET depth = 1
  SET ddir = 1
  SET init = 1
END
IF depth < 4 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  ELSE
    SCAN
  END
  SET _SYS_STRAFE = 1
  MOVE
ELSE
  SET _SYS_SPEED_MULT = 0
  MOVE
END
SET depth = depth + ddir
IF depth > 4 THEN
  SET depth = 3
  SET ddir = -1
END
IF depth < 1 THEN
  SET depth = 1
  SET ddir = 1
END`,
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'rec-05',
    tabId: 'recursion',
    order: 5,
    title: 'Golden Ratio',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Fibonacci timing',
    description:
      'Its attacks follow a famous mathematical sequence (Fibonacci). The gap between its shots gets larger: 1 second, then 1, then 2, then 3, then 5. The biggest gap is your best chance.',
    hints: [
      'The waiting time gets longer: 1, 1, 2, 3, 5 seconds between shots. Wait for the 3 and 5 second gaps to counterattack.',
      'The 5-second gap is your longest and best attack window. Attack aggressively during this time.',
      'Count the shots! After the 4th shot, you have exactly 5 seconds of safe movement. Attack hard, then retreat before the 5th shot.',
    ],
    enemyScript: `IF NOT init THEN
  SET n = 1
  SET a = 0
  SET b = 1
  SET step = 0
  SET init = 1
END
IF step < b THEN
  SET _SYS_STRAFE = -1
  MOVE
  SET step = step + 1
ELSE
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    BURST_FIRE
  ELSE
    SCAN
  END
  SET tmp = a + b
  SET a = b
  SET b = tmp
  SET n = n + 1
  SET step = 0
  IF n > 5 THEN
    SET n = 1
    SET a = 0
    SET b = 1
  END
END`,
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'rec-06',
    tabId: 'recursion',
    order: 6,
    title: 'The Tower',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Advance and retreat',
    description:
      'This enemy steps closer to you 3 times without shooting. On the 4th step, it unleashes a deadly burst, then slowly backs away. Run when it approaches, attack when it retreats.',
    hints: [
      'It only shoots when it is closest to you. Retreat as it approaches, attack as it backs away.',
      'When it backs up, it won\'t shoot. This is a clean retreat — chase it down and fire continuously.',
      'Pattern: it approaches (retreat!), it shoots (dodge!), it backs up (chase and attack!).',
    ],
    enemyScript: `IF NOT init THEN
  SET depth = 1
  SET ddir = 1
  SET init = 1
END
IF depth == 4 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET _SYS_FACE_X = NEAREST_VISIBLE_X
    SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    BURST_FIRE
  ELSE
    SCAN
  END
ELSE
  IF ddir == 1 THEN
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    END
    MOVE
  ELSE
    BACKUP
  END
END
SET depth = depth + ddir
IF depth > 4 THEN
  SET depth = 3
  SET ddir = -1
END
IF depth < 1 THEN
  SET depth = 1
  SET ddir = 1
END`,
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'rec-07',
    tabId: 'recursion',
    order: 7,
    title: 'Splitter',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Zig-zag strafing',
    description:
      'This bot zig-zags left and right while shooting continuously. First it strafes left for 2 seconds, then right for 2 seconds. A predictable zig-zag pattern.',
    hints: [
      'It alternates strict left and right movements while firing. Lead your shots to where it will be.',
      'Position yourself to exploit the predictable reversal — when it moves left, shoot right to hit it.',
      'Counter-tactic: mirror its movement. When it moves left, you move left. This makes you a harder target to hit.',
    ],
    enemyScript: `IF NOT init THEN
  SET stack = [1, 2, 1, 2]
  SET sp = 0
  SET init = 1
END
SET branch = stack[sp]
IF branch == 1 THEN
  SET _SYS_STRAFE = -1
ELSE
  SET _SYS_STRAFE = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  FIRE
ELSE
  SCAN
END
MOVE
SET sp = sp + 1
IF sp >= 4 THEN
  SET sp = 0
END`,
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'rec-08',
    tabId: 'recursion',
    order: 8,
    title: 'Fractal Storm',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Jagged orbit',
    description:
      'This boss circles you in a jagged pattern. It takes 3 large steps forward, then quickly steps backward once. The sudden backward step makes it hard to hit.',
    hints: [
      'Every 4th second it briefly reverses direction. Hold your fire during this erratic movement.',
      'The backward step is small and unpredictable. Fire during the 3 forward steps when its orbit is large and predictable.',
      'Stay near the center and fire at where it will be in 2-3 seconds, ignoring the quick backward jump.',
    ],
    enemyScript: `IF NOT init THEN
  SET step = 0
  SET init = 1
END
IF step < 3 THEN
  SET _SYS_ORBIT_R = 120
  SET _SYS_SPEED_MULT = 1.5
ELSE
  SET _SYS_ORBIT_R = -80
  SET _SYS_SPEED_MULT = 1.0
END
SET _SYS_ORBIT_X = 400
SET _SYS_ORBIT_Y = 300
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET _SYS_FACE_X = NEAREST_VISIBLE_X
  SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  FIRE
ELSE
  SCAN
END
MOVE
SET step = step + 1
IF step > 3 THEN
  SET step = 0
END`,
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'rec-09',
    tabId: 'recursion',
    order: 9,
    title: 'Overload',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Delayed ghost attacks',
    description:
      'This bot records exactly where you were for 5 seconds. Then, it stops moving and shoots at all 5 of your past locations at once! Never stand still.',
    hints: [
      'It records your ghost trail for 5 seconds, then shoots the trail. Keep moving so you aren\'t there when it shoots!',
      'When it stops to shoot, it is completely stationary. This is your chance to attack it.',
      'Strategy: run in one direction for 5 seconds. When it stops to shoot, dodge away from your trail and attack it.',
    ],
    enemyScript: `IF NOT init THEN
  SET histX = [0,0,0,0,0]
  SET histY = [0,0,0,0,0]
  SET depth = 0
  SET phase = "PUSH"
  SET init = 1
END
IF phase == "PUSH" THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET histX[depth] = NEAREST_VISIBLE_X
    SET histY[depth] = NEAREST_VISIBLE_Y
  END
  SET depth = depth + 1
  SET _SYS_STRAFE = 1
  MOVE
  IF depth >= 5 THEN
    SET phase = "POP"
    SET depth = 4
  END
ELSE
  SET tx = histX[depth]
  SET ty = histY[depth]
  SET _SYS_FACE_X = tx
  SET _SYS_FACE_Y = ty
  SET rotation = ATAN2(ty - POSITION_Y, tx - POSITION_X)
  BURST_FIRE
  SET _SYS_SPEED_MULT = 0
  MOVE
  SET depth = depth - 1
  IF depth < 0 THEN
    SET phase = "PUSH"
    SET depth = 0
  END
END`,
    maxTicks: 1500,
    enemyHealth: 150,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
  {
    id: 'rec-10',
    tabId: 'recursion',
    order: 10,
    title: 'Omega',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Cyclical chaos',
    description:
      'The ultimate chaotic boss! It slowly builds up speed and firepower until it goes completely berserk. After reaching max chaos, it tires out and resets to a slow baseline. Strike when it resets!',
    hints: [
      'The chaos moves in a 12-second cycle. It reaches a peak intensity, then resets to a slow, weak state. Strike during the reset.',
      'The cycle: 4 seconds slow, 4 seconds medium, 4 seconds fast + heavy burst. Then it resets.',
      'Attack plan: heavily engage during the first 4 seconds (slowest). Dodge for your life during the last 4 seconds (fastest). Repeat.',
    ],
    enemyScript: `IF NOT init THEN
  SET m = 0
  SET n = 0
  SET init = 1
END
SET _SYS_SPEED_MULT = 1 + (n * 0.5)
IF m == 2 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET _SYS_FACE_X = NEAREST_VISIBLE_X
    SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    BURST_FIRE
  END
ELSE
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  ELSE
    SCAN
  END
END
SET _SYS_ORBIT_X = 400
SET _SYS_ORBIT_Y = 300
SET _SYS_ORBIT_R = 100 + (m * 20)
MOVE

SET n = n + 1
IF n > 3 THEN
  SET n = 0
  SET m = m + 1
  IF m > 2 THEN
    SET m = 0
  END
END`,
    maxTicks: 1500,
    enemyHealth: 180,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
];
