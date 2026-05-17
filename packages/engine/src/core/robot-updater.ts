import { Robot, Obstacle } from '../types';
import { EnergyManager } from '../energy-manager';
import { checkWallBounds } from '../physics/wall-bounds';
import { checkObstacleCollision } from '../physics/collision-obstacles';
import { LAVA_DPS } from '../constants';

export function updateRobotPhysics(
  robot: Robot,
  obstacles: Obstacle[],
  arenaW: number,
  arenaH: number,
  energyManager: EnergyManager,
  deltaTime: number,
): void {
  if (!robot.isAlive) {
    robot.velocity = { x: 0, y: 0 };
    return;
  }

  // --- Passive energy regeneration (conditional per tick) ---
  // Regen runs unconditionally here, but EnergyManager decides the amount.
  energyManager.regen(robot);

  // --- STASIS: complete freeze ---
  // Zero velocity AND return immediately. Nothing below here can execute:
  //   - no collision checks (which could impart bounce velocity)
  //   - no position integration (which would apply any residual velocity)
  //   - no rotation updates (body and FOV stay frozen)
  //   - no lockVision sync
  // The ONLY thing that runs during STASIS is regen (above).
  if (robot.inStasis) {
    robot.velocity.x = 0;
    robot.velocity.y = 0;
    return;
  }

  // --- Reset per-tick transient flags ---
  robot.insideLava = false;
  robot.speedMultiplier = 1.0;

  // Boundary + Obstacle Collisions
  const prevHitWall = robot.hitWallTimestamp ?? 0;
  checkWallBounds(robot, arenaW, arenaH);
  for (const obstacle of obstacles) {
    checkObstacleCollision(robot, obstacle);
  }
  const hitWallThisTick = (robot.hitWallTimestamp ?? 0) > prevHitWall;

  // LAVA damage — 5 HP/sec accumulated via deltaTime
  if (robot.insideLava) {
    robot.health = Math.max(0, robot.health - LAVA_DPS * deltaTime);
    if (robot.health === 0) robot.isAlive = false;
  }

  const currentSpeed = Math.hypot(robot.velocity.x, robot.velocity.y);
  const isCoolingDown = (robot.collisionCooldown ?? 0) > 0;

  // Clear the manual flag so the next tick the physics can drive it naturally, but save it for this tick
  const wasManualRotation = robot.isManualRotation;
  robot.isManualRotation = false;
  // Note: facingDirection is only updated by movement-executor on MOVE/MOVE_FAST,
  // never from physics — prevents atan2 from corrupting it when velocity points backward.

  if ((robot.collisionCooldown ?? 0) > 0) {
    robot.collisionCooldown = robot.collisionCooldown! - 1;
  }

  // --- lockVision: sync fovDirection to rotation every tick unless manually overridden ---
  if (robot.lockVision) {
    robot.fovDirection = robot.rotation;
  }

  // Apply velocity with TRAP slow multiplier
  const speed = robot.speedMultiplier ?? 1.0;
  robot.position.x += robot.velocity.x * speed * deltaTime;
  robot.position.y += robot.velocity.y * speed * deltaTime;

  // Update facing rotation from velocity direction.
  const vMag = Math.hypot(robot.velocity.x, robot.velocity.y);
  const facingDirection = robot.facingDirection ?? robot.rotation;
  const movingBackward =
    robot.isBackingUp === true &&
    vMag > 0.001 &&
    Math.cos(facingDirection) * robot.velocity.x +
      Math.sin(facingDirection) * robot.velocity.y < -0.001;
  const shouldUpdateRotationFromVelocity =
    vMag > 0.001 &&
    !movingBackward &&
    (isCoolingDown || (!wasManualRotation && !hitWallThisTick));

  if (shouldUpdateRotationFromVelocity) {
    robot.rotation = Math.atan2(robot.velocity.y, robot.velocity.x);
  }
}
