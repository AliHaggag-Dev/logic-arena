"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useRobotColorTint } from "../../garage/hooks/useRobotColorTint";

const CHASSIS_MODEL_PATHS: Record<string, string> = {
  "chassis-unit-01": "/robots/robot.glb",
  "chassis-unit-02": "/robots/robot2.glb",
  "chassis-wraith": "/robots/bunny.glb",
  "chassis-titan": "/robots/armored-robot.glb",
};

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}

// ── Sub-meshes ────────────────────────────────────────────────────────────────

interface RobotMeshProps {
  chassisId: string;
  paintColor: string;
  tracerColor: string;
  animate: boolean;
}

function RobotMesh({ chassisId, paintColor, tracerColor, animate }: RobotMeshProps) {
  const groupRef = useRef<THREE.Group>(null);

  const isUnit01 = chassisId === 'chassis-unit-01';
  const isUnit02 = chassisId === 'chassis-unit-02';
  const isWraith = chassisId === 'chassis-wraith';
  const isTitan = chassisId === 'chassis-titan';
  const modelPath = CHASSIS_MODEL_PATHS[chassisId];

  // Load only the active GLTF model instead of all chassis models per showroom.
  const activeGLTF = useGLTF(modelPath ?? "/robots/robot.glb");
  const activeScene = modelPath ? activeGLTF.scene : null;

  // Apply color tint to the loaded GLTF model
  useRobotColorTint(activeScene, paintColor);

  useFrame((_, delta) => {
    if (!animate) return;
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  // Used for any fallback primitive logic, though now only phantom uses it
  const isTitanPrimitive = chassisId.includes('titan') && !activeScene;
  const isWraithPrimitive = chassisId.includes('wraith') && !activeScene;

  // Fallback for primitive models when paint is DEFAULT
  const safePaintColor = paintColor === 'DEFAULT' ? '#888888' : paintColor;

  return (
    <group ref={groupRef} position={[0, 0.3, 0]}>
      {activeScene ? (
        <primitive
          object={activeScene}
          position={[0, isTitan ? 0 : -0.85, 0]}
          scale={isUnit01 ? 1.6 : isUnit02 ? 0.7 : isWraith ? 1.5 : isTitan ? 1.7 : 1.2}
        />
      ) : (
        <>
          {/* ── Chassis Body ── */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={isTitanPrimitive ? [1.3, 0.8, 0.75] : isWraithPrimitive ? [0.9, 0.6, 0.55] : [1.1, 0.7, 0.65]} />
            <meshStandardMaterial
              color={safePaintColor}
              metalness={0.85}
              roughness={0.15}
              emissive={safePaintColor}
              emissiveIntensity={0.25}
            />
          </mesh>

          {/* ── Shoulder Pads ── */}
          {!isWraithPrimitive && (
            <>
              <mesh position={isTitanPrimitive ? [-0.85, 0.15, 0] : [-0.72, 0.12, 0]} castShadow>
                <boxGeometry args={isTitanPrimitive ? [0.35, 0.5, 0.6] : [0.28, 0.42, 0.55]} />
                <meshStandardMaterial color={safePaintColor} metalness={0.9} roughness={0.1} emissive={safePaintColor} emissiveIntensity={0.15} />
              </mesh>
              <mesh position={isTitanPrimitive ? [0.85, 0.15, 0] : [0.72, 0.12, 0]} castShadow>
                <boxGeometry args={isTitanPrimitive ? [0.35, 0.5, 0.6] : [0.28, 0.42, 0.55]} />
                <meshStandardMaterial color={safePaintColor} metalness={0.9} roughness={0.1} emissive={safePaintColor} emissiveIntensity={0.15} />
              </mesh>
            </>
          )}
          {isTitanPrimitive && (
            <>
              <mesh position={[-1.0, 0.05, 0]} castShadow>
                <boxGeometry args={[0.2, 0.4, 0.5]} />
                <meshStandardMaterial color={paintColor} metalness={0.9} roughness={0.1} emissive={paintColor} emissiveIntensity={0.15} />
              </mesh>
              <mesh position={[1.0, 0.05, 0]} castShadow>
                <boxGeometry args={[0.2, 0.4, 0.5]} />
                <meshStandardMaterial color={paintColor} metalness={0.9} roughness={0.1} emissive={paintColor} emissiveIntensity={0.15} />
              </mesh>
            </>
          )}

          {/* ── Head ── */}
          <mesh position={isTitanPrimitive ? [0, 0.72, 0] : isWraithPrimitive ? [0, 0.55, 0.05] : [0, 0.62, 0]} castShadow>
            <boxGeometry args={isTitanPrimitive ? [0.65, 0.5, 0.55] : isWraithPrimitive ? [0.45, 0.35, 0.6] : [0.55, 0.45, 0.5]} />
            <meshStandardMaterial color={paintColor} metalness={0.8} roughness={0.2} emissive={paintColor} emissiveIntensity={0.2} />
          </mesh>

          {/* ── Visor (glowing eye strip) ── */}
          <mesh position={isTitanPrimitive ? [0, 0.73, 0.29] : isWraithPrimitive ? [0, 0.56, 0.36] : [0, 0.63, 0.27]}>
            <boxGeometry args={isTitanPrimitive ? [0.45, 0.12, 0.02] : isWraithPrimitive ? [0.3, 0.06, 0.02] : [0.38, 0.1, 0.02]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive={paintColor}
              emissiveIntensity={3.5}
              toneMapped={false}
            />
          </mesh>

          {/* ── Turret Base ── */}
          <mesh position={isTitanPrimitive ? [0, 0.45, 0.4] : isWraithPrimitive ? [0, 0.32, 0.3] : [0, 0.38, 0.36]} castShadow>
            <cylinderGeometry args={isTitanPrimitive ? [0.18, 0.22, 0.2] : isWraithPrimitive ? [0.1, 0.14, 0.15] : [0.14, 0.18, 0.18, 8]} />
            <meshStandardMaterial color={paintColor} metalness={0.95} roughness={0.05} emissive={paintColor} emissiveIntensity={0.3} />
          </mesh>

          {/* ── Cannon Barrel ── */}
          <mesh position={isTitanPrimitive ? [0, 0.45, 0.75] : isWraithPrimitive ? [0, 0.32, 0.6] : [0, 0.38, 0.7]} castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={isTitanPrimitive ? [0.07, 0.09, 0.85, 8] : isWraithPrimitive ? [0.04, 0.05, 0.6, 8] : [0.055, 0.07, 0.72, 8]} />
            <meshStandardMaterial color={paintColor} metalness={1} roughness={0.05} emissive={paintColor} emissiveIntensity={0.5} />
          </mesh>

          {/* ── Legs ── */}
          <mesh position={isTitanPrimitive ? [-0.35, -0.6, 0] : isWraithPrimitive ? [-0.2, -0.45, 0] : [-0.27, -0.52, 0]} castShadow>
            <boxGeometry args={isTitanPrimitive ? [0.35, 0.55, 0.45] : isWraithPrimitive ? [0.2, 0.35, 0.3] : [0.28, 0.45, 0.38]} />
            <meshStandardMaterial color={paintColor} metalness={0.8} roughness={0.2} emissive={paintColor} emissiveIntensity={0.1} />
          </mesh>
          <mesh position={isTitanPrimitive ? [0.35, -0.6, 0] : isWraithPrimitive ? [0.2, -0.45, 0] : [0.27, -0.52, 0]} castShadow>
            <boxGeometry args={isTitanPrimitive ? [0.35, 0.55, 0.45] : isWraithPrimitive ? [0.2, 0.35, 0.3] : [0.28, 0.45, 0.38]} />
            <meshStandardMaterial color={paintColor} metalness={0.8} roughness={0.2} emissive={paintColor} emissiveIntensity={0.1} />
          </mesh>

          {/* ── Feet ── */}
          <mesh position={isTitanPrimitive ? [-0.35, -0.92, 0.08] : isWraithPrimitive ? [-0.2, -0.67, 0.05] : [-0.27, -0.79, 0.06]} castShadow>
            <boxGeometry args={isTitanPrimitive ? [0.42, 0.18, 0.6] : isWraithPrimitive ? [0.25, 0.1, 0.4] : [0.33, 0.14, 0.5]} />
            <meshStandardMaterial color={paintColor} metalness={0.9} roughness={0.1} emissive={paintColor} emissiveIntensity={0.08} />
          </mesh>
          <mesh position={isTitanPrimitive ? [0.35, -0.92, 0.08] : isWraithPrimitive ? [0.2, -0.67, 0.05] : [0.27, -0.79, 0.06]} castShadow>
            <boxGeometry args={isTitanPrimitive ? [0.42, 0.18, 0.6] : isWraithPrimitive ? [0.25, 0.1, 0.4] : [0.33, 0.14, 0.5]} />
            <meshStandardMaterial color={paintColor} metalness={0.9} roughness={0.1} emissive={paintColor} emissiveIntensity={0.08} />
          </mesh>
        </>
      )}

      {/* ── Laser (Tracer Round) ALWAYS present in front of the model ── */}
      <mesh position={isUnit01 ? [0, -0.05, 1.4] : isUnit02 ? [0, 0.3, 1.1] : isTitan ? [0, 0.45, 1.8] : isWraith ? [0, 0.32, 1.5] : [0, 0.38, 1.6]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 1.2, 8]} />
        <meshStandardMaterial color={tracerColor} emissive={tracerColor} emissiveIntensity={4.0} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ── Glowing Pedestal ──────────────────────────────────────────────────────────

interface PedestalProps {
  glowColor: string;
  animate: boolean;
}

function Pedestal({ glowColor, animate }: PedestalProps) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!animate) return;
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.35;
    }
  });

  return (
    <group position={[0, -1.0, 0]}>
      {/* Base disc */}
      <mesh>
        <cylinderGeometry args={[1.1, 1.3, 0.12, 48]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.95} roughness={0.05} />
      </mesh>

      {/* Glow ring */}
      <mesh ref={ringRef} position={[0, 0.07, 0]}>
        <torusGeometry args={[1.05, 0.035, 8, 60]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ── Scene Lighting ────────────────────────────────────────────────────────────

interface SceneLightsProps {
  color: string;
  highQuality: boolean;
}

function SceneLights({ color, highQuality }: SceneLightsProps) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 3]} intensity={highQuality ? 1.2 : 0.9} />
      <pointLight position={[0, 1.5, 2]} color={color} intensity={2.5} distance={6} />
      {highQuality && <pointLight position={[-2, 0, -1]} color={color} intensity={1.0} distance={5} />}
    </>
  );
}

