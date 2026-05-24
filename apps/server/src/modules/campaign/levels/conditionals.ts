import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const CONDITIONALS_LEVELS: CampaignLevel[] = [
  {
    id: 'cond-01',
    tabId: 'conditionals',
    order: 1,
    title: 'SIMPLE PATROL',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'IF/ELSE branching',
    description:
      'The bot has two modes: PATROL and ENGAGE. While no threat is detected, it marches right at constant speed. The instant its sensors detect presence, it halts and fires a single shot. It then resumes patrol. It only attacks when it sees you.',
    hints: [
      'It only fires when VISIBLE_ENEMY_COUNT > 0. Approach from outside its vision cone, then strike while it patrols rightward.',
      'The enemy never fires while patrolling. Use SCAN first to detect it before it detects you — approach from outside its FOV and engage immediately when it moves away.',
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
    title: 'MIRROR SCRIPT',
    difficulty: 'EASY',
    pointsReward: D.EASY,
    conceptTaught: 'State-flipping with tick counter',
    description:
      'This bot alternates between two states every 5 ticks: LEFT-PATROL and RIGHT-PATROL. During LEFT-PATROL it moves left and fires if it sees you. During RIGHT-PATROL it moves right and scans. You can easily beat it by attacking when it is moving away.',
    hints: [
      'The state flips every 5 ticks. After it fires while moving left, it will move right for 5 ticks without firing. Strike during RIGHT-PATROL.',
      'Count ticks mentally: once it starts RIGHT-PATROL (moving right), you have exactly 5 ticks of no fire. Approach aggressively during those 5 ticks and retreat before it flips back.',
      'Use a counter in your script: SET t = t + 1. On every other 5-tick window, commit to a burst attack. Pattern: wait 5 ticks → attack 5 ticks → repeat.',
    ],
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
    maxTicks: 900,
    enemyHealth: 80,
    starThresholds: { three: 300, two: 600, one: 900 },
  },
  {
    id: 'cond-03',
    tabId: 'conditionals',
    order: 3,
    title: 'DOUBLE CHECK',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Nested IF with distance threshold',
    description:
      'The Enemy bot evaluates two conditions before acting: visibility AND distance. If it sees you AND you are within 200 units, it fires and strafes left. If it sees you but you are far, it advances. If it sees nothing, it patrols right. It checks two things before acting.',
    hints: [
      'Stay beyond 200 units while visible to bait its advance branch. It moves toward you predictably — fire as it approaches.',
      'The advance branch has no strafe — the enemy moves straight at you. Use this to predict its path exactly. Fire once, MOVE perpendicular to dodge, then fire again.',
      'Structure: IF VISIBLE_ENEMY_COUNT > 0 THEN check distance. Stay at 250 range: SET rotation = ATAN2(...), FIRE, MOVE LEFT to sidestep its linear advance.',
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
    title: 'TRIPLE THREAT',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Three-branch distance-based decision tree',
    description:
      'It evaluates three distance thresholds in sequence: < 100 triggers BURST_FIRE and retreat, < 200 triggers single FIRE with strafe, and > 200 triggers cautious advance. It punishes close-range attacks with heavy fire.',
    hints: [
      'The BURST_FIRE zone (< 100 units) is lethal. Maintain 150-200 range to trigger the single-fire branch, which has a strafe you can predict.',
      'At 150-200 range it strafes right while firing. Lead your shots to the left — where it strafes into. You can sustain fire at this distance safely while dodging its single shots.',
      'Keep distance between 150-200 with: IF distance > 200 THEN MOVE ELSE IF distance < 150 THEN BACKUP END. Then SET rotation = ATAN2(...), FIRE each tick at this optimal range.',
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
    title: 'HEALTH MODES',
    difficulty: 'MEDIUM',
    pointsReward: D.MEDIUM,
    conceptTaught: 'Health-gated behavior phases',
    description:
      'The gate evaluates health as a modifier. Above 60 HP it fights aggressively with FIRE + advance. Between 30-60 HP it becomes cautious — fires then retreats. Below 30 HP it enters desperation mode: BURST_FIRE while orbiting the arena center. Chip away its health to see it change tactics.',
    hints: [
      'At full health it is aggressive but predictable. Chip it below 30 HP — desperation mode uses a fixed orbit radius you can predict and counter.',
      'Below 30 HP it orbits the arena center at radius 120. Position yourself on the orbit circle and fire continuously — it will rotate into your shots.',
      'To force it to desperation quickly: use a WHILE loop to fire rapidly. Then when it starts orbiting (center 400,300), SET rotation toward that orbit path and FIRE at a fixed angle.',
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
    title: 'DAMAGE TOGGLE',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Damage-triggered defense mode toggle',
    description:
      'It maintains a defense mode flag that flips every time it takes damage (health drops below prev_health). Defense mode 0: it patrols and fires on sight. Defense mode 1: it strafes right while aiming its FOV at your last position — decoupled movement and aim. The defense mode echo delays its response by exactly one damage event.',
    hints: [
      'Defense mode 1 makes it strafe predictably. Hit it once to flip defense mode, then exploit the strafe pattern before the next flip.',
      'In defense mode 1 it strafes RIGHT continuously. Position yourself to the left — it strafes into your fire. Hit it a second time to flip back to defense mode 0 (patrol mode), then finish it quickly.',
      'Track damage hits with a counter: SET hits = hits + 1 before firing. On even hits (0,2,4) it will be in defense mode 1 (strafe right). Time your burst attacks for these windows.',
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
    title: 'CHAIN REACTION',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Three-level nested conditional logic',
    description:
      'Three nested conditions cascade: (1) Is enemy visible? (2) Is distance < 250? (3) Is my health > 50? All three true: orbit + BURST_FIRE. Two true: strafe-fire. One true: cautious advance. None: fast patrol. It has 4 distinct behaviors.',
    hints: [
      'The orbit + BURST_FIRE branch requires ALL three conditions. Keep your distance above 250 to cut off the most lethal branch.',
      'At distance > 250 it can only FIRE + advance (no burst, no orbit). Maintain 300 range. It approaches at 0.7 speed — you can consistently outrun it while landing shots.',
      'Pattern: SET rotation = ATAN2(...), FIRE, then BACKUP to maintain >250 distance. Use IF distance < 280 THEN BACKUP ELSE MOVE RIGHT END to hold the optimal engagement envelope.',
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
    title: 'THREAT LEVEL',
    difficulty: 'HARD',
    pointsReward: D.HARD,
    conceptTaught: 'Threat level accumulator with decay',
    description:
      'It tracks a threat_level counter. Each tick it sees you: threat_level += 1 (max 5). Each tick it does not: threat_level -= 1 (min 0). Behavior scales with threat_level: 0 = patrol, 1-2 = cautious scan, 3-4 = aggressive pursuit + fire, 5 = berserker orbit + burst. It remembers you even when you hide.',
    hints: [
      'threat_level decays by 1 per tick out of sight. Stay hidden for 5 ticks to fully reset it. Attack precisely when threat_level is at 0.',
      'After every 1-2 shots, break line of sight for 5+ ticks. The decay brings it back to patrol (level 0). Then you can step out and engage at maximum disadvantage to it.',
      'Use obstacles or arena corners to break LOS. Pattern: expose for 2 ticks (fire 2x) → hide for 6 ticks (full decay) → repeat. This keeps threat_level from ever reaching 3.',
    ],
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
    maxTicks: 1200,
    enemyHealth: 120,
    starThresholds: { three: 480, two: 780, one: 1200 },
  },
  {
    id: 'cond-09',
    tabId: 'conditionals',
    order: 9,
    title: 'ADVANCED BOT',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: '4-deep nested conditional with energy gating',
    description:
      'It evaluates a 4-deep decision tree every tick using: visibility, distance, health, AND energy. Each variable gates a deeper branch. The deepest branch (all conditions met) triggers speed-boosted orbit with burst fire and FOV lock. Missing ANY condition downgrades to a weaker branch. It has many different ways to react.',
    hints: [
      'The kill branch requires: visible + close + high HP + high energy. Drain its energy by forcing repeated scans, then attack when it falls to a weaker branch.',
      'Stay visible but at distance > 200. At this range it cannot enter the inner high-health branch — it can only fire or scan. Use this outer zone to chip its HP below 40 safely.',
      'Phase 1: stay at 250+ range, fire continuously (it only gets single-fire). Phase 2: when you see it backing up (HP < 40), close in — it uses BACKUP at low HP, predictable movement.',
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
    title: 'THE BOSS BOT',
    difficulty: 'EXTREME',
    pointsReward: D.EXTREME,
    conceptTaught: 'Phase-counter gated priority encoder',
    description:
      'The Arbiter runs a priority encoder across 4 dimensions: visibility count, distance, health ratio, and a tick-based phase counter. It evaluates nested IF chains where each outer condition gates the next inner check. The highest priority branch (4-deep) triggers orbiting burst fire with speed boost and independent FOV tracking. Each missing condition drops it one tier. It has 5 different behaviors that change constantly.',
    hints: [
      'Its phase counter cycles 0-9 every 10 ticks. On phases 0-2 it prioritizes defense regardless of other conditions — that is your attack window.',
      'Phases 0-2: it backs up at 1.3x speed and fires defensively. These 3 ticks repeat every 10 ticks. At phase 3+ it tries to orbit. Land your heaviest burst during phases 0-2.',
      'Count ticks: SET t = t + 1. On t%10 < 3 (phases 0-2), attack relentlessly — BURST_FIRE or rapid FIRE. On t%10 >= 3, retreat to 160+ range to break its orbit conditions.',
    ],
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
    maxTicks: 1500,
    enemyHealth: 180,
    starThresholds: { three: 600, two: 1000, one: 1500 },
  },
];
