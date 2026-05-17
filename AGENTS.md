# Logic Arena — Agent Rules

## Project
Competitive real-time robot battle simulator. TypeScript monorepo (pnpm workspaces).

## Terminal
PowerShell only. Use `;` not `&&`. Never use `rm -rf` — use `Remove-Item`.

## Commands
- Dev: `pnpm run dev:all`
- Build client: `pnpm --filter client run build`
- Build server: `pnpm --filter server run build`
- Install (root): `pnpm add -w <pkg>`
- Install (package): `pnpm --filter <name> add <pkg>`

## Monorepo Structure
- apps/client/           # Next.js 16 App Router
- apps/server/           # NestJS + Socket.IO + Redis + PostgreSQL
- packages/engine/       # Battle engine (60 FPS game loop)
- packages/logic-parser/ # AliScript compiler (Lexer → AST → Evaluator)

## Core Rules
- Never use `npm` or `yarn`, always `pnpm`
- Never hardcode colors — use CSS variables only (see client AGENTS.md)
- Never add `useMediaQuery` inside child components — pass `isMobile` as prop from parent page
- Always refactor for clean code, performance, caching, optimization
- Touch only files listed in the task scope

## State Management
- Game state → `useRef` only (zero re-renders at 60fps)
- UI state → `useState`, throttled to 10Hz max
- Never put rapid game state in `useState` — causes re-render death spiral
- Static data (obstacles, map) → sent once on init, never in delta broadcasts

## AliScript Engine
- Max 2,000 ops per tick (deterministic TLE quota — not time-based)
- Reserved identifiers (MY_ENERGY, IN_STASIS, etc.) cannot be shadowed by SET
- STASIS blocks ALL execution including WHILE loops
- Energy deducted only after confirming valid action (e.g. FIRE needs visible target)
- Intra-tick action deduplication: same action dispatched once per tick max

## Strict Code Quality Rules

### TypeScript
- NEVER use `any` type — always use proper interfaces or types
- If a type doesn't exist yet, create it in the nearest types.ts file
- Use `unknown` instead of `any` when type is genuinely uncertain
- All function parameters and return types must be explicitly typed

### Accessibility
- Every `<button>` must have `type="button"` or `type="submit"` explicitly
- Every `<button>` without visible text must have `aria-label` or `title`
- Every `<input>` must have a corresponding `label` or `aria-label`
- Every `<img>` must have `alt` attribute
- Never use `onClick` on non-interactive elements (div, span) — use button instead

### General
- No inline magic numbers — extract to named constants
- No hardcoded colors — CSS variables only (`var(--accent)` etc.)
- No commented-out code blocks left in files