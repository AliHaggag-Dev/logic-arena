"use client";

import React, { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

/* ─── Robot model with colour tinting ──────────────────────────── */
function RobotModel({ file, color }: { file: string; color: string }) {
  const { scene } = useGLTF(file);
  const groupRef = useRef<THREE.Group>(null!);

  useEffect(() => {
    const col = new THREE.Color(color);
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
        mat.color = col;
        mesh.material = mat;
      }
    });
  }, [scene, color]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1.4} position={[0, -1.2, 0]} />
    </group>
  );
}

/* ─── Loading fallback inside Canvas ───────────────────────────── */
function LoadingPlaceholder() {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta;
  });
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color="#22d3ee" wireframe />
    </mesh>
  );
}

/* ─── RobotViewer ───────────────────────────────────────────────── */
interface RobotViewerProps {
  file: string;
  color: string;
}

export function RobotViewer({ file, color }: RobotViewerProps) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-[#22d3ee]/10 bg-[#050d1a] relative">
      {/* Corner decor */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#22d3ee]/60 rounded-tl z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#22d3ee]/60 rounded-tr z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#22d3ee]/60 rounded-bl z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#22d3ee]/60 rounded-br z-10 pointer-events-none" />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.025]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(34,211,238,0.5) 0px, rgba(34,211,238,0.5) 1px, transparent 1px, transparent 4px)",
        }}
      />

      <Canvas
        camera={{ position: [0, 1.5, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} color="#22d3ee" />
        <directionalLight position={[-5, 3, -5]} intensity={0.6} color="#a855f7" />
        <pointLight position={[0, -3, 0]} intensity={1.2} color="#22d3ee" distance={8} />
        <Suspense fallback={<LoadingPlaceholder />}>
          <RobotModel file={file} color={color} />
          <Environment preset="night" />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={8}
          autoRotate={false}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  );
}
