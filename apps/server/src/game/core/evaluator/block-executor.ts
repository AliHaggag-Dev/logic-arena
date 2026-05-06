import {
  GameLoop,
  Robot,
  AliScriptMemoryLimitError,
  AliScriptSecurityError,
  enforceAliScriptStringLimit,
  assertAliScriptCollectionCanGrow,
  isForbiddenAliScriptPropertyKey,
  safeSetAliScriptProperty,
} from '@logic-arena/engine';
import {
  Statement,
  NodeType,
  IfStatement,
  WhileStatement,
  ForStatement,
  AssignmentStatement,
  ActionStatement,
  CallStatement,
  WaitStatement,
  ScanStatement,
  FunctionDeclaration,
  ActionExpression,
  QueryStatement,
  BreakStatement,
  ContinueStatement,
  ReturnStatement,
} from '../../../../../../packages/logic-parser/src';
import { ActionExecutor } from '../executor';
import { ExpressionEvaluator } from './expression-facade';
import { CONSTANTS, OpsCounter } from './types';

// ── Sandbox: allowed AST node types ─────────────────────────────────────────
const ALLOWED_NODE_TYPES = new Set<string>([
  NodeType.AssignmentStatement,
  NodeType.IfStatement,
  NodeType.WhileStatement,
  NodeType.ForStatement,
  NodeType.ActionStatement,
  NodeType.CallStatement,
  NodeType.WaitStatement,
  NodeType.ScanStatement,
  NodeType.FunctionDeclaration,
  NodeType.QueryStatement,
  NodeType.BreakStatement,
  NodeType.ContinueStatement,
  NodeType.ReturnStatement,
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

/** Sentinel symbols for loop control flow signals. */
const BREAK_SIGNAL = Symbol('BREAK');
const CONTINUE_SIGNAL = Symbol('CONTINUE');
const RETURN_SIGNAL = Symbol('RETURN');

/** Result of executing a block — carries control flow signals up the stack. */
interface BlockResult {
  signal?: typeof BREAK_SIGNAL | typeof CONTINUE_SIGNAL | typeof RETURN_SIGNAL;
  returnValue?: unknown;
}

export class BlockExecutor {
  constructor(
    private gameLoop: GameLoop,
    private actionExecutor: ActionExecutor,
    private expressionEvaluator: ExpressionEvaluator,
    private functions: Map<string, Map<string, FunctionDeclaration>>,
  ) { }

  executeBlock(
    robotId: string,
    robot: Robot,
    statements: Statement[],
    memory: Record<string, unknown>,
    opsCounter: OpsCounter,
    dispatchedActions: Set<string> = new Set(),
  ): BlockResult {
    // Script execution continues during STASIS so users can branch on IN_STASIS.
    // Movement/combat commands are blocked at the action level below.
    // The physics layer (robot-updater.ts) enforces velocity=0 and no position updates.

    for (const stmt of statements) {
      try {
        if (robot.health <= 0) return {};
        opsCounter.count++;
        if (opsCounter.count > CONSTANTS.MAX_OPERATIONS_PER_TICK) {
          if (!opsCounter.warned) {
            console.warn(`TLE: Instruction quota exceeded for robot ${robotId}`);
            this.actionExecutor.emitError(robotId, `[FATAL] TLE: Instruction quota exceeded (${CONSTANTS.MAX_OPERATIONS_PER_TICK} ops)`);
            opsCounter.warned = true;
          }
          return { signal: BREAK_SIGNAL };
        }

        // ── Whitelist gate — skip unknown node types silently ────────────────
        if (!ALLOWED_NODE_TYPES.has(stmt.type)) {
          console.warn(
            `[SANDBOX] Skipping disallowed node type "${stmt.type}" for robot ${robotId}`,
          );
          continue;
        }

        switch (stmt.type) {
          // ── BREAK ─────────────────────────────────────────────────────────
          case NodeType.BreakStatement:
            return { signal: BREAK_SIGNAL };

          // ── CONTINUE ──────────────────────────────────────────────────────
          case NodeType.ContinueStatement:
            return { signal: CONTINUE_SIGNAL };

          // ── RETURN ────────────────────────────────────────────────────────
          case NodeType.ReturnStatement: {
            const retStmt = stmt as ReturnStatement;
            let returnValue: unknown;
            if (retStmt.value) {
              returnValue = this.expressionEvaluator.evaluateExpression(
                robot, retStmt.value, memory,
                () => this.gameLoop.getRobots(),
                () => this.gameLoop.getGameState().obstacles,
              );
            }
            return { signal: RETURN_SIGNAL, returnValue };
          }

          // SET executes normally when the robot is active
          case NodeType.AssignmentStatement: {
            const assign = stmt as AssignmentStatement;
            const val = this.expressionEvaluator.evaluateExpression(
              robot,
              assign.value,
              memory,
              () => this.gameLoop.getRobots(),
              () => this.gameLoop.getGameState().obstacles,
            );


            // Handle dot-notation property assignment: SET obj.prop = value
            if (assign.property) {
              if (isForbiddenAliScriptPropertyKey(assign.property)) {
                throw new AliScriptSecurityError(`Forbidden AliScript dictionary key: ${assign.property}`);
              }
              const dictTarget = memory[assign.name.value];
              if (dictTarget !== null && typeof dictTarget === 'object' && !Array.isArray(dictTarget)) {
                safeSetAliScriptProperty(dictTarget as Record<string, unknown>, assign.property, val);
              }
              break;
            }

            // Handle bracket-notation assignment: SET arr[i] = value  OR  SET obj["key"] = value
            if (assign.index) {
              const idx = this.expressionEvaluator.evaluateExpression(
                robot, assign.index, memory,
                () => this.gameLoop.getRobots(),
                () => this.gameLoop.getGameState().obstacles,
              );
              const container = memory[assign.name.value];
              if (Array.isArray(container) && typeof idx === 'number') {
                const i = Math.floor(idx);
                if (i === container.length) {
                  assertAliScriptCollectionCanGrow(container.length);
                  container.push(val);
                  break;
                }
                if (i >= 0 && i < container.length) {
                  container[i] = val;
                }
              } else if (container !== null && typeof container === 'object' && !Array.isArray(container)) {
                safeSetAliScriptProperty(container as Record<string, unknown>, String(idx), val);
              }
              break;
            }

            memory[assign.name.value] = typeof val === 'string' ? enforceAliScriptStringLimit(val) : val;

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
              () => this.gameLoop.getGameState().obstacles,
            );
            const result = cond
              ? this.executeBlock(robotId, robot, ifStmt.consequence, memory, opsCounter, dispatchedActions)
              : ifStmt.alternate
                ? this.executeBlock(robotId, robot, ifStmt.alternate, memory, opsCounter, dispatchedActions)
                : {};

            // Propagate control flow signals (BREAK, CONTINUE, RETURN) up through IF
            if (result.signal) return result;
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
                () => this.gameLoop.getGameState().obstacles,
              );
              if (!cond) break;
              const result = this.executeBlock(
                robotId, robot, whileStmt.body, memory, opsCounter, dispatchedActions,
              );
              if (result.signal === BREAK_SIGNAL) break;
              if (result.signal === RETURN_SIGNAL) return result;
              // CONTINUE_SIGNAL — just continue to next iteration
              iters++;
            }
            break;
          }

          // FOR i = start TO end DO ... END
          case NodeType.ForStatement: {
            const forStmt = stmt as ForStatement;
            const startVal = this.expressionEvaluator.evaluateExpression(
              robot, forStmt.start, memory,
              () => this.gameLoop.getRobots(),
              () => this.gameLoop.getGameState().obstacles,
            );
            const endVal = this.expressionEvaluator.evaluateExpression(
              robot, forStmt.end, memory,
              () => this.gameLoop.getRobots(),
              () => this.gameLoop.getGameState().obstacles,
            );

            if (typeof startVal !== 'number' || typeof endVal !== 'number') break;

            const varName = forStmt.variable.value;
            // Cap iterations to prevent infinite loops
            const maxIter = Math.min(Math.abs(endVal - startVal), CONSTANTS.MAX_WHILE_ITERS * 10);
            let iterCount = 0;

            if (startVal <= endVal) {
              for (let i = startVal; i <= endVal && iterCount < maxIter; i++, iterCount++) {
                memory[varName] = i;
                const result = this.executeBlock(
                  robotId, robot, forStmt.body, memory, opsCounter, dispatchedActions,
                );
                if (result.signal === BREAK_SIGNAL) break;
                if (result.signal === RETURN_SIGNAL) return result;
              }
            } else {
              for (let i = startVal; i >= endVal && iterCount < maxIter; i--, iterCount++) {
                memory[varName] = i;
                const result = this.executeBlock(
                  robotId, robot, forStmt.body, memory, opsCounter, dispatchedActions,
                );
                if (result.signal === BREAK_SIGNAL) break;
                if (result.signal === RETURN_SIGNAL) return result;
              }
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

            if (!dispatchedActions.has(cmd)) {
              dispatchedActions.add(cmd);
              this.executeActionIfOffCooldown(robotId, action, memory);
            }
            break;
          }

          // CALL with optional arguments — supports parameterized functions
          case NodeType.CallStatement: {
            const callStmt = stmt as CallStatement;
            const funcName = callStmt.functionName.value;
            const funcMap = this.functions.get(robotId);
            if (funcMap) {
              const func = funcMap.get(funcName);
              if (func) {
                // Create a scoped memory for function execution
                const scopedMemory = { ...memory };

                // Bind arguments to parameter names
                if (func.params && callStmt.args) {
                  for (let i = 0; i < func.params.length; i++) {
                    const paramName = func.params[i].value;
                    const argValue = i < callStmt.args.length
                      ? this.expressionEvaluator.evaluateExpression(
                        robot, callStmt.args[i], memory,
                        () => this.gameLoop.getRobots(),
                        () => this.gameLoop.getGameState().obstacles,
                      )
                      : undefined;
                    scopedMemory[paramName] = argValue;
                  }
                }

                const result = this.executeBlock(
                  robotId, robot, func.body, scopedMemory, opsCounter, dispatchedActions,
                );

                // Copy back non-parameter variables (side effects like SET x = ...)
                // but DO NOT copy parameter names back (they are local-scoped)
                const paramNames = new Set(func.params?.map(p => p.value) ?? []);
                for (const key of Object.keys(scopedMemory)) {
                  if (!paramNames.has(key)) {
                    memory[key] = scopedMemory[key];
                  }
                }

                // If function returned a value, store it in __return for the caller
                if (result.signal === RETURN_SIGNAL) {
                  memory['__return'] = result.returnValue;
                }
              }
            }
            break;
          }

          case NodeType.WaitStatement: {
            const ticks = (stmt as WaitStatement).ticks.value;
            memory['___waitTicks'] = ticks;
            return {}; // Stop current block execution
          }

          case NodeType.ScanStatement: {
            if (robot.inStasis) break;
            if (!dispatchedActions.has('SCAN')) {
              dispatchedActions.add('SCAN');
              this.actionExecutor.executeAction(
                robotId,
                stmt as ScanStatement,
                memory,
              );
            }
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
      } catch (err) {
        if (err instanceof AliScriptMemoryLimitError || err instanceof AliScriptSecurityError) {
          const message = `[FATAL] ${err.message}`;
          console.warn(`Sandbox violation for robot ${robotId}: ${err.message}`);
          this.actionExecutor.emitError(robotId, message);
          return { signal: BREAK_SIGNAL };
        }
        throw err;
      }
    }
    return {};
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
