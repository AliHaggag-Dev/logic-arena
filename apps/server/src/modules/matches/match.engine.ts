import { GameLoop, Robot, GameConfig, GameMode } from '@logic-arena/engine';
import { SandboxRunner } from '../../common/sandbox.runner';
import { createRobot, parseAndSetLogic } from './robot-factory';
import { createGameDependencies, GameDependencies } from './game-dependencies';

export class MatchEngine {
  private gameLoop: GameLoop;
  private sandboxRunner: SandboxRunner;
  private deps: GameDependencies;
  private initialPlayers: { id: string; script: string; color?: string }[] = [];
  private tickInterval: NodeJS.Timeout | null = null;
  private matchId: string;
  private config?: GameConfig;

  /** Accumulate match-level tracking for efficiency score */
  private lastTickTime: number = Date.now();

  constructor(
    matchId: string,
    initialPlayers: { id: string; script: string; color?: string }[],
    config?: GameConfig,
  ) {
    this.matchId       = matchId;
    this.config        = config;
    this.gameLoop      = new GameLoop(this.config);
    this.sandboxRunner = new SandboxRunner();
    this.deps          = createGameDependencies(this.gameLoop);
    this.initialPlayers = initialPlayers;

    initialPlayers.forEach((p, i) => {
      this.gameLoop.addRobot(createRobot(p.id, p.script, i, p.color));
      parseAndSetLogic(p.id, p.script, this.deps.logicEvaluator);
    });
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  reset(): void {
    this.stop();
    this.gameLoop = new GameLoop(this.config);
    this.deps     = createGameDependencies(this.gameLoop);
    this.initialPlayers.forEach((p, i) => {
      this.gameLoop.addRobot(createRobot(p.id, p.script, i, p.color));
      parseAndSetLogic(p.id, p.script, this.deps.logicEvaluator);
    });
    this.start();
  }

  start(tickRate: number = 100): void {
    this.gameLoop.start();
    this.lastTickTime  = Date.now();
    this.tickInterval  = setInterval(() => this.tick(), tickRate);
  }

  stop(): void {
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
      this.deps.logicEvaluator.evaluate(robot.id);
    });
  }

  // ---------------------------------------------------------------------------
  // Player management
  // ---------------------------------------------------------------------------

  addPlayer(playerScript: { id: string; script: string; color?: string }): void {
    const exists = this.gameLoop.getRobots().some(p => p.id === playerScript.id);
    if (!exists) {
      let initIdx = this.initialPlayers.findIndex(p => p.id === playerScript.id);
      
      if (initIdx === -1) {
        initIdx = this.initialPlayers.findIndex(p => p.id === 'bot-2');
        if (initIdx !== -1) {
          this.initialPlayers[initIdx] = playerScript;
        } else {
          initIdx = this.initialPlayers.length;
          this.initialPlayers.push(playerScript);
        }
      }

      this.gameLoop.addRobot(createRobot(playerScript.id, playerScript.script, initIdx, playerScript.color));
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

  receiveManualCommand(userId: string, command: string): void {
    const robot = this.gameLoop.getRobots().find(r => r.id === userId);
    if (robot) {
      console.log(`[MatchEngine] Manual command for ${userId}: ${command}`);
    }
  }

  // ---------------------------------------------------------------------------
  // State access
  // ---------------------------------------------------------------------------

  getState() {
    return this.gameLoop.getGameState();
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
