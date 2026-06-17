/**
 * Entity Interpolation Buffer
 * ---------------------------
 * Stores a rolling window of server snapshots and provides perfectly smooth
 * interpolation between two confirmed server positions.
 *
 * Instead of rendering the "latest" server state (which arrives at ~20 Hz and
 * causes visual stuttering on 60–120 Hz screens), the renderer queries a point
 * in the *recent past* (e.g. 100 ms ago). Because two snapshots always bracket
 * that point, we can linearly interpolate between them to produce a pixel-perfect
 * position at any arbitrary frame rate — no prediction, no rubber-banding.
 *
 * The buffer also drives React component liveness: `getDelayedSnapshot()` returns
 * a full GameState from `DELAY_MS` ago, so React will not unmount a projectile
 * until the visual timeline actually reaches the moment of its server-side removal.
 */

import { GameState, RobotState, ProjectileState, Vec2 } from '../types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** How far in the past the renderer draws (ms). Two server ticks = 100 ms. */
const INTERP_DELAY_MS = 100;

/** Maximum snapshots kept in the ring buffer (~2 s at 20 Hz). */
const MAX_SNAPSHOTS = 40;

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface TimestampedSnapshot {
  time: number;       // performance.now() when the snapshot was received
  state: GameState;
}

interface InterpolatedEntity {
  position: Vec2;
  rotation: number;
  velocity: Vec2;
  fovDirection?: number;
}

// ---------------------------------------------------------------------------
// Public class
// ---------------------------------------------------------------------------

class InterpolationBuffer {
  private snapshots: TimestampedSnapshot[] = [];

  // ── Flush all snapshots (call between arena mounts) ─────────────────────
  clear(): void {
    this.snapshots = [];
  }

  // ── Push a new server snapshot ──────────────────────────────────────────
  push(state: GameState): void {
    const now = performance.now();
    this.snapshots.push({ time: now, state });

    // Trim old snapshots beyond the ring buffer size
    if (this.snapshots.length > MAX_SNAPSHOTS) {
      this.snapshots.splice(0, this.snapshots.length - MAX_SNAPSHOTS);
    }
  }

  // ── Get the full delayed snapshot (for React component liveness) ───────
  /**
   * Returns a GameState from `INTERP_DELAY_MS` ago by picking the snapshot
   * whose timestamp is closest to (now - delay). This is used to drive
   * `uiState` so React mounts/unmounts entities at the correct visual time.
   */
  getDelayedSnapshot(): GameState | null {
    if (this.snapshots.length === 0) return null;

    const targetTime = performance.now() - INTERP_DELAY_MS;

    // Find the latest snapshot that is at or before targetTime
    let best: TimestampedSnapshot | null = null;
    for (let i = this.snapshots.length - 1; i >= 0; i--) {
      if (this.snapshots[i].time <= targetTime) {
        best = this.snapshots[i];
        break;
      }
    }

    // If no snapshot is old enough yet (first ~100ms), use the oldest available
    return best ? best.state : this.snapshots[0].state;
  }

  // ── Interpolate a specific robot's visual state ────────────────────────
  /**
   * Returns a smoothly interpolated position + rotation for the given robot
   * at `INTERP_DELAY_MS` in the past. If there are fewer than 2 snapshots,
   * returns the only known position or null.
   */
  getInterpolatedRobot(robotId: string): InterpolatedEntity | null {
    if (this.snapshots.length === 0) return null;
    if (this.snapshots.length === 1) {
      const robot = this.snapshots[0].state.robots.find(r => r.id === robotId);
      return robot ? this.entityFromRobot(robot) : null;
    }

    const pair = this.findBracketingPair();
    // findBracketingPair always returns a pair when length >= 2
    const { before, after, t } = pair!;

    const robotA = before.state.robots.find(r => r.id === robotId);
    const robotB = after.state.robots.find(r => r.id === robotId);

    if (!robotA && !robotB) return null;
    if (!robotA) return this.entityFromRobot(robotB!);
    if (!robotB) return this.entityFromRobot(robotA);

    return {
      position: {
        x: robotA.position.x + (robotB.position.x - robotA.position.x) * t,
        y: robotA.position.y + (robotB.position.y - robotA.position.y) * t,
      },
      rotation: this.lerpAngle(robotA.rotation ?? 0, robotB.rotation ?? 0, t),
      velocity: robotB.velocity ?? { x: 0, y: 0 },
      fovDirection: this.lerpAngle(robotA.fovDirection ?? robotA.rotation ?? 0, robotB.fovDirection ?? robotB.rotation ?? 0, t),
    };
  }

  // ── Interpolate a specific projectile's visual state ───────────────────
  getInterpolatedProjectile(projectileId: string): Vec2 | null {
    if (this.snapshots.length === 0) return null;
    if (this.snapshots.length === 1) {
      const proj = this.snapshots[0].state.projectiles.find(p => p.id === projectileId);
      return proj ? proj.position : null;
    }

    const pair = this.findBracketingPair();
    const { before, after, t } = pair!;

    const projA = before.state.projectiles.find(p => p.id === projectileId);
    const projB = after.state.projectiles.find(p => p.id === projectileId);

    if (!projA && !projB) return null;
    if (!projA) return projB!.position;
    if (!projB) return projA.position;

    return {
      x: projA.position.x + (projB.position.x - projA.position.x) * t,
      y: projA.position.y + (projB.position.y - projA.position.y) * t,
    };
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  /**
   * Find a pair of snapshots bracketing `targetTime` (now - INTERP_DELAY_MS).
   * When the ideal bracket doesn't exist (too few snapshots, or all too
   * recent / too old), we fall back to the two oldest or two newest snapshots
   * so that the caller ALWAYS gets a pair when length >= 2 and can produce
   * continuous sub-frame movement.
   */
  private findBracketingPair(): {
    before: TimestampedSnapshot;
    after: TimestampedSnapshot;
    t: number;
  } | null {
    if (this.snapshots.length < 2) return null;

    const targetTime = performance.now() - INTERP_DELAY_MS;

    // Find the latest snapshot that is at or before targetTime
    let beforeIdx = -1;
    for (let i = this.snapshots.length - 1; i >= 0; i--) {
      if (this.snapshots[i].time <= targetTime) {
        beforeIdx = i;
        break;
      }
    }

    // All snapshots are newer than targetTime — use oldest pair, render at oldest
    if (beforeIdx === -1) {
      return { before: this.snapshots[0], after: this.snapshots[1], t: 0 };
    }

    const afterIdx = beforeIdx + 1;

    // All snapshots are older than targetTime — use newest pair, render at newest
    if (afterIdx >= this.snapshots.length) {
      const last = this.snapshots.length - 1;
      return { before: this.snapshots[last - 1], after: this.snapshots[last], t: 1 };
    }

    const before = this.snapshots[beforeIdx];
    const after = this.snapshots[afterIdx];

    const span = after.time - before.time;
    const t = span > 0 ? Math.min(1, Math.max(0, (targetTime - before.time) / span)) : 0;

    return { before, after, t };
  }

  private entityFromRobot(robot: RobotState): InterpolatedEntity {
    return {
      position: { ...robot.position },
      rotation: robot.rotation ?? 0,
      velocity: robot.velocity ?? { x: 0, y: 0 },
      fovDirection: robot.fovDirection ?? robot.rotation ?? 0,
    };
  }

  /** Shortest-path angle interpolation */
  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    // Normalize to [-π, π]
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    return a + diff * t;
  }
}

// ---------------------------------------------------------------------------
// Singleton — shared across the entire client app
// ---------------------------------------------------------------------------

export const interpolationBuffer = new InterpolationBuffer();
