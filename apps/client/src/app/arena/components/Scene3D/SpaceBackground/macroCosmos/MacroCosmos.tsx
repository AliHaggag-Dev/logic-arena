import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import {
  ZOOM_FADE_START,
  ZOOM_FADE_END,
  ZOOM_VISIBILITY_THRESHOLD,
  getMacroCosmosPalette,
} from "./constants";
import { MacroCosmosProps, MacroUniforms } from "./types";
import { InterstellarComet } from "./InterstellarComet";
import { GlobularCluster } from "./GlobularCluster";
import { EinsteinRing } from "./EinsteinRing";
import { MacroStarfield } from "./MacroStarfield";

export const MacroCosmos: React.FC<MacroCosmosProps> = ({
  mapTheme,
  graphicsQuality = "medium",
}) => {
  const groupRef = useRef<Group>(null);

  // Theme-derived astrophysical color palette
  const palette = useMemo(() => getMacroCosmosPalette(mapTheme), [mapTheme]);

  // Shared GPU uniforms (pure useRef, zero React state re-renders at 60 FPS)
  const uniforms = useMemo<MacroUniforms>(() => {
    return {
      uZoom: { value: 0.0 },
      uTime: { value: 0.0 },
    };
  }, []);

  // 60 FPS Dynamic Camera Zoom Distance Sensor
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    uniforms.uTime.value = time;

    // Measure distance of the active camera from the arena origin
    const cameraDist = state.camera.position.length();

    // Smoothstep interpolation between match range and macro cosmic zoom
    const rawT = Math.min(
      1.0,
      Math.max(0.0, (cameraDist - ZOOM_FADE_START) / (ZOOM_FADE_END - ZOOM_FADE_START))
    );
    // Cubic smoothstep curve for cinematic fade-in
    const smoothFactor = rawT * rawT * (3.0 - 2.0 * rawT);

    uniforms.uZoom.value = smoothFactor;

    // Hard visibility culling: if camera is inside tactical play area, completely hide the group
    if (groupRef.current) {
      const isVisible = smoothFactor > ZOOM_VISIBILITY_THRESHOLD;
      if (groupRef.current.visible !== isVisible) {
        groupRef.current.visible = isVisible;
      }
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* ☄️ 1. Great Interstellar Comet with Sweeping Ion Tail */}
      <InterstellarComet palette={palette} uniforms={uniforms} />

      {/* 🌟 2. Ancient Globular Star Cluster M13 (Plummer Potential, Population II) */}
      <GlobularCluster uniforms={uniforms} />

      {/* 🌀 3. Gravitational Lensing Einstein Ring (Cosmic Horseshoe LRG 3-757) */}
      <EinsteinRing uniforms={uniforms} />

      {/* ✨ 4. Deep-Space Apparent Magnitude Star Diversity Layer */}
      <MacroStarfield uniforms={uniforms} graphicsQuality={graphicsQuality} />
    </group>
  );
};

export default MacroCosmos;
