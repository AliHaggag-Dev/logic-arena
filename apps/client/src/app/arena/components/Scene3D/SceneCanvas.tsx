"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import React from "react";

/**
 * Sets up the R3F Canvas and basic scene environment.
 */
export const SceneCanvas = ({ children, graphicsQuality = 'medium' }: { children: React.ReactNode; graphicsQuality?: string }) => {
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);
  const dpr: [number, number] = graphicsQuality === 'low'
    ? [1, 1]
    : isMobile
      ? [1, 1.5]
      : [1, 2];

  return (
    <Canvas dpr={dpr} gl={{ powerPreference: "high-performance", antialias: graphicsQuality !== 'low' }}>
      <PerspectiveCamera makeDefault position={[0, 22, 14]} far={10000} />
      <OrbitControls target={[0, 0, 0]} />
      {children}
    </Canvas>
  );
};

