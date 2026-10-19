import { BufferGeometry, Float32BufferAttribute, IcosahedronGeometry } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { AsteroidShapeOptions, Crater } from "./types";

/* ------------------------------ Shape tuning ------------------------------ */
const LOBE_FREQUENCY = 1.1;
const LOBE_AMPLITUDE = 0.42;
const RIDGE_FREQUENCY = 3.2;
const RIDGE_AMPLITUDE = 0.07;
const REGOLITH_FREQUENCY = 14;
const REGOLITH_AMPLITUDE = 0.012;
const MIN_RADIUS = 0.55;

/* ----------------------------- Crater tuning ----------------------------- */
/** Cumulative crater size-frequency N(>D) ∝ D^-b (b ≈ 2 for small bodies). */
const CRATER_SFD_EXPONENT = 2;
const CRATER_MIN_RADIUS = 0.07;
const CRATER_MAX_RADIUS = 0.55;
/** Simple craters have depth/diameter ≈ 0.2 (Pike 1977). */
const CRATER_DEPTH_TO_DIAMETER = 0.2;
const CRATER_RIM_HEIGHT_RATIO = 0.35;
const CRATER_RIM_WIDTH = 0.28;

/* ------------------------------ Albedo tuning ----------------------------- */
const ALBEDO_BASE = 0.78;
const WEATHERING_FREQUENCY = 2.4;
const WEATHERING_STRENGTH = 0.28;
const CAVITY_DARKENING = 2.6;
const FRESH_EJECTA_BRIGHTENING = 1.8;
const ALBEDO_MIN = 0.25;
const ALBEDO_MAX = 1.15;

const SEED_SPACING = 37.17;
const VALUE_NOISE_OCTAVES = 4;
const FBM_LACUNARITY = 2.07;
const FBM_GAIN = 0.5;

/** Mulberry32 — tiny deterministic PRNG so every variant is reproducible. */
export const createRng = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const hash3 = (x: number, y: number, z: number): number => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const smooth = (t: number): number => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Seeded trilinear value noise in [0, 1]. */
const valueNoise = (x: number, y: number, z: number): number => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const ux = smooth(x - ix);
  const uy = smooth(y - iy);
  const uz = smooth(z - iz);
  const x00 = lerp(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), ux);
  const x10 = lerp(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), ux);
  const x01 = lerp(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), ux);
  const x11 = lerp(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), ux);
  return lerp(lerp(x00, x10, uy), lerp(x01, x11, uy), uz);
};

/** Signed fBm in roughly [-1, 1]. */
const fbm = (x: number, y: number, z: number): number => {
  let sum = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let norm = 0;
  for (let i = 0; i < VALUE_NOISE_OCTAVES; i++) {
    sum += amplitude * (valueNoise(x * frequency, y * frequency, z * frequency) * 2 - 1);
    norm += amplitude;
    frequency *= FBM_LACUNARITY;
    amplitude *= FBM_GAIN;
  }
  return sum / norm;
};

/** Ridged noise in [0, 1] — sharp crests mimic fractures and boulder ridges. */
const ridged = (x: number, y: number, z: number): number => {
  const n = 1 - Math.abs(fbm(x, y, z));
  return n * n;
};

/** Craters uniformly distributed on the sphere with a power-law size distribution. */
const generateCraters = (count: number, rng: () => number): Crater[] => {
  const craters: Crater[] = [];
  const minPow = Math.pow(CRATER_MIN_RADIUS, -CRATER_SFD_EXPONENT);
  const maxPow = Math.pow(CRATER_MAX_RADIUS, -CRATER_SFD_EXPONENT);
  for (let i = 0; i < count; i++) {
    const z = rng() * 2 - 1;
    const theta = rng() * Math.PI * 2;
    const ring = Math.sqrt(1 - z * z);
    const radius = Math.pow(lerp(minPow, maxPow, rng()), -1 / CRATER_SFD_EXPONENT);
    craters.push({
      x: ring * Math.cos(theta),
      y: ring * Math.sin(theta),
      z,
      radius,
      depth: radius * 2 * CRATER_DEPTH_TO_DIAMETER,
    });
  }
  return craters;
};

/**
 * Builds a single irregular, cratered asteroid (indexed, smooth normals,
 * baked albedo + cavity occlusion in vertex colours).
 *
 * Shape = low-frequency lobes (rubble-pile irregularity) + ridged fractures
 *       + Pike-ratio bowl craters with raised rims + fine regolith grain.
 * Albedo = space-weathering patches, darkened crater floors (cavity AO) and
 *          brighter fresh ejecta on rims (less weathered material).
 */
export const createAsteroidGeometry = ({ seed, detail, craterCount }: AsteroidShapeOptions): BufferGeometry => {
  const rng = createRng(seed);
  const offset = seed * SEED_SPACING;
  const craters = generateCraters(craterCount, rng);

  const base = new IcosahedronGeometry(1, detail);
  base.deleteAttribute("normal");
  base.deleteAttribute("uv");
  const geometry = mergeVertices(base);
  base.dispose();

  const position = geometry.getAttribute("position");
  const colors = new Float32Array(position.count * 3);

  for (let i = 0; i < position.count; i++) {
    const vx = position.getX(i);
    const vy = position.getY(i);
    const vz = position.getZ(i);
    const len = Math.hypot(vx, vy, vz);
    const nx = vx / len;
    const ny = vy / len;
    const nz = vz / len;

    let radius = 1 + LOBE_AMPLITUDE * fbm(nx * LOBE_FREQUENCY + offset, ny * LOBE_FREQUENCY, nz * LOBE_FREQUENCY);
    radius += RIDGE_AMPLITUDE * ridged(nx * RIDGE_FREQUENCY, ny * RIDGE_FREQUENCY + offset, nz * RIDGE_FREQUENCY);

    let cavity = 0;
    let rimFreshness = 0;
    for (let c = 0; c < craters.length; c++) {
      const crater = craters[c];
      const chord = Math.hypot(nx - crater.x, ny - crater.y, nz - crater.z);
      const x = chord / crater.radius;
      if (x > 1 + 3 * CRATER_RIM_WIDTH) continue;
      if (x < 1) {
        const bowl = crater.depth * (x * x - 1);
        radius += bowl;
        cavity -= bowl;
      }
      const rimOffset = (x - 1) / CRATER_RIM_WIDTH;
      const rim = crater.depth * CRATER_RIM_HEIGHT_RATIO * Math.exp(-rimOffset * rimOffset);
      radius += rim;
      rimFreshness += rim;
    }

    radius += REGOLITH_AMPLITUDE * fbm(nx * REGOLITH_FREQUENCY, ny * REGOLITH_FREQUENCY, nz * REGOLITH_FREQUENCY + offset);
    radius = Math.max(radius, MIN_RADIUS);
    position.setXYZ(i, nx * radius, ny * radius, nz * radius);

    const weathering = fbm(nx * WEATHERING_FREQUENCY + offset, ny * WEATHERING_FREQUENCY, nz * WEATHERING_FREQUENCY - offset);
    const albedo = Math.min(
      Math.max(
        ALBEDO_BASE + WEATHERING_STRENGTH * weathering - CAVITY_DARKENING * cavity + FRESH_EJECTA_BRIGHTENING * rimFreshness,
        ALBEDO_MIN,
      ),
      ALBEDO_MAX,
    );
    colors[i * 3] = albedo;
    colors[i * 3 + 1] = albedo;
    colors[i * 3 + 2] = albedo;
  }

  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
};
