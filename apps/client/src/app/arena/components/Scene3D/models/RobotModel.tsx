'use client';
import React, { memo, useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  RobotModelProps, HealthBarSpriteProps, FallbackRobotProps,
  RobotErrorBoundaryProps, RobotErrorBoundaryState,
} from '../../../types';
import { HIT_FLASH_DURATION } from '../sceneConstants';
import { EnergyBarSprite } from './EnergyBar';
import { SpeechBubble } from './SpeechBubble';

/* ── Error boundary ─────────────────────────────────────────────────────── */

export class RobotErrorBoundary extends React.Component<RobotErrorBoundaryProps, RobotErrorBoundaryState> {
  state: RobotErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(): RobotErrorBoundaryState { return { hasError: true }; }
  componentDidCatch(): void { }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/* ── Fallback (no GLTF) ─────────────────────────────────────────────────── */

export const FallbackRobot = ({ position, color }: FallbackRobotProps) => (
  <mesh position={position}>
    <sphereGeometry args={[0.35, 24, 24]} />
    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
  </mesh>
);

/* ── Health bar sprite ──────────────────────────────────────────────────── */

export const HealthBarSprite = ({ health }: HealthBarSpriteProps) => {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 12;
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

  useEffect(() => () => { texture.dispose(); }, [texture]);

  useEffect(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#444';
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
    const ratio = Math.max(0, Math.min(1, health / 100));
    ctx.fillStyle = health > 30 ? '#00FF00' : '#FF0000';
    ctx.fillRect(1, 1, (canvas.width - 2) * ratio, canvas.height - 2);
    textureRef.current.needsUpdate = true;
  }, [canvas, health]);

  return (
    <sprite scale={[0.8, 0.12, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
};

/* ── Inner robot model ─────────────────────────────────────────────────── */

export const RobotModelInner = memo(({
  scene, color, position, health, velocity, rotation, hitTimestamp, spotted,
  energy = 1000, maxEnergy = 1000, inStasis = false, fovDirection,
  scale = 2, hideHealthBar = false, speechBubble
}: RobotModelProps & { scene: THREE.Group; scale?: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetPosition = useRef(new THREE.Vector3(...position));
  const basePosition = useRef(new THREE.Vector3(...position));
  const hoverOffset = useRef(0);
  const flashWhite = useRef(new THREE.Color('#ffffff'));
  const stasisBlue = useRef(new THREE.Color('#4488ff'));

  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const applyMat = (m: THREE.Material) => {
          const mat = (m as THREE.MeshStandardMaterial).clone();

          // Skip tinting for native/default paint — preserve original GLTF materials
          const isDefaultPaint = !color
            || color.trim().toUpperCase() === 'DEFAULT'
            || color.trim().toLowerCase() === 'paint-default';

          if (!isDefaultPaint) {
            try {
              mat.color = new THREE.Color(color.trim());
            } catch {
              mat.color = new THREE.Color('#22d3ee');
            }
          }

          // Store original emissive properties for hit flash / stasis
          mat.userData.origEmissive = mat.emissive ? mat.emissive.clone() : new THREE.Color(0x000000);
          mat.userData.origEmissiveIntensity = mat.emissiveIntensity !== undefined ? mat.emissiveIntensity : 1;

          return mat;
        };
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map(applyMat)
          : applyMat(mesh.material);
      }
    });
    return clone;
  }, [scene, color]);

  const meshList = useMemo(() => {
    const list: THREE.Mesh[] = [];
    clonedScene.traverse(child => {
      if ((child as THREE.Mesh).isMesh) list.push(child as THREE.Mesh);
    });
    return list;
  }, [clonedScene]);

  useEffect(() => { hoverOffset.current = Math.random() * Math.PI * 2; }, []);
  useEffect(() => { targetPosition.current.set(...position); }, [position]);

