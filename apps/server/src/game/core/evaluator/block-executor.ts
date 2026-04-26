import { GameLoop, Robot } from '@logic-arena/engine';
import {
  Statement,
  NodeType,
  IfStatement,
  WhileStatement,
  AssignmentStatement,
  ActionStatement,
  CallStatement,
  WaitStatement,
  ScanStatement,
  FunctionDeclaration,
  ActionExpression,
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
  'MOVE',
  'MOVE_FAST',
  'BACKUP',
  'STOP',
  'PATHFIND',
  'WAIT',
  'SCAN',
  'FIRE',
  'BURST_FIRE',
]);

// ── Commands blocked during STASIS (user's script can still read IN_STASIS and branch)
// STOP and WAIT are intentionally excluded — they cost 0 energy and don't move the robot.
const STASIS_BLOCKED_ACTION_CMDS = new Set([
  'MOVE', 'MOVE_FAST', 'BACKUP', 'PATHFIND', 'FIRE', 'BURST_FIRE',
]);

export class BlockExecutor {
  constructor(
    private gameLoop: GameLoop,
    private actionExecutor: ActionExecutor,
    private expressionEvaluator: ExpressionEvaluator,
    private functions: Map<string, Map<string, FunctionDeclaration>>,
  ) {}

  executeBlock(
    robotId: string,
    robot: Robot,
    statements: Statement[],
    memory: Record<string, unknown>,
    tickStart: number,
  ): void {
    // Script execution continues during STASIS so users can branch on IN_STASIS.
    // Movement/combat commands are blocked at the action level below.
    // The physics layer (robot-updater.ts) enforces velocity=0 and no position updates.

    for (const stmt of statements) {
      if (robot.health <= 0) return;
      if (Date.now() - tickStart > CONSTANTS.MAX_TICK_DURATION_MS) {
        console.warn(`SANDBOX: tick timeout for robot ${robotId}`);
        return;
      }

      // ── Whitelist gate — skip unknown node types silently ────────────────
      if (!ALLOWED_NODE_TYPES.has(stmt.type)) {
        console.warn(
          `[SANDBOX] Skipping disallowed node type "${stmt.type}" for robot ${robotId}`,
        );
        continue;
      }

      switch (stmt.type) {
        // SET executes normally when the robot is active
        case NodeType.AssignmentStatement: {
          const assign = stmt as AssignmentStatement;
          const val = this.expressionEvaluator.evaluateExpression(
            robot,
            assign.value,
            memory,
            () => this.gameLoop.getRobots(),
          );
          memory[assign.name.value] = val;

          const ROTATION_ALIASES = ['rotation', 'angle', 'rot'];
          if (
            ROTATION_ALIASES.includes(assign.name.value) &&
            typeof val === 'number'
          ) {
            if ((robot.collisionCooldown ?? 0) > 0) {
              memory['rotation'] = robot.rotation;
              memory['angle'] = robot.rotation;
              memory['rot'] = robot.rotation;
              break;
            }

            robot.rotation = val;
            robot.isManualRotation = true;
            // Auto-disable lockVision — user is manually steering the body,
            // so the FOV should stay frozen at its last known direction.
            robot.lockVision = false;
          } else if (
            assign.name.value === 'fovDirection' &&
            typeof val === 'number'
          ) {
            robot.fovDirection = val;
            // Auto-disable lockVision — user is manually steering the scanner,
            // so the body should stay frozen at its last known direction.
            robot.lockVision = false;
          } else if (assign.name.value === 'lockVision') {
            robot.lockVision = Boolean(val);
          }
          break;
        }

        // IF always evaluates — stasis check is inside the action itself
        case NodeType.IfStatement: {
          const ifStmt = stmt as IfStatement;
          const cond = this.expressionEvaluator.evaluateCondition(
            robot,
            ifStmt.condition,
            memory,
            () => this.gameLoop.getRobots(),
          );
          if (cond) {
            this.executeBlock(
              robotId,
              robot,
              ifStmt.consequence,
              memory,
              tickStart,
            );
          } else if (ifStmt.alternate) {
            this.executeBlock(
              robotId,
              robot,
              ifStmt.alternate,
              memory,
              tickStart,
            );
          }
          break;
        }

        // WHILE — condition and body still execute during STASIS
        // so scripts can loop on IN_STASIS checks.
        case NodeType.WhileStatement: {
          const whileStmt = stmt as WhileStatement;
          let iters = 0;
          while (iters < CONSTANTS.MAX_WHILE_ITERS) {
            const cond = this.expressionEvaluator.evaluateCondition(
              robot,
              whileStmt.condition,
              memory,
              () => this.gameLoop.getRobots(),
            );
            if (!cond) break;
            this.executeBlock(
              robotId,
              robot,
              whileStmt.body,
              memory,
              tickStart,
            );
            iters++;
          }
          break;
        }

        case NodeType.ActionStatement: {
          const action = (stmt as ActionStatement).consequence;
          const cmd = action.command.toUpperCase();
          if (!ALLOWED_ACTION_COMMANDS.has(cmd)) {
            console.warn(
              `[SANDBOX] Skipping disallowed action "${cmd}" for robot ${robotId}`,
            );
            break;
          }
          // Skip movement and combat commands during STASIS.
          // STOP and WAIT are always allowed (they don't move the robot).
          if (robot.inStasis && STASIS_BLOCKED_ACTION_CMDS.has(cmd)) break;
          this.executeActionIfOffCooldown(robotId, action, memory);
          break;
        }

        case NodeType.CallStatement: {
          const funcName = (stmt as CallStatement).functionName.value;
          const funcMap = this.functions.get(robotId);
          if (funcMap) {
            const func = funcMap.get(funcName);
            if (func)
              this.executeBlock(robotId, robot, func.body, memory, tickStart);
          }
          break;
        }

        case NodeType.WaitStatement: {
          const ticks = (stmt as WaitStatement).ticks.value;
          memory['___waitTicks'] = ticks;
          return; // Stop current block execution
        }

        // SCAN is blocked during STASIS — it costs energy which the robot doesn't have.
        case NodeType.ScanStatement: {
          if (robot.inStasis) break;
          this.actionExecutor.executeAction(
            robotId,
            stmt as ScanStatement,
            memory,
          );
          break;
        }
      }
    }
  }

  private executeActionIfOffCooldown(
    robotId: string,
    action: ActionExpression,
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
