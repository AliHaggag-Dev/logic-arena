import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { GameLoop, GameState } from "@logic-arena/engine";
import { Parser } from "@logic-arena/logic-parser";
import { Pathfinder } from "./core/pathfinder";
import { LogicEvaluator } from "./core/logic-evaluator";
import { ActionExecutor } from "./core/action-executor";

@Injectable()
export class GameService {
  private connectedClients: Map<string, Socket> = new Map();
  private gameLoop: GameLoop;

  // Injected sub-modules
  private pathfinder: Pathfinder;
  private logicEvaluator: LogicEvaluator;
  private actionExecutor: ActionExecutor;

  constructor() {
    this.gameLoop = new GameLoop();
    this.pathfinder = new Pathfinder(this.gameLoop);
    this.actionExecutor = new ActionExecutor(this.gameLoop, this.connectedClients, this.pathfinder);
    this.logicEvaluator = new LogicEvaluator(this.gameLoop, this.actionExecutor);

    this.initializeGame();
  }

  private initializeGame() {
    this.gameLoop.addRobot({
      id: 'bot-1',
      team: 'A',
      position: { x: 100, y: 100 },
      velocity: { x: 0, y: 0 },
      rotation: 0,
      health: 100,
      lastActionTime: 0,
      isAlive: true,
      code: '',
      memory: {},
      color: '#e5e4e0'
    });

    this.gameLoop.addRobot({
      id: 'bot-2',
      team: 'B',
      position: { x: 700, y: 500 },
      velocity: { x: 0, y: 0 },
      rotation: Math.PI,
      health: 100,
      lastActionTime: 0,
      isAlive: true,
      code: '',
      memory: {},
      color: '#4f4947'
    });

    this.gameLoop.start();
    this.pathfinder.rebuildGrid();

    // High-performance Logic Evaluation Loop (60 FPS)
    setInterval(() => {
      const robots = this.gameLoop.getRobots();
      robots.forEach(robot => {
        if (robot.health > 0) {
          this.logicEvaluator.evaluate(robot.id);
        }
      });
    }, 16);
  }

  getGameLoop(): GameLoop { return this.gameLoop; }
  getGameState(): GameState { return this.gameLoop.getGameState(); }

  joinGame(client: Socket, userId: string): void {
    this.connectedClients.set(userId, client);
    client.on("disconnect", () => this.connectedClients.delete(userId));
  }

  resetGame(): void {
    this.gameLoop.getRobots().forEach(robot => {
      robot.health = 100;
      robot.isAlive = true;
    });
    this.logicEvaluator.clearAllLogic();
  }

  updateRobotLogic(robotId: string, script: string): void {
    try {
      const parser = new Parser(script);
      const ast = parser.parse();
      this.logicEvaluator.setLogic(robotId, ast);
      console.log(`[Brain Deploy] Logic successfully updated for ${robotId}`);
    } catch (error) {
      console.error(`[Parser Error] Failed to parse script for ${robotId}:`, error);
    }
  }
}