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
      'It maintains an internal state via a dictionary: { mode: "PATROL", shots: 0 }. mode "PATROL" orbits the center. When it sees you, it swaps to "ENGAGE" mode, firing until shots reach 3, then transitions back. An adversary with a formal state dictionary.',
    hint: 'Watch the transition. After 3 shots in ENGAGE mode, it drops aggro and returns to PATROL mode briefly.',
    enemyScript: `IF NOT init THEN
  SET state = { mode: "PATROL", shots: 0 }
  SET init = 1
END
IF state.mode == "PATROL" THEN
  SET _SYS_ORBIT_X = 400
  SET _SYS_ORBIT_Y = 300
  SET _SYS_ORBIT_R = 100
  MOVE
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET state.mode = "ENGAGE"
    SET state.shots = 0
  END
ELSE
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET _SYS_FACE_X = NEAREST_VISIBLE_X
    SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
    SET state.shots = state.shots + 1
    IF state.shots >= 3 THEN
      SET state.mode = "PATROL"
    END
  ELSE
    SCAN
  END
  MOVE RIGHT
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
      'It loads its combat parameters from a config dictionary: { speed: 1.5, strafe: -1, burst: 1 }. It acts purely on these dictionary values. A bot that reads its own runtime parameters to move.',
    hint: 'Its config dictates a constant left-strafe (-1) with a 1.5x speed multiplier. Aim where its strafe will carry it.',
    enemyScript: `IF NOT init THEN
  SET cfg = { speed: 1.5, strafe: -1, burst: 1 }
  SET init = 1
END
SET _SYS_SPEED_MULT = cfg.speed
SET _SYS_STRAFE = cfg.strafe
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  IF cfg.burst == 1 THEN
    BURST_FIRE
  ELSE
    FIRE
  END
ELSE
  SCAN
END
MOVE`,
  },
  {
    id: 'ds-03',
    tabId: 'data-structures',
    order: 3,
    title: 'COUNTER MAP',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'It tracks its own accuracy stats in a dictionary: { sightings: 0, ticks: 0 }. It calculates a threat ratio. If you remain visible for a high percentage of ticks, it enters orbit mode. If you hide, it defaults to erratic strafing.',
    hint: 'Keep its sighting ratio low. Hide behind cover frequently so it remains in its less accurate strafe mode.',
    enemyScript: `IF NOT init THEN
  SET stats = { sightings: 0, ticks: 0 }
  SET init = 1
END
SET stats.ticks = stats.ticks + 1
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET stats.sightings = stats.sightings + 1
END
SET ratio = stats.sightings / stats.ticks
IF ratio > 0.5 THEN
  SET _SYS_ORBIT_X = 400
  SET _SYS_ORBIT_Y = 300
  SET _SYS_ORBIT_R = -120
ELSE
  SET _SYS_STRAFE = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  FIRE
END
MOVE`,
  },
  {
    id: 'ds-04',
    tabId: 'data-structures',
    order: 4,
    title: 'PHASE SHIFTER',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It stores multi-phase data in a dictionary: { phase: 1, targetX: 0, targetY: 0 }. Phase 1 locks coordinates. Phase 2 navigates to them perfectly. Phase 3 unleashes a payload at that exact spot. A delayed-execution coordinate system.',
    hint: 'It locks your coordinates in Phase 1, then travels there. Move away from your old position; it will fire at a ghost.',
    enemyScript: `IF NOT init THEN
  SET data = { phase: 1, targetX: 0, targetY: 0 }
  SET init = 1
END
IF data.phase == 1 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET data.targetX = NEAREST_VISIBLE_X
    SET data.targetY = NEAREST_VISIBLE_Y
    SET data.phase = 2
  ELSE
    SCAN
    MOVE RIGHT
  END
