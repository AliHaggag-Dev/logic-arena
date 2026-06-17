import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const LOOPS_LEVELS: CampaignLevel[] = [
  {
    id: 'loop-01',
    tabId: 'loops',
    order: 1,
    title: 'Rhythm',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'Timing your attacks',
    description:
      'This enemy fires 5 shots, then pauses to move right for 3 seconds. It repeats this pattern forever like a heartbeat. Attack during the pause!',
    hints: [
      'The 3-second pause after it shoots 5 times is your chance. Attack then!',
      'Count the enemy\'s shots. After the 5th shot, it will move without shooting. Rush in!',
      'Use a counter: SET t = t + 1. IF t > 8 THEN SET t = 0 END. IF t > 5 THEN FIRE END ELSE MOVE END. Time your FIRE commands to ticks 6-8.',
    ],
    enemyScript: `IF NOT init THEN
  SET i = 0
  SET init = 1
END
IF i < 5 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  ELSE
    SCAN
  END
  SET i = i + 1
ELSE
  IF i < 35 THEN
    MOVE RIGHT
    SET i = i + 1
  ELSE
    SET i = 0
  END
END`,
    maxTicks: 900,
    enemyHealth: 80,
    starThresholds: { three: 300, two: 600, one: 900 },
  },
  {
    id: 'loop-02',
    tabId: 'loops',
    order: 2,
    title: 'Patrol Route',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'Moving between points',
    description:
      'This bot patrols back and forth between two points. It only fires when it reaches one of its stops. It won\'t shoot while moving between them.',
    hints: [
      'It only shoots at its two stopping points. Stay away from them to avoid getting hit.',
      'While moving, it is completely harmless. Stand in the middle and attack it as it passes by.',
      'Use MOVE to intercept its path and fire continuously: IF VISIBLE_ENEMY_COUNT > 0 THEN SET rotation = ATAN2(...), FIRE END, MOVE.',
    ],
    enemyScript: `IF NOT init THEN
  SET phase = 0
  SET init = 1
END
IF phase == 0 THEN
  SET _SYS_TARGET_X = 200
  SET _SYS_TARGET_Y = 300
  IF _SYS_AT_TARGET == 1 THEN
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
      FIRE
    END
    SET phase = 1
    SET _SYS_AT_TARGET = 0
  ELSE
    MOVE
  END
ELSE
  SET _SYS_TARGET_X = 600
  SET _SYS_TARGET_Y = 300
  IF _SYS_AT_TARGET == 1 THEN
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
      FIRE
    END
    SET phase = 0
    SET _SYS_AT_TARGET = 0
  ELSE
    MOVE
  END
END`,
    maxTicks: 900,
    enemyHealth: 80,
    starThresholds: { three: 300, two: 600, one: 900 },
  },
  {
    id: 'loop-03',
    tabId: 'loops',
    order: 3,
    title: 'Vortex',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Changing direction',
    description:
      'This enemy circles the center of the map. Every 8 seconds, it changes direction. When spinning clockwise, it shoots. When spinning counter-clockwise, it only scans.',
    hints: [
      'The counter-clockwise phase is your safe window. Count 8 seconds to know when it swaps.',
      'Wait for it to stop shooting and start scanning. That is your 8-second window to attack aggressively.',
      'Track the enemy\'s orbit tick: SET myTick = myTick + 1. Every 8 ticks (myTick % 8 == 0) the enemy swaps.',
    ],
    enemyScript: `IF NOT init THEN
  SET tick = 0
  SET orbitDir = 1
  SET init = 1
END
SET tick = tick + 1
IF tick > 80 THEN
  SET tick = 0
  SET orbitDir = orbitDir * -1
END
IF orbitDir > 0 THEN
  SET _SYS_ORBIT_X = 400
  SET _SYS_ORBIT_Y = 300
  SET _SYS_ORBIT_R = 150
ELSE
  SET _SYS_ORBIT_X = 400
  SET _SYS_ORBIT_Y = 300
  SET _SYS_ORBIT_R = -150
END
SET _SYS_FACE_X = 400
SET _SYS_FACE_Y = 300
IF orbitDir > 0 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
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
    id: 'loop-04',
    tabId: 'loops',
    order: 4,
    title: 'Rising Tide',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Increasing attacks',
    description:
      'This bot fires more shots every round. First 1 shot, then 2 shots, then a heavy burst of 3 shots. Between these rounds, it moves and leaves itself open.',
    hints: [
      'The 3rd round is the most dangerous. Hide during it, and attack while it moves between rounds.',
      'It moves right for exactly 1 second between rounds. This is your safest attack window.',
      'The between-round second: shots == round. Use SCAN to track it, and time your FIRE on seconds where shots == round.',
    ],
    enemyScript: `IF NOT init THEN
  SET round = 1
  SET shots = 0
  SET init = 1
END
IF shots < round THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
  ELSE
    SCAN
  END
  SET shots = shots + 1
ELSE
  SET _SYS_STRAFE = 1
  MOVE
  SET round = round + 1
  SET shots = 0
  IF round > 3 THEN
    SET round = 1
  END
END`,
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'loop-05',
    tabId: 'loops',
    order: 5,
    title: 'Hunter',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Searching and bursting',
    description:
      'This bot searches 4 corners of the map. At each corner, it stops and looks around. If it sees you, it shoots a burst of 3 shots. Hide during its scan!',
    hints: [
      'Hide while it scans each corner. If it doesn\'t see you, it won\'t shoot at all.',
      'It scans 360 degrees at each corner. Stay in the center of the arena to avoid its sight.',
      'After shooting 3 times, it moves to the next point. If you get hit, dodge sideways immediately!',
    ],
    enemyScript: `IF NOT init THEN
  SET wp = 0
  SET burstLeft = 0
  SET init = 1
END
IF burstLeft > 0 THEN
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  END
  FIRE
  SET burstLeft = burstLeft - 1
ELSE
  IF wp == 0 THEN
    SET _SYS_TARGET_X = 200
    SET _SYS_TARGET_Y = 150
  END
  IF wp == 1 THEN
    SET _SYS_TARGET_X = 600
    SET _SYS_TARGET_Y = 150
  END
  IF wp == 2 THEN
    SET _SYS_TARGET_X = 600
    SET _SYS_TARGET_Y = 450
  END
  IF wp == 3 THEN
    SET _SYS_TARGET_X = 200
    SET _SYS_TARGET_Y = 450
  END
  IF _SYS_AT_TARGET == 1 THEN
    SET _SYS_SCAN_SWEEP_DEG = 360
    SCAN
    SET _SYS_SCAN_SWEEP_DEG = 0
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      SET burstLeft = 3
    END
    SET wp = wp + 1
    SET _SYS_AT_TARGET = 0
    IF wp > 3 THEN
      SET wp = 0
    END
  ELSE
    MOVE
  END
END`,
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'loop-06',
    tabId: 'loops',
    order: 6,
    title: 'Echo Chamber',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Dodging bursts',
    description:
      'This enemy shoots in increasing bursts: 1 shot, then 2, then 3. Between these bursts, it quickly dodges sideways. Time your attacks during its dodge!',
    hints: [
      'The final burst of 3 shots is deadly. Attack while it is dodging between bursts.',
      'It dodges left for 2 seconds between bursts. This is your safe window to strike.',
      'Track with a counter: SET t = t + 1. Attack on reposition ticks (t%12 == 2, t%12 == 6, t%12 == 11 approximately).',
    ],
    enemyScript: `IF NOT init THEN
  SET outer = 0
  SET inner = 0
  SET repos = 0
  SET init = 1
END
IF outer < 3 THEN
  IF repos > 0 THEN
    SET _SYS_STRAFE = -1
    MOVE
    SET repos = repos - 1
  ELSE
    SET maxInner = outer + 1
    IF inner < maxInner THEN
      IF VISIBLE_ENEMY_COUNT > 0 THEN
        SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
        FIRE
      ELSE
        SCAN
      END
      SET inner = inner + 1
    ELSE
      SET inner = 0
      SET outer = outer + 1
      SET repos = 20
    END
  END
ELSE
  SET outer = 0
END`,
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'loop-07',
    tabId: 'loops',
    order: 7,
    title: 'Decimator',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Getting stronger',
    description:
      'This bot gets stronger the more it sees you! Every time it sees you, it counts. If it sees you 4 times, it goes into a crazy overdrive mode. Don\'t let it see you for too long!',
    hints: [
      'Hide frequently to reset its counter. Stay hidden for 2+ seconds to keep it calm.',
      'The counter only goes up when it sees you. Hide for just 1 second to pause it.',
      'Rhythm: expose for 1 tick → FIRE → hide for 2 ticks. Use: IF t%3 == 0 THEN expose and FIRE ELSE MOVE RIGHT END.',
    ],
    enemyScript: `IF NOT init THEN
  SET sightCount = 0
  SET overdrive = 0
  SET init = 1
END
IF overdrive > 0 THEN
  SET _SYS_SPEED_MULT = 2
  SET _SYS_FACE_X = NEAREST_VISIBLE_X
  SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    BURST_FIRE
  END
  MOVE
  SET overdrive = overdrive - 1
  IF overdrive == 0 THEN
    SET _SYS_SPEED_MULT = 1
  END
ELSE
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    FIRE
    SET sightCount = sightCount + 1
    IF sightCount >= 4 THEN
      SET overdrive = 5
      SET sightCount = 0
    END
    MOVE
  ELSE
    SCAN
    MOVE RIGHT
  END
END`,
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'loop-08',
    tabId: 'loops',
    order: 8,
    title: 'Wavy Path',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Moving in waves',
    description:
      'This bot moves in a wavy, zig-zag pattern. It shoots exactly when it reaches the edge of its wave. Stay in the middle and shoot it while it moves.',
    hints: [
      'It shoots when it is furthest to the left or right. Stay in the center to avoid the shots.',
      'Fire back while it is moving sideways. It moves predictably and won\'t shoot back.',
      'Use second % 10 logic: attack on phases 0-2 and 4-6 (no fire). Back off on phases 3 and 7.',
    ],
    enemyScript: `IF NOT init THEN
  SET tick = 0
  SET init = 1
END
SET phase = tick % 10
IF phase < 3 THEN
  SET _SYS_STRAFE = 1
  MOVE
ELSE
  IF phase == 3 THEN
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
      FIRE
    END
  ELSE
    IF phase < 7 THEN
      SET _SYS_STRAFE = -1
      MOVE
    ELSE
      IF phase == 7 THEN
        IF VISIBLE_ENEMY_COUNT > 0 THEN
          SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
          FIRE
        END
      ELSE
        SET _SYS_ORBIT_X = 400
        SET _SYS_ORBIT_Y = 300
        SET _SYS_ORBIT_R = 100
        MOVE
      END
    END
  END
END
SET tick = tick + 1`,
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'loop-09',
    tabId: 'loops',
    order: 9,
    title: 'Convergence',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Countdown to frenzy',
    description:
      'This enemy counts down to a deadly frenzy. After 3 seconds, it goes crazy, moving fast and shooting heavily for 3 seconds. Survive the frenzy, then attack!',
    hints: [
      'The crazy frenzy starts at second 3 and lasts for 3 seconds. Hide or survive, then attack.',
      'After the frenzy, it completely stops for 1 second to reset. This is your perfect opening!',
      'Rhythm: attack seconds 1-2, dodge seconds 3-5, attack second 6 (reset window), repeat.',
    ],
    enemyScript: `IF NOT init THEN
  SET a = 0
  SET b = 60
  SET frenzy = 0
  SET init = 1
END
IF frenzy > 0 THEN
  SET _SYS_SPEED_MULT = 2
  SET _SYS_FACE_X = NEAREST_VISIBLE_X
  SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
  IF VISIBLE_ENEMY_COUNT > 0 THEN
    SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
    BURST_FIRE
  END
  SET _SYS_STRAFE = 1
  MOVE
  SET frenzy = frenzy - 1
  IF frenzy == 0 THEN
    SET _SYS_SPEED_MULT = 1
    SET a = 0
    SET b = 60
  END
ELSE
  IF a < b THEN
    SET a = a + 1
    SET b = b - 1
    IF VISIBLE_ENEMY_COUNT > 0 THEN
      SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
      FIRE
      MOVE
    ELSE
      SCAN
      MOVE RIGHT
    END
  ELSE
    SET frenzy = 30
  END
END`,
    maxTicks: 1500,
    enemyHealth: 150,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
  {
    id: 'loop-10',
    tabId: 'loops',
    order: 10,
    title: 'Endless Foe',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Evolving enemy',
    description:
      'This boss evolves and gets stronger every time it hits you 3 times! It permanently upgrades its attacks and speed. Don\'t get hit, or it will become impossible to beat.',
    hints: [
      'It only evolves if it hits you 3 times. Dodge its shots to keep it in its weakest form.',
      'If you dodge well, it stays weak. Strafe sideways to easily dodge its basic attacks.',
      'Rush strategy: Use BURST_FIRE immediately to kill it fast. IF VISIBLE_ENEMY_COUNT > 0 THEN SET rotation = ATAN2(...), BURST_FIRE, MOVE END.',
    ],
    enemyScript: `IF NOT init THEN
  SET hitCounter = 0
  SET evolution = 0
  SET prevEnemyHp = 100
  SET init = 1
END
SET enemies = GET_ALL_VISIBLE_ENEMIES()
SET len = LENGTH(enemies)
IF len > 0 THEN
  SET curHp = enemies[0][3]
  IF curHp < prevEnemyHp THEN
    SET hitCounter = hitCounter + 1
    IF hitCounter >= 3 THEN
      SET hitCounter = 0
      IF evolution < 3 THEN
        SET evolution = evolution + 1
      END
    END
  END
  SET prevEnemyHp = curHp
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
  IF evolution == 0 THEN
    FIRE
    MOVE
  ELSE
    IF evolution == 1 THEN
      SET _SYS_STRAFE = 1
      FIRE
      MOVE
    ELSE
      IF evolution == 2 THEN
        SET _SYS_ORBIT_X = NEAREST_VISIBLE_X
        SET _SYS_ORBIT_Y = NEAREST_VISIBLE_Y
        SET _SYS_ORBIT_R = 120
        SET _SYS_FACE_X = NEAREST_VISIBLE_X
        SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
        BURST_FIRE
        MOVE
      ELSE
        SET _SYS_SPEED_MULT = 1.8
        SET _SYS_ORBIT_X = NEAREST_VISIBLE_X
        SET _SYS_ORBIT_Y = NEAREST_VISIBLE_Y
        SET _SYS_ORBIT_R = -80
        SET _SYS_FACE_X = NEAREST_VISIBLE_X
        SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
        BURST_FIRE
        MOVE
      END
    END
  END
ELSE
  SCAN
  MOVE RIGHT
END`,
    maxTicks: 1500,
    enemyHealth: 180,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
];
