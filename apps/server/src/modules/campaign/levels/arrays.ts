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
      'It processes a fixed sensor array of five readings. Fires once for every positive value. Rigid silicon logic — carved before the battle began.',
    hint: 'The array is static. Its fire pattern is [1,0,1,1,0] — predictable. Dodge the 3 fire slots.',
    enemyScript: `IF NOT init THEN
  SET sensors = [1, 0, 1, 1, 0]
  SET i = 0
  SET init = 1
END
IF i < 5 THEN
  IF sensors[i] > 0 THEN
    FIRE
  ELSE
    MOVE RIGHT
  END
  SET i = i + 1
ELSE
  MOVE LEFT
  SET i = 0
END`,
  },
  {
    id: 'arr-02',
    tabId: 'arrays',
    order: 2,
    title: 'SEQUENCE WALKER',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    description:
      'It reads a movement array: positive = move right, zero = fire. A choreographed dance of death encoded in a list of commands.',
    hint: 'The movement array is [1,1,0,1,0,0]. It fires at indices 2, 4, 5. Strike during the moves.',
    enemyScript: `IF NOT init THEN
  SET cmds = [1, 1, 0, 1, 0, 0]
  SET i = 0
  SET init = 1
END
IF i < 6 THEN
  IF cmds[i] > 0 THEN
    MOVE RIGHT
  ELSE
    FIRE
  END
  SET i = i + 1
ELSE
  SET i = 0
END`,
  },
  {
    id: 'arr-03',
    tabId: 'arrays',
    order: 3,
    title: 'SWARM VECTOR',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'It queries all visible enemies and processes the first two entries. Each confirmed target receives a double burst. A systematic predator that hunts by index.',
    hint: 'If it has multiple targets, it splits attention. Use that distraction window.',
    enemyScript: `SET enemies = GET_ALL_VISIBLE_ENEMIES()
IF LENGTH(enemies) > 1 THEN
  FIRE
ELSE
  IF LENGTH(enemies) > 0 THEN
    FIRE
  END
END
MOVE RIGHT`,
  },
  {
    id: 'arr-04',
    tabId: 'arrays',
    order: 4,
    title: 'BURST TABLE',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'Its fire pattern is encoded in an array: [2,1,3,1]. Each value is how many shots it fires per cycle. Four cycles, variable intensity. A rhythm you must decode.',
    hint: 'Cycle 3 fires 3 shots — the heaviest burst. Dodge during cycle 3, attack during cycles 2 and 4.',
    enemyScript: `IF NOT init THEN
  SET bursts = [2, 1, 3, 1]
  SET cycle = 0
  SET shots = 0
  SET init = 1
END
IF cycle < 4 THEN
  IF shots < bursts[cycle] THEN
    FIRE
    SET shots = shots + 1
  ELSE
    MOVE RIGHT
    SET shots = 0
    SET cycle = cycle + 1
  END
ELSE
  SET cycle = 0
END`,
  },
  {
    id: 'arr-05',
    tabId: 'arrays',
    order: 5,
    title: 'WAYPOINT RUNNER',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'It follows a waypoint array: each value encodes how many steps right to take before firing. Waypoints: [1,2,1,3]. It will always fire at exact coordinates.',
    hint: 'Calculate the fire positions: step 1, step 3, step 4, step 7. Avoid those coordinates.',
    enemyScript: `IF NOT init THEN
  SET waypoints = [1, 2, 1, 3]
  SET w = 0
  SET steps = 0
  SET init = 1
END
IF w < 4 THEN
  IF steps < waypoints[w] THEN
    MOVE RIGHT
    SET steps = steps + 1
  ELSE
    FIRE
    SET steps = 0
    SET w = w + 1
  END
ELSE
  SET w = 0
END`,
  },
  {
    id: 'arr-06',
    tabId: 'arrays',
    order: 6,
    title: 'PRIORITY QUEUE',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It maintains a priority array: [3,1,2,0,2]. It processes highest first. Priority 3 = triple burst. Priority 2 = double. Priority 1 = single. Priority 0 = reposition. Threat triage.',
    hint: 'It processes [3,2,2,1,0] in sorted order. The heaviest fire comes first. Survive the opening salvo.',
    enemyScript: `IF NOT init THEN
  SET prio = [3, 1, 2, 0, 2]
  SET i = 0
  SET init = 1
END
IF i < 5 THEN
  IF prio[i] > 2 THEN
    FIRE
  ELSE
    IF prio[i] > 1 THEN
      FIRE
    ELSE
      IF prio[i] > 0 THEN
        FIRE
      ELSE
        MOVE RIGHT
      END
    END
  END
  SET i = i + 1
ELSE
  SET i = 0
END`,
  },
  {
    id: 'arr-07',
    tabId: 'arrays',
    order: 7,
    title: 'OVERDRIVE MATRIX',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'A 9-cell fire matrix. Each non-zero cell triggers a RAYCAST. A confirmed ray triggers 3 shots. Empty cells trigger repositioning. It maps the arena before you blink.',
    hint: 'Use early cells (when it raycasts empty zones) to build attack position. By cell 6, it has you.',
    enemyScript: `IF NOT init THEN
  SET matrix = [1, 0, 1, 0, 1, 0, 1, 1, 0]
  SET i = 0
  SET init = 1
END
IF i < 9 THEN
  IF matrix[i] > 0 THEN
    SET ray = RAYCAST(0)
    IF ray < 300 THEN
      FIRE
    END
  ELSE
    MOVE RIGHT
  END
  SET i = i + 1
ELSE
  SET i = 0
END`,
  },
  {
    id: 'arr-08',
    tabId: 'arrays',
    order: 8,
    title: 'TWIN ARRAYS',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It cross-references two arrays: one for scan thresholds, one for fire counts. If scan exceeds the threshold at that index, it fires the corresponding count. Parallel data, parallel destruction.',
    hint: 'The threshold array has a 0 at index 2 — it always fires 3 shots there regardless of scan. Dodge index 2.',
    enemyScript: `IF NOT init THEN
  SET thresh = [1, 1, 0, 1]
  SET target_shots = [2, 1, 3, 2]
  SET i = 0
  SET s = 0
  SET init = 1
END
IF i < 4 THEN
  IF VISIBLE_ENEMY_COUNT > thresh[i] THEN
    IF s < target_shots[i] THEN
      FIRE
      SET s = s + 1
    ELSE
      SET s = 0
      SET i = i + 1
    END
  ELSE
    MOVE RIGHT
    SET i = i + 1
  END
ELSE
  SET i = 0
END`,
  },
  {
    id: 'arr-09',
    tabId: 'arrays',
    order: 9,
    title: 'RING BUFFER',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'It stores the last 4 scan results in a circular buffer. When the buffer fills, it counts positives. If 3 or more are positive, maximum barrage. Under 3, cautious fire. It remembers your recent movements.',
    hint: 'Alternate between visible and hidden across the 4 scan cycles to keep its positive count under 3.',
    enemyScript: `IF NOT init THEN
  SET buf = [0, 0, 0, 0]
  SET i = 0
  SET init = 1
END
IF i < 4 THEN
  SET buf[i] = VISIBLE_ENEMY_COUNT
  MOVE RIGHT
  SET i = i + 1
ELSE
  SET sum = buf[0] + buf[1] + buf[2] + buf[3]
  IF sum > 2 THEN
    FIRE
  ELSE
    MOVE LEFT
  END
  SET i = 0
END`,
  },
  {
    id: 'arr-10',
    tabId: 'arrays',
    order: 10,
    title: 'ARRAY OVERLORD',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'It constructs a dynamic fire plan from sensor data. Scans 5 positions, stores results, then iterates the results array firing proportional to each value. A full-spectrum area denial system.',
    hint: 'Its fire intensity scales with how many scans detect you. Minimize scan exposure — hide for 4 of 5 scans.',
    enemyScript: `IF NOT init THEN
  SET results = [0, 0, 0, 0, 0]
  SET i = 0
  SET phase = 0
  SET init = 1
END
IF phase == 0 THEN
  IF i < 5 THEN
    SET results[i] = VISIBLE_ENEMY_COUNT
    MOVE RIGHT
    SET i = i + 1
  ELSE
    SET phase = 1
    SET i = 0
  END
ELSE
  IF i < 5 THEN
    IF results[i] > 0 THEN
      FIRE
    ELSE
      MOVE LEFT
    END
    SET i = i + 1
  ELSE
    SET phase = 0
    SET i = 0
  END
END`,
  },
];
