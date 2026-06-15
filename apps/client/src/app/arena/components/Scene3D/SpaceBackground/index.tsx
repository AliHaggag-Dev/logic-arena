import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Group, AdditiveBlending } from "three";
import { Stars } from "@react-three/drei";
import { MapTheme } from "../../../types";
import { IS_MOBILE } from "./constants";
import { ProceduralPlanetItem } from "./ProceduralPlanetItem";
import { GalaxyBlackHole } from "./GalaxyBlackHole";
import { SpacePulsar } from "./SpacePulsar";
import { SpaceNebula } from "./SpaceNebula";
import { AbandonedSatellite, CosmicMonolith, ExplodingAsteroid } from "./EasterEggs";

interface SpaceBackgroundProps {
  mapTheme: MapTheme;
  graphicsQuality?: string;
}

// ---------------------------------------------------------------------------
// PROCEDURAL PLANETS DEPTH WRAPPERS
// ---------------------------------------------------------------------------

interface BackgroundProceduralPlanetsProps {
  mapTheme: MapTheme;
}

const BackgroundProceduralPlanets = ({ mapTheme }: BackgroundProceduralPlanetsProps) => {
  const planets = useMemo(() => {
    // 3 static backdrop planets
    return [
      {
        pos: [-1250, 320, -1150] as [number, number, number],
        scale: 75,
        type: "gas" as const,
        color1: new Color("#a855f7"),
        color2: new Color("#3b82f6"),
        rotationSpeed: 0.04,
        hasRockRings: true,
      },
      {
        pos: [3500, -500, 1200] as [number, number, number],
        scale: 100,
        type: "lava" as const,
        color1: new Color("#ef4444"),
        color2: new Color("#f97316"),
        rotationSpeed: -0.06,
      },
      {
        pos: [-1050, -520, 1150] as [number, number, number],
        scale: 70,
        type: "ice" as const,
        color1: new Color("#bae6fd"),
        color2: new Color("#0284c7"),
        rotationSpeed: 0.03,
        hasRings: true,
      },
    ];
  }, [mapTheme]);

  return (
    <>
      {planets.map((p, i) => (
        <ProceduralPlanetItem
          key={`bg-planet-${i}`}
          pos={p.pos}
          scale={p.scale}
          type={p.type}
          color1={p.color1}
          color2={p.color2}
          rotationSpeed={p.rotationSpeed}
          hasRings={p.hasRings}
          hasRockRings={p.hasRockRings}
        />
      ))}
    </>
  );
};

interface ActiveProceduralPlanetsProps {
  mapTheme: MapTheme;
}

const ActiveProceduralPlanets = ({ mapTheme }: ActiveProceduralPlanetsProps) => {
  const planets = useMemo(() => {
    // 2 Mid-ground (distant zoomable) + 2 Foreground (near zoomable with audio)
    return [
      // --- Mid-ground ---
      {
        pos: [-600, 200, -700] as [number, number, number],
        scale: 45,
        type: "desert" as const,
        color1: new Color("#eab308"),
        color2: new Color("#78350f"),
        rotationSpeed: 0.03,
        audioName: "desert" as const,
      },
      {
        pos: [700, -250, 500] as [number, number, number],
        scale: 40,
        type: "terrestrial" as const,
        color1: new Color("#10b981"),
        color2: new Color("#2563eb"),
        rotationSpeed: 0.05,
        hasClouds: true,
        moonsCount: 1,
        audioName: "terrestrial" as const,
      },
      // --- Foreground (closer to arena, with sound!) ---
      {
        pos: [-280, 150, -250] as [number, number, number],
        scale: 24,
        type: "lava" as const,
        color1: new Color("#f97316"),
        color2: new Color("#ff2200"),
        rotationSpeed: 0.02,
        moonsCount: 2,
        audioName: "lava" as const,
      },
      {
        pos: [420, 180, -350] as [number, number, number],
        scale: 22,
        type: "plasma" as const,
        color1: new Color("#ec4899"),
        color2: new Color("#8b5cf6"),
        rotationSpeed: 0.06,
        hasRings: true,
        audioName: "plasma" as const,
      },
    ];
  }, [mapTheme]);

  return (
    <>
      {planets.map((p, i) => (
        <ProceduralPlanetItem
          key={`active-planet-${i}`}
          pos={p.pos}
          scale={p.scale}
          type={p.type}
          color1={p.color1}
          color2={p.color2}
          rotationSpeed={p.rotationSpeed}
          hasRings={p.hasRings}
          hasClouds={p.hasClouds}
          moonsCount={p.moonsCount}
          audioName={p.audioName}
        />
      ))}
    </>
  );
};

// ---------------------------------------------------------------------------
// MAIN SPACE BACKGROUND COMPONENT
// ---------------------------------------------------------------------------

