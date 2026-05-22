import { Logger } from '@nestjs/common';
import { GameLoop, Robot, GameConfig, GameMode, ModeData, KothModeData, CtfModeData, SurvivalModeData } from '@logic-arena/engine';
import {
  processKothTick,
  processCtfTick,
  processSurvivalTick,
  KOTH_ZONE_CENTER_X,
  KOTH_ZONE_CENTER_Y,
  KOTH_ZONE_RADIUS,
  KOTH_SCORE_TARGET,
  CTF_SCORE_TARGET,
  SURVIVAL_BASE_ENEMIES,
  SURVIVAL_MAX_ENEMIES,
  SURVIVAL_HEALTH_BOOST_INTERVAL
} from './mode-processors';
import { SandboxRunner } from '../../common/sandbox.runner';
import { createRobot, parseAndSetLogic } from './robot-factory';
import { createGameDependencies, GameDependencies } from './game-dependencies';
import {
  NodeType,
  ActionExpression,
  ScanStatement,
} from '@logic-arena/logic-parser';

export class MatchEngine {
  private readonly logger = new Logger(MatchEngine.name);
  private gameLoop: GameLoop;
  private sandboxRunner: SandboxRunner;
  private deps: GameDependencies;
  private initialPlayers: {
    id: string;
    script: string;
    color?: string;
    model?: string;
    tracerColor?: string;
    spawnPosition?: { x: number; y: number };
    initialFovDirection?: number;
  }[] = [];
  private tickInterval: NodeJS.Timeout | null = null;
  private matchId: string;
  private config?: GameConfig;

  /** Accumulate match-level tracking for efficiency score */
  private lastTickTime: number = Date.now();

