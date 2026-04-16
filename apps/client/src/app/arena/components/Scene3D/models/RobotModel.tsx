'use client';
import React, { memo, useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Html, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  RobotModelProps, HealthBarSpriteProps, FallbackRobotProps,
  RobotErrorBoundaryProps, RobotErrorBoundaryState,
} from '../../../types';
import { HIT_FLASH_DURATION } from '../sceneConstants';
import { EnergyBarSprite } from './EnergyBar';

/* ── Error boundary ─────────────────────────────────────────────────────── */

export class RobotErrorBoundary extends React.Component<RobotErrorBoundaryProps, RobotErrorBoundaryState> {
  state: RobotErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(): RobotErrorBoundaryState { return { hasError: true }; }
  componentDidCatch(): void {}
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
    c.width  = 64;
    c.height = 12;
    return c;
  }, []);

  const [texture] = useState(() => {
    const tex       = new THREE.CanvasTexture(canvas);
    tex.minFilter   = THREE.LinearFilter;
    tex.magFilter   = THREE.LinearFilter;
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

const RobotModelInner = memo((
  props: RobotModelProps & { scene: THREE.Group; scale: number }
) => {
  const {
    position, color, health, velocity, rotation, hitTimestamp, spotted,
    energy = 1000, maxEnergy = 1000, inStasis = false,
    scene, scale,
  } = props;

  const groupRef        = useRef<THREE.Group>(null);
  const targetPosition  = useRef(new THREE.Vector3(...position));
  const basePosition    = useRef(new THREE.Vector3(...position));
  const hoverOffset     = useRef(0);
  const baseColorRef    = useRef(new THREE.Color(color));
  const tempColorRef    = useRef(new THREE.Color());
  const flashWhite      = useRef(new THREE.Color('#ffffff'));
  const stasisBlue      = useRef(new THREE.Color('#4488ff'));

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const applyMat = (m: THREE.Material) => {
          const mat = (m as THREE.MeshStandardMaterial).clone();
          mat.emissive.set(color);
          mat.emissiveIntensity = 0.3;
          return mat;
        };
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map(applyMat)
          : applyMat(mesh.material);
      }
    });
    return clone;
  }, [scene]); // color is stable per robot

  const meshList = useMemo(() => {
    const list: THREE.Mesh[] = [];
    clonedScene.traverse(child => {
      if ((child as THREE.Mesh).isMesh) list.push(child as THREE.Mesh);
    });
    return list;
  }, [clonedScene]);

  useEffect(() => { hoverOffset.current = Math.random() * Math.PI * 2; }, []);
  useEffect(() => { targetPosition.current.set(...position); }, [position]);
  useEffect(() => { baseColorRef.current.set(color); }, [color]);

  const resolveRotation = (value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return null;
    return Math.abs(value) > Math.PI * 2 ? THREE.MathUtils.degToRad(value) : value;
  };

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    // Smooth position lerp
    const lerpFactor = 1 - Math.pow(0.01, delta * 10);
    basePosition.current.lerp(targetPosition.current, lerpFactor);

    // Rotation lerp
    const targetRot = resolveRotation(rotation);
    if (targetRot !== null) {
      group.rotation.y = THREE.MathUtils.lerp(
        group.rotation.y, targetRot, 1 - Math.pow(0.001, delta),
      );
    } else {
      const spd = Math.hypot(velocity.x, velocity.y);
      if (spd > 0.001) {
        const fallback = -Math.atan2(velocity.y, velocity.x);
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
    const now          = performance.now() / 1000;
    const timeSinceHit = hitTimestamp ? now - hitTimestamp : Infinity;
    const flash        = timeSinceHit < HIT_FLASH_DURATION ? 1 - timeSinceHit / HIT_FLASH_DURATION : 0;

    for (const mesh of meshList) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (!mat?.emissive) continue;
      if (flash > 0) {
        // Hit flash → white
        tempColorRef.current.copy(baseColorRef.current).lerp(flashWhite.current, flash);
        mat.emissive.copy(tempColorRef.current);
      } else if (inStasis) {
        // Stasis → faint blue tint
        tempColorRef.current.copy(baseColorRef.current).lerp(stasisBlue.current, 0.4);
        mat.emissive.copy(tempColorRef.current);
        mat.opacity = 0.7;
        mat.transparent = true;
      } else {
        mat.emissive.copy(baseColorRef.current);
        mat.opacity = 1;
        mat.transparent = false;
      }
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={scale} />
      <pointLight position={[0, 0.4, 0]}  intensity={inStasis ? 1.0 : 3.0} distance={5} color={inStasis ? '#4488ff' : color} />
      <pointLight position={[0, -0.2, 0]} intensity={1.0} distance={4} color={color} />

      {/* Spotted indicator */}
      {spotted && (
        <Html distanceFactor={10} position={[0, 1.25, 0]} center>
          <div style={{ fontSize: '14px', color: '#FF3B3B', fontWeight: 700, textShadow: '0 0 6px rgba(255,59,59,0.8)' }}>!</div>
        </Html>
      )}

      {/* HUD billboard: health + energy bars */}
      <group position={[0, 2.1, 0]}>
        <HealthBarSprite health={health} />
        <EnergyBarSprite energy={energy} maxEnergy={maxEnergy} inStasis={inStasis} />
      </group>
    </group>
  );
});
RobotModelInner.displayName = 'RobotModelInner';

/* ── GLTF wrappers ─────────────────────────────────────────────────────── */

const Bot1Model = memo((props: RobotModelProps) => {
  const { scene } = useGLTF('/robot.glb');
  return <RobotModelInner {...props} scene={scene as unknown as THREE.Group} scale={2} />;
});
Bot1Model.displayName = 'Bot1Model';

const Bot2Model = memo((props: RobotModelProps) => {
  const { scene } = useGLTF('/robot2.glb');
  return <RobotModelInner {...props} scene={scene as unknown as THREE.Group} scale={0.8} />;
});
Bot2Model.displayName = 'Bot2Model';

export const RobotModel = memo((props: RobotModelProps) => {
  const isCyan = props.color === '#e5e4e0';
  return isCyan ? <Bot1Model {...props} /> : <Bot2Model {...props} />;
});
RobotModel.displayName = 'RobotModel';

useGLTF.preload('/robot.glb');
useGLTF.preload('/robot2.glb');