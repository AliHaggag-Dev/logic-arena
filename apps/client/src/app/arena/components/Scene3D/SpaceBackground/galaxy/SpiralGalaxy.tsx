import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Group,
  ShaderMaterial,
  AdditiveBlending,
  DoubleSide,
  BufferGeometry,
  BufferAttribute,
} from "three";
import { IS_MOBILE } from "../constants";
import {
  GALAXY_POSITION,
  GALAXY_ROTATION,
  GALAXY_SCALE,
  GALAXY_ROTATION_SPEED,
  GALAXY_MAX_RADIUS,
  getParticleCounts,
  getGalaxyPalette,
} from "./constants";
import {
  GALAXY_STAR_VERT,
  GALAXY_STAR_FRAG,
  GALAXY_HAZE_VERT,
  GALAXY_HAZE_FRAG,
} from "./shaders";
import { generateGalaxyData } from "./galaxyData";
import { GalaxyBlackHole } from "./GalaxyBlackHole";
import { SpiralGalaxyProps } from "./types";

export const SpiralGalaxy = ({
  mapTheme,
  graphicsQuality = "medium",
}: SpiralGalaxyProps) => {
  const diskRef = useRef<Group>(null);

  // 1. Theme-derived astrophysically tuned color palette
  const palette = useMemo(() => getGalaxyPalette(mapTheme), [mapTheme]);

  // 2. Tiered particle budgets for 60 FPS across desktop & mobile
  const counts = useMemo(
    () => getParticleCounts(graphicsQuality, IS_MOBILE),
    [graphicsQuality]
  );

  // 3. Multi-tier astronomical stellar population buffers
  const starData = useMemo(
    () => generateGalaxyData(counts.stars, palette),
    [counts.stars, palette]
  );

  // 4. Star Point Shader Material with individual scintillation
  const starMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: GALAXY_STAR_VERT,
      fragmentShader: GALAXY_STAR_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uSizeMultiplier: {
          value: graphicsQuality === "high" ? 1.05 : graphicsQuality === "low" ? 0.8 : 0.95,
        },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexColors: true,
    });
  }, [graphicsQuality]);

  // 5. Continuous Gaseous Disk Nebular Shader Material (with integrated dust absorption lanes)
  const hazeMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: GALAXY_HAZE_VERT,
      fragmentShader: GALAXY_HAZE_FRAG,
      uniforms: {
        uColorCore: { value: palette.coreHighlight },
        uColorInner: { value: palette.nebulaColorInner },
        uColorOuter: { value: palette.nebulaColorOuter },
        uTime: { value: 0 },
        uOpacity: {
          value: graphicsQuality === "low" ? 0.35 : 0.52,
        },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: DoubleSide,
    });
  }, [palette, graphicsQuality]);

  // Keep uniforms in sync with dynamic palette changes
  useEffect(() => {
    if (hazeMaterial) {
      hazeMaterial.uniforms.uColorCore.value = palette.coreHighlight;
      hazeMaterial.uniforms.uColorInner.value = palette.nebulaColorInner;
      hazeMaterial.uniforms.uColorOuter.value = palette.nebulaColorOuter;
    }
  }, [palette, hazeMaterial]);

  // Geometries with attributes
  const starGeometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(starData.positions, 3));
    geo.setAttribute("color", new BufferAttribute(starData.colors, 3));
    geo.setAttribute("aSize", new BufferAttribute(starData.sizes, 1));
    geo.setAttribute("aAlpha", new BufferAttribute(starData.alphas, 1));
    geo.setAttribute("aTwinkle", new BufferAttribute(starData.twinkles, 2));
    return geo;
  }, [starData]);

  // Clean up GPU buffers when dependencies change
  useEffect(() => {
    return () => {
      starGeometry.dispose();
      starMaterial.dispose();
      hazeMaterial.dispose();
    };
  }, [starGeometry, starMaterial, hazeMaterial]);

  // 60 FPS Animation: Majestic disk rotation in its own plane + particle scintillation
  useFrame((state, delta) => {
    const elapsedTime = state.clock.getElapsedTime();

    // Rotate inner disk around local Y-axis (normal to the galactic plane)
    if (diskRef.current) {
      diskRef.current.rotation.y += GALAXY_ROTATION_SPEED * delta;
    }

    starMaterial.uniforms.uTime.value = elapsedTime;
    hazeMaterial.uniforms.uTime.value = elapsedTime;
  });

  return (
    <group scale={GALAXY_SCALE}>
      {/* Outer Anchor: Positions galaxy in deep space and tilts disk face towards camera */}
      <group position={GALAXY_POSITION} rotation={GALAXY_ROTATION}>
        {/* Inner Spinning Disk: Pure in-plane rotation around local Y */}
        <group ref={diskRef}>
          {/* 🌌 Continuous Gaseous Spiral Density Disk (Diffuse Nebular Haze with Dust Absorption Rifts) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={hazeMaterial}>
            <planeGeometry args={[GALAXY_MAX_RADIUS * 2.1, GALAXY_MAX_RADIUS * 2.1, 1, 1]} />
          </mesh>

          {/* 🌑 Relativistic Supermassive Black Hole Core */}
          <GalaxyBlackHole mapTheme={mapTheme} scale={2.4} />

          {/* 🌟 Multi-Tier Stellar Populations (Bulge, Arms, Starburst Knots) */}
          <points geometry={starGeometry} material={starMaterial} />
        </group>
      </group>
    </group>
  );
};

export default SpiralGalaxy;
