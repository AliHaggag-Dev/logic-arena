import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Group,
  Mesh,
  AdditiveBlending,
  FrontSide,
  BackSide,
  ShaderMaterial,
} from "three";
import { IS_MOBILE } from "./constants";
import { usePlanetAudio } from "./usePlanetAudio";
import {
  EARTH_POSITION,
  EARTH_SCALE,
  EARTH_ROTATION_SPEED,
  EARTH_AXIAL_TILT,
  CLOUD_ROTATION_SPEED,
  CLOUD_UPPER_ROTATION_SPEED,
  MOON_ORBIT_RADIUS,
  MOON_ORBIT_SPEED,
  MOON_SCALE,
  MOON_SELF_ROTATION_SPEED,
  MOON_ORBIT_INCLINATION,
  SPHERE_SEGMENTS,
  SUN_DIR,
} from "./earth/constants";
import {
  EARTH_VERT,
  EARTH_FRAG,
  ATMO_OUTER_VERT,
  ATMO_OUTER_FRAG,
  CLOUD_VERT,
  CLOUD_FRAG,
  MOON_VERT,
  MOON_FRAG,
} from "./earth/shaders";
import { createEarthTextures } from "./earth/earthTextures";
import { createEarthCloudTexture } from "./earth/cloudTextures";
import { createLunarTextures } from "./earth/lunarTextures";
import {
  HyperEarthProps,
  EarthUniforms,
  AtmoUniforms,
  CloudUniforms,
  MoonUniforms,
} from "./earth/types";

