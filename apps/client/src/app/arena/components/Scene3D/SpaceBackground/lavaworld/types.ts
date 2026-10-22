import { Color, Vector3 } from "three";

// ---------------------------------------------------------------------------
// LAVA WORLD SYSTEM TYPES
// ---------------------------------------------------------------------------

export interface LavaWorldProps {
  pos: [number, number, number];
  scale: number;
  audioName?: "lava";
}

export interface OrbitalElements {
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  longitudeOfAscendingNode: number;
  argumentOfPeriapsis: number;
  meanAnomalyAtEpoch: number;
  orbitalPeriod: number;
}

export interface MoonDefinition {
  name: string;
  radius: number;
  orbital: OrbitalElements;
  axialTilt: number;
  rotationPeriod: number;
  tidallyLocked: boolean;
  albedo: number;
  tidalHeatingFactor: number;
}

export interface PlanetSurfaceUniforms {
  uTime: { value: number };
  uRotationAngle: { value: number };
  uPrimaryMagma: { value: Color };
  uSecondaryMagma: { value: Color };
  uCrustColor: { value: Color };
  uHotspotColor: { value: Color };
  uMagmaFlowSpeed: { value: number };
  uTectonicScale: { value: number };
  uCrustThickness: { value: number };
  uVolcanicIntensity: { value: number };
}

export interface PlanetAtmosphereUniforms {
  uTime: { value: number };
  uAtmosphereColor: { value: Color };
  uGlowIntensity: { value: number };
  uScatteringCoeff: { value: number };
  uAbsorptionCoeff: { value: number };
}

export interface MoonSurfaceUniforms {
  uTime: { value: number };
  uBaseColor1: { value: Color };
  uBaseColor2: { value: Color };
  uHighlightColor: { value: Color };
  uCraterDensity: { value: number };
  uSurfaceRoughness: { value: number };
  uPlanetLightDir: { value: Vector3 };
  uPlanetLightColor: { value: Color };
  uPlanetLightIntensity: { value: number };
  uTidalHeat: { value: number };
  uEclipseFactor: { value: number };
  uMoonType: { value: number };
}

export interface KeplerState {
  position: Vector3;
  velocity: number;
  trueAnomaly: number;
  radius: number;
}
