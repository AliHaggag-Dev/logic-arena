import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const GRAPH_THEORY_LEVELS: CampaignLevel[] = [
  {
    id: 'gfx-01',
    tabId: 'graph-theory',
    order: 1,
    title: 'NODE WALKER',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    description:
      'It visits 3 nodes in a line: move right, scan, fire if found. A simple linear traversal. No branches, no backtracking. Pure BFS on a chain.',
    hint: 'Three predictable scan points. Stay out of range at each one.',
    enemyScript: `SET node = 0\nWHILE node < 3\n  MOVE RIGHT\n  SET x = SCAN\n  IF x > 0\n    FIRE\n  END\n  SET node = node + 1\nEND`,
  },
  {
    id: 'gfx-02',
    tabId: 'graph-theory',
    order: 2,
    title: 'EDGE CRAWLER',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    description:
      'It traverses edges between 4 nodes. At each edge it fires once. After reaching the end, it reverses and fires again. A round-trip edge traversal.',
    hint: 'It fires at the end of each edge traversal. Dodge after each move.',
    enemyScript: `SET i = 0\nWHILE i < 4\n  MOVE RIGHT\n  FIRE\n  SET i = i + 1\nEND\nSET i = 0\nWHILE i < 4\n  MOVE LEFT\n  FIRE\n  SET i = i + 1\nEND`,
  },
  {
    id: 'gfx-03',
    tabId: 'graph-theory',
    order: 3,
    title: 'BREADTH SCANNER',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'BFS-style: it scans all neighbors (left, right, center) before moving to the next level. Level 1: 3 scans. Level 2: 3 more. If any scan in a level returns positive, it fires before proceeding.',
    hint: 'It scans in groups of 3. If you dodge all 3 scans in a level, it skips firing entirely.',
    enemyScript: `SET level = 0\nWHILE level < 2\n  SET found = 0\n  SET x = SCAN\n  IF x > 0\n    SET found = found + 1\n  END\n  MOVE RIGHT\n  SET x = SCAN\n  IF x > 0\n    SET found = found + 1\n  END\n  MOVE LEFT\n  IF found > 0\n    FIRE\n    FIRE\n  END\n  MOVE RIGHT\n  SET level = level + 1\nEND`,
  },
  {
    id: 'gfx-04',
    tabId: 'graph-theory',
    order: 4,
    title: 'DEPTH PROBE',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'DFS-style: it goes deep first — 4 moves right, scanning each step. Then backtracks completely. At each backtrack step, it fires once. A depth-first search that punishes on return.',
    hint: 'The descent is scan-only. The ascent is fire-only. Attack during descent.',
    enemyScript: `SET depth = 0\nWHILE depth < 4\n  MOVE RIGHT\n  SET x = SCAN\n  SET depth = depth + 1\nEND\nWHILE depth > 0\n  FIRE\n  MOVE LEFT\n  SET depth = depth - 1\nEND`,
  },
  {
    id: 'gfx-05',
    tabId: 'graph-theory',
    order: 5,
    title: 'CYCLE DETECTOR',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'It moves in a cycle: right-right-down(scan)-left-left-up(scan). If it detects you at any scan point in the cycle, it fires 3 times. It repeats the cycle twice. A closed-loop hunter.',
    hint: 'Two full cycles. If you stay outside the cycle path entirely, it wastes all its time patrolling.',
    enemyScript: `SET cycle = 0\nWHILE cycle < 2\n  MOVE RIGHT\n  MOVE RIGHT\n  SET x = SCAN\n  IF x > 0\n    FIRE\n    FIRE\n    FIRE\n  END\n  MOVE LEFT\n  MOVE LEFT\n  SET x = SCAN\n  IF x > 0\n    FIRE\n    FIRE\n  END\n  SET cycle = cycle + 1\nEND`,
  },
  {
    id: 'gfx-06',
    tabId: 'graph-theory',
    order: 6,
    title: 'SHORTEST PATH',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It calculates the shortest path to you: scan, determine direction, advance. Repeat 5 times. Each step fires if contact is made. A greedy pathfinding bot that always moves toward the threat.',
    hint: 'It always moves toward positive scans. Lead it away, then circle back to attack its flank.',
    enemyScript: `SET step = 0\nWHILE step < 5\n  SET x = SCAN\n  IF x > 0\n    FIRE\n    FIRE\n    MOVE RIGHT\n  ELSE\n    MOVE RIGHT\n    MOVE RIGHT\n  END\n  SET step = step + 1\nEND`,
  },
  {
    id: 'gfx-07',
    tabId: 'graph-theory',
    order: 7,
    title: 'SPANNING TREE',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It visits nodes in a tree pattern: root (scan+fire), left child (scan+fire), right child (scan+fire), then returns to root. 3 levels deep. A minimum spanning tree of coverage.',
    hint: 'It returns to root between branches. The root position is its weakness — it pauses there.',
    enemyScript: `SET level = 0\nWHILE level < 3\n  SET x = SCAN\n  IF x > 0\n    FIRE\n    FIRE\n  END\n  MOVE RIGHT\n  MOVE RIGHT\n  SET x = SCAN\n  IF x > 0\n    FIRE\n  END\n  MOVE LEFT\n  MOVE LEFT\n  MOVE LEFT\n  SET x = SCAN\n  IF x > 0\n    FIRE\n  END\n  MOVE RIGHT\n  SET level = level + 1\nEND`,
  },
  {
    id: 'gfx-08',
    tabId: 'graph-theory',
    order: 8,
    title: 'TOPOLOGICAL STRIKE',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It processes targets in topological order: dependencies first. It scans 4 positions, records results, then fires in reverse dependency order. Later scans have priority. A dependency-aware weapon.',
    hint: 'It fires based on the last scans first. Make yourself invisible in the later scan positions.',
    enemyScript: `SET order = [0, 0, 0, 0]\nSET i = 0\nWHILE i < 4\n  SET order[i] = SCAN\n  MOVE RIGHT\n  SET i = i + 1\nEND\nSET i = 3\nWHILE i >= 0\n  IF order[i] > 0\n    FIRE\n    FIRE\n  ELSE\n    MOVE LEFT\n  END\n  SET i = i - 1\nEND`,
  },
  {
    id: 'gfx-09',
    tabId: 'graph-theory',
    order: 9,
    title: 'DIJKSTRA DAEMON',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'It maintains a distance table and updates weights as it scans. Closest detected target gets maximum fire. Further targets get reduced fire. A weighted shortest-path assassination algorithm.',
    hint: 'Stay far from its initial position. Its fire weight decreases with iterations — survive early rounds.',
    enemyScript: `SET dist = [0, 0, 0, 0, 0]\nSET i = 0\nWHILE i < 5\n  SET dist[i] = SCAN\n  MOVE RIGHT\n  SET i = i + 1\nEND\nSET i = 0\nSET weight = 5\nWHILE i < 5\n  IF dist[i] > 0\n    SET s = 0\n    WHILE s < weight\n      FIRE\n      SET s = s + 1\n    END\n  END\n  SET weight = weight - 1\n  SET i = i + 1\nEND`,
  },
  {
    id: 'gfx-10',
    tabId: 'graph-theory',
    order: 10,
    title: 'NETWORK ORACLE',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'The Oracle maps the entire arena as a graph. It scans 6 nodes, stores connections in a results array, then processes the network: connected nodes trigger cascading fire, isolated nodes are skipped. Full graph awareness.',
    hint: 'It scans 6 positions then acts. If you are detected in 3+ nodes, it fires 9+ times. Stay in 2 or fewer scan zones.',
    enemyScript: `SET net = [0, 0, 0, 0, 0, 0]\nSET i = 0\nWHILE i < 6\n  SET net[i] = SCAN\n  MOVE RIGHT\n  SET i = i + 1\nEND\nSET total = net[0] + net[1] + net[2] + net[3] + net[4] + net[5]\nIF total > 3\n  SET s = 0\n  WHILE s < total\n    FIRE\n    FIRE\n    SET s = s + 1\n  END\nELSE\n  IF total > 1\n    FIRE\n    FIRE\n    FIRE\n  ELSE\n    FIRE\n    MOVE LEFT\n  END\nEND`,
  },
];
