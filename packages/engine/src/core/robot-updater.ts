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
  deltaTime: number
): void {
  if (!robot.isAlive) {
    robot.velocity = { x: 0, y: 0 };
    return;
  }

  // --- Passive energy regeneration (per physics tick) ---
  energyManager.regen(robot);

  // --- Reset per-tick transient flags ---
  robot.insideLava = false;
  robot.speedMultiplier = 1.0;

  // Boundary + Obstacle Collisions
  // Snapshot hitWallTimestamp before so we can detect if collision fired this tick
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

  if (!isCoolingDown) {
    if (robot.isManualRotation && currentSpeed > 0.1) {
      robot.velocity.x = Math.cos(robot.rotation) * currentSpeed;
      robot.velocity.y = Math.sin(robot.rotation) * currentSpeed;
    }
  }

  if ((robot.collisionCooldown ?? 0) > 0) {
    robot.collisionCooldown = robot.collisionCooldown! - 1;
  }

  // Clear the manual rotation flag so the next tick the physics can drive it naturally
  robot.isManualRotation = false;

  // --- lockVision: sync fovDirection to rotation every tick unless manually overridden ---  
  if ((robot as any).lockVision) {
    robot.fovDirection = robot.rotation;
  }

  // Apply velocity with TRAP slow multiplier
  const speed = robot.speedMultiplier ?? 1.0;
  robot.position.x += robot.velocity.x * speed * deltaTime;
  robot.position.y += robot.velocity.y * speed * deltaTime;

  // Update facing rotation from velocity direction.
  // 1. If actively in a bounce trajectory (isCoolingDown), FORCE the body to face the escape trajectory.
  // 2. Otherwise, skip if script manually set rotation or if wall bounce already set it this tick.
  const vMag = Math.hypot(robot.velocity.x, robot.velocity.y);
  if ((isCoolingDown && vMag > 0.001) || (!robot.isManualRotation && !hitWallThisTick && vMag > 0.001)) {
    robot.rotation = Math.atan2(robot.velocity.y, robot.velocity.x);
  }
}
