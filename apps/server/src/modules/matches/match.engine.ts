import { GameLoop, Robot, GameConfig, GameMode } from "@logic-arena/engine";
import { SandboxRunner } from "../../common/sandbox.runner";
import { createRobot, parseAndSetLogic } from "./robot-factory";
import { createGameDependencies, GameDependencies } from "./game-dependencies";

export class MatchEngine {
  private gameLoop: GameLoop;
  private sandboxRunner: SandboxRunner;
  private deps: GameDependencies;
  private initialPlayers: { id: string; script: string }[] = [];
  private tickInterval: NodeJS.Timeout | null = null;
  private matchId: string;
  private config?: GameConfig;

  constructor(matchId: string, initialPlayers: { id: string; script: string }[], config?: GameConfig) {
    this.matchId = matchId;
    this.config = config;
    this.gameLoop = new GameLoop(this.config);
    this.sandboxRunner = new SandboxRunner();
    this.deps = createGameDependencies(this.gameLoop);
    this.initialPlayers = initialPlayers;
    initialPlayers.forEach((p, i) => {
      this.gameLoop.addRobot(createRobot(p.id, p.script, i));
      parseAndSetLogic(p.id, p.script, this.deps.logicEvaluator);
    });
  }

  reset() {
    this.stop();
    this.gameLoop = new GameLoop(this.config);
    this.deps = createGameDependencies(this.gameLoop);
    this.initialPlayers.forEach((p, i) => {
      this.gameLoop.addRobot(createRobot(p.id, p.script, i));
      parseAndSetLogic(p.id, p.script, this.deps.logicEvaluator);
    });
    this.start();
  }

  updateRobotScript(robotId: string, scriptContent: string) {
    const exists = this.gameLoop.getRobots().some(r => r.id === robotId);
    if (exists) parseAndSetLogic(robotId, scriptContent, this.deps.logicEvaluator);
  }

  receiveManualCommand(userId: string, command: string) {
    // This will likely involve directly manipulating a robot's state or issuing a specific action.
    // For simplicity, let's assume a direct action for now.
    const robot = this.gameLoop.getRobots().find(r => r.id === userId);
    if (robot) {
      console.log(`Manual command received for user ${userId}: ${command}`);
      // Example: If command is "fire", make the robot fire.
      // this.actionExecutor.executeAction(userId, { command: command, args: [] }, new Map());
    }
  }

  addPlayer(playerScript: { id: string; script: string }) {
    const exists = this.gameLoop.getRobots().some(p => p.id === playerScript.id);
    if (!exists) {
      const index = this.gameLoop.getRobots().length;
      this.gameLoop.addRobot(createRobot(playerScript.id, playerScript.script, index));
      parseAndSetLogic(playerScript.id, playerScript.script, this.deps.logicEvaluator);
    }
  }

  removePlayer(userId: string) {
    this.gameLoop.removeRobot(userId);
    this.deps.logicEvaluator.clearLogicForRobot(userId);
  }

  start(tickRate: number = 100) {
    this.gameLoop.start();
    this.tickInterval = setInterval(() => this.tick(), tickRate);
  }

  stop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    // Note: GameLoop doesn't have a stop() method, it's controlled by isRunning flag internally in its own loop if used.
    // However, our MatchEngine uses a separate setInterval for tick().
  }

  private tick() {
    this.gameLoop.getRobots().forEach(robot => {
      if (!robot.isAlive) return;
      this.deps.logicEvaluator.evaluate(robot.id);
    });
  }

  getState() {
    return this.gameLoop.getGameState();
  }

  updateInitialPlayer(userId: string, script: string) {
    const index = this.initialPlayers.findIndex(p => p.id === userId);
    if (index !== -1) {
      this.initialPlayers[index].script = script;
    }
  }
}
