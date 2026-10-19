import { Quaternion, Vector3 } from "three";
import type {
  BlackHoleQuality,
  BlackHoleRenderMode,
  DiskEmissionProfile,
  TidalStrain,
} from "./types";

/*
 * Geometrized units throughout: G = c = 1 and every length / time is measured
 * in units of the black-hole mass M. The scene group is scaled so that one
 * local unit equals one M, which lets the shader and CPU integrators use the
 * textbook Schwarzschild formulas verbatim.
 */

export const MASS = 1;
export const SCHWARZSCHILD_RADIUS = 2 * MASS;
export const PHOTON_SPHERE_RADIUS = 3 * MASS;
export const ISCO_RADIUS = 6 * MASS;
export const CRITICAL_IMPACT_PARAMETER = 3 * Math.sqrt(3) * MASS;

export const DISK_INNER_RADIUS = ISCO_RADIUS;
export const DISK_OUTER_RADIUS = 20 * MASS;
export const LENSING_BOUND_RADIUS = 28 * MASS;
export const LENSING_FADE_START = 21 * MASS;

/** Local (pre-`scale` prop) scene units per M. */
export const LOCAL_UNITS_PER_M = 3;

/** Coordinate time (in M) that elapses per real second. */
export const TIME_SCALE = 8;
/** Clamp for frame delta (s) so tab-switch spikes cannot explode integrators. */
export const MAX_FRAME_DELTA = 0.1;

/* ----------------------------- Camera dynamics ---------------------------- */
export const CAMERA_INFLUENCE_RADIUS = 30 * MASS;
export const CAMERA_MIN_RADIUS = 3.4 * MASS;
/** Drift speed (M/s) scale of the (r_s / (r - r_s))² Paczyński–Wiita profile. */
export const CAMERA_PULL_GAIN = 4;
export const CAMERA_TARGET_PULL_RATE = 1.5;
export const HORIZON_EPSILON = 1e-4;

/* --------------------------- Disk view orientation ------------------------ */
/** Default arena camera; disk is tilted so this viewpoint sits just above it. */
export const DISK_VIEW_ANCHOR = new Vector3(0, 22, 14);
export const DISK_VIEW_ELEVATION_RAD = (7 * Math.PI) / 180;
const WORLD_UP = new Vector3(0, 1, 0);

/* ------------------------------- Debris ---------------------------------- */
export const DEBRIS_SPAWN_MIN_RADIUS = 12 * MASS;
export const DEBRIS_SPAWN_MAX_RADIUS = 22 * MASS;
export const DEBRIS_INITIAL_MIN_RADIUS = 5 * MASS;
/** L < 2√3 M ⇒ no stable circular orbit exists ⇒ guaranteed plunge (zoom-whirl). */
export const DEBRIS_MIN_ANGULAR_MOMENTUM = 1.8 * MASS;
export const DEBRIS_MAX_ANGULAR_MOMENTUM = 3.3 * MASS;
export const DEBRIS_MAX_INFALL_SPEED = 0.05;
export const DEBRIS_MAX_TILT_RAD = 0.18;
export const DEBRIS_RESPAWN_RADIUS = 2.02 * MASS;
export const DEBRIS_SUBSTEPS = 3;
export const DEBRIS_BASE_SIZE = 0.16 * MASS;
export const DEBRIS_TEMPERATURE_K = 6500;
export const DEBRIS_EXPOSURE = 1.6;
export const DEBRIS_MAX_BOOST = 6;
export const DEBRIS_FADE_IN_SECONDS = 1.5;
export const TIDAL_GAIN = 14;
export const MAX_TIDAL_STRAIN = 3;

export const RENDER_PROFILES: Record<BlackHoleRenderMode, DiskEmissionProfile> = {
  interstellar: { beaming: 0, zeroTorque: 0, peakTemperatureK: 5200, exposure: 3.2 },
  physical: { beaming: 1, zeroTorque: 1, peakTemperatureK: 7500, exposure: 2.6 },
};

export const QUALITY_DESKTOP: BlackHoleQuality = {
  maxSteps: 200,
  stepScale: 0.06,
  fbmOctaves: 4,
  debrisCount: 72,
  envResolution: 256,
};

export const QUALITY_MOBILE: BlackHoleQuality = {
  maxSteps: 120,
  stepScale: 0.1,
  fbmOctaves: 3,
  debrisCount: 32,
  envResolution: 128,
};

/* ----------------------------- Thermodynamics ---------------------------- */
const PLANCK_MIN_K = 1667;
const PLANCK_MAX_K = 25000;
const PLANCK_MID_K = 4000;
const PLANCK_LOW_K = 2222;
const TEMPERATURE_SAMPLES = 256;
const TORQUE_FLOOR = 1e-4;

/**
 * Planckian locus → linear-sRGB chromaticity (max component = 1).
 * Kim et al. (2002) cubic fit of CIE 1931 (x, y), then XYZ → sRGB (D65).
 * Writes into `out` to avoid allocation.
 */
