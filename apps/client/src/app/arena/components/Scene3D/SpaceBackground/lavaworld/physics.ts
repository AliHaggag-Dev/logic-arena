import { Vector3 } from "three";
import { KeplerState, MoonDefinition, OrbitalElements } from "./types";

// ---------------------------------------------------------------------------
// PLANETARY CONSTANTS
// ---------------------------------------------------------------------------

/** Planet visual radius in local-space units (normalized to 1.0 for the sphere) */
export const PLANET_RADIUS = 1.0;

/** Planetary rotation period (seconds for one full rotation) */
export const PLANET_ROTATION_PERIOD = 45.0;

/** Axial tilt of the planet (radians) */
export const PLANET_AXIAL_TILT = 0.14; // ~8 degrees

/** Effective blackbody temperature range (Kelvin) for color ramp */
export const TEMP_CRUST_MIN = 600;
export const TEMP_MAGMA_PEAK = 2200;

/** Gravitational parameter μ = GM in our normalized unit system */
export const MU = 4.0;

// ---------------------------------------------------------------------------
// VIEWING-PERSPECTIVE CAMERA BASIS AT PLANET [-500, 160, -500]
// Orthonormal basis: Screen Right, Screen Up, Depth Forward (into screen)
// ---------------------------------------------------------------------------
export const CAM_RIGHT = new Vector3(0.717, 0, -0.697).normalize();
export const CAM_UP = new Vector3(0.132, 0.982, 0.136).normalize();
export const CAM_FORWARD = new Vector3(-0.685, 0.189, -0.704).normalize();

// ---------------------------------------------------------------------------
// MOON ORBITAL DEFINITIONS (Keplerian Elements)
// ---------------------------------------------------------------------------

/**
 * Inner Moon ("Pyralis") — Io-like volcanic sulfurous moon
 * Starts prominently on the LEFT side of the planet (M0 = π).
 * Semi-major axis 3.3 keeps it outside the atmosphere halo at all times.
 */
export const INNER_MOON: MoonDefinition = {
  name: "Pyralis",
  radius: 0.24,
  orbital: {
    semiMajorAxis: 2.7,
    eccentricity: 0.04,
    inclination: 0.08,             // ~4.6° inclination (equatorial middle orbit)
    longitudeOfAscendingNode: 0.0,
    argumentOfPeriapsis: 0.0,
    meanAnomalyAtEpoch: Math.PI,   // starts on the LEFT side of planet
    orbitalPeriod: 40.0,           // seconds per orbit
  },
  axialTilt: 0.035,
  rotationPeriod: 40.0,
  tidallyLocked: true,
  albedo: 0.75,
  tidalHeatingFactor: 0.85,
};

export const OUTER_MOON: MoonDefinition = {
  name: "Umbrix",
  radius: 0.28,
  orbital: {
    semiMajorAxis: 3.9,
    eccentricity: 0.03,
    inclination: -0.06,            // ~-3.4° inclination (equatorial middle orbit)
    longitudeOfAscendingNode: 0.0,
    argumentOfPeriapsis: 0.0,
    meanAnomalyAtEpoch: 0.0,       // starts on the RIGHT side of planet
    orbitalPeriod: 68.0,           // seconds per orbit
  },
  axialTilt: 0.07,
  rotationPeriod: 68.0,
  tidallyLocked: true,
  albedo: 0.65,
  tidalHeatingFactor: 0.15,
};

// ---------------------------------------------------------------------------
// KEPLER'S EQUATION SOLVER (Newton-Raphson Method)
// ---------------------------------------------------------------------------

/** Maximum iterations for Newton-Raphson convergence */
const KEPLER_MAX_ITER = 12;

/** Convergence tolerance (radians) */
const KEPLER_TOLERANCE = 1e-8;

/**
 * Solves Kepler's equation: M = E - e·sin(E)
 * for Eccentric Anomaly E given Mean Anomaly M and eccentricity e.
 *
 * Uses Newton-Raphson iteration:
 *   E_{n+1} = E_n - (E_n - e·sin(E_n) - M) / (1 - e·cos(E_n))
 */
export const solveKeplerEquation = (meanAnomaly: number, eccentricity: number): number => {
  // Initial guess: E₀ = M + e·sin(M) (good for e < 0.8)
  let E = meanAnomaly + eccentricity * Math.sin(meanAnomaly);

  for (let i = 0; i < KEPLER_MAX_ITER; i++) {
    const sinE = Math.sin(E);
    const cosE = Math.cos(E);

    // f(E) = E - e·sin(E) - M
    const f = E - eccentricity * sinE - meanAnomaly;

    // f'(E) = 1 - e·cos(E)
    const fPrime = 1.0 - eccentricity * cosE;

    const delta = f / fPrime;
    E -= delta;

    if (Math.abs(delta) < KEPLER_TOLERANCE) break;
  }

  return E;
};

