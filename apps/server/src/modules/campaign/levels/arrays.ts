import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const ARRAYS_LEVELS: CampaignLevel[] = [
  {
    id: 'arr-01', tabId: 'arrays', order: 1, title: 'ECHO LATTICE',
    difficulty: 'EASY', pointsReward: D.EASY,
    description: 'It processes a fixed sensor array of five readings. Fires once for every positive value. Rigid silicon logic — carved before the battle began.',
    hint: 'The array is static. Its fire pattern is [1,0,1,1,0] — predictable. Dodge the 3 fire slots.',
    enemyScript: `SET sensors = [1, 0, 1, 1, 0]\nSET i = 0\nWHILE i < 5\n  IF sensors[i] > 0\n    FIRE\n  END\n  SET i = i + 1\nEND\nMOVE LEFT`,
  },
  {
    id: 'arr-02', tabId: 'arrays', order: 2, title: 'SEQUENCE WALKER',
    difficulty: 'EASY', pointsReward: D.EASY,
    description: 'It reads a movement array: positive = move right, zero = fire. A choreographed dance of death encoded in a list of commands.',
    hint: 'The movement array is [1,1,0,1,0,0]. It fires at indices 2, 4, 5. Strike during the moves.',
    enemyScript: `SET cmds = [1, 1, 0, 1, 0, 0]\nSET i = 0\nWHILE i < 6\n  IF cmds[i] > 0\n    MOVE RIGHT\n  ELSE\n    FIRE\n  END\n  SET i = i + 1\nEND`,
  },
  {
    id: 'arr-03', tabId: 'arrays', order: 3, title: 'SWARM VECTOR',
    difficulty: 'MEDIUM', pointsReward: D.MEDIUM,
    description: 'It queries all visible enemies and processes the first two entries. Each confirmed target receives a double burst. A systematic predator that hunts by index.',
    hint: 'If it has multiple targets, it splits attention. Use that distraction window.',
    enemyScript: `SET enemies = GET_ALL_VISIBLE_ENEMIES()\nSET i = 0\nWHILE i < 2\n  IF enemies[i] != -1\n    FIRE\n    FIRE\n  END\n  SET i = i + 1\nEND\nMOVE RIGHT`,
  },
  {
    id: 'arr-04', tabId: 'arrays', order: 4, title: 'BURST TABLE',
    difficulty: 'MEDIUM', pointsReward: D.MEDIUM,
    description: 'Its fire pattern is encoded in an array: [2,1,3,1]. Each value is how many shots it fires per cycle. Four cycles, variable intensity. A rhythm you must decode.',
    hint: 'Cycle 3 fires 3 shots — the heaviest burst. Dodge during cycle 3, attack during cycles 2 and 4.',
    enemyScript: `SET bursts = [2, 1, 3, 1]\nSET cycle = 0\nWHILE cycle < 4\n  SET shots = 0\n  WHILE shots < bursts[cycle]\n    FIRE\n    SET shots = shots + 1\n  END\n  MOVE RIGHT\n  SET cycle = cycle + 1\nEND`,
  },
  {
    id: 'arr-05', tabId: 'arrays', order: 5, title: 'WAYPOINT RUNNER',
    difficulty: 'MEDIUM', pointsReward: D.MEDIUM,
    description: 'It follows a waypoint array: each value encodes how many steps right to take before firing. Waypoints: [1,2,1,3]. It will always fire at exact coordinates.',
    hint: 'Calculate the fire positions: step 1, step 3, step 4, step 7. Avoid those coordinates.',
    enemyScript: `SET waypoints = [1, 2, 1, 3]\nSET w = 0\nWHILE w < 4\n  SET steps = 0\n  WHILE steps < waypoints[w]\n    MOVE RIGHT\n    SET steps = steps + 1\n  END\n  FIRE\n  SET w = w + 1\nEND`,
  },
  {
    id: 'arr-06', tabId: 'arrays', order: 6, title: 'PRIORITY QUEUE',
    difficulty: 'HARD', pointsReward: D.HARD,
    description: 'It maintains a priority array: [3,1,2,0,2]. It processes highest first. Priority 3 = triple burst. Priority 2 = double. Priority 1 = single. Priority 0 = reposition. Threat triage.',
    hint: 'It processes [3,2,2,1,0] in sorted order. The heaviest fire comes first. Survive the opening salvo.',
    enemyScript: `SET prio = [3, 1, 2, 0, 2]\nSET i = 0\nWHILE i < 5\n  IF prio[i] > 2\n    FIRE\n    FIRE\n    FIRE\n  ELSE\n    IF prio[i] > 1\n      FIRE\n      FIRE\n    ELSE\n      IF prio[i] > 0\n        FIRE\n      ELSE\n        MOVE RIGHT\n      END\n    END\n  END\n  SET i = i + 1\nEND`,
  },
  {
    id: 'arr-07', tabId: 'arrays', order: 7, title: 'OVERDRIVE MATRIX',
    difficulty: 'HARD', pointsReward: D.HARD,
    description: 'A 9-cell fire matrix. Each non-zero cell triggers a RAYCAST. A confirmed ray triggers 3 shots. Empty cells trigger repositioning. It maps the arena before you blink.',
    hint: 'Use early cells (when it raycasts empty zones) to build attack position. By cell 6, it has you.',
    enemyScript: `SET matrix = [1, 0, 1, 0, 1, 0, 1, 1, 0]\nSET i = 0\nWHILE i < 9\n  IF matrix[i] > 0\n    SET ray = RAYCAST()\n    IF ray > 0\n      FIRE\n      FIRE\n      FIRE\n    END\n  ELSE\n    MOVE RIGHT\n  END\n  SET i = i + 1\nEND`,
  },
  {
    id: 'arr-08', tabId: 'arrays', order: 8, title: 'TWIN ARRAYS',
    difficulty: 'HARD', pointsReward: D.HARD,
    description: 'It cross-references two arrays: one for scan thresholds, one for fire counts. If scan exceeds the threshold at that index, it fires the corresponding count. Parallel data, parallel destruction.',
    hint: 'The threshold array has a 0 at index 2 — it always fires 3 shots there regardless of scan. Dodge index 2.',
    enemyScript: `SET thresh = [1, 1, 0, 1]\nSET shots = [2, 1, 3, 2]\nSET i = 0\nWHILE i < 4\n  SET x = SCAN\n  IF x > thresh[i]\n    SET s = 0\n    WHILE s < shots[i]\n      FIRE\n      SET s = s + 1\n    END\n  ELSE\n    MOVE RIGHT\n  END\n  SET i = i + 1\nEND`,
  },
  {
    id: 'arr-09', tabId: 'arrays', order: 9, title: 'RING BUFFER',
    difficulty: 'EXTREME', pointsReward: D.EXTREME,
    description: 'It stores the last 4 scan results in a circular buffer. When the buffer fills, it counts positives. If 3 or more are positive, maximum barrage. Under 3, cautious fire. It remembers your recent movements.',
    hint: 'Alternate between visible and hidden across the 4 scan cycles to keep its positive count under 3.',
    enemyScript: `SET buf = [0, 0, 0, 0]\nSET i = 0\nWHILE i < 4\n  SET buf[i] = SCAN\n  MOVE RIGHT\n  SET i = i + 1\nEND\nSET sum = buf[0] + buf[1] + buf[2] + buf[3]\nIF sum > 2\n  FIRE\n  FIRE\n  FIRE\n  FIRE\n  FIRE\nELSE\n  FIRE\n  MOVE LEFT\nEND`,
  },
  {
    id: 'arr-10', tabId: 'arrays', order: 10, title: 'ARRAY OVERLORD',
    difficulty: 'EXTREME', pointsReward: D.EXTREME,
    description: 'It constructs a dynamic fire plan from sensor data. Scans 5 positions, stores results, then iterates the results array firing proportional to each value. A full-spectrum area denial system.',
    hint: 'Its fire intensity scales with how many scans detect you. Minimize scan exposure — hide for 4 of 5 scans.',
    enemyScript: `SET results = [0, 0, 0, 0, 0]\nSET i = 0\nWHILE i < 5\n  SET results[i] = SCAN\n  MOVE RIGHT\n  SET i = i + 1\nEND\nSET i = 0\nWHILE i < 5\n  IF results[i] > 0\n    FIRE\n    FIRE\n    FIRE\n  ELSE\n    MOVE LEFT\n  END\n  SET i = i + 1\nEND`,
  },
];
