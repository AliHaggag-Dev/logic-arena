import type { CampaignLevel } from '../campaign.constants';

const D = { EASY: 50, MEDIUM: 120, HARD: 300, EXTREME: 500 } as const;

export const CONDITIONALS_LEVELS: CampaignLevel[] = [
  {
    id: 'cond-01', tabId: 'conditionals', order: 1, title: 'BINARY REFLEX',
    difficulty: 'EASY', pointsReward: D.EASY,
    description: 'Two states: advance or annihilate. When sensors detect nothing, it marches right. When it senses presence, it fires twice. Predict its binary mind.',
    hint: 'Use SCAN first. If > 0, fire preemptively before it shoots you.',
    enemyScript: `SET x = SCAN\nIF x > 0\n  FIRE\n  FIRE\nELSE\n  MOVE RIGHT\nEND`,
  },
  {
    id: 'cond-02', tabId: 'conditionals', order: 2, title: 'MIRROR PROTOCOL',
    difficulty: 'EASY', pointsReward: D.EASY,
    description: 'This unit mirrors your position. It probes left, then right, firing on each axis. Its symmetry is its armor. Disrupt the mirror.',
    hint: 'Strike while it moves between positions. It fires after repositioning, not before.',
    enemyScript: `MOVE LEFT\nFIRE\nMOVE RIGHT\nFIRE\nMOVE RIGHT\nFIRE`,
  },
  {
    id: 'cond-03', tabId: 'conditionals', order: 3, title: 'SENTINEL OVERRIDE',
    difficulty: 'MEDIUM', pointsReward: D.MEDIUM,
    description: 'The Sentinel scans before every decision. Detection triggers a triple burst and retreat. Empty scans cause a double advance. It never wastes ammunition.',
    hint: 'Time strikes during its ELSE branch when it repositions right.',
    enemyScript: `SET found = SCAN\nIF found > 0\n  FIRE\n  FIRE\n  FIRE\n  MOVE LEFT\nELSE\n  MOVE RIGHT\n  MOVE RIGHT\nEND`,
  },
  {
    id: 'cond-04', tabId: 'conditionals', order: 4, title: 'FORKED JUDGMENT',
    difficulty: 'MEDIUM', pointsReward: D.MEDIUM,
    description: 'It evaluates two scan values. If the first returns positive, it bursts. If only the second is positive, it repositions and fires once. Both empty? Full advance. A three-branched mind.',
    hint: 'It scans twice sequentially. Dodge the first scan, then strike during the third branch.',
    enemyScript: `SET a = SCAN\nSET b = SCAN\nIF a > 0\n  FIRE\n  FIRE\n  FIRE\nELSE\n  IF b > 0\n    MOVE LEFT\n    FIRE\n  ELSE\n    MOVE RIGHT\n    MOVE RIGHT\n    MOVE RIGHT\n  END\nEND`,
  },
  {
    id: 'cond-05', tabId: 'conditionals', order: 5, title: 'THRESHOLD GATE',
    difficulty: 'MEDIUM', pointsReward: D.MEDIUM,
    description: 'It calculates a threat score from two scans added together. If the combined threat exceeds 1, it enters overdrive mode — four rapid shots. Under threshold, it patrols. Tip the scales.',
    hint: 'When both scans return 0, it just moves right. Position to make both scans fail.',
    enemyScript: `SET a = SCAN\nSET b = SCAN\nSET threat = a + b\nIF threat > 1\n  FIRE\n  FIRE\n  FIRE\n  FIRE\nELSE\n  IF threat > 0\n    FIRE\n    MOVE LEFT\n  ELSE\n    MOVE RIGHT\n  END\nEND`,
  },
  {
    id: 'cond-06', tabId: 'conditionals', order: 6, title: 'POLARITY SWITCH',
    difficulty: 'HARD', pointsReward: D.HARD,
    description: 'It maintains a polarity flag. Scan positive: it sets polarity to 1 and fires. Scan negative: polarity flips and it retreats. After processing, if polarity is 1, it fires again. A delayed echo of violence.',
    hint: 'Exploit the polarity echo — after a scan miss, its polarity is 0 and it skips the final fire. Stay invisible until the echo pass.',
    enemyScript: `SET pol = 0\nSET x = SCAN\nIF x > 0\n  SET pol = 1\n  FIRE\n  FIRE\nELSE\n  SET pol = 0\n  MOVE LEFT\nEND\nIF pol > 0\n  FIRE\n  MOVE RIGHT\nEND`,
  },
  {
    id: 'cond-07', tabId: 'conditionals', order: 7, title: 'CASCADE REACTOR',
    difficulty: 'HARD', pointsReward: D.HARD,
    description: 'Three nested conditionals, each dependent on the last. First scan sets alertLevel. Second scan confirms. Third determines fire or retreat. A cascading chain of logical gates that funnels into devastation.',
    hint: 'The cascade requires all three scans positive for max damage. Break the chain at level 2 by repositioning between scans.',
    enemyScript: `SET alert = 0\nSET x = SCAN\nIF x > 0\n  SET alert = 1\n  SET y = SCAN\n  IF y > 0\n    SET alert = 2\n    FIRE\n    FIRE\n    SET z = SCAN\n    IF z > 0\n      FIRE\n      FIRE\n      FIRE\n    END\n  END\nELSE\n  MOVE RIGHT\n  MOVE RIGHT\nEND`,
  },
  {
    id: 'cond-08', tabId: 'conditionals', order: 8, title: 'DEAD RECKONING',
    difficulty: 'HARD', pointsReward: D.HARD,
    description: 'It builds a direction variable based on scan results. Positive scan: direction = 1. Negative: direction stays 0. It then uses direction to choose between aggressive pursuit and defensive patrol. Logic as compass.',
    hint: 'Force its direction to 0 by staying out of scan range. Then it enters patrol mode which is predictable.',
    enemyScript: `SET dir = 0\nSET x = SCAN\nIF x > 0\n  SET dir = 1\nEND\nIF dir > 0\n  FIRE\n  FIRE\n  FIRE\n  MOVE LEFT\n  FIRE\nELSE\n  MOVE RIGHT\n  MOVE RIGHT\n  FIRE\nEND`,
  },
  {
    id: 'cond-09', tabId: 'conditionals', order: 9, title: 'QUANTUM OBSERVER',
    difficulty: 'EXTREME', pointsReward: D.EXTREME,
    description: 'It measures, then re-measures. If both measurements agree (both positive), it commits to a full 5-shot barrage. If they disagree, it enters confusion mode — firing once then retreating. Uncertainty is your weapon.',
    hint: 'Create measurement disagreement: be visible for scan 1 then move before scan 2. Its confusion mode is exploitable.',
    enemyScript: `SET m1 = SCAN\nMOVE RIGHT\nSET m2 = SCAN\nIF m1 > 0\n  IF m2 > 0\n    FIRE\n    FIRE\n    FIRE\n    FIRE\n    FIRE\n  ELSE\n    FIRE\n    MOVE LEFT\n    MOVE LEFT\n  END\nELSE\n  IF m2 > 0\n    FIRE\n    MOVE RIGHT\n  ELSE\n    MOVE RIGHT\n    MOVE RIGHT\n  END\nEND`,
  },
  {
    id: 'cond-10', tabId: 'conditionals', order: 10, title: 'ARBITER PRIME',
    difficulty: 'EXTREME', pointsReward: D.EXTREME,
    description: 'The Arbiter runs a full decision tree: 3 sequential scans feeding into a priority encoder. Highest priority: all 3 positive = apocalypse burst. Mid: 2 positive = targeted fire. Low: 1 = cautious shot. None = full retreat. A judge, jury, and executioner.',
    hint: 'It processes scans sequentially with moves between them. Exploit the gaps between scans to reposition. Force a low-priority branch.',
    enemyScript: `SET a = SCAN\nMOVE RIGHT\nSET b = SCAN\nMOVE LEFT\nSET c = SCAN\nSET score = a + b + c\nIF score > 2\n  FIRE\n  FIRE\n  FIRE\n  FIRE\n  FIRE\n  FIRE\nELSE\n  IF score > 1\n    FIRE\n    FIRE\n    FIRE\n    MOVE LEFT\n  ELSE\n    IF score > 0\n      FIRE\n      MOVE RIGHT\n    ELSE\n      MOVE RIGHT\n      MOVE RIGHT\n      MOVE RIGHT\n    END\n  END\nEND`,
  },
];
