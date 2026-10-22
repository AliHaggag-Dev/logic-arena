import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  Color,
  Group,
  Mesh,
  ShaderMaterial,
  Vector3,
} from "three";
import { Billboard } from "@react-three/drei";
import { GlowingDisk } from "../GlowingDisk";
import { usePlanetAudio } from "../usePlanetAudio";
import { IS_MOBILE } from "../constants";
import {
  INNER_MOON,
  OUTER_MOON,
  PLANET_AXIAL_TILT,
  PLANET_ROTATION_PERIOD,
} from "./physics";
import {
  ATMOSPHERE_FRAG,
  ATMOSPHERE_VERT,
  LAVA_PLANET_FRAG,
  LAVA_PLANET_VERT,
} from "./shaders";
import { LavaWorldProps } from "./types";
import { VolcanicMoon } from "./VolcanicMoon";

const SPHERE_SEGMENTS = IS_MOBILE ? 48 : 64;

// Celestial star direction in world coordinates (illuminates lit hemispheres)
const STAR_DIRECTION = new Vector3(0.6, 0.3, -0.7).normalize();

export const LavaWorldSystem: React.FC<LavaWorldProps> = ({
  pos,
  scale,
  audioName,
}) => {
  const systemGroupRef = useRef<Group>(null);
  const planetGroupRef = useRef<Group>(null);
  const innerMoonGroupRef = useRef<Group>(null);
  const outerMoonGroupRef = useRef<Group>(null);

  // Planet audio integration
  usePlanetAudio(pos, scale, audioName);

  // Reusable Vector3 instances
  const innerMoonPos = useMemo(() => new Vector3(), []);
  const outerMoonPos = useMemo(() => new Vector3(), []);
  const planetWorldPos = useMemo(() => new Vector3(...pos), [pos]);

  // Planet surface shader material
  const planetMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: LAVA_PLANET_VERT,
      fragmentShader: LAVA_PLANET_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uRotationAngle: { value: 0 },
        uPrimaryMagma: { value: new Color("#cc1100") },
        uSecondaryMagma: { value: new Color("#ffaa00") },
        uCrustColor: { value: new Color("#0a0605") },
        uMagmaFlowSpeed: { value: 0.35 },
        uTectonicScale: { value: 1.2 },
      },
    });
  }, []);

  // Volumetric atmosphere shader material
  const atmosphereMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: ATMOSPHERE_VERT,
      fragmentShader: ATMOSPHERE_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAtmosphereColor: { value: new Color("#ff3300") },
        uGlowIntensity: { value: 1.2 },
        uScatteringCoeff: { value: 1.2 },
        uAbsorptionCoeff: { value: 0.6 },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: BackSide,
    });
  }, []);

  // GPU resource cleanup on unmount
  useEffect(() => {
    return () => {
      planetMaterial.dispose();
      atmosphereMaterial.dispose();
    };
  }, [planetMaterial, atmosphereMaterial]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // ═══════════════════════════════════════════════════════════════════
    // 1. PLANETARY ROTATION
    // ═══════════════════════════════════════════════════════════════════
    const rotationAngle = (time / PLANET_ROTATION_PERIOD) * Math.PI * 2;
    planetMaterial.uniforms.uTime.value = time;
    planetMaterial.uniforms.uRotationAngle.value = rotationAngle;
    atmosphereMaterial.uniforms.uTime.value = time;

    if (planetGroupRef.current) {
      planetGroupRef.current.rotation.y = rotationAngle;
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. EQUATORIAL ORBITAL MECHANICS (Aligned like Earth's Moon)
    // ═══════════════════════════════════════════════════════════════════

    // Inner moon orbit (Pyralis) — orbits around the middle of the planet
    const moonAngle1 = time * 0.048 + Math.PI; // Starts on the left side
    const r1 = 2.6;
    const inc1 = 0.08; // ~4.6° equatorial inclination
    innerMoonPos.set(
      Math.cos(moonAngle1) * r1,
      Math.sin(moonAngle1) * inc1 * r1,
      Math.sin(moonAngle1) * r1
    );
    if (innerMoonGroupRef.current) {
      innerMoonGroupRef.current.position.copy(innerMoonPos);
    }

    // Outer moon orbit (Umbrix) — orbits around the middle of the planet
    const moonAngle2 = time * 0.030; // Starts on the right side
    const r2 = 3.8;
    const inc2 = -0.06; // ~-3.4° equatorial inclination
    outerMoonPos.set(
      Math.cos(moonAngle2) * r2,
      Math.sin(moonAngle2) * inc2 * r2,
      Math.sin(moonAngle2) * r2
    );
    if (outerMoonGroupRef.current) {
      outerMoonGroupRef.current.position.copy(outerMoonPos);
    }
  });

  return (
    <group position={pos} scale={scale}>
      {/* Axial tilt of the planetary system */}
      <group
        ref={systemGroupRef}
        rotation={[PLANET_AXIAL_TILT, 0, 0]}
      >
        {/* ════════════════════ LAVA PLANET ════════════════════ */}
        <group ref={planetGroupRef}>
          {/* Core planet surface (procedural GLSL) */}
          <mesh material={planetMaterial}>
            <sphereGeometry args={[1, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
          </mesh>
        </group>

        {/* Volumetric atmosphere shell */}
        <mesh material={atmosphereMaterial} scale={1.04}>
          <sphereGeometry args={[1, 32, 32]} />
        </mesh>

        {/* ════════════════════ INNER MOON: PYRALIS ════════════════════ */}
        <group ref={innerMoonGroupRef}>
          <VolcanicMoon
            definition={INNER_MOON}
            moonType={0.0}
            planetWorldPos={planetWorldPos}
            sunDirection={STAR_DIRECTION}
          />
        </group>

        {/* ════════════════════ OUTER MOON: UMBRIX ════════════════════ */}
        <group ref={outerMoonGroupRef}>
          <VolcanicMoon
            definition={OUTER_MOON}
            moonType={1.0}
            planetWorldPos={planetWorldPos}
            sunDirection={STAR_DIRECTION}
          />
        </group>
      </group>

      {/* ════════════════════ ATMOSPHERIC HALO (Billboarded) ════════════════════ */}
      <Billboard>
        <GlowingDisk
          minRadius={1.0}
          maxRadius={1.28}
          opacityMultiplier={0.30}
          colorIn={new Color("#ff4400")}
          colorOut={new Color("#000000")}
        />
      </Billboard>
    </group>
  );
};
