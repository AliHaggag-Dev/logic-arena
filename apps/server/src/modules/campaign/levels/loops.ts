import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const LOOPS_LEVELS: CampaignLevel[] = [
  {
    id: 'loop-01', tabId: 'loops', order: 1, title: 'PULSE DRUM',
    difficulty: 'EASY', pointsReward: D.EASY,
    description: 'Five pulses. Always five. A mechanical heartbeat of destruction. It cannot adapt — it only repeats. Interrupt the rhythm before the fifth beat.',
    hint: 'It fires 5 times without scanning. Rush it by the 3rd pulse.',
    enemyScript: `SET i = 0\nWHILE i < 5\n  FIRE\n  SET i = i + 1\nEND\nMOVE LEFT`,
  },
  {
    id: 'loop-02', tabId: 'loops', order: 2, title: 'PATROL CIRCUIT',
    difficulty: 'EASY', pointsReward: D.EASY,
    description: 'It walks a fixed circuit — right, right, right, left, left, left — firing once per step. A predictable patrol loop. Ambush it at the turning point.',
    hint: 'It reverses direction halfway through. Position yourself at the turning point.',
    enemyScript: `SET i = 0\nWHILE i < 3\n  MOVE RIGHT\n  FIRE\n  SET i = i + 1\nEND\nSET i = 0\nWHILE i < 3\n  MOVE LEFT\n  FIRE\n  SET i = i + 1\nEND`,
  },
  {
    id: 'loop-03', tabId: 'loops', order: 3, title: 'ADAPTIVE VORTEX',
    difficulty: 'MEDIUM', pointsReward: D.MEDIUM,
    description: 'Three cycles. Each cycle it scans. Signal triggers a double burst and lateral shift. Silence returns it to advance. Three rotations of this deadly waltz.',
    hint: 'Use the lateral drift — predict its position after each cycle.',
    enemyScript: `SET i = 0\nWHILE i < 3\n  SET x = SCAN\n  IF x > 0\n    FIRE\n    FIRE\n    MOVE LEFT\n  ELSE\n    MOVE RIGHT\n  END\n  SET i = i + 1\nEND\nFIRE`,
  },
  {
    id: 'loop-04', tabId: 'loops', order: 4, title: 'RAMP PROTOCOL',
    difficulty: 'MEDIUM', pointsReward: D.MEDIUM,
    description: 'Each iteration fires one more shot than the last. Iteration 1: one shot. Iteration 2: two. Iteration 3: three. A ramping crescendo of violence that peaks at 6 total rounds.',
    hint: 'Kill it before iteration 3 — the damage curve accelerates exponentially.',
    enemyScript: `SET round = 1\nWHILE round < 4\n  SET shots = 0\n  WHILE shots < round\n    FIRE\n    SET shots = shots + 1\n  END\n  MOVE RIGHT\n  SET round = round + 1\nEND`,
  },
  {
    id: 'loop-05', tabId: 'loops', order: 5, title: 'SEEK AND DESTROY',
    difficulty: 'MEDIUM', pointsReward: D.MEDIUM,
    description: 'It scans in a loop. When it finds you, it fires 3 times and breaks. When it does not, it moves right and continues scanning. A hunter that never stops searching until contact.',
    hint: 'It exits the loop on contact. Stay hidden for the first 4 iterations then strike while it is moving right.',
    enemyScript: `SET found = 0\nSET i = 0\nWHILE i < 5\n  SET x = SCAN\n  IF x > 0\n    FIRE\n    FIRE\n    FIRE\n    SET i = 5\n  ELSE\n    MOVE RIGHT\n    SET i = i + 1\n  END\nEND`,
  },
  {
    id: 'loop-06', tabId: 'loops', order: 6, title: 'ECHO CHAMBER',
    difficulty: 'HARD', pointsReward: D.HARD,
    description: 'A nested loop: outer runs 3 times, inner runs 2 times. Each inner iteration scans and fires. Between outer iterations, it repositions. 6 total engagement windows compressed into a cage of echoes.',
    hint: 'During the reposition between outer loops, it is defenseless. Strike then.',
    enemyScript: `SET outer = 0\nWHILE outer < 3\n  SET inner = 0\n  WHILE inner < 2\n    SET x = SCAN\n    IF x > 0\n      FIRE\n      FIRE\n    END\n    SET inner = inner + 1\n  END\n  MOVE RIGHT\n  MOVE RIGHT\n  SET outer = outer + 1\nEND`,
  },
  {
    id: 'loop-07', tabId: 'loops', order: 7, title: 'DECIMATOR MK-IV',
    difficulty: 'HARD', pointsReward: D.HARD,
    description: 'Six iterations. Each scans for targets. A confirmed hit triggers a triple burst and sets the loop counter to max — an instant kill-switch. It learns to end wars faster.',
    hint: 'Strike with overwhelming firepower in the first two iterations before it calibrates.',
    enemyScript: `SET i = 0\nWHILE i < 6\n  SET x = SCAN\n  IF x > 0\n    FIRE\n    FIRE\n    FIRE\n    MOVE LEFT\n    MOVE LEFT\n    SET i = 6\n  ELSE\n    MOVE RIGHT\n    SET i = i + 1\n  END\nEND`,
  },
  {
    id: 'loop-08', tabId: 'loops', order: 8, title: 'SINE WAVE',
    difficulty: 'HARD', pointsReward: D.HARD,
    description: 'It oscillates: right-right-fire, left-left-fire, repeated 4 times. A sine wave of movement and destruction. Each oscillation covers more ground. Time your strikes at the wave crests.',
    hint: 'The fire commands happen at the extremes of each oscillation. Position yourself at the center.',
    enemyScript: `SET wave = 0\nWHILE wave < 4\n  MOVE RIGHT\n  MOVE RIGHT\n  FIRE\n  MOVE LEFT\n  MOVE LEFT\n  FIRE\n  SET wave = wave + 1\nEND`,
  },
  {
    id: 'loop-09', tabId: 'loops', order: 9, title: 'CONVERGENCE ENGINE',
    difficulty: 'EXTREME', pointsReward: D.EXTREME,
    description: 'Two counters converge from opposite ends. Counter A starts at 0 going up. Counter B starts at 5 going down. When they meet, maximum firepower. A countdown to annihilation.',
    hint: 'The peak danger is when both counters equal 2-3 (the midpoint). Destroy it before convergence.',
    enemyScript: `SET a = 0\nSET b = 5\nWHILE a < b\n  SET x = SCAN\n  IF x > 0\n    FIRE\n    FIRE\n  ELSE\n    MOVE RIGHT\n  END\n  SET a = a + 1\n  SET b = b - 1\nEND\nFIRE\nFIRE\nFIRE\nFIRE`,
  },
  {
    id: 'loop-10', tabId: 'loops', order: 10, title: 'INFINITE NEMESIS',
    difficulty: 'EXTREME', pointsReward: D.EXTREME,
    description: 'A pseudo-infinite loop with an internal kill condition. It scans, fires if found, repositions if not — but it also tracks total shots fired. At 8 shots, it enters berserker mode: 4 rapid-fire rounds. An enemy that gets more dangerous the longer you survive.',
    hint: 'End the fight before it reaches 8 shots fired. Aggressive early play is the only viable strategy.',
    enemyScript: `SET shots = 0\nSET i = 0\nWHILE i < 8\n  SET x = SCAN\n  IF x > 0\n    FIRE\n    SET shots = shots + 1\n    IF shots > 4\n      FIRE\n      FIRE\n      FIRE\n      FIRE\n      SET i = 8\n    END\n  ELSE\n    MOVE RIGHT\n  END\n  SET i = i + 1\nEND`,
  },
];
