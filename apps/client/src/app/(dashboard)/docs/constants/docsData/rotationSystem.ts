export interface RotationExample {
  title: string;
  description: string;
  code: string;
  result: string;
}

export interface ConflictRule {
  scenario: string;
  outcome: string;
}

export interface RotationSystemGuide {
  controls: {
    name: string;
    alias?: string[];
    controls: string;
    affectsMovement: boolean;
    affectsVision: boolean;
    description: string;
  }[];
  angleReference: { value: string; direction: string; label: string }[];
  examples: RotationExample[];
  conflictRules: ConflictRule[];
}

export const ROTATION_SYSTEM_GUIDE: RotationSystemGuide = {
  controls: [
    {
      name: 'rotation',
      alias: ['angle', 'rot'],
      controls: 'Robot body & tracks',
      affectsMovement: true,
      affectsVision: false,
      description: 'Controls which direction the robot drives. Physics auto-updates it when moving. Does NOT touch fovDirection ever.'
    },
    {
      name: 'fovDirection',
      controls: 'Scanner cone (eyes)',
      affectsMovement: false,
      affectsVision: true,
      description: 'Controls where the FOV cone points. Completely independent from body. CAN_SEE_ENEMY checks this cone only.'
    },
    {
      name: 'lockVision',
      controls: 'Links body + scanner',
      affectsMovement: false,
      affectsVision: false,
      description: 'When TRUE, fovDirection auto-follows rotation every tick. Auto-disables when SET rotation or SET fovDirection is used manually.'
    }
  ],
  angleReference: [
    { value: '0', direction: '→', label: 'Right (East)' },
    { value: '1.57', direction: '↓', label: 'Down (South)' },
    { value: '3.14', direction: '←', label: 'Left (West)' },
    { value: '-1.57', direction: '↑', label: 'Up (North)' },
    { value: '4.71', direction: '↑', label: 'Up (North) alt' },
  ],
  examples: [
    {
      title: 'Basic — Move and shoot forward',
      description: 'Simplest setup: scanner follows body, fires anything in front.',
      code: `SET lockVision = TRUE
WHILE TRUE DO
  MOVE
  IF CAN_SEE_ENEMY THEN
    FIRE
  END
END`,
      result: 'Robot drives forward, shoots anything its body faces.'
    },
    {
      title: 'Rear-View — Eyes in the back of the head',
      description: 'Body drives East, scanner watches West. Detects enemies sneaking up from behind.',
      code: `SET rotation = 0
SET fovDirection = 3.14
WHILE TRUE DO
  MOVE
  IF CAN_SEE_ENEMY THEN
    FIRE
  END
END`,
      result: 'Robot moves right while watching left. Fires at enemies behind it.'
    },
    {
      title: 'Sweep Radar — Spinning scanner while moving',
      description: 'SCAN rotates scanner +15° per call. Full 360° sweep while driving.',
      code: `WHILE TRUE DO
  MOVE
  SCAN
  IF CAN_SEE_ENEMY THEN
    FIRE
  END
END`,
      result: 'Robot drives forward, scanner sweeps full circle, fires on detection.'
    },
    {
      title: 'Sniper Tower — Stand still, guard a direction',
      description: 'Robot never moves. Scanner fixed East. Fires anything entering cone.',
      code: `SET fovDirection = 0
WHILE TRUE DO
  IF CAN_SEE_ENEMY THEN
    FIRE
  END
END`,
      result: 'Static guardian. Only shoots enemies entering its fixed cone.'
    },
    {
      title: 'Split Brain — Move South, watch North',
      description: 'Body and scanner pointing opposite directions simultaneously.',
      code: `SET lockVision = TRUE
SET rotation = 1.57
MOVE
WAIT 20
SET fovDirection = -1.57
WHILE TRUE DO
  MOVE
  IF CAN_SEE_ENEMY THEN
    FIRE
  END
END`,
      result: 'Drives South. After 20 ticks lockVision disables. Scanner points North. Rear-eye mode.'
    }
  ],
  conflictRules: [
    { scenario: 'lockVision ON + SET rotation = X', outcome: 'lockVision disables. Body turns to X. Scanner stays at last position.' },
    { scenario: 'lockVision ON + SET fovDirection = X', outcome: 'lockVision disables. Scanner turns to X. Body stays unchanged.' },
    { scenario: 'lockVision ON + MOVE', outcome: 'Body rotates from physics. Scanner follows (lockVision still ON).' },
    { scenario: 'lockVision ON + SCAN', outcome: 'Scanner rotates +15°. Next tick lockVision re-syncs scanner to body.' },
    { scenario: 'lockVision OFF + MOVE', outcome: 'Body rotates from physics. Scanner frozen at last position.' },
    { scenario: 'lockVision OFF + SET rotation = X', outcome: 'Body turns to X. Scanner completely unaffected.' },
    { scenario: 'lockVision OFF + SET fovDirection = X', outcome: 'Scanner turns to X. Body completely unaffected.' },
  ]
};
