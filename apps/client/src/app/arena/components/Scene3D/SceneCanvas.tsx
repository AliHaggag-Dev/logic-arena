"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
// import { useSceneSetup } from "../../hooks/useSceneSetup"; // Moved inside SceneContent
import React from "react";

/**
 * Sets up the R3F Canvas and basic scene environment.
 */
export const SceneCanvas = ({ children, graphicsQuality = 'medium' }: { children: React.ReactNode; graphicsQuality?: string }) => {
  const dpr = graphicsQuality === 'low' ? [1, 1] : graphicsQuality === 'high' ? [1, 2] : [1, 1.5];

  return (
    <Canvas dpr={dpr as [number, number]} gl={{ powerPreference: "high-performance", antialias: graphicsQuality !== 'low' }}>
      <PerspectiveCamera makeDefault position={[0, 22, 14]} />
      <OrbitControls target={[0, 0, 0]} />
      {graphicsQuality !== 'low' && (
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      )}
      {children}
    </Canvas>
  );
};

