import { SandboxRunner } from "../../common/sandbox.runner";
import { GameLoop, Robot } from "@logic-arena/engine";
import { ActionExecutor } from "../../game/core/action-executor";
import { Pathfinder } from "../../game/core/pathfinder";
import { LogicEvaluator } from "../../game/core/logic-evaluator";
import { Parser } from "../../../../../packages/logic-parser/src";

const ROBOT_COLORS = ["#00ffff", "#ff00ff", "#ffff00", "#00ff00", "#ff6600", "#ff0066"];

export class MatchEngine {
  private gameLoop: GameLoop;
  private sandboxRunner: SandboxRunner;
  private actionExecutor: ActionExecutor;
  private pathfinder: Pathfinder;
  private logicEvaluator: LogicEvaluator;
  private tickInterval: NodeJS.Timeout | null = null;
  private matchId: string;

  constructor(matchId: string, initialPlayers: { id: string; script: string }[]) {
    this.matchId = matchId;
    this.gameLoop = new GameLoop();
    this.sandboxRunner = new SandboxRunner();
    this.pathfinder = new Pathfinder(this.gameLoop);
    this.actionExecutor = new ActionExecutor(this.gameLoop, new Map(), this.pathfinder); // TODO: pass connectedClients map
    this.logicEvaluator = new LogicEvaluator(this.gameLoop, this.actionExecutor);

    initialPlayers.forEach((p, index) => {
      const robot: Robot = {
        id: p.id,
        position: { x: Math.random() * 800, y: Math.random() * 600 },
        health: 100,
        color: ROBOT_COLORS[index % ROBOT_COLORS.length],
        velocity: { x: 0, y: 0 },
        rotation: 0,
        isAlive: true,
        team: index % 2 === 0 ? "A" : "B",
        lastActionTime: 0,
        code: p.script,
        memory: {},
      };
      this.gameLoop.addRobot(robot);
      try {
        const parser = new Parser(p.script);
        const ast = parser.parse();
        this.logicEvaluator.setLogic(p.id, ast);
      } catch (error) {
        console.error(`Error parsing script for robot ${p.id}:`, error);
      }
    });
  }

  reset() {
    this.gameLoop = new GameLoop(); // Re-initialize GameLoop for a full reset
    this.logicEvaluator.clearAllLogic();
    // Re-add initial players (if needed, or handle this based on match logic)
    // For now, assuming match creation handles initial players
  }

  updateRobotScript(robotId: string, scriptContent: string) {
    const robot = this.gameLoop.getRobots().find(r => r.id === robotId);
    if (robot) {
      try {
        const parser = new Parser(scriptContent);
        const ast = parser.parse();
        this.logicEvaluator.setLogic(robotId, ast);
      } catch (error) {
        console.error(`Error parsing script for robot ${robotId}:`, error);
      }
    }
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
    const playerExists = this.gameLoop.getRobots().some(p => p.id === playerScript.id);
    if (!playerExists) {
      const index = this.gameLoop.getRobots().length;
      const robot: Robot = {
        id: playerScript.id,
        position: { x: Math.random() * 800, y: Math.random() * 600 },
        health: 100,
        color: ROBOT_COLORS[index % ROBOT_COLORS.length],
        velocity: { x: 0, y: 0 },
        rotation: 0,
        isAlive: true,
        team: index % 2 === 0 ? "A" : "B",
        lastActionTime: 0,
        code: playerScript.script,
        memory: {},
      };
      this.gameLoop.addRobot(robot);
      try {
        const parser = new Parser(playerScript.script);
        const ast = parser.parse();
        this.logicEvaluator.setLogic(playerScript.id, ast);
      } catch (error) {
        console.error(`Error parsing script for robot ${playerScript.id}:`, error);
      }
    }
  }

  removePlayer(userId: string) {
    this.gameLoop.getRobots().filter(p => p.id !== userId);
    // Also clear logic and state for this robot
    this.logicEvaluator.clearAllLogic(); // This clears all, might need to be specific
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
      this.logicEvaluator.evaluate(robot.id);
    });
  }

  // This method is no longer needed as action execution is handled by LogicEvaluator and ActionExecutor
  private applyAction(playerId: string, action: any) { }

  getState() {
    return this.gameLoop.getGameState();
  }
}
