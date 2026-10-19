import type { IUniform, Matrix3, Texture, Vector3 } from "three";

/**
 * `interstellar` — exact geodesic lensing, but Doppler beaming and gravitational
 *                  redshift suppressed (the artistic choice made for the film).
 * `physical`     — every relativistic effect enabled (beaming, g-factor colour
 *                  shift, Novikov–Thorne zero-torque inner edge).
 */
export type BlackHoleRenderMode = "interstellar" | "physical";

export interface DiskEmissionProfile {
  /** Exponent applied to the redshift factor g (0 = disabled, 1 = exact GR). */
  beaming: number;
  /** 1 = Novikov–Thorne zero-torque boundary at the ISCO, 0 = no torque term. */
  zeroTorque: number;
  /** Peak rest-frame disk temperature in Kelvin. */
  peakTemperatureK: number;
  /** Linear HDR exposure applied before the renderer's tone mapping. */
  exposure: number;
}

export interface BlackHoleQuality {
  maxSteps: number;
  stepScale: number;
  fbmOctaves: number;
  debrisCount: number;
  envResolution: number;
}

export interface BlackHoleUniforms {
  [uniform: string]: IUniform;
  uCamPos: IUniform<Vector3>;
  uCamRedshift: IUniform<number>;
  uObserverBoost: IUniform<number>;
  uTime: IUniform<number>;
  uEnvMap: IUniform<Texture | null>;
  uEnvReady: IUniform<number>;
  uEnvRotation: IUniform<Matrix3>;
  uBeaming: IUniform<number>;
  uZeroTorque: IUniform<number>;
  uPeakTemperature: IUniform<number>;
  uTempNorm: IUniform<number>;
  uExposure: IUniform<number>;
  uDiskInner: IUniform<number>;
  uDiskOuter: IUniform<number>;
  uBoundRadius: IUniform<number>;
  uFadeStart: IUniform<number>;
  uStepScale: IUniform<number>;
}

export interface OrbitControlsLike {
  target: Vector3;
  update: () => void;
}

/** Structure-of-arrays state for geodesic debris (zero GC in the frame loop). */
export interface DebrisState {
  radius: Float32Array;
  radialVelocity: Float32Array;
  azimuth: Float32Array;
  angularMomentum: Float32Array;
  energy: Float32Array;
  age: Float32Array;
  /** Orbital-plane basis, 3 floats per particle each. */
  basisU: Float32Array;
  basisV: Float32Array;
  basisN: Float32Array;
}

export interface TidalStrain {
  radial: number;
  azimuthal: number;
  normal: number;
}
