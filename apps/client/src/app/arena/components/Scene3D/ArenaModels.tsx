'use client';
import React, { useMemo, MutableRefObject, useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  GameState, RobotState, ObstacleState,
  FiredTracer, SpeechBubbleState, HitBurst,
} from '../../types';
import { Group, Material, Mesh, Object3D } from 'three';
import { useThree } from '@react-three/fiber';
import { useSceneAnimation } from '../../hooks/useSceneAnimation';
import { RobotModel, PreloadArenaModels, CHASSIS_MODEL_PATHS } from './models/RobotModelLoaders';
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

const ROBOT_FILES: Record<string, string> = CHASSIS_MODEL_PATHS;

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
  const lastUpdateRef = useRef(0);
  // Local render-tick counter: incremented inside useFrame every 100ms to force
  // ArenaModels to re-read gameStateRef.current and the interpolation buffer.
  // Using useState (not useRef) so that React actually re-renders the component.
  const [, setRenderTick] = useState(0);

  // BUG FIX: Clear existing static meshes on unmount to prevent 3+ robot duplication on reconnect
  useEffect(() => {
    return () => {
      robotMeshesRef.current.forEach(mesh => {
        if (mesh) {
          scene.remove(mesh);
        }
      });
      robotMeshesRef.current = [];
    };
  }, [scene]);

  // Drive React re-renders from the R3F frame loop — every 100ms is enough for
  // health bars and projectile list updates (position smoothing uses useFrame directly).
  useFrame(() => {
    const now = performance.now();
    if (now - lastUpdateRef.current < 100) return;
    lastUpdateRef.current = now;
    setRenderTick(t => t + 1);
  });


  // Read interpolated state from the buffer for smooth rendering.
  // Falls back to raw gameStateRef if the buffer has no data yet (first 100ms).
  const interpolatedState = interpolationBuffer.getDelayedSnapshot();
  const liveRobots = gameStateRef.current?.robots ?? [];
  const liveProjectiles = gameStateRef.current?.projectiles ?? [];

  // Robots: use the LIVE state as the base (health, energy, inStasis, etc. are always
  // current), but overlay position/rotation from the delayed snapshot for smooth motion.
  // This ensures the health bar updates immediately while movement stays interpolated.
  const robots = interpolatedState?.robots
    ? liveRobots.map(live => {
        const delayed = interpolatedState.robots.find(d => d.id === live.id);
        if (!delayed) return live;
        return {
          ...live,                    // live health, energy, inStasis, flags
          position: delayed.position, // delayed position for smooth interpolation
          rotation: delayed.rotation, // delayed rotation for smooth interpolation
          velocity: delayed.velocity, // delayed velocity (used for animations)
          fovDirection: delayed.fovDirection ?? live.fovDirection,
        };
      })
    : liveRobots;

  // Projectiles: always prefer the live state — projectiles are fast-moving and
  // the per-instance useFrame interpolation in LaserModel handles sub-frame smoothing.
  // The delayed snapshot risks hiding newly fired projectiles or keeping dead ones alive.
  const projectiles = liveProjectiles;

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
      <RefBasedHitParticles burstsRef={hitBurstsRef} />

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
                    robotId={robot.id}
                  />
                )}

                {/* Stasis electric aura */}
                {robot.inStasis && (
                  <StasisEffect position={robotPosition} robotId={robot.id} />
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

      <RefBasedLaserBeam firedTracer={firedTracer} robots={robots} />

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

const RefBasedLaserBeam = ({
  firedTracer,
  robots,
}: {
  firedTracer: MutableRefObject<FiredTracer | null>;
  robots: RobotState[];
}) => {
  const [, setTick] = useState(0);
  const lastTracerRef = useRef<FiredTracer | null>(null);

  useFrame(() => {
    const currentTracer = firedTracer?.current;
    if (currentTracer !== lastTracerRef.current) {
      lastTracerRef.current = currentTracer;
      setTick(t => t + 1);
    }
  });

  const tracer = firedTracer?.current;
  if (!tracer) return null;

  return (
    <>
      {robots.map(robot => {
        if (robot.id !== tracer.robotId) return null;
        const start: [number, number, number] = [toSceneX(robot.position.x), 0.375, toSceneZ(robot.position.y)];
        const tracerTarget =
          tracer.isPredicted && tracer.predictedPosition
            ? tracer.predictedPosition
            : tracer.targetPosition;
        const end: [number, number, number] = [toSceneX(tracerTarget.x), 0.375, toSceneZ(tracerTarget.y)];
        return <LaserBeam key={`tracer-${robot.id}`} start={start} end={end} color={robot.color} />;
      })}
    </>
  );
};

const RefBasedHitParticles = ({
  burstsRef,
}: {
  burstsRef: MutableRefObject<HitBurst[]>;
}) => {
  const [, setTick] = useState(0);
  const lastCountRef = useRef(0);

  useFrame(() => {
    if (burstsRef.current.length !== lastCountRef.current) {
      lastCountRef.current = burstsRef.current.length;
      setTick(t => t + 1);
    }
  });

  return <HitParticles burstsRef={burstsRef} />;
};
