"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import React, { useRef } from "react";

const FrameSignaler = (): null => {
  const signaledRef = useRef<boolean>(false);
  useFrame((): void => {
    if (!signaledRef.current) {
      signaledRef.current = true;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('scene-first-frame'));
      }
    }
  });
  return null;
};

/**
 * Sets up the R3F Canvas and basic scene environment.
 */
export const SceneCanvas = ({ children, graphicsQuality = 'medium' }: { children: React.ReactNode; graphicsQuality?: string }): React.JSX.Element => {
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
      <FrameSignaler />
      {children}
    </Canvas>
  );
};

