import {
  GameLoop,
  Robot,
  AliScriptMemoryLimitError,
  AliScriptSecurityError,
} from '@logic-arena/engine';
import {
  Statement,
  NodeType,
  AssignmentStatement,
  ActionStatement,
  ActionExpression,
  IfStatement,
  WhileStatement,
  ForStatement,
  CallStatement,
  QueryStatement,
  WaitStatement,
  ScanStatement,
  ReturnStatement,
  FunctionDeclaration,
} from '@logic-arena/logic-parser';
import { ActionExecutor } from '../executor';
import { ExpressionEvaluator } from './expression-facade';
import { CONSTANTS, OpsCounter } from './types';
import { ActionOptimizer, BufferedAction } from './action-optimizer';
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
import { executeIfStatement } from './block-executor/if-handler';
import {
  executeWhileStatement,
  executeForStatement,
} from './block-executor/loop-handler';
import { executeCallStatement } from './block-executor/call-handler';
import { YieldInterrupt } from './yield-interrupt';

export type { BlockResult } from './block-executor/control-flow';

export class BlockExecutor {
  /** Per-tick buffer of movement actions for this robot.
   *  Populated during executeBlock, flushed & optimized after the block. */
  private actionBuffer: Map<string, BufferedAction[]> = new Map();

  constructor(
    private gameLoop: GameLoop,
    private actionExecutor: ActionExecutor,
    private expressionEvaluator: ExpressionEvaluator,
    private functions: Map<string, Map<string, FunctionDeclaration>>,
  ) {}

  /** Buffer a movement action for later optimization & execution.
   *  Non-movement actions (FIRE, BURST_FIRE) are dispatched immediately. */
  private bufferAction(
    robotId: string,
    cmd: string,
    action: BufferedAction['action'],
    memory: Record<string, unknown>,
  ): void {
    const buffer = this.actionBuffer.get(robotId) ?? [];
    // Keep the original memory reference.
    //
    // Movement executors are allowed to write system feedback back into
    // AliScript memory. Campaign graph levels rely on this for the internal
    // rail handshake:
    //   enemy script sets _SYS_TARGET_X/Y -> MOVE
    //   MovementExecutor snaps at the node and sets _SYS_AT_TARGET = 1
    //   next logic tick reads _SYS_AT_TARGET and advances to the next node
    //
    // Cloning memory here silently wrote _SYS_AT_TARGET into a throwaway copy,
    // so the red campaign robot kept targeting node 0 forever after deploy.
    buffer.push({ cmd, action, memory });
    this.actionBuffer.set(robotId, buffer);
  }

  /** Optimize buffered actions and execute the result.
   *  Called once per robot per tick from LogicEvaluator.evaluate(). */
  flushOptimizedActions(robotId: string): void {
    const buffered = this.actionBuffer.get(robotId);
    this.actionBuffer.delete(robotId);
    if (!buffered || buffered.length === 0) return;

    const optimized = ActionOptimizer.optimize(buffered);

    for (const { cmd, action, memory } of optimized) {
      if (cmd === 'SCAN') {
        this.actionExecutor.executeAction(
          robotId,
          action as ScanStatement,
          memory,
        );
      } else {
        executeActionIfOffCooldown(
          this.actionExecutor,
          robotId,
          action as ActionExpression,
          memory,
        );
      }
    }
  }

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

          case NodeType.IfStatement: {
            const result = executeIfStatement(
              (id, rbt, stmts, mem, ops, dispatched) =>
                this.executeBlock(id, rbt, stmts, mem, ops, dispatched),
              this.expressionEvaluator,
              robotId,
              robot,
              stmt as IfStatement,
              memory,
              opsCounter,
              dispatchedActions,
              this.gameLoop,
            );
            if (result) return result;
            break;
          }

          case NodeType.WhileStatement: {
            const result = executeWhileStatement(
              (id, rbt, stmts, mem, ops, dispatched) =>
                this.executeBlock(id, rbt, stmts, mem, ops, dispatched),
              this.expressionEvaluator,
              robotId,
              robot,
              stmt as WhileStatement,
              memory,
              opsCounter,
              dispatchedActions,
              this.gameLoop,
            );
            if (result) return result;
            break;
          }

          case NodeType.ForStatement: {
            const result = executeForStatement(
              (id, rbt, stmts, mem, ops, dispatched) =>
                this.executeBlock(id, rbt, stmts, mem, ops, dispatched),
              this.expressionEvaluator,
              robotId,
              robot,
              stmt as ForStatement,
              memory,
              opsCounter,
              dispatchedActions,
              this.gameLoop,
            );
            if (result) return result;
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

              // Movement state/event commands are buffered for the
              // ActionOptimizer, which removes contradictions like
              // PATHFIND followed by STOP. All other commands (FIRE,
              // BURST_FIRE) dispatch immediately as before.
              if (
                cmd === 'STOP' ||
                cmd === 'MOVE' ||
                cmd === 'MOVE_FAST' ||
                cmd === 'BACKUP' ||
                cmd === 'PATHFIND'
              ) {
                this.bufferAction(robotId, cmd, action, memory);
              } else {
                executeActionIfOffCooldown(
                  this.actionExecutor,
                  robotId,
                  action,
                  memory,
                );
              }
            }
            break;
          }

          case NodeType.CallStatement: {
            executeCallStatement(
              (id, rbt, stmts, mem, ops, dispatched) =>
                this.executeBlock(id, rbt, stmts, mem, ops, dispatched),
              this.expressionEvaluator,
              robotId,
              robot,
              stmt as CallStatement,
              memory,
              opsCounter,
              dispatchedActions,
              this.gameLoop,
              this.functions,
            );
            break;
          }

          case NodeType.WaitStatement: {
            const ticks = (stmt as WaitStatement).ticks.value;
            throw new YieldInterrupt(ticks);
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
