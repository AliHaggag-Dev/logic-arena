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
      'A simulated recursive depth of 2. It tracks a depth counter. At depth 1: advance. At depth 2: burst fire. Then it unwinds back to depth 1. A two-step wind-up and release pattern.',
    hint: 'It only fires at depth 2 (every other tick). You can advance freely on its movement ticks.',
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
  },
  {
    id: 'rec-02',
    tabId: 'recursion',
    order: 2,
    title: 'DOUBLE ECHO',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    description:
      'It simulates recursion with depth 3. Wind up: moves left, then right, then reaches base case (depth 3) to FIRE. Unwind: fires again, moves right, moves left. A perfectly mirrored execution stack.',
    hint: 'The base case at depth 3 is the only time it fires. It fires twice in a row (once winding in, once winding out).',
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
  IF ddir == 1 THEN
    MOVE LEFT
  ELSE
    MOVE RIGHT
  END
END
SET depth = depth + ddir
IF depth > 3 THEN
  SET depth = 2
  SET ddir = -1
END
IF depth < 1 THEN
  SET depth = 2
  SET ddir = 1
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
      'Dynamic recursion depth. It starts with max depth = 2. It winds up (strafe), hits max depth (fires), and unwinds. Then max depth increments. The deeper the recursion, the longer the strafe before the fire. Depth grows to 5 then resets.',
    hint: 'The time between shots grows as max depth increases. Exploit the long wind-up times on depths 4 and 5.',
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
  },
  {
    id: 'rec-04',
    tabId: 'recursion',
    order: 4,
    title: 'MIRROR RECURSION',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'At each depth level it performs work: fires one shot. It dives 3 levels deep (3 shots), pauses at the base case, then unwinds 3 levels up (3 more shots). A symmetrical recursive tree of firepower.',
    hint: 'It fires continuously during both wind-up and unwind. The only safe moment is the base case pause when it reaches depth 4.',
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
  SET depth = 2
  SET ddir = 1
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
      'It computes Fibonacci values iteratively and uses them as a recursive iteration limit. It strafes `fib(N)` times, then fires once. N increases from 1 to 5. The spacing between shots grows according to the Fibonacci sequence.',
    hint: 'Spacing sequence: 1, 1, 2, 3, 5 ticks between shots. The gaps get larger. Wait for the 3 and 5 gaps to counterattack.',
    enemyScript: `IF NOT init THEN
  SET n = 1
  SET a = 1
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
    SET a = 1
    SET b = 1
  END
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
      'Simulates the Call Stack. Depth goes from 1 to 4. As it descends (push), it accumulates "pointers" by stepping closer. At base case (depth 4) it executes the payload: burst fire. As it unwinds (pop), it steps away. A stack frame execution model.',
    hint: 'It only fires at depth 4, but it closes the distance during depths 1-3. Retreat as it pushes frames, attack as it pops them.',
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
  SET depth = 2
  SET ddir = 1
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
      'It divides its logic into branches: Left Branch and Right Branch. It maintains a branch array stack. It executes Left (strafe left + fire), then Right (strafe right + fire). A binary tree traversal of destruction.',
    hint: 'It alternates strict left and right strafing while firing. The pattern zig-zags predictably. Lead your shots to the opposite side.',
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
  },
  {
    id: 'rec-08',
    tabId: 'recursion',
    order: 8,
    title: 'FRACTAL STORM',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It orbits in a fractal pattern: 3 large steps clockwise, 1 small step counter-clockwise, repeat. The recursive definition of its movement creates a jagged orbit that throws off predictive targeting.',
    hint: 'Every 4th tick it reverses direction briefly. Hold fire during the reversal tick.',
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
  },
  {
    id: 'rec-09',
    tabId: 'recursion',
    order: 9,
    title: 'CALL STACK OVERLOAD',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'It simulates a recursive algorithm that builds up state until a stack overflow limit (5). It pushes your position onto an array. At depth 5, it pops them all off, firing a burst at every historical coordinate. A deferred execution model.',
    hint: 'It records your ghost trail for 5 ticks, then shoots the trail. Keep moving — by the time it executes the stack, you should be far away from your past positions.',
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
  },
  {
    id: 'rec-10',
    tabId: 'recursion',
    order: 10,
    title: 'OMEGA UNWIND',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'A dual-recursive function simulation: Ackermann-lite. It scales its target speed and burst count based on two deeply entangled variables. As the variables intertwine and grow, its movement becomes hyper-erratic and its fire rate spikes massively before collapsing. The ultimate chaotic attractor.',
    hint: 'The chaos is cyclical. It reaches a peak intensity where speed and burst count are maxed, then it resets to a slow baseline. Strike during the reset.',
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
  },
];
