import { GameLoop, Robot } from '@logic-arena/engine';
import {
  Program, Statement, NodeType,
  IfStatement, WhileStatement, AssignmentStatement, ActionStatement,
  CallStatement, FunctionDeclaration, WaitStatement, ScanStatement,
} from '../../../../../../packages/logic-parser/src';
import { ActionExecutor } from '../executor';
import { ExpressionEvaluator } from './expression-evaluator';
import { MemoryManager } from './memory-manager';

export class LogicEvaluator {
  private robotLogic = new Map<string, Program>();
  private memories = new MemoryManager();
  private expressionEvaluator = new ExpressionEvaluator();
  private functions = new Map<string, Map<string, FunctionDeclaration>>();
  private readonly MAX_WHILE_ITERS = 10;

  constructor(private gameLoop: GameLoop, private actionExecutor: ActionExecutor) { }

  // ---------------------------------------------------------------------------
  // Script management
  // ---------------------------------------------------------------------------

  setLogic(robotId: string, ast: Program): void {
    this.robotLogic.set(robotId, ast);
    this.memories.initialize(robotId);
    this.actionExecutor.clearState(robotId);

    const funcs = new Map<string, FunctionDeclaration>();
    ast.body.forEach(stmt => {
      if (stmt.type === NodeType.FunctionDeclaration) {
        funcs.set((stmt as FunctionDeclaration).name.value, stmt as FunctionDeclaration);
      }
    });
    this.functions.set(robotId, funcs);
  }

  clearAllLogic(): void {
    this.robotLogic.clear();
    this.memories.clearAll();
    this.functions.clear();
  }

  clearLogicForRobot(robotId: string): void {
    this.robotLogic.delete(robotId);
    this.memories.clearForRobot(robotId);
    this.functions.delete(robotId);
  }

  // ---------------------------------------------------------------------------
  // Per-tick evaluation entry point
  // ---------------------------------------------------------------------------

  evaluate(robotId: string): void {
    const program = this.robotLogic.get(robotId);
    const robot = this.gameLoop.getRobots().find(r => r.id === robotId);
    if (!program || !robot || robot.health <= 0) return;

    const memory = this.memories.getMemory(robotId);

    // Honour WAIT ticks
    const waitTicks = (memory['___waitTicks'] as number) ?? 0;
    if (waitTicks > 0) {
      memory['___waitTicks'] = waitTicks - 1;
      return;
    }

    // Sync physical rotational state into script memory each tick
    // so `set rotation = ...` knows the actual current facing.
    // All aliases (rotation / angle / rot) are synchronized simultaneously.
    memory['rotation'] = robot.rotation;
    memory['angle'] = robot.rotation;
    memory['rot'] = robot.rotation;
    memory['fovDirection'] = robot.fovDirection;

    // --- FOV-aware last_spotted memory ---
    // Only update last_spotted_x/y when the enemy is WITHIN the robot's FOV.
    // This enforces true blindness: a robot that hasn't scanned toward the enemy
    // retains the last known position but cannot refresh it.
    const visibleRobots = robot.visibleEntities?.robots ?? [];
    if (visibleRobots.length > 0) {
      // Use nearest visible enemy
      let nearest = visibleRobots[0];
      let nearestDst = Infinity;
      for (const r of visibleRobots) {
        const dx = r.position.x - robot.position.x;
        const dy = r.position.y - robot.position.y;
        const dst = dx * dx + dy * dy;
        if (dst < nearestDst) { nearestDst = dst; nearest = r; }
      }
      memory['last_spotted_x'] = nearest.position.x;
      memory['last_spotted_y'] = nearest.position.y;
    }
    // If nothing visible, last_spotted_x/y remain from the previous tick
    // (players must implement their own "forget after N ticks" logic)

    this.executeBlock(robotId, robot, program.body, memory);
  }

  // ---------------------------------------------------------------------------
  // Statement execution
  // ---------------------------------------------------------------------------

