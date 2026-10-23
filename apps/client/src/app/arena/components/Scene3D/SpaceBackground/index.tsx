import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Group } from "three";
import { Stars } from "@react-three/drei";
import { MapTheme } from "../../../types";
import { IS_MOBILE } from "./constants";
import { ProceduralPlanetItem } from "./ProceduralPlanetItem";
import { SpiralGalaxy } from "./galaxy";
import { SpacePulsar } from "./SpacePulsar";
import { SpaceNebula } from "./SpaceNebula";
import { AbandonedSatellite, CosmicMonolith, ExplodingAsteroid } from "./EasterEggs";
import { HyperEarth } from "./HyperEarth";
import { LavaWorldSystem } from "./lavaworld";
import { MacroCosmos } from "./macroCosmos";

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
    // 2 colossal backdrop planets placed at deep cosmic distance (~7,700 - 7,850 units)
    return [
      {
        pos: [-7245, 1656, -2070] as [number, number, number],
        scale: 185,
        type: "gas" as const,
        color1: new Color("#a855f7"),
        color2: new Color("#3b82f6"),
        rotationSpeed: 0.04,
        hasRockRings: true,
      },
      {
        pos: [-1035, 1610, 7590] as [number, number, number],
        scale: 160,
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
      {planets.map((p) => (
        <ProceduralPlanetItem
          key={`bg-planet-${p.type}`}
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
  const genericPlanets = useMemo(() => {
    // Mid-ground + Foreground planets (excluding lava — rendered by LavaWorldSystem)
    return [
      // Earth + Moon are now rendered by the dedicated HyperEarth component
      // --- Foreground ---
      {
        pos: [-400, -60, -400] as [number, number, number],
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
      {/* Generic procedural planets */}
      {genericPlanets.map((p) => (
        <ProceduralPlanetItem
          key={`active-planet-${p.type}`}
          pos={p.pos}
          scale={p.scale}
          type={p.type}
          color1={p.color1}
          color2={p.color2}
          rotationSpeed={p.rotationSpeed}
          hasRings={p.hasRings}
          audioName={p.audioName}
        />
      ))}

      {/* 🌋 Hyper-Realistic Lava World System (Keplerian Orbits + Procedural GLSL) */}
      <LavaWorldSystem
        pos={[-500, 160, -500]}
        scale={24}
        audioName="lava"
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// MAIN SPACE BACKGROUND COMPONENT
// ---------------------------------------------------------------------------

export const SpaceBackground = ({ mapTheme, graphicsQuality = "medium" }: SpaceBackgroundProps) => {
  const backgroundRef = useRef<Group>(null);
  const { camera } = useThree();

  // Keep ONLY the infinite starfield centered on the camera (true skybox behavior)
  useFrame(() => {
    if (backgroundRef.current) {
      backgroundRef.current.position.copy(camera.position);
    }
  });

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
      position: [-400, 900, -1800] as [number, number, number],
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

  return (
    <>
      {/* ----------------- INFINITE PARALLAX SKYBOX LAYER (FIXED & UNREACHABLE TITANS) ----------------- */}
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

        {/* 🌌 Procedural Spiral Galaxy & Supermassive Black Hole (Deep Cosmic Skybox) */}
        <SpiralGalaxy mapTheme={mapTheme} graphicsQuality={graphicsQuality} />

        {/* 🚨 Neutron Star (Pulsar) Lighthouse (Deep Cosmic Skybox) */}
        {graphicsQuality !== "low" && (
          <group scale={3.5}>
            <SpacePulsar
              position={pulsarConfig.position}
              color={pulsarConfig.color}
              beamColor={pulsarConfig.beamColor}
            />
          </group>
        )}

        {/* 🌌 Volumetric Filament Space Nebula (Deep Cosmic Skybox) */}
        {graphicsQuality !== "low" && (
          <group scale={3.6}>
            <SpaceNebula
              position={[1300, 500, 1300]}
              mapTheme={mapTheme}
              graphicsQuality={graphicsQuality}
            />
          </group>
        )}

        {/* 🪐 Distant Colossal Backdrop Planets (Unreachable Purple Giant, Saturn-like Ringed Planet, Lava) */}
        {graphicsQuality !== "low" && (
          <BackgroundProceduralPlanets mapTheme={mapTheme} />
        )}

        {/* 🔭 Macro-Cosmic Zoom Reveal Tier (Dyson Ring, Cosmic Eye, Mothership, Warp Gate, Comet, Quantum Web) */}
        <MacroCosmos mapTheme={mapTheme} graphicsQuality={graphicsQuality} />
      </group>

      {/* ----------------- REACHABLE WORLD-SPACE EASTER EGGS ----------------- */}
      {graphicsQuality !== "low" && (
        <>
          {/* 🪐 Zoomable Active Procedural Planets */}
          <ActiveProceduralPlanets mapTheme={mapTheme} />

          {/* 🌍 Hyper-Realistic Earth + Moon */}
          <HyperEarth />

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
