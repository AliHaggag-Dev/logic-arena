"use client";

import { Suspense } from "react";
import { MapTheme } from "../../types";
import { Environment } from "@react-three/drei";

const FILL_LIGHT_COLORS: Record<MapTheme, string> = {
  CYBER: "#ffffff",
  LAVA: "#ff7a1a",
  ICE: "#7dd3fc",
};

/**
 * Configures the lighting for the 3D scene.
 * Includes a shadow-casting DirectionalLight so meshes with castShadow/receiveShadow
 * actually produce shadows (previously no light had castShadow={true}).
 */
export const SceneLighting = ({ mapTheme }: { mapTheme: MapTheme }) => {
  return (
    <>
      <ambientLight intensity={0.85} />
      <Suspense fallback={null}>
        <Environment preset="night" background={false} />
      </Suspense>
      <pointLight position={[10, 10, 10]} intensity={1.6} color={FILL_LIGHT_COLORS[mapTheme]} />
      <directionalLight
        position={[5, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
    </>
  );
};
