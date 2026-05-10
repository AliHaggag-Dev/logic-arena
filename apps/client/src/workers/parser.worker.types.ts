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
