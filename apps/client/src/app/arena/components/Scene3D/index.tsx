"use client";
import React, { memo } from "react";
import { SceneCanvas } from "./SceneCanvas";
import { SceneContent } from "./SceneContent";
import { Scene3DComponentProps } from "../../types/scene.types";

/**
 * Main Scene3D component that composes the 3D canvas and its content.
 */
export const Scene3D = memo((props: Scene3DComponentProps) => {
  return (
    <SceneCanvas graphicsQuality={props.graphicsQuality}>
      <SceneContent {...props} />
    </SceneCanvas>
  );
});

