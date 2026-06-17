import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const CONDITIONALS_LEVELS: CampaignLevel[] = [
  {
    id: 'cond-01',
    tabId: 'conditionals',
    order: 1,
    title: 'First Steps',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'Basic IF/ELSE conditions',
    description:
      'The bot patrols back and forth. It only stops to shoot when it sees you. Stay out of its sight to avoid getting hit!',
    hints: [
      'It only fires when VISIBLE_ENEMY_COUNT > 0. Approach from behind while it is moving away from you.',
      'The enemy won\'t shoot while moving. Use SCAN to find it early, and attack when it looks away.',
      'Write an IF VISIBLE_ENEMY_COUNT > 0 block: SET rotation = ATAN2(...), FIRE, MOVE. Add an ELSE branch with MOVE RIGHT to close distance when it cannot see you.',
    ],
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
    maxTicks: 900,
    enemyHealth: 80,
    starThresholds: { three: 300, two: 600, one: 900 },
  },
  {
    id: 'cond-02',
    tabId: 'conditionals',
    order: 2,
    title: 'Copycat',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'Using a counter to change behaviors',
    description:
      'This enemy changes what it does every 5 seconds. For 5 seconds it moves left and shoots. Then for 5 seconds it moves right and only scans. Attack when it is scanning!',
    hints: [
      'It changes direction every 5 seconds. Wait for it to move right, then you have 5 safe seconds to attack.',
      'When it moves right, it won\'t shoot for exactly 5 seconds. Rush in, attack, and back away before it turns left again.',
      'Use a counter in your script: SET t = t + 1. On every other 5-tick window, commit to a burst attack. Pattern: wait 5 ticks → attack 5 ticks → repeat.',
    ],
    enemyScript: `IF NOT init THEN
  SET state = 0
  SET tick = 0
  SET init = 1
END
SET tick = tick + 1
IF tick > 50 THEN
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
    maxTicks: 900,
    enemyHealth: 80,
    starThresholds: { three: 300, two: 600, one: 900 },
  },
  {
    id: 'cond-03',
    tabId: 'conditionals',
    order: 3,
    title: 'Double Threat',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Checking distance',
    description:
      'This enemy checks two things before acting: can it see you, and how close are you? If you are within 200 units, it will shoot. If you are further away, it will just walk toward you. Stay far away to stay safe!',
    hints: [
      'Stay beyond 200 units. It will walk straight toward you without shooting, making it easy to hit.',
      'When it walks toward you, it doesn\'t dodge. Shoot once, MOVE sideways to dodge, then shoot again.',
      'Structure: IF VISIBLE_ENEMY_COUNT > 0 THEN check distance. Stay at 250 range: SET rotation = ATAN2(...), FIRE, MOVE LEFT to sidestep.',
    ],
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
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'cond-04',
    tabId: 'conditionals',
    order: 4,
    title: 'Crossfire',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Distance-based reactions',
    description:
      'This bot reacts differently based on how close you are. Very close? It fires heavily. Medium distance? It fires normally. Far away? It slowly moves toward you. Don\'t get too close!',
    hints: [
      'Stay out of the close zone (< 100 units) to avoid heavy fire. Keep your distance around 150-200 units.',
      'At 150-200 range, it moves right while shooting. Aim left to hit where it is going.',
      'Keep distance between 150-200 with: IF distance > 200 THEN MOVE ELSE IF distance < 150 THEN BACKUP END. Then FIRE.',
    ],
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
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'cond-05',
    tabId: 'conditionals',
    order: 5,
    title: 'Survival Instinct',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Health-based behavior',
    description:
      'This enemy changes its strategy based on its health. When healthy, it attacks aggressively. When hurt, it becomes careful. When almost dead, it goes into a crazy desperation mode and circles the map while firing heavily.',
    hints: [
      'At full health, it is predictable. When it drops below 30 HP, it starts circling the center of the arena.',
      'Below 30 HP, it orbits the center. Just stand near its path and fire continuously.',
      'Use a WHILE loop to fire rapidly. When it starts circling (center 400,300), SET rotation toward its path and FIRE.',
    ],
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
    maxTicks: 900,
    enemyHealth: 100,
    starThresholds: { three: 360, two: 600, one: 900 },
  },
  {
    id: 'cond-06',
    tabId: 'conditionals',
    order: 6,
    title: 'Reactive Shield',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Reacting to damage',
    description:
      'Every time you shoot this bot, it switches its behavior. One mode is a simple patrol, and the other mode is a sideways dodge while aiming at you. Use this to your advantage.',
    hints: [
      'Hit it once to make it dodge predictably to the right. Hit it again to put it back into normal patrol mode.',
      'In dodge mode, it always moves RIGHT. Position yourself to the left so it moves into your bullets.',
      'Track hits with a counter: SET hits = hits + 1. On even hits (0,2,4) it will dodge right. Time your attacks!',
    ],
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
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'cond-07',
    tabId: 'conditionals',
    order: 7,
    title: 'Domino Effect',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Checking multiple conditions',
    description:
      'This enemy checks three things: is it close, can it see you, and is its health high? If all are true, it unleashes a deadly attack. Break any of these conditions, and it becomes much weaker.',
    hints: [
      'Keep your distance above 250 to prevent its strongest attack.',
      'When you are far away, it will just walk toward you at a slow speed. You can easily outrun it.',
      'Pattern: FIRE, then BACKUP to stay far away. Use IF distance < 280 THEN BACKUP ELSE MOVE RIGHT END.',
    ],
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
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'cond-08',
    tabId: 'conditionals',
    order: 8,
    title: 'Escalation',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Threat level system',
    description:
      'This bot gets angrier the longer it sees you! If you stay in its sight for too long, it will go crazy and start shooting heavily. Hide behind walls to calm it down.',
    hints: [
      'Its anger drops by 1 every second it doesn\'t see you. Hide for 5 seconds to completely reset it.',
      'Shoot once or twice, then hide. Once it calms down, step out and shoot again.',
      'Use obstacles to break its sight. Pattern: expose for 2 seconds → hide for 6 seconds → repeat.',
    ],
    enemyScript: `IF NOT init THEN
  SET threat = 0
  SET init = 1
END
IF VISIBLE_ENEMY_COUNT > 0 THEN
  IF threat < 50 THEN
    SET threat = threat + 1
  END
  SET rotation = ATAN2(NEAREST_VISIBLE_Y - POSITION_Y, NEAREST_VISIBLE_X - POSITION_X)
ELSE
  IF threat > 0 THEN
    SET threat = threat - 1
  END
END
IF threat >= 50 THEN
  SET _SYS_ORBIT_X = NEAREST_VISIBLE_X
  SET _SYS_ORBIT_Y = NEAREST_VISIBLE_Y
  SET _SYS_ORBIT_R = -80
  SET _SYS_FACE_X = NEAREST_VISIBLE_X
  SET _SYS_FACE_Y = NEAREST_VISIBLE_Y
  BURST_FIRE
  MOVE
ELSE
  IF threat >= 30 THEN
    FIRE
    MOVE
  ELSE
    IF threat >= 10 THEN
      SCAN
      MOVE
    ELSE
      MOVE RIGHT
    END
  END
END`,
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'cond-09',
    tabId: 'conditionals',
    order: 9,
    title: 'Elite Guardian',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Energy and multiple conditions',
    description:
      'This advanced enemy checks your distance, its health, and its energy before attacking. The attack is extremely strong, but only happens if it has enough energy. Drain its energy to weaken it.',
    hints: [
      'Stay far away (> 200). At this distance, it can only shoot normally or scan, which wastes its energy.',
      'Once its health drops below 40, it will start backing up. Use this chance to rush in.',
      'Phase 1: stay at 250+ range, fire continuously. Phase 2: when it backs up (HP < 40), close in and finish it.',
    ],
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
    maxTicks: 1500,
    enemyHealth: 150,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
  {
    id: 'cond-10',
    tabId: 'conditionals',
    order: 10,
    title: 'Commander Alpha',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Checking multiple advanced conditions',
    description:
      'The Boss checks everything: can it see you? How close are you? How much health does it have? What phase is it in? If all conditions are met, it circles you very fast and shoots heavily. Otherwise, it uses weaker attacks. Its behavior changes constantly based on your actions.',
    hints: [
      'It follows a 10-second loop. For the first 3 seconds, it focuses on defense. Use this time to attack!',
      'During those 3 defensive seconds, it moves backward. After that, it tries to circle you. Use your strongest attacks while it is moving backward.',
      'Count ticks: SET t = t + 1. On t%10 < 3 (phases 0-2), attack relentlessly. On t%10 >= 3, retreat to 160+ range to break its attack.',
    ],
    enemyScript: `IF NOT init THEN
  SET phase = 0
  SET init = 1
END
SET phase = phase + 1
IF phase > 99 THEN
  SET phase = 0
  END
IF phase < 30 THEN
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
    maxTicks: 1500,
    enemyHealth: 180,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
];
