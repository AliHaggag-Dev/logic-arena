"use client";
import React, { useRef, useMemo, MutableRefObject } from "react";
import { Points, PointsMaterial, BufferAttribute } from "three";
import { useFrame } from "@react-three/fiber";
import { HitBurstEffectProps, HitBurst } from "../../../types";
import { HIT_BURST_LIFETIME, HIT_BURST_PARTICLES } from "../sceneConstants";

interface HitParticlesRefProps {
  burstsRef: MutableRefObject<HitBurst[]>;
}

const hashStringToSeed = (value: string) => {
  // FNV-1a 32-bit
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const HitBurstEffect = ({ burst }: HitBurstEffectProps) => {
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<PointsMaterial>(null);

  const { positions, velocities } = useMemo(() => {
    const rnd = mulberry32(hashStringToSeed(burst.id));

    const positionsArray = new Float32Array(HIT_BURST_PARTICLES * 3);
    const velocitiesArray = new Float32Array(HIT_BURST_PARTICLES * 3);

    for (let i = 0; i < HIT_BURST_PARTICLES; i += 1) {
      const theta = rnd() * Math.PI * 2;
      const phi = rnd() * Math.PI;
      const speed = 0.8 + rnd() * 1.2;

      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.cos(phi) * speed;
      const vz = Math.sin(phi) * Math.sin(theta) * speed;

      const index = i * 3;
      velocitiesArray[index] = vx;
      velocitiesArray[index + 1] = vy;
      velocitiesArray[index + 2] = vz;

      positionsArray[index] = burst.position[0];
      positionsArray[index + 1] = burst.position[1];
      positionsArray[index + 2] = burst.position[2];
    }

    return { positions: positionsArray, velocities: velocitiesArray };
  }, [burst.id, burst.position]);

  useFrame(() => {
    const currentTime = performance.now() / 1000;
    const timeAlive = Math.max(0, currentTime - burst.createdAt);
    const progress = Math.min(1, timeAlive / HIT_BURST_LIFETIME);

    const positionAttr = pointsRef.current?.geometry.getAttribute("position") as BufferAttribute | undefined;
    if (!positionAttr) return;

    for (let i = 0; i < HIT_BURST_PARTICLES; i += 1) {
      const index = i * 3;
      positionAttr.array[index] = burst.position[0] + velocities[index] * timeAlive;
      positionAttr.array[index + 1] = burst.position[1] + velocities[index + 1] * timeAlive;
      positionAttr.array[index + 2] = burst.position[2] + velocities[index + 2] * timeAlive;
    }
    positionAttr.needsUpdate = true;

    if (materialRef.current) {
      materialRef.current.opacity = 1 - progress;
    }
  });

    const safeBurstColor = (!burst.color || burst.color.toUpperCase() === 'DEFAULT' || burst.color.toLowerCase().startsWith('paint-')) ? '#22d3ee' : burst.color;

    return (
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={materialRef} color={safeBurstColor} size={0.06} transparent opacity={1} depthWrite={false} />
      </points>
    );
};

export const HitParticles = ({ burstsRef }: HitParticlesRefProps) => {
  // Read bursts from ref on every frame render — no useState re-render needed
  const bursts = burstsRef.current;

  return (
    <>
      {bursts.map(burst => (
        <HitBurstEffect key={burst.id} burst={burst} />
      ))}
    </>
  );
};
