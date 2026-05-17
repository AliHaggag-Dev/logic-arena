import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const DATA_STRUCTURES_LEVELS: CampaignLevel[] = [
  {
    id: 'ds-01',
    tabId: 'data-structures',
    order: 1,
    title: 'STATE MACHINE ALPHA',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'It maintains internal state via a dictionary. Mode 0: advance. Mode 1: fire. Mode 2: retreat and reset. An adversary with memory.',
    hint: 'Mode 2 (retreat) leaves it defenseless. Bait it into mode 1, then strike during mode 2.',
    enemyScript: `IF NOT init THEN
  SET state = { mode: 0, shots: 0 }
  SET init = 1
END
IF state.mode == 0 THEN
  MOVE RIGHT
  SET state.mode = 1
ELSE
  IF state.mode == 1 THEN
    FIRE
    SET state.shots = state.shots + 1
    IF state.shots >= 2 THEN
      SET state.mode = 2
    END
  ELSE
    MOVE LEFT
    SET state.mode = 0
    SET state.shots = 0
  END
END`,
  },
  {
    id: 'ds-02',
    tabId: 'data-structures',
    order: 2,
    title: 'CONFIG OBJECT',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'It loads its combat parameters from a config dictionary: fire rate, scan range flag, and aggression level. A bot that reads its own instructions from data, not code.',
    hint: 'Its aggression is set to 2 — moderate. It fires twice per contact. Outgun it with 3+ shots.',
    enemyScript: `IF NOT init THEN
  SET cfg = { rate: 2, scanFirst: 1, aggro: 2 }
  SET s = 0
  SET init = 1
END
IF cfg.scanFirst > 0 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    IF s < cfg.rate THEN
      FIRE
      SET s = s + 1
    ELSE
      SET s = 0
    END
  ELSE
    MOVE RIGHT
    SET s = 0
  END
END`,
  },
  {
    id: 'ds-03',
    tabId: 'data-structures',
    order: 3,
    title: 'COUNTER MAP',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'It tracks hits and misses in a dictionary. After 3 scans, if hits outnumber misses, it goes aggressive. Otherwise it retreats. A bot that adapts its strategy to your behavior.',
    hint: 'Stay hidden for 2 of 3 scans. Force misses > hits to trigger its retreat branch.',
    enemyScript: `IF NOT init THEN
  SET stats = { hits: 0, misses: 0 }
  SET i = 0
  SET init = 1
END
IF i < 3 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET stats.hits = stats.hits + 1
  ELSE
    SET stats.misses = stats.misses + 1
  END
  SET i = i + 1
ELSE
  IF stats.hits > stats.misses THEN
    FIRE
  ELSE
    MOVE LEFT
  END
  SET i = 0
  SET stats.hits = 0
  SET stats.misses = 0
END`,
  },
  {
    id: 'ds-04',
    tabId: 'data-structures',
    order: 4,
    title: 'PHASE SHIFTER',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It stores phase data in a dictionary and cycles through phases. Phase 1: scan. Phase 2: fire based on stored scan. Phase 3: reposition based on stored results. A delayed-reaction engine.',
    hint: 'Phase 2 uses the stored scan from Phase 1. If you dodge Phase 1 scan, Phase 2 does nothing.',
    enemyScript: `IF NOT init THEN
  SET data = { phase: 1, scan: 0, fired: 0 }
  SET init = 1
END
IF data.phase == 1 THEN
  SET data.scan = VISIBLE_ENEMY_COUNT
  SET data.phase = 2
ELSE
  IF data.phase == 2 THEN
    IF data.scan > 0 THEN
      FIRE
      SET data.fired = data.fired + 1
    END
    SET data.phase = 3
  ELSE
    IF data.fired > 0 THEN
      MOVE LEFT
    ELSE
      MOVE RIGHT
    END
    SET data.phase = 1
    SET data.fired = 0
  END
END`,
  },
  {
    id: 'ds-05',
    tabId: 'data-structures',
    order: 5,
    title: 'NEMESIS PROTOCOL',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'A hash map of your last four positions, weighted by recency. It predicts your next move and fires preemptively at where you will be. Escape the prediction lattice.',
    hint: 'Break your movement pattern. Alternate left-right unpredictably — its predictions become noise.',
    enemyScript: `IF NOT init THEN
  SET history = { p1: 0, p2: 0, p3: 0, p4: 0 }
  SET init = 1
END
SET history.p4 = history.p3
SET history.p3 = history.p2
SET history.p2 = history.p1
SET history.p1 = VISIBLE_ENEMY_COUNT
IF history.p1 > 0 THEN
  FIRE
  MOVE LEFT
ELSE
  MOVE RIGHT
END`,
  },
  {
    id: 'ds-06',
    tabId: 'data-structures',
    order: 6,
    title: 'DUAL REGISTER',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'Two dictionaries — one for offense, one for defense. Offense tracks targets. Defense tracks incoming threats. It cross-references both to decide: fire, dodge, or hold. A two-brain combatant.',
    hint: 'Its defense register needs SCAN > 0 to trigger evasion. If you fire from outside scan range, it never dodges.',
    enemyScript: `IF NOT init THEN
  SET atk = { target: 0, shots: 0 }
  SET def = { threat: 0, evade: 0 }
  SET init = 1
END
SET atk.target = VISIBLE_ENEMY_COUNT
SET def.threat = VISIBLE_ENEMY_COUNT
IF atk.target > 0 THEN
  FIRE
  SET atk.shots = atk.shots + 1
END
IF def.threat > 0 THEN
  MOVE LEFT
  SET def.evade = def.evade + 1
ELSE
  MOVE RIGHT
END`,
  },
  {
    id: 'ds-07',
    tabId: 'data-structures',
    order: 7,
    title: 'INVENTORY SYSTEM',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It manages an ammo inventory. Starting with 8 rounds, it fires only when scan is positive and ammo is available. When ammo runs out, it retreats permanently. Resource-aware warfare.',
    hint: 'Bait its scans to drain ammo on misses. After 8 shots it becomes harmless.',
    enemyScript: `IF NOT init THEN
  SET inv = { ammo: 8, kills: 0 }
  SET init = 1
END
IF inv.ammo > 0 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    FIRE
    SET inv.ammo = inv.ammo - 2
  ELSE
    MOVE RIGHT
  END
ELSE
  MOVE LEFT
END`,
  },
  {
    id: 'ds-08',
    tabId: 'data-structures',
    order: 8,
    title: 'NEURAL MAP',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'It builds a neural response map: scan results feed into a weight dictionary. Positive scans increase the fire weight. After 4 samples, it fires proportional to accumulated weight. A bot that learns to fight you.',
    hint: 'Keep scan detections to a minimum. The fire weight directly scales its output burst.',
    enemyScript: `IF NOT init THEN
  SET brain = { weight: 0, samples: 0 }
  SET init = 1
END
IF brain.samples < 4 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET brain.weight = brain.weight + 1
  END
  SET brain.samples = brain.samples + 1
  MOVE RIGHT
ELSE
  IF brain.weight > 0 THEN
    FIRE
    SET brain.weight = brain.weight - 1
  ELSE
    SET brain.samples = 0
  END
END`,
  },
  {
    id: 'ds-09',
    tabId: 'data-structures',
    order: 9,
    title: 'COMMAND STACK',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'It uses a command array as a stack, paired with a state dict tracking the stack pointer. Push scan results, then pop them to execute fire commands. Last-in-first-out combat logic.',
    hint: 'The stack reverses scan order. The last scan drives the first fire. Control what it scans last.',
    enemyScript: `IF NOT init THEN
  SET stack = [0, 0, 0]
  SET sp = 0
  SET phase = 0
  SET init = 1
END
IF phase == 0 THEN
  IF sp < 3 THEN
    SET stack[sp] = VISIBLE_ENEMY_COUNT
    SET sp = sp + 1
    MOVE RIGHT
  ELSE
    SET phase = 1
    SET sp = 2
  END
ELSE
  IF sp >= 0 THEN
    IF stack[sp] > 0 THEN
      FIRE
    END
    SET sp = sp - 1
  ELSE
    SET phase = 0
    SET sp = 0
  END
END`,
  },
  {
    id: 'ds-10',
    tabId: 'data-structures',
    order: 10,
    title: 'OVERLORD SYSTEM',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'The Overlord operates a full tactical command system. Shield integrity, ammo reserves, positional encoding, threat scores — all stored in a single dictionary. It adapts shields, conserves ammo, and repositions on calculated vectors. A war machine with a soul.',
    hint: 'When shield > 1, it plays conservatively. Deplete shield fast before berserk mode overwhelms you.',
    enemyScript: `IF NOT init THEN
  SET sys = { shield: 3, ammo: 10, pos: 0, threat: 0 }
  SET init = 1
END
SET sys.threat = VISIBLE_ENEMY_COUNT
IF sys.threat > 0 THEN
  IF sys.shield > 1 THEN
    FIRE
    SET sys.ammo = sys.ammo - 1
    MOVE LEFT
    SET sys.pos = sys.pos - 1
  ELSE
    FIRE
    SET sys.ammo = sys.ammo - 3
  END
ELSE
  MOVE RIGHT
  SET sys.pos = sys.pos + 1
  SET sys.shield = sys.shield + 1
END`,
  },
];
