'use client';
import React, { useRef } from 'react';
import { BackSide, Mesh, MeshBasicMaterial, PointLight, Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { StasisEffectProps } from '../../../types';
import { interpolationBuffer } from '../../../core/interpolation-buffer';

/**
 * StasisEffect — pulsing blue-white electric aura around a stasis-locked robot.
 * Renders a point light + ring mesh that animate in/out via sine wave.
 */
export const StasisEffect = ({ position, robotId, inStasis }: StasisEffectProps) => {
  const groupRef    = useRef<Group>(null);
  const lightRef    = useRef<PointLight>(null);
  const ringRef     = useRef<Mesh>(null);
  const phaseRef    = useRef(0);
  const targetPosition = useRef(new Vector3(...position));
  const basePosition = useRef(new Vector3(...position));

  const ARENA_SCALE = 40;
  const SNAP_DISTANCE = 3;
  const POSITION_LERP_DECAY = 0.01;
  const POSITION_LERP_SPEED = 10;

  useFrame((_, delta) => {
    // 1. Position interpolation
    if (groupRef.current) {
      const interp = robotId ? interpolationBuffer.getInterpolatedRobot(robotId) : null;
      if (interp) {
        targetPosition.current.set(
          (interp.position.x / ARENA_SCALE) - 10,
          0.15,
          (interp.position.y / ARENA_SCALE) - 7.5,
        );
      } else {
        targetPosition.current.set(...position);
      }

      const lerpFactor = 1 - Math.pow(POSITION_LERP_DECAY, delta * POSITION_LERP_SPEED);
      if (basePosition.current.distanceTo(targetPosition.current) > SNAP_DISTANCE) {
        basePosition.current.copy(targetPosition.current);
      } else {
        basePosition.current.lerp(targetPosition.current, lerpFactor);
      }
      groupRef.current.position.copy(basePosition.current);
    }

    // 2. Pulse animations
    phaseRef.current += delta * 3;
    const t = Math.sin(phaseRef.current);
    // Oscillate light intensity 0.5 → 4 (only if inStasis is active)
    if (lightRef.current) {
      lightRef.current.intensity = inStasis ? (0.5 + (t * 0.5 + 0.5) * 3.5) : 0;
    }
    // Oscillate ring scale 0.8 → 1.3
    if (ringRef.current) {
      const s = 0.8 + (t * 0.5 + 0.5) * 0.5;
      ringRef.current.scale.setScalar(s);
      (ringRef.current.material as MeshBasicMaterial).opacity = inStasis
        ? (0.15 + (t * 0.5 + 0.5) * 0.35)
        : 0;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Pulsing blue-white point light */}
      <pointLight
        ref={lightRef}
        color="#88ccff"
        intensity={inStasis ? 2 : 0}
        distance={4}
        decay={2}
      />
      {/* Electric ring mesh */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]} visible={inStasis}>
        <torusGeometry args={[0.55, 0.04, 8, 32]} />
        <meshBasicMaterial
          color="#aaddff"
          transparent
          opacity={inStasis ? 0.4 : 0}
          depthWrite={false}
        />
      </mesh>
      {/* Inner glow sphere */}
      <mesh visible={inStasis}>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshBasicMaterial
          color="#4488ff"
          transparent
          opacity={inStasis ? 0.08 : 0}
          depthWrite={false}
          side={BackSide}
        />
      </mesh>
    </group>
  );
};
