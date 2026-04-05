# Logic Arena: Coding Combat Platform

## Project Vision

Logic Arena is an ambitious platform where developers can write intelligent scripts (logic) to control robots that battle each other in a live, physics-driven arena. The game heavily relies on principles of physics, mathematics, and artificial intelligence, offering a unique blend of strategic programming and real-time combat.

## Key Technical Constraints

*   **Security:** User-provided robot scripts must execute within a strictly isolated environment (e.g., Web Workers or Sandboxing) to prevent malicious code execution and ensure platform integrity.
*   **Real-time:** Matches demand perfect synchronization, achieved through robust real-time communication using Socket.io.
*   **Performance:** The core game engine is designed to handle hundreds of robots concurrently without lag, leveraging the Canvas API for rendering and Vector math for precise physics simulations.
*   **Scalability:** The system is built with a modular architecture, clearly separating the Game Engine from the User Interface (UI) and Backend services.

## Project Documentation

Explore the in-depth technical documentation for Logic Arena:

*   **[System Architecture](docs/system-architecture.md)**: Details the overall data flow, components, and security measures implemented across the platform.
*   **[Script Sandboxing (Browser-side)](docs/script-sandboxing.md)**: Explores various approaches for safely executing user scripts in the browser, comparing their performance and security implications.
*   **[Entity Relationship Diagram (ERD)](docs/erd-diagram.md)**: Provides the database design for managing users, robot scripts, and match data.
*   **[Game Rules](docs/game-rules.md)**: Outlines the fundamental rules governing robot movement, energy, vision, collisions, and combat within the arena.
*   **[Folder Structure](docs/folder-structure.md)**: Presents the proposed modular folder structure for the Next.js frontend, NestJS backend, and the core Game Engine.
