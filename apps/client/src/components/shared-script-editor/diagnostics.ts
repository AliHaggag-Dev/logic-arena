// ─────────────────────────────────────────────────────────────────────────────
// AliScript Diagnostics Engine
// Produces inline markers for syntax errors (red) and logic warnings (yellow).
// Runs off-main-thread inside the parser Web Worker.
// ─────────────────────────────────────────────────────────────────────────────

import {
  ALL_VALID_UPPER,
  ALL_VALID_UPPER_ARRAY,
  ALL_VALID_LOWER,
  KEYWORDS,
  ACTION_COMMANDS,
  BUILTIN_FUNCTIONS,
  QUERY_FUNCTIONS,
  LOOP_KEYWORDS,
  MOVEMENT_COMMANDS,
  BLOCK_OPENERS,
  MAX_LEVENSHTEIN_DISTANCE,
  MIN_WORD_LENGTH_FOR_CHECK,
} from './diagnostics.constants';

// ── Types ────────────────────────────────────────────────────────────────────

export type DiagnosticSeverity = 'error' | 'warning';
export type DiagnosticAction = 'replace' | 'delete';

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

// ── Levenshtein Distance ─────────────────────────────────────────────────────

/**
 * Classic O(n×m) Levenshtein edit distance between two strings.
 * Used to find the closest valid keyword for an unknown identifier.
 */
function levenshtein(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;

  // Early exits
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  // Single-row DP
  const row: number[] = Array.from({ length: bLen + 1 }, (_, i) => i);

  for (let i = 1; i <= aLen; i++) {
    let prev = i;
    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const val = Math.min(
        row[j]! + 1,        // deletion
        prev + 1,            // insertion
        row[j - 1]! + cost,  // substitution
      );
      row[j - 1] = prev;
      prev = val;
    }
    row[bLen] = prev;
  }

  return row[bLen]!;
}

/**
 * Find the closest match from the master vocabulary for an unknown word.
 * Returns the best match and its distance, or null if nothing is close enough.
 */
function findClosestMatch(word: string): { match: string; distance: number } | null {
  const upper = word.toUpperCase();
  let bestMatch = '';
  let bestDist = MAX_LEVENSHTEIN_DISTANCE + 1;

  for (const candidate of ALL_VALID_UPPER_ARRAY) {
    // Quick length-based pruning — can't be closer than length difference
    const lenDiff = Math.abs(candidate.length - upper.length);
    if (lenDiff > bestDist) continue;

    const dist = levenshtein(upper, candidate);
    if (dist < bestDist) {
      bestDist = dist;
      bestMatch = candidate;
      if (dist === 0) break; // exact match
    }
  }

  if (bestDist <= MAX_LEVENSHTEIN_DISTANCE && bestDist > 0) {
    return { match: bestMatch, distance: bestDist };
  }
  return null;
}

// ── Tokenizer (lightweight, line-aware) ──────────────────────────────────────

interface LineWord {
  word: string;
  col: number; // start column within the line
}

const WORD_REGEX = /[A-Za-z_][A-Za-z0-9_]*/g;

function extractWordsFromLine(line: string): LineWord[] {
  const results: LineWord[] = [];
  WORD_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = WORD_REGEX.exec(line)) !== null) {
    results.push({ word: match[0], col: match.index });
  }
  return results;
}

// ── Syntax Diagnostics (Red Underlines) ──────────────────────────────────────

/**
 * Collect all user-defined variable names from SET statements.
 * This prevents false positives on user variables.
 */
function collectUserVariables(lines: string[]): Set<string> {
  const vars = new Set<string>();
  const setPattern = /\bSET\s+([A-Za-z_][A-Za-z0-9_]*)/gi;

  for (const line of lines) {
    setPattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = setPattern.exec(line)) !== null) {
      vars.add(match[1]!);
    }
  }
  return vars;
}

/**
 * Collect user-defined function names from FUNCTION declarations.
 */
function collectUserFunctions(lines: string[]): Set<string> {
  const funcs = new Set<string>();
  const funcPattern = /\bFUNCTION\s+([A-Za-z_][A-Za-z0-9_]*)/gi;

  for (const line of lines) {
    funcPattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = funcPattern.exec(line)) !== null) {
      funcs.add(match[1]!.toUpperCase());
    }
  }
  return funcs;
}

