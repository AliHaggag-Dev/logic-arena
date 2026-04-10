"use client";
import { SceneCanvas } from "./SceneCanvas";
import { SceneContent } from "./SceneContent";
import { Scene3DComponentProps } from "../../types";

/**
 * Main Scene3D component that composes the 3D canvas and its content.
 */
export const Scene3D = (props: Scene3DComponentProps) => {
  return (
    <SceneCanvas>
      <SceneContent {...props} />
    </SceneCanvas>
  );
};