export const blackbodyChromaticity = (
  temperatureK: number,
  out: [number, number, number],
): [number, number, number] => {
  const t = Math.min(Math.max(temperatureK, PLANCK_MIN_K), PLANCK_MAX_K);
  const u = 1000 / t;
  const u2 = u * u;
  const u3 = u2 * u;

  const x = t <= PLANCK_MID_K
    ? -0.2661239 * u3 - 0.2343589 * u2 + 0.8776956 * u + 0.17991
    : -3.0258469 * u3 + 2.1070379 * u2 + 0.2226347 * u + 0.24039;
  const x2 = x * x;
  const x3 = x2 * x;

  let y: number;
  if (t <= PLANCK_LOW_K) y = -1.1063814 * x3 - 1.3481102 * x2 + 2.18555832 * x - 0.20219683;
  else if (t <= PLANCK_MID_K) y = -0.9549476 * x3 - 1.37418593 * x2 + 2.09137015 * x - 0.16748867;
  else y = 3.081758 * x3 - 5.8733867 * x2 + 3.75112997 * x - 0.37001483;

  const X = x / y;
  const Z = (1 - x - y) / y;
  const r = Math.max(3.2406 * X - 1.5372 - 0.4986 * Z, 0);
  const g = Math.max(-0.9689 * X + 1.8758 + 0.0415 * Z, 0);
  const b = Math.max(0.0557 * X - 0.204 + 1.057 * Z, 0);
  const peak = Math.max(r, g, b, TORQUE_FLOOR);

  out[0] = r / peak;
  out[1] = g / peak;
  out[2] = b / peak;
  return out;
};

/**
 * Normalises the thin-disk temperature profile
 *   T(r) ∝ (r_in / r)^{3/4} · (1 − √(r_in / r))^{zeroTorque / 4}
 * so its maximum over the disk equals 1.
 */
export const computeTemperatureNormalization = (zeroTorque: number): number => {
  let peak = 0;
  for (let i = 0; i <= TEMPERATURE_SAMPLES; i++) {
    const r = DISK_INNER_RADIUS + ((DISK_OUTER_RADIUS - DISK_INNER_RADIUS) * i) / TEMPERATURE_SAMPLES;
    const x = DISK_INNER_RADIUS / r;
    const torque = Math.pow(Math.max(1 - Math.sqrt(x), TORQUE_FLOOR), 0.25 * zeroTorque);
    peak = Math.max(peak, Math.pow(x, 0.75) * torque);
  }
  return 1 / peak;
};

/* ------------------------------ Geodesics -------------------------------- */

/**
 * Radial equation of a timelike Schwarzschild geodesic in proper time τ:
 *   d²r/dτ² = −M/r² + L²/r³ − 3ML²/r⁴
 * The last term is the purely relativistic one (absent in Newton).
 */
export const radialGeodesicAcceleration = (r: number, angularMomentum: number): number => {
  const l2 = angularMomentum * angularMomentum;
  const r2 = r * r;
  return -MASS / r2 + l2 / (r2 * r) - (3 * MASS * l2) / (r2 * r2);
};

/** Specific energy E from (dr/dτ)² = E² − (1 − 2M/r)(1 + L²/r²). */
export const geodesicEnergy = (r: number, radialVelocity: number, angularMomentum: number): number => {
  const lapse = 1 - SCHWARZSCHILD_RADIUS / r;
  const l2 = angularMomentum * angularMomentum;
  return Math.sqrt(radialVelocity * radialVelocity + lapse * (1 + l2 / (r * r)));
};

/**
 * Eigenvalues of the tidal (Weyl / electric-Riemann) tensor in the frame of a
 * freely falling body with angular momentum L (Marck 1983):
 *   radial    : +(M/r³)(2 + 3L²/r²)   stretch
 *   azimuthal : −(M/r³)               squeeze
 *   normal    : −(M/r³)(1 + 3L²/r²)   squeeze
 * Their sum is exactly zero (vacuum Einstein eq. R_μν = 0), so exp(strain)
 * scaling preserves volume: spaghettification is incompressible.
 */
export const computeTidalStrain = (r: number, angularMomentum: number, out: TidalStrain): TidalStrain => {
  const k = MASS / (r * r * r);
  const lr2 = (3 * angularMomentum * angularMomentum) / (r * r);
  let radial = TIDAL_GAIN * k * (2 + lr2);
  let azimuthal = -TIDAL_GAIN * k;
  let normal = -TIDAL_GAIN * k * (1 + lr2);
  if (radial > MAX_TIDAL_STRAIN) {
    const clamp = MAX_TIDAL_STRAIN / radial;
    radial *= clamp;
    azimuthal *= clamp;
    normal *= clamp;
  }
  out.radial = radial;
  out.azimuthal = azimuthal;
  out.normal = normal;
  return out;
};

/** Tilts the disk so `anchor` views it from `elevation` above its plane. */
export const computeDiskQuaternion = (blackHoleWorld: Vector3, anchor: Vector3, elevationRad: number): Quaternion => {
  const toViewer = anchor.clone().sub(blackHoleWorld).normalize();
  const upPerp = WORLD_UP.clone().addScaledVector(toViewer, -WORLD_UP.dot(toViewer)).normalize();
  const normal = upPerp
    .multiplyScalar(Math.cos(elevationRad))
    .addScaledVector(toViewer, Math.sin(elevationRad))
    .normalize();
  return new Quaternion().setFromUnitVectors(WORLD_UP, normal);
};
