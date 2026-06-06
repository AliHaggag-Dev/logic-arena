import { Logger } from '@nestjs/common';
import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  GameLoop,
  Robot,
  GameConfig,
  GameMode,
  ModeData,
  KothModeData,
  CtfModeData,
  SurvivalModeData,
  Obstacle,
  MapTheme,
} from '@logic-arena/engine';
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
  SURVIVAL_HEALTH_BOOST_INTERVAL,
  processRacingTick,
} from './mode-processors';
import { SandboxRunner } from '../../common/sandbox.runner';
import { createRobot, parseAndSetLogic } from './robot-factory';
import { createGameDependencies, GameDependencies } from './game-dependencies';
import {
  NodeType,
  ActionExpression,
  ScanStatement,
} from '@logic-arena/logic-parser';

const SURVIVAL_DUMMY_SCRIPT = `
WHILE TRUE DO
  SCAN
  IF CAN_SEE_ENEMY THEN
    SET dx = NEAREST_VISIBLE_X - POSITION_X
    SET dy = NEAREST_VISIBLE_Y - POSITION_Y
    SET targetAngleRad = ATAN2(dy, dx)
    SET targetAngleDeg = targetAngleRad * 57.2957795
    SET rotation = targetAngleDeg
    SET distance = SQRT((dx * dx) + (dy * dy))
    IF distance <= 300 THEN
      FIRE
    END
    IF distance > 150 THEN
      MOVE_FAST
    ELSE
      STOP
    END
  ELSE
    SET rotation = rotation + 15
  END
END
`;

