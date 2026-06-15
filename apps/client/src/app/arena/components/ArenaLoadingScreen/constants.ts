export const TIPS: string[] = [
  "MOVE propels the robot forward and costs 2 energy per tick. High-speed propulsion (MOVE_FAST) doubles speed and energy cost.",
  "Use BACKUP for reverse thrust. It consumes 2 energy per tick and can be used to retreat while facing the enemy.",
  "PATHFIND calculates a weighted A* path to the nearest visible enemy, avoiding obstacles, for 3 energy per tick.",
  "STOP halts all movement immediately and costs 0 energy. It can be executed even when in STASIS.",
  "SCAN rotates the scanner +15° per call, updating scanned_distance, scanned_angle, and scanned_spotted. It costs 3 energy.",
  "WAIT N suspends script execution for N ticks (60 ticks ≈ 1 second) at 0 energy. Energy does NOT regenerate during WAIT.",
  "FIRE shoots a single precision projectile toward the nearest visible enemy, dealing 25 HP on hit for 8 energy.",
  "BURST_FIRE shoots a rapid 3-shot burst dealing up to 24 HP total (8 HP per hit) for 18 energy.",
  "TELEPORT x y instantly warps you to the specified coordinates and sets velocity to zero, costing 80 energy.",
  "SHIELD blocks all incoming damage and projectiles for 30 ticks (1.5 seconds), costing 60 energy.",
  "CLOAK turns the robot completely invisible to enemy sensors, FOV, and radar for 40 ticks (2 seconds) for 50 energy.",
  "MINE drops a proximity mine at your current location. It arms after 250ms and deals 35 damage for 40 energy.",
  "DASH distance triggers an instant lateral thrust in the direction the robot is facing, ideal for dodging at 30 energy.",
  "SET commands (like assigning variables) execute even during STASIS. Use them to update state machines while immobilized.",
  "Compound boolean operators like AND and OR short-circuit evaluate, meaning the second condition is skipped if the first determines the result.",
  "Avoid TLE! AliScript has a strict limit of 2,000 operations per tick. Deeply nested WHILE loops can easily trigger crash penalties.",
  "Steer your tracks using SET rotation = X (in radians). This directs your movement speed but does not affect fovDirection.",
  "SET fovDirection = X aims your scanner cone independently from your robot's tracks rotation, allowing you to drive one way and look another.",
  "Set lockVision = TRUE to automatically sync your scanner cone (fovDirection) with your tracks' rotation on every tick.",
  "If lockVision is active, manual assignments to rotation or fovDirection will automatically disable lockVision.",
  "Use scanned_distance, scanned_angle, and scanned_spotted to query results from your last successful SCAN execution.",
  "When energy hits 0, you enter STASIS. You can only exit STASIS when energy regenerates back to 20 or more.",
  "While in STASIS, movement, scanning, and weapons are blocked. However, SET and WAIT commands can still run.",
  "Use target_vx, target_vy, and bullet_speed (400 units/s) to calculate leading shots and hit moving targets with high accuracy.",
  "Identify nearby obstacles using CAN_SEE_OBSTACLE and NEAREST_OBSTACLE_TYPE, which returns 'SOLID', 'TRAP', or 'LAVA'.",
  "Collect stars spawned across the map to increase your team's score and secure a tactical advantage.",
  "Lava pools deal continuous damage over time, while traps slow your robot down. Avoid them using A* PATHFIND or manual routing.",
  "You can write instructions in plain English or Arabic (e.g. 'انطلق للأمام وأطلق النار') and the AI Generator will compile it to AliScript!",
  "Always keep an eye on your MY_ENERGY and ENERGY_PCT. Running out of energy in the middle of a duel makes you a sitting duck.",
  "Define reusable subroutines using FUNCTION name ... END, and invoke them anywhere in your script using CALL name."
];

export const GLB_FILES: string[] = [
  '/robots/robot.glb',
  '/robots/robot2.glb',
  '/robots/armored-robot.glb',
  '/robots/sandman.glb',
  '/robots/mecha.glb',
  '/robots/npc-robot.glb',
  '/robots/red_mecha.glb',
];

// Progress calculations weights
export const GLB_PROGRESS_WEIGHT = 35;
export const TEXTURES_PROGRESS_WEIGHT = 15;
export const WEBSOCKET_CONNECTED_WEIGHT = 15;
export const INIT_STATE_RECEIVED_WEIGHT = 20;
export const SCRIPT_READY_WEIGHT = 10;
export const AUDIO_READY_WEIGHT = 5;

// Timing intervals
export const AUDIO_CHECK_INTERVAL_MS = 300;
export const TEXTURE_CHECK_INTERVAL_MS = 100;
export const TIPS_ROTATION_INTERVAL_MS = 8000;
export const TIPS_FADE_TRANSITION_MS = 400;
export const FADE_OUT_DELAY_MS = 500;
export const UNMOUNT_TIMER_MS = 800;
export const GLB_FALLBACK_TIMEOUT_MS = 2500;
