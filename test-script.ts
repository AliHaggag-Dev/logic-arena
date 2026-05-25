import { Parser } from './packages/logic-parser/src';

const SURVIVAL_DUMMY_SCRIPT = `
WHILE TRUE DO
  SCAN
  IF CAN_SEE_ENEMY THEN
    SET dx = NEAREST_VISIBLE_X - POSITION_X
    SET dy = NEAREST_VISIBLE_Y - POSITION_Y
    SET targetAngle = ATAN2(dy, dx)
    SET rotation = targetAngle
    IF distance <= 300 THEN
      FIRE
    END
    IF distance > 150 THEN
      MOVE_FAST
    ELSE
      STOP
    END
  ELSE
    SET rotation = rotation + 15
  END
END
`;

try {
  const parser = new Parser(SURVIVAL_DUMMY_SCRIPT);
  const ast = parser.parse();
  console.log("SUCCESS", JSON.stringify(ast, null, 2).substring(0, 200));
} catch (e) {
  console.error("ERROR", e);
}
