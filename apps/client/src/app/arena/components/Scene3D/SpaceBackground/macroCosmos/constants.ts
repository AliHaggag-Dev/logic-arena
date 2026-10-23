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

// 2. Great Interstellar Comet (Sweeping icy visitor with ion tail)
export const COMET_HEAD_POSITION: [number, number, number] = [-1400, 4600, 2200];
export const COMET_TAIL_DIRECTION: [number, number, number] = [0.65, -0.55, -0.52];

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
