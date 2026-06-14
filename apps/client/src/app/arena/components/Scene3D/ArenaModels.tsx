'use client';
import React, { useMemo, MutableRefObject, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  GameState, RobotState, ObstacleState,
  FiredTracer, SpeechBubbleState,
} from '../../types';
import { Group, Material, Mesh, Object3D } from 'three';
import { useThree } from '@react-three/fiber';
import { useSceneAnimation } from '../../hooks/useSceneAnimation';
import { RobotModel, PreloadArenaModels } from './models/RobotModelLoaders';
import { RobotErrorBoundary, FallbackRobot } from './models/RobotModel';
import { ObstaclesInstanced } from './models/ObstacleModel';
import { LaserModel } from './models/ProjectileModel';
import { LaserBeam } from './models/LaserBeam';
import { HitParticles } from './effects/HitBurstEffect';
import { BoundaryLine } from './models/BoundaryLine';
import { FovCone } from './models/FovCone';
import { StasisEffect } from './effects/StasisEffect';
import { TrainingDummy } from '../TrainingMode/TrainingDummy';
import { KothZone } from './models/KothZone';
import { CtfFlagModel } from './models/CtfFlag';
import { CtfBase } from './models/CtfBase';
import { ModeData, CtfFlag as CtfFlagType } from '../../types';
import { interpolationBuffer } from '../../core/interpolation-buffer';

/** Convert arena units (0–800, 0–600) to 3D scene units (-10→10, -7.5→7.5) */
const toSceneX = (x: number) => (x / 40) - 10;
const toSceneZ = (y: number) => (y / 40) - 7.5;

const ROBOT_FILES: Record<string, string> = {
  'unit-01': '/robots/robot.glb',
  'unit-02': '/robots/robot2.glb',
  'chassis-unit-01': '/robots/robot.glb',
  'chassis-unit-02': '/robots/robot2.glb',
  'chassis-titan': '/robots/armored-robot.glb',
  'chassis-sandman': '/robots/sandman.glb',
};

