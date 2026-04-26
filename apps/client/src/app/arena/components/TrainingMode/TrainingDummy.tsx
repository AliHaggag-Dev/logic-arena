"use client";
import React, { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

interface TrainingDummyProps {
  position: [number, number, number];
  color: string;
  health: number;
  hitTimestamp?: number | null;
}

export const TrainingDummy = ({ position, color, health, hitTimestamp }: TrainingDummyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  const [damageNumbers, setDamageNumbers] = useState<{ id: number; val: number; x: number; y: number }[]>([]);
  const [isRespawning, setIsRespawning] = useState(false);
  const prevHealthRef = useRef(health);

  // Store color instance to avoid creating it in useFrame
  const targetColor = useMemo(() => new THREE.Color(color), [color]);

  // Handle hits and respawns
  useEffect(() => {
    if (health < prevHealthRef.current) {
      // Took damage
      const dmg = prevHealthRef.current - health;
      const newId = Date.now() + Math.random();
      
      setDamageNumbers((prev) => [
        ...prev,
        { id: newId, val: dmg, x: (Math.random() - 0.5) * 1.5, y: Math.random() * 1.5 }
      ]);
      
      // Auto-remove this specific damage number after 1 second
      setTimeout(() => {
        setDamageNumbers((current) => current.filter(d => d.id !== newId));
      }, 1000);
      
      // Hit flash
      if (coreMaterialRef.current) {
        coreMaterialRef.current.emissiveIntensity = 2.0;
        coreMaterialRef.current.color.set("#ffffff");
      }
    } else if (health > prevHealthRef.current || (health === 100 && prevHealthRef.current <= 0)) {
      // Respawned or healed
      setIsRespawning(true);
      setTimeout(() => setIsRespawning(false), 1500);
    }

    prevHealthRef.current = health;
  }, [health]);

  // (Cleanup effect removed since we handle it per-number now)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    
    // Core animation (floating & rotating)
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 3) * 0.1;
      groupRef.current.rotation.y += delta * 0.5;
    }

    // Recover from hit flash
    if (coreMaterialRef.current) {
      coreMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        coreMaterialRef.current.emissiveIntensity,
        0.5,
        0.1
      );
      coreMaterialRef.current.color.lerp(targetColor, 0.1);
    }

    // Health ring update
    if (ringMaterialRef.current) {
      ringMaterialRef.current.opacity = health > 0 ? 0.8 : 0.0;
    }
  });

  // DO NOT return null here, otherwise the respawn animation won't work 
  // because the component would unmount and lose its state.
  const isVisible = health > 0 || isRespawning;

  if (!isVisible) return null;

  return (
    <group position={position} ref={groupRef}>
      {/* Target Dummy Core (Diamond shape) */}
      <mesh castShadow receiveShadow>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          ref={coreMaterialRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          wireframe={isRespawning}
          transparent
          opacity={isRespawning ? 0.6 : 1.0}
        />
      </mesh>

      {/* Target Dummy Outer Rings */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.02, 16, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
      </mesh>
      
      {/* Health Ring indicator */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.4, 0]}>
        <ringGeometry args={[0.4, 0.45, 32, 1, 0, (health / 100) * Math.PI * 2]} />
        <meshBasicMaterial ref={ringMaterialRef} color={health > 50 ? "#00ffcc" : health > 20 ? "#ffcc00" : "#ff0055"} side={THREE.DoubleSide} />
      </mesh>

      {/* Damage Numbers (HTML overlay) */}
      {damageNumbers.map((dmg) => (
        <Html key={dmg.id} position={[dmg.x, dmg.y + 0.5, 0]} center>
          <div 
            className="font-mono text-red-500 font-bold text-lg select-none pointer-events-none animate-float-up" 
            style={{ textShadow: "0 0 5px #ff0000" }}
          >
            -{dmg.val}
          </div>
        </Html>
      ))}

    </group>
  );
};