export const SpaceBackground = ({ mapTheme, graphicsQuality = "medium" }: SpaceBackgroundProps) => {
  const backgroundRef = useRef<Group>(null);
  const galaxyRef = useRef<Group>(null);
  const { camera } = useThree();

  // Keep the background centered on the camera at all times (Infinite Parallax effect)
  useFrame((_, delta) => {
    if (backgroundRef.current) {
      backgroundRef.current.position.copy(camera.position);
    }
    if (galaxyRef.current) {
      // Slowly rotate the galaxy for a living universe feel
      galaxyRef.current.rotation.y += 0.005 * delta;
    }
  });

  // Procedural Spiral Galaxy Generation
  const galaxyData = useMemo(() => {
    // Quality-based star density - increased for a lush, premium celestial cloud
    const count = IS_MOBILE
      ? (graphicsQuality === "high" ? 1800 : graphicsQuality === "low" ? 1200 : 1000)
      : (graphicsQuality === "high" ? 6000 : graphicsQuality === "low" ? 1200 : 3000);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Dynamic coloring based on active map theme
    let colorInStr = "#ff00ff"; // magenta
    let colorOutStr = "#00ffff"; // cyan

    if (mapTheme === "LAVA") {
      colorInStr = "#ff2200"; // hot red
      colorOutStr = "#ffaa00"; // bright orange
    } else if (mapTheme === "ICE") {
      colorInStr = "#ffffff"; // pure white
      colorOutStr = "#00aaff"; // deep ice blue
    }

    const colorInside = new Color(colorInStr);
    const colorOutside = new Color(colorOutStr);

    for (let i = 0; i < count; i++) {
      const randType = Math.random();

      if (randType < 0.30) {
        // 1. Central Bulge (Ellipsoid Core) - 30% of stars
        // Highly concentrated at the center, spherical/ellipsoid shape
        const r = Math.pow(Math.random(), 1.5) * 160;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        
        // Ellipsoid flattening (Y-axis is thin, X and Z are wider)
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi) * 0.45; // flattened core
        const z = r * Math.sin(phi) * Math.sin(theta);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Core is brighter, shifting towards white/yellow/cyan depending on theme
        const centerGlow = colorInside.clone().lerp(new Color("#ffffff"), 0.5 - (r / 160) * 0.4);
        
        // Subtle star temperature variation
        colors[i * 3] = Math.max(0, Math.min(1, centerGlow.r + (Math.random() - 0.5) * 0.05));
        colors[i * 3 + 1] = Math.max(0, Math.min(1, centerGlow.g + (Math.random() - 0.5) * 0.05));
        colors[i * 3 + 2] = Math.max(0, Math.min(1, centerGlow.b + (Math.random() - 0.5) * 0.05));

      } else if (randType < 0.85) {
        // 2. Spiral Arms - 55% of stars
        // Distribute radius from 80 to 920 units
        const r = 80 + Math.pow(Math.random(), 1.2) * 840;
        
        // 2 main spiral arms
        const armIndex = i % 2;
        const armAngle = (armIndex * 2 * Math.PI) / 2;
        
        // Spiral curve wrapping factor
        const spiralFactor = 0.0055;
        const spiralAngle = r * spiralFactor;

        // Arm thickness (angular spread) - wider near the core, tapering at outer edges
        // Using an average of 3 random numbers to approximate a Gaussian bell curve (central focus)
        const armSpread = ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) * 0.7;
        const angle = spiralAngle + armAngle + armSpread;

        // Add small radial offset for fluffiness and organic boundary blending
        const radialOffset = (Math.random() - 0.5) * 45;
        const finalR = Math.max(0, r + radialOffset);

        // Flatter disk at outer edges (Y thickness tapers exponentially)
        const yThickness = 28 * Math.exp(-finalR / 450);
        const y = (Math.random() - 0.5) * yThickness;

        positions[i * 3] = Math.cos(angle) * finalR;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(angle) * finalR;

        // Arm colors interpolate from inside to outside
        const mixedColor = colorInside.clone().lerp(colorOutside, finalR / 920);
        
        // Star color temperature variance
        colors[i * 3] = Math.max(0, Math.min(1, mixedColor.r + (Math.random() - 0.5) * 0.08));
        colors[i * 3 + 1] = Math.max(0, Math.min(1, mixedColor.g + (Math.random() - 0.5) * 0.08));
        colors[i * 3 + 2] = Math.max(0, Math.min(1, mixedColor.b + (Math.random() - 0.5) * 0.08));

      } else {
        // 3. Ambient Galactic Disk (Background Stars between arms) - 15% of stars
        // Uniformly distributed across the disk to make it look full and organic
        const r = Math.pow(Math.random(), 1.5) * 920;
        const angle = Math.random() * Math.PI * 2;
        
        // Vertical thickness also tapers exponentially
        const yThickness = 32 * Math.exp(-r / 350);
        const y = (Math.random() - 0.5) * yThickness;

        positions[i * 3] = Math.cos(angle) * r;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(angle) * r;

        // Ambient disk stars are slightly fainter and merge with outside color
        const mixedColor = colorInside.clone().lerp(colorOutside, r / 920).multiplyScalar(0.7);
        
        colors[i * 3] = Math.max(0, Math.min(1, mixedColor.r + (Math.random() - 0.5) * 0.05));
        colors[i * 3 + 1] = Math.max(0, Math.min(1, mixedColor.g + (Math.random() - 0.5) * 0.05));
        colors[i * 3 + 2] = Math.max(0, Math.min(1, mixedColor.b + (Math.random() - 0.5) * 0.05));
      }
    }

    return { positions, colors };
  }, [mapTheme, graphicsQuality]);

  // Dynamic Theme-based Pulsar configs
  const pulsarConfig = useMemo(() => {
    let colorStr = "#ffffff";
    let beamColorStr = "#00ffff"; // cyan

    if (mapTheme === "LAVA") {
      beamColorStr = "#ff3300"; // red
    } else if (mapTheme === "ICE") {
      beamColorStr = "#80ccff"; // light ice blue
    }

    return {
      position: [-1400, -200, 1400] as [number, number, number],
      color: new Color(colorStr),
      beamColor: new Color(beamColorStr),
    };
  }, [mapTheme]);

  const starCount = useMemo(() => {
    if (IS_MOBILE) {
      return graphicsQuality === "high" ? 2000 : graphicsQuality === "low" ? 200 : 600;
    }
    return graphicsQuality === "high" ? 5000 : graphicsQuality === "low" ? 400 : 1500;
  }, [graphicsQuality]);

  // Position of galaxy: far away and tilted
  const galaxyTransform = useMemo(() => {
    return {
      position: [1600, -500, -1600] as [number, number, number],
      rotation: [0.6, 0.4, -0.5] as [number, number, number],
    };
  }, []);

  return (
    <>
      {/* ----------------- INFINITE PARALLAX SKYBOX LAYER ----------------- */}
      <group ref={backgroundRef}>
        {/* 🌟 Infinite Parallax Starfield */}
        <Stars
          radius={350}
          depth={80}
          count={starCount}
          factor={7}
          saturation={0}
          fade
          speed={1.2}
        />

        {/* 🌌 Procedural Spiral Galaxy */}
        <group
          ref={galaxyRef}
          position={galaxyTransform.position}
          rotation={galaxyTransform.rotation}
        >
          {/* 🕳️ Scary Massive Black Hole in the center of the galaxy */}
          <GalaxyBlackHole mapTheme={mapTheme} />

          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[galaxyData.positions, 3]}
              />
              <bufferAttribute
                attach="attributes-color"
                args={[galaxyData.colors, 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              size={graphicsQuality === "high" ? 5.5 : graphicsQuality === "low" ? 3.0 : 4.5}
              sizeAttenuation={true}
              vertexColors={true}
              transparent={true}
              opacity={graphicsQuality === "low" ? 0.5 : 0.7}
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </points>
        </group>

        {/* 🚨 Neutron Star (Pulsar) Lighthouse */}
        {graphicsQuality !== "low" && (
          <SpacePulsar
            position={pulsarConfig.position}
            color={pulsarConfig.color}
            beamColor={pulsarConfig.beamColor}
          />
        )}

        {/* 🌌 Separate Volumetric Filament Space Nebula (gaseous filament detail) */}
        {graphicsQuality !== "low" && (
          <SpaceNebula
            position={[1300, 500, 1300]}
            mapTheme={mapTheme}
            graphicsQuality={graphicsQuality}
          />
        )}

        {/* 🪐 Distant Static Background Procedural Planets */}
        {graphicsQuality !== "low" && (
          <BackgroundProceduralPlanets mapTheme={mapTheme} />
        )}
      </group>

      {/* ----------------- REACHABLE WORLD-SPACE EASTER EGGS ----------------- */}
      {graphicsQuality !== "low" && (
        <>
          {/* 🪐 Zoomable Active Procedural Planets */}
          <ActiveProceduralPlanets mapTheme={mapTheme} />

          {/* 📡 Abandoned Satellite (Vanguard-IX) */}
          <AbandonedSatellite mapTheme={mapTheme} />

          {/* 🕋 Cosmic Monolith (Unknown Origin) */}
          <CosmicMonolith mapTheme={mapTheme} />

          {/* ☄️ Distant Exploding Asteroids (Drifting & Periodic Detonation) */}
          <ExplodingAsteroid startPos={[-320, -100, -350]} size={6} mapTheme={mapTheme} />
          <ExplodingAsteroid startPos={[350, 150, 280]} size={9} mapTheme={mapTheme} />
        </>
      )}
    </>
  );
};
export default SpaceBackground;
