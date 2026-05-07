import { Logger } from '@nestjs/common';
import { GameLoop, Robot, GameConfig, GameMode } from '@logic-arena/engine';
import { SandboxRunner } from '../../common/sandbox.runner';
import { createRobot, parseAndSetLogic } from './robot-factory';
import { createGameDependencies, GameDependencies } from './game-dependencies';
import { NodeType, ActionExpression, ScanStatement } from '@logic-arena/logic-parser';

export class MatchEngine {
  private readonly logger = new Logger(MatchEngine.name);
  private gameLoop: GameLoop;
  private sandboxRunner: SandboxRunner;
  private deps: GameDependencies;
  private initialPlayers: { id: string; script: string; color?: string; model?: string; tracerColor?: string }[] = [];
  private tickInterval: NodeJS.Timeout | null = null;
  private matchId: string;
  private config?: GameConfig;

  /** Accumulate match-level tracking for efficiency score */
  private lastTickTime: number = Date.now();

  constructor(
    matchId: string,
    initialPlayers: { id: string; script: string; color?: string; model?: string; tracerColor?: string }[],
    config?: GameConfig,
    private onEvent?: (event: string, payload: any) => void,
  ) {
    this.matchId = matchId;
    this.config = config;
    this.gameLoop = new GameLoop(this.config);
    this.sandboxRunner = new SandboxRunner();
    this.deps = createGameDependencies(this.gameLoop, this.onEvent);
    this.initialPlayers = initialPlayers;

    initialPlayers.forEach((p, i) => {
      this.gameLoop.addRobot(createRobot(p.id, p.script, i, p.color, p.model, p.tracerColor));
      parseAndSetLogic(p.id, p.script, this.deps.logicEvaluator);
    });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  reset(): void {
    this.stop();
    this.gameLoop = new GameLoop(this.config);
    this.deps = createGameDependencies(this.gameLoop, this.onEvent);
    this.initialPlayers.forEach((p, i) => {
      this.gameLoop.addRobot(createRobot(p.id, p.script, i, p.color, p.model, p.tracerColor));
      parseAndSetLogic(p.id, p.script, this.deps.logicEvaluator);
    });
    this.start();
  }

  start(tickRate: number = 100): void {
    if (this.tickInterval) return;
    this.gameLoop.start();
    this.lastTickTime = Date.now();
    this.tickInterval = setInterval(() => this.tick(), tickRate);
  }

  stop(): void {
    this.gameLoop.stop();

    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Per-tick logic evaluation
  // ---------------------------------------------------------------------------

  private tick(): void {
    this.gameLoop.getRobots().forEach(robot => {
      if (!robot.isAlive) return;
      // Clear flag so logic executor can set it if an action is performed
      robot.executedCommandThisTick = false;
      this.deps.logicEvaluator.evaluate(robot.id);
    });
  }

  // ---------------------------------------------------------------------------
  // Player management
  // ---------------------------------------------------------------------------

  addPlayer(playerScript: { id: string; script: string; color?: string; model?: string; tracerColor?: string }): void {
    const exists = this.gameLoop.getRobots().some(p => p.id === playerScript.id);
    if (!exists) {
      let initIdx = this.initialPlayers.findIndex(p => p.id === playerScript.id);

      if (initIdx === -1) {
        // Try to claim the bot-2 placeholder slot first (lobby join scenario)
        const botSlot = this.initialPlayers.findIndex(p => p.id === 'bot-2');
        if (botSlot !== -1) {
          initIdx = botSlot;
          this.initialPlayers[initIdx] = playerScript;
        } else {
          // Reconnect scenario: reuse the first player slot (index 0) rather than
          // appending a brand-new entry, which would create a 3rd robot.
          initIdx = 0;
          this.initialPlayers[initIdx] = playerScript;
        }
      }

      this.gameLoop.addRobot(createRobot(playerScript.id, playerScript.script, initIdx, playerScript.color, playerScript.model, playerScript.tracerColor));
      parseAndSetLogic(playerScript.id, playerScript.script, this.deps.logicEvaluator);
    }
  }

  removePlayer(userId: string): void {
    this.gameLoop.removeRobot(userId);
    this.deps.logicEvaluator.clearLogicForRobot(userId);
  }

  updateRobotScript(robotId: string, scriptContent: string): void {
    const exists = this.gameLoop.getRobots().some(r => r.id === robotId);
    if (exists) parseAndSetLogic(robotId, scriptContent, this.deps.logicEvaluator);
  }

  updateInitialPlayer(userId: string, script: string): void {
    const index = this.initialPlayers.findIndex(p => p.id === userId);
    if (index !== -1) this.initialPlayers[index].script = script;
  }

  /** Commands allowed via the manual override input. */
  private static readonly MANUAL_ALLOWED = new Set([
    'MOVE', 'MOVE_FAST', 'BACKUP', 'STOP', 'FIRE', 'BURST_FIRE', 'SCAN',
  ]);

  /**
   * Execute a manual override command for a robot.
   * Routes through actionExecutor.executeAction() which owns the full
   * energy-deduction + stasis-check pipeline via energyManager.deduct().
   * Returns false if blocked (stasis, unknown command, or robot not found).
   */
  receiveManualCommand(userId: string, command: string): boolean {
    const cmd = command.toUpperCase();
    const robot = this.gameLoop.getRobots().find(r => r.id === userId);
    if (!robot || !robot.isAlive) return false;
    if (!MatchEngine.MANUAL_ALLOWED.has(cmd)) return false;

    if (cmd === 'SCAN') {
      const scanStmt: ScanStatement = { type: NodeType.ScanStatement };
      this.deps.actionExecutor.executeAction(userId, scanStmt, {});
    } else {
      const action: ActionExpression = { type: NodeType.ActionExpression, command: cmd, args: [] };
      this.deps.actionExecutor.executeAction(userId, action, {});
    }

    this.logger.debug(`Manual command for ${userId}: ${cmd}`);
    return true;
  }

  /**
   * Toggle lockVision for a robot.
   * When enabled, fovDirection syncs to rotation every tick.
   * When disabled, fovDirection freezes at its current value.
   * Returns the new lockVision state.
   */
  toggleLockVision(userId: string): boolean | null {
    const robot = this.gameLoop.getRobots().find(r => r.id === userId);
    if (!robot || !robot.isAlive) return null;
    robot.lockVision = !robot.lockVision;
    // When enabling, immediately sync so there's no 1-tick lag
    if (robot.lockVision) {
      robot.fovDirection = robot.rotation;
    }
    return robot.lockVision;
  }

  // ---------------------------------------------------------------------------
  // State access
  // ---------------------------------------------------------------------------

  getState() {
    return this.gameLoop.getGameState();
  }

  getInitialPlayers(): { id: string; script: string; color?: string; model?: string }[] {
    return this.initialPlayers;
  }

  /**
   * Returns per-robot efficiency scores keyed by robot ID.
   * Called by the gateway when the match ends.
   */
  getEfficiencyScores(): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const robot of this.gameLoop.getRobots()) {
      scores[robot.id] = this.deps.energyManager.getEfficiencyScore(robot);
    }
    return scores;
  }
}
