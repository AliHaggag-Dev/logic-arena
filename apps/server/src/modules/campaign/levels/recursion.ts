import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const RECURSION_LEVELS: CampaignLevel[] = [
  {
    id: 'rec-01', tabId: 'recursion', order: 1, title: 'ECHO PULSE',
    difficulty: 'EASY', pointsReward: D.EASY,
    description: 'A simple repeat: scan, fire if found, scan again. The same pattern nested within itself — a flat recursion. Predictable because it never changes depth.',
    hint: 'It scans twice and fires once per detection. Two dodge windows per cycle.',
    enemyScript: `SET x = SCAN\nIF x > 0\n  FIRE\nEND\nSET x = SCAN\nIF x > 0\n  FIRE\nEND\nMOVE RIGHT`,
  },
  {
    id: 'rec-02', tabId: 'recursion', order: 2, title: 'DOUBLE ECHO',
    difficulty: 'EASY', pointsReward: D.EASY,
    description: 'It runs its scan-fire routine twice. Each run has a scan and a double fire. Like calling the same function twice — identical behavior, repeated execution.',
    hint: 'Four shots total, perfectly spaced. Strike between the two "calls".',
    enemyScript: `SET i = 0\nWHILE i < 2\n  SET x = SCAN\n  IF x > 0\n    FIRE\n    FIRE\n  ELSE\n    MOVE RIGHT\n  END\n  SET i = i + 1\nEND`,
  },
  {
    id: 'rec-03', tabId: 'recursion', order: 3, title: 'DEPTH CHARGE',
    difficulty: 'MEDIUM', pointsReward: D.MEDIUM,
    description: 'A depth counter starts at 3. Each level scans and fires depth-many times. Then decreases depth and repeats. 3+2+1 = 6 shots in a decaying cascade.',
    hint: 'The first burst is the heaviest (3 shots). Dodge early, attack later when depth is 1.',
    enemyScript: `SET depth = 3\nWHILE depth > 0\n  SET x = SCAN\n  IF x > 0\n    SET s = 0\n    WHILE s < depth\n      FIRE\n      SET s = s + 1\n    END\n  END\n  SET depth = depth - 1\n  MOVE RIGHT\nEND`,
  },
  {
    id: 'rec-04', tabId: 'recursion', order: 4, title: 'MIRROR RECURSION',
    difficulty: 'MEDIUM', pointsReward: D.MEDIUM,
    description: 'It moves right N times, fires, then moves left N times and fires again — a symmetric expansion. N starts at 1 and increases to 3. The pattern mirrors itself perfectly.',
    hint: 'Attack at the center point where it fires. It is always stationary during fire commands.',
    enemyScript: `SET n = 1\nWHILE n < 4\n  SET s = 0\n  WHILE s < n\n    MOVE RIGHT\n    SET s = s + 1\n  END\n  FIRE\n  SET s = 0\n  WHILE s < n\n    MOVE LEFT\n    SET s = s + 1\n  END\n  FIRE\n  SET n = n + 1\nEND`,
  },
  {
    id: 'rec-05', tabId: 'recursion', order: 5, title: 'FIBONACCI STRIKER',
    difficulty: 'MEDIUM', pointsReward: D.MEDIUM,
    description: 'It fires in a Fibonacci pattern: 1, 1, 2, 3, 5 shots per round. Each round builds on the last two. A mathematical crescendo where the final burst is devastating.',
    hint: 'Total: 12 shots. The last round fires 5 times. Kill it before round 5.',
    enemyScript: `SET a = 1\nSET b = 1\nSET round = 0\nWHILE round < 5\n  SET s = 0\n  WHILE s < a\n    FIRE\n    SET s = s + 1\n  END\n  SET temp = a + b\n  SET a = b\n  SET b = temp\n  MOVE RIGHT\n  SET round = round + 1\nEND`,
  },
  {
    id: 'rec-06', tabId: 'recursion', order: 6, title: 'TOWER OF POWER',
    difficulty: 'HARD', pointsReward: D.HARD,
    description: 'Inspired by Tower of Hanoi: it processes 3 layers. Each layer requires moving, then firing, then returning. Deeper layers require more moves. Total moves: 7. A nested complexity puzzle.',
    hint: 'Layer 3 is the deepest and involves 3 moves each direction. Attack during layer 1 transitions.',
    enemyScript: `SET layer = 1\nWHILE layer < 4\n  SET m = 0\n  WHILE m < layer\n    MOVE RIGHT\n    SET m = m + 1\n  END\n  FIRE\n  FIRE\n  SET m = 0\n  WHILE m < layer\n    MOVE LEFT\n    SET m = m + 1\n  END\n  SET layer = layer + 1\nEND`,
  },
  {
    id: 'rec-07', tabId: 'recursion', order: 7, title: 'BINARY SPLITTER',
    difficulty: 'HARD', pointsReward: D.HARD,
    description: 'It divides its scan range by 2 each iteration. Starting with range 8, then 4, then 2, then 1. At each level it scans and fires proportionally. A binary search of destruction.',
    hint: 'The narrowing range means its accuracy increases each level. Dodge early, then retaliate at range 1.',
    enemyScript: `SET range = 8\nWHILE range > 0\n  SET x = SCAN\n  IF x > 0\n    SET s = 0\n    WHILE s < range\n      FIRE\n      SET s = s + 1\n    END\n  ELSE\n    MOVE RIGHT\n  END\n  SET range = range - 2\nEND`,
  },
  {
    id: 'rec-08', tabId: 'recursion', order: 8, title: 'FRACTAL STORM',
    difficulty: 'HARD', pointsReward: D.HARD,
    description: 'A fractal-like pattern: outer loop runs 3 times, inner 2 times, innermost 2 times. Each innermost fires once. 12 total shots in a fractal tree of combat. Self-similar at every scale.',
    hint: 'Strikes are evenly distributed. There are no safe gaps — you must outpace its DPS with your own.',
    enemyScript: `SET a = 0\nWHILE a < 3\n  SET b = 0\n  WHILE b < 2\n    SET c = 0\n    WHILE c < 2\n      FIRE\n      SET c = c + 1\n    END\n    MOVE RIGHT\n    SET b = b + 1\n  END\n  MOVE LEFT\n  SET a = a + 1\nEND`,
  },
  {
    id: 'rec-09', tabId: 'recursion', order: 9, title: 'CALL STACK OVERLOAD',
    difficulty: 'EXTREME', pointsReward: D.EXTREME,
    description: 'It simulates a call stack using nested loops and a depth counter. At depth 4, it fires. As it unwinds, it fires at each return level. A recursive descent that explodes on the way back up. 4 shots down, 4 shots up.',
    hint: 'Total: ~8 shots in two phases. The descent is pure movement. The ascent is pure fire. Attack during descent.',
    enemyScript: `SET depth = 0\nWHILE depth < 4\n  MOVE RIGHT\n  SET x = SCAN\n  IF x > 0\n    FIRE\n  END\n  SET depth = depth + 1\nEND\nWHILE depth > 0\n  FIRE\n  MOVE LEFT\n  SET depth = depth - 1\nEND`,
  },
  {
    id: 'rec-10', tabId: 'recursion', order: 10, title: 'OMEGA UNWIND',
    difficulty: 'EXTREME', pointsReward: D.EXTREME,
    description: 'The ultimate recursive adversary. It builds a counter to 5, scanning at each level. Then it unwinds: for every positive scan in its history, it fires 2 shots. Maximum payload: 10 shots. A recursion that remembers everything.',
    hint: 'It records 5 scans then acts on them all at once. Minimize scan detections during the build-up phase to reduce the unwinding burst.',
    enemyScript: `SET results = [0, 0, 0, 0, 0]\nSET d = 0\nWHILE d < 5\n  SET results[d] = SCAN\n  MOVE RIGHT\n  SET d = d + 1\nEND\nSET d = 4\nWHILE d >= 0\n  IF results[d] > 0\n    FIRE\n    FIRE\n  END\n  MOVE LEFT\n  SET d = d - 1\nEND`,
  },
];
