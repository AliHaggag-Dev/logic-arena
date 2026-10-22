import { Color } from "three";
import { MapTheme } from "../../../../types";
import { GalaxyThemePalette } from "./types";

// ---------------------------------------------------------------------------
// ASTRONOMICAL GALAXY PLACEMENT & ORIENTATION
// ---------------------------------------------------------------------------
// Position in skybox layer (unreachable titan distance)
export const GALAXY_POSITION: [number, number, number] = [-2400, -450, 1600];

// Optimal 50.2° oblique tilt towards the arena camera for maximum spiral glory
// Derived from lookAt vector [-0.823, -0.157, 0.546] with ~43° face tilt & 20° slant
export const GALAXY_ROTATION: [number, number, number] = [2.259, 0.763, -2.093];

export const GALAXY_SCALE = 2.5;
export const GALAXY_ROTATION_SPEED = 0.0035; // Majestic slow rotation

// Galaxy geometry dimensions
export const GALAXY_MAX_RADIUS = 980;
export const BULGE_RADIUS = 160;
export const CORE_BLACK_HOLE_RADIUS = 16;

// Particle density by graphics tier
export const getParticleCounts = (graphicsQuality: string, isMobile: boolean) => {
  if (isMobile) {
    if (graphicsQuality === "high") return { stars: 4500, dust: 900 };
    if (graphicsQuality === "low") return { stars: 1600, dust: 300 };
    return { stars: 3000, dust: 600 };
  }
  if (graphicsQuality === "high") return { stars: 14000, dust: 2800 };
  if (graphicsQuality === "low") return { stars: 4000, dust: 800 };
  return { stars: 8500, dust: 1700 };
};

// ---------------------------------------------------------------------------
// ASTROPHYSICAL COLOR PALETTES PER THEME
// ---------------------------------------------------------------------------
export const getGalaxyPalette = (mapTheme: MapTheme): GalaxyThemePalette => {
  if (mapTheme === "LAVA") {
    return {
      coreColor: new Color("#fff0d0"),         // Incandescent white-yellow core
      coreHighlight: new Color("#ffaa00"),     // Radiant golden bulge
      armColorInner: new Color("#ff4400"),     // Molten red-orange inner arms
      armColorOuter: new Color("#ff9933"),     // Warm amber outer arms
      starburstColor: new Color("#ffdd00"),    // Energetic plasma knots
      dustColor: new Color("#1a0500"),         // Deep obsidian-charcoal dust
      nebulaColorInner: new Color("#cc2200"),  // Volumetric core gas
      nebulaColorOuter: new Color("#ff6600"),  // Volumetric arm gas
    };
  }

  if (mapTheme === "ICE") {
    return {
      coreColor: new Color("#ffffff"),         // Brilliant diamond core
      coreHighlight: new Color("#cce8ff"),     // Soft ice-blue bulge
      armColorInner: new Color("#38bdf8"),     // Azure inner arms
      armColorOuter: new Color("#818cf8"),     // Soft violet outer arms
      starburstColor: new Color("#00ffff"),    // Cyan young star clusters
      dustColor: new Color("#020b18"),         // Deep cryogenic navy dust
      nebulaColorInner: new Color("#0ea5e9"),  // Volumetric core gas
      nebulaColorOuter: new Color("#3b82f6"),  // Volumetric arm gas
    };
  }

  // CYBER (Default) - Grand Design Spiral with realistic stellar populations:
  // Golden Population II bulge, vibrant cyan/blue Population I arms, magenta H-II starburst knots
  return {
    coreColor: new Color("#fff7e6"),         // Warm golden-white bulge stars
    coreHighlight: new Color("#ffd285"),     // Warm amber stellar concentration
    armColorInner: new Color("#67e8f9"),     // Brilliant blue-white young stars
    armColorOuter: new Color("#c084fc"),     // Majestic purple-cyan arm boundaries
    starburstColor: new Color("#f43f5e"),    // Vibrant magenta H-II ionized starburst regions
    dustColor: new Color("#0c0714"),         // Dense interstellar silicate dust
    nebulaColorInner: new Color("#a855f7"),  // Gaseous core envelope
    nebulaColorOuter: new Color("#06b6d4"),  // Gaseous spiral arm haze
  };
};
