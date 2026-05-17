import { GameLoop } from '@logic-arena/engine';
import { computeImmediateVisibility } from './visibility';

/** Degrees the FOV cone rotates per SCAN invocation. */
const SCAN_ROTATE_DEG = 15;
const SCAN_ROTATE_RAD = (SCAN_ROTATE_DEG * Math.PI) / 180;
const TWO_PI = Math.PI * 2;

export class ScanExecutor {
  constructor(private gameLoop: GameLoop) { }

  execute(robotId: string, memory: Record<string, unknown>): void {
    const robots = this.gameLoop.getRobots();
    const robot = robots.find((r) => r.id === robotId);
    if (!robot) return;

    const sweepDeg = Number(memory['_SYS_SCAN_SWEEP_DEG'] ?? SCAN_ROTATE_DEG);

    if (sweepDeg >= 360) {
      // Internal campaign rail scripts use this to perform a full node scan.
      // Aim the scanner at the nearest living robot in range, if any, so a
      // following FIRE uses the same FOV-gated combat path as normal gameplay.
      const range = robot.fov?.range ?? 300;
      const nearest = robots
        .filter((r) => r.id !== robotId && r.isAlive)
        .map((r) => ({
          robot: r,
          dist: Math.hypot(r.position.x - robot.position.x, r.position.y - robot.position.y),
        }))
        .filter(({ dist }) => dist <= range)
        .sort((a, b) => a.dist - b.dist)[0];

      if (nearest) {
        robot.fovDirection = Math.atan2(
          nearest.robot.position.y - robot.position.y,
          nearest.robot.position.x - robot.position.x,
        );
      } else {
        robot.fovDirection = ((robot.fovDirection ?? robot.rotation) + TWO_PI) % TWO_PI;
      }
    } else {
      const rotateRad = ((Number.isFinite(sweepDeg) ? sweepDeg : SCAN_ROTATE_DEG) * Math.PI) / 180;
      robot.fovDirection =
        ((robot.fovDirection ?? robot.rotation) + rotateRad) % TWO_PI;
    }

    robot.visibleEntities = computeImmediateVisibility(
      robot,
      robots,
      this.gameLoop.getGameState().projectiles,
      this.gameLoop.getGameState().obstacles,
    );

    // --- Derive scan data from VISIBLE entities only (enforces FOV blindness) ---
    const visibleRobots = robot.visibleEntities?.robots ?? [];

    if (visibleRobots.length > 0) {
      // Find the nearest visible enemy
      let nearest = visibleRobots[0];
      let nearestDst = Infinity;

      for (const candidate of visibleRobots) {
        const dx = candidate.position.x - robot.position.x;
        const dy = candidate.position.y - robot.position.y;
        const dst = Math.sqrt(dx * dx + dy * dy);
        if (dst < nearestDst) {
          nearestDst = dst;
          nearest = candidate;
        }
      }

      const dx = nearest.position.x - robot.position.x;
      const dy = nearest.position.y - robot.position.y;
      const angle = Math.atan2(dy, dx);

      memory['scanned_distance'] = nearestDst;
      memory['scanned_angle'] = angle;
      memory['scanned_spotted'] = true;
    } else {
      // Nothing visible — clear scan data
      memory['scanned_distance'] = Infinity;
      memory['scanned_angle'] = robot.fovDirection ?? robot.rotation;
      memory['scanned_spotted'] = false;
    }
  }
}
