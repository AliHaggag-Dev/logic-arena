import { GameLoop, EnergyManager } from '@logic-arena/engine';
import { CooldownManager } from './cooldown-manager';

const FIRE_DAMAGE = 25;  // HP per FIRE hit
const BURST_DAMAGE = 8;   // HP per BURST_FIRE shot (3 shots × 8 = 24 total)
const BURST_COUNT = 3;
const BURST_SPREAD_RAD = (8 * Math.PI) / 180; // 8° between shots
const BURST_DELAY_MS = 150; // ms between shots

export class CombatExecutor {
  constructor(
    private gameLoop: GameLoop,
    private cooldowns: CooldownManager,
    private energyManager: EnergyManager,
  ) { }

  execute(robotId: string, actionCommand: string): void {
    if (!this.cooldowns.isFireOffCooldown(robotId)) return;

    const robots = this.gameLoop.getRobots();
    const robot = robots.find(r => r.id === robotId);
    if (!robot || robot.health <= 0) return;

    // Only target robots that are inside the FOV cone (same set CAN_SEE_ENEMY uses).
    const visibleRobots = robot.visibleEntities?.robots ?? [];
    const targetRobot = visibleRobots.find(r => r.id !== robotId && r.health > 0);

    // Nothing in cone → abort without consuming cooldown or energy
    if (!targetRobot) return;

    // Deduct energy cost and respect STASIS blocking.
    // This must happen AFTER the visibility check so energy is only
    // consumed when there is actually a valid target to shoot at.
    const allowed = this.energyManager.deduct(robot, actionCommand);
    if (!allowed) return; // robot entered stasis mid-execution

    this.cooldowns.markFired(robotId);

    if (actionCommand === 'FIRE') {
      this.gameLoop.spawnProjectile(
        robotId,
        { ...robot.position },
        { x: targetRobot.position.x, y: targetRobot.position.y },
      );
      this.energyManager.recordDamage(robot, FIRE_DAMAGE);
      return;
    }

    if (actionCommand === 'BURST_FIRE') {
      // Snapshot origin and target angle at the moment of command execution.
      // Individual shots are spread symmetrically around the base angle.
      const baseAngle = Math.atan2(
        targetRobot.position.y - robot.position.y,
        targetRobot.position.x - robot.position.x,
      );
      const PROJECTILE_RANGE = 600; // arena units — well beyond arena bounds

      for (let i = 0; i < BURST_COUNT; i++) {
        // Shot offsets: -8°, 0°, +8° (centred burst)
        const spreadOffset = (i - Math.floor(BURST_COUNT / 2)) * BURST_SPREAD_RAD;
        const shotAngle = baseAngle + spreadOffset;

        const originSnapshot = { ...robot.position };
        const targetSnapshot = {
          x: robot.position.x + Math.cos(shotAngle) * PROJECTILE_RANGE,
          y: robot.position.y + Math.sin(shotAngle) * PROJECTILE_RANGE,
        };

        setTimeout(() => {
          // Guard: robot must still be alive when delayed shots fire
          const currentRobot = this.gameLoop.getRobots().find(r => r.id === robotId);
          if (!currentRobot || currentRobot.health <= 0) return;

          this.gameLoop.spawnProjectile(robotId, originSnapshot, targetSnapshot);
          this.energyManager.recordDamage(currentRobot, BURST_DAMAGE);
        }, i * BURST_DELAY_MS);
      }
    }
  }
}
