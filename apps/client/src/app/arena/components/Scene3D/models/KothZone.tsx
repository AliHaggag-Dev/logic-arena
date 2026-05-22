import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface KothZoneProps {
  zone: { x: number; y: number; radius: number };
}

const toSceneX = (x: number) => (x / 40) - 10;
const toSceneZ = (y: number) => (y / 40) - 7.5;

export const KothZone: React.FC<KothZoneProps> = ({ zone }) => {
  const sceneRadius = zone.radius / 40;
  const cylinderRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (cylinderRef.current) {
      const material = cylinderRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group position={[toSceneX(zone.x), 0.08, toSceneZ(zone.y)]}>
      {/* Capture Area Cylinder */}
      <mesh ref={cylinderRef}>
        <cylinderGeometry args={[sceneRadius, sceneRadius, 0.15, 32]} />
        <meshStandardMaterial
          color="#fbbf24"
          transparent
          opacity={0.2}
          emissive="#f59e0b"
          emissiveIntensity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Rotating Boundary Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <torusGeometry args={[sceneRadius, 0.02, 8, 32]} />
        <meshStandardMaterial
          color="#f59e0b"
          emissive="#fbbf24"
          emissiveIntensity={1}
        />
      </mesh>
    </group>
  );
};