export const ArenaModels = ({
  gameStateRef,
  obstacles = [],
  firedTracer = { current: null },
  speechBubble = { current: null },
  fogEnabled = true,
  soundFx = true,
  localRobotFile,
  localRobotColor,
  displayMode,
  mapTheme,
}: {
  gameStateRef: MutableRefObject<GameState>;
  obstacles?: ObstacleState[];
  firedTracer?: MutableRefObject<FiredTracer | null>;
  speechBubble?: MutableRefObject<SpeechBubbleState | null>;
  fogEnabled?: boolean;
  soundFx?: boolean;
  localRobotFile?: string;
  localRobotColor?: string;
  displayMode?: string;
  mapTheme?: string;
}) => {
  const { scene } = useThree();
  const robotMeshesRef = useRef<Group[]>([]);
  const [, setRenderTick] = useState(0);
  const lastUpdateRef = useRef(0);

  // BUG FIX: Clear existing static meshes on unmount to prevent 3+ robot duplication on reconnect
  useEffect(() => {
    return () => {
      robotMeshesRef.current.forEach(mesh => {
        if (mesh) {
          scene.remove(mesh);
          mesh.traverse((child: Object3D) => {
            if ((child as Mesh).isMesh) {
              const m = child as Mesh;
              m.geometry?.dispose();
              if (Array.isArray(m.material)) m.material.forEach((mat: Material) => mat.dispose());
              else (m.material as Material)?.dispose();
            }
          });
        }
      });
      robotMeshesRef.current = [];


    };
  }, [scene]);

  // Throttled re-render at ~20fps (50ms) — needed so JSX picks up new gameStateRef data
  useFrame(() => {
    const now = performance.now();
    if (now - lastUpdateRef.current < 50) return;
    lastUpdateRef.current = now;
    setRenderTick(t => t + 1);
  });

  // Read interpolated state from the buffer for smooth rendering.
  // Falls back to raw gameStateRef if the buffer has no data yet (first 100ms).
  const interpolatedState = interpolationBuffer.getDelayedSnapshot();
  const liveRobots = gameStateRef.current?.robots ?? [];
  const liveProjectiles = gameStateRef.current?.projectiles ?? [];
  // Merge: use delayed state for known robots (100ms-old position = smooth interpolation),
  // but include live robots/projectiles that don't exist in the delayed snapshot yet
  // (e.g. newly spawned in survival mode) so they never vanish from the visual.
  const robots = interpolatedState?.robots
    ? liveRobots.map(live => interpolatedState.robots.find(d => d.id === live.id) ?? live)
    : liveRobots;
  const projectiles = interpolatedState?.projectiles
    ? liveProjectiles.map(live => interpolatedState.projectiles.find(d => d.id === live.id) ?? live)
    : liveProjectiles;

  const { hitBurstsRef, hitFlashMapRef, isSpotted } = useSceneAnimation(robots, firedTracer, soundFx);

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

  // Extract unique chassis IDs from the first two non-dummy robots for targeted preloading
  const [preloadUser, preloadOpponent] = useMemo(() => {
    const playerRobots = robots.filter(r => !r.id.startsWith('dummy-'));
    return [
      playerRobots[0]?.model ?? null,
      playerRobots[1]?.model ?? null,
    ];
  }, [robots]);

  return (
    <>
      <PreloadArenaModels userChassisId={preloadUser} opponentChassisId={preloadOpponent} />
      <BoundaryLine points={boundaryPoints} />
      <HitParticles burstsRef={hitBurstsRef} />

      <ObstaclesInstanced obstacles={obstacles} mapTheme={mapTheme as any} />

      {/* Mode-specific 3D elements */}
      {(() => {
        const modeData = gameStateRef.current?.modeData;
        if (!modeData) return null;
        if (modeData.type === 'KOTH') {
          return <KothZone zone={modeData.zone} />;
        }
        if (modeData.type === 'CTF') {
          return (
            <>
              {/* Team bases */}
              {Object.entries(modeData.bases).map(([team, pos]) => (
                <CtfBase
                  key={`base-${team}`}
                  position={pos}
                  teamColor={team === 'A' ? '#22d3ee' : '#e879f9'}
                />
              ))}
              {/* Flags */}
              {modeData.flags.map((flag) => {
                let carrierPos: [number, number, number] | undefined;
                if (flag.carrierId) {
                  const carrier = robots.find(r => r.id === flag.carrierId);
                  if (carrier) {
                    carrierPos = [toSceneX(carrier.position.x), 0.15, toSceneZ(carrier.position.y)];
                  }
                }
                return (
                  <CtfFlagModel
                    key={`flag-${flag.team}`}
                    flag={flag}
                    carrierPosition={carrierPos}
                  />
                );
              })}
            </>
          );
        }
        return null;
      })()}

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
                hitTimestamp={hitFlashMapRef.current.get(robot.id)} 
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
                      hitTimestamp={hitFlashMapRef.current.get(robot.id)}
                      spotted={isSpotted(robot)}
                      energy={robot.energy ?? 1000}
                      maxEnergy={robot.maxEnergy ?? 1000}
                      inStasis={robot.inStasis ?? false}
                      isShielded={robot.isShielded ?? false}
                      isCloaked={robot.isCloaked ?? false}
                      shieldHitTimestamp={robot.shieldHitTimestamp}
                      inFog={inFog}
                      fov={robot.fov}
                      fovDirection={robot.fovDirection}
                      hideHealthBar={displayMode === 'TRAINING_SOLO'}
                      modelFile={
                        robot.model ? (ROBOT_FILES[robot.model] ?? robot.model) : '/robots/robot.glb'
                      }
                      speechBubble={speechBubble?.current?.robotId === robot.id ? speechBubble.current.message : null}
                      robotId={robot.id}
                    />
                  </group>
                </RobotErrorBoundary>
              </>
            )}
          </group>
        );
      })}

      {/* Laser tracers */}
      {(() => {
        const tracer = firedTracer?.current;
        if (!tracer) return null;
        return robots.map(robot => {
          if (robot.id !== tracer.robotId) return null;
          const start: [number, number, number] = [toSceneX(robot.position.x), 0.375, toSceneZ(robot.position.y)];
          const tracerTarget =
            tracer.isPredicted && tracer.predictedPosition
              ? tracer.predictedPosition
              : tracer.targetPosition;
          const end: [number, number, number] = [toSceneX(tracerTarget.x), 0.375, toSceneZ(tracerTarget.y)];
          return <LaserBeam key={`tracer-${robot.id}`} start={start} end={end} color={robot.color} />;
        });
      })()}

      {/* Projectiles */}
      {projectiles.map(p => (
        <LaserModel
          key={p.id}
          position={[toSceneX(p.position.x), 0.375, toSceneZ(p.position.y)]}
          projectileId={p.id}
        />
      ))}
    </>
  );
};
