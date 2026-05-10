import {
  Program,
  Statement,
  NodeType,
  ActionStatement,
  AssignmentStatement,
  CallStatement,
  ReturnStatement,
  IfStatement,
  WhileStatement,
  ForStatement,
  Expression,
} from '../types';

// ─── Warning Types ──────────────────────────────────────────────────────────

export type SemanticSeverity = 'warning' | 'info';

export interface SemanticWarning {
  /** Machine-readable code, e.g. "contradictory-command" */
  code: string;
  /** Human-readable explanation */
  message: string;
  /** 1-based line in the source (undefined when AST lacks line info) */
  line?: number;
  severity: SemanticSeverity;
}

// ─── Command Categories (mirrors action-optimizer.ts) ───────────────────────

const MOVEMENT_STATE = new Set(['STOP', 'MOVE', 'MOVE_FAST', 'BACKUP']);
const MOVEMENT_EVENT = new Set(['PATHFIND']);

/** Commands that cancel a previous movement intent when they appear later. */
const CANCELS_MOVEMENT = new Set([...MOVEMENT_STATE]);

/** Early-exit statement types that make subsequent code unreachable. */
const EARLY_EXIT_TYPES = new Set([
  NodeType.ReturnStatement,
  NodeType.BreakStatement,
  NodeType.WaitStatement,
]);

// ─── Analyzer ───────────────────────────────────────────────────────────────

/**
 * Single-pass semantic analyzer for AliScript ASTs.
 *
 * Operates on **linear blocks only** — it does NOT enter IF/ELSE branches,
 * WHILE/FOR bodies, or FUNCTION bodies, because the programmer may
 * intentionally have different logic in different branches.
 *
 * Detectable patterns:
 * 1. Contradictory movement sequences (PATHFIND→STOP, MOVE→STOP, etc.)
 * 2. Redundant variable assignments without intermediate reads
 * 3. Dead code after RETURN / BREAK / WAIT
 */
export class SemanticAnalyzer {
  /**
   * Analyze a parsed AliScript program and return semantic warnings.
   * The program still executes normally regardless of warnings.
   */
  analyze(ast: Program): SemanticWarning[] {
    return this.analyzeBlock(ast.body);
  }

  // ── Block-level analysis ────────────────────────────────────────────────

  private analyzeBlock(statements: Statement[]): SemanticWarning[] {
    const warnings: SemanticWarning[] = [];

    this.detectContradictoryCommands(statements, warnings);
    this.detectRedundantAssignments(statements, warnings);
    this.detectDeadCode(statements, warnings);

    return warnings;
  }

  // ── 1. Contradictory command sequences ────────────────────────────────

