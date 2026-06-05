import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  EnergyManager,
  GameLoop,
  Obstacle,
  Robot,
} from '@logic-arena/engine';
import {
  ActionExpression,
  NodeType,
  NumberLiteral,
  ScanStatement,
  StringLiteral,
  Identifier,
} from '../../../../../../packages/logic-parser/src';
import { Pathfinder } from '../pathfinder/index';
import { CooldownManager } from './cooldown-manager';
import { MovementExecutor } from './movement-executor';
import { CombatExecutor } from './combat-executor';
import { ScanExecutor } from './scan-executor';

export class ActionExecutor {
  private static readonly SHIELD_DURATION_TICKS = 30;
  private static readonly CLOAK_DURATION_TICKS = 40;
  private static readonly MINE_SIZE = 24;

  private cooldowns = new CooldownManager();
  private movementExecutor: MovementExecutor;
  private combatExecutor: CombatExecutor;
  private scanExecutor: ScanExecutor;

  /** Per-tick ordered action buffer: robotId → commands in execution order. */
  private tickActionBuffer: Map<string, string[]> = new Map();

  constructor(
    private gameLoop: GameLoop,
    private onEvent:
      | ((event: string, payload: Record<string, unknown>) => void)
      | undefined,
    private pathfinder: Pathfinder,
    private energyManager: EnergyManager,
  ) {
    this.movementExecutor = new MovementExecutor(gameLoop, pathfinder);
    this.combatExecutor = new CombatExecutor(
      gameLoop,
      this.cooldowns,
      energyManager,
    );
    this.scanExecutor = new ScanExecutor(gameLoop);
  }

  isBareActionOffCooldown(robotId: string, actionCommand: string): boolean {
    return this.cooldowns.isOffCooldown(robotId, actionCommand);
  }

  markBareActionExecuted(robotId: string, actionCommand: string): void {
    this.cooldowns.markExecuted(robotId, actionCommand);
  }

  emitQuery(robotId: string, queryName: string, result: string | number): void {
    if (!this.cooldowns.shouldEmitQuery(robotId, queryName)) {
      return;
    }

    const QUERY_LABELS: Record<string, string> = {
      GET_HEALTH: 'health',
      GET_ENERGY: 'energy',
      GET_ENERGY_PCT: 'energy%',
      GET_DISTANCE: 'distance',
      GET_POSITION: 'position',
      GET_ROTATION: 'rotation',
      GET_FOV_DIR: 'fov_dir',
      GET_VISIBLE_COUNT: 'visible',
    };

    const friendlyName = QUERY_LABELS[queryName] ?? queryName.toLowerCase();
    const label = `${friendlyName} = ${result}`;

    if (this.onEvent) {
      this.onEvent('queryResult', {
        robotId,
        query: queryName,
        result,
        label,
        message: `[QUERY] ${label}`,
      });
    }

    this.cooldowns.markQueryEmitted(robotId, queryName);
  }

  emitError(robotId: string, message: string): void {
    if (this.onEvent) {
      this.onEvent('queryResult', {
        robotId,
        query: 'ERROR',
        result: 'FATAL',
        label: message,
        message: message,
      });
    }
  }

