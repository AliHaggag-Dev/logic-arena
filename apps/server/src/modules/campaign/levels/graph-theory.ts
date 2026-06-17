import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const GRAPH_THEORY_LEVELS: CampaignLevel[] = [
  {
    id: 'gfx-01',
    tabId: 'graph-theory',
    order: 1,
    title: 'Node Walker',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'Moving point to point',
    description:
      'This enemy moves back and forth between 3 fixed points on the map. It only stops to shoot when it reaches one of these points. Attack while it is moving!',
    hints: [
      'It moves between (400, 300), (520, 180), and (640, 330). It only fires when it stops at a point.',
      'The movement between points is your safe window — it cannot shoot while moving.',
      'Stay near the middle and fire at it while it travels between its stopping points.',
    ],
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
    title: 'The Crawler',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'Patrolling a square',
    description:
      'This bot patrols in a square shape. It shoots continuously while moving along the edges of the square, but it stops at the corners to look around without shooting.',
    hints: [
      'It is very dangerous while moving. Wait for it to stop at the corners.',
      'At each corner, it pauses to scan the area without firing. This is your chance to attack.',
      'Wait near a corner. When it arrives, shoot it while it scans, then move away before it starts moving again.',
    ],
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
    title: 'Scanner',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Returning to center',
    description:
      'This enemy stays in the center of the map. If it sees you, it rushes out to attack you, then immediately returns to the center. Use the center as your target practice!',
    hints: [
      'It always returns to the center (400, 300). Keep your aim focused there.',
      'If you hide, it will stay in the center. Attack it from a distance while it waits.',
      'When it rushes you, dodge its burst fire by backing up, then shoot it as it returns to the center.',
    ],
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
    title: 'Deep Probe',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Walking into walls',
    description:
      'This bot walks in a straight line until it hits a wall, then turns around and walks back along the exact same path. Trap it in its predictable movement.',
    hints: [
      'It is forced to backtrack along its exact path when it hits the edge of the map.',
      'It walks forward, hits the wall, fires a burst, and walks back. Stay in the middle of its path.',
      'Camp near the middle of its route. It will pass by you twice: once going forward, and once coming back.',
    ],
    enemyScript: `IF NOT init THEN
  SET nodes_x = [60, 740]
  SET nodes_y = [100, 100]
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
  IF i > 1 THEN
    SET dir = -1
    SET i = 0
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
    title: 'Cyclic',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Figure-8 movement',
    description:
      'This enemy patrols in a figure-8 shape. It moves very fast along the loops, but slows down when it crosses the center intersection. Ambush it at the center!',
    hints: [
      'The intersection is at the center of the map (400, 300). It must pass through here repeatedly.',
      'It moves fast on the edges but slows down in the middle. Wait near the center, but stay out of its immediate range.',
      'Every time it completes a loop, it returns to the center. Attack from a safe distance when it arrives.',
    ],
    enemyScript: `IF NOT init THEN
  SET nodes_x = [500, 600, 400, 500, 400, 600]
  SET nodes_y = [300, 180, 180, 300, 420, 420]
  SET i = 0
  SET init = 1
END
SET _SYS_TARGET_X = nodes_x[i]
SET _SYS_TARGET_Y = nodes_y[i]
IF _SYS_AT_TARGET == 1 THEN
  SET i = i + 1
  IF i > 5 THEN
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
  IF i == 0 OR i == 3 THEN
    SET _SYS_SPEED_MULT = 0.6
  ELSE
    SET _SYS_SPEED_MULT = 1.5
  END
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
    title: 'Quickest Route',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Chasing in a grid',
    description:
      'This bot chases you by taking the shortest possible path on an invisible grid. Because it moves in stiff, straight lines, you can easily outmaneuver it.',
    hints: [
      'It moves in strict straight lines (up/down or left/right). Move diagonally to outrun it.',
      'It shoots a heavy burst every time it takes a step on its grid. Keep moving to dodge.',
      'Kite strategy: lead it into a corner. When it steps toward you, move sideways to dodge its burst.',
    ],
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
    title: 'The Tree',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Drawing a perimeter',
    description:
      'This enemy draws a large circle around the map to trap you. If you get too close to it, it breaks its circle and charges straight at you at maximum speed!',
    hints: [
      'Do not get too close! Stay far away so it continues its slow patrol around the edge.',
      'If you stay far away, it only fires weak single shots. If you get close, it rushes you with bursts.',
      'Stay far away and move parallel to it. Avoid the center of the arena completely.',
    ],
    enemyScript: `IF NOT init THEN
  SET nodes_x = [735, 668, 533, 465, 533, 668]
  SET nodes_y = [300, 417, 417, 300, 183, 183]
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
    title: 'Surgical Strike',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Powering up over time',
    description:
      'This bot visits different points on the map to power up. With every point it visits, its weapons get stronger. Destroy it quickly before it reaches maximum power!',
    hints: [
      'It starts weak, firing single shots. By its third stop, it fires massive bursts. Kill it early!',
      'Ambush it at its very first stop (400, 300) before it has a chance to power up.',
      'Rush it immediately with maximum damage. Do not let it survive past its second stop.',
    ],
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
    title: 'The Daemon',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Guarding your area',
    description:
      'This boss finds the patrol point closest to you and orbits it, firing continuously. If you move to a different area, it will dynamically choose a new point to guard.',
    hints: [
      'It anchors to a point near you. Lead it near an obstacle, then use the obstacle as cover.',
      'Move to the center (400, 300). It will orbit the center in a tight circle. Move with it to dodge.',
      'It orbits around its point, not around you. Step away from its orbit circle so it shoots at empty space.',
    ],
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
    title: 'The Oracle',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Predicting your movement',
    description:
      'The ultimate boss! It analyzes how you move and predicts where you are going to be. It then jumps to that area and locks it down. You cannot hide; you must outsmart it!',
    hints: [
      'It predicts your future position based on your past. If you move left for a while, it will attack the left side. Snap back right!',
      'It divides the map into 9 zones. Move rapidly between zones to confuse its prediction.',
      'Deception strategy: stay in the top-left for 3 seconds, then immediately run to the bottom-right. It will attack the empty top-left zone!',
    ],
    enemyScript: `IF NOT init THEN
  SET prevX = 400
  SET prevY = 300
  SET lastX = 400
  SET lastY = 300
  SET hasLast = 0
  SET hasPrev = 0
  SET cx = 400
  SET cy = 300
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  IF hasLast == 1 THEN
    SET prevX = lastX
    SET prevY = lastY
    SET hasPrev = 1
  END
  SET lastX = NEAREST_VISIBLE_X
  SET lastY = NEAREST_VISIBLE_Y
  SET hasLast = 1

  IF hasPrev == 1 THEN
    SET dx = lastX - prevX
    SET dy = lastY - prevY
    SET cx = lastX + dx
    SET cy = lastY + dy
  ELSE
    SET cx = lastX
    SET cy = lastY
  END

  IF cx < 60 THEN
    SET cx = 60
  END
  IF cx > 740 THEN
    SET cx = 740
  END
  IF cy < 60 THEN
    SET cy = 60
  END
  IF cy > 540 THEN
    SET cy = 540
  END

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
