import { TRACKED_ROBOT_PROPS } from './types';

const STATIC_FIELDS = ['obstacles', 'mapBoundaries'];

export function computeDeltaDiff(state: any, prevState: any | null): any {
  let delta: any = { type: 'full', state };

  if (prevState) {
    const robotsDiff = state.robots
      .map((r: any) => {
        const prevR = prevState.robots.find((pr: any) => pr.id === r.id);
        if (!prevR) return r;

        let rd: any = { id: r.id };
        let changed = false;

        for (const prop of TRACKED_ROBOT_PROPS) {
          const curVal = JSON.stringify(r[prop]);
          const prevVal = JSON.stringify((prevR as any)[prop]);
          if (curVal !== prevVal) {
            rd[prop] = r[prop];
            changed = true;
          }
        }

        if (r.isAlive) {
          const vMag = Math.hypot(r.velocity?.x ?? 0, r.velocity?.y ?? 0);
          if (vMag > 0.01) {
            rd.position = r.position;
            rd.velocity = r.velocity;
            rd.rotation = r.rotation;
            changed = true;
          }
        }

        const curIds = (r.visibleEntities?.robots ?? []).map((vr: any) => vr.id).sort().join(',');
        const prevIds = ((prevR as any).visibleRobotIds ?? []).slice().sort().join(',');
        if (curIds !== prevIds) {
          rd.visibleRobotIds = (r.visibleEntities?.robots ?? []).map((vr: any) => vr.id);
          changed = true;
        }

        return changed ? rd : null;
      })
      .filter(Boolean);

    delta = {
      type: 'delta',
      diff: { robots: robotsDiff, projectiles: state.projectiles },
    };
    // Skip diffing STATIC_FIELDS entirely
    STATIC_FIELDS.forEach(field => {
      if (delta.diff[field]) delete delta.diff[field];
    });
  }

  return delta;
}

export function generateSafeSnapshot(state: any): any {
  return {
    robots: state.robots.map((r: any) => {
      const snap: any = { id: r.id };
      for (const prop of TRACKED_ROBOT_PROPS) {
        const val = r[prop];
        snap[prop] =
          val !== null && typeof val === 'object' && !Array.isArray(val)
            ? { ...val }
            : val;
      }
      snap.visibleRobotIds = (r.visibleEntities?.robots ?? []).map((vr: any) => vr.id);
      return snap;
    }),
    projectiles: state.projectiles.map((p: any) => ({
      id: p.id,
      position: { ...p.position },
      velocity: { ...p.velocity },
    })),
    obstacles: undefined,
  };
}
