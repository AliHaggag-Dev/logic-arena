import { GameLoop, Robot } from '@logic-arena/engine';
import {
  Statement, NodeType,
  IfStatement, WhileStatement, AssignmentStatement, ActionStatement,
  CallStatement, WaitStatement, ScanStatement, FunctionDeclaration
} from '../../../../../../packages/logic-parser/src';
import { ActionExecutor } from '../executor';
import { ExpressionEvaluator } from './expression-facade';
import { CONSTANTS } from './types';

// ── Sandbox: allowed AST node types ─────────────────────────────────────────
const ALLOWED_NODE_TYPES = new Set<string>([
  NodeType.AssignmentStatement,
  NodeType.IfStatement,
  NodeType.WhileStatement,
  NodeType.ActionStatement,
  NodeType.CallStatement,
  NodeType.WaitStatement,
  NodeType.ScanStatement,
  NodeType.FunctionDeclaration,
]);

// ── Sandbox: allowed action command strings ─────────────────────────────────
const ALLOWED_ACTION_COMMANDS = new Set<string>([
  'MOVE', 'MOVE_FAST', 'BACKUP', 'STOP', 'PATHFIND',
  'WAIT', 'SCAN', 'FIRE', 'BURST_FIRE',
]);

export class BlockExecutor {
  constructor(
    private gameLoop: GameLoop,
    private actionExecutor: ActionExecutor,
    private expressionEvaluator: ExpressionEvaluator,
    private functions: Map<string, Map<string, FunctionDeclaration>>
  ) {}

  executeBlock(
    robotId: string,
    robot: Robot,
    statements: Statement[],
    memory: Record<string, unknown>,
    tickStart: number,
  ): void {
    for (const stmt of statements) {
      if (robot.health <= 0) return;
      if (Date.now() - tickStart > CONSTANTS.MAX_TICK_DURATION_MS) {
        console.warn(`SANDBOX: tick timeout for robot ${robotId}`);
        return;
      }

      // ── Whitelist gate — skip unknown node types silently ────────────────
      if (!ALLOWED_NODE_TYPES.has(stmt.type)) {
        console.warn(`[SANDBOX] Skipping disallowed node type "${stmt.type}" for robot ${robotId}`);
        continue;
      }

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
            this.executeBlock(robotId, robot, ifStmt.consequence, memory, tickStart);
          } else if (ifStmt.alternate) {
            this.executeBlock(robotId, robot, ifStmt.alternate, memory, tickStart);
          }
          break;
        }

        // WHILE always evaluates — stasis check is inside the action itself
        case NodeType.WhileStatement: {
          const whileStmt = stmt as WhileStatement;
          let iters = 0;
          while (iters < CONSTANTS.MAX_WHILE_ITERS) {
            const cond = this.expressionEvaluator.evaluateCondition(
              robot, whileStmt.condition, memory, () => this.gameLoop.getRobots(),
            );
            if (!cond) break;
            this.executeBlock(robotId, robot, whileStmt.body, memory, tickStart);
            iters++;
          }
          break;
        }

        case NodeType.ActionStatement: {
          const action = (stmt as ActionStatement).consequence;
          const cmd = action.command.toUpperCase();
          if (!ALLOWED_ACTION_COMMANDS.has(cmd)) {
            console.warn(`[SANDBOX] Skipping disallowed action "${cmd}" for robot ${robotId}`);
            break;
          }
          this.executeActionIfOffCooldown(robotId, action, memory);
          break;
        }

        case NodeType.CallStatement: {
          const funcName = (stmt as CallStatement).functionName.value;
          const funcMap = this.functions.get(robotId);
          if (funcMap) {
            const func = funcMap.get(funcName);
            if (func) this.executeBlock(robotId, robot, func.body, memory, tickStart);
          }
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
