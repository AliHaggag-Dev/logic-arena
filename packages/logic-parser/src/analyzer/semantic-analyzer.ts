import { Program, Statement } from '../types';
import { SemanticWarning } from './types';
import { detectContradictoryCommands } from './contradiction-detector';
import { detectRedundantAssignments } from './redundancy-detector';
import { detectDeadCode } from './dead-code-detector';

export class SemanticAnalyzer {
  analyze(ast: Program): SemanticWarning[] {
    return this.analyzeBlock(ast.body);
  }

  private analyzeBlock(statements: Statement[]): SemanticWarning[] {
    const warnings: SemanticWarning[] = [];

    detectContradictoryCommands(statements, warnings);
    detectRedundantAssignments(statements, warnings);
    detectDeadCode(statements, warnings);

    return warnings;
  }
}