  executeAction(
    robotId: string,
    action: ActionExpression | ScanStatement,
    memory: Record<string, unknown>,
  ): boolean {
    const actionCommand =
      action.type === 'ScanStatement' ? 'SCAN' : action.command.toUpperCase();

    // --- Energy gate ---
    // FIRE / BURST_FIRE skip this gate — CombatExecutor handles their own
    // visibility check first, then deducts energy only if a valid target exists.
    // All other commands go through the upfront gate as normal.
    const robot = this.gameLoop.getRobots().find((r) => r.id === robotId);
    if (!robot) return false;

    if (!this.hasValidActionArgs(actionCommand, action, memory)) {
      return false;
    }

    const isCombatCommand =
      actionCommand === 'FIRE' || actionCommand === 'BURST_FIRE';

    if (!isCombatCommand) {
      const allowed = this.energyManager.deduct(robot, actionCommand);
      if (!allowed) {
        return false;
      }
    }

    // Mark that the robot performed an active command (blocks regen for this tick)
    if (actionCommand !== 'STOP') {
      robot.executedCommandThisTick = true;
    }

    // --- Buffer action for emit at end of tick ---
    if (actionCommand !== 'TAUNT') {
      const buffer = this.tickActionBuffer.get(robotId);
      if (buffer) {
        buffer.push(actionCommand);
      } else {
        this.tickActionBuffer.set(robotId, [actionCommand]);
      }
    }

    // --- Dispatch ---
    switch (actionCommand) {
      case 'FIRE':
      case 'BURST_FIRE':
        this.combatExecutor.execute(robotId, actionCommand);
        break;
      case 'PATHFIND':
      case 'STOP':
      case 'MOVE':
      case 'MOVE_FAST':
      case 'BACKUP': {
        const movementAction = action as ActionExpression;
        const dirArg = movementAction.args?.[0];
        const direction =
          dirArg?.type === NodeType.Identifier
            ? ((dirArg as { value: string }).value.toUpperCase() as
                | 'FORWARD'
                | 'LEFT'
                | 'RIGHT')
            : 'FORWARD';
        this.movementExecutor.execute(
          robotId,
          actionCommand,
          memory,
          direction,
        );
        break;
      }
      case 'TELEPORT':
        this.executeTeleport(robot, action as ActionExpression, memory);
        break;
      case 'SHIELD':
        robot.isShielded = true;
        robot.shieldTicksRemaining = ActionExecutor.SHIELD_DURATION_TICKS;
        break;
      case 'CLOAK':
        robot.isCloaked = true;
        robot.cloakTicksRemaining = ActionExecutor.CLOAK_DURATION_TICKS;
        break;
      case 'DASH':
        this.executeDash(robot, action as ActionExpression, memory);
        break;
      case 'MINE':
        this.spawnMine(robot);
        break;
      case 'TAUNT':
        this.executeTaunt(robotId, action as ActionExpression, memory);
        break;
      case 'SCAN':
        this.scanExecutor.execute(robotId, memory);
        break;
      default:
        console.warn(`[ActionExecutor] Unknown command: ${actionCommand}`);
        return false;
    }

    return true;
  }

  private hasValidActionArgs(
    actionCommand: string,
    action: ActionExpression | ScanStatement,
    memory: Record<string, unknown>,
  ): boolean {
    if (action.type === 'ScanStatement') return true;
    if (actionCommand === 'TELEPORT') {
      return (
        this.resolveNumberArg(action.args?.[0], memory) !== null &&
        this.resolveNumberArg(action.args?.[1], memory) !== null
      );
    }
    if (actionCommand === 'DASH') {
      return this.resolveNumberArg(action.args?.[0], memory) !== null;
    }
    return true;
  }

  private executeTeleport(
    robot: Robot,
    action: ActionExpression,
    memory: Record<string, unknown>,
  ): void {
    const x = this.resolveNumberArg(action.args?.[0], memory);
    const y = this.resolveNumberArg(action.args?.[1], memory);
    if (x === null || y === null) return;

    robot.position.x = this.clamp(x, 0, ARENA_WIDTH);
    robot.position.y = this.clamp(y, 0, ARENA_HEIGHT);
    robot.velocity.x = 0;
    robot.velocity.y = 0;
  }

  private executeDash(
    robot: Robot,
    action: ActionExpression,
    memory: Record<string, unknown>,
  ): void {
    const distance = this.resolveNumberArg(action.args?.[0], memory);
    if (distance === null) return;

    const direction = robot.facingDirection ?? robot.rotation;
    robot.position.x = this.clamp(
      robot.position.x + Math.cos(direction) * distance,
      0,
      ARENA_WIDTH,
    );
    robot.position.y = this.clamp(
      robot.position.y + Math.sin(direction) * distance,
      0,
      ARENA_HEIGHT,
    );
    robot.velocity.x = 0;
    robot.velocity.y = 0;
  }

  private spawnMine(robot: Robot): void {
    const mine: Obstacle = {
      id: `mine-${robot.id}-${Date.now()}`,
      type: 'MINE',
      position: { ...robot.position },
      width: ActionExecutor.MINE_SIZE,
      height: ActionExecutor.MINE_SIZE,
      rotation: robot.rotation,
      ownerId: robot.id,
      createdAt: Date.now(),
    };
    this.gameLoop.getObstacles().push(mine);
  }

