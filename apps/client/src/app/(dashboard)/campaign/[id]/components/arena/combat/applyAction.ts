import { FIRE_DAMAGE, BURST_DAMAGE, BURST_SPREAD, PROJ_SPEED, PROJ_LIFE, ROBOT_SIZE } from '../constants';
import type { ArenaRobot, ArenaProjectile } from '../scenes';
import type { EvalAction } from '../miniEvaluator';

export type RuntimeArenaRobot = ArenaRobot & {
  _fireCooldown?: number;
  _lastMoveAngle?: number;
  _lastMoveValue?: number;
  _lastMoveFast?: boolean;
};

export function applyAction(
  action: EvalAction,
  robot: ArenaRobot,
  projs: ArenaProjectile[],
  nextId: { current: number },
): void {
  const runtimeRobot = robot as RuntimeArenaRobot;
  switch (action.type) {
    case 'fire': {
      if ((runtimeRobot._fireCooldown ?? 0) > 0) break;
      runtimeRobot._fireCooldown = 30;
      const a = action.value, d = robot.size * 2;
      projs.push({
        id: nextId.current++,
        x: robot.x + Math.cos(a) * d,
        y: robot.y + Math.sin(a) * d,
        vx: Math.cos(a) * PROJ_SPEED,
        vy: Math.sin(a) * PROJ_SPEED,
        color: robot.trailColor,
        ownerId: robot.id,
        life: PROJ_LIFE,
        damage: FIRE_DAMAGE,
      });
      break;
    }
    case 'burst': {
      if ((runtimeRobot._fireCooldown ?? 0) > 0) break;
      runtimeRobot._fireCooldown = 50;
      const d = robot.size * 2;
      for (let i = -1; i <= 1; i++) {
        const a = action.value + BURST_SPREAD * i;
        projs.push({
          id: nextId.current++,
          x: robot.x + Math.cos(a) * d,
          y: robot.y + Math.sin(a) * d,
          vx: Math.cos(a) * PROJ_SPEED,
          vy: Math.sin(a) * PROJ_SPEED,
          color: robot.trailColor,
          ownerId: robot.id,
          life: PROJ_LIFE,
          damage: BURST_DAMAGE,
        });
      }
      break;
    }
    case 'move': {
      // NOTE: We no longer instantly teleport the robot by `spd`.
      // The `ArenaCanvas` takes care of moving the robot smoothly based on `_lastMoveValue` and `_lastMoveAngle`.
      // We only enforce bounding box constraints here to prevent the robot from going out of bounds.
      robot.x = Math.max(ROBOT_SIZE, Math.min(1 - ROBOT_SIZE, robot.x));
      robot.y = Math.max(ROBOT_SIZE, Math.min(1 - ROBOT_SIZE, robot.y));
      break;
    }
  }
}
