import { GameLoop } from '@logic-arena/engine';

/** Degrees the FOV cone rotates per SCAN invocation. */
const SCAN_ROTATE_DEG = 15;
const SCAN_ROTATE_RAD = (SCAN_ROTATE_DEG * Math.PI) / 180;
const TWO_PI = Math.PI * 2;

export class ScanExecutor {
  constructor(private gameLoop: GameLoop) {}

  execute(robotId: string, memory: Record<string, unknown>): void {
    const robots = this.gameLoop.getRobots();
    const robot  = robots.find(r => r.id === robotId);
    if (!robot) return;

    // --- Rotate FOV direction by 15°/call (sweeps the environment) ---
    robot.fovDirection = ((robot.fovDirection ?? robot.rotation) + SCAN_ROTATE_RAD) % TWO_PI;

    // --- Derive scan data from VISIBLE entities only (enforces FOV blindness) ---
    const visibleRobots = robot.visibleEntities?.robots ?? [];

    if (visibleRobots.length > 0) {
      // Find the nearest visible enemy
      let nearest    = visibleRobots[0];
      let nearestDst = Infinity;

      for (const candidate of visibleRobots) {
        const dx  = candidate.position.x - robot.position.x;
        const dy  = candidate.position.y - robot.position.y;
        const dst = Math.sqrt(dx * dx + dy * dy);
        if (dst < nearestDst) {
          nearestDst = dst;
          nearest    = candidate;
        }
      }

      const dx    = nearest.position.x - robot.position.x;
      const dy    = nearest.position.y - robot.position.y;
      const angle = Math.atan2(dy, dx);

      memory['scanned_distance'] = nearestDst;
      memory['scanned_angle']    = angle;
      memory['scanned_spotted']  = true;
    } else {
      // Nothing visible — clear scan data
      memory['scanned_distance'] = Infinity;
      memory['scanned_angle']    = robot.fovDirection ?? robot.rotation;
      memory['scanned_spotted']  = false;
    }
  }
}