ELSE
  IF data.phase == 2 THEN
    SET _SYS_TARGET_X = data.targetX
    SET _SYS_TARGET_Y = data.targetY
    IF _SYS_AT_TARGET == 1 THEN
      SET data.phase = 3
    ELSE
      MOVE
    END
  ELSE
    IF data.phase == 3 THEN
      BURST_FIRE
      SET data.phase = 1
    END
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
      'It uses a history dictionary { p1: 0, p2: 0, p3: 0 } to store your distances over time. By comparing p1 to p3, it calculates your velocity delta. If you are rushing it, it backs up fast. If you are fleeing, it boosts forward. A differential equation bot.',
    hint: 'It reacts to your approach speed. Move laterally (strafe) to keep your distance delta near zero, confusing its velocity checks.',
    enemyScript: `IF NOT init THEN
  SET hist = { p1: 0, p2: 0, p3: 0 }
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET hist.p3 = hist.p2
  SET hist.p2 = hist.p1
  SET hist.p1 = distance
  
  SET delta = hist.p3 - hist.p1
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  
  IF delta > 20 THEN
    SET _SYS_SPEED_MULT = 1.5
    BACKUP
  ELSE
    IF delta < -20 THEN
      SET _SYS_SPEED_MULT = 1.5
      MOVE
    ELSE
      SET _SYS_STRAFE = 1
      MOVE
    END
  END
  FIRE
ELSE
  SCAN
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
      'Two dictionaries — atk { aggro: 0 } and def { evade: 0 }. When your health is low, it boosts aggro (orbit + burst). When its own health drops, it boosts evade (backup + strafe). It blends two separate concerns into a singular threat matrix.',
    hint: 'It evaluates both your health and its health. If you damage it, the def register takes over, making it defensive. Press the attack.',
    enemyScript: `IF NOT init THEN
  SET atk = { aggro: 0 }
  SET def = { evade: 0 }
  SET init = 1
END
SET enemies = GET_ALL_VISIBLE_ENEMIES()
IF LENGTH(enemies) > 0 THEN
  SET e = enemies[0]
  IF e[3] < 50 THEN
    SET atk.aggro = 1
  ELSE
    SET atk.aggro = 0
  END
END
IF health < 50 THEN
  SET def.evade = 1
ELSE
  SET def.evade = 0
END

IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  IF def.evade == 1 THEN
    SET _SYS_STRAFE = -1
    FIRE
    BACKUP
  ELSE
    IF atk.aggro == 1 THEN
      SET _SYS_ORBIT_X = NEAREST_VISIBLE_X
      SET _SYS_ORBIT_Y = NEAREST_VISIBLE_Y
      SET _SYS_ORBIT_R = 100
      BURST_FIRE
      MOVE
    ELSE
      FIRE
      MOVE
    END
  END
ELSE
  SCAN
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
      'It manages a literal ammo dictionary: { bullets: 15, heat: 0 }. Firing consumes bullets and generates heat. If heat > 10, it must stop and cool down. If bullets hit 0, it flees permanently. A resource-constrained combat simulation.',
    hint: 'Survive its 15 shots. Make it fire rapidly to build up heat and force a cooldown window.',
    enemyScript: `IF NOT init THEN
  SET inv = { bullets: 15, heat: 0 }
  SET init = 1
END
IF inv.heat > 0 THEN
  SET inv.heat = inv.heat - 1
END
IF inv.bullets > 0 THEN
  IF inv.heat < 10 THEN
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
      FIRE
      SET inv.bullets = inv.bullets - 1
      SET inv.heat = inv.heat + 3
    ELSE
      SCAN
    END
    SET _SYS_ORBIT_X = 400
    SET _SYS_ORBIT_Y = 300
    SET _SYS_ORBIT_R = 180
    MOVE
  ELSE
    SET _SYS_STRAFE = 1
    MOVE
  END
ELSE
  SET _SYS_SPEED_MULT = 1.5
  BACKUP
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
      'It tracks quadrants in a dictionary map: { q1: 0, q2: 0, q3: 0, q4: 0 }. It increments the quadrant you are detected in. Over time, it biases its movement to orbit the quadrant with the highest score. It learns where you like to hide.',
    hint: 'If you camp one area, it will lock its orbit onto that zone. Move across the arena to split its neural weights.',
    enemyScript: `IF NOT init THEN
  SET brain = { q1: 0, q2: 0, q3: 0, q4: 0 }
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  IF NEAREST_VISIBLE_X < 400 THEN
    IF NEAREST_VISIBLE_Y < 300 THEN
      SET brain.q1 = brain.q1 + 1
    ELSE
      SET brain.q3 = brain.q3 + 1
    END
  ELSE
    IF NEAREST_VISIBLE_Y < 300 THEN
      SET brain.q2 = brain.q2 + 1
    ELSE
      SET brain.q4 = brain.q4 + 1
    END
  END
  FIRE
