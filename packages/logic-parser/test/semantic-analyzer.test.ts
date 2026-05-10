import { Parser } from '../src/parser';
import { SemanticAnalyzer, SemanticWarning } from '../src/analyzer';

// ─── Test Helpers ───────────────────────────────────────────────────────────

const analyzer = new SemanticAnalyzer();

function getWarnings(code: string): SemanticWarning[] {
  const parser = new Parser(code);
  const ast = parser.parse();
  return analyzer.analyze(ast);
}

function expectWarning(code: string, warningCode: string, messagePart: string): void {
  const warnings = getWarnings(code);
  const found = warnings.find(
    (w) => w.code === warningCode && w.message.includes(messagePart),
  );
  if (!found) {
    console.error(`❌ FAIL: Expected warning [${warningCode}] containing "${messagePart}"`);
    console.error(`   Got:`, warnings.length === 0 ? '(none)' : warnings.map((w) => `[${w.code}] ${w.message}`).join(', '));
    process.exitCode = 1;
    return;
  }
  console.log(`✅ PASS: [${warningCode}] "${messagePart}"`);
}

function expectNoWarnings(code: string, label: string): void {
  const warnings = getWarnings(code);
  if (warnings.length > 0) {
    console.error(`❌ FAIL: Expected NO warnings for "${label}"`);
    console.error(`   Got:`, warnings.map((w) => `[${w.code}] ${w.message}`).join(', '));
    process.exitCode = 1;
    return;
  }
  console.log(`✅ PASS: No warnings — ${label}`);
}

