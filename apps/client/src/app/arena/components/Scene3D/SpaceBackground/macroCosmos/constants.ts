import { Color } from "three";
import { MapTheme } from "../../../../types";
import { MacroCosmosPalette } from "./types";

// ---------------------------------------------------------------------------
// ZOOM INTERPOLATION THRESHOLDS (Dynamic 60 FPS Camera Distance Scaling)
// ---------------------------------------------------------------------------
export const ZOOM_FADE_START = 850;
export const ZOOM_FADE_END = 1900;
export const ZOOM_VISIBILITY_THRESHOLD = 0.002;

// ---------------------------------------------------------------------------
// ASTRONOMICAL CELESTIAL POSITIONS (Deep Cosmic Distance)
// ---------------------------------------------------------------------------

// 1. Great Interstellar Comet (Sweeping icy visitor with ion tail)
export const COMET_HEAD_POSITION: [number, number, number] = [-1400, 4600, 2200];
export const COMET_TAIL_DIRECTION: [number, number, number] = [0.65, -0.55, -0.52];

// 2. Ancient Globular Star Cluster M13 (Hercules Cluster - Southeast Deep Sky)
export const GLOBULAR_CLUSTER_POSITION: [number, number, number] = [4800, -2400, 3600];
export const GLOBULAR_CLUSTER_RADIUS = 520;
export const GLOBULAR_STAR_COUNT = 3400;

// 3. Gravitational Lensing Einstein Ring (Cosmic Horseshoe LRG 3-757 - Northwest Upper Sky)
export const EINSTEIN_RING_POSITION: [number, number, number] = [-4600, 3200, -3900];
export const EINSTEIN_RING_RADIUS = 640;

// 4. JWST Deep Field 8-Spike Reference Guide Stars (Distributed across Skybox)
export interface JWSTStarConfig {
  name: string;
  position: [number, number, number];
  color: Color;
  size: number;
}

export const JWST_STAR_CONFIGS: JWSTStarConfig[] = [
  {
    name: "Alpha Orionis (Betelgeuse)",
    position: [-2800, 4400, 4200],
    color: new Color("#ff8533"), // Red supergiant warm amber/orange
    size: 520,
  },
  {
    name: "Beta Orionis (Rigel)",
    position: [-4400, -3200, 3800],
    color: new Color("#66c4ff"), // Blazing electric blue hypergiant
    size: 560,
  },
  {
    name: "Alpha Canis Majoris (Sirius)",
    position: [3900, 3400, -4200],
    color: new Color("#d6eaff"), // Diamond white-blue A-type primary
    size: 590,
  },
  {
    name: "Alpha Carinae (Canopus)",
    position: [4600, -3600, -3400],
    color: new Color("#ffe2a3"), // Luminous pearl-gold F-type supergiant
    size: 530,
  },
  {
    name: "Alpha Lyrae (Vega)",
    position: [1200, 4900, -4200],
    color: new Color("#8ad8ff"), // Crisp azure sapphire
    size: 480,
  },
];

// ---------------------------------------------------------------------------
// THEME-BASED PALETTES
// ---------------------------------------------------------------------------
export const getMacroCosmosPalette = (mapTheme: MapTheme): MacroCosmosPalette => {
  if (mapTheme === "LAVA") {
    return {
      cometCore: new Color("#fff5e6"),
      cometTail: new Color("#ff7700"),
    };
  }

  if (mapTheme === "ICE") {
    return {
      cometCore: new Color("#ffffff"),
      cometTail: new Color("#38bdf8"),
    };
  }

  // CYBER (Default)
  return {
    cometCore: new Color("#f0fdf4"),
    cometTail: new Color("#06b6d4"),
  };
};
