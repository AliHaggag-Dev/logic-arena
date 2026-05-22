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

interface ArenaDummyColors {
  black: string;
  white: string;
  surfaceMuted: string;
  dummyCoreDead: string;
  dummyHealthHigh: string;
  dummyHealthMid: string;
  dummyHealthLow: string;
}

const getArenaCssVar = (name: string): string => (
  getComputedStyle(document.documentElement).getPropertyValue(name).trim()
);

const readArenaDummyColors = (): ArenaDummyColors => ({
  black: getArenaCssVar("--arena-black"),
  white: getArenaCssVar("--arena-white"),
  surfaceMuted: getArenaCssVar("--arena-surface-muted"),
  dummyCoreDead: getArenaCssVar("--arena-dummy-core-dead"),
  dummyHealthHigh: getArenaCssVar("--arena-dummy-health-high"),
  dummyHealthMid: getArenaCssVar("--arena-dummy-health-mid"),
  dummyHealthLow: getArenaCssVar("--arena-dummy-health-low"),
});

/** Canvas-texture health bar — no energy bar for dummies */
const DummyHealthBar = ({ health }: { health: number }) => {
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 10;
    return c;
  }, []);

  const [texture] = useState(() => {
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    return tex;
  });
  const textureRef = useRef(texture);
  const colors = useMemo(readArenaDummyColors, []);

  useEffect(() => () => { texture.dispose(); }, [texture]);

  useEffect(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(${getArenaCssVar("--arena-black-rgb")},0.75)`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = colors.surfaceMuted;
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
    const ratio = Math.max(0, Math.min(1, health / 100));
    ctx.fillStyle = health > 50 ? colors.dummyHealthHigh : health > 25 ? colors.dummyHealthMid : colors.dummyHealthLow;
    ctx.fillRect(1, 1, (canvas.width - 2) * ratio, canvas.height - 2);
    textureRef.current.needsUpdate = true;
  }, [canvas, colors, health]);

  return (
    <sprite scale={[0.8, 0.10, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
};

export const TrainingDummy = ({ position, color, health, hitTimestamp }: TrainingDummyProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const coreMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  const [damageNumbers, setDamageNumbers] = useState<{ id: number; val: number; x: number; y: number }[]>([]);
  const [isRespawning, setIsRespawning] = useState(false);
  const prevHealthRef = useRef(health);

  const targetColor = useMemo(() => new THREE.Color(color), [color]);
  const colors = useMemo(readArenaDummyColors, []);

  // Handle hits and respawns
  useEffect(() => {
    if (health < prevHealthRef.current && prevHealthRef.current > 0) {
      const dmg = prevHealthRef.current - health;
      const newId = Date.now() + Math.random();
      setDamageNumbers((prev) => [
        ...prev,
        { id: newId, val: Math.round(dmg), x: (Math.random() - 0.5) * 1.2, y: Math.random() * 1.0 },
      ]);
      setTimeout(() => {
        setDamageNumbers((cur) => cur.filter((d) => d.id !== newId));
      }, 1200);

      if (coreMaterialRef.current) {
        coreMaterialRef.current.emissiveIntensity = 2.5;
        coreMaterialRef.current.color.set(colors.white);
      }
    } else if (health > prevHealthRef.current || (health === 100 && prevHealthRef.current <= 0)) {
      // Respawn animation
      setIsRespawning(true);
      setTimeout(() => setIsRespawning(false), 1200);
    }
    prevHealthRef.current = health;
  }, [colors.white, health]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 2.5) * 0.08;
      groupRef.current.rotation.y += delta * 0.6;
    }
    if (coreMaterialRef.current) {
      coreMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        coreMaterialRef.current.emissiveIntensity,
        0.4,
        0.08,
      );
      coreMaterialRef.current.color.lerp(targetColor, 0.08);
    }
  });

  const isVisible = health > 0 || isRespawning;
  if (!isVisible) return null;

  const isDead = health <= 0;

  return (
    <group position={position} ref={groupRef}>
      {/* Core diamond body */}
      <mesh castShadow receiveShadow>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial
          ref={coreMaterialRef}
          color={isDead ? colors.dummyCoreDead : color}
          emissive={isDead ? colors.black : color}
          emissiveIntensity={0.4}
          wireframe={isRespawning}
          transparent
          opacity={isDead ? 0.3 : isRespawning ? 0.5 : 1.0}
        />
      </mesh>

      {/* Outer decorative ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.45, 0.018, 16, 32]} />
        <meshBasicMaterial color={isDead ? colors.surfaceMuted : color} transparent opacity={isDead ? 0.1 : 0.4} />
      </mesh>

      {/* Second ring (perpendicular) */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[0.45, 0.018, 16, 32]} />
        <meshBasicMaterial color={colors.white} transparent opacity={isDead ? 0.05 : 0.15} />
      </mesh>

      {/* ── Health bar billboard (health only — no energy bar for dummies) */}
      {!isDead && (
        <group position={[0, 1.1, 0]}>
          <DummyHealthBar health={health} />
        </group>
      )}

      {/* Damage pop-up numbers */}
      {damageNumbers.map((dmg) => (
        <Html key={dmg.id} position={[dmg.x, dmg.y + 0.6, 0]} center>
          <div
            className="font-mono font-black text-base select-none pointer-events-none"
            style={{
              color: "var(--arena-damage)",
              textShadow: "0 0 8px var(--arena-red), 0 0 16px rgba(var(--arena-red-rgb),0.4)",
              animation: "floatUp 1.2s ease-out forwards",
            }}
          >
            -{dmg.val}
          </div>
          <style>{`
            @keyframes floatUp {
              0%   { opacity: 1; transform: translateY(0) scale(1.1); }
              60%  { opacity: 1; transform: translateY(-18px) scale(1); }
              100% { opacity: 0; transform: translateY(-28px) scale(0.85); }
            }
          `}</style>
        </Html>
      ))}
    </group>
  );
};
