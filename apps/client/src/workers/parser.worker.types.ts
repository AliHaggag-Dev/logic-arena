/**
 * Mirrored from @logic-arena/logic-parser SemanticWarning.
 * Kept as a standalone type to avoid importing the full parser bundle
 * in React components (the parser runs inside a Web Worker).
 */
export type SemanticSeverity = 'warning' | 'info';

export interface SemanticWarning {
  code: string;
  message: string;
  line?: number;
  severity: SemanticSeverity;
}

// ── Inline Diagnostics ───────────────────────────────────────────────────────

export type DiagnosticSeverity = 'error' | 'warning';
export type DiagnosticAction = 'replace' | 'delete';

/**
 * Mirrored from shared-script-editor/diagnostics.ts.
 * Represents a single inline diagnostic marker (red/yellow underline).
 */
export interface DiagnosticMarker {
  /** 0-indexed line number. */
  line: number;
  /** Start column within the line (0-indexed). */
  startCol: number;
  /** End column within the line (0-indexed, exclusive). */
  endCol: number;
  /** Red = error, yellow = warning. */
  severity: DiagnosticSeverity;
  /** Human-readable message shown in the hover tooltip. */
  message: string;
  /** Suggested fix text (the word to replace with, or empty for deletion). */
  suggestion?: string;
  /** What pressing Tab should do. */
  action?: DiagnosticAction;
}
