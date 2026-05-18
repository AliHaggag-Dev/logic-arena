export type SemanticSeverity = 'warning' | 'info';

export interface SemanticWarning {
  code: string;
  message: string;
  line?: number;
  severity: SemanticSeverity;
}
