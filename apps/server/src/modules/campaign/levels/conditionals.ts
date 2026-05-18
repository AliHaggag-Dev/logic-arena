import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const CONDITIONALS_LEVELS: CampaignLevel[] = [
  {
    id: 'cond-01',
    tabId: 'conditionals',
    order: 1,
    title: 'BINARY REFLEX',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    description:
      'The sentry has two modes: PATROL and ENGAGE. While no threat is detected, it marches right at constant speed. The instant its sensors detect presence, it halts and fires a single shot. It then resumes patrol. A binary gate — exactly one condition separates peace from violence.',
    hint: 'It only fires when VISIBLE_ENEMY_COUNT > 0. Approach from outside its FOV cone, then strike while it patrols rightward.',
    enemyScript: `IF NOT init THEN
  SET dir = 0
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  FIRE
ELSE
  IF dir == 0 THEN
    MOVE RIGHT
    IF POSITION_X > 750 THEN
      SET dir = 1
    END
  ELSE
    MOVE LEFT
    IF POSITION_X < 50 THEN
      SET dir = 0
    END
  END
END`,
  },
  {
    id: 'cond-02',
    tabId: 'conditionals',
    order: 2,
    title: 'MIRROR PROTOCOL',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    description:
      'This unit alternates between two states every 5 ticks: LEFT-PATROL and RIGHT-PATROL. During LEFT-PATROL it moves left and fires if it sees you. During RIGHT-PATROL it moves right and scans. Its mirror symmetry is its armour — but symmetry has a fixed period.',
    hint: 'The state flips every 5 ticks. After it fires while moving left, it will move right for 5 ticks without firing. Strike during RIGHT-PATROL.',
    enemyScript: `IF NOT init THEN
  SET state = 0
  SET tick = 0
  SET init = 1
END
SET tick = tick + 1
IF tick > 5 THEN
  SET tick = 0
  IF state == 0 THEN
    SET state = 1
  ELSE
    SET state = 0
  END
END
IF state == 0 THEN
  MOVE LEFT
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  END
ELSE
  MOVE RIGHT
  SCAN
END`,
  },
  {
    id: 'cond-03',
    tabId: 'conditionals',
    order: 3,
    title: 'SENTINEL OVERRIDE',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'The Sentinel evaluates two conditions before acting: visibility AND distance. If it sees you AND you are within 200 units, it fires and strafes left. If it sees you but you are far, it advances. If it sees nothing, it patrols right. Two nested branches — two layers of logic to exploit.',
    hint: 'Stay beyond 200 units while visible to bait its advance branch. It moves toward you predictably — fire as it approaches.',
    enemyScript: `IF NOT init THEN
  SET state = 0
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  IF distance < 200 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
    SET _SYS_STRAFE = -1
    MOVE
  ELSE
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    MOVE
  END
ELSE
  MOVE RIGHT
END`,
  },
  {
    id: 'cond-04',
    tabId: 'conditionals',
    order: 4,
    title: 'FORKED JUDGMENT',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'It evaluates three distance thresholds in sequence: < 100 triggers BURST_FIRE and retreat, < 200 triggers single FIRE with strafe, and > 200 triggers cautious advance. A three-branch decision tree that punishes close-range approaches with maximum firepower.',
    hint: 'The BURST_FIRE zone (< 100 units) is lethal. Maintain 150-200 range to trigger the single-fire branch, which has a strafe you can predict.',
    enemyScript: `IF NOT init THEN
  SET state = 0
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  IF distance < 100 THEN
    BURST_FIRE
    BACKUP
  ELSE
    IF distance < 200 THEN
      FIRE
      SET _SYS_STRAFE = 1
      MOVE
    ELSE
      SET _SYS_SPEED_MULT = 0.5
      MOVE
    END
  END
ELSE
  SET _SYS_SPEED_MULT = 1
  SCAN
  MOVE RIGHT
END`,
  },
  {
    id: 'cond-05',
    tabId: 'conditionals',
    order: 5,
    title: 'THRESHOLD GATE',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    description:
      'The gate evaluates health as a modifier. Above 60 HP it fights aggressively with FIRE + advance. Between 30-60 HP it becomes cautious — fires then retreats. Below 30 HP it enters desperation mode: BURST_FIRE while orbiting the arena center. Health is the key that unlocks each behavior gate.',
    hint: 'At full health it is aggressive but predictable. Chip it below 30 HP — desperation mode uses a fixed orbit radius you can predict and counter.',
    enemyScript: `IF NOT init THEN
  SET state = 0
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  IF health > 60 THEN
    FIRE
    MOVE
  ELSE
    IF health > 30 THEN
      FIRE
      BACKUP
    ELSE
      SET _SYS_ORBIT_X = 400
      SET _SYS_ORBIT_Y = 300
      SET _SYS_ORBIT_R = 120
      BURST_FIRE
      MOVE
    END
  END
ELSE
  SCAN
  MOVE RIGHT
END`,
  },
  {
    id: 'cond-06',
    tabId: 'conditionals',
    order: 6,
    title: 'POLARITY SWITCH',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It maintains a polarity flag that flips every time it takes damage (health drops below prev_health). Polarity 0: it patrols and fires on sight. Polarity 1: it strafes right while aiming its FOV at your last position — decoupled movement and aim. The polarity echo delays its response by exactly one damage event.',
    hint: 'Polarity 1 makes it strafe predictably. Hit it once to flip polarity, then exploit the strafe pattern before the next flip.',
    enemyScript: `IF NOT init THEN
  SET pol = 0
  SET prev_hp = 100
  SET init = 1
END
IF health < prev_hp THEN
  IF pol == 0 THEN
    SET pol = 1
  ELSE
    SET pol = 0
  END
END
SET prev_hp = health
IF pol == 0 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
    MOVE
  ELSE
    SCAN
    MOVE RIGHT
  END
ELSE
  SET _SYS_FACE_X = NEAREST_VISIBLE_X
  SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
  SET _SYS_STRAFE = 1
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    FIRE
  END
  MOVE
END`,
  },
  {
    id: 'cond-07',
    tabId: 'conditionals',
    order: 7,
    title: 'CASCADE REACTOR',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'Three nested conditions cascade: (1) Is enemy visible? (2) Is distance < 250? (3) Is my health > 50? All three true: orbit + BURST_FIRE. Two true: strafe-fire. One true: cautious advance. None: fast patrol. A 3-deep decision tree — 4 distinct behaviors, only one is truly dangerous.',
    hint: 'The orbit + BURST_FIRE branch requires ALL three conditions. Keep your distance above 250 to cut off the most lethal branch.',
    enemyScript: `IF NOT init THEN
  SET state = 0
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  IF distance < 250 THEN
    IF health > 50 THEN
      SET _SYS_ORBIT_X = NEAREST_VISIBLE_X
      SET _SYS_ORBIT_Y = NEAREST_VISIBLE_Y
      SET _SYS_ORBIT_R = 100
      SET _SYS_FACE_X = NEAREST_VISIBLE_X
      SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
      BURST_FIRE
      MOVE
    ELSE
      SET _SYS_STRAFE = -1
      FIRE
      MOVE
    END
  ELSE
    SET _SYS_SPEED_MULT = 0.7
    MOVE
  END
ELSE
  SET _SYS_SPEED_MULT = 1.5
  SCAN
  MOVE RIGHT
END`,
  },
  {
    id: 'cond-08',
    tabId: 'conditionals',
    order: 8,
    title: 'DEAD RECKONING',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    description:
      'It tracks a threat_level counter. Each tick it sees you: threat_level += 1 (max 5). Each tick it does not: threat_level -= 1 (min 0). Behavior scales with threat_level: 0 = patrol, 1-2 = cautious scan, 3-4 = aggressive pursuit + fire, 5 = berserker orbit + burst. A bot with memory and momentum.',
    hint: 'threat_level decays by 1 per tick out of sight. Stay hidden for 5 ticks to fully reset it. Attack precisely when threat_level is at 0.',
    enemyScript: `IF NOT init THEN
  SET threat = 0
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  IF threat < 5 THEN
    SET threat = threat + 1
  END
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
ELSE
  IF threat > 0 THEN
    SET threat = threat - 1
  END
END
IF threat >= 5 THEN
  SET _SYS_ORBIT_X = NEAREST_VISIBLE_X
  SET _SYS_ORBIT_Y = NEAREST_VISIBLE_Y
  SET _SYS_ORBIT_R = -80
  SET _SYS_FACE_X = NEAREST_VISIBLE_X
  SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
  BURST_FIRE
  MOVE
ELSE
  IF threat >= 3 THEN
    FIRE
    MOVE
  ELSE
    IF threat >= 1 THEN
      SCAN
      MOVE
    ELSE
      MOVE RIGHT
    END
  END
END`,
  },
  {
    id: 'cond-09',
    tabId: 'conditionals',
    order: 9,
    title: 'QUANTUM OBSERVER',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'It evaluates a 4-deep decision tree every tick using: visibility, distance, health, AND energy. Each variable gates a deeper branch. The deepest branch (all conditions met) triggers speed-boosted orbit with burst fire and FOV lock. Missing ANY condition downgrades to a weaker branch. 16 possible behavior combinations — only careful observation reveals the tree structure.',
    hint: 'The kill branch requires: visible + close + high HP + high energy. Drain its energy by forcing repeated scans, then attack when it falls to a weaker branch.',
    enemyScript: `IF NOT init THEN
  SET state = 0
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  IF distance < 200 THEN
    IF health > 40 THEN
      IF MY_ENERGY > 30 THEN
        SET _SYS_SPEED_MULT = 1.8
        SET _SYS_ORBIT_X = NEAREST_VISIBLE_X
        SET _SYS_ORBIT_Y = NEAREST_VISIBLE_Y
        SET _SYS_ORBIT_R = -90
        SET _SYS_FACE_X = NEAREST_VISIBLE_X
        SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
        BURST_FIRE
        MOVE
      ELSE
        SET _SYS_STRAFE = 1
        FIRE
        MOVE
      END
    ELSE
      SET _SYS_SPEED_MULT = 1.5
      BACKUP
    END
  ELSE
    IF health > 60 THEN
      FIRE
      MOVE
    ELSE
      SCAN
      MOVE RIGHT
    END
  END
ELSE
  SET _SYS_SPEED_MULT = 1
  SCAN
  MOVE RIGHT
END`,
  },
  {
    id: 'cond-10',
    tabId: 'conditionals',
    order: 10,
    title: 'ARBITER PRIME',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    description:
      'The Arbiter runs a priority encoder across 4 dimensions: visibility count, distance, health ratio, and a tick-based phase counter. It evaluates nested IF chains where each outer condition gates the next inner check. The highest priority branch (4-deep) triggers orbiting burst fire with speed boost and independent FOV tracking. Each missing condition drops it one tier. With 5 tiers of behavior that shift based on 4 live variables, predicting its next action requires reading its full decision tree.',
    hint: 'Its phase counter cycles 0-9 every 10 ticks. On phases 0-2 it prioritizes defense regardless of other conditions — that is your attack window.',
    enemyScript: `IF NOT init THEN
  SET phase = 0
  SET init = 1
END
SET phase = phase + 1
IF phase > 9 THEN
  SET phase = 0
END
IF phase < 3 THEN
  SET _SYS_SPEED_MULT = 1.3
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET _SYS_FACE_X = NEAREST_VISIBLE_X
    SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
    FIRE
  END
  BACKUP
ELSE
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    IF distance < 150 THEN
      IF health > 50 THEN
        IF MY_ENERGY > 40 THEN
          SET _SYS_SPEED_MULT = 2
          SET _SYS_ORBIT_X = NEAREST_VISIBLE_X
          SET _SYS_ORBIT_Y = NEAREST_VISIBLE_Y
          SET _SYS_ORBIT_R = 70
          SET _SYS_FACE_X = NEAREST_VISIBLE_X
          SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
          BURST_FIRE
          MOVE
        ELSE
          SET _SYS_STRAFE = -1
          FIRE
          MOVE
        END
      ELSE
        FIRE
        BACKUP
      END
    ELSE
      IF distance < 250 THEN
        FIRE
        MOVE
      ELSE
        MOVE
      END
    END
  ELSE
    SCAN
    MOVE RIGHT
  END
END`,
  },
];
