"use client";
import { useRef, useEffect, memo } from "react";
import { Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three';
import { useFrame } from "@react-three/fiber";
import { LaserModelProps } from "../../../types";
import { interpolationBuffer } from '../../../core/interpolation-buffer';

// Shared across ALL projectile instances — created once, never disposed while the module lives.
// This eliminates per-instance geometry/material allocation for potentially dozens of projectiles.
const SHARED_PROJECTILE_GEO = new SphereGeometry(0.1, 16, 16);
const SHARED_PROJECTILE_MAT = new MeshStandardMaterial({
  color: "#FFFFFF",
  emissive: "#00FFFF",
  emissiveIntensity: 10,
  toneMapped: false,
});

// Scene coordinate conversion constants (arena units → 3D scene units)
const SCENE_SCALE = 40;
const SCENE_OFFSET_X = 10;
const SCENE_OFFSET_Z = 7.5;

export const LaserModel = memo(({ position, projectileId }: LaserModelProps) => {
  const meshRef = useRef<Mesh>(null);
  const targetPos = useRef(new Vector3(...position));
  const currentPos = useRef(new Vector3(...position));

  useEffect(() => {
    targetPos.current.set(position[0], position[1], position[2]);
  }, [position]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    // --- INTERPOLATION BUFFER: sub-frame smooth positioning ---
    // Query the buffer at native frame rate for a perfectly interpolated
    // projectile position between two confirmed server snapshots.
    if (projectileId) {
      const interp = interpolationBuffer.getInterpolatedProjectile(projectileId);
      if (interp) {
        targetPos.current.set(
          (interp.x / SCENE_SCALE) - SCENE_OFFSET_X,
          0.375,
          (interp.y / SCENE_SCALE) - SCENE_OFFSET_Z,
        );
      }
    }

    // Fast lerp for projectiles — they move quick so lerpFactor is high
    const lerpFactor = 1 - Math.pow(0.001, delta * 20);
    currentPos.current.lerp(targetPos.current, lerpFactor);
    meshRef.current.position.copy(currentPos.current);
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      geometry={SHARED_PROJECTILE_GEO}
      material={SHARED_PROJECTILE_MAT}
    />
  );
});
LaserModel.displayName = "LaserModel";