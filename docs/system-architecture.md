# System Architecture

## Data Flow

1.  **User Interaction (Client-side - Next.js/React):**
    *   Users interact with the web application through a Next.js frontend.
    *   Actions like logging in, creating/editing robot scripts, joining/creating matches are sent to the NestJS backend via REST API calls.
    *   Real-time match data (robot positions, health, events) is received from the NestJS backend via Socket.io.

2.  **Backend Processing (Server-side - NestJS):**
    *   **Authentication & Authorization:** Handles user registration, login, and secures API endpoints.
    *   **User/Script/Match Management:** Manages CRUD operations for users, robot scripts (logic), and match data in the database.
    *   **Match Orchestration:** When a match starts:
        *   Retrieves participating robot scripts from the database.
        *   Spawns a new isolated environment (e.g., Web Worker or Sandbox) for each robot script.
        *   Initializes the Game Engine within the NestJS backend (or a dedicated service).
        *   Feeds robot scripts to the Game Engine.
        *   Receives real-time updates from the Game Engine.
        *   Broadcasts real-time match state to connected clients via Socket.io.

3.  **Game Engine (Dedicated Module/Service):**
    *   Receives robot scripts and initial match parameters from the NestJS backend.
    *   Executes robot scripts within their isolated environments.
    *   Calculates physics (movement, collisions), applies game rules, and updates robot states.
    *   Manages the game loop and deterministically updates the game state.
    *   Sends real-time state updates back to the NestJS backend for broadcasting.

4.  **Database (PostgreSQL/MongoDB):**
    *   Stores user profiles (username, email, password hash).
    *   Stores robot scripts (code, name, owner).
    *   Stores match history (participants, outcome, replay data).

## Security

**Isolated Execution Environment for User Scripts:**

To prevent malicious user scripts from compromising the server or other users, each robot script will be executed within a strictly isolated environment. This can be achieved using:

*   **Web Workers (Client-side simulation/Local Testing):** While not suitable for server-side execution, Web Workers can provide a client-side sandbox for users to test their scripts locally before deploying. This offers basic isolation from the main browser thread.

*   **Server-side Sandboxing (e.g., Node.js `vm` module or dedicated sandbox libraries like `vm2` or `isolated-vm`):**
    *   Each user script will be loaded and executed within its own `vm` context.
    *   The sandbox will have limited access to global objects, file system, network, and system resources.
    *   Only pre-approved functions and APIs (e.g., specific game engine APIs for movement, scanning, attacking) will be exposed to the scripts.
    *   Resource limits (CPU time, memory usage) will be imposed to prevent denial-of-service attacks.
    *   Output from scripts will be carefully sanitized and validated before being processed by the game engine.

**API Security:**

*   **Authentication:** JWT (JSON Web Tokens) will be used for securing REST API endpoints. Users will receive a token upon successful login, which they must include in subsequent requests.
*   **Authorization:** Role-based access control (RBAC) will be implemented to ensure users only access resources they are authorized to (e.g., only edit their own scripts).
*   **Input Validation:** All incoming data from the client and user scripts will be thoroughly validated and sanitized to prevent injection attacks (e.g., SQL injection, XSS).
*   **Rate Limiting:** API endpoints will have rate limiting to prevent brute-force attacks and abuse.
*   **HTTPS:** All communication between the client and server will be encrypted using HTTPS.

**Database Security:**

*   **Password Hashing:** User passwords will be stored as securely hashed values (e.g., using bcrypt) and never in plain text.
*   **Least Privilege:** The database user account used by the NestJS backend will have only the necessary privileges to perform its operations.
*   **Data Encryption:** Sensitive data at rest (if any) can be encrypted.