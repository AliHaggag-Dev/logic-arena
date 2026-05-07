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
    enemyScript: `SET state = { mode: 0, shots: 0 }\nSET i = 0\nWHILE i < 6\n  IF state.mode == 0\n    MOVE RIGHT\n    SET state.mode = 1\n  ELSE\n    IF state.mode == 1\n      FIRE\n      SET state.shots = state.shots + 1\n      IF state.shots >= 2\n        SET state.mode = 2\n      END\n    ELSE\n      MOVE LEFT\n      SET state.mode = 0\n      SET state.shots = 0\n    END\n  END\n  SET i = i + 1\nEND`,
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
    enemyScript: `SET cfg = { rate: 2, scanFirst: 1, aggro: 2 }\nSET i = 0\nWHILE i < 4\n  IF cfg.scanFirst > 0\n    SET x = SCAN\n    IF x > 0\n      SET s = 0\n      WHILE s < cfg.rate\n        FIRE\n        SET s = s + 1\n      END\n    ELSE\n      MOVE RIGHT\n    END\n  END\n  SET i = i + 1\nEND`,
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
    enemyScript: `SET stats = { hits: 0, misses: 0 }\nSET i = 0\nWHILE i < 3\n  SET x = SCAN\n  IF x > 0\n    SET stats.hits = stats.hits + 1\n  ELSE\n    SET stats.misses = stats.misses + 1\n  END\n  SET i = i + 1\nEND\nIF stats.hits > stats.misses\n  FIRE\n  FIRE\n  FIRE\n  FIRE\nELSE\n  MOVE LEFT\n  MOVE LEFT\n  FIRE\nEND`,
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
    enemyScript: `SET data = { phase: 1, scan: 0, fired: 0 }\nSET i = 0\nWHILE i < 6\n  IF data.phase == 1\n    SET data.scan = SCAN\n    SET data.phase = 2\n  ELSE\n    IF data.phase == 2\n      IF data.scan > 0\n        FIRE\n        FIRE\n        SET data.fired = data.fired + 1\n      END\n      SET data.phase = 3\n    ELSE\n      IF data.fired > 0\n        MOVE LEFT\n      ELSE\n        MOVE RIGHT\n      END\n      SET data.phase = 1\n      SET data.fired = 0\n    END\n  END\n  SET i = i + 1\nEND`,
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
    enemyScript: `SET history = { p1: 0, p2: 0, p3: 0, p4: 0 }\nSET i = 0\nWHILE i < 5\n  SET x = SCAN\n  SET history.p4 = history.p3\n  SET history.p3 = history.p2\n  SET history.p2 = history.p1\n  SET history.p1 = x\n  IF history.p1 > 0\n    FIRE\n    FIRE\n    MOVE LEFT\n  ELSE\n    MOVE RIGHT\n  END\n  SET i = i + 1\nEND`,
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
    enemyScript: `SET atk = { target: 0, shots: 0 }\nSET def = { threat: 0, evade: 0 }\nSET i = 0\nWHILE i < 4\n  SET atk.target = SCAN\n  SET def.threat = SCAN\n  IF atk.target > 0\n    FIRE\n    FIRE\n    SET atk.shots = atk.shots + 1\n  END\n  IF def.threat > 0\n    MOVE LEFT\n    SET def.evade = def.evade + 1\n  ELSE\n    MOVE RIGHT\n  END\n  SET i = i + 1\nEND`,
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
    enemyScript: `SET inv = { ammo: 8, kills: 0 }\nSET i = 0\nWHILE i < 6\n  IF inv.ammo > 0\n    SET x = SCAN\n    IF x > 0\n      FIRE\n      FIRE\n      SET inv.ammo = inv.ammo - 2\n    ELSE\n      MOVE RIGHT\n    END\n  ELSE\n    MOVE LEFT\n    MOVE LEFT\n  END\n  SET i = i + 1\nEND`,
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
    enemyScript: `SET brain = { weight: 0, samples: 0 }\nSET i = 0\nWHILE i < 4\n  SET x = SCAN\n  IF x > 0\n    SET brain.weight = brain.weight + 1\n  END\n  SET brain.samples = brain.samples + 1\n  MOVE RIGHT\n  SET i = i + 1\nEND\nSET f = 0\nWHILE f < brain.weight\n  FIRE\n  FIRE\n  SET f = f + 1\nEND`,
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
    enemyScript: `SET stack = [0, 0, 0]\nSET sp = { ptr: 0 }\nSET i = 0\nWHILE i < 3\n  SET stack[sp.ptr] = SCAN\n  SET sp.ptr = sp.ptr + 1\n  MOVE RIGHT\n  SET i = i + 1\nEND\nSET sp.ptr = sp.ptr - 1\nWHILE sp.ptr >= 0\n  IF stack[sp.ptr] > 0\n    FIRE\n    FIRE\n    FIRE\n  END\n  SET sp.ptr = sp.ptr - 1\nEND`,
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
    enemyScript: `SET sys = { shield: 3, ammo: 10, pos: 0, threat: 0 }\nSET i = 0\nWHILE i < 8\n  SET sys.threat = SCAN\n  IF sys.threat > 0\n    IF sys.shield > 1\n      FIRE\n      SET sys.ammo = sys.ammo - 1\n      MOVE LEFT\n      SET sys.pos = sys.pos - 1\n    ELSE\n      FIRE\n      FIRE\n      FIRE\n      SET sys.ammo = sys.ammo - 3\n    END\n  ELSE\n    MOVE RIGHT\n    SET sys.pos = sys.pos + 1\n    SET sys.shield = sys.shield + 1\n  END\n  SET i = i + 1\nEND`,
  },
];
