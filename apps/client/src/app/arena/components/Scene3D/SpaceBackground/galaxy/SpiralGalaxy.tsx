import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Group,
  ShaderMaterial,
  AdditiveBlending,
  NormalBlending,
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
  GALAXY_DUST_VERT,
  GALAXY_DUST_FRAG,
  GALAXY_HAZE_VERT,
  GALAXY_HAZE_FRAG,
} from "./shaders";
import { generateGalaxyData, generateDustData } from "./galaxyData";
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

  // 4. Interstellar dark absorption dust lane buffers
  const dustData = useMemo(
    () => generateDustData(counts.dust, palette),
    [counts.dust, palette]
  );

  // 5. Star Point Shader Material with individual scintillation
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

  // 6. Dust Lane Point Shader Material (absorptive silhouetted clouds)
  const dustMaterial = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: GALAXY_DUST_VERT,
      fragmentShader: GALAXY_DUST_FRAG,
      uniforms: {
        uSizeMultiplier: {
          value: graphicsQuality === "high" ? 1.1 : 0.9,
        },
      },
      transparent: true,
      depthWrite: false,
      blending: NormalBlending,
      vertexColors: true,
    });
  }, [graphicsQuality]);

  // 7. Continuous Gaseous Disk Nebular Shader Material
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

  const dustGeometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(dustData.positions, 3));
    geo.setAttribute("color", new BufferAttribute(dustData.colors, 3));
    geo.setAttribute("aSize", new BufferAttribute(dustData.sizes, 1));
    geo.setAttribute("aAlpha", new BufferAttribute(dustData.alphas, 1));
    return geo;
  }, [dustData]);

  // Clean up GPU buffers when dependencies change
  useEffect(() => {
    return () => {
      starGeometry.dispose();
      dustGeometry.dispose();
      starMaterial.dispose();
      dustMaterial.dispose();
      hazeMaterial.dispose();
    };
  }, [starGeometry, dustGeometry, starMaterial, dustMaterial, hazeMaterial]);

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
          {/* 🌌 Continuous Gaseous Spiral Density Disk (Diffuse Nebular Haze) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={hazeMaterial}>
            <planeGeometry args={[GALAXY_MAX_RADIUS * 2.1, GALAXY_MAX_RADIUS * 2.1, 1, 1]} />
          </mesh>

          {/* 🌑 Relativistic Supermassive Black Hole Core */}
          <GalaxyBlackHole mapTheme={mapTheme} scale={2.4} />

          {/* 🌟 Multi-Tier Stellar Populations (Bulge, Arms, Starburst Knots) */}
          <points geometry={starGeometry} material={starMaterial} />

          {/* 💨 Interstellar Absorption Dust Lanes (Dark Silhouetted Ribbons) */}
          <points geometry={dustGeometry} material={dustMaterial} renderOrder={1} />
        </group>
      </group>
    </group>
  );
};

export default SpiralGalaxy;
