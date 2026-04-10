"use client";
import React, { useMemo } from "react";
import { useSceneSetup } from "../../hooks/useSceneSetup";
import { SceneLighting } from "./SceneLighting";
import { ArenaModels } from "./ArenaModels";
import { SceneOverlay } from "./SceneOverlay";
import { Scene3DComponentProps } from "../../types";
import * as THREE from "three";
import { BoundaryLine } from "./models/BoundaryLine";

/**
 * Contains the actual 3D scene content, including lighting, models, and UI overlays.
 * All R3F hooks (e.g., useFrame, useThree) should be used within this component or its children.
 */
export const SceneContent = (props: Scene3DComponentProps) => {
  const { arena } = useSceneSetup();

  const boundaryPoints = useMemo(
    () =>
      new Float32Array([
        -10,
        0,
        -7.5,
        10,
        0,
        -7.5,
        10,
        0,
        7.5,
        -10,
        0,
        7.5
      ]),
    []
  );

  return (
    <>
      <SceneLighting />
      <ArenaModels {...props} />
      <SceneOverlay speechBubble={props.speechBubble ?? null} robots={props.robots} />

      {/* Custom Grid: Scaled to match the 20x15 (800x600) Arena */}
      <gridHelper args={[20, 20, "#1a1a4a", "#0d0d2a"]} scale={[1, 1, 0.75]} position={[0, 0, 0]} />

      {/* Arena Floor - Matches Engine Bounds */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[arena.width, arena.height]} />
        <meshStandardMaterial color="#050510" roughness={0.95} metalness={0.1} />
      </mesh>

      {/* Boundary Line (Neon Cyan Rectangle) */}
      <BoundaryLine points={boundaryPoints} />
    </>
  );
};