// ---------------------------------------------------------------------------
// HYPER-REALISTIC EARTH & MOON ORBIT SYSTEM (Modular Coordinator)
// ---------------------------------------------------------------------------
export const HyperEarth = ({ audioName = "terrestrial" }: HyperEarthProps): React.JSX.Element => {
  usePlanetAudio(EARTH_POSITION, EARTH_SCALE, audioName);

  const planetRef = useRef<Group>(null);
  const cloudDeckRef = useRef<Mesh>(null);
  const cirrusRef = useRef<Mesh>(null);
  const moonRef = useRef<Mesh>(null);
  const earthMatRef = useRef<ShaderMaterial>(null);
  const cloudMatRef = useRef<ShaderMaterial>(null);
  const cirrusMatRef = useRef<ShaderMaterial>(null);

  // ─── Procedural textures (generated once, memoized) ───
  const earthTextures = useMemo(() => createEarthTextures(), []);
  const cloudDeckTexture = useMemo(() => createEarthCloudTexture(false), []);
  const cirrusTexture = useMemo(() => createEarthCloudTexture(true), []);
  const moonTextures = useMemo(() => createLunarTextures(), []);

  // ─── GPU Texture Disposal on Unmount (Zero Memory Leaks) ───
  useEffect(() => {
    return () => {
      earthTextures.dayMap.dispose();
      earthTextures.bumpMap.dispose();
      earthTextures.oceanMask.dispose();
      earthTextures.nightMap.dispose();
      cloudDeckTexture.dispose();
      cirrusTexture.dispose();
      moonTextures.map.dispose();
      moonTextures.bumpMap.dispose();
    };
  }, [earthTextures, cloudDeckTexture, cirrusTexture, moonTextures]);

  // ─── Uniforms (Stable references) ───
  const earthUniforms: EarthUniforms = useMemo(() => ({
    dayMap: { value: earthTextures.dayMap },
    nightMap: { value: earthTextures.nightMap },
    oceanMask: { value: earthTextures.oceanMask },
    cloudMap: { value: cloudDeckTexture },
    sunDirection: { value: SUN_DIR },
    cloudOffset: { value: 0.0 },
  }), [earthTextures, cloudDeckTexture]);

  const atmoUniforms: AtmoUniforms = useMemo(() => ({
    sunDirection: { value: SUN_DIR },
  }), []);

  const cloudDeckUniforms: CloudUniforms = useMemo(() => ({
    cloudMap: { value: cloudDeckTexture },
    sunDirection: { value: SUN_DIR },
    cloudAlphaMul: { value: 0.92 },
  }), [cloudDeckTexture]);

  const cirrusUniforms: CloudUniforms = useMemo(() => ({
    cloudMap: { value: cirrusTexture },
    sunDirection: { value: SUN_DIR },
    cloudAlphaMul: { value: 0.55 },
  }), [cirrusTexture]);

  const moonUniforms: MoonUniforms = useMemo(() => ({
    moonMap: { value: moonTextures.map },
    sunDirection: { value: SUN_DIR },
  }), [moonTextures]);

  // ─── 60 FPS Game Loop (pure useRef, zero state re-renders) ───
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Rotate Earth on its tilted polar axis
    if (planetRef.current) {
      planetRef.current.rotation.y += EARTH_ROTATION_SPEED * delta;
    }

    // Drift cloud deck and cirrus filaments differentially
    if (cloudDeckRef.current) {
      cloudDeckRef.current.rotation.y += CLOUD_ROTATION_SPEED * delta;
      if (earthMatRef.current) {
        earthMatRef.current.uniforms.cloudOffset.value = cloudDeckRef.current.rotation.y / (Math.PI * 2);
      }
    }
    if (cirrusRef.current) {
      cirrusRef.current.rotation.y += CLOUD_UPPER_ROTATION_SPEED * delta;
    }

    // Orbit the Moon with 5.1° inclination
    if (moonRef.current) {
      const moonAngle = time * MOON_ORBIT_SPEED;
      moonRef.current.position.set(
        Math.cos(moonAngle) * MOON_ORBIT_RADIUS,
        Math.sin(moonAngle) * MOON_ORBIT_INCLINATION * MOON_ORBIT_RADIUS,
        Math.sin(moonAngle) * MOON_ORBIT_RADIUS
      );
      moonRef.current.rotation.y += MOON_SELF_ROTATION_SPEED * delta;
    }
  });

  return (
    <group position={EARTH_POSITION} scale={EARTH_SCALE}>
      {/* ═══ Tilted Earth Body (23.5° Axial Tilt) ═══ */}
      <group ref={planetRef} rotation={[EARTH_AXIAL_TILT, 0, 0]}>
        {/* 1. Photorealistic Earth Surface (Custom GLSL Shader) */}
        <mesh>
          <sphereGeometry args={[1, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
          <shaderMaterial
            ref={earthMatRef}
            vertexShader={EARTH_VERT}
            fragmentShader={EARTH_FRAG}
            uniforms={earthUniforms}
            side={FrontSide}
          />
        </mesh>

        {/* 2. Lower Dense Cloud Deck (Cyclones & ITCZ) */}
        <mesh scale={1.008} ref={cloudDeckRef}>
          <sphereGeometry args={[1, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
          <shaderMaterial
            ref={cloudMatRef}
            vertexShader={CLOUD_VERT}
            fragmentShader={CLOUD_FRAG}
            uniforms={cloudDeckUniforms}
            transparent
            depthWrite={false}
            side={FrontSide}
          />
        </mesh>

        {/* 3. Upper High-Altitude Cirrus Filament Layer */}
        <mesh scale={1.015} ref={cirrusRef}>
          <sphereGeometry args={[1, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
          <shaderMaterial
            ref={cirrusMatRef}
            vertexShader={CLOUD_VERT}
            fragmentShader={CLOUD_FRAG}
            uniforms={cirrusUniforms}
            transparent
            depthWrite={false}
            side={FrontSide}
          />
        </mesh>
      </group>

      {/* ═══ 4. Authentic Rayleigh Atmosphere Glow Shell (tight limb, BackSide) ═══ */}
      <mesh scale={1.022}>
        <sphereGeometry args={[1, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
        <shaderMaterial
          vertexShader={ATMO_OUTER_VERT}
          fragmentShader={ATMO_OUTER_FRAG}
          uniforms={atmoUniforms}
          transparent
          depthWrite={false}
          side={BackSide}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* ═══ 5. Orbiting High-Definition Moon ═══ */}
      <mesh ref={moonRef} scale={MOON_SCALE}>
        <sphereGeometry args={[1, IS_MOBILE ? 32 : 48, IS_MOBILE ? 32 : 48]} />
        <shaderMaterial
          vertexShader={MOON_VERT}
          fragmentShader={MOON_FRAG}
          uniforms={moonUniforms}
          side={FrontSide}
        />
      </mesh>
    </group>
  );
};

export default HyperEarth;
