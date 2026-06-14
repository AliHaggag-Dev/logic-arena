import { useRef, useEffect, useCallback, MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { HitBurst, RobotState, FiredTracer } from "../types";
import { useGameSounds } from "./useGameSounds";
import {
  HIT_BURST_LIFETIME,
  COLLISION_RADIUS,
  COLLISION_COOLDOWN,
  FOV_DISTANCE,
  FOV_DOT_THRESHOLD,
} from "../components/Scene3D/sceneConstants";

export interface SceneAnimationResult {
  hitBurstsRef: MutableRefObject<HitBurst[]>;
  hitFlashMapRef: MutableRefObject<Map<string, number>>;
  isSpotted: (robot: RobotState) => boolean;
}

/**
 * Manages scene animations, including robot movement, hit effects, and collision sounds.
 * hitBursts and hitFlashMap are stored as refs to prevent 60fps re-renders.
 */
export const useSceneAnimation = (
  robots: RobotState[],
  firedTracer: MutableRefObject<FiredTracer | null> | null,
  soundFx = true,
): SceneAnimationResult => {
  const { playHit, playClang, playLaser } = useGameSounds({ enabled: soundFx });
  const collisionCooldownRef = useRef<Map<string, number>>(new Map());
  const lastLaserRef = useRef<string | null>(null);

  const hitBurstsRef = useRef<HitBurst[]>([]);
  const hitFlashMapRef = useRef<Map<string, number>>(new Map());
  const prevHealthRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const now = performance.now() / 1000;

    robots.forEach(robot => {
      const prevHealth = prevHealthRef.current.get(robot.id);
      if (prevHealth !== undefined && robot.health < prevHealth) {
        const burst: HitBurst = {
          id: `${robot.id}-${now}`,
          position: [(robot.position.x / 40) - 10, 0.45, (robot.position.y / 40) - 7.5],
          color: robot.color,
          createdAt: now
        };
        hitBurstsRef.current = [...hitBurstsRef.current, burst];

        const next = new Map(hitFlashMapRef.current);
        next.set(robot.id, now);
        hitFlashMapRef.current = next;

        playHit();
      }
      prevHealthRef.current.set(robot.id, robot.health);
    });
  }, [robots, playHit]);

  // Garbage-collect expired bursts and trigger sound effects inside the render loop (no state updates)
  useFrame(() => {
    const tracer = firedTracer?.current;
    if (tracer) {
      const key = `${tracer.robotId}-${tracer.targetPosition.x}-${tracer.targetPosition.y}`;
      if (lastLaserRef.current !== key) {
        playLaser();
        lastLaserRef.current = key;
      }
    }

    if (hitBurstsRef.current.length === 0) return;
    const now = performance.now() / 1000;
    const alive = hitBurstsRef.current.filter(b => now - b.createdAt < HIT_BURST_LIFETIME);
    if (alive.length !== hitBurstsRef.current.length) {
      hitBurstsRef.current = alive;
    }
  });

  useEffect(() => {
    const now = performance.now() / 1000;
    const robotCount = robots.length;

    for (let i = 0; i < robotCount; i += 1) {
      for (let j = i + 1; j < robotCount; j += 1) {
        const robotA = robots[i];
        const robotB = robots[j];

        const dx = robotA.position.x - robotB.position.x;
        const dy = robotA.position.y - robotB.position.y;
        const distance = Math.hypot(dx, dy);

        if (distance <= COLLISION_RADIUS) {
          const pairKey = [robotA.id, robotB.id].sort().join("|");
          const lastPlayed = collisionCooldownRef.current.get(pairKey) || 0;
          if (now - lastPlayed > COLLISION_COOLDOWN) {
            playClang();
            collisionCooldownRef.current.set(pairKey, now);
          }
        }
      }
    }
  }, [robots, playClang]);



  const getClosestTarget = useCallback((robot: RobotState) => {
    const targets = robots.filter(other => other.id !== robot.id && other.health > 0);
    if (targets.length === 0) return null;

    return targets.reduce((closest, current) => {
      const closestDx = robot.position.x - closest.position.x;
      const closestDy = robot.position.y - closest.position.y;
      const currentDx = robot.position.x - current.position.x;
      const currentDy = robot.position.y - current.position.y;

      const closestDistance = closestDx * closestDx + closestDy * closestDy;
      const currentDistance = currentDx * currentDx + currentDy * currentDy;

      return currentDistance < closestDistance ? current : closest;
    });
  }, [robots]);

  const isSpotted = useCallback((robot: RobotState) => {
    const target = getClosestTarget(robot);
    if (!target) return false;

    const dx = target.position.x - robot.position.x;
    const dy = target.position.y - robot.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance === 0) return true;
    if (distance > FOV_DISTANCE) return false;

    const vx = robot.velocity?.x ?? 0;
    const vy = robot.velocity?.y ?? 0;
    const speed = Math.hypot(vx, vy);
    if (speed < 0.001) return false;

    const dot = (vx * dx + vy * dy) / (speed * distance);
    return dot >= FOV_DOT_THRESHOLD;
  }, [getClosestTarget]);

  return { hitBurstsRef, hitFlashMapRef, isSpotted };
};
