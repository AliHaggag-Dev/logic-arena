"use client";
import { useRef, useEffect, memo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { LaserModelProps } from "../../../types";

// Shared across ALL projectile instances — created once, never disposed while the module lives.
// This eliminates per-instance geometry/material allocation for potentially dozens of projectiles.
const SHARED_PROJECTILE_GEO = new THREE.SphereGeometry(0.1, 16, 16);
const SHARED_PROJECTILE_MAT = new THREE.MeshStandardMaterial({
  color: "#FFFFFF",
  emissive: "#00FFFF",
  emissiveIntensity: 10,
  toneMapped: false,
});

export const LaserModel = memo(({ position }: LaserModelProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetPos = useRef(new THREE.Vector3(...position));
  const currentPos = useRef(new THREE.Vector3(...position));

  useEffect(() => {
    targetPos.current.set(position[0], position[1], position[2]);
  }, [position]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
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