/**
 * Converts Eccentric Anomaly E to True Anomaly ν:
 *   tan(ν/2) = √((1+e)/(1-e)) · tan(E/2)
 */
export const eccentricToTrueAnomaly = (E: number, e: number): number => {
  const halfE = E * 0.5;
  const factor = Math.sqrt((1 + e) / (1 - e));
  return 2.0 * Math.atan2(factor * Math.sin(halfE), Math.cos(halfE));
};

/**
 * Computes radial distance from focus:
 *   r = a(1 - e²) / (1 + e·cos(ν))
 */
export const orbitalRadius = (a: number, e: number, trueAnomaly: number): number => {
  return (a * (1 - e * e)) / (1 + e * Math.cos(trueAnomaly));
};

/**
 * Vis-viva equation for orbital velocity magnitude:
 *   v = √(μ · (2/r - 1/a))
 */
export const orbitalVelocity = (mu: number, r: number, a: number): number => {
  return Math.sqrt(mu * (2.0 / r - 1.0 / a));
};

/**
 * Computes the full Keplerian state (position in 3D, velocity magnitude,
 * true anomaly, radius) at a given time.
 *
 * Mean Anomaly evolves linearly: M(t) = M₀ + (2π/T)·t
 */
export const computeKeplerianOrbit = (
  orbital: OrbitalElements,
  time: number,
  target: Vector3,
): KeplerState => {
  const { semiMajorAxis: a, eccentricity: e, inclination: i,
    meanAnomalyAtEpoch: M0, orbitalPeriod: T } = orbital;

  // Mean anomaly at current time
  const n = (2.0 * Math.PI) / T; // mean motion (rad/s)
  const M = (M0 + n * time) % (2.0 * Math.PI);

  // Solve Kepler's equation for Eccentric Anomaly
  const E = solveKeplerEquation(M, e);

  // True anomaly
  const nu = eccentricToTrueAnomaly(E, e);

  // Radial distance
  const r = orbitalRadius(a, e, nu);

  // Velocity magnitude (vis-viva)
  const v = orbitalVelocity(MU, r, a);

  // Position in orbital plane
  const cosNu = Math.cos(nu);
  const sinNu = Math.sin(nu);

  const xOrbital = r * cosNu;
  const yOrbital = r * sinNu;

  // Viewing-perspective aligned 3D projection:
  // Aligns the orbital sweep across the camera viewport (CAM_RIGHT),
  // with an inclined vertical/depth tilt that prevents any occlusion by the planet
  const cosI = Math.cos(i);
  const sinI = Math.sin(i);

  const x = xOrbital;
  const y = yOrbital * cosI;
  const z = yOrbital * sinI;

  target.set(
    x * CAM_RIGHT.x + y * CAM_UP.x + z * CAM_FORWARD.x,
    x * CAM_RIGHT.y + y * CAM_UP.y + z * CAM_FORWARD.y,
    x * CAM_RIGHT.z + y * CAM_UP.z + z * CAM_FORWARD.z,
  );

  return { position: target, velocity: v, trueAnomaly: nu, radius: r };
};

/**
 * Determines eclipse factor: how much the planet shadows a moon.
 * Returns 0.0 (full eclipse) to 1.0 (fully lit).
 *
 * Uses cylindrical shadow approximation: the planet casts a shadow
 * cylinder of radius R_planet along the star-to-planet direction.
 */
export const computeEclipseFactor = (
  moonPos: Vector3,
  starDir: Vector3,
  planetRadius: number,
): number => {
  // Project moon position onto the star direction axis
  const projLength = moonPos.dot(starDir);

  // Moon must be on the shadow side (behind the planet from star)
  if (projLength > 0) return 1.0; // fully lit

  // Perpendicular distance from the shadow axis
  const projPoint = starDir.clone().multiplyScalar(projLength);
  const perpDist = moonPos.clone().sub(projPoint).length();

  // Penumbra transition zone
  const penumbraWidth = planetRadius * 0.3;
  const shadowEdge = planetRadius * 1.05;

  if (perpDist < shadowEdge - penumbraWidth) return 0.05; // deep umbra
  if (perpDist < shadowEdge) {
    // Smooth penumbra transition
    const t = (perpDist - (shadowEdge - penumbraWidth)) / penumbraWidth;
    return 0.05 + t * t * (3.0 - 2.0 * t) * 0.95;
  }

  return 1.0;
};
