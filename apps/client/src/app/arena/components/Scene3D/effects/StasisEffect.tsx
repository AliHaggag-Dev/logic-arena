'use client';
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { StasisEffectProps } from '../../../types';

/**
 * StasisEffect — pulsing blue-white electric aura around a stasis-locked robot.
 * Renders a point light + ring mesh that animate in/out via sine wave.
 */
export const StasisEffect = ({ position }: StasisEffectProps) => {
  const lightRef    = useRef<THREE.PointLight>(null);
  const ringRef     = useRef<THREE.Mesh>(null);
  const phaseRef    = useRef(0);

  useFrame((_, delta) => {
    phaseRef.current += delta * 3;
    const t = Math.sin(phaseRef.current);
    // Oscillate light intensity 0.5 → 4
    if (lightRef.current) {
      lightRef.current.intensity = 0.5 + (t * 0.5 + 0.5) * 3.5;
    }
    // Oscillate ring scale 0.8 → 1.3
    if (ringRef.current) {
      const s = 0.8 + (t * 0.5 + 0.5) * 0.5;
      ringRef.current.scale.setScalar(s);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.15 + (t * 0.5 + 0.5) * 0.35;
    }
  });

  return (
    <group position={position}>
      {/* Pulsing blue-white point light */}
      <pointLight
        ref={lightRef}
        color="#88ccff"
        intensity={2}
        distance={4}
        decay={2}
      />
      {/* Electric ring mesh */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.04, 8, 32]} />
        <meshBasicMaterial
          color="#aaddff"
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
      {/* Inner glow sphere */}
      <mesh>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshBasicMaterial
          color="#4488ff"
          transparent
          opacity={0.08}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
};
