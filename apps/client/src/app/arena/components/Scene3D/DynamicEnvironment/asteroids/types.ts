import type { IUniform, Color, Vector3 } from "three";

export type Vec3Tuple = [number, number, number];

export interface AsteroidPlacement {
  pos: Vec3Tuple;
  size: number;
}

/** Taxonomic spectral classes (Tholen/SMASS) with main-belt-like abundances. */
export type AsteroidSpectralClass = "C" | "S" | "M";

export interface SpectralClassProfile {
  hue: number;
  saturation: number;
  lightness: number;
  /** Cumulative probability upper bound used for weighted sampling. */
  cumulativeWeight: number;
}

export interface AsteroidShapeOptions {
  seed: number;
  detail: number;
  craterCount: number;
}

export interface Crater {
  x: number;
  y: number;
  z: number;
  radius: number;
  depth: number;
}

export interface AsteroidMaterialUniforms {
  [uniform: string]: IUniform;
  uDiskPosView: IUniform<Vector3>;
  uDiskLightColor: IUniform<Color>;
  uDiskIntensity: IUniform<number>;
  uDiskRefDistance: IUniform<number>;
}