function isInsideComment(line: string, col: number): boolean {
  const slashIdx = line.indexOf('//');
  const dashIdx = line.indexOf('--');
  const commentIdx = slashIdx >= 0 && dashIdx >= 0
      ? Math.min(slashIdx, dashIdx)
      : slashIdx >= 0 ? slashIdx : dashIdx;
  return commentIdx >= 0 && col >= commentIdx;
}

function isInsideString(line: string, col: number): boolean {
  let inString = false;
  let quoteChar = '';
  for (let i = 0; i < col; i++) {
    const ch = line[i];
    if (!inString && (ch === '"' || ch === "'")) {
      inString = true;
      quoteChar = ch;
    } else if (inString && ch === quoteChar && line[i - 1] !== '\\') {
      inString = false;
    }
  }
  return inString;
}

function computeSyntaxDiagnostics(
  lines: string[],
  userVars: Set<string>,
  userFuncs: Set<string>,
): DiagnosticMarker[] {
  const markers: DiagnosticMarker[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]!;
    const words = extractWordsFromLine(line);

    for (const { word, col } of words) {
      // Skip short words (likely loop vars, etc.)
      if (word.length < MIN_WORD_LENGTH_FOR_CHECK) continue;

      // Skip words inside comments or strings
      if (isInsideComment(line, col)) continue;
      if (isInsideString(line, col)) continue;

      const upper = word.toUpperCase();

      // Check if it's a known identifier (case-insensitive for uppercase vocab)
      if (ALL_VALID_UPPER.has(upper)) continue;

      // Check case-sensitive properties (distance, health, etc.)
      if (ALL_VALID_LOWER.has(word)) continue;

      // Check user-defined variables (case-sensitive for lowercase, uppercase for SET'd vars)
      if (userVars.has(word) || userVars.has(upper)) continue;

      // Check user-defined functions
      if (userFuncs.has(upper)) continue;

      // It's an unknown word — try to find a suggestion
      const closest = findClosestMatch(word);
      if (closest) {
        markers.push({
          line: lineIdx,
          startCol: col,
          endCol: col + word.length,
          severity: 'error',
          message: `Unknown command "${word}". Did you mean "${closest.match}"? (Press Tab to replace)`,
          suggestion: closest.match,
          action: 'replace',
        });
      }
    }
  }

  return markers;
}

// ── Logic Diagnostics (Yellow Underlines) ────────────────────────────────────

interface LineStatement {
  keyword: string;
  lineIdx: number;
  col: number;
  endCol: number;
}

/**
 * Extract the first significant keyword from each line for logic analysis.
 */
function extractStatementKeywords(lines: string[]): LineStatement[] {
  const statements: LineStatement[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]!;
    const trimmed = line.trimStart();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('--')) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    if (!match) continue;

    const keyword = match[1]!.toUpperCase();
    const col = line.length - trimmed.length;
    statements.push({
      keyword,
      lineIdx,
      col,
      endCol: col + match[1]!.length,
    });
  }

  return statements;
}

