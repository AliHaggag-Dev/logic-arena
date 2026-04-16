'use client';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { FovConeProps } from '../../../types';

const DEG_TO_RAD   = Math.PI / 180;
const ARENA_SCALE  = 40; // engine units → 3D units

/**
 * FovCone — fan-shaped semi-transparent mesh visualising a robot's Field of View.
 *
 * Geometry: custom BufferGeometry fan built from the FOV config.
 * Color: matches robot team color at ~15% opacity.
 * Rotates to track fovDirection each frame via ref mutation (zero re-renders).
 */
export const FovCone = ({ position, color, fov, fovDirection }: FovConeProps) => {
  const groupRef    = useRef<THREE.Group>(null);
  const dirRef      = useRef(fovDirection);

  // Keep dirRef in sync when prop changes (R3F doesn't re-render every frame)
  dirRef.current = fovDirection;

  const geometry = useMemo(() => {
    const halfAngle  = (fov.angle / 2) * DEG_TO_RAD;
    const rangeUnits = fov.range / ARENA_SCALE;
    const segments   = Math.max(16, Math.round(fov.angle / 5));

    // Fan vertices: center + arc points
    const positions: number[] = [0, 0, 0]; // center vertex

    for (let i = 0; i <= segments; i++) {
      const t     = i / segments;
      const angle = -halfAngle + t * fov.angle * DEG_TO_RAD;
      positions.push(
        Math.cos(angle) * rangeUnits,
        0,
        Math.sin(angle) * rangeUnits,
      );
    }

    // Build triangle indices: fan from vertex 0
    const indices: number[] = [];
    for (let i = 1; i <= segments; i++) {
      indices.push(0, i, i + 1);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [fov.angle, fov.range]);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color:       new THREE.Color(color),
        transparent: true,
        opacity:     0.13,
        depthWrite:  false,
        side:        THREE.DoubleSide,
      }),
    [color],
  );

  // Update rotation each frame using ref — no state, no re-render
  useFrame(() => {
    if (!groupRef.current) return;
    // fovDirection is in radians, X-Z plane (arena is flat)
    // Negate because Three.js Y-rotation is CW vs counter-CCW in 2D
    groupRef.current.rotation.y = -dirRef.current;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={geometry} material={material} />
    </group>
  );
};
