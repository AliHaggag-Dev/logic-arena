"use client";
import React from "react";
import { Sparkles } from "@react-three/drei";
import { useSceneSetup } from "../../hooks/useSceneSetup";
import { SceneLighting } from "./SceneLighting";
import { ArenaModels } from "./ArenaModels";
import { Scene3DComponentProps } from "../../types/scene.types";
import { TrainingEnvironment } from "../TrainingMode/TrainingEnvironment";
import { MapTheme } from "../../types";
import { DynamicEnvironment } from "./DynamicEnvironment";
import { SpaceBackground } from "./SpaceBackground";

const THEME_GRID_COLORS: Record<MapTheme, { primary: string; secondary: string }> = {
  CYBER: { primary: "#1a1a4a", secondary: "#0d0d2a" },
  LAVA: { primary: "#ff5500", secondary: "#663000" },
  ICE: { primary: "#00ffff", secondary: "#dffcff" },
};

const THEME_FLOOR_COLORS: Record<MapTheme, { color: string; emissive: string; roughness: number; metalness: number }> = {
  CYBER: { color: "#050510", emissive: "#000000", roughness: 0.95, metalness: 0.1 },
  LAVA: { color: "#080000", emissive: "#220000", roughness: 0.85, metalness: 0.2 },
  ICE: { color: "#001133", emissive: "#001133", roughness: 0.18, metalness: 0.75 },
};

/**
 * Contains the actual 3D scene content, including lighting, models, and UI overlays.
 * All R3F hooks (e.g., useFrame, useThree) should be used within this component or its children.
 */
export const SceneContent = (props: Scene3DComponentProps) => {
  const { arena } = useSceneSetup();
  const mapTheme = (props.mapTheme as MapTheme) ?? "CYBER";
  const gridColors = THEME_GRID_COLORS[mapTheme];
  const floorColors = THEME_FLOOR_COLORS[mapTheme];


  const gridArgs = React.useMemo(() => {
    return [
      20, 
      props.displayMode === 'TRAINING_SOLO' ? 40 : 20, 
      mapTheme !== 'CYBER' ? gridColors.primary :
      props.displayMode === 'TRAINING_SOLO' ? "#00ffcc" : 
      props.displayMode === 'KING_OF_THE_HILL' ? "#92400e" :
      props.displayMode === 'CAPTURE_THE_FLAG' ? "#6b21a8" :
      props.displayMode === 'SURVIVAL' ? "#991b1b" : gridColors.primary, 
      mapTheme !== 'CYBER' ? gridColors.secondary :
      props.displayMode === 'TRAINING_SOLO' ? "#003333" : 
      props.displayMode === 'KING_OF_THE_HILL' ? "#451a03" :
      props.displayMode === 'CAPTURE_THE_FLAG' ? "#3b0764" :
      props.displayMode === 'SURVIVAL' ? "#450a0a" : gridColors.secondary
    ] as any;
  }, [props.displayMode, mapTheme, gridColors]);

  const floorGeometryArgs = React.useMemo(() => [arena.width, arena.height] as const, [arena.width, arena.height]);

  const floorProps = React.useMemo(() => ({
    color: mapTheme !== 'CYBER' ? floorColors.color : props.displayMode === 'TRAINING_SOLO' ? "#020813" : floorColors.color,
    emissive: mapTheme !== 'CYBER' ? floorColors.emissive :
      props.displayMode === 'TRAINING_SOLO' ? "#001122" : 
      props.displayMode === 'KING_OF_THE_HILL' ? "#110800" :
      props.displayMode === 'CAPTURE_THE_FLAG' ? "#0a0014" :
      props.displayMode === 'SURVIVAL' ? "#140000" : floorColors.emissive,
    roughness: mapTheme !== 'CYBER' ? floorColors.roughness : props.displayMode === 'TRAINING_SOLO' ? 0.7 : floorColors.roughness,
    metalness: mapTheme !== 'CYBER' ? floorColors.metalness : props.displayMode === 'TRAINING_SOLO' ? 0.8 : floorColors.metalness
  }), [mapTheme, props.displayMode, floorColors]);

  const backgroundMesh = React.useMemo(() => (
    <>
      <gridHelper 
        args={gridArgs} 
        scale={[1, 1, 0.75]} 
        position={[0, 0.01, 0]} 
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={floorGeometryArgs} />
        <meshStandardMaterial {...floorProps} />
      </mesh>
    </>
  ), [gridArgs, floorGeometryArgs, floorProps]);

  return (
    <>
      <SceneLighting mapTheme={mapTheme} />
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
        mapTheme={mapTheme}
      />

      {/* UNIFIED DYNAMIC ARENA LAYOUT */}
      {backgroundMesh}

      {/* MODE-SPECIFIC ADDONS — BoundaryLine is rendered inside ArenaModels */}
      {props.displayMode === 'TRAINING_SOLO' && (
        <TrainingEnvironment width={arena.width} height={arena.height} />
      )}

      {/* DYNAMIC WEATHER & BACKGROUND EFFECTS */}
      <DynamicEnvironment mapTheme={mapTheme} graphicsQuality={props.graphicsQuality} />
      <SpaceBackground mapTheme={mapTheme} graphicsQuality={props.graphicsQuality} />
    </>
  );
};

