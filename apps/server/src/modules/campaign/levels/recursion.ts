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
    conceptTaught: 'Depth counter simulation (wind-up / release)',
    description:
      'A simulated recursive depth of 2. It tracks a depth counter. At depth 1: advance. At depth 2: burst fire. Then it unwinds back to depth 1. A two-step wind-up and release pattern.',
    hints: [
      'It only fires at depth 2 (every other second). You can advance freely on its movement seconds.',
      'Depth alternates every second: 1→2→1→2. On depth 1 it moves right — no fire. On depth 2 it fires only if you are visible. The pattern is exactly one free second (move) per fire second.',
      'Time your approach for depth 1 ticks. Advance during depth 1, dodge during depth 2. Your script: SET d = d + 1. IF d % 2 == 0 THEN dodge/BACKUP. ELSE MOVE closer and FIRE END.',
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
    title: 'DOUBLE ECHO',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'Bidirectional depth traversal (wind and unwind)',
    description:
      'It simulates recursion with depth 3. Wind up: moves left (depth 1), then right (depth 2), then reaches base case (depth 3) to FIRE. Unwind: fires again at depth 3, moves right, moves left. A perfectly mirrored execution stack.',
    hints: [
      'It fires twice in a row at the base case — once winding in, once winding out. The only move-safe seconds are the two steps between fire pairs.',
      'Full cycle: L (depth 1), R (depth 2), FIRE (depth 3), FIRE (depth 3 again), R (depth 2 unwind), L (depth 1 unwind), then reset. Move windows: depths 1 and 2 on both wind and unwind = 4 safe seconds per 6-second cycle.',
      'The 6-second cycle is: second 1 (move left), second 2 (move right), second 3 (FIRE), second 4 (FIRE), second 5 (move right), second 6 (move left). Use second 1,2,5,6 to advance and attack. Dodge on seconds 3 and 4.',
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
    title: 'DEPTH CHARGE',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Growing max-depth recursive pattern',
    description:
      'Dynamic recursion depth. It starts with max depth = 2. It winds up (strafe), hits max depth (fires), and unwinds. Then max depth increments. The deeper the recursion, the longer the strafe before the fire. Depth grows to 5 then resets.',
    hints: [
      'The time between shots grows as max depth increases. Exploit the long wind-up times on depths 4 and 5.',
      'At maxD = 5, the wind-up is 4 strafe seconds before firing. That means 4 safe seconds of no fire to attack. At maxD = 2, only 1 safe second. Sit back and attack most aggressively when you see long strafe sequences (maxD is high).',
      'Full cycle at maxD=5: 4 strafe seconds in, 1 fire second, 4 strafe seconds out, then maxD resets to 2. Peak attack window: after the fire at maxD=5, the unwind begins — 4 seconds of strafe with no fire. Rush those 4 seconds before the next cycle starts at maxD=2.',
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
    title: 'MIRROR RECURSION',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Symmetric recursive tree with base-case pause',
    description:
      'At each depth level it performs work: fires one shot. It dives 3 levels deep (3 shots), pauses at the base case, then unwinds 3 levels up (3 more shots). A symmetrical recursive tree of firepower.',
    hints: [
      'It fires continuously during both wind-up and unwind. The only safe moment is the base case pause when it reaches depth 4.',
      'At depth 4 (base case): SET _SYS_SPEED_MULT = 0, MOVE — effectively a stationary pause with NO fire. This is the ONE safe tick per 6-tick cycle. Attack during this exact tick.',
      'Cycle breakdown: depths 1→2→3 (3 fire seconds), depth 4 (1 safe pause), depths 3→2→1 (3 fire seconds). The pause at depth 4 is your only window. Count: after 3 consecutive fire seconds, attack on the 4th second (the pause).',
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
    title: 'FIBONACCI STRIKER',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Fibonacci sequence as iteration limit',
    description:
      'It computes Fibonacci values iteratively and uses them as a recursive iteration limit. It strafes `fib(N)` times, then fires once. N increases from 1 to 5. The spacing between shots grows according to the Fibonacci sequence.',
    hints: [
      'Spacing sequence: 1, 1, 2, 3, 5 seconds between shots. The gaps get larger. Wait for the 3 and 5 gaps to counterattack.',
      'Shot timing: shot1 at second 1, shot2 at second 2, shot3 at second 4, shot4 at second 7, shot5 at second 12 — then it resets. The 5-second gap (before shot5) is your longest and best attack window.',
      'Count your seconds from the last shot. After shot4 (at second 7), you have exactly 5 seconds of strafe-only movement. Commit your entire offense during these 5 seconds, then retreat before shot5 at second 12. Repeat every full cycle (~13 seconds).',
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
    title: 'TOWER OF POWER',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Call-stack push/pop with closing and retreating',
    description:
      'Simulates the Call Stack. Depth goes from 1 to 4. As it descends (push), it accumulates "pointers" by stepping closer. At base case (depth 4) it executes the payload: burst fire. As it unwinds (pop), it steps away. A stack frame execution model.',
    hints: [
      'It only fires at depth 4, but it closes the distance during depths 1-3. Retreat as it pushes frames, attack as it pops them.',
      'During the unwind (ddir == -1, depths 3→2→1): it backs up. This is a clean retreat — no fire and predictable backward movement. Chase it during unwind and fire continuously.',
      'Pattern: depths 1-3 PUSH (it approaches, no fire — retreat and match its advance), depth 4 BURST_FIRE (dodge with BACKUP or strafe), depths 3-1 POP (it backs up — pursue and attack with MOVE + FIRE).',
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
    title: 'BINARY SPLITTER',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Binary tree traversal via stack array',
    description:
      'It divides its logic into branches: Left Branch and Right Branch. It maintains a branch array stack. It executes Left (strafe left + fire), then Right (strafe right + fire). A binary tree traversal of destruction.',
    hints: [
      'It alternates strict left and right strafing while firing. The pattern zig-zags predictably. Lead your shots to the opposite side.',
      'The stack [1,2,1,2] cycles predictably: left strafe 2 seconds, right strafe 2 seconds, repeat. Position yourself to exploit the predictable reversal — when it strafes left, move right to stay in its trajectory.',
      'Counter-tactic: mirror-strafe. When it strafes left (branch==1), you also strafe left. Both moving the same direction minimizes relative velocity — it struggles to track you. Fire during same-direction seconds for highest hit rate.',
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
    title: 'FRACTAL STORM',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Fractal orbit pattern with direction reversal',
    description:
      'It orbits in a fractal pattern: 3 large steps clockwise, 1 small step counter-clockwise, repeat. The recursive definition of its movement creates a jagged orbit that throws off predictive targeting.',
    hints: [
      'Every 4th second it reverses direction briefly. Hold fire during the reversal second.',
      'The CCW reversal second (step == 3) uses a smaller orbit radius (-80 vs 120). On this second its position snaps differently. Fire on CW seconds (steps 0-2) where its orbit is larger and more predictable.',
      'The orbit center is always (400,300). Position yourself at distance ~120 from center — on the CW orbit path. Fire at the orbital position 2-3 seconds ahead. The reversal second (step 3) it jumps inward briefly, then back out. Ignore that second.',
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
    title: 'CALL STACK OVERLOAD',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Ghost-trail stack pop with deferred coordinate burst',
    description:
      'It simulates a recursive algorithm that builds up state until a stack overflow limit (5). It pushes your position onto an array. At depth 5, it pops them all off, firing a burst at every historical coordinate. A deferred execution model.',
    hints: [
      'It records your ghost trail for 5 seconds, then shoots the trail. Keep moving — by the time it executes the stack, you should be far away from your past positions.',
      'During POP phase (5 seconds of burst fire): speed mult = 0 (it is stationary). This is actually safe for YOU if you have moved. But it fires at the 5 past coordinates — guarantee you are not at any of those 5 positions.',
      'Strategy: during PUSH phase (5 seconds), move in ONE direction steadily (strafe left). All 5 recorded positions will be in a line. Then during POP phase, you have already moved perpendicular away — all 5 shots miss. Then attack the stationary enemy during POP.',
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
    title: 'OMEGA UNWIND',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Dual-variable entanglement producing cyclical chaos',
    description:
      'A dual-recursive function simulation: Ackermann-lite. It scales its target speed and burst count based on two deeply entangled variables. As the variables intertwine and grow, its movement becomes hyper-erratic and its fire rate spikes massively before collapsing. The ultimate chaotic attractor.',
    hints: [
      'The chaos is cyclical. It reaches a peak intensity where speed and burst count are maxed, then it resets to a slow baseline. Strike during the reset.',
      'The cycle is 12 seconds (m goes 0→1→2→0, each lasting 4 seconds since n counts 0-3). m=0: FIRE+orbit100. m=1: FIRE+orbit120. m=2: BURST_FIRE+orbit140+high speed. The reset from m=2 back to m=0 is the weakest moment.',
      'Attack plan: heavily engage during m=0 (seconds 1-4): speed is 1.0x and only single FIRE. Dodge during m=2 (seconds 9-12): speed 2.5x and BURST_FIRE. After second 12 (m resets to 0), attack immediately at the slow baseline.',
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
