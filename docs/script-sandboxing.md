# Script Sandboxing & Deterministic Quotas

Allowing users to submit arbitrary code to run on your backend server is inherently dangerous. Logic Arena mitigates this through a combination of AST (Abstract Syntax Tree) parsing, deterministic execution quotas, and isolated stateless evaluation.

## 1. No `eval()` — The AST Compiler
We do not use JavaScript's `eval()` or `new Function()`.
Instead, the `@logic-arena/logic-parser` package implements a custom language lexer and parser.

*   **Tokenizer**: Scans the raw text string into safe, classified tokens (e.g., `KEYWORD_IF`, `IDENTIFIER`, `NUMBER`).
*   **Parser**: Organizes the tokens into an Abstract Syntax Tree (AST). If the syntax is malformed, the parser aborts before execution ever begins.
*   **Evaluator**: The server walks the AST tree. It only executes specific, whitelisted game commands (e.g., when it hits an `Identifier` named `MOVE`, it invokes the physics engine's `move()` function). There is zero access to the Node.js global scope, `process`, or `require`.

## 2. Deterministic Quotas (Time Limit Exceeded - TLE)
A user could easily submit an infinite loop: `WHILE TRUE DO WAIT 0 END`. In a normal JavaScript environment, this would freeze the Node.js event loop and crash the server.

To solve this, AliScript is fully **deterministic** and relies on an Operations Quota rather than wall-clock time.

*   **2,000 Operations Per Tick**: Every single AST node evaluation (variable assignment, math operation, loop iteration) increments a shared execution counter.
*   **Hard Cap**: If the counter exceeds 2,000 during a single 50ms tick, the evaluator throws a `[FATAL] TLE` (Time Limit Exceeded) error.
*   **Consequence**: The robot immediately halts all logic execution for that tick. The player is forced to write more efficient O(N) algorithms instead of O(N²) nested loops.

## 3. Stateless Execution
AliScript robots do not hold state in the global server memory between ticks.
All variables defined via `SET` are stored in an isolated `Map<string, any>` specific to that robot's instance inside the match. When the match concludes or the robot dies, the Map is garbage collected by V8.

STASIS is an execution boundary. When a robot is in STASIS, the evaluator does not walk its AST, including nested `WHILE` loop bodies. When energy recovers to the exit threshold, runtime memory and action cooldowns are reset so the robot resumes from a clean script state instead of continuing stale loop or wait state.

## 4. Deep Copying & Swarm Security
With the introduction of Swarm Intelligence (`BROADCAST` and `RECEIVE`), robots can send data payloads to their teammates.
To prevent cross-robot memory aliasing (e.g., mutating an array in one robot's memory altering it in another's), all payloads are strictly **deep-copied** during transit using `structuredClone` (or equivalent parsing).

## 5. Mobile Block Editor Compilation
On mobile devices, users interact with a visual Block Editor. The drag-and-drop `@dnd-kit` UI produces a JSON structure of the logic blocks. Before submission to the server, a recursive compiler traverses this visual JSON and translates it cleanly into raw AliScript text. The backend is completely unaware whether the script was typed on a desktop keyboard or assembled via mobile blocks—it parses the identical text string with the exact same sandbox guarantees.
