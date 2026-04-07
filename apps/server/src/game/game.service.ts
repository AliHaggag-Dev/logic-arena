import { Injectable } from "@nestjs/common";
import { Socket } from "socket.io";
import { GameLoop, Robot } from "@logic-arena/engine";
import {
  Parser,
  Program,
  NodeType,
  ComparisonExpression,
  ActionExpression,
  NumberLiteral,
  Identifier,
  StringLiteral,
  IfStatement
} from "../../../../packages/logic-parser/src";

@Injectable()
export class GameService {
  private connectedClients: Map<string, Socket> = new Map();
  private lastFireTime: Map<string, number> = new Map();
  private readonly FIRE_COOLDOWN_MS = 500;
  private robotLogic: Map<string, Program> = new Map();
  private lastExecutedAction: Map<string, string> = new Map(); // Store the last executed action for feedback
  private gameLoop: GameLoop;
  private logicStates: Map<string, Map<string, boolean>> = new Map();

  constructor() {
    this.gameLoop = new GameLoop();

    this.gameLoop.addRobot({
      id: "bot-1",
      position: { x: 100, y: 100 },
      velocity: { x: 150, y: 120 },
      color: "#00FFFF",
      health: 100
    } as Robot);

    this.gameLoop.addRobot({
      id: "bot-2",
      position: { x: 600, y: 400 },
      velocity: { x: -120, y: 150 },
      color: "#FF00FF",
      health: 100
    } as Robot);

    this.gameLoop.start();

    // High-performance Logic Evaluation Loop (60 FPS)
    setInterval(() => {
      const robots = this.gameLoop.getRobots();

      robots.forEach(robot => {
        const logic = this.robotLogic.get(robot.id);
        if (logic && robot.health > 0) {
          this.evaluateLogic(robot.id, logic);
        }
      });
    }, 16);
  }

  getGameLoop(): GameLoop {
    return this.gameLoop;
  }

  getGameState(): Robot[] {
    return this.gameLoop.getRobots();
  }

  fire(robotId: string, targetX: number, targetY: number): void {
    const robots = this.gameLoop.getRobots();
    const robot = robots.find(r => r.id === robotId);

    if (robot && robot.health > 0) {
      this.gameLoop.spawnProjectile(
        robotId,
        { ...robot.position },
        { x: targetX, y: targetY }
      );
    }
  }

  fireProjectile(robotId: string): void {
    const now = Date.now();
    const lastFire = this.lastFireTime.get(robotId) || 0;

    if (now - lastFire < this.FIRE_COOLDOWN_MS) {
      return; // Cooldown active, do not fire
    }

    const robots = this.gameLoop.getRobots();
    const robot = robots.find(r => r.id === robotId);

    // Find a target robot that is alive and not the current robot
    const targetRobot = robots.find(r => r.id !== robotId && r.health > 0);

    if (robot && robot.health > 0 && targetRobot) {
      this.fire(robotId, targetRobot.position.x, targetRobot.position.y);
      this.lastFireTime.set(robotId, now); // Update last fire time
      console.log(`>> EXECUTING FIRE FOR ${robotId}`); // Essential debug log
    } else {
      console.log(`[Logic Engine] Robot ${robotId} tried to FIRE but no valid target or robot is dead.`);
    }
  }

  joinGame(client: Socket, userId: string): void {
    this.connectedClients.set(userId, client);
    client.on("disconnect", () => {
      this.connectedClients.delete(userId);
    });
  }

  resetGame(): void {
    this.gameLoop.getRobots().forEach(robot => {
      robot.health = 100;
    });
    this.robotLogic.clear();
  }

  updateRobotLogic(robotId: string, script: string): void {
    try {
      const parser = new Parser(script);
      const ast = parser.parse();
      this.robotLogic.set(robotId, ast);

      // Reset last executed action to allow fresh evaluation
      this.lastExecutedAction.delete(robotId);

      console.log(`[Brain Deploy] Logic successfully updated for ${robotId}`);
    } catch (error) {
      console.error(`[Parser Error] Failed to parse script for ${robotId}:`, error);
    }
  }

  private evaluateLogic(robotId: string, program: Program): void {
    const robot = this.gameLoop.getRobots().find(r => r.id === robotId);
    if (!robot || robot.health <= 0) return;

    // Initialize state map for this robot if it doesn't exist
    if (!this.logicStates.has(robotId)) {
      this.logicStates.set(robotId, new Map());
    }
    const robotStates = this.logicStates.get(robotId)!;

    program.body.forEach((statement, index) => {
      if (statement.type === NodeType.IfStatement) {
        const ifStatement = statement as IfStatement;

        // 1. Evaluate current condition
        const isConditionMet = this.evaluateComparison(robot, ifStatement.condition);

        // 2. Get previous state of this specific IF statement
        const wasConditionMetBefore = robotStates.get(index.toString()) || false;

        // 3. ONLY execute if condition just turned from FALSE to TRUE (Edge Trigger)
        if (isConditionMet && !wasConditionMetBefore) {
          this.executeAction(robotId, ifStatement.consequence);
        }

        // 4. Update the state for the next frame (60 FPS tick)
        robotStates.set(index.toString(), isConditionMet);
      }
    });
  }

  private evaluateComparison(robot: Robot, expression: ComparisonExpression): boolean {
    const leftValue = this.resolveValue(robot, expression.left);
    const rightValue = this.resolveValue(robot, expression.right);

    // Dynamic Debugging: Logs real-time distance to Server Terminal
    if (expression.left.type === NodeType.Identifier && expression.left.value === 'distance') {
      // console.log(`[REAL-TIME DEBUG] Distance for ${robot.id}: ${Math.round(leftValue)}`);
    }

    if (typeof leftValue !== typeof rightValue) return false;

    switch (expression.operator) {
      case "<": return leftValue < rightValue;
      case ">": return leftValue > rightValue;
      case "==": return leftValue === rightValue;
      default: return false;
    }
  }

  private executeAction(robotId: string, action: ActionExpression): void {
    // Normalize command to UpperCase to prevent string mismatch
    const actionCommand = action.command.toUpperCase();
    const lastAction = this.lastExecutedAction.get(robotId);

    // Event-Driven Optimization: Only emit to clients if action state changes
    if (actionCommand !== lastAction) {
      this.connectedClients.forEach(client => {
        client.emit("logicExecuted", {
          robotId,
          action: actionCommand,
          message: `Logic Triggered: ${actionCommand}`
        });
      });

      this.lastExecutedAction.set(robotId, actionCommand);
      console.log(`[Logic Execution] ${robotId} status changed to: ${actionCommand}`);
    }

    // Direct Execution Logic
    switch (actionCommand) {
      case "FIRE":
        this.fireProjectile(robotId);
        break;
      case "MOVE":
        // Future Vector-based pathfinding integration
        break;
      default:
        console.warn(`[Logic Error] Unknown command: ${actionCommand}`);
    }
  }

  private resolveValue(robot: Robot, node: Identifier | NumberLiteral | StringLiteral): any {
    if (node.type === NodeType.NumberLiteral || node.type === NodeType.StringLiteral) {
      return node.value;
    }

    if (node.type === NodeType.Identifier) {
      switch (node.value) {
        case "distance":
          const target = this.gameLoop.getRobots().find(r => r.id !== robot.id && r.health > 0);
          if (target) {
            const dx = robot.position.x - target.position.x;
            const dy = robot.position.y - target.position.y;
            return Math.sqrt(dx * dx + dy * dy); // Euclidean distance
          }
          return Infinity;
        case "health":
          return robot.health;
        default:
          return undefined;
      }
    }
    return undefined;
  }
}