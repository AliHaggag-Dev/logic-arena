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
      'It traverses a directed acyclic graph (DAG) of 3 nodes: A → B → C. At each node, it scans and fires. Pure Breadth-First Search on a linear chain. The graph is hardcoded into its memory.',
    hint: 'It bounces between nodes at (400, 300), (520, 180), and (640, 330). It only fires when it snaps to a node. Attack it while it moves between nodes.',
    enemyScript: `IF NOT init THEN
  SET nodes_x = [400, 520, 640]
  SET nodes_y = [300, 180, 330]
  SET i = 0
  SET dir = 1
  SET init = 1
END
SET _SYS_TARGET_X = nodes_x[i]
SET _SYS_TARGET_Y = nodes_y[i]
IF _SYS_AT_TARGET == 1 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  ELSE
    SCAN
  END
  SET i = i + dir
  IF i > 2 THEN
    SET dir = -1
    SET i = 1
  END
  IF i < 0 THEN
    SET dir = 1
    SET i = 1
  END
  SET _SYS_AT_TARGET = 0
ELSE
  MOVE
END`,
    maxTicks: 900,
    enemyHealth: 80,
    starThresholds: { three: 300, two: 600, one: 900 },
  },
  {
    id: 'gfx-02',
    tabId: 'graph-theory',
    order: 2,
    title: 'EDGE CRAWLER',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    description:
      'It patrols a cyclic graph representing a square: A → B → C → D → A. It fires continuously along the edges, but must pause at the nodes to re-orient. A Hamiltonian cycle execution.',
    hint: 'It is dangerous along the edges. It stops at the corners (nodes) to turn. Attack the corners.',
    enemyScript: `IF NOT init THEN
  SET nodes_x = [400, 520, 640, 560]
  SET nodes_y = [300, 180, 330, 450]
  SET i = 0
  SET init = 1
END
SET _SYS_TARGET_X = nodes_x[i]
SET _SYS_TARGET_Y = nodes_y[i]
IF _SYS_AT_TARGET == 1 THEN
  SET i = i + 1
  IF i > 3 THEN
    SET i = 0
  END
  SET _SYS_AT_TARGET = 0
  SCAN
ELSE
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  END
  MOVE
END`,
    maxTicks: 900,
    enemyHealth: 80,
    starThresholds: { three: 300, two: 600, one: 900 },
  },
  {
    id: 'gfx-03',
    tabId: 'graph-theory',
    order: 3,
    title: 'BREADTH SCANNER',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'It stands at the center node and sweeps its FOV to three branch nodes. If a branch node has line of sight to you, it takes that edge, fires a burst, and returns to center. A star graph topology.',
    hint: 'It always returns to the center node (400, 300) after investigating a branch. Place your fire on the center node.',
    enemyScript: `IF NOT init THEN
  SET state = "CENTER"
  SET tgtX = 400
  SET tgtY = 300
  SET init = 1
END
SET _SYS_TARGET_X = tgtX
SET _SYS_TARGET_Y = tgtY
IF _SYS_AT_TARGET == 1 THEN
  IF state == "CENTER" THEN
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      SET tgtX = NEAREST_VISIBLE_X
      SET tgtY = NEAREST_VISIBLE_Y
      SET state = "ATTACK"
    ELSE
      SCAN
    END
  ELSE
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
      BURST_FIRE
    END
    SET tgtX = 400
    SET tgtY = 300
    SET state = "CENTER"
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
    id: 'gfx-04',
    tabId: 'graph-theory',
    order: 4,
    title: 'DEPTH PROBE',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'It performs a Depth-First Search into your territory. It pushes target nodes into its path stack, walking deeper until it hits a wall (RAYCAST), then pops the stack to backtrack. Graph traversal constrained by arena physics.',
    hint: 'When it hits a wall or arena boundary, it is forced to backtrack along the exact same path. Trap it against a wall.',
    enemyScript: `IF NOT init THEN
  SET nodes_x = [400, 520, 640, 600]
  SET nodes_y = [300, 180, 330, 120]
  SET i = 0
  SET dir = 1
  SET init = 1
END
SET _SYS_TARGET_X = nodes_x[i]
SET _SYS_TARGET_Y = nodes_y[i]
IF _SYS_AT_TARGET == 1 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    BURST_FIRE
  ELSE
    SCAN
  END
  SET i = i + dir
  IF i > 3 THEN
    SET dir = -1
    SET i = 2
  END
  IF i < 0 THEN
    SET dir = 1
    SET i = 1
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
    id: 'gfx-05',
    tabId: 'graph-theory',
    order: 5,
    title: 'CYCLE DETECTOR',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'It traverses a figure-8 graph. Two cycles joined at a central node. The central node is the bottleneck. It fires rapidly while traversing the loops, but slows down at the intersection.',
    hint: 'The intersection is at (400, 300). It must pass through here repeatedly to switch loops. Wait at the bottleneck.',
    enemyScript: `IF NOT init THEN
  SET nodes_x = [400, 520, 640, 560, 440]
  SET nodes_y = [300, 180, 330, 450, 480]
  SET i = 0
  SET init = 1
END
SET _SYS_TARGET_X = nodes_x[i]
SET _SYS_TARGET_Y = nodes_y[i]
IF _SYS_AT_TARGET == 1 THEN
  SET i = i + 1
  IF i > 4 THEN
    SET i = 0
  END
  SET _SYS_AT_TARGET = 0
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    BURST_FIRE
  ELSE
    SCAN
  END
ELSE
  SET _SYS_SPEED_MULT = 1.5
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  END
  MOVE
END`,
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'gfx-06',
    tabId: 'graph-theory',
    order: 6,
    title: 'SHORTEST PATH',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'A greedy pathfinding bot. It constantly updates its target node to whichever of its 4 neighboring nodes is closest to YOU. It solves the shortest path to your location dynamically across an invisible grid.',
    hint: 'It moves on a rigid invisible grid (steps of 100). Because it is greedy, you can kite it into corners where its grid path is suboptimal.',
    enemyScript: `IF NOT init THEN
  SET cx = 400
  SET cy = 300
  SET init = 1
END
IF _SYS_AT_TARGET == 1 OR init == 1 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET dx = NEAREST_VISIBLE_X - cx
    SET dy = NEAREST_VISIBLE_Y - cy
    IF ABS(dx) > ABS(dy) THEN
      IF dx > 0 THEN
        SET cx = cx + 100
      ELSE
        SET cx = cx - 100
      END
    ELSE
      IF dy > 0 THEN
        SET cy = cy + 100
      ELSE
        SET cy = cy - 100
      END
    END
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    BURST_FIRE
  ELSE
    SCAN
  END
  SET _SYS_AT_TARGET = 0
END
SET _SYS_TARGET_X = cx
SET _SYS_TARGET_Y = cy
MOVE`,
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'gfx-07',
    tabId: 'graph-theory',
    order: 7,
    title: 'SPANNING TREE',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It creates a spanning tree to trap you. It traverses outer nodes to draw a perimeter. If you cross into the inner radius, it drops the tree traversal and collapses straight onto you with maximum speed. A structural enclosure.',
    hint: 'Do not stay in the center. Break out of the spanning tree perimeter before it finishes drawing the bounds.',
    enemyScript: `IF NOT init THEN
  SET nodes_x = [400, 520, 640, 560, 440, 600]
  SET nodes_y = [300, 180, 330, 450, 480, 120]
  SET i = 0
  SET dir = 1
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  IF distance < 250 THEN
    SET _SYS_TARGET_X = NEAREST_VISIBLE_X
    SET _SYS_TARGET_Y = NEAREST_VISIBLE_Y
    SET _SYS_SPEED_MULT = 2
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    BURST_FIRE
  ELSE
    SET _SYS_SPEED_MULT = 1
    SET _SYS_TARGET_X = nodes_x[i]
    SET _SYS_TARGET_Y = nodes_y[i]
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  END
ELSE
  SET _SYS_SPEED_MULT = 1
  SET _SYS_TARGET_X = nodes_x[i]
  SET _SYS_TARGET_Y = nodes_y[i]
  SCAN
END
IF _SYS_AT_TARGET == 1 THEN
  SET i = i + dir
  IF i > 5 THEN
    SET dir = -1
    SET i = 4
  END
  IF i < 0 THEN
    SET dir = 1
    SET i = 1
  END
  SET _SYS_AT_TARGET = 0
END
MOVE`,
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'gfx-08',
    tabId: 'graph-theory',
    order: 8,
    title: 'TOPOLOGICAL STRIKE',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It visits dependency nodes. Node 1 unlocks Node 2. Node 2 unlocks Node 3. It must visit them in order. As it unlocks higher nodes, its weapon power increases from single to burst to sustained barrage. A directed progression of power.',
    hint: 'Node 3 is its maximum power state. Ambush it at Node 1 (400, 300) before it scales up.',
    enemyScript: `IF NOT init THEN
  SET nodes_x = [400, 520, 640, 560, 440, 600]
  SET nodes_y = [300, 180, 330, 450, 480, 120]
  SET tier = 0
  SET init = 1
END
SET _SYS_TARGET_X = nodes_x[tier]
SET _SYS_TARGET_Y = nodes_y[tier]
IF _SYS_AT_TARGET == 1 THEN
  SET tier = tier + 1
  IF tier > 5 THEN
    SET tier = 0
  END
  SET _SYS_AT_TARGET = 0
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  IF tier < 2 THEN
    FIRE
  ELSE
    BURST_FIRE
  END
ELSE
  SCAN
END
MOVE`,
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'gfx-09',
    tabId: 'graph-theory',
    order: 9,
    title: 'DIJKSTRA DAEMON',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'It maintains a network of 5 nodes. It calculates edge weights based on your position: the node closest to you gets the highest weight. It always traverses the heaviest edge, orbiting that node while firing continuously until you move. It dynamically rewires its path based on your location.',
    hint: 'It anchors to whichever of its 5 nodes is closest to you. Lead it to a node near an obstacle, then use the obstacle as cover against its orbital fire.',
    enemyScript: `IF NOT init THEN
  SET nx = [200, 600, 400, 200, 600]
  SET ny = [150, 150, 300, 450, 450]
  SET bestNode = 2
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET bestDist = 9999
  SET i = 0
  WHILE i < 5 DO
    SET dx = NEAREST_VISIBLE_X - nx[i]
    SET dy = NEAREST_VISIBLE_Y - ny[i]
    SET d = SQRT(dx*dx + dy*dy)
    IF d < bestDist THEN
      SET bestDist = d
      SET bestNode = i
    END
    SET i = i + 1
  END
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  BURST_FIRE
ELSE
  SCAN
END
SET _SYS_TARGET_X = nx[bestNode]
SET _SYS_TARGET_Y = ny[bestNode]
IF _SYS_AT_TARGET == 1 THEN
  SET _SYS_ORBIT_X = nx[bestNode]
  SET _SYS_ORBIT_Y = ny[bestNode]
  SET _SYS_ORBIT_R = 80
ELSE
  SET _SYS_SPEED_MULT = 1.8
END
MOVE`,
    maxTicks: 1500,
    enemyHealth: 150,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
  {
    id: 'gfx-10',
    tabId: 'graph-theory',
    order: 10,
    title: 'NETWORK ORACLE',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'The Oracle is an adversarial graph processor. It maps the arena into a 3x3 grid. It assigns a "threat probability" to each grid cell based on your previous movements. It then jumps to the highest probability cell, locks it down with a tight orbit, and unleashes its maximum payload. If it guesses wrong, it immediately repositions. You cannot hide; you can only out-think its probability map.',
    hint: 'It predicts where you will be based on where you have been. Reverse your momentum. If you move left for 2 seconds, it will target the left grid. Snap back right.',
    enemyScript: `IF NOT init THEN
  SET grid = [0,0,0,0,0,0,0,0,0]
  SET cx = 400
  SET cy = 300
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET gx = FLOOR(NEAREST_VISIBLE_X / 266)
  SET gy = FLOOR(NEAREST_VISIBLE_Y / 200)
  SET idx = gy * 3 + gx
  IF idx >= 0 AND idx < 9 THEN
    SET grid[idx] = grid[idx] + 1
  END
  
  SET max = -1
  SET best = 4
  SET i = 0
  WHILE i < 9 DO
    IF grid[i] > max THEN
      SET max = grid[i]
      SET best = i
    END
    SET i = i + 1
  END
  
  SET cx = (best % 3) * 266 + 133
  SET cy = FLOOR(best / 3) * 200 + 100
  
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  BURST_FIRE
ELSE
  SCAN
END

SET _SYS_TARGET_X = cx
SET _SYS_TARGET_Y = cy
IF _SYS_AT_TARGET == 1 THEN
  SET _SYS_ORBIT_X = cx
  SET _SYS_ORBIT_Y = cy
  SET _SYS_ORBIT_R = -90
  SET _SYS_SPEED_MULT = 2
ELSE
  SET _SYS_SPEED_MULT = 1.5
END
MOVE`,
    maxTicks: 1500,
    enemyHealth: 180,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
];
