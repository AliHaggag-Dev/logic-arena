export const SAMPLE_SCRIPT =
  `// The Array Sniper v2.5
// Uses the new Vision Array API to find targets!

// Initialize a state machine flag
IF NOT state THEN
  SET state = { mode: "SEARCH" }
END

IF state.mode == "SEARCH" THEN
  SCAN
  SET rotation = rotation + 0.1
  MOVE
  IF CAN_SEE_ENEMY THEN
    SET state.mode = "ENGAGE"
  END
END

IF state.mode == "ENGAGE" THEN
  SET enemies = GET_ALL_VISIBLE_ENEMIES()
  IF LENGTH(enemies) > 0 THEN
    // Target the first visible enemy
    SET target = enemies[0]
    SET aim = ATAN2(target[2] - POSITION_Y, target[1] - POSITION_X)
    SET rotation = aim
    FIRE
  ELSE
    // Lost sight, return to searching
    SET state.mode = "SEARCH"
  END
END`;
