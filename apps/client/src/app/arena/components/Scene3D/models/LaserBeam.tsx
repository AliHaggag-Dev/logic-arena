"use client";
import { useMemo, useEffect, useRef } from "react";
import * as THREE from "three";
import { LaserBeamProps } from "../../../types";

const DEFAULT_TRACER_COLOR = "#22d3ee";

/**
 * Renders a laser tracer beam between two points.
 * Geometry and material are memoized and disposed on unmount to prevent GPU memory leaks.
 */
export const LaserBeam = ({ start, end, color }: LaserBeamProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const resolvedColor = useMemo(() => {
    if (
      !color ||
      color.toUpperCase() === "DEFAULT" ||
      color.toLowerCase().startsWith("paint-") ||
      color.toLowerCase().startsWith("tracer-")
    ) {
      return DEFAULT_TRACER_COLOR;
    }
    return color;
  }, [color]);

  const length = useMemo(() => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }, [start, end]);

  const geometry = useMemo(
    () => new THREE.CylinderGeometry(0.025, 0.04, length, 12),
    [length]
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: resolvedColor,
        emissive: resolvedColor,
        emissiveIntensity: 8,
        toneMapped: false,
      }),
    [resolvedColor]
  );

  // Dispose GPU resources on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  const midpoint = useMemo(
    () =>
      new THREE.Vector3(
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2,
        (start[2] + end[2]) / 2
      ),
    [start, end]
  );

  const quaternion = useMemo(() => {
    const direction = new THREE.Vector3(
      end[0] - start[0],
      end[1] - start[1],
      end[2] - start[2]
    ).normalize();
    const axis = new THREE.Vector3(0, 1, 0);
    return new THREE.Quaternion().setFromUnitVectors(axis, direction);
  }, [start, end]);

  return (
    <mesh
      ref={meshRef}
      position={midpoint}
      quaternion={quaternion}
      geometry={geometry}
      material={material}
    />
  );
};