function computeLogicDiagnostics(lines: string[]): DiagnosticMarker[] {
  const markers: DiagnosticMarker[] = [];
  const statements = extractStatementKeywords(lines);

  for (let i = 1; i < statements.length; i++) {
    const prev = statements[i - 1]!;
    const curr = statements[i]!;

    // Rule 1: Consecutive loop statements at the same indentation level
    // (FOR then WHILE, or WHILE then FOR, etc.)
    if (LOOP_KEYWORDS.has(prev.keyword) && LOOP_KEYWORDS.has(curr.keyword)) {
      // Only flag if they appear to be at the same nesting level
      // (neither is inside the other's block — heuristic: same or lower indentation)
      if (curr.col <= prev.col) {
        const loopType = curr.keyword === 'WHILE' ? 'WHILE' : 'FOR';
        markers.push({
          line: curr.lineIdx,
          startCol: curr.col,
          endCol: curr.endCol,
          severity: 'warning',
          message: `Two consecutive loops detected. You can't run ${prev.keyword} then ${curr.keyword} sequentially — the second loop will only start after the first completes all iterations. Remove ${loopType}?`,
          suggestion: '',
          action: 'delete',
        });
      }
    }

    // Rule 2: Duplicate consecutive action commands
    if (
      ACTION_COMMANDS.has(prev.keyword) &&
      ACTION_COMMANDS.has(curr.keyword) &&
      prev.keyword === curr.keyword
    ) {
      markers.push({
        line: curr.lineIdx,
        startCol: curr.col,
        endCol: curr.endCol,
        severity: 'warning',
        message: `Duplicate ${curr.keyword} — this command is already executed on the previous line. Only one action per tick is processed. Remove duplicate?`,
        suggestion: '',
        action: 'delete',
      });
    }

    // Rule 3: Movement contradictions (MOVE then STOP, MOVE_FAST then BACKUP, etc.)
    if (
      MOVEMENT_COMMANDS.has(prev.keyword) &&
      MOVEMENT_COMMANDS.has(curr.keyword) &&
      prev.keyword !== curr.keyword
    ) {
      // STOP after any movement, or any movement after STOP
      const isContradiction =
        curr.keyword === 'STOP' ||
        prev.keyword === 'STOP' ||
        (prev.keyword === 'MOVE' && curr.keyword === 'BACKUP') ||
        (prev.keyword === 'BACKUP' && curr.keyword === 'MOVE') ||
        (prev.keyword === 'MOVE_FAST' && curr.keyword === 'BACKUP') ||
        (prev.keyword === 'BACKUP' && curr.keyword === 'MOVE_FAST');

      if (isContradiction) {
        markers.push({
          line: curr.lineIdx,
          startCol: curr.col,
          endCol: curr.endCol,
          severity: 'warning',
          message: `${prev.keyword} is immediately contradicted by ${curr.keyword}. The first command will be cancelled. Remove ${curr.keyword}?`,
          suggestion: '',
          action: 'delete',
        });
      }
    }
  }

  // Rule 4: BREAK / CONTINUE outside a loop
  const loopDepth = computeLoopDepths(lines);
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]!;
    const trimmed = line.trimStart();
    const upper = trimmed.toUpperCase();

    if (upper.startsWith('BREAK') || upper.startsWith('CONTINUE')) {
      const keyword = upper.startsWith('BREAK') ? 'BREAK' : 'CONTINUE';
      if ((loopDepth[lineIdx] ?? 0) <= 0) {
        const col = line.length - trimmed.length;
        markers.push({
          line: lineIdx,
          startCol: col,
          endCol: col + keyword.length,
          severity: 'warning',
          message: `${keyword} used outside of a loop. It has no effect here. Remove ${keyword}?`,
          suggestion: '',
          action: 'delete',
        });
      }
    }
  }

  return markers;
}

/**
 * Compute a simple loop-depth array to detect BREAK/CONTINUE outside loops.
 * Uses indentation + keyword heuristics (not a full parser).
 */
function computeLoopDepths(lines: string[]): number[] {
  const depths: number[] = new Array(lines.length).fill(0);
  let depth = 0;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i]!.trimStart().toUpperCase();

    if (trimmed.startsWith('FOR ') || trimmed.startsWith('WHILE ')) {
      depth++;
    }

    depths[i] = depth;

    if (trimmed === 'END' || trimmed.startsWith('END ')) {
      depth = Math.max(0, depth - 1);
    }
  }

  return depths;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Main entry point. Runs both syntax and logic diagnostics on the given code.
 * Designed to be called inside a Web Worker.
 */
export function computeDiagnostics(code: string): DiagnosticMarker[] {
  const lines = code.split('\n');
  const userVars = collectUserVariables(lines);
  const userFuncs = collectUserFunctions(lines);

  const syntaxMarkers = computeSyntaxDiagnostics(lines, userVars, userFuncs);
  const logicMarkers = computeLogicDiagnostics(lines);

  // Merge and sort by line, then column
  return [...syntaxMarkers, ...logicMarkers].sort((a, b) =>
    a.line !== b.line ? a.line - b.line : a.startCol - b.startCol,
  );
}
