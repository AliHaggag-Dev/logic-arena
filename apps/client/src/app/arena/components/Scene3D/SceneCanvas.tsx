"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
// import { useSceneSetup } from "../../hooks/useSceneSetup"; // Moved inside SceneContent
import React from "react";

/**
 * Sets up the R3F Canvas and basic scene environment.
 */
export const SceneCanvas = ({ children }: { children: React.ReactNode }) => {
  // const { arena } = useSceneSetup(); // Moved inside SceneContent

  return (
    <Canvas dpr={[1, 1.5]} gl={{ powerPreference: "high-performance" }}>
      <PerspectiveCamera makeDefault position={[0, 18, 18]} />
      <OrbitControls target={[0, 0, 0]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      {children}
    </Canvas>
  );
};

