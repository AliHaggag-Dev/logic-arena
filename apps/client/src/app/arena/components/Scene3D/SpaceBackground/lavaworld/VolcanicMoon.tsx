import React, { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  FrontSide,
  Mesh,
  ShaderMaterial,
  Vector3,
} from "three";
import { MOON_FRAG, MOON_VERT } from "./shaders";
import { MoonDefinition } from "./types";
import { createVolcanicMoonTexture } from "./moonTextures";

interface VolcanicMoonProps {
  definition: MoonDefinition;
  moonType: number; // 0.0 = sulfur (Pyralis), 1.0 = lunar (Umbrix)
  planetWorldPos: Vector3;
  sunDirection: Vector3;
}

export const VolcanicMoon: React.FC<VolcanicMoonProps> = ({
  definition,
  moonType,
  planetWorldPos,
  sunDirection,
}) => {
  const meshRef = useRef<Mesh>(null);
  const isVolcanic = moonType < 0.5;

  // 1. Generate photorealistic procedural textures (smooth, anti-aliased, zero confetti)
  const textures = useMemo(() => {
    return createVolcanicMoonTexture(isVolcanic ? "sulfur" : "lunar");
  }, [isVolcanic]);

  // 2. Texture disposal on unmount (zero memory leaks)
  useEffect(() => {
    return () => {
      textures.map.dispose();
      textures.bumpMap.dispose();
    };
  }, [textures]);

  // 3. Texture-based moon shader material
  const surfaceMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: MOON_VERT,
      fragmentShader: MOON_FRAG,
      uniforms: {
        uMoonMap: { value: textures.map },
        uSunDirection: { value: sunDirection },
        uPlanetWorldPos: { value: planetWorldPos.clone() },
        uPlanetLightColor: { value: new Color("#ff6611") },
        uMoonType: { value: moonType },
      },
      side: FrontSide,
    });
  }, [textures, sunDirection, planetWorldPos, moonType]);

  // 4. Shader material disposal on unmount
  useEffect(() => {
    return () => {
      surfaceMaterial.dispose();
    };
  }, [surfaceMaterial]);

  useFrame((_, delta) => {
    surfaceMaterial.uniforms.uPlanetWorldPos.value.copy(planetWorldPos);

    // Subtle self-rotation of the moon
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.04 * delta;
    }
  });

  return (
    <mesh
      ref={meshRef}
      scale={definition.radius}
      material={surfaceMaterial}
    >
      <sphereGeometry args={[1, 48, 48]} />
    </mesh>
  );
};
