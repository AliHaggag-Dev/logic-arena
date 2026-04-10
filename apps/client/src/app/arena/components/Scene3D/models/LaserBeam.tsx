"use client";
import React, { useMemo } from "react";
import * as THREE from "three";
import { LaserBeamProps } from "../../../types";

export const LaserBeam = ({ start, end }: LaserBeamProps) => {
  const midpoint = useMemo(() => {
    return new THREE.Vector3((start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2);
  }, [start, end]);

  const direction = useMemo(() => {
    return new THREE.Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
  }, [start, end]);

  const length = direction.length();
  const quaternion = useMemo(() => {
    const axis = new THREE.Vector3(0, 1, 0);
    return new THREE.Quaternion().setFromUnitVectors(axis, direction.clone().normalize());
  }, [direction]);

  return (
    <mesh position={midpoint} quaternion={quaternion}>
      <cylinderGeometry args={[0.03, 0.05, length, 12]} />
      <meshStandardMaterial color="#FF00FF" emissive="#FF00FF" emissiveIntensity={6} toneMapped={false} />
    </mesh>
  );
};
