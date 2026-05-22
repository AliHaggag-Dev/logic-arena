"use client";
import React from "react";
import { useSceneSetup } from "../../hooks/useSceneSetup";
import { SceneLighting } from "./SceneLighting";
import { ArenaModels } from "./ArenaModels";
import { Scene3DComponentProps } from "../../types/scene.types";
import { TrainingEnvironment } from "../TrainingMode/TrainingEnvironment";

/**
 * Contains the actual 3D scene content, including lighting, models, and UI overlays.
 * All R3F hooks (e.g., useFrame, useThree) should be used within this component or its children.
 */
export const SceneContent = (props: Scene3DComponentProps) => {
  const { arena } = useSceneSetup();

  return (
    <>
      <SceneLighting />
      <ArenaModels
        gameStateRef={props.gameStateRef}
        obstacles={props.obstacles}
        firedTracer={props.firedTracer}
        speechBubble={props.speechBubble}
        fogEnabled={props.fogEnabled}
        soundFx={props.soundFx}
        localRobotFile={props.localRobotFile}
        localRobotColor={props.localRobotColor}
        displayMode={props.displayMode}
      />

      {/* UNIFIED DYNAMIC ARENA LAYOUT */}
      {/* Custom Grid: Appearance changes dynamically based on mode */}
      <gridHelper 
        args={[
          20, 
          props.displayMode === 'TRAINING_SOLO' ? 40 : 20, 
          props.displayMode === 'TRAINING_SOLO' ? "#00ffcc" : "#1a1a4a", 
          props.displayMode === 'TRAINING_SOLO' ? "#003333" : "#0d0d2a"
        ]} 
        scale={[1, 1, 0.75]} 
        position={[0, 0.01, 0]} 
      />

      {/* Arena Floor - Matches Engine Bounds */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[arena.width, arena.height]} />
        <meshStandardMaterial 
          color={props.displayMode === 'TRAINING_SOLO' ? "#020813" : "#050510"} 
          emissive={props.displayMode === 'TRAINING_SOLO' ? "#001122" : "#000000"}
          roughness={props.displayMode === 'TRAINING_SOLO' ? 0.7 : 0.95} 
          metalness={props.displayMode === 'TRAINING_SOLO' ? 0.8 : 0.1} 
        />
      </mesh>

      {/* MODE-SPECIFIC ADDONS — BoundaryLine is rendered inside ArenaModels */}
      {props.displayMode === 'TRAINING_SOLO' && (
        <TrainingEnvironment width={arena.width} height={arena.height} />
      )}
    </>
  );
};