function expectWarningCount(code: string, count: number, label: string): void {
  const warnings = getWarnings(code);
  if (warnings.length !== count) {
    console.error(`❌ FAIL: Expected ${count} warnings for "${label}", got ${warnings.length}`);
    console.error(`   Got:`, warnings.map((w) => `[${w.code}] ${w.message}`).join(', '));
    process.exitCode = 1;
    return;
  }
  console.log(`✅ PASS: ${count} warning(s) — ${label}`);
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

console.log('\n═══ SemanticAnalyzer Tests ═══\n');

// ── 1. Contradictory Commands ───────────────────────────────────────────────

console.log('── Contradictory Commands ──');

expectWarning(
  'PATHFIND "enemy"\nSTOP',
  'contradictory-command',
  'PATHFIND is immediately cancelled by STOP',
);

expectWarning(
  'MOVE 3\nSTOP',
  'contradictory-command',
  'MOVE is immediately cancelled by STOP',
);

expectWarning(
  'MOVE_FAST 5\nSTOP',
  'contradictory-command',
  'MOVE_FAST is immediately cancelled by STOP',
);

expectWarning(
  'BACKUP 2\nSTOP',
  'contradictory-command',
  'BACKUP is immediately cancelled by STOP',
);

expectWarning(
  'MOVE 3\nMOVE_FAST 5',
  'contradictory-command',
  'MOVE is immediately cancelled by MOVE_FAST',
);

// PATHFIND then MOVE should also warn (MOVE is a MOVEMENT_STATE that cancels pending)
expectWarning(
  'PATHFIND "target"\nMOVE 3',
  'contradictory-command',
  'PATHFIND is immediately cancelled by MOVE',
);

// Non-movement between movements should NOT prevent detection
expectWarning(
  'MOVE 3\nSET x = 5\nSTOP',
  'contradictory-command',
  'MOVE is immediately cancelled by STOP',
);

// FIRE + STOP should NOT produce a contradictory-command warning
// (they're different categories)
expectNoWarnings('FIRE\nSTOP', 'FIRE then STOP — different categories');

// Single movement command — no contradiction
expectNoWarnings('MOVE 3', 'Single MOVE — no contradiction');

// STOP alone
expectNoWarnings('STOP', 'Single STOP — no contradiction');

// ── 2. Redundant Assignments ────────────────────────────────────────────────

console.log('\n── Redundant Assignments ──');

expectWarning(
  'SET x = 5\nSET x = 7',
  'redundant-assignment',
  'x assigned but never read before reassignment',
);

// x is read in the RHS of the second SET → no warning
expectNoWarnings(
  'SET x = 5\nSET x = x + 1',
  'SET x = 5 then SET x = x + 1 — x is read in RHS',
);

// x is read in a FIRE command argument → no warning
expectNoWarnings(
  'SET x = 5\nFIRE x\nSET x = 7',
  'SET x = 5, FIRE x, SET x = 7 — x is read by FIRE',
);

// x is read in an IF condition → no warning
expectNoWarnings(
  'SET x = 5\nIF x == 5 THEN\nFIRE\nEND\nSET x = 7',
  'SET x = 5, IF x == 5, SET x = 7 — x is read by IF',
);

// Multiple redundant assignments should each produce a warning
expectWarningCount(
  'SET x = 1\nSET x = 2\nSET x = 3',
  2,
  'Triple SET x → 2 redundant-assignment warnings',
);

// Different variables — no warnings
expectNoWarnings(
  'SET x = 5\nSET y = 7',
  'SET x then SET y — different variables',
);

// Property/index assignment shouldn't trigger
expectNoWarnings(
  'SET obj.prop = 5\nSET obj.prop = 7',
  'SET obj.prop twice — indexed writes excluded',
);

// ── 3. Dead Code / Unreachable Code ─────────────────────────────────────────

console.log('\n── Dead Code ──');

expectWarning(
  'RETURN\nFIRE',
  'unreachable-code',
  'Unreachable code after RETURN',
);

expectWarning(
  'BREAK\nMOVE 3',
  'unreachable-code',
  'Unreachable code after BREAK',
);

expectWarning(
  'WAIT 5\nFIRE',
  'unreachable-code',
  'Unreachable code after WAIT',
);

// RETURN at end of block — no dead code
expectNoWarnings('FIRE\nRETURN', 'RETURN at end — no dead code');

// BREAK at end of block — no dead code
expectNoWarnings('MOVE 3\nBREAK', 'BREAK at end — no dead code');

// Only one unreachable-code warning per block (other passes may also emit)
const returnDeadCode = getWarnings('RETURN\nFIRE\nMOVE 3\nSTOP');
const unreachableCount = returnDeadCode.filter((w) => w.code === 'unreachable-code').length;
if (unreachableCount === 1) {
  console.log('✅ PASS: RETURN then 3 statements — only 1 unreachable-code warning');
} else {
  console.error(`❌ FAIL: Expected 1 unreachable-code, got ${unreachableCount}`);
  process.exitCode = 1;
}

// ── 4. Mixed / Edge Cases ───────────────────────────────────────────────────

console.log('\n── Mixed / Edge Cases ──');

// Empty program
expectNoWarnings('', 'Empty program');

// All three types combined
const mixed = `SET x = 5
SET x = 10
PATHFIND "target"
STOP
RETURN
FIRE`;

const mixedWarnings = getWarnings(mixed);
const hasMixed =
  mixedWarnings.some((w) => w.code === 'contradictory-command') &&
  mixedWarnings.some((w) => w.code === 'redundant-assignment') &&
  mixedWarnings.some((w) => w.code === 'unreachable-code');
if (hasMixed) {
  console.log('✅ PASS: Mixed script produces all 3 warning types');
} else {
  console.error('❌ FAIL: Mixed script should produce all 3 warning types');
  console.error('   Got:', mixedWarnings.map((w) => `[${w.code}] ${w.message}`).join(', '));
  process.exitCode = 1;
}

// Code inside IF/ELSE should NOT be analyzed for contradictions
// (the user may intentionally do PATHFIND in one branch and STOP in another)
expectNoWarnings(
  'IF x == 5 THEN\nPATHFIND "target"\nELSE\nSTOP\nEND',
  'PATHFIND in IF, STOP in ELSE — separate branches',
);

console.log('\n═══ All tests complete ═══\n');
