import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Vec2 } from '../../../types';

interface CtfBaseProps {
  position: Vec2;
  teamColor: string;
}

const toSceneX = (x: number) => (x / 40) - 10;
const toSceneZ = (y: number) => (y / 40) - 7.5;

export const CtfBase: React.FC<CtfBaseProps> = ({ position, teamColor }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.5;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[toSceneX(position.x), 0.02, toSceneZ(position.y)]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <torusGeometry args={[0.6, 0.03, 8, 32]} />
      <meshStandardMaterial
        color={teamColor}
        emissive={teamColor}
        emissiveIntensity={0.8}
      />
    </mesh>
  );
};