  constructor(
    matchId: string,
    initialPlayers: {
      id: string;
      script: string;
      color?: string;
      model?: string;
      tracerColor?: string;
      spawnPosition?: { x: number; y: number };
      initialFovDirection?: number;
    }[],
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
      this.gameLoop.addRobot(
        createRobot(p.id, p.script, i, p.color, p.model, p.tracerColor, p.spawnPosition, p.initialFovDirection),
      );
      parseAndSetLogic(p.id, p.script, this.deps.logicEvaluator);
    });

    this.initModeData();
  }

  private initModeData() {
    if (this.config?.mode === 'KING_OF_THE_HILL') {
      const modeData: KothModeData = {
        type: 'KOTH',
        zone: { x: KOTH_ZONE_CENTER_X, y: KOTH_ZONE_CENTER_Y, radius: KOTH_ZONE_RADIUS },
        zoneScores: { A: 0, B: 0 },
        scoreTarget: KOTH_SCORE_TARGET,
      };
      this.gameLoop.setModeData(modeData);
    } else if (this.config?.mode === 'CAPTURE_THE_FLAG') {
      const modeData: CtfModeData = {
        type: 'CTF',
        flags: [
          { team: 'A', position: { x: 100, y: 300 }, atBase: true },
          { team: 'B', position: { x: 700, y: 300 }, atBase: true },
        ],
        teamScores: { A: 0, B: 0 },
        scoreTarget: CTF_SCORE_TARGET,
        bases: { A: { x: 100, y: 300 }, B: { x: 700, y: 300 } },
      };
      this.gameLoop.setModeData(modeData);
    } else if (this.config?.mode === 'SURVIVAL') {
      const modeData: SurvivalModeData = {
        type: 'SURVIVAL',
        wave: 1,
        enemiesRemaining: SURVIVAL_BASE_ENEMIES,
        totalKills: 0,
      };
      this.gameLoop.setModeData(modeData);
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  reset(): void {
    this.stop();
    this.gameLoop = new GameLoop(this.config);
    this.deps = createGameDependencies(this.gameLoop, this.onEvent);
    this.initialPlayers.forEach((p, i) => {
      this.gameLoop.addRobot(
        createRobot(p.id, p.script, i, p.color, p.model, p.tracerColor, p.spawnPosition, p.initialFovDirection),
      );
      parseAndSetLogic(p.id, p.script, this.deps.logicEvaluator);
    });
    this.initModeData();
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

  tick(): void {
    this.gameLoop.getRobots().forEach((robot) => {
      if (!robot.isAlive) return;
      // Clear flag so logic executor can set it if an action is performed
      robot.executedCommandThisTick = false;
      this.deps.logicEvaluator.evaluate(robot.id);
      // Flush buffered action emits after all scripts for this robot have
      // been evaluated — prevents command alternation spam in the display.
      this.deps.actionExecutor.flushEmits(robot.id);
    });

    const modeData = this.gameLoop.getModeData();
    if (modeData) {
      const robots = this.gameLoop.getRobots();
      if (modeData.type === 'KOTH') {
        this.gameLoop.setModeData(processKothTick(robots, modeData));
      } else if (modeData.type === 'CTF') {
        this.gameLoop.setModeData(processCtfTick(robots, modeData));
      } else if (modeData.type === 'SURVIVAL') {
        const result = processSurvivalTick(robots, modeData);
        this.gameLoop.setModeData(result.modeData);
        if (result.waveComplete) {
          this.spawnSurvivalWave(result.modeData.wave);
        }
      }
    }
  }

  private spawnSurvivalWave(wave: number): void {
    const robots = this.gameLoop.getRobots();
    const player = robots.find(r => !r.id.startsWith('dummy-'));
    if (player) {
      player.health = 100;
      if (player.energy !== undefined) {
        player.energy = player.maxEnergy ?? 100;
      }
      player.inStasis = false;
    }

    // Remove all existing dummy robots
    const dummies = robots.filter(r => r.id.startsWith('dummy-'));
    for (const dummy of dummies) {
      this.gameLoop.removeRobot(dummy.id);
      this.deps.logicEvaluator.clearLogicForRobot(dummy.id);
    }

    const enemyCount = Math.min(wave + 2, SURVIVAL_MAX_ENEMIES);
    const enemyHealth = 100 + Math.floor((wave - 1) / SURVIVAL_HEALTH_BOOST_INTERVAL) * 20;

    const colors = ['#ef4444', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];

    for (let i = 1; i <= enemyCount; i++) {
      const id = `dummy-${i}`;
      const color = colors[(i - 1) % colors.length];
      const spawnX = Math.random() > 0.5 ? 50 : 750;
      const spawnY = Math.random() * 500 + 50;

      const dummy = createRobot(
        id,
        '',
        i, // index
        color,
        'unit-02',
        color,
        { x: spawnX, y: spawnY }
      );
      dummy.health = enemyHealth;
      dummy.ignoreEnergyCost = true;
      
      this.gameLoop.addRobot(dummy);
    }

    if (this.onEvent) {
      this.onEvent('survivalWaveComplete', { wave });
    }
  }

  // ---------------------------------------------------------------------------
  // Player management
  // ---------------------------------------------------------------------------

  addPlayer(playerScript: {
    id: string;
    script: string;
    color?: string;
    model?: string;
    tracerColor?: string;
  }): void {
    const exists = this.gameLoop
      .getRobots()
      .some((p) => p.id === playerScript.id);
    if (!exists) {
      let initIdx = this.initialPlayers.findIndex(
        (p) => p.id === playerScript.id,
      );

      if (initIdx === -1) {
        // Try to claim the bot-2 placeholder slot first (lobby join scenario)
        const botSlot = this.initialPlayers.findIndex((p) => p.id === 'bot-2');
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

      this.gameLoop.addRobot(
        createRobot(
          playerScript.id,
          playerScript.script,
          initIdx,
          playerScript.color,
          playerScript.model,
          playerScript.tracerColor,
        ),
      );
      parseAndSetLogic(
        playerScript.id,
        playerScript.script,
        this.deps.logicEvaluator,
      );
    }
  }

  removePlayer(userId: string): void {
    this.gameLoop.removeRobot(userId);
    this.deps.logicEvaluator.clearLogicForRobot(userId);
  }

  updateRobotScript(robotId: string, scriptContent: string): void {
    const exists = this.gameLoop.getRobots().some((r) => r.id === robotId);
    if (exists)
      parseAndSetLogic(robotId, scriptContent, this.deps.logicEvaluator);
  }

  updateInitialPlayer(userId: string, script: string): void {
    const index = this.initialPlayers.findIndex((p) => p.id === userId);
    if (index !== -1) this.initialPlayers[index].script = script;
  }

  /** Commands allowed via the manual override input. */
  private static readonly MANUAL_ALLOWED = new Set([
    'MOVE',
    'MOVE_FAST',
    'BACKUP',
    'STOP',
    'FIRE',
    'BURST_FIRE',
    'SCAN',
  ]);

  /**
   * Execute a manual override command for a robot.
   * Routes through actionExecutor.executeAction() which owns the full
   * energy-deduction + stasis-check pipeline via energyManager.deduct().
   * Returns false if blocked (stasis, unknown command, or robot not found).
   */
  receiveManualCommand(userId: string, command: string): boolean {
    const cmd = command.toUpperCase();
    const robot = this.gameLoop.getRobots().find((r) => r.id === userId);
    if (!robot || !robot.isAlive) return false;
    if (!MatchEngine.MANUAL_ALLOWED.has(cmd)) return false;

    if (cmd === 'SCAN') {
      const scanStmt: ScanStatement = { type: NodeType.ScanStatement };
      this.deps.actionExecutor.executeAction(userId, scanStmt, {});
    } else {
      const action: ActionExpression = {
        type: NodeType.ActionExpression,
        command: cmd,
        args: [],
      };
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
    const robot = this.gameLoop.getRobots().find((r) => r.id === userId);
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

  getGameLoop(): GameLoop {
    return this.gameLoop;
  }

  /** Enable headless simulation mode for campaign — cooldowns use virtual time. */
  setVirtualTime(ms: number): void {
    this.deps.actionExecutor.setVirtualTime(ms);
  }

  getState() {
    return this.gameLoop.getGameState();
  }

  getInitialPlayers(): {
    id: string;
    script: string;
    color?: string;
    model?: string;
  }[] {
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
