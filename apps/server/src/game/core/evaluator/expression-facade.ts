import { Robot, Obstacle, performRaycast } from '@logic-arena/engine';
import {
  Expression, NodeType, Identifier, NumberLiteral, StringLiteral,
  FunctionCallExpression, ArrayLiteral, IndexExpression,
  ObjectLiteral, MemberExpression,
} from '../../../../../../packages/logic-parser/src';
import { resolveIdentifier } from './identifier-resolver';
import { evaluateBinary, evaluateUnary, evaluateComparison } from './operator-handlers';

/** Maximum depth for recursive expression evaluation to prevent stack overflow. */
const MAX_EVAL_DEPTH = 64;

/**
 * Snapshot of one visible enemy, encoded as a flat number array so it is
 * accessible from AliScript's index operator without any object/property syntax.
 *
 * Layout: [distance, positionX, positionY, health]
 */
type EnemySnapshot = [number, number, number, number];

export class ExpressionEvaluator {
  evaluateCondition(
    robot: Robot,
    expression: Expression,
    memory: Record<string, unknown>,
    getRobots: () => Robot[],
    getObstacles: () => Obstacle[],
  ): boolean {
    const value = this.evaluateExpression(robot, expression, memory, getRobots, getObstacles);
    return typeof value === 'boolean' ? value : Boolean(value);
  }

