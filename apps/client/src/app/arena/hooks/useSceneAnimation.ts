import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HitBurst, RobotState, FiredTracer } from "../types";
import { useGameSounds } from "./useGameSounds";

const HIT_FLASH_DURATION = 0.22;
const HIT_BURST_LIFETIME = 0.35;
const COLLISION_RADIUS = 30;
const COLLISION_COOLDOWN = 0.35;
const FOV_DISTANCE = 1000;
const FOV_DOT_THRESHOLD = Math.cos(Math.PI / 6);

/**
 * Manages scene animations, including robot movement, hit effects, and collision sounds.
 */
export const useSceneAnimation = (robots: RobotState[], firedTracer: FiredTracer | null, soundFx = true) => {
  const { playHit, playClang, playLaser } = useGameSounds({ enabled: soundFx });
  const collisionCooldownRef = useRef<Map<string, number>>(new Map());
  const lastLaserRef = useRef<string | null>(null);

  const [hitBursts, setHitBursts] = useState<HitBurst[]>([]);
  const [hitFlashMap, setHitFlashMap] = useState<Map<string, number>>(() => new Map());
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
        setHitBursts(current => [...current, burst]);
        setHitFlashMap(current => {
          const next = new Map(current);
          next.set(robot.id, now);
          return next;
        });
        playHit();
      }
      prevHealthRef.current.set(robot.id, robot.health);
    });
  }, [robots, playHit]);

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

  useEffect(() => {
    if (!firedTracer) return;
    const key = `${firedTracer.robotId}-${firedTracer.targetPosition.x}-${firedTracer.targetPosition.y}`;
    if (lastLaserRef.current !== key) {
      playLaser();
      lastLaserRef.current = key;
    }
  }, [firedTracer, playLaser]);

  const getClosestTarget = (robot: RobotState) => {
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
  };

  const isSpotted = (robot: RobotState) => {
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
  };

  return { hitBursts, setHitBursts, hitFlashMap, isSpotted };
};


