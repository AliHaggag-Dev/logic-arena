import { Color, Matrix4, Vector3 } from "three";
import { MapTheme } from "../../../../types";

export interface MonolithThemeColors {
  primary: Color;
  secondary: Color;
  subsurface: Color;
  singularity: Color;
  beamFilament: Color;
  ambientHalo: Color;
  primaryHex: string;
}

export interface MonolithProps {
  mapTheme: MapTheme;
  graphicsQuality?: string;
}

export interface MonolithShaderUniforms {
  uTime: { value: number };
  uCameraPosition: { value: Vector3 };
  uObserverProximity: { value: number };
  uObserverAlignment: { value: number };
  uPrimaryColor: { value: Color };
  uSecondaryColor: { value: Color };
  uSubsurfaceColor: { value: Color };
  uDimensions: { value: Vector3 };
  uTesseractRotation: { value: Matrix4 };
  uTesseractVertices: { value: Vector3[] };
  uSubsurfaceDensity: { value: number };
  uDispersiveIndex: { value: number };
}

export interface LensingShaderUniforms {
  uTime: { value: number };
  uCameraPosition: { value: Vector3 };
  uGravitationalRadius: { value: number };
  uChromaDispersion: { value: number };
  uWaveAmplitude: { value: number };
  uPrimaryGlow: { value: Color };
  uSecondaryGlow: { value: Color };
  uObserverFactor: { value: number };
}

export interface CasimirNodeUniforms {
  uTime: { value: number };
  uNodeIndex: { value: number };
  uGlowColor: { value: Color };
  uSingularityColor: { value: Color };
  uPulseIntensity: { value: number };
}

export interface FilamentUniforms {
  uTime: { value: number };
  uBeamColor: { value: Color };
  uPulseRate: { value: number };
  uTurbulence: { value: number };
}

export interface TesseractState {
  vertices4D: [number, number, number, number][];
  edges: [number, number][];
}
