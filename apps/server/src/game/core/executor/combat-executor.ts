import { GameLoop, EnergyManager } from '@logic-arena/engine';
import { CooldownManager } from './cooldown-manager';

const FIRE_DAMAGE    = 25; // HP per FIRE hit
const BURST_DAMAGE   = 12; // HP per BURST_FIRE hit

export class CombatExecutor {
  constructor(
    private gameLoop: GameLoop,
    private cooldowns: CooldownManager,
    private energyManager: EnergyManager,
  ) {}

  execute(robotId: string, actionCommand: string): void {
    if (!this.cooldowns.isFireOffCooldown(robotId)) return;

    const robots      = this.gameLoop.getRobots();
    const robot       = robots.find(r => r.id === robotId);
    const targetRobot = robots.find(r => r.id !== robotId && r.health > 0);

    if (robot && robot.health > 0 && targetRobot) {
      if (actionCommand === 'FIRE' || actionCommand === 'BURST_FIRE') {
        this.gameLoop.spawnProjectile(
          robotId,
          { ...robot.position },
          { x: targetRobot.position.x, y: targetRobot.position.y },
        );
        this.cooldowns.markFired(robotId);

        // Record damage dealt for efficiency score
        const damage = actionCommand === 'BURST_FIRE' ? BURST_DAMAGE : FIRE_DAMAGE;
        this.energyManager.recordDamage(robot, damage);
      }
    }
  }
}
