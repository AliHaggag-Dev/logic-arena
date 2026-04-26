"use client";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

export const TrainingEnvironment = ({ width, height }: { width: number; height: number }) => {
  const textRef = useRef<THREE.Group>(null);

  // Center of the arena in 3D scene coordinates
  const centerX = 0;
  const centerZ = 0;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // Hover effect for the holographic text
    if (textRef.current) {
      textRef.current.position.y = 2.5 + Math.sin(t * 1.5) * 0.2;
    }
  });

  return (
    <>
      {/* Ambient Fog Effect */}
      <fog attach="fog" args={["#020813", 10, 25]} />

      {/* Corner Danger Zone Markers */}
      {[
        [-9.8, -7.3], [9.8, -7.3], [9.8, 7.3], [-9.8, 7.3]
      ].map((pos, i) => (
        <mesh key={i} position={[pos[0], 0.05, pos[1]]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial 
            color="#ff0055" 
            transparent 
            opacity={0.3} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Floating Holographic Label */}
      <group ref={textRef} position={[centerX, 2.5, centerZ]}>
        <Html center>
          <div 
            className="font-mono text-[#00ffff] font-black text-2xl tracking-[0.3em] whitespace-nowrap select-none pointer-events-none"
            style={{ textShadow: "0 0 15px rgba(0, 255, 255, 0.8)" }}
          >
            TRAINING FACILITY
          </div>
        </Html>
      </group>
      
      {/* Subdued ambient light for the grid */}
      <ambientLight intensity={0.5} color="#00ffff" />
    </>
  );
};