  private executeBlock(
    robotId: string,
    robot: Robot,
    statements: Statement[],
    memory: Record<string, unknown>,
  ): void {
    for (const stmt of statements) {
      if (robot.health <= 0) return;

      switch (stmt.type) {
        // SET always executes — even in STASIS (preserves stateful scripts)
        case NodeType.AssignmentStatement: {
          const assign = stmt as AssignmentStatement;
          const val = this.expressionEvaluator.evaluateExpression(
            robot, assign.value, memory, () => this.gameLoop.getRobots(),
          );
          memory[assign.name.value] = val;

          const ROTATION_ALIASES = ['rotation', 'angle', 'rot'];
          if (ROTATION_ALIASES.includes(assign.name.value) && typeof val === 'number') {

            if ((robot.collisionCooldown ?? 0) > 0) {
              memory['rotation'] = robot.rotation;
              memory['angle'] = robot.rotation;
              memory['rot'] = robot.rotation;
              break;
            }

            robot.rotation = val;
            robot.fovDirection = val;
            robot.isManualRotation = true;

          } else if (assign.name.value === 'fovDirection' && typeof val === 'number') {
            robot.fovDirection = val;
          } else if (assign.name.value === 'lockVision') {
            (robot as any).lockVision = Boolean(val);
          }
          break;
        }

        // IF always evaluates — stasis check is inside the action itself
        case NodeType.IfStatement: {
          const ifStmt = stmt as IfStatement;
          const cond = this.expressionEvaluator.evaluateCondition(
            robot, ifStmt.condition, memory, () => this.gameLoop.getRobots(),
          );
          if (cond) {
            this.executeBlock(robotId, robot, ifStmt.consequence, memory);
          } else if (ifStmt.alternate) {
            this.executeBlock(robotId, robot, ifStmt.alternate, memory);
          }
          break;
        }

        // WHILE always evaluates — stasis check is inside the action itself
        case NodeType.WhileStatement: {
          const whileStmt = stmt as WhileStatement;
          let iters = 0;
          while (iters < this.MAX_WHILE_ITERS) {
            const cond = this.expressionEvaluator.evaluateCondition(
              robot, whileStmt.condition, memory, () => this.gameLoop.getRobots(),
            );
            if (!cond) break;
            this.executeBlock(robotId, robot, whileStmt.body, memory);
            iters++;
          }
          break;
        }

        case NodeType.ActionStatement: {
          const action = (stmt as ActionStatement).consequence;
          this.executeActionIfOffCooldown(robotId, action, memory);
          break;
        }

        case NodeType.CallStatement: {
          const funcName = (stmt as CallStatement).functionName.value;
          const func = this.functions.get(robotId)?.get(funcName);
          if (func) this.executeBlock(robotId, robot, func.body, memory);
          break;
        }

        case NodeType.WaitStatement: {
          const ticks = (stmt as WaitStatement).ticks.value;
          memory['___waitTicks'] = ticks;
          return; // Stop current block execution
        }

        // SCAN always executes — costs energy but is not stasis-blocked
        case NodeType.ScanStatement: {
          this.actionExecutor.executeAction(robotId, stmt as ScanStatement, memory);
          break;
        }
      }
    }
  }

  private executeActionIfOffCooldown(
    robotId: string,
    action: any,
    memory: Record<string, unknown>,
  ): void {
    const cmd = action.command.toUpperCase();
    if (['MOVE', 'MOVE_FAST', 'BACKUP', 'STOP'].includes(cmd)) {
      // Movement is continuous — no cooldown gate needed
      this.actionExecutor.executeAction(robotId, action, memory);
      this.actionExecutor.markBareActionExecuted(robotId, cmd);
    } else if (this.actionExecutor.isBareActionOffCooldown(robotId, cmd)) {
      this.actionExecutor.executeAction(robotId, action, memory);
      this.actionExecutor.markBareActionExecuted(robotId, cmd);
    }
  }
}
