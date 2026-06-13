"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Stars } from "@react-three/drei";
import React from "react";

const LOW_STARS = 500;
const MEDIUM_STARS = 1500;
const HIGH_STARS = 5000;

/**
 * Sets up the R3F Canvas and basic scene environment.
 */
export const SceneCanvas = ({ children, graphicsQuality = 'medium' }: { children: React.ReactNode; graphicsQuality?: string }) => {
  const dpr: [number, number] = graphicsQuality === 'low' ? [1, 1] : [1, 2];
  const starCount = graphicsQuality === 'high' ? HIGH_STARS : MEDIUM_STARS;

  return (
    <Canvas dpr={dpr} gl={{ powerPreference: "high-performance", antialias: graphicsQuality !== 'low' }}>
      <PerspectiveCamera makeDefault position={[0, 22, 14]} far={10000} />
      <OrbitControls target={[0, 0, 0]} />
      {graphicsQuality !== 'low' && (
        <Stars radius={100} depth={50} count={starCount} factor={4} saturation={0} fade speed={1} />
      )}
      {children}
    </Canvas>
  );
};

