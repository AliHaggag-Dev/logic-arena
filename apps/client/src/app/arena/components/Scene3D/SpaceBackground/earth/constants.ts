import { Vector3 } from "three";
import { IS_MOBILE } from "../constants";

// ---------------------------------------------------------------------------
// ASTRONOMICAL POSITIONING & SCALES
// ---------------------------------------------------------------------------
export const EARTH_POSITION: [number, number, number] = [950, -120, 800];
export const EARTH_SCALE = 40;
export const EARTH_ROTATION_SPEED = 0.035;
export const EARTH_AXIAL_TILT = 0.41; // 23.5° axial inclination
export const CLOUD_ROTATION_SPEED = 0.046; // Clouds drift faster than surface
export const CLOUD_UPPER_ROTATION_SPEED = -0.022; // High-altitude cirrus counter-drift

export const MOON_ORBIT_RADIUS = 3.0;
export const MOON_ORBIT_SPEED = 0.048;
export const MOON_SCALE = 0.272; // ~27% Earth radius
export const MOON_SELF_ROTATION_SPEED = 0.09;
export const MOON_ORBIT_INCLINATION = 0.09; // ~5.1° inclination

export const SPHERE_SEGMENTS = IS_MOBILE ? 48 : 64;
export const TEXTURE_WIDTH = IS_MOBILE ? 1024 : 2048;
export const TEXTURE_HEIGHT = IS_MOBILE ? 512 : 1024;
export const MOON_TEX_SIZE = IS_MOBILE ? 512 : 1024;

// Precise celestial sun vector in world coordinates (illuminates daytime face)
export const SUN_DIR = new Vector3(0.92, 0.28, 0.45).normalize();

// ---------------------------------------------------------------------------
// CONTINENTAL GEOMORPHOLOGY ANCHORS (Recognizable Earth Geography)
// ---------------------------------------------------------------------------
export const CONTINENT_CENTROIDS = [
  { lat: 0.72, lon: -1.72, r: 0.95, weight: 1.2 }, // North America
  { lat: -0.32, lon: -1.02, r: 0.75, weight: 1.1 }, // South America
  { lat: 0.88, lon: 0.28, r: 0.55, weight: 0.9 },  // Europe
  { lat: 0.08, lon: 0.38, r: 0.82, weight: 1.25 }, // Africa
  { lat: 0.78, lon: 1.65, r: 1.25, weight: 1.35 }, // Asia / Eurasia
  { lat: -0.45, lon: 2.35, r: 0.48, weight: 0.9 }, // Australia
  { lat: -1.45, lon: 0.0,  r: 0.70, weight: 1.5 }, // Antarctica
] as const;

// ---------------------------------------------------------------------------
// LUNAR MARIA BASINS & IMPACT CRATERS
// ---------------------------------------------------------------------------
export const LUNAR_BASINS = [
  { lat: 0.35, lon: -0.45, r: 0.55 }, // Mare Imbrium
  { lat: 0.32, lon: 0.22,  r: 0.42 }, // Mare Serenitatis
  { lat: 0.12, lon: 0.45,  r: 0.48 }, // Mare Tranquillitatis
  { lat: 0.25, lon: -0.95, r: 0.65 }, // Oceanus Procellarum
  { lat: -0.28, lon: -0.35, r: 0.38 }, // Mare Nubium
] as const;

export const RAY_CRATERS = [
  { lat: -0.75, lon: -0.20, r: 0.08 }, // Tycho
  { lat: 0.18,  lon: -0.35, r: 0.06 }, // Copernicus
  { lat: 0.15,  lon: -0.72, r: 0.04 }, // Kepler
] as const;
