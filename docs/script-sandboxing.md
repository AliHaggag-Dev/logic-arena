# Script Sandboxing (Browser-side)

To safely execute user-provided robot scripts directly in the browser, we need robust sandboxing mechanisms. This is crucial for both security (preventing malicious scripts from accessing sensitive data or disrupting the page) and performance (ensuring scripts don't block the main UI thread).

Here are three approaches, along with a comparison of their performance and security characteristics, and an explanation of the communication flow.

## 1. Web Workers (Recommended)

**Concept:** Web Workers run scripts in a separate global context (a separate thread) from the main browser thread. They communicate with the main thread via message passing (`postMessage` and `onmessage`). This is the most common and robust browser-native sandboxing mechanism.

**Performance:**
*   **Pros:** Excellent performance isolation. Since the script runs in a separate thread, it cannot directly block the main UI thread, ensuring a smooth user experience even with complex or long-running robot logic. Computationally intensive tasks can be offloaded.
*   **Cons:** Communication overhead. Message passing involves serialization/deserialization (structured cloning) of data, which can introduce a slight performance penalty if large amounts of data are passed frequently. However, with `SharedArrayBuffer` and `MessagePort` (when available and configured securely), this overhead can be significantly reduced.

**Security:**
*   **Pros:** High security. Web Workers have a restricted global scope. They cannot directly access the DOM, `window` object, or many browser APIs (e.g., `localStorage`, `XMLHttpRequest` directly). This prevents scripts from manipulating the UI, stealing user data, or making unauthorized network requests from the user's browser.
*   **Cons:** Vulnerabilities can arise if too many powerful APIs are exposed to the worker or if the communication channel is not properly secured and validated. Careful design of the worker's API is essential.

## 2. Iframes with `sandbox` Attribute

**Concept:** An `<iframe>` element can be sandboxed using the `sandbox` attribute, which restricts various capabilities of the content inside the iframe (e.g., script execution, form submission, network access). Communication between the main page and the iframe is typically done via `postMessage`.

**Performance:**
*   **Pros:** Good isolation for script execution. While still running within the main thread's process, the `sandbox` attribute restricts its impact. The visual isolation (if used for rendering) can also prevent layout reflows on the main page.
*   **Cons:** Can be slower than Web Workers due to being in the same process, and might still have some overhead if the iframe's content is complex. Creating and destroying iframes can be resource-intensive. Not designed for heavy computational offloading.

**Security:**
*   **Pros:** Strong security. The `sandbox` attribute offers granular control over what the iframe content can do. By default, it blocks script execution, form submissions, and more. Specific capabilities must be explicitly allowed (e.g., `allow-scripts`, `allow-same-origin`). This is very effective for isolating untrusted content.
*   **Cons:** Requires careful configuration of the `sandbox` attributes; misconfigurations can lead to security bypasses. Still operates within the same browser tab's process, potentially offering less process-level isolation than a true separate thread.

## 3. Custom JavaScript Sandbox (e.g., using `with` statement or Proxy - NOT RECOMMENDED for Production)

**Concept:** Attempting to create a custom sandbox using JavaScript language features like the `with` statement (deprecated and problematic for security) or ES6 Proxies to intercept property access. The idea is to wrap the user script within an environment that only exposes a limited set of allowed APIs.

**Performance:**
*   **Pros:** Minimal initial setup overhead compared to creating new workers/iframes.
*   **Cons:** Very poor performance isolation. The script still runs on the main thread, meaning long-running or CPU-intensive user scripts will directly block the UI, leading to a choppy experience. Proxy overhead can also be noticeable.

**Security:**
*   **Pros:** Can provide a superficial level of API restriction.
*   **Cons:** Extremely difficult to secure completely. JavaScript has many ways to escape a custom sandbox, especially with direct evaluation (`eval`). It's prone to prototype pollution, global object manipulation, and other exploits. **Not suitable for executing untrusted code in a production environment.** This method is generally considered an anti-pattern for security-critical sandboxing in the browser.

## Communication Flow: Main Thread & Web Worker (Frame Tick)

We will focus on Web Workers as the recommended approach for client-side script sandboxing. The communication between the Main Thread (which runs the UI and the main game loop) and the Worker (which executes a single robot's script) will happen on each game frame/tick.

### Main Thread to Worker: Sending "World State"

On each game tick, the Main Thread will compile a simplified, read-only representation of the "World State" relevant to a specific robot. This `WorldState` object will contain information that the robot's script needs to make decisions.

**`WorldState` could include:**
*   `robot.id`: The robot's own ID.
*   `robot.position`: Its current `Vector2` position.
*   `robot.velocity`: Its current `Vector2` velocity.
*   `robot.rotation`: Its current rotation.
*   `robot.health`: Its current health.
*   `robot.energy`: Its current energy.
*   `arena.width`, `arena.height`: Arena dimensions.
*   `otherRobots[]`: An array of objects, each containing visible information about other robots (e.g., `id`, `position`, `health`, `type`). This would be filtered by `Sensor Range` and `Line of Sight`.
*   `obstacles[]`: An array of objects describing nearby obstacles (e.g., `position`, `size`, `type`).

This `WorldState` object will be sent to the Web Worker using `worker.postMessage(worldState)`. Due to structured cloning, complex objects are serialized and deserialized, creating a copy on the worker side.

### Worker to Main Thread: Responding with "Action"

After receiving the `WorldState`, the robot's script inside the Web Worker will execute its logic, process the state, and decide on an `Action`. This `Action` object will then be sent back to the Main Thread using `self.postMessage(action)` within the worker.

**`Action` could include:**
*   `type`: (Enum: `MOVE`, `ROTATE`, `FIRE`, `SCAN`, `ABILITY`)
*   `payload`: (Object) - Parameters specific to the action type. E.g., for `MOVE`, it might be `{ direction: Vector2 }`; for `FIRE`, `{ target: Vector2 }`; for `ABILITY`, `{ abilityType: 'shield' }`.

The Main Thread will then receive this `Action` and apply it to the actual game simulation, respecting game rules, energy costs, and cooldowns.

## Mermaid Sequence Diagram (Frame Tick Cycle)

```mermaid
sequenceDiagram
    participant MT as Main Thread (Game Loop)
    participant GW as Game Worker (Robot Script)

    MT->>GW: 1. Send World State (postMessage(worldState))
    activate GW
    GW-->>GW: 2. Execute Robot Script Logic
    GW->>MT: 3. Post Robot Action (postMessage(action))
    deactivate GW
    MT->>MT: 4. Process Robot Action & Update Game State
    MT->>MT: 5. Render Game Frame (Canvas API)