"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import React, { useMemo, useRef } from "react";

const FrameSignaler = (): null => {
  const signaledRef = useRef<boolean>(false);
  useFrame((): void => {
    if (!signaledRef.current) {
      signaledRef.current = true;
      if (typeof window !== 'undefined') {
        const win = window as unknown as Record<string, unknown>;
        win.__SCENE_FIRST_FRAME__ = true;
        window.dispatchEvent(new CustomEvent('scene-first-frame'));
      }
    }
  });
  return null;
};

/**
 * Sets up the R3F Canvas and basic scene environment.
 * dpr and gl are memoised so R3F never sees them as "changed" and
 * never reconstructs the WebGL renderer on parent re-renders.
 */
export const SceneCanvas = ({ children, graphicsQuality = 'medium' }: { children: React.ReactNode; graphicsQuality?: string }): React.JSX.Element => {
  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent);

  const dpr = useMemo<[number, number]>(() => {
    if (graphicsQuality === 'low') return [1, 1];
    if (isMobile) return [1, 1.5];
    return [1, 2];
  }, [graphicsQuality, isMobile]);

  const glProps = useMemo(() => ({
    powerPreference: 'high-performance' as const,
    antialias: graphicsQuality !== 'low',
  }), [graphicsQuality]);

  return (
    <Canvas dpr={dpr} gl={glProps}>
      <PerspectiveCamera makeDefault position={[0, 22, 14]} far={10000} />
      <OrbitControls target={[0, 0, 0]} />
      <FrameSignaler />
      {children}
    </Canvas>
  );
};
