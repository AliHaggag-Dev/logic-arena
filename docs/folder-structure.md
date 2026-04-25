# Folder Structure

This project follows a modular and layered architecture, separating concerns between the frontend (Next.js), backend (NestJS), and the core Game Engine. The `logic-arena` root contains these main divisions.

```
logic-arena/
├── apps/
│   ├── client/ (Next.js Frontend)
│   │   ├── public/ (Static assets)
│   │   ├── src/
│   │   │   ├── app/ (Next.js App Router)
│   │   │   │   ├── api/ (API Routes)
│   │   │   │   ├── (auth)/ (Authentication & Layouts)
│   │   │   │   ├── (dashboard)/ (Live Match, Script Management, User Dashboard, Leaderboards, Tournaments, Settings, ...)
│   │   │   │   ├── (public)/ (Privacy Policy, Terms of Service, Contact, ...)
│   │   │   │   └── layout.tsx
│   │   │   ├── components/ (Reusable UI)
|   |   |   |── context/ (Context providers)
│   │   │   ├── hooks/ (Custom React hooks)
│   │   │   ├── lib/ (Utilities, API clients)
|   |   |   |── providers/ (Providers)
|   |   |   |── workers/
│   │   └── tailwind.config.ts
│   │
│   ├── server/ (NestJS Backend)
│   │   ├── src/
│   │   │   ├── common/ (Guards, Prisma, Redis, DTOs)
│   │   │   ├── game/core/
│   │   │   │   ├── evaluator/ (Logic AST execution, Memory Sync)
│   │   │   │   └── pathfinder/ (A* navigation grid, string-pulling algorithms)
│   │   │   ├── modules/
│   │   │   │   ├── auth/ (Registration, Login, Password, OAuth strategies)
│   │   │   │   ├── users/ (CQRS: Query and Command services)
│   │   │   │   ├── tournaments/ (CQRS: Bracket generation, tracking)
│   │   │   │   ├── robot-scripts/ (Script compiler/storage)
│   │   │   │   └── matches/
│   │   │   │       ├── gateway/ (Delta diffing, match loops, socket emitters)
│   │   │   │       └── match.engine.ts
│   │   │   ├── app.module.ts
│   │   │   ├── app.service.ts
│   │   │   ├── app.controller.ts
│   │   │   ├── app.controller.spec.ts
│   │   │   └── main.ts
│   │   └── prisma/ (Schema)
│   │
├── packages/
│   ├── engine/          (Core Game Engine)
│   │   └── src/
│   │       ├── core/    (Game loop, Robot updater)
│   │       ├── physics/ (Vectors, collisions)  
│   │       ├── utils/   (Animation loop polyfill)
│   │       └── index.ts
│   └── logic-parser/    (AliScript grammar tokenizer and parser logic)
│
├── docs/ (Project documentation)
│   ├── aliscript-language.md
│   ├── erd-diagram.md
│   ├── folder-structure.md
│   ├── game-rules.md
│   ├── script-sandboxing.md
│   └── system-architecture.md
└── package.json (pnpm Workspaces)
```

## Rationale for Structure:

*   **Pnpm Workspaces (`apps/`, `packages/`):** Utilizing strict workspace boundaries guarantees scalable isolated domains natively decoupled optimally securing performance and cross-module resolution correctly natively.
*   **Next.js Route Groups:** Client navigation natively separates logical UX layouts (`auth`, `public`, `dashboard`) preserving UI integrity cleanly isolated.
*   **NestJS CQRS Controllers:** The backend logically splits `tournaments` and `users` into Query/Command pipelines natively abstracting raw data interactions purely functionally.
*   **Decomposed Match Gateway:** The `apps/server/src/modules/matches/gateway/` uniquely separates diff-comparators, win conditions, and telemetry into independent files natively preventing monolithic loops.
*   **Isolating Game Engine vs Sandbox Execution**: `packages/engine` only computes rigid physics bounds while `apps/server/src/game/core/evaluator/` natively drives the dynamic instruction execution completely independent from global constraints cleanly securing boundaries dynamically.