export class MatchEngine {
  private static readonly LAVA_POOL_RADIUS = 40;
  private static readonly ICE_PATCH_RADIUS = 50;
  private static readonly EMP_STRIKE_RADIUS = 60;
  private static readonly EMP_SPAWN_INTERVAL_TICKS = 200;
  private static readonly EMP_EXPLODE_AFTER_TICKS = 20;
  private static readonly EMP_ENERGY_DAMAGE = 100;
  private static readonly LAVA_DAMAGE_PER_TICK = 1;

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
  private readonly mapTheme: MapTheme;
  private tickCount: number = 0;

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
    private onEvent?: (event: string, payload: Record<string, unknown>) => void,
  ) {
    this.matchId = matchId;
    this.mapTheme = config?.mapTheme ?? 'CYBER';
    this.config = { ...config, mapTheme: this.mapTheme };
    this.gameLoop = new GameLoop(this.config);
    this.sandboxRunner = new SandboxRunner();
    this.deps = createGameDependencies(this.gameLoop, this.onEvent);
    this.initialPlayers = initialPlayers;

    initialPlayers.forEach((p, i) => {
      this.gameLoop.addRobot(
        createRobot(
          p.id,
          p.script,
          i,
          p.color,
          p.model,
          p.tracerColor,
          p.spawnPosition,
          p.initialFovDirection,
        ),
      );
      parseAndSetLogic(p.id, p.script, this.deps.logicEvaluator);
    });

    this.initModeData();
    this.initEnvironmentHazards();
  }

  private initModeData() {
    if (this.config?.mode === 'KING_OF_THE_HILL') {
      const modeData: KothModeData = {
        type: 'KOTH',
        zone: {
          x: KOTH_ZONE_CENTER_X,
          y: KOTH_ZONE_CENTER_Y,
          radius: KOTH_ZONE_RADIUS,
        },
        zoneScores: { A: 0, B: 0 },
        scoreTarget: KOTH_SCORE_TARGET,
      };
      this.gameLoop.setModeData(modeData);

      // Spawn 4 solid obstacles around the KOTH zone to create a fortress
      const d = 110;
      const obstacles = this.gameLoop.getObstacles();
      obstacles.push({
        id: 'koth-wall-1',
        type: 'SOLID',
        width: 40,
        height: 100,
        rotation: 0,
        position: { x: KOTH_ZONE_CENTER_X - d, y: KOTH_ZONE_CENTER_Y },
      });
      obstacles.push({
        id: 'koth-wall-2',
        type: 'SOLID',
        width: 40,
        height: 100,
        rotation: 0,
        position: { x: KOTH_ZONE_CENTER_X + d, y: KOTH_ZONE_CENTER_Y },
      });
      obstacles.push({
        id: 'koth-wall-3',
        type: 'SOLID',
        width: 100,
        height: 40,
        rotation: 0,
        position: { x: KOTH_ZONE_CENTER_X, y: KOTH_ZONE_CENTER_Y - d },
      });
      obstacles.push({
        id: 'koth-wall-4',
        type: 'SOLID',
        width: 100,
        height: 40,
        rotation: 0,
        position: { x: KOTH_ZONE_CENTER_X, y: KOTH_ZONE_CENTER_Y + d },
      });
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
        spawned: 0,
      };
      this.gameLoop.setModeData(modeData);
      this.spawnSurvivalWave(1);
    } else if (this.config?.mode === 'RACING') {
      const finishLinePos = { x: 750, y: 300 };
      const modeData: import('@logic-arena/engine').RacingModeData = {
        type: 'RACING',
        laps: 1,
        finishLine: finishLinePos,
      };
      this.gameLoop.setModeData(modeData);

      const obstacles = this.gameLoop.getObstacles();
      obstacles.push({
        id: 'finish-line',
        type: 'FINISH_LINE',
        position: finishLinePos,
        width: 100,
        height: 600,
        rotation: 0,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  reset(): void {
    this.stop();
    this.gameLoop = new GameLoop(this.config);
    this.deps = createGameDependencies(this.gameLoop, this.onEvent);
    this.tickCount = 0;
    this.initialPlayers.forEach((p, i) => {
      this.gameLoop.addRobot(
        createRobot(
          p.id,
          p.script,
          i,
          p.color,
          p.model,
          p.tracerColor,
          p.spawnPosition,
          p.initialFovDirection,
        ),
      );
      parseAndSetLogic(p.id, p.script, this.deps.logicEvaluator);
    });
    this.initModeData();
    this.initEnvironmentHazards();
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
    this.tickCount += 1;
    this.processHazards();

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
      } else if (modeData.type === 'RACING') {
        this.gameLoop.setModeData(processRacingTick(robots, modeData));
      }
    }
  }

  private initEnvironmentHazards(): void {
    if (this.mapTheme === 'LAVA') {
      // Remove static LAVA obstacles — replaced by dynamic LAVA_POOL hazards
      const obstacles = this.gameLoop.getObstacles();
      for (let i = obstacles.length - 1; i >= 0; i--) {
        if (obstacles[i].type === 'LAVA') obstacles.splice(i, 1);
      }
      this.spawnThemeHazards(
        'LAVA_POOL',
        MatchEngine.LAVA_POOL_RADIUS,
        this.randomInt(3, 4),
      );
    } else if (this.mapTheme === 'ICE') {
      // Remove static LAVA obstacles — inconsistent with glacial theme
      const obstacles = this.gameLoop.getObstacles();
      for (let i = obstacles.length - 1; i >= 0; i--) {
        if (obstacles[i].type === 'LAVA') obstacles.splice(i, 1);
      }
      this.spawnThemeHazards(
        'ICE_PATCH',
        MatchEngine.ICE_PATCH_RADIUS,
        this.randomInt(2, 3),
      );
    }
  }

  private spawnSurvivalWave(wave: number): void {
    const robots = this.gameLoop.getRobots();
    const player = robots.find((r) => !r.id.startsWith('dummy-'));
    if (player) {
      player.health = 100;
      if (player.energy !== undefined) {
        player.energy = player.maxEnergy ?? 100;
      }
      player.inStasis = false;
    }

    // Remove all existing dummy robots
    const dummies = robots.filter((r) => r.id.startsWith('dummy-'));
    for (const dummy of dummies) {
      this.gameLoop.removeRobot(dummy.id);
      this.deps.logicEvaluator.clearLogicForRobot(dummy.id);
    }

    const enemyCount = Math.min(wave + 2, SURVIVAL_MAX_ENEMIES);
    const enemyHealth =
      100 + Math.floor((wave - 1) / SURVIVAL_HEALTH_BOOST_INTERVAL) * 20;

    const colors = [
      '#ef4444',
      '#eab308',
      '#3b82f6',
      '#8b5cf6',
      '#ec4899',
      '#f97316',
    ];

    for (let i = 1; i <= enemyCount; i++) {
      const id = `dummy-${i}`;
      const color = colors[(i - 1) % colors.length];

      // Spawn along the edges randomly
      const edge = Math.floor(Math.random() * 4);
      let spawnX = 0,
        spawnY = 0;
      if (edge === 0) {
        spawnX = this.randomFloat(50, 750);
        spawnY = 50;
      } else if (edge === 1) {
        spawnX = 750;
        spawnY = this.randomFloat(50, 550);
      } else if (edge === 2) {
        spawnX = this.randomFloat(50, 750);
        spawnY = 550;
      } else {
        spawnX = 50;
        spawnY = this.randomFloat(50, 550);
      }

      const dummy = createRobot(
        id,
        SURVIVAL_DUMMY_SCRIPT,
        i, // index
        color,
        'unit-02',
        color,
        { x: spawnX, y: spawnY },
      );
      dummy.health = enemyHealth;
      dummy.ignoreEnergyCost = true;

      this.gameLoop.addRobot(dummy);
      parseAndSetLogic(
        dummy.id,
        SURVIVAL_DUMMY_SCRIPT,
        this.deps.logicEvaluator,
      );
    }

    // Track cumulative spawned for real-time totalKills computation
    const modeData = this.gameLoop.getModeData();
    if (modeData?.type === 'SURVIVAL') {
      modeData.spawned = (modeData.spawned || 0) + enemyCount;
    }

    if (this.onEvent) {
      this.onEvent('survivalWaveComplete', { wave });
    }
  }

  private spawnThemeHazards(
    type: 'LAVA_POOL' | 'ICE_PATCH',
    radius: number,
    count: number,
  ): void {
    const obstacles = this.gameLoop.getObstacles();
    for (let index = 0; index < count; index += 1) {
      obstacles.push(
        this.createCircularHazard(
          `${type.toLowerCase()}-${this.matchId}-${index}`,
          type,
          radius,
        ),
      );
    }
  }

  private processHazards(): void {
    const obstacles = this.gameLoop.getObstacles();
    const robots = this.gameLoop.getRobots();

    for (const robot of robots) {
      robot.insideIcePatch = false;
    }

    for (const obstacle of obstacles) {
      if (obstacle.type !== 'LAVA_POOL' && obstacle.type !== 'ICE_PATCH') {
        continue;
      }

      const radius = obstacle.width / 2;
      for (const robot of robots) {
        if (
          !robot.isAlive ||
          !this.isRobotInsideHazard(robot, obstacle, radius)
        ) {
          continue;
        }

        if (obstacle.type === 'LAVA_POOL') {
          robot.health = Math.max(
            0,
            robot.health - MatchEngine.LAVA_DAMAGE_PER_TICK,
          );
          if (robot.health === 0) robot.isAlive = false;
        } else {
          robot.insideIcePatch = true;
        }
      }
    }

    if (this.mapTheme === 'CYBER') {
      this.processCyberStorm(obstacles, robots);
    }
  }

  private processCyberStorm(obstacles: Obstacle[], robots: Robot[]): void {
    if (this.tickCount % MatchEngine.EMP_SPAWN_INTERVAL_TICKS === 0) {
      obstacles.push(
        this.createCircularHazard(
          `emp-strike-${this.matchId}-${this.tickCount}`,
          'EMP_STRIKE',
          MatchEngine.EMP_STRIKE_RADIUS,
          this.tickCount,
        ),
      );
    }

    for (let index = obstacles.length - 1; index >= 0; index -= 1) {
      const obstacle = obstacles[index];
      if (obstacle.type !== 'EMP_STRIKE') continue;

      const createdAtTick = obstacle.createdAt ?? this.tickCount;
      if (
        this.tickCount - createdAtTick <
        MatchEngine.EMP_EXPLODE_AFTER_TICKS
      ) {
        continue;
      }

      for (const robot of robots) {
        if (
          !robot.isAlive ||
          !this.isRobotInsideHazard(
            robot,
            obstacle,
            MatchEngine.EMP_STRIKE_RADIUS,
          )
        ) {
          continue;
        }

        robot.energy = Math.max(
          0,
          (robot.energy ?? 0) - MatchEngine.EMP_ENERGY_DAMAGE,
        );
        if ((robot.energy ?? 0) <= 0) {
          robot.inStasis = true;
        }
      }
      obstacles.splice(index, 1);
    }
  }

  private createCircularHazard(
    id: string,
    type: 'LAVA_POOL' | 'ICE_PATCH' | 'EMP_STRIKE',
    radius: number,
    createdAt?: number,
  ): Obstacle {
    return {
      id,
      type,
      position: {
        x: this.randomFloat(radius, ARENA_WIDTH - radius),
        y: this.randomFloat(radius, ARENA_HEIGHT - radius),
      },
      width: radius * 2,
      height: radius * 2,
      rotation: Math.random() * Math.PI * 2,
      createdAt,
    };
  }

  private isRobotInsideHazard(
    robot: Robot,
    obstacle: Obstacle,
    radius: number,
  ): boolean {
    const dx = robot.position.x - obstacle.position.x;
    const dy = robot.position.y - obstacle.position.y;
    return dx * dx + dy * dy <= radius * radius;
  }

  private randomFloat(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(this.randomFloat(min, max + 1));
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
    'LEAD_FIRE',
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