END
SET max = brain.q1
SET tgtX = 200
SET tgtY = 150
IF brain.q2 > max THEN
  SET max = brain.q2
  SET tgtX = 600
  SET tgtY = 150
END
IF brain.q3 > max THEN
  SET max = brain.q3
  SET tgtX = 200
  SET tgtY = 450
END
IF brain.q4 > max THEN
  SET max = brain.q4
  SET tgtX = 600
  SET tgtY = 450
END
SET _SYS_ORBIT_X = tgtX
SET _SYS_ORBIT_Y = tgtY
SET _SYS_ORBIT_R = 150
MOVE`,
  },
  {
    id: 'ds-09',
    tabId: 'data-structures',
    order: 9,
    title: 'COMMAND STACK',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'It stores pending actions in a dictionary that simulates a task queue: { task: "NONE", arg: 0 }. If the task is NONE, it evaluates visibility and pushes a task ("BURST" or "STRAFE"). It then executes the task for \`arg\` ticks. An asynchronous event loop.',
    hint: 'When it commits to a task (like BURST for 3 ticks), it cannot abort. Exploit its locked state during long task executions.',
    enemyScript: `IF NOT init THEN
  SET q = { task: "NONE", arg: 0 }
  SET init = 1
END
IF q.task == "NONE" THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    IF distance < 200 THEN
      SET q.task = "BURST"
      SET q.arg = 3
    ELSE
      SET q.task = "STRAFE"
      SET q.arg = 5
    END
  ELSE
    SET q.task = "PATROL"
    SET q.arg = 4
  END
END

IF q.task == "BURST" THEN
  SET _SYS_FACE_X = NEAREST_VISIBLE_X
  SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  BURST_FIRE
  SET _SYS_STRAFE = 1
  MOVE
END
IF q.task == "STRAFE" THEN
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  SET _SYS_STRAFE = -1
  FIRE
  MOVE
END
IF q.task == "PATROL" THEN
  SCAN
  MOVE RIGHT
END

SET q.arg = q.arg - 1
IF q.arg <= 0 THEN
  SET q.task = "NONE"
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
      'The Overlord maintains a central registry dictionary for its subsystems: { sensors: 1, weapon: 1, drive: 1 }. As its health drops, subsystems fail. < 70 HP: drive = 0 (no speed boost). < 40 HP: sensors = 0 (blind sweeps). < 15 HP: weapon overdrive (constant bursts). A boss fight with progressive destruction.',
    hint: 'Subsystems break as it takes damage. Exploit the blind sweeps when health < 40, but beware the weapon overdrive at < 15 HP.',
    enemyScript: `IF NOT init THEN
  SET sys = { sensors: 1, weapon: 1, drive: 1 }
  SET init = 1
END
IF health < 70 THEN
  SET sys.drive = 0
END
IF health < 40 THEN
  SET sys.sensors = 0
END
IF health < 15 THEN
  SET sys.weapon = 2
END

IF sys.drive == 1 THEN
  SET _SYS_SPEED_MULT = 1.8
ELSE
  SET _SYS_SPEED_MULT = 1.0
END

IF sys.sensors == 1 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET _SYS_FACE_X = NEAREST_VISIBLE_X
    SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    IF sys.weapon == 2 THEN
      BURST_FIRE
    ELSE
      FIRE
    END
  ELSE
    SCAN
  END
ELSE
  SET rotation = rotation + 0.2
  IF sys.weapon == 2 THEN
    BURST_FIRE
  ELSE
    FIRE
  END
END

SET _SYS_ORBIT_X = 400
SET _SYS_ORBIT_Y = 300
SET _SYS_ORBIT_R = 140
MOVE`,
  },
];
