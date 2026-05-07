export const TACTICS_DATA = [
  { title: 'THE STALKER', desc: 'Sensor-loop logic for hyper-accurate target acquisition.', code: '// Adaptive Scan Loop\nSCAN\nWHILE NOT scanned_spotted DO\n  SET rotation = rotation + 0.1\n  WAIT 2\n  SCAN\nEND\nPATHFIND', color: 'var(--docs-cyan)' },
  { title: 'THE TURRET', desc: 'Energy-efficient static defense with manual rotation.', code: 'FUNCTION defend\n  SCAN\n  IF scanned_distance < 150 THEN\n    BURST_FIRE\n    WAIT 10\n  ELSE\n    SET rotation = rotation + 0.05\n  END\nEND\nSTOP\nWHILE TRUE DO CALL defend END', color: 'var(--docs-orange)' },
  { title: 'THE JITTERBUG', desc: 'Chaotic movement offsets to bypass enemy trajectory prediction.', code: 'SET offset = 1\nWHILE TRUE DO\n  MOVE_FAST\n  SET rotation = rotation + (offset * 0.5)\n  SET offset = offset * -1\n  IF CAN_SEE_ENEMY THEN FIRE END\n  WAIT 3\nEND', color: 'var(--docs-purple)' },
];
