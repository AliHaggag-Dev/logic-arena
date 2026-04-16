import { Robot } from '@logic-arena/engine';
import {
  Expression, NodeType, Identifier, NumberLiteral, StringLiteral,
} from '../../../../../../packages/logic-parser/src';

export class ExpressionEvaluator {
  evaluateCondition(
    robot: Robot,
    expression: Expression,
    memory: Record<string, unknown>,
    getRobots: () => Robot[],
  ): boolean {
    const value = this.evaluateExpression(robot, expression, memory, getRobots);
    return typeof value === 'boolean' ? value : Boolean(value);
  }

  evaluateExpression(
    robot: Robot,
    expression: Expression,
    memory: Record<string, unknown>,
    getRobots: () => Robot[],
  ): unknown {
    switch (expression.type) {
      case NodeType.NumberLiteral:
      case NodeType.StringLiteral:
      case NodeType.BooleanLiteral:
        return expression.value;

      case NodeType.Identifier:
        return this.resolveIdentifier(robot, expression, memory, getRobots);

      case NodeType.BinaryExpression: {
        const left  = this.evaluateExpression(robot, expression.left,  memory, getRobots);
        const right = this.evaluateExpression(robot, expression.right, memory, getRobots);
        if (typeof left !== 'number' || typeof right !== 'number') return undefined;
        switch (expression.operator) {
          case '+': return left + right;
          case '-': return left - right;
          case '*': return left * right;
          case '/': return right !== 0 ? left / right : 0;
          case '%': return right !== 0 ? left % right : 0;
        }
        return undefined;
      }

      case NodeType.UnaryExpression: {
        const arg = this.evaluateExpression(robot, expression.argument, memory, getRobots);
        return expression.operator === 'NOT' ? !Boolean(arg) : undefined;
      }

      case NodeType.ComparisonExpression: {
        const lv = this.evaluateExpression(robot, expression.left,  memory, getRobots);
        const rv = this.evaluateExpression(robot, expression.right, memory, getRobots);
        if (typeof lv !== typeof rv) return false;
        switch (expression.operator) {
          case '<':  return (lv as number) < (rv as number);
          case '>':  return (lv as number) > (rv as number);
          case '==': return lv === rv;
          default:   return false;
        }
      }

      default:
        return undefined;
    }
  }

  // ---------------------------------------------------------------------------
  // Identifier resolution — includes ALL AliScript v2.0 read-only variables
  // ---------------------------------------------------------------------------
  private resolveIdentifier(
    robot: Robot,
    node: Identifier | NumberLiteral | StringLiteral,
    memory: Record<string, unknown>,
    getRobots: () => Robot[],
  ): unknown {
    if (node.type === NodeType.NumberLiteral || node.type === NodeType.StringLiteral) {
      return node.value;
    }

    const name = (node as Identifier).value;

    // 1. User-defined variable (SET x = ...) takes highest priority
    if (name in memory) return memory[name];

    // 2. Built-in read-only identifiers
    const maxEnergy = robot.maxEnergy ?? 1000;
    const energy    = robot.energy    ?? maxEnergy;

    // --- Energy / Stasis identifiers ---
    switch (name) {
      case 'MY_ENERGY':   return energy;
      case 'ENERGY_PCT':  return Math.round((energy / maxEnergy) * 100);
      case 'IN_STASIS':   return robot.inStasis ?? false;
    }

    // --- FOV / Visibility identifiers ---
    const visibleRobots = robot.visibleEntities?.robots ?? [];

    switch (name) {
      case 'CAN_SEE_ENEMY':       return visibleRobots.length > 0;
      case 'VISIBLE_ENEMY_COUNT': return visibleRobots.length;
      case 'FOV_ANGLE':           return robot.fov?.angle ?? 120;

      case 'NEAREST_VISIBLE_X':
      case 'NEAREST_VISIBLE_Y': {
        if (visibleRobots.length === 0) {
          return name === 'NEAREST_VISIBLE_X' ? robot.position.x : robot.position.y;
        }
        // Find nearest visible enemy
        let nearest    = visibleRobots[0];
        let nearestDst = Infinity;
        for (const candidate of visibleRobots) {
          const dx  = candidate.position.x - robot.position.x;
          const dy  = candidate.position.y - robot.position.y;
          const dst = dx * dx + dy * dy;
          if (dst < nearestDst) { nearestDst = dst; nearest = candidate; }
        }
        return name === 'NEAREST_VISIBLE_X' ? nearest.position.x : nearest.position.y;
      }
    }

    // --- Legacy / existing identifiers (derived from visible entities only) ---
    // `distance` now only reports distance to the nearest VISIBLE enemy.
    // `spotted`  is true iff there is at least one visible enemy.
    const nearestVisible = this.getNearestVisible(robot);

    switch (name) {
      case 'distance': {
        if (!nearestVisible) return Infinity;
        const dx = robot.position.x - nearestVisible.position.x;
        const dy = robot.position.y - nearestVisible.position.y;
        return Math.hypot(dx, dy);
      }
      case 'health':       return robot.health;
      case 'rotation':     return robot.rotation;
      case 'target_vx':    return nearestVisible?.velocity.x ?? 0;
      case 'target_vy':    return nearestVisible?.velocity.y ?? 0;
      case 'bullet_speed': return 400;
      case 'spotted':      return nearestVisible !== null;

      default: return undefined;
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Returns the nearest enemy within the robot's FOV, or null. */
  private getNearestVisible(robot: Robot): Robot | null {
    const visible = robot.visibleEntities?.robots ?? [];
    if (visible.length === 0) return null;

    let nearest    = visible[0];
    let nearestDst = Infinity;
    for (const candidate of visible) {
      const dx  = candidate.position.x - robot.position.x;
      const dy  = candidate.position.y - robot.position.y;
      const dst = dx * dx + dy * dy;
      if (dst < nearestDst) { nearestDst = dst; nearest = candidate; }
    }
    return nearest;
  }
}