import {
  GameLoop,
  Robot,
  AliScriptMemoryLimitError,
  AliScriptSecurityError,
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
  QueryStatement,
  ReturnStatement,
} from '@logic-arena/logic-parser';
import { ActionExecutor } from '../executor';
import { ExpressionEvaluator } from './expression-facade';
import { CONSTANTS, OpsCounter } from './types';
import { executeActionIfOffCooldown } from './block-executor/action-dispatcher';
import { executeAssignmentStatement } from './block-executor/assignment-handler';
import {
  BREAK_SIGNAL,
  CONTINUE_SIGNAL,
  RETURN_SIGNAL,
  BlockResult,
} from './block-executor/control-flow';
import { executeQueryStatement } from './block-executor/query-evaluator';
import {
  ALLOWED_ACTION_COMMANDS,
  ALLOWED_NODE_TYPES,
  STASIS_BLOCKED_ACTION_CMDS,
} from './block-executor/sandbox-rules';

export type { BlockResult } from './block-executor/control-flow';

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
            console.warn(
              `TLE: Instruction quota exceeded for robot ${robotId}`,
            );
            this.actionExecutor.emitError(
              robotId,
              `[FATAL] TLE: Instruction quota exceeded (${CONSTANTS.MAX_OPERATIONS_PER_TICK} ops)`,
            );
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
                robot,
                retStmt.value,
                memory,
                () => this.gameLoop.getRobots(),
                () => this.gameLoop.getGameState().obstacles,
              );
            }
            return { signal: RETURN_SIGNAL, returnValue };
          }

          // SET executes normally when the robot is active
          case NodeType.AssignmentStatement: {
            executeAssignmentStatement(
              {
                gameLoop: this.gameLoop,
                expressionEvaluator: this.expressionEvaluator,
              },
              robot,
              stmt as AssignmentStatement,
              memory,
            );
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
              ? this.executeBlock(
                  robotId,
                  robot,
                  ifStmt.consequence,
                  memory,
                  opsCounter,
                  dispatchedActions,
                )
              : ifStmt.alternate
                ? this.executeBlock(
                    robotId,
                    robot,
                    ifStmt.alternate,
                    memory,
                    opsCounter,
                    dispatchedActions,
                  )
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
                robotId,
                robot,
                whileStmt.body,
                memory,
                opsCounter,
                dispatchedActions,
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
              robot,
              forStmt.start,
              memory,
              () => this.gameLoop.getRobots(),
              () => this.gameLoop.getGameState().obstacles,
            );
            const endVal = this.expressionEvaluator.evaluateExpression(
              robot,
              forStmt.end,
              memory,
              () => this.gameLoop.getRobots(),
              () => this.gameLoop.getGameState().obstacles,
            );

            if (typeof startVal !== 'number' || typeof endVal !== 'number')
              break;

            const varName = forStmt.variable.value;
            // Cap iterations to prevent infinite loops
            const maxIter = Math.min(
              Math.abs(endVal - startVal),
              CONSTANTS.MAX_WHILE_ITERS * 10,
            );
            let iterCount = 0;

            if (startVal <= endVal) {
              for (
                let i = startVal;
                i <= endVal && iterCount < maxIter;
                i++, iterCount++
              ) {
                memory[varName] = i;
                const result = this.executeBlock(
                  robotId,
                  robot,
                  forStmt.body,
                  memory,
                  opsCounter,
                  dispatchedActions,
                );
                if (result.signal === BREAK_SIGNAL) break;
                if (result.signal === RETURN_SIGNAL) return result;
              }
            } else {
              for (
                let i = startVal;
                i >= endVal && iterCount < maxIter;
                i--, iterCount++
              ) {
                memory[varName] = i;
                const result = this.executeBlock(
                  robotId,
                  robot,
                  forStmt.body,
                  memory,
                  opsCounter,
                  dispatchedActions,
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
              executeActionIfOffCooldown(
                this.actionExecutor,
                robotId,
                action,
                memory,
              );
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
                    const argValue =
                      i < callStmt.args.length
                        ? this.expressionEvaluator.evaluateExpression(
                            robot,
                            callStmt.args[i],
                            memory,
                            () => this.gameLoop.getRobots(),
                            () => this.gameLoop.getGameState().obstacles,
                          )
                        : undefined;
                    scopedMemory[paramName] = argValue;
                  }
                }

                const result = this.executeBlock(
                  robotId,
                  robot,
                  func.body,
                  scopedMemory,
                  opsCounter,
                  dispatchedActions,
                );

                // Copy back non-parameter variables (side effects like SET x = ...)
                // but DO NOT copy parameter names back (they are local-scoped)
                const paramNames = new Set(
                  func.params?.map((p) => p.value) ?? [],
                );
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
            executeQueryStatement(
              this.actionExecutor,
              robotId,
              robot,
              stmt as QueryStatement,
            );
            break;
          }
        }
      } catch (err) {
        if (
          err instanceof AliScriptMemoryLimitError ||
          err instanceof AliScriptSecurityError
        ) {
          const message = `[FATAL] ${err.message}`;
          console.warn(
            `Sandbox violation for robot ${robotId}: ${err.message}`,
          );
          this.actionExecutor.emitError(robotId, message);
          return { signal: BREAK_SIGNAL };
        }
        throw err;
      }
    }
    return {};
  }
}
