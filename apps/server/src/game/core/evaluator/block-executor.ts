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
  QueryStatement,
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
  NodeType.QueryStatement,
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

        case NodeType.ScanStatement: {
          if (robot.inStasis) break;
          this.actionExecutor.executeAction(
            robotId,
            stmt as ScanStatement,
            memory,
          );
          break;
        }

        case NodeType.QueryStatement: {
          const queryStmt = stmt as QueryStatement;
          const query = queryStmt.query;
          let result: string | number = 0;

          switch (query) {
            case 'GET_HEALTH':
              result = robot.health;
              break;
            case 'GET_ENERGY':
              result = Math.round(robot.energy ?? 0);
              break;
            case 'GET_ENERGY_PCT':
              result = Math.round(((robot.energy ?? 0) / (robot.maxEnergy ?? 100)) * 100);
              break;
            case 'GET_DISTANCE': {
              const visibleEnemies = robot.visibleEntities?.robots.filter(r => r.health > 0 && r.id !== robotId) || [];
              if (visibleEnemies.length === 0) {
                result = 'Infinity';
              } else {
                let minDist = Infinity;
                for (const enemy of visibleEnemies) {
                  const dx = enemy.position.x - robot.position.x;
                  const dy = enemy.position.y - robot.position.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist < minDist) minDist = dist;
                }
                result = Math.round(minDist);
              }
              break;
            }
            case 'GET_POSITION':
              result = `{x:${Math.round(robot.position.x)},y:${Math.round(robot.position.y)}}`;
              break;
            case 'GET_ROTATION':
              result = Number(robot.rotation.toFixed(2));
              break;
            case 'GET_FOV_DIR':
              result = Number((robot.fovDirection ?? robot.rotation).toFixed(2));
              break;
            case 'GET_VISIBLE_COUNT':
              result = robot.visibleEntities?.robots.filter(r => r.health > 0 && r.id !== robotId).length ?? 0;
              break;
            case 'GET_OBSTACLE_TYPE': {
              const obstacles = robot.visibleEntities?.obstacles || [];
              if (obstacles.length === 0) {
                result = 'NONE';
              } else {
                let nearest = obstacles[0];
                let minDist = Infinity;
                for (const obs of obstacles) {
                  const dx = obs.position.x - robot.position.x;
                  const dy = obs.position.y - robot.position.y;
                  const dist = dx * dx + dy * dy;
                  if (dist < minDist) {
                    minDist = dist;
                    nearest = obs;
                  }
                }
                result = nearest.type;
              }
              break;
            }
            case 'GET_OBSTACLE_DISTANCE': {
              const obstacles = robot.visibleEntities?.obstacles || [];
              if (obstacles.length === 0) {
                result = 'Infinity';
              } else {
                let minDist = Infinity;
                for (const obs of obstacles) {
                  const dx = obs.position.x - robot.position.x;
                  const dy = obs.position.y - robot.position.y;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  if (dist < minDist) minDist = dist;
                }
                result = Math.round(minDist);
              }
              break;
            }
          }

          this.actionExecutor.emitQuery(robotId, query, result);
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