  evaluateExpression(
    robot: Robot,
    expression: Expression,
    memory: Record<string, unknown>,
    getRobots: () => Robot[],
    getObstacles: () => Obstacle[],
    depth: number = 0,
  ): unknown {
    if (depth > MAX_EVAL_DEPTH) return undefined;

    switch (expression.type) {
      case NodeType.NumberLiteral:
      case NodeType.StringLiteral:
      case NodeType.BooleanLiteral:
        return expression.value;

      case NodeType.Identifier:
        return resolveIdentifier(robot, expression as Identifier | NumberLiteral | StringLiteral, memory);

      case NodeType.BinaryExpression: {
        const left = this.evaluateExpression(robot, expression.left, memory, getRobots, getObstacles, depth + 1);
        const right = this.evaluateExpression(robot, expression.right, memory, getRobots, getObstacles, depth + 1);
        return evaluateBinary(left, right, expression.operator);
      }

      case NodeType.UnaryExpression: {
        const arg = this.evaluateExpression(robot, expression.argument, memory, getRobots, getObstacles, depth + 1);
        return evaluateUnary(arg, expression.operator);
      }

      case NodeType.ComparisonExpression: {
        const lv = this.evaluateExpression(robot, expression.left, memory, getRobots, getObstacles, depth + 1);
        const rv = this.evaluateExpression(robot, expression.right, memory, getRobots, getObstacles, depth + 1);
        return evaluateComparison(lv, rv, expression.operator);
      }

      // ── Built-in function calls: ABS(x), GET_ALL_VISIBLE_ENEMIES(), etc. ──
      case NodeType.FunctionCallExpression: {
        const fnCall = expression as FunctionCallExpression;
        const evaluatedArgs = fnCall.args.map(
          a => this.evaluateExpression(robot, a, memory, getRobots, getObstacles, depth + 1),
        );
        return this.evaluateBuiltinFunction(fnCall.name, evaluatedArgs, memory, robot, getRobots, getObstacles);
      }

      // ── Array literal: [1, 2, 3] ──────────────────────────────────────────
      case NodeType.ArrayLiteral: {
        const arrLit = expression as ArrayLiteral;
        return arrLit.elements.map(
          el => this.evaluateExpression(robot, el, memory, getRobots, getObstacles, depth + 1),
        );
      }

      // Index access: arr[0] or obj["key"]
      case NodeType.IndexExpression: {
        const idxExpr = expression as IndexExpression;
        const obj = this.evaluateExpression(robot, idxExpr.object, memory, getRobots, getObstacles, depth + 1);
        const idx = this.evaluateExpression(robot, idxExpr.index, memory, getRobots, getObstacles, depth + 1);
        if (Array.isArray(obj) && typeof idx === 'number') {
          const i = Math.floor(idx);
          if (i >= 0 && i < obj.length) return obj[i];
          return undefined;
        }
        if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
          return (obj as Record<string, unknown>)[String(idx)];
        }
        return undefined;
      }

      // Object literal: { mode: "HUNT", target_id: 4 }
      case NodeType.ObjectLiteral: {
        const objLit = expression as ObjectLiteral;
        const result: Record<string, unknown> = {};
        for (const prop of objLit.properties) {
          result[prop.key] = this.evaluateExpression(robot, prop.value, memory, getRobots, getObstacles, depth + 1);
        }
        return result;
      }

      // Member (dot) access: state.mode
      case NodeType.MemberExpression: {
        const memExpr = expression as MemberExpression;
        const target = this.evaluateExpression(robot, memExpr.object, memory, getRobots, getObstacles, depth + 1);
        if (target !== null && typeof target === 'object' && !Array.isArray(target)) {
          return (target as Record<string, unknown>)[memExpr.property];
        }
        return undefined;
      }

      default:
        return undefined;
    }
  }

  // ── Built-in math, utility, and sensor function dispatcher ───────────────
  private evaluateBuiltinFunction(
    name: string,
    args: unknown[],
    memory: Record<string, unknown>,
    robot: Robot,
    getRobots: () => Robot[],
    getObstacles: () => Obstacle[],
  ): unknown {
    const a = args[0] as number;
    const b = args[1] as number;

    switch (name) {
      // ── Single-arg math ────────────────────────────────────────────────
      case 'ABS':    return typeof a === 'number' ? Math.abs(a) : 0;
      case 'SQRT':   return typeof a === 'number' ? Math.sqrt(Math.max(0, a)) : 0;
      case 'SIN':    return typeof a === 'number' ? Math.sin(a) : 0;
      case 'COS':    return typeof a === 'number' ? Math.cos(a) : 0;
      case 'TAN':    return typeof a === 'number' ? Math.tan(a) : 0;
      case 'FLOOR':  return typeof a === 'number' ? Math.floor(a) : 0;
      case 'CEIL':   return typeof a === 'number' ? Math.ceil(a) : 0;
      case 'ROUND':  return typeof a === 'number' ? Math.round(a) : 0;
      case 'LOG':    return typeof a === 'number' && a > 0 ? Math.log(a) : 0;

      // ── Two-arg math ───────────────────────────────────────────────────
      case 'POW':    return typeof a === 'number' && typeof b === 'number' ? Math.pow(a, b) : 0;
      case 'ATAN2':  return typeof a === 'number' && typeof b === 'number' ? Math.atan2(a, b) : 0;
      case 'MIN':    return typeof a === 'number' && typeof b === 'number' ? Math.min(a, b) : 0;
      case 'MAX':    return typeof a === 'number' && typeof b === 'number' ? Math.max(a, b) : 0;

      // ── Zero-arg ───────────────────────────────────────────────────────
      case 'RANDOM': return Math.random();

      // ── Array operations ───────────────────────────────────────────────
      case 'LENGTH': {
        if (Array.isArray(a)) return a.length;
        const strCheck: unknown = a;
        if (typeof strCheck === 'string') return strCheck.length;
        return 0;
      }

      case 'PUSH': {
        // PUSH(arrayName, value) — first arg must be a string referencing the array variable name
        // But in expression context we receive evaluated values.
        // We handle PUSH/POP as side-effect functions in block-executor instead.
        // For expression-level, PUSH returns the new length.
        if (Array.isArray(a)) {
          a.push(b);
          return a.length;
        }
        return 0;
      }

      case 'POP': {
        if (Array.isArray(a) && a.length > 0) {
          return a.pop();
        }
        return undefined;
      }

      // ── Phase 1: Advanced Sensory Arrays ──────────────────────────────

      /**
       * GET_ALL_VISIBLE_ENEMIES()
       *
       * Returns an array of EnemySnapshot sub-arrays for every alive enemy
       * currently inside this robot's FOV cone.
       *
       * Each element is: [distance, positionX, positionY, health]
       *
       * Enemies are returned in UNSORTED order — the player must implement
       * their own sort (e.g. quicksort by distance or by health) in AliScript.
       *
       * AliScript usage:
       *   SET enemies = GET_ALL_VISIBLE_ENEMIES()
       *   SET count   = LENGTH(enemies)
       *   SET closest = enemies[0]        // [dist, x, y, health]
       *   SET d       = closest[0]        // distance
       */
      case 'GET_ALL_VISIBLE_ENEMIES': {
        const visibleEnemies = robot.visibleEntities?.robots ?? [];
        const snapshots: EnemySnapshot[] = [];

        for (const enemy of visibleEnemies) {
          if (!enemy.isAlive) continue;
          const edx = enemy.position.x - robot.position.x;
          const edy = enemy.position.y - robot.position.y;
          const distance = Math.round(Math.hypot(edx, edy));
          snapshots.push([
            distance,
            Math.round(enemy.position.x),
            Math.round(enemy.position.y),
            Math.round(enemy.health),
          ]);
        }

        return snapshots;
      }

      /**
       * RAYCAST(angle)
       *
       * Fires an invisible physics ray from the robot's current position in
       * the direction (robot.rotation + angle), where `angle` is a relative
       * offset in radians (positive = clockwise, negative = counter-clockwise).
       *
       * Returns the distance in arena units to the first solid hit:
       *   - Arena boundary wall
       *   - Any SOLID obstacle
       *   - Any alive robot (enemy OR friendly — true LOS check)
       *
       * TRAP and LAVA zones are transparent — bullets pass through them.
       *
       * AliScript usage:
       *   SET frontDist = RAYCAST(0)         // straight ahead
       *   SET leftDist  = RAYCAST(-0.785)    // 45° to the left
       *   SET rightDist = RAYCAST(0.785)     // 45° to the right
       */
      case 'RAYCAST': {
        const relativeAngle = typeof a === 'number' ? a : 0;
        const absoluteDirection = robot.rotation + relativeAngle;
        const fovRange = robot.fov?.range ?? 300;

        return Math.round(
          performRaycast(
            robot.position,
            absoluteDirection,
            getObstacles(),
            getRobots(),
            robot.id,
            fovRange,
          ),
        );
      }

      // ── Phase 3: Swarm Intelligence (Inter-Robot Communication) ─────────

      /**
       * BROADCAST(data)
       *
       * Sends a deep-copy of `data` (any value: dictionary, array, string,
       * or number) to the ___INBOX queue of every alive teammate.
       *
       * SECURITY: The payload is JSON-serialised then parsed before being
       * placed into each ally's memory. This hard-severs the object reference
       * chain, guaranteeing one robot cannot mutate another robot's data
       * structures through a shared pointer — a classic sandbox memory leak.
       *
       * Returns the number of teammates that received the message (0 if
       * no data was provided or no alive allies exist).
       *
       * AliScript usage:
       *   SET count = BROADCAST({ mode: "ATTACK", targetX: 200 })
       *   SET count = BROADCAST("REGROUP")
       */
      case 'BROADCAST': {
        const payload = args[0];
        if (payload === undefined) return 0;

        const allRobots = getRobots();
        const INBOX_KEY = '___INBOX';
        let broadcastCount = 0;

        for (const ally of allRobots) {
          if (ally.team !== robot.team || !ally.isAlive) continue;
          // Deep-copy the payload to sever all object references before
          // placing it into the ally's memory sandbox.
          const safePayload: unknown = JSON.parse(JSON.stringify(payload));
          const allyMemory = ally.memory as Record<string, unknown>;
          if (!Array.isArray(allyMemory[INBOX_KEY])) {
            allyMemory[INBOX_KEY] = [];
          }
          (allyMemory[INBOX_KEY] as unknown[]).push(safePayload);
          broadcastCount++;
        }

        return broadcastCount;
      }

      /**
       * RECEIVE()
       *
       * Atomically drains this robot's ___INBOX and returns the full array
       * of messages received since the last RECEIVE() call.
       *
       * The inbox is cleared immediately on read, so each message is
       * delivered exactly once (fire-and-forget semantics). Calling
       * RECEIVE() when the inbox is empty returns [].
       *
       * AliScript usage:
       *   SET messages = RECEIVE()
       *   SET count = LENGTH(messages)
       *   IF count > 0 THEN
       *     SET msg = messages[0]
       *   END
       */
      case 'RECEIVE': {
        const INBOX_KEY = '___INBOX';
        const inbox = memory[INBOX_KEY];
        if (!Array.isArray(inbox) || inbox.length === 0) return [];
        // Shallow-copy the inbox then clear it so each message is read once.
        const drained: unknown[] = inbox.slice();
        memory[INBOX_KEY] = [];
        return drained;
      }

      default:
        return undefined;
    }
  }
}