  const resolveRotation = (value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return null;
    return Math.abs(value) > Math.PI * 2 ? THREE.MathUtils.degToRad(value) : value;
  };

  // Arena 2D uses X-right / Y-down. Three.js XZ plane: X-right / Z-south.
  // So 2D angle 0 (east) must map to Three.js rotation.y = π/2 (facing +X after CW turn).
  // Formula: rotation.y = Math.PI / 2 - arenaAngle
  const HALF_PI = Math.PI / 2;

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Smooth position lerp
    const lerpFactor = 1 - Math.pow(0.01, delta * 10);
    basePosition.current.lerp(targetPosition.current, lerpFactor);

    // Rotation lerp — convert 2D arena angle to Three.js Y-rotation
    // The robot BODY always follows `rotation` (tracks/movement direction).
    // `fovDirection` is handled separately by the FovCone component.
    let targetRot: number | null = null;
    const r = resolveRotation(rotation);
    targetRot = r !== null ? HALF_PI - r : null;

    if (targetRot !== null) {
      // Shortest path angle lerp
      let diff = targetRot - group.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      group.rotation.y += diff * (1 - Math.pow(0.001, delta));
    } else {
      const spd = Math.hypot(velocity.x, velocity.y);
      if (spd > 0.001) {
        const fallback = HALF_PI - Math.atan2(velocity.y, velocity.x);
        group.rotation.y = THREE.MathUtils.lerp(
          group.rotation.y, fallback, 1 - Math.pow(0.001, delta),
        );
      }
    }

    // Hover bob
    const hover = Math.sin(state.clock.elapsedTime * 2 + hoverOffset.current) * 0.05;
    group.position.x = basePosition.current.x;
    group.position.y = basePosition.current.y + hover;
    group.position.z = basePosition.current.z;

    // Hit flash / stasis tint
    const now = performance.now() / 1000;
    const timeSinceHit = hitTimestamp ? now - hitTimestamp : Infinity;
    const flash = timeSinceHit < HIT_FLASH_DURATION ? 1 - timeSinceHit / HIT_FLASH_DURATION : 0;

    for (const mesh of meshList) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat) continue;

      if (flash > 0) {
        // Hit flash → white
        mat.emissive.copy(flashWhite.current);
        mat.emissiveIntensity = flash * 2;
      } else if (inStasis) {
        // Stasis → faint blue tint
        mat.emissive.copy(stasisBlue.current);
        mat.emissiveIntensity = 0.4;
        mat.opacity = 0.7;
        mat.transparent = true;
      } else {
        // Reset to original
        if (mat.userData.origEmissive) {
          mat.emissive.copy(mat.userData.origEmissive);
        } else {
          mat.emissive.setHex(0x000000);
        }
        mat.emissiveIntensity = mat.userData.origEmissiveIntensity ?? 1;
        mat.opacity = 1;
        mat.transparent = false;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={scale} position={[0, 0, 0]} />
      {inStasis && (
        <pointLight position={[0, 0.4, 0]} intensity={1.0} distance={5} color="#4488ff" />
      )}

      {/* Spotted indicator */}
      {spotted && (
        <Html distanceFactor={10} position={[0, 1.25, 0]} center>
          <div style={{ fontSize: '14px', color: '#FF3B3B', fontWeight: 700, textShadow: '0 0 6px rgba(255,59,59,0.8)' }}>!</div>
        </Html>
      )}

      {/* Dynamic Speech Bubble tracking the robot */}
      {speechBubble && (
        <SpeechBubble position={[0, 1.25, 0]} message={speechBubble} />
      )}

      {/* HUD billboard: health + energy bars */}
      <group position={[0, 2.1, 0]}>
        {!hideHealthBar && <HealthBarSprite health={health} />}
        <EnergyBarSprite energy={energy} maxEnergy={maxEnergy} inStasis={inStasis} />
      </group>
    </group>
  );
});
RobotModelInner.displayName = 'RobotModelInner';

