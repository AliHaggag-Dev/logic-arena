"use client";
import React, { useMemo, MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { GameState, RobotState, ObstacleState, ProjectileState, FiredTracer, SpeechBubbleState } from "../../types";
import { useSceneAnimation } from "../../hooks/useSceneAnimation";
import { RobotModel, RobotErrorBoundary, FallbackRobot } from "./models/RobotModel";
import { ObstacleModel } from "./models/ObstacleModel";
import { LaserModel } from "./models/ProjectileModel";
import { LaserBeam } from "./models/LaserBeam";
import { SpeechBubble } from "./models/SpeechBubble";
import { HitParticles } from "./effects/HitBurstEffect";
import { BoundaryLine } from "./models/BoundaryLine";

export const ArenaModels = ({
  gameStateRef,
  obstacles = [],
  firedTracer = null,
  speechBubble = null
}: {
  gameStateRef: MutableRefObject<GameState>;
  obstacles?: ObstacleState[];
  firedTracer?: FiredTracer | null;
  speechBubble?: SpeechBubbleState | null;
}) => {
  const robots = gameStateRef.current?.robots ?? [];
  const projectiles = gameStateRef.current?.projectiles ?? [];

  const { hitBursts, setHitBursts, hitFlashMap, isSpotted } = useSceneAnimation(robots, firedTracer);

  useFrame(() => {
    const state = gameStateRef.current;
  });

  const boundaryPoints = useMemo(
    () => new Float32Array([-10, 0, -7.5, 10, 0, -7.5, 10, 0, 7.5, -10, 0, 7.5]),
    []
  );

  return (
    <>
      <BoundaryLine points={boundaryPoints} />
      <HitParticles bursts={hitBursts} setBursts={setHitBursts} />

      {obstacles.map(obs => (
        <ObstacleModel key={obs.id} obstacle={obs} />
      ))}

      {robots.map(robot => {
        const robotPosition: [number, number, number] = [
          (robot.position.x / 40) - 10,
          0.15,
          (robot.position.y / 40) - 7.5
        ];
        return (
          <RobotErrorBoundary
            key={robot.id}
            fallback={<FallbackRobot position={robotPosition} color={robot.color} />}
          >
            <RobotModel
              position={robotPosition}
              color={robot.color}
              health={robot.health}
              velocity={robot.velocity ?? { x: 0, y: 0 }}
              rotation={typeof robot.rotation === "number" ? robot.rotation : undefined}
              hitTimestamp={hitFlashMap.get(robot.id)}
              spotted={isSpotted(robot)}
            />
          </RobotErrorBoundary>
        );
      })}

      {firedTracer && robots.map(robot => {
        if (robot.id !== firedTracer.robotId) return null;
        const startPos: [number, number, number] = [(robot.position.x / 40) - 10, 0.375, (robot.position.y / 40) - 7.5];
        const endPos: [number, number, number] = [(firedTracer.targetPosition.x / 40) - 10, 0.375, (firedTracer.targetPosition.y / 40) - 7.5];
        return <LaserBeam key={`tracer-${robot.id}`} start={startPos} end={endPos} />;
      })}

      {speechBubble && robots.map(robot => {
        if (robot.id !== speechBubble.robotId) return null;
        const pos: [number, number, number] = [(robot.position.x / 40) - 10, 0.375, (robot.position.y / 40) - 7.5];
        return <SpeechBubble key={`bubble-${robot.id}`} position={pos} message={speechBubble.message} />;
      })}

      {projectiles.map(p => (
        <LaserModel key={p.id} position={[(p.position.x / 40) - 10, 0.375, (p.position.y / 40) - 7.5]} />
      ))}
    </>
  );
};