// ── Public Component ──────────────────────────────────────────────────────────

interface RobotShowroomProps {
  chassisId: string;
  paintColor: string;
  tracerColor: string;
  quality?: "low" | "medium" | "high";
}

export function RobotShowroom({ chassisId, paintColor, tracerColor, quality = "medium" }: RobotShowroomProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const highQuality = quality === "high";
  const animate = !prefersReducedMotion && quality !== "low";
  const dpr = useMemo<[number, number]>(() => {
    if (quality === "low") return [1, 1];
    if (quality === "high") return [1, 2];
    return [1, 1.5];
  }, [quality]);

  return (
    <Canvas
      frameloop={animate ? "always" : "demand"}
      dpr={dpr}
      gl={{ antialias: quality !== "low", alpha: true, powerPreference: quality === "low" ? "low-power" : "high-performance" }}
      camera={{ position: [0, 0.8, 3.8], fov: 45 }}
      style={{ background: "transparent" }}
    >
      <SceneLights color={paintColor} highQuality={highQuality} />
      {quality !== "low" && <Environment preset="city" />}
      <RobotMesh chassisId={chassisId} paintColor={paintColor} tracerColor={tracerColor} animate={animate} />
      <Pedestal glowColor={paintColor} animate={animate} />
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.8}
        autoRotate={false}
      />
    </Canvas>
  );
}
