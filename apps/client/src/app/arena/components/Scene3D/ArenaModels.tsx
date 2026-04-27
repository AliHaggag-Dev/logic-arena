'use client';
import React, { useMemo, MutableRefObject, useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  GameState, RobotState, ObstacleState,
  FiredTracer, SpeechBubbleState,
} from '../../types';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useSceneAnimation } from '../../hooks/useSceneAnimation';
import { RobotModel, RobotErrorBoundary, FallbackRobot } from './models/RobotModel';
import { ObstaclesInstanced } from './models/ObstacleModel';
import { LaserModel } from './models/ProjectileModel';
import { LaserBeam } from './models/LaserBeam';
import { SpeechBubble } from './models/SpeechBubble';
import { HitParticles } from './effects/HitBurstEffect';
import { BoundaryLine } from './models/BoundaryLine';
import { FovCone } from './models/FovCone';
import { StasisEffect } from './effects/StasisEffect';
import { TrainingDummy } from '../TrainingMode/TrainingDummy';

/** Convert arena units (0–800, 0–600) to 3D scene units (-10→10, -7.5→7.5) */
const toSceneX = (x: number) => (x / 40) - 10;
const toSceneZ = (y: number) => (y / 40) - 7.5;

const ROBOT_FILES: Record<string, string> = {
  'unit-01': '/robot.glb',
  'unit-02': '/robot2.glb',
};

export const ArenaModels = ({
  gameStateRef,
  obstacles = [],
  firedTracer = null,
  speechBubble = null,
  fogEnabled = true,
  localRobotFile,
  localRobotColor,
  displayMode,
}: {
  gameStateRef: MutableRefObject<GameState>;
  obstacles?: ObstacleState[];
  firedTracer?: FiredTracer | null;
  speechBubble?: SpeechBubbleState | null;
  fogEnabled?: boolean;
  localRobotFile?: string;
  localRobotColor?: string;
  displayMode?: string;
}) => {
  const { scene } = useThree();
  const robotMeshesRef = useRef<THREE.Group[]>([]);
  const [renderTick, setRenderTick] = useState(0);
  const lastUpdateRef = useRef(0);

  // BUG FIX: Clear existing static meshes on unmount to prevent 3+ robot duplication on reconnect
  useEffect(() => {
    return () => {
      robotMeshesRef.current.forEach(mesh => {
        if (mesh) {
          scene.remove(mesh);
          mesh.traverse((child: any) => {
            if (child.isMesh) {
              child.geometry?.dispose();
              if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
              else child.material?.dispose();
            }
          });
        }
      });
      robotMeshesRef.current = [];


    };
  }, [scene]);

  // Throttle renders to ~20fps (50ms) — matches the server broadcast rate
  useFrame(() => {
    const now = performance.now();
    if (now - lastUpdateRef.current < 50) return;
    lastUpdateRef.current = now;
    setRenderTick(t => t + 1);
  });

  const robots = gameStateRef.current?.robots ?? [];
  const projectiles = gameStateRef.current?.projectiles ?? [];

  const { hitBursts, setHitBursts, hitFlashMap, isSpotted } = useSceneAnimation(robots, firedTracer);

  const boundaryPoints = useMemo(
    () => new Float32Array([-10, 0, -7.5, 10, 0, -7.5, 10, 0, 7.5, -10, 0, 7.5]),
    [],
  );

  // Collect all robot IDs that are visible to at least one other robot — for fog opacity
  const visibleIdSet = useMemo(() => {
    const set = new Set<string>();
    for (const robot of robots) {
      // A robot is always visible to itself
      set.add(robot.id);
      // Add robots this robot can see
      for (const id of robot.visibleRobotIds ?? []) {
        set.add(id);
      }
    }
    return set;
  }, [robots]);

  return (
    <>
      <BoundaryLine points={boundaryPoints} />
      <HitParticles bursts={hitBursts} setBursts={setHitBursts} />

      <ObstaclesInstanced obstacles={obstacles} />

      {robots.map(robot => {
        const sx = toSceneX(robot.position.x);
        const sz = toSceneZ(robot.position.y);
        const robotPosition: [number, number, number] = [sx, 0.15, sz];

        // Fog: robots not visible to anyone render at reduced opacity
        const inFog = fogEnabled && !visibleIdSet.has(robot.id);

        return (
          <group key={`rob-${robot.id}`} ref={(el) => { if (el && !robotMeshesRef.current.includes(el)) robotMeshesRef.current.push(el); }}>
            {robot.id.startsWith('dummy-') ? (
              <TrainingDummy 
                position={robotPosition} 
                color={robot.color} 
                health={robot.health} 
                hitTimestamp={hitFlashMap.get(robot.id)} 
              />
            ) : (
              <>
                {/* FOV cone — rendered when fog is on */}
                {fogEnabled && robot.fov && (
                  <FovCone
                    position={robotPosition}
                    color={robot.color}
                    fov={robot.fov}
                    fovDirection={robot.fovDirection ?? robot.rotation ?? 0}
                  />
                )}

                {/* Stasis electric aura */}
                {robot.inStasis && (
                  <StasisEffect position={robotPosition} />
                )}

                <RobotErrorBoundary
                  fallback={<FallbackRobot position={robotPosition} color={robot.color} />}
                >
                  <group>
                    <RobotModel
                      position={robotPosition}
                      color={robot.color}
                      health={robot.health}
                      velocity={robot.velocity ?? { x: 0, y: 0 }}
                      rotation={typeof robot.rotation === 'number' ? robot.rotation : undefined}
                      hitTimestamp={hitFlashMap.get(robot.id)}
                      spotted={isSpotted(robot)}
                      energy={robot.energy ?? 1000}
                      maxEnergy={robot.maxEnergy ?? 1000}
                      inStasis={robot.inStasis ?? false}
                      fov={robot.fov}
                      fovDirection={robot.fovDirection}
                      hideHealthBar={displayMode === 'TRAINING_SOLO'}
                      modelFile={
                        robot.model ? ROBOT_FILES[robot.model] ?? '/robot.glb' : '/robot.glb'
                      }
                    />
                  </group>
                </RobotErrorBoundary>
              </>
            )}
          </group>
        );
      })}

      {/* Laser tracers */}
      {firedTracer && robots.map(robot => {
        if (robot.id !== firedTracer.robotId) return null;
        const start: [number, number, number] = [toSceneX(robot.position.x), 0.375, toSceneZ(robot.position.y)];
        const end: [number, number, number] = [toSceneX(firedTracer.targetPosition.x), 0.375, toSceneZ(firedTracer.targetPosition.y)];
        return <LaserBeam key={`tracer-${robot.id}`} start={start} end={end} />;
      })}

      {/* Speech bubbles */}
      {speechBubble && robots.map(robot => {
        if (robot.id !== speechBubble.robotId) return null;
        const pos: [number, number, number] = [toSceneX(robot.position.x), 0.375, toSceneZ(robot.position.y)];
        return <SpeechBubble key={`bubble-${robot.id}`} position={pos} message={speechBubble.message} />;
      })}

      {/* Projectiles */}
      {projectiles.map(p => (
        <LaserModel
          key={p.id}
          position={[toSceneX(p.position.x), 0.375, toSceneZ(p.position.y)]}
        />
      ))}
    </>
  );
};