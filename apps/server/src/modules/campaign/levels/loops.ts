import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const LOOPS_LEVELS: CampaignLevel[] = [
  {
    id: 'loop-01',
    tabId: 'loops',
    order: 1,
    title: 'PULSE DRUM',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    description:
      'Five pulses. Always five. A mechanical heartbeat of destruction. It cannot adapt — it only repeats. Interrupt the rhythm before the fifth beat.',
    hint: 'It fires 5 times without scanning. Rush it by the 3rd pulse.',
    enemyScript: `IF NOT init THEN
  SET i = 0
  SET init = 1
END
IF i < 5 THEN
  FIRE
  SET i = i + 1
ELSE
  MOVE LEFT
END`,
  },
  {
    id: 'loop-02',
    tabId: 'loops',
    order: 2,
    title: 'PATROL CIRCUIT',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    description:
      'It walks a fixed circuit — right, right, right, left, left, left — firing once per step. A predictable patrol loop. Ambush it at the turning point.',
    hint: 'It reverses direction halfway through. Position yourself at the turning point.',
    enemyScript: `IF NOT init THEN
  SET i = 0
  SET init = 1
END
IF i < 3 THEN
  MOVE RIGHT
  FIRE
  SET i = i + 1
ELSE
  IF i < 6 THEN
    MOVE LEFT
    FIRE
    SET i = i + 1
  ELSE
    SET i = 0
  END
END`,
  },
  {
    id: 'loop-03',
    tabId: 'loops',
    order: 3,
    title: 'ADAPTIVE VORTEX',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'Three cycles. Each cycle it scans. Signal triggers a double burst and lateral shift. Silence returns it to advance. Three rotations of this deadly waltz.',
    hint: 'Use the lateral drift — predict its position after each cycle.',
    enemyScript: `IF NOT init THEN
  SET i = 0
  SET init = 1
END
IF i < 3 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    FIRE
    MOVE LEFT
  ELSE
    MOVE RIGHT
  END
  SET i = i + 1
ELSE
  FIRE
  SET i = 0
END`,
  },
  {
    id: 'loop-04',
    tabId: 'loops',
    order: 4,
    title: 'RAMP PROTOCOL',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'Each iteration fires one more shot than the last. Iteration 1: one shot. Iteration 2: two. Iteration 3: three. A ramping crescendo of violence that peaks at 6 total rounds.',
    hint: 'Kill it before iteration 3 — the damage curve accelerates exponentially.',
    enemyScript: `IF NOT init THEN
  SET round = 1
  SET shots = 0
  SET init = 1
END
IF shots < round THEN
  FIRE
  SET shots = shots + 1
ELSE
  MOVE RIGHT
  SET round = round + 1
  SET shots = 0
  IF round > 3 THEN
    SET round = 1
  END
END`,
  },
  {
    id: 'loop-05',
    tabId: 'loops',
    order: 5,
    title: 'SEEK AND DESTROY',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'It scans in a loop. When it finds you, it fires 3 times and breaks. When it does not, it moves right and continues scanning. A hunter that never stops searching until contact.',
    hint: 'It exits the loop on contact. Stay hidden for the first 4 iterations then strike while it is moving right.',
    enemyScript: `IF VISIBLE_ENEMY_COUNT > 0 THEN
  FIRE
ELSE
  MOVE RIGHT
END`,
  },
  {
    id: 'loop-06',
    tabId: 'loops',
    order: 6,
    title: 'ECHO CHAMBER',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'A nested loop: outer runs 3 times, inner runs 2 times. Each inner iteration scans and fires. Between outer iterations, it repositions. 6 total engagement windows compressed into a cage of echoes.',
    hint: 'During the reposition between outer loops, it is defenseless. Strike then.',
    enemyScript: `IF NOT init THEN
  SET outer = 0
  SET inner = 0
  SET init = 1
END
IF outer < 3 THEN
  IF inner < 2 THEN
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      FIRE
    END
    SET inner = inner + 1
  ELSE
    MOVE RIGHT
    SET inner = 0
    SET outer = outer + 1
  END
ELSE
  SET outer = 0
END`,
  },
  {
    id: 'loop-07',
    tabId: 'loops',
    order: 7,
    title: 'DECIMATOR MK-IV',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'Six iterations. Each scans for targets. A confirmed hit triggers a triple burst and sets the loop counter to max — an instant kill-switch. It learns to end wars faster.',
    hint: 'Strike with overwhelming firepower in the first two iterations before it calibrates.',
    enemyScript: `IF VISIBLE_ENEMY_COUNT > 0 THEN
  FIRE
  MOVE LEFT
ELSE
  MOVE RIGHT
END`,
  },
  {
    id: 'loop-08',
    tabId: 'loops',
    order: 8,
    title: 'SINE WAVE',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It oscillates: right-right-fire, left-left-fire, repeated 4 times. A sine wave of movement and destruction. Each oscillation covers more ground. Time your strikes at the wave crests.',
    hint: 'The fire commands happen at the extremes of each oscillation. Position yourself at the center.',
    enemyScript: `IF NOT init THEN
  SET tick = 0
  SET init = 1
END
SET phase = tick % 6
IF phase < 2 THEN
  MOVE RIGHT
ELSE
  IF phase == 2 THEN
    FIRE
  ELSE
    IF phase < 5 THEN
      MOVE LEFT
    ELSE
      FIRE
    END
  END
END
SET tick = tick + 1`,
  },
  {
    id: 'loop-09',
    tabId: 'loops',
    order: 9,
    title: 'CONVERGENCE ENGINE',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'Two counters converge from opposite ends. Counter A starts at 0 going up. Counter B starts at 5 going down. When they meet, maximum firepower. A countdown to annihilation.',
    hint: 'The peak danger is when both counters equal 2-3 (the midpoint). Destroy it before convergence.',
    enemyScript: `IF NOT init THEN
  SET a = 0
  SET b = 5
  SET init = 1
END
IF a < b THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    FIRE
  ELSE
    MOVE RIGHT
  END
  SET a = a + 1
  SET b = b - 1
ELSE
  FIRE
  SET a = 0
  SET b = 5
END`,
  },
  {
    id: 'loop-10',
    tabId: 'loops',
    order: 10,
    title: 'INFINITE NEMESIS',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'A pseudo-infinite loop with an internal kill condition. It scans, fires if found, repositions if not — but it also tracks total shots fired. At 8 shots, it enters berserker mode: 4 rapid-fire rounds. An enemy that gets more dangerous the longer you survive.',
    hint: 'End the fight before it reaches 8 shots fired. Aggressive early play is the only viable strategy.',
    enemyScript: `IF NOT init THEN
  SET shots = 0
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  FIRE
  SET shots = shots + 1
  IF shots > 4 THEN
    FIRE
  END
ELSE
  MOVE RIGHT
END`,
  },
];