  /**
   * Scans a linear block for movement commands that are immediately
   * cancelled by a later command in the same block.
   *
   * Examples:
   *   PATHFIND "target" → STOP        ⇒ PATHFIND is immediately cancelled
   *   MOVE 3            → STOP        ⇒ MOVE is immediately cancelled
   *   MOVE 3            → MOVE_FAST 5 ⇒ first MOVE is overwritten
   */
  private detectContradictoryCommands(
    statements: Statement[],
    warnings: SemanticWarning[],
  ): void {
    /** Stack of unresolved movement commands in order of appearance. */
    const pendingMovements: Array<{
      command: string;
      index: number;
      statement: ActionStatement;
    }> = [];

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      // Only inspect top-level action statements; skip control flow.
      if (stmt.type !== NodeType.ActionStatement) {
        // A non-action statement (SET, CALL, SCAN, etc.) does NOT
        // consume pending movements — they stay pending.
        continue;
      }

      const actionStmt = stmt as ActionStatement;
      const cmd = actionStmt.consequence.command;

      if (MOVEMENT_EVENT.has(cmd) || MOVEMENT_STATE.has(cmd)) {
        // Check if this command cancels any pending movement
        if (CANCELS_MOVEMENT.has(cmd) && pendingMovements.length > 0) {
          for (const pending of pendingMovements) {
            warnings.push({
              code: 'contradictory-command',
              message: `${pending.command} is immediately cancelled by ${cmd}`,
              severity: 'warning',
            });
          }
          // Clear pending list; the new command is now the "settled" one.
          pendingMovements.length = 0;
        }

        // Push this command as a new pending movement
        pendingMovements.push({ command: cmd, index: i, statement: actionStmt });
      }
    }
  }

  // ── 2. Redundant assignments ──────────────────────────────────────────

  /**
   * Detects `SET x = …` followed by `SET x = …` with no read of `x`
   * in between (within the same linear block).
   *
   * Only considers simple variable names (not indexed/property assignments).
   */
  private detectRedundantAssignments(
    statements: Statement[],
    warnings: SemanticWarning[],
  ): void {
    /**
     * Maps variable name → index of the last SET that wrote to it,
     * for which no read has been observed yet.
     */
    const lastUnreadAssignment = new Map<string, number>();

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      if (stmt.type === NodeType.AssignmentStatement) {
        const assignStmt = stmt as AssignmentStatement;
        const varName = assignStmt.name.value;

        // Only track simple variable assignments (no .prop or [index])
        if (assignStmt.index !== undefined || assignStmt.property !== undefined) {
          // An indexed/property write is also a "read" of the variable itself
          lastUnreadAssignment.delete(varName);
          continue;
        }

        // Check if this variable's RHS expression reads any tracked variables
        this.collectReads(assignStmt.value, lastUnreadAssignment);

        // If variable was previously assigned without being read, warn
        if (lastUnreadAssignment.has(varName)) {
          warnings.push({
            code: 'redundant-assignment',
            message: `${varName} assigned but never read before reassignment`,
            severity: 'warning',
          });
        }

        // Track this new assignment as the latest unread write
        lastUnreadAssignment.set(varName, i);
      } else {
        // Any other statement may read variables — collect identifier reads
        this.collectReadsFromStatement(stmt, lastUnreadAssignment);
      }
    }
  }

  /**
   * Walk an expression tree and remove any referenced identifiers
   * from the `unread` map (since they've been read).
   */
  private collectReads(
    expr: Expression,
    unread: Map<string, number>,
  ): void {
    switch (expr.type) {
      case NodeType.Identifier:
        unread.delete(expr.value);
        break;
      case NodeType.BinaryExpression:
      case NodeType.ComparisonExpression:
        this.collectReads(expr.left, unread);
        this.collectReads(expr.right, unread);
        break;
      case NodeType.UnaryExpression:
        this.collectReads(expr.argument, unread);
        break;
      case NodeType.FunctionCallExpression:
        for (const arg of expr.args) {
          this.collectReads(arg, unread);
        }
        break;
      case NodeType.IndexExpression:
        this.collectReads(expr.object, unread);
        this.collectReads(expr.index, unread);
        break;
      case NodeType.MemberExpression:
        this.collectReads(expr.object, unread);
        break;
      case NodeType.ArrayLiteral:
        for (const el of expr.elements) {
          this.collectReads(el, unread);
        }
        break;
      case NodeType.ObjectLiteral:
        for (const prop of expr.properties) {
          this.collectReads(prop.value, unread);
        }
        break;
      case NodeType.ActionExpression:
        if (expr.args) {
          for (const arg of expr.args) {
            this.collectReads(arg, unread);
          }
        }
        break;
      // NumberLiteral, StringLiteral, BooleanLiteral — no reads
      default:
        break;
    }
  }

  /**
   * For non-assignment statements, scan all embedded expressions for reads.
   */
  private collectReadsFromStatement(
    stmt: Statement,
    unread: Map<string, number>,
  ): void {
    switch (stmt.type) {
      case NodeType.ActionStatement: {
        const action = (stmt as ActionStatement).consequence;
        if (action.args) {
          for (const arg of action.args) {
            this.collectReads(arg, unread);
          }
        }
        break;
      }
      case NodeType.CallStatement: {
        // Call arguments read variables
        const call = stmt as CallStatement;
        if (call.args) {
          for (const arg of call.args) {
            this.collectReads(arg, unread);
          }
        }
        break;
      }
      case NodeType.ReturnStatement: {
        const ret = stmt as ReturnStatement;
        if (ret.value) {
          this.collectReads(ret.value, unread);
        }
        break;
      }
      case NodeType.IfStatement:
      case NodeType.WhileStatement:
      case NodeType.ForStatement:
      case NodeType.FunctionDeclaration:
        // Control-flow/block statements — we do NOT descend into their
        // bodies (linear-block-only analysis), but their conditions
        // and expressions DO read variables.
        this.collectReadsFromControlFlow(stmt, unread);
        break;
      case NodeType.QueryStatement:
        // Queries like GET_HEALTH() don't reference user variables
        break;
      default:
        break;
    }
  }

  /**
   * Collect reads from control-flow conditions/expressions WITHOUT
   * descending into their bodies (stays in the linear block).
   */
  private collectReadsFromControlFlow(
    stmt: Statement,
    unread: Map<string, number>,
  ): void {
    switch (stmt.type) {
      case NodeType.IfStatement: {
        const ifStmt = stmt as IfStatement;
        this.collectReads(ifStmt.condition, unread);
        break;
      }
      case NodeType.WhileStatement: {
        const whileStmt = stmt as WhileStatement;
        this.collectReads(whileStmt.condition, unread);
        break;
      }
      case NodeType.ForStatement: {
        const forStmt = stmt as ForStatement;
        this.collectReads(forStmt.start, unread);
        this.collectReads(forStmt.end, unread);
        break;
      }
      default:
        break;
    }
  }

  // ── 3. Dead code after early exit ─────────────────────────────────────

  /**
   * Detects statements that appear after RETURN, BREAK, or WAIT
   * in the same linear block.
   */
  private detectDeadCode(
    statements: Statement[],
    warnings: SemanticWarning[],
  ): void {
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];

      if (EARLY_EXIT_TYPES.has(stmt.type) && i < statements.length - 1) {
        const exitName = this.getExitName(stmt.type);
        warnings.push({
          code: 'unreachable-code',
          message: `Unreachable code after ${exitName}`,
          severity: 'warning',
        });
        // Only report one warning per block; the first unreachable
        // point is sufficient.
        break;
      }
    }
  }

  private getExitName(type: NodeType): string {
    switch (type) {
      case NodeType.ReturnStatement:
        return 'RETURN';
      case NodeType.BreakStatement:
        return 'BREAK';
      case NodeType.WaitStatement:
        return 'WAIT';
      default:
        return type;
    }
  }
}
