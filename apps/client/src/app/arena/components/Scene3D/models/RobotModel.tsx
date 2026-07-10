'use client';
import React, { memo, useRef, useEffect, useState, useMemo } from 'react';
import { AnimationClip, CanvasTexture, Color, Group, LinearFilter, Material, MathUtils, Mesh, MeshStandardMaterial, Object3D, Vector3 } from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Html, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import {
  RobotModelProps, HealthBarSpriteProps, FallbackRobotProps,
  RobotErrorBoundaryProps, RobotErrorBoundaryState, ModeData
} from '../../../types';
import { HIT_FLASH_DURATION } from '../sceneConstants';
import { EnergyBarSprite } from './EnergyBar';
import { SpeechBubble } from './SpeechBubble';
import { interpolationBuffer } from '../../../core/interpolation-buffer';
import { RobotShatterEffect } from '../effects/RobotShatterEffect';

const EMPTY_ANIMATION_CLIPS: AnimationClip[] = [];
const MOVEMENT_THRESHOLD = 0.01;
const FALLBACK_ROTATION_THRESHOLD = 0.001;
const POSITION_LERP_DECAY = 0.01;
const ROTATION_LERP_DECAY = 0.001;
const POSITION_LERP_SPEED = 10;
const HOVER_SPEED = 2;
const HOVER_AMPLITUDE = 0.05;
const MOVEMENT_TILT_RADIANS = -0.15;
const HIT_STAGGER_TILT_RADIANS = 0.2;
const HIT_STAGGER_DURATION_SECONDS = 0.2;
const PROCEDURAL_TILT_LERP_SPEED = 14;
const CLIP_FADE_SECONDS = 0.2;
const WALK_RUN_CLIP_PATTERN = /run|walk|move/i;
const IDLE_CLIP_PATTERN = /idle|stand/i;

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

