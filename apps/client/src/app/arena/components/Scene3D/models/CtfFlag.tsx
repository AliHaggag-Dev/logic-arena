import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CtfFlag as CtfFlagType } from '../../../types';

interface CtfFlagProps {
  flag: CtfFlagType;
  carrierPosition?: [number, number, number];
}

const toSceneX = (x: number) => (x / 40) - 10;
const toSceneZ = (y: number) => (y / 40) - 7.5;

export const CtfFlagModel: React.FC<CtfFlagProps> = ({ flag, carrierPosition }) => {
  const isCarried = !!flag.carrierId && !!carrierPosition;
  const position: [number, number, number] = isCarried
    ? [carrierPosition[0], carrierPosition[1] + 0.8, carrierPosition[2]]
    : [toSceneX(flag.position.x), 0.3, toSceneZ(flag.position.y)];

  const teamColor = flag.team === 'A' ? '#22d3ee' : '#e879f9';
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current && isCarried) {
      groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 4) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Flag Pole */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
        <meshStandardMaterial color="#888888" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Flag Cloth */}
      <mesh position={[0.1, 0.2, 0]} rotation={[0, 0, -0.1]}>
        <planeGeometry args={[0.2, 0.12]} />
        <meshStandardMaterial
          color={teamColor}
          emissive={teamColor}
          emissiveIntensity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};
