import { GameState, Obstacle, Projectile, Robot, Vector2 } from '@logic-arena/engine';
import {
  GameStateDelta,
  ProjectileDelta,
  RobotDelta,
  SafeGameSnapshot,
  SafeProjectileSnapshot,
  SafeRobotSnapshot,
  TRACKED_ROBOT_PROPS,
  TrackedRobotProp,
} from './types';

function cloneVector(value?: Vector2): Vector2 | undefined {
  return value ? { x: value.x, y: value.y } : undefined;
}

function vectorsEqual(a?: Vector2, b?: Vector2): boolean {
  return (a?.x ?? 0) === (b?.x ?? 0) && (a?.y ?? 0) === (b?.y ?? 0);
}

function arraysEqualUnordered(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const aSorted = [...a].sort();
  const bSorted = [...b].sort();
  return aSorted.every((value, index) => value === bSorted[index]);
}

function cloneObstacle(obstacle: Obstacle): Obstacle {
  return {
    ...obstacle,
    position: { ...obstacle.position },
  };
}

function obstaclesEqual(a: Obstacle[], b: Obstacle[]): boolean {
  if (a.length !== b.length) return false;

  const previousById = new Map(b.map((obstacle) => [obstacle.id, obstacle]));
  return a.every((obstacle) => {
    const previous = previousById.get(obstacle.id);
    return (
      previous !== undefined &&
      obstacle.type === previous.type &&
      obstacle.width === previous.width &&
      obstacle.height === previous.height &&
      obstacle.rotation === previous.rotation &&
      obstacle.ownerId === previous.ownerId &&
      obstacle.createdAt === previous.createdAt &&
      obstacle.triggered === previous.triggered &&
      vectorsEqual(obstacle.position, previous.position)
    );
  });
}

function propChanged(
  prop: TrackedRobotProp,
  current: Robot,
  previous: SafeRobotSnapshot,
): boolean {
  const currentValue = current[prop as keyof Robot];
  const previousValue = previous[prop];

  if (prop === 'position' || prop === 'velocity') {
    return !vectorsEqual(
      currentValue as Vector2 | undefined,
      previousValue as Vector2 | undefined,
    );
  }

  return currentValue !== previousValue;
}

function cloneTrackedValue(
  prop: TrackedRobotProp,
  robot: Robot,
): SafeRobotSnapshot[TrackedRobotProp] {
  const value = robot[prop as keyof Robot];
  if (prop === 'position' || prop === 'velocity') {
    return cloneVector(
      value as Vector2 | undefined,
    ) as SafeRobotSnapshot[TrackedRobotProp];
  }
  return value as SafeRobotSnapshot[TrackedRobotProp];
}

function toSafeProjectile(projectile: Projectile): SafeProjectileSnapshot {
  return {
    id: projectile.id,
    position: { ...projectile.position },
    velocity: { ...projectile.velocity },
    color: projectile.color,
    ownerId: projectile.ownerId,
  };
}

function computeProjectileDelta(
  currentProjectiles: Projectile[],
  previousProjectiles: SafeProjectileSnapshot[],
): ProjectileDelta {
  const previousById = new Map(previousProjectiles.map((p) => [p.id, p]));
  const currentIds = new Set<string>();
  const upsert: SafeProjectileSnapshot[] = [];

  for (const projectile of currentProjectiles) {
    currentIds.add(projectile.id);
    const previous = previousById.get(projectile.id);
    if (
      !previous ||
      !vectorsEqual(projectile.position, previous.position) ||
      !vectorsEqual(projectile.velocity, previous.velocity) ||
      projectile.color !== previous.color ||
      projectile.ownerId !== previous.ownerId
    ) {
      upsert.push(toSafeProjectile(projectile));
    }
  }

  const remove = previousProjectiles
    .filter((projectile) => !currentIds.has(projectile.id))
    .map((projectile) => projectile.id);

  return { upsert, remove };
}

export function computeDeltaDiff(
  state: GameState,
  prevState: SafeGameSnapshot | null | undefined,
): GameStateDelta {
  if (!prevState) return { type: 'full', state, modeData: state.modeData };

  const previousRobotsById = new Map(
    prevState.robots.map((robot) => [robot.id, robot]),
  );
  const robotsDiff = state.robots
    .map((robot): RobotDelta | null => {
      const previousRobot = previousRobotsById.get(robot.id);
      if (!previousRobot) return robot as RobotDelta;

      const robotDelta: RobotDelta = { id: robot.id };
      let changed = false;

      for (const prop of TRACKED_ROBOT_PROPS) {
        if (propChanged(prop, robot, previousRobot)) {
          (
            robotDelta as Record<
              TrackedRobotProp,
              SafeRobotSnapshot[TrackedRobotProp]
            >
          )[prop] = cloneTrackedValue(prop, robot);
          changed = true;
        }
      }

      const visibleRobotIds = (robot.visibleEntities?.robots ?? []).map(
        (visibleRobot) => visibleRobot.id,
      );
      if (
        !arraysEqualUnordered(
          visibleRobotIds,
          previousRobot.visibleRobotIds ?? [],
        )
      ) {
        robotDelta.visibleRobotIds = visibleRobotIds;
        changed = true;
      }

      return changed ? robotDelta : null;
    })
    .filter((delta): delta is RobotDelta => delta !== null);

  const obstacleDiff = obstaclesEqual(state.obstacles, prevState.obstacles)
    ? undefined
    : state.obstacles.map(cloneObstacle);

  return {
    type: 'delta',
    diff: {
      robots: robotsDiff,
      projectiles: computeProjectileDelta(
        state.projectiles,
        prevState.projectiles,
      ),
      ...(obstacleDiff ? { obstacles: obstacleDiff } : {}),
    },
    modeData: state.modeData,
  };
}

export function generateSafeSnapshot(state: GameState): SafeGameSnapshot {
  return {
    robots: state.robots.map((r) => {
      const snap: SafeRobotSnapshot = { id: r.id, visibleRobotIds: [] };
      for (const prop of TRACKED_ROBOT_PROPS) {
        (snap as Record<TrackedRobotProp, SafeRobotSnapshot[TrackedRobotProp]>)[
          prop
        ] = cloneTrackedValue(prop, r);
      }
      snap.visibleRobotIds = (r.visibleEntities?.robots ?? []).map(
        (vr) => vr.id,
      );
      return snap;
    }),
    projectiles: state.projectiles.map(toSafeProjectile),
    obstacles: state.obstacles.map(cloneObstacle),
    modeData: state.modeData,
  };
}