export const HealthBarSprite = ({ health, displayMode }: HealthBarSpriteProps) => {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 12;
    return c;
  }, []);

  const [texture] = useState(() => {
    const tex = new CanvasTexture(canvas);
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
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
    
    // 50% Marker for Tactical Mode
    if (displayMode === 'TACTICAL') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(canvas.width / 2 - 1, 0, 2, canvas.height);
    }
    
    textureRef.current.needsUpdate = true;
  }, [canvas, health, displayMode]);

  return (
    <sprite scale={[0.8, 0.12, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
};

/* ── Inner robot model ─────────────────────────────────────────────────── */

type RobotAnimationState = 'idle' | 'moving';

interface RobotModelInnerProps extends RobotModelProps {
  scene: Group;
  animations?: AnimationClip[];
  scale?: number;
  displayMode?: string;
}

interface MatchedAnimationClips {
  idle?: string;
  moving?: string;
}

const findClipName = (
  animations: AnimationClip[],
  pattern: RegExp,
): string | undefined => animations.find((clip: AnimationClip): boolean => pattern.test(clip.name))?.name;

export const RobotModelInner = memo(({
  scene, color, position, health, velocity, rotation, hitTimestamp, spotted,
  energy = 1000, maxEnergy = 1000, inStasis = false, fovDirection,
  scale = 2, hideHealthBar = false, speechBubble, inFog = false,
  isShielded = false, isCloaked = false, animations = EMPTY_ANIMATION_CLIPS,
  displayMode, robotId
}: RobotModelInnerProps) => {
  const groupRef = useRef<Group>(null);
  const modelMotionRef = useRef<Group>(null);
  const targetPosition = useRef(new Vector3(...position));
  const basePosition = useRef(new Vector3(...position));
  const hoverOffset = useRef(0);
  const activeClipNameRef = useRef<string | null>(null);
  const flashWhite = useRef(new Color('#ffffff'));
  const stasisBlue = useRef(new Color('#4488ff'));
  const fogGray = useRef(new Color('#3a4a5c'));
  // Dirty-flag refs: only iterate meshList when these change
  const prevHitTimestampRef = useRef<number | null | undefined>(hitTimestamp);
  const prevInStasisRef = useRef(inStasis);
  const prevInFogRef = useRef(inFog);
  const prevIsCloakedRef = useRef(isCloaked);
  const SNAP_DISTANCE = 3;

  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene);
    clone.traverse(child => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        const applyMat = (m: Material) => {
          if (!m) return m;
          const mat = (m as MeshStandardMaterial).clone();

          // Skip tinting for native/default paint — preserve original GLTF materials
          const isDefaultPaint = !color
            || color.trim().toUpperCase() === 'DEFAULT'
            || color.trim().toLowerCase() === 'paint-default';

          if (!isDefaultPaint) {
            try {
              const parsedColor = new Color(color.trim());
              mat.color = parsedColor;
              // We intentionally DO NOT overwrite mat.emissive here!
              // Overwriting it destroys the original glowing textures built into the GLTF.
              // The Environment map (HDRI) handles the general illumination.
            } catch {
              mat.color = new Color('#22d3ee');
            }
          }

          // Store original emissive properties for hit flash / stasis
          mat.userData.origEmissive = mat.emissive ? mat.emissive.clone() : new Color(0x000000);
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
    const list: Mesh[] = [];
    clonedScene.traverse(child => {
      if ((child as Mesh).isMesh) list.push(child as Mesh);
    });
    return list;
  }, [clonedScene]);

  const { actions, mixer } = useAnimations(animations, modelMotionRef);

  const matchedClips = useMemo<MatchedAnimationClips>(() => ({
    idle: findClipName(animations, IDLE_CLIP_PATTERN),
    moving: findClipName(animations, WALK_RUN_CLIP_PATTERN),
  }), [animations]);

  useEffect(() => { hoverOffset.current = Math.random() * Math.PI * 2; }, []);
  useEffect(() => { targetPosition.current.set(...position); }, [position]);

  useEffect(() => {
    activeClipNameRef.current = null;

    return () => {
      mixer.stopAllAction();
      const root = modelMotionRef.current;
      if (root) mixer.uncacheRoot(root);
    };
  }, [mixer, animations]);

  // Fix 10: Dispose cloned materials on unmount to prevent GPU memory leak
  useEffect(() => {
    return () => {
      clonedScene.traverse((child: Object3D) => {
        if ((child as Mesh).isMesh) {
          const mesh = child as Mesh;
          if (mesh.material) {
            const disposeMat = (mat: Material) => {
              if (mat && typeof mat.dispose === 'function') {
                mat.dispose();
              }
            };
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(disposeMat);
            } else {
              disposeMat(mesh.material);
            }
          }
        }
      });
    };
  }, [clonedScene]);

  const resolveRotation = (value?: number): number | null => {
    if (typeof value !== 'number' || Number.isNaN(value)) return null;
    return Math.abs(value) > Math.PI * 2 ? MathUtils.degToRad(value) : value;
  };

  // Arena 2D uses X-right / Y-down. Three.js XZ plane: X-right / Z-south.
  // So 2D angle 0 (east) must map to Three.js rotation.y = π/2 (facing +X after CW turn).
  // Formula: rotation.y = Math.PI / 2 - arenaAngle
  const HALF_PI = Math.PI / 2;

  const getMeshMaterials = (mesh: Mesh): MeshStandardMaterial[] => {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    return materials.filter(
      (mat): mat is MeshStandardMaterial => mat instanceof MeshStandardMaterial,
    );
  };

  const updateSkeletalAnimation = (animationState: RobotAnimationState): void => {
    const nextClipName = animationState === 'moving' ? matchedClips.moving : matchedClips.idle;
    if (!nextClipName || activeClipNameRef.current === nextClipName) return;

    const nextAction = actions[nextClipName];
    if (!nextAction) return;

    const previousClipName = activeClipNameRef.current;
    const previousAction = previousClipName ? actions[previousClipName] : null;

    nextAction.reset().play();
    if (previousAction) {
      previousAction.crossFadeTo(nextAction, CLIP_FADE_SECONDS, true);
    } else {
      nextAction.fadeIn(CLIP_FADE_SECONDS);
    }

    activeClipNameRef.current = nextClipName;
  };

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const SCENE_SCALE = 40;
    const SCENE_OFFSET_X = 10;
    const SCENE_OFFSET_Z = 7.5;

    if (health <= 0) {
      const interp = robotId ? interpolationBuffer.getInterpolatedRobot(robotId) : null;
      if (interp) {
        targetPosition.current.set(
          (interp.position.x / SCENE_SCALE) - SCENE_OFFSET_X,
          0.15,
          (interp.position.y / SCENE_SCALE) - SCENE_OFFSET_Z,
        );
      }
      const lerpFactor = 1 - Math.pow(POSITION_LERP_DECAY, delta * POSITION_LERP_SPEED);
      if (basePosition.current.distanceTo(targetPosition.current) > SNAP_DISTANCE) {
        basePosition.current.copy(targetPosition.current);
      } else {
        basePosition.current.lerp(targetPosition.current, lerpFactor);
      }
      group.position.x = basePosition.current.x;
      group.position.y = 0.15;
      group.position.z = basePosition.current.z;
      return;
    }

    // --- INTERPOLATION BUFFER: sub-frame smooth positioning ---
    // Query the buffer ONCE per frame at native refresh rate (60/120fps)
    // for a perfectly interpolated position + rotation between two
    // confirmed server snapshots. Falls back to React props if unavailable.
    const interp = robotId ? interpolationBuffer.getInterpolatedRobot(robotId) : null;

    if (interp) {
      targetPosition.current.set(
        (interp.position.x / SCENE_SCALE) - SCENE_OFFSET_X,
        0.15,
        (interp.position.y / SCENE_SCALE) - SCENE_OFFSET_Z,
      );
    }

    // Smooth position lerp
    const lerpFactor = 1 - Math.pow(POSITION_LERP_DECAY, delta * POSITION_LERP_SPEED);
    if (basePosition.current.distanceTo(targetPosition.current) > SNAP_DISTANCE) {
      basePosition.current.copy(targetPosition.current);
    } else {
      basePosition.current.lerp(targetPosition.current, lerpFactor);
    }

    // Rotation lerp — convert 2D arena angle to Three.js Y-rotation
    // The robot BODY always follows `rotation` (tracks/movement direction).
    // `fovDirection` is handled separately by the FovCone component.
    let targetRot: number | null = null;
    const effectiveRotation = interp ? interp.rotation : rotation;
    const r = resolveRotation(effectiveRotation);
    targetRot = r !== null ? HALF_PI - r : null;

    if (targetRot !== null) {
      // Shortest path angle lerp
      let diff = targetRot - group.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      group.rotation.y += diff * (1 - Math.pow(ROTATION_LERP_DECAY, delta));
    } else {
      const spd = Math.hypot(velocity.x, velocity.y);
      if (spd > FALLBACK_ROTATION_THRESHOLD) {
        const fallback = HALF_PI - Math.atan2(velocity.y, velocity.x);
        group.rotation.y = MathUtils.lerp(
          group.rotation.y, fallback, 1 - Math.pow(ROTATION_LERP_DECAY, delta),
        );
      }
    }

    // Hover bob
    const hover = Math.sin(state.clock.elapsedTime * HOVER_SPEED + hoverOffset.current) * HOVER_AMPLITUDE;
    group.position.x = basePosition.current.x;
    group.position.y = basePosition.current.y + hover;
    group.position.z = basePosition.current.z;

    const speed = Math.hypot(velocity.x, velocity.y);
    const isMoving = speed > MOVEMENT_THRESHOLD;
    const animationState: RobotAnimationState = isMoving ? 'moving' : 'idle';
    updateSkeletalAnimation(animationState);

    if (activeClipNameRef.current) {
      mixer.update(delta);
    }

    const motionGroup = modelMotionRef.current;
    if (motionGroup) {
      const now = performance.now() / 1000;
      const timeSinceHit = hitTimestamp ? now - hitTimestamp : Infinity;
      const targetTilt = timeSinceHit < HIT_STAGGER_DURATION_SECONDS
        ? HIT_STAGGER_TILT_RADIANS
        : isMoving
          ? MOVEMENT_TILT_RADIANS
          : 0;
      const tiltLerp = 1 - Math.pow(ROTATION_LERP_DECAY, delta * PROCEDURAL_TILT_LERP_SPEED);
      motionGroup.rotation.x = MathUtils.lerp(motionGroup.rotation.x, targetTilt, tiltLerp);
    }

    // Fix 11: Dirty flag — only iterate meshes when hit/stasis/fog state actually changed
    const hitChanged = hitTimestamp !== prevHitTimestampRef.current;
    const stasisChanged = inStasis !== prevInStasisRef.current;
    const fogChanged = inFog !== prevInFogRef.current;
    const cloakChanged = isCloaked !== prevIsCloakedRef.current;
    const needsMeshUpdate = hitChanged || stasisChanged || fogChanged || cloakChanged;

    if (needsMeshUpdate) {
      prevHitTimestampRef.current = hitTimestamp;
      prevInStasisRef.current = inStasis;
      prevInFogRef.current = inFog;
      prevIsCloakedRef.current = isCloaked;

      // Hit flash / stasis / fog tint
      const now = performance.now() / 1000;
      const timeSinceHit = hitTimestamp ? now - hitTimestamp : Infinity;
      const flash = timeSinceHit < HIT_FLASH_DURATION ? 1 - timeSinceHit / HIT_FLASH_DURATION : 0;

      for (const mesh of meshList) {
        mesh.castShadow = !isCloaked;

        for (const mat of getMeshMaterials(mesh)) {
          if (flash > 0) {
            mat.emissive.copy(flashWhite.current);
            mat.emissiveIntensity = flash * 2;
            mat.opacity = isCloaked ? 0.15 : 1;
            mat.transparent = isCloaked;
          } else if (isCloaked || inFog) {
            // Fog of war / cloak: dim to near-invisible with blue-gray tint
            mat.emissive.copy(fogGray.current);
            mat.emissiveIntensity = 0.1;
            mat.opacity = 0.15;
            mat.transparent = true;
          } else if (inStasis) {
            mat.emissive.copy(stasisBlue.current);
            mat.emissiveIntensity = 0.4;
            mat.opacity = 0.7;
            mat.transparent = true;
          } else {
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
      }
    } else if (hitTimestamp) {
      // Still in the middle of a flash — keep updating opacity even without a state change
      const now = performance.now() / 1000;
      const timeSinceHit = now - hitTimestamp;
      if (timeSinceHit < HIT_FLASH_DURATION) {
        const flash = 1 - timeSinceHit / HIT_FLASH_DURATION;
        for (const mesh of meshList) {
          for (const mat of getMeshMaterials(mesh)) {
            mat.emissive.copy(flashWhite.current);
            mat.emissiveIntensity = flash * 2;
          }
        }
      } else if (prevHitTimestampRef.current !== null) {
        // Flash just expired — reset once
        prevHitTimestampRef.current = null;
        for (const mesh of meshList) {
          for (const mat of getMeshMaterials(mesh)) {
            if (mat.userData.origEmissive) mat.emissive.copy(mat.userData.origEmissive);
            else mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = mat.userData.origEmissiveIntensity ?? 1;
            mat.opacity = isCloaked ? 0.15 : 1;
            mat.transparent = isCloaked;
          }
        }
      }
    }
  });

  const isAlive = health > 0;

  return (
    <group ref={groupRef}>
      {isAlive ? (
        <>
          <group ref={modelMotionRef}>
            <primitive key={clonedScene.uuid} object={clonedScene} scale={scale} position={[0, 0, 0]} />
          </group>
          <pointLight position={[0, 0.4, 0]} intensity={inStasis ? 1.0 : 0} distance={5} color="#4488ff" />
          {isShielded && (
            <mesh>
              <sphereGeometry args={[0.5, 32, 32]} />
              <meshPhysicalMaterial
                color="#66f7ff"
                emissive="#ffd166"
                emissiveIntensity={0.55}
                clearcoat={1}
                transmission={0.9}
                transparent
                opacity={0.28}
                roughness={0.05}
                depthWrite={false}
              />
            </mesh>
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
            {!hideHealthBar && <HealthBarSprite health={health} displayMode={displayMode} />}
            <EnergyBarSprite energy={energy} maxEnergy={maxEnergy} inStasis={inStasis} />
          </group>
        </>
      ) : (
        <RobotShatterEffect color={color} />
      )}
    </group>
  );
}, (prev, next) => {
  return prev.robotId === next.robotId &&
    prev.color === next.color &&
    prev.health === next.health &&
    prev.energy === next.energy &&
    prev.maxEnergy === next.maxEnergy &&
    prev.inStasis === next.inStasis &&
    prev.hitTimestamp === next.hitTimestamp &&
    prev.spotted === next.spotted &&
    prev.isShielded === next.isShielded &&
    prev.isCloaked === next.isCloaked &&
    prev.shieldHitTimestamp === next.shieldHitTimestamp &&
    prev.inFog === next.inFog &&
    prev.fov === next.fov &&
    prev.fovDirection === next.fovDirection &&
    prev.hideHealthBar === next.hideHealthBar &&
    prev.modelFile === next.modelFile &&
    prev.speechBubble === next.speechBubble &&
    prev.displayMode === next.displayMode;
});
RobotModelInner.displayName = 'RobotModelInner';
