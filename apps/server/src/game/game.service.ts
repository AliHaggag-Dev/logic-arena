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
  IfStatement,
  AssignmentStatement,
  ActionStatement,
  Expression
} from "../../../../packages/logic-parser/src";

@Injectable()
export class GameService {
  private connectedClients: Map<string, Socket> = new Map();
  private lastFireTime: Map<string, number> = new Map();
  private readonly FIRE_COOLDOWN_MS = 500;
  private readonly MOVE_SPEED = 150;
  private readonly MOVE_FAST_MULTIPLIER = 2;
  private robotLogic: Map<string, Program> = new Map();
  private lastExecutedAction: Map<string, string> = new Map(); // Store the last executed action for feedback
  private gameLoop: GameLoop;
  private logicStates: Map<string, Map<string, boolean>> = new Map();
  private robotMemory: Map<string, Map<string, any>> = new Map();

  constructor() {
    this.gameLoop = new GameLoop();

    this.gameLoop.addRobot({
      id: "bot-1",
      position: { x: 100, y: 100 },
      velocity: { x: 0, y: 0 },
      color: "#00FFFF",
      health: 100
    } as Robot);

    this.gameLoop.addRobot({
      id: "bot-2",
      position: { x: 600, y: 400 },
      velocity: { x: 0, y: 0 },
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
    if (!this.robotMemory.has(robotId)) {
      this.robotMemory.set(robotId, new Map());
    }
    const robotStates = this.logicStates.get(robotId)!;
    const robotMemory = this.robotMemory.get(robotId)!;

    if (typeof (robot as any).rotation !== "number") {
      (robot as any).rotation = 0;
    }
    if (!robotMemory.has("rotation")) {
      robotMemory.set("rotation", (robot as any).rotation);
    }

    program.body.forEach((statement, index) => {
      if (statement.type === NodeType.AssignmentStatement) {
        const assignment = statement as AssignmentStatement;
        const value = this.evaluateExpression(robotId, robot, assignment.value);
        robotMemory.set(assignment.name.value, value);

        if (assignment.name.value === "rotation" && typeof value === "number") {
          (robot as any).rotation = value;
        }
        return;
      }

      if (statement.type === NodeType.ActionStatement) {
        const actionStatement = statement as ActionStatement;
        this.executeAction(robotId, actionStatement.consequence);
        return;
      }

      if (statement.type === NodeType.IfStatement) {
        const ifStatement = statement as IfStatement;

        // 1. Evaluate current condition
        const isConditionMet = this.evaluateCondition(robotId, robot, ifStatement.condition);

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

  private evaluateCondition(robotId: string, robot: Robot, expression: Expression): boolean {
    const value = this.evaluateExpression(robotId, robot, expression);
    if (typeof value === "boolean") {
      return value;
    }
    return Boolean(value);
  }

  private evaluateExpression(robotId: string, robot: Robot, expression: Expression): any {
    switch (expression.type) {
      case NodeType.NumberLiteral:
      case NodeType.StringLiteral:
      case NodeType.BooleanLiteral:
        return expression.value;
      case NodeType.Identifier:
        return this.resolveValue(robotId, robot, expression);
      case NodeType.BinaryExpression: {
        const left = this.evaluateExpression(robotId, robot, expression.left);
        const right = this.evaluateExpression(robotId, robot, expression.right);
        if (typeof left !== "number" || typeof right !== "number") {
          return undefined;
        }
        return expression.operator === "+" ? left + right : left - right;
      }
      case NodeType.UnaryExpression: {
        const argument = this.evaluateExpression(robotId, robot, expression.argument);
        return expression.operator === "NOT" ? !Boolean(argument) : undefined;
      }
      case NodeType.ComparisonExpression: {
        const leftValue = this.evaluateExpression(robotId, robot, expression.left);
        const rightValue = this.evaluateExpression(robotId, robot, expression.right);

        if (typeof leftValue !== typeof rightValue) return false;

        switch (expression.operator) {
          case "<": return leftValue < rightValue;
          case ">": return leftValue > rightValue;
          case "==": return leftValue === rightValue;
          default: return false;
        }
      }
      default:
        return undefined;
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
      case "BURST_FIRE":
        this.fireProjectile(robotId);
        break;
      case "STOP": {
        const robot = this.gameLoop.getRobots().find(r => r.id === robotId);
        if (robot) {
          robot.velocity.x = 0;
          robot.velocity.y = 0;
        }
        break;
      }
      case "MOVE":
      case "MOVE_FAST":
      case "BACKUP": {
        const robot = this.gameLoop.getRobots().find(r => r.id === robotId);
        if (robot) {
          const rotation = typeof (robot as any).rotation === "number" ? (robot as any).rotation : 0;
          const speedMultiplier = actionCommand === "MOVE_FAST" ? this.MOVE_FAST_MULTIPLIER : 1;
          const directionMultiplier = actionCommand === "BACKUP" ? -1 : 1;
          const speed = this.MOVE_SPEED * speedMultiplier * directionMultiplier;
          robot.velocity.x = Math.cos(rotation) * speed;
          robot.velocity.y = Math.sin(rotation) * speed;
        }
        break;
      }
      default:
        console.warn(`[Logic Error] Unknown command: ${actionCommand}`);
    }
  }

  private getClosestTarget(robot: Robot): Robot | null {
    const targets = this.gameLoop.getRobots().filter(r => r.id !== robot.id && r.health > 0);
    if (targets.length === 0) return null;

    return targets.reduce((closest, current) => {
      const closestDx = robot.position.x - closest.position.x;
      const closestDy = robot.position.y - closest.position.y;
      const currentDx = robot.position.x - current.position.x;
      const currentDy = robot.position.y - current.position.y;

      const closestDistance = closestDx * closestDx + closestDy * closestDy;
      const currentDistance = currentDx * currentDx + currentDy * currentDy;

      return currentDistance < closestDistance ? current : closest;
    });
  }

  private isTargetSpotted(robot: Robot, target: Robot | null): boolean {
    if (!target) return false;

    const dx = target.position.x - robot.position.x;
    const dy = target.position.y - robot.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) return true;
    if (distance > 1000) return false;

    const rotation = typeof (robot as any).rotation === "number" ? (robot as any).rotation : null;
    let fx = 0;
    let fy = 0;

    if (rotation !== null) {
      fx = Math.cos(rotation);
      fy = Math.sin(rotation);
    } else {
      const vx = robot.velocity.x;
      const vy = robot.velocity.y;
      const speed = Math.hypot(vx, vy);
      if (speed < 0.001) return false;
      fx = vx / speed;
      fy = vy / speed;
    }

    const dot = (fx * dx + fy * dy) / distance;
    return dot >= 0.5;
  }

  private resolveValue(robotId: string, robot: Robot, node: Identifier | NumberLiteral | StringLiteral): any {
    if (node.type === NodeType.NumberLiteral || node.type === NodeType.StringLiteral) {
      return node.value;
    }

    if (node.type === NodeType.Identifier) {
      const memory = this.robotMemory.get(robotId);
      if (memory && memory.has(node.value)) {
        return memory.get(node.value);
      }

      const target = this.getClosestTarget(robot);

      switch (node.value) {
        case "distance":
          if (target) {
            const dx = robot.position.x - target.position.x;
            const dy = robot.position.y - target.position.y;
            return Math.sqrt(dx * dx + dy * dy); // Euclidean distance
          }
          return Infinity;
        case "health":
          return robot.health;
        case "rotation":
          return typeof (robot as any).rotation === "number" ? (robot as any).rotation : 0;
        case "target_vx":
          return target ? target.velocity.x : 0;
        case "target_vy":
          return target ? target.velocity.y : 0;
        case "bullet_speed":
          return 400;
        case "spotted":
          return this.isTargetSpotted(robot, target);
        default:
          return undefined;
      }
    }
    return undefined;
  }
}