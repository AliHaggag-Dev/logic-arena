import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Mesh, ShaderMaterial, Vector3 } from "three";
import { MONOLITH_DEPTH, MONOLITH_HEIGHT, MONOLITH_WIDTH } from "./physics";
import { SPACETIME_LENSING_FRAG, SPACETIME_LENSING_VERT } from "./shaders";
import { MonolithThemeColors } from "./types";

interface SpacetimeLensingProps {
  palette: MonolithThemeColors;
  observerFactor: number;
}

export const SpacetimeLensing: React.FC<SpacetimeLensingProps> = ({
  palette,
  observerFactor,
}) => {
  const meshRef = useRef<Mesh>(null);

  const lensingMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: SPACETIME_LENSING_VERT,
      fragmentShader: SPACETIME_LENSING_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uCameraPosition: { value: new Vector3() },
        uGravitationalRadius: { value: 2.8 },
        uChromaDispersion: { value: 0.16 },
        uWaveAmplitude: { value: 0.28 },
        uPrimaryGlow: { value: palette.primary },
        uSecondaryGlow: { value: palette.secondary },
        uObserverFactor: { value: 0 },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });
  }, [palette.primary, palette.secondary]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    lensingMaterial.uniforms.uTime.value = time;
    lensingMaterial.uniforms.uCameraPosition.value.copy(state.camera.position);
    lensingMaterial.uniforms.uObserverFactor.value = observerFactor;

    // Breathing metric fluctuation
    if (meshRef.current) {
      const breathing = 1.0 + Math.sin(time * 0.9) * 0.015 + observerFactor * 0.025;
      meshRef.current.scale.set(
        1.14 * breathing,
        1.08 * breathing,
        1.32 * breathing,
      );
    }
  });

  return (
    <mesh
      ref={meshRef}
      material={lensingMaterial}
    >
      <boxGeometry args={[MONOLITH_WIDTH, MONOLITH_HEIGHT, MONOLITH_DEPTH]} />
    </mesh>
  );
};