  private executeTaunt(
    robotId: string,
    action: ActionExpression,
    memory: Record<string, unknown>,
  ): void {
    const message = this.resolveStringArg(action.args?.[0], memory) ?? 'TAUNT';
    if (this.onEvent) {
      this.onEvent('logicExecuted', {
        robotId,
        action: 'TAUNT',
        message,
      });
    }
  }

  private resolveNumberArg(
    arg: Identifier | NumberLiteral | StringLiteral | undefined,
    memory: Record<string, unknown>,
  ): number | null {
    if (!arg) return null;
    if (arg.type === NodeType.NumberLiteral) return arg.value;
    if (arg.type === NodeType.Identifier) {
      const value = memory[arg.value];
      return typeof value === 'number' && Number.isFinite(value) ? value : null;
    }
    const parsed = Number(arg.value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private resolveStringArg(
    arg: Identifier | NumberLiteral | StringLiteral | undefined,
    memory: Record<string, unknown>,
  ): string | null {
    if (!arg) return null;
    if (arg.type === NodeType.StringLiteral) return arg.value;
    if (arg.type === NodeType.NumberLiteral) return String(arg.value);
    const value = memory[arg.value];
    return typeof value === 'string' || typeof value === 'number'
      ? String(value)
      : arg.value;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Called once per tick per robot (from MatchEngine.tick()).
   * Processes the buffered actions for this tick and emits `logicExecuted`
   * for the **last continuous command** (the robot's settled state) plus
   * each **unique non-continuous command**.
   *
   * This prevents alternating spam when a robot's script evaluates both a
   * non-continuous command (e.g. PATHFIND) and a continuous one (e.g. STOP)
   * in the same tick — only the settled continuous command is tracked,
   * and non-continuous ones have independent per-command timers.
   */
  flushEmits(robotId: string): void {
    const buffer = this.tickActionBuffer.get(robotId);
    if (!buffer || buffer.length === 0) {
      this.tickActionBuffer.delete(robotId);
      return;
    }
    this.tickActionBuffer.delete(robotId);

    const CONTINUOUS = CooldownManager.CONTINUOUS_COMMANDS;

    // Scan from the end to find the LAST continuous command (the "settled state")
    let lastContinuous: string | undefined;
    for (let i = buffer.length - 1; i >= 0; i--) {
      if (CONTINUOUS.has(buffer[i])) {
        lastContinuous = buffer[i];
        break;
      }
    }

    // Collect unique non-continuous commands executed this tick
    const nonContinuous = new Set<string>();
    for (const cmd of buffer) {
      if (!CONTINUOUS.has(cmd)) {
        nonContinuous.add(cmd);
      }
    }

    // Emit the continuous command if it changed (it won't be re-emitted
    // until another continuous command replaces it — no alternating spam)
    if (lastContinuous) {
      if (this.cooldowns.shouldEmitAction(robotId, lastContinuous)) {
        this.internalEmit(robotId, lastContinuous);
        this.cooldowns.markEmitted(robotId, lastContinuous);
      }
    }

    // Emit each non-continuous command (gated by per-command 1s cooldown)
    for (const cmd of nonContinuous) {
      if (this.cooldowns.shouldEmitAction(robotId, cmd)) {
        this.internalEmit(robotId, cmd);
        this.cooldowns.markEmitted(robotId, cmd);
      }
    }
  }

  private internalEmit(robotId: string, actionCommand: string): void {
    if (this.onEvent) {
      this.onEvent('logicExecuted', {
        robotId,
        action: actionCommand,
        message: `Logic Triggered: ${actionCommand}`,
      });
    }
  }

  clearState(robotId: string, fullReset: boolean = true): void {
    this.cooldowns.clearState(robotId, fullReset);
  }

  /** Enable headless simulation mode — cooldowns use virtual time instead of Date.now(). */
  setVirtualTime(ms: number): void {
    this.cooldowns.setVirtualTime(ms);
  }
}
