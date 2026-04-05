# Folder Structure

This project will follow a modular and layered architecture, separating concerns between the frontend (Next.js), backend (NestJS), and the core Game Engine. The `logic-arena` root will contain these main divisions.

```
logic-arena/
├── apps/
│   ├── client/ (Next.js Frontend)
│   │   ├── public/ (Static assets)
│   │   ├── src/
│   │   │   ├── app/ (Next.js App Router)
│   │   │   │   ├── api/ (API Routes for client-side needs)
│   │   │   │   ├── (auth)/ (Authentication related routes/pages)
│   │   │   │   ├── (dashboard)/ (User dashboard, script management)
│   │   │   │   ├── (match)/ (Match viewing, lobby)
│   │   │   │   └── page.tsx
│   │   │   ├── components/ (Reusable React components)
│   │   │   ├── hooks/ (Custom React hooks)
│   │   │   ├── lib/ (Client-side utilities, API clients)
│   │   │   ├── styles/ (Global styles, Tailwind config)
│   │   │   └── types/ (TypeScript types/interfaces shared with backend/engine)
│   │   ├── .env
│   │   ├── next.config.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── server/ (NestJS Backend)
│   │   ├── src/
│   │   │   ├── main.ts (Application entry point)
│   │   │   ├── app.module.ts (Root module)
│   │   │   ├── auth/ (Authentication logic, guards, strategies)
│   │   │   ├── users/ (User management: controllers, services, entities)
│   │   │   ├── robot-scripts/ (Script management: controllers, services, entities)
│   │   │   ├── matches/ (Match orchestration: controllers, services, entities, gateways)
│   │   │   ├── game-engine-interface/ (Module to interact with the core game engine)
│   │   │   ├── shared/ (Shared DTOs, interfaces, utilities)
│   │   │   └── database/ (Database connection, migrations)
│   │   ├── .env
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── engine/ (Core Game Engine - TypeScript/Node.js module)
│       ├── src/
│       │   ├── index.ts (Engine entry point/API)
│       │   ├── core/ (Main game loop, state management)
│       │   ├── physics/ (2D physics calculations: vectors, collision detection)
│       │   ├── robots/ (Robot state, actions, AI interface)
│       │   ├── arena/ (Arena definition, obstacles)
│       │   ├── events/ (Event broadcasting for match updates)
│       │   ├── sandbox/ (Script sandboxing logic, API exposure)
│       │   └── types/ (TypeScript types/interfaces for game objects)
│       ├── package.json
│       └── tsconfig.json
│
├── docs/ (Project documentation - as requested)
│   ├── system-architecture.md
│   ├── erd-diagram.md
│   ├── game-rules.md
│   ├── folder-structure.md
│
├── scripts/ (Utility scripts: build, deploy, etc.)
├── tools/ (Custom CLI tools, local dev helpers)
├── package.json (Monorepo root package.json, for shared dependencies/scripts)
├── tsconfig.json (Monorepo root tsconfig)
└── README.md
```

## Rationale for Structure:

*   **Monorepo (`apps/`):** Using a monorepo approach with a tool like Lerna or Yarn Workspaces allows for easy management of shared code (e.g., `types/` or `shared/`) between `client`, `server`, and `engine` while keeping them as distinct, deployable applications/modules.
*   **Clear Separation of Concerns:** Each top-level folder (`client`, `server`, `engine`, `docs`) has a clear responsibility, aligning with the `Scale` constraint (Modular system).
*   **Next.js App Router:** The `client/` uses the latest Next.js App Router structure for modern web development, including colocated API routes for client-specific data fetching.
*   **NestJS Modules:** The `server/` leverages NestJS's modular structure to organize backend logic by domain (auth, users, robot-scripts, matches).
*   **Dedicated Game Engine:** The `engine/` is a standalone module, emphasizing the separation of the core game logic from the server that hosts it and the client that visualizes it. This addresses the `Performance` and `Scale` constraints directly.
*   **`game-engine-interface/`:** This module within the NestJS `server/` acts as a bridge, abstracting the communication with the `engine/` module, ensuring loose coupling.
*   **`sandbox/` within `engine/`:** Explicitly highlights the `Security` constraint by placing the script isolation logic directly within the engine module.