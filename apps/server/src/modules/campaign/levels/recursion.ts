import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const RECURSION_LEVELS: CampaignLevel[] = [
  {
    id: 'rec-01',
    tabId: 'recursion',
    order: 1,
    title: 'ECHO PULSE',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    description:
      'A simple repeat: scan, fire if found, scan again. The same pattern nested within itself — a flat recursion. Predictable because it never changes depth.',
    hint: 'It scans twice and fires once per detection. Two dodge windows per cycle.',
    enemyScript: `IF VISIBLE_ENEMY_COUNT > 0 THEN
  FIRE
END
MOVE RIGHT`,
  },
  {
    id: 'rec-02',
    tabId: 'recursion',
    order: 2,
    title: 'DOUBLE ECHO',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    description:
      'It runs its scan-fire routine twice. Each run has a scan and a double fire. Like calling the same function twice — identical behavior, repeated execution.',
    hint: 'Four shots total, perfectly spaced. Strike between the two "calls".',
    enemyScript: `IF NOT init THEN
  SET i = 0
  SET init = 1
END
IF i < 2 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    FIRE
  ELSE
    MOVE RIGHT
  END
  SET i = i + 1
ELSE
  SET i = 0
END`,
  },
  {
    id: 'rec-03',
    tabId: 'recursion',
    order: 3,
    title: 'DEPTH CHARGE',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'A depth counter starts at 3. Each level scans and fires depth-many times. Then decreases depth and repeats. 3+2+1 = 6 shots in a decaying cascade.',
    hint: 'The first burst is the heaviest (3 shots). Dodge early, attack later when depth is 1.',
    enemyScript: `IF NOT init THEN
  SET depth = 3
  SET s = 0
  SET init = 1
END
IF depth > 0 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    IF s < depth THEN
      FIRE
      SET s = s + 1
    ELSE
      SET s = 0
      SET depth = depth - 1
      MOVE RIGHT
    END
  ELSE
    SET depth = depth - 1
    MOVE RIGHT
  END
ELSE
  SET depth = 3
END`,
  },
  {
    id: 'rec-04',
    tabId: 'recursion',
    order: 4,
    title: 'MIRROR RECURSION',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'It moves right N times, fires, then moves left N times and fires again — a symmetric expansion. N starts at 1 and increases to 3. The pattern mirrors itself perfectly.',
    hint: 'Attack at the center point where it fires. It is always stationary during fire commands.',
    enemyScript: `IF NOT init THEN
  SET n = 1
  SET phase = 0
  SET s = 0
  SET init = 1
END
IF n < 4 THEN
  IF phase == 0 THEN
    IF s < n THEN
      MOVE RIGHT
      SET s = s + 1
    ELSE
      FIRE
      SET s = 0
      SET phase = 1
    END
  ELSE
    IF s < n THEN
      MOVE LEFT
      SET s = s + 1
    ELSE
      FIRE
      SET s = 0
      SET phase = 0
      SET n = n + 1
    END
  END
ELSE
  SET n = 1
END`,
  },
  {
    id: 'rec-05',
    tabId: 'recursion',
    order: 5,
    title: 'FIBONACCI STRIKER',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'It fires in a Fibonacci pattern: 1, 1, 2, 3, 5 shots per round. Each round builds on the last two. A mathematical crescendo where the final burst is devastating.',
    hint: 'Total: 12 shots. The last round fires 5 times. Kill it before round 5.',
    enemyScript: `IF NOT init THEN
  SET a = 1
  SET b = 1
  SET round = 0
  SET s = 0
  SET init = 1
END
IF round < 5 THEN
  IF s < a THEN
    FIRE
    SET s = s + 1
  ELSE
    SET temp = a + b
    SET a = b
    SET b = temp
    MOVE RIGHT
    SET round = round + 1
    SET s = 0
  END
ELSE
  SET a = 1
  SET b = 1
  SET round = 0
END`,
  },
  {
    id: 'rec-06',
    tabId: 'recursion',
    order: 6,
    title: 'TOWER OF POWER',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'Inspired by Tower of Hanoi: it processes 3 layers. Each layer requires moving, then firing, then returning. Deeper layers require more moves. Total moves: 7. A nested complexity puzzle.',
    hint: 'Layer 3 is the deepest and involves 3 moves each direction. Attack during layer 1 transitions.',
    enemyScript: `IF NOT init THEN
  SET layer = 1
  SET phase = 0
  SET m = 0
  SET init = 1
END
IF layer < 4 THEN
  IF phase == 0 THEN
    IF m < layer THEN
      MOVE RIGHT
      SET m = m + 1
    ELSE
      FIRE
      SET m = 0
      SET phase = 1
    END
  ELSE
    IF m < layer THEN
      MOVE LEFT
      SET m = m + 1
    ELSE
      SET m = 0
      SET phase = 0
      SET layer = layer + 1
    END
  END
ELSE
  SET layer = 1
END`,
  },
  {
    id: 'rec-07',
    tabId: 'recursion',
    order: 7,
    title: 'BINARY SPLITTER',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It divides its scan range by 2 each iteration. Starting with range 8, then 4, then 2, then 1. At each level it scans and fires proportionally. A binary search of destruction.',
    hint: 'The narrowing range means its accuracy increases each level. Dodge early, then retaliate at range 1.',
    enemyScript: `IF NOT init THEN
  SET range = 8
  SET s = 0
  SET init = 1
END
IF range > 0 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    IF s < range THEN
      FIRE
      SET s = s + 1
    ELSE
      SET s = 0
      SET range = range - 2
    END
  ELSE
    MOVE RIGHT
    SET range = range - 2
  END
ELSE
  SET range = 8
END`,
  },
  {
    id: 'rec-08',
    tabId: 'recursion',
    order: 8,
    title: 'FRACTAL STORM',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'A fractal-like pattern: outer loop runs 3 times, inner 2 times, innermost 2 times. Each innermost fires once. 12 total shots in a fractal tree of combat. Self-similar at every scale.',
    hint: 'Strikes are evenly distributed. There are no safe gaps — you must outpace its DPS with your own.',
    enemyScript: `IF NOT init THEN
  SET tick = 0
  SET init = 1
END
SET phase = tick % 3
IF phase == 0 THEN
  FIRE
ELSE
  IF phase == 1 THEN
    MOVE RIGHT
  ELSE
    MOVE LEFT
  END
END
SET tick = tick + 1`,
  },
  {
    id: 'rec-09',
    tabId: 'recursion',
    order: 9,
    title: 'CALL STACK OVERLOAD',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'It simulates a call stack using nested loops and a depth counter. At depth 4, it fires. As it unwinds, it fires at each return level. A recursive descent that explodes on the way back up. 4 shots down, 4 shots up.',
    hint: 'Total: ~8 shots in two phases. The descent is pure movement. The ascent is pure fire. Attack during descent.',
    enemyScript: `IF NOT init THEN
  SET depth = 0
  SET phase = 0
  SET init = 1
END
IF phase == 0 THEN
  IF depth < 4 THEN
    MOVE RIGHT
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      FIRE
    END
    SET depth = depth + 1
  ELSE
    SET phase = 1
  END
ELSE
  IF depth > 0 THEN
    FIRE
    MOVE LEFT
    SET depth = depth - 1
  ELSE
    SET phase = 0
  END
END`,
  },
  {
    id: 'rec-10',
    tabId: 'recursion',
    order: 10,
    title: 'OMEGA UNWIND',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'The ultimate recursive adversary. It builds a counter to 5, scanning at each level. Then it unwinds: for every positive scan in its history, it fires 2 shots. Maximum payload: 10 shots. A recursion that remembers everything.',
    hint: 'It records 5 scans then acts on them all at once. Minimize scan detections during the build-up phase to reduce the unwinding burst.',
    enemyScript: `IF NOT init THEN
  SET results = [0, 0, 0, 0, 0]
  SET d = 0
  SET phase = 0
  SET init = 1
END
IF phase == 0 THEN
  IF d < 5 THEN
    SET results[d] = VISIBLE_ENEMY_COUNT
    MOVE RIGHT
    SET d = d + 1
  ELSE
    SET phase = 1
    SET d = 4
  END
ELSE
  IF d >= 0 THEN
    IF results[d] > 0 THEN
      FIRE
    END
    MOVE LEFT
    SET d = d - 1
  ELSE
    SET phase = 0
    SET d = 0
  END
END`,
  },
];
