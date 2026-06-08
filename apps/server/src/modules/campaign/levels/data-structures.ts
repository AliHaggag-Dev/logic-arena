import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const DATA_STRUCTURES_LEVELS: CampaignLevel[] = [
  {
    id: 'ds-01',
    tabId: 'data-structures',
    order: 1,
    title: 'Alpha State',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Changing states',
    description:
      'This enemy has two states: Patrol and Engage. It patrols the center until it sees you, then switches to Engage mode, shooting 3 times before returning to patrol. Learn its pattern!',
    hints: [
      'After shooting 3 times in Engage mode, it returns to Patrol mode. This transition is your safe window.',
      'It cannot fire while transitioning back to its patrol orbit. Attack during this pause!',
      'Pattern: dodge its 3 shots, then attack while it returns to patrol. Repeat this dodge-3, attack-1 cycle.',
    ],
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
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'ds-02',
    tabId: 'data-structures',
    order: 2,
    title: 'The Setup',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Reading configurations',
    description:
      'This bot relies on a strict setup: it always moves fast and strafes left. Because it always moves left, you can predict exactly where it will be.',
    hints: [
      'It constantly strafes to its left at high speed. Aim where it is going to be.',
      'Lead your shots to the left side of its current position — it will move right into your fire.',
      'Counter-tactic: you also strafe left. Stay slightly ahead of it. Use: SET _SYS_STRAFE = -1, MOVE, then FIRE.',
    ],
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
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'ds-03',
    tabId: 'data-structures',
    order: 3,
    title: 'Counter Attack',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Tracking visibility',
    description:
      'This enemy tracks how often it sees you. If it sees you a lot, it starts orbiting and attacking aggressively. If you hide frequently, it stays confused and just strafes around.',
    hints: [
      'Keep its sighting ratio low. Hide behind cover frequently to keep it in its weak strafe mode.',
      'If you are visible more than half the time, it orbits. Hide for 1 second for every second you are visible.',
      'Strategy: hide behind an obstacle for 2 seconds, peek and fire for 1 second, hide for 2 again. It will stay confused.',
    ],
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
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'ds-04',
    tabId: 'data-structures',
    order: 4,
    title: 'Phase Shift',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Locking coordinates',
    description:
      'This bot has a 3-step plan: 1. Lock your current position. 2. Move to that position. 3. Unleash a heavy burst attack exactly there. Move away after it locks on!',
    hints: [
      'It locks your coordinates, then travels there. Move away from your old position; it will fire at a ghost.',
      'You have the entire time it takes to travel to reposition yourself safely.',
      'Counter-tactic: stand still to let it lock your position, then immediately MOVE to the opposite corner. It will fire at empty space.',
    ],
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
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'ds-05',
    tabId: 'data-structures',
    order: 5,
    title: 'Nemesis',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Tracking your speed',
    description:
      'This bot tracks your speed! If you rush towards it, it backs away quickly. If you run away, it chases you down. Keep your distance steady to confuse it.',
    hints: [
      'It reacts to your approach speed. Move sideways (strafe) instead of forward or backward.',
      'If you close the distance too fast, it backs up. If you flee, it charges. Keep your distance steady.',
      'Move sideways to keep your distance constant. This triggers its weakest mode. Use: SET _SYS_STRAFE = 1, MOVE, FIRE.',
    ],
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
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'ds-06',
    tabId: 'data-structures',
    order: 6,
    title: 'Dual Threat',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Attack and defense modes',
    description:
      'This enemy watches two things: your health and its health. If you are weak, it attacks aggressively. If you damage it enough, it panics and backs away.',
    hints: [
      'If you damage it to below half health, it enters a defensive panic mode and backs away.',
      'When it backs up, it moves predictably AWAY from you. Chase it aggressively while it retreats.',
      'Trigger panic mode early: hit it quickly. Then chase it while continuously firing. IF distance > 150 THEN MOVE ELSE BACKUP END.',
    ],
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
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'ds-07',
    tabId: 'data-structures',
    order: 7,
    title: 'The Hoarder',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Heat and ammo management',
    description:
      'This bot has a limited ammo clip and an overheating gun. If it shoots too fast, its gun overheats and it must stop to cool down. If it runs out of ammo entirely, it flees!',
    hints: [
      'Make it fire rapidly to build up heat and force a cooldown window.',
      'If it fires 4 shots rapidly, its gun overheats. It will then stop firing for 3 seconds to cool down. Attack then!',
      'After 4 rapid shots, attack for 3 seconds. Repeat: bait 4 shots, attack for 3. After 15 total shots, it runs out of ammo and flees.',
    ],
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
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'ds-08',
    tabId: 'data-structures',
    order: 8,
    title: 'Neural Net',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Learning your hiding spots',
    description:
      'This smart boss learns where you like to hide! It maps the arena into 4 corners and counts how often it sees you in each. It will then guard your favorite corner.',
    hints: [
      'If you camp in one area, it will lock its orbit onto that zone. Move across the arena to confuse it.',
      'Move between at least 3 different corners regularly so it doesn\'t know where to guard.',
      'Exploit the lag: after you move to a new corner, it takes time for it to realize. Attack from the new corner while it still guards the old one.',
    ],
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
    maxTicks: 1500,
    enemyHealth: 150,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
  {
    id: 'ds-09',
    tabId: 'data-structures',
    order: 9,
    title: 'Command Chain',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Queueing actions',
    description:
      'This enemy plans its actions in advance. Once it decides to burst-fire for 3 seconds or patrol for 4 seconds, it cannot stop or change its mind. Take advantage of its commitments.',
    hints: [
      'When it commits to a task, it cannot abort. Exploit its locked state during long actions.',
      'Its patrol task lasts for 4 seconds without firing. Stay far away to bait it into patrolling, then strike.',
      'Distance manipulation: stay far away so it chooses to patrol. Hide immediately after it finishes shooting to force 4 safe seconds.',
    ],
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
    maxTicks: 1500,
    enemyHealth: 150,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
  {
    id: 'ds-10',
    tabId: 'data-structures',
    order: 10,
    title: 'The Overlord',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Breaking subsystems',
    description:
      'The ultimate boss! As you damage it, its systems break down. First, it loses its speed boost. Then, it goes blind and spins wildly. Finally, it unleashes a desperate, non-stop barrage of fire.',
    hints: [
      'Subsystems break as it takes damage. Exploit its blind phase, but beware the final overdrive.',
      'When it goes blind, it spins and fires randomly. Move sideways around it to avoid the spray.',
      'Danger zone: at very low health, it burst-fires constantly. Try to deal the final burst of damage quickly while it is still in its blind phase.',
    ],
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
    maxTicks: 1500,
    enemyHealth: 180,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
];
