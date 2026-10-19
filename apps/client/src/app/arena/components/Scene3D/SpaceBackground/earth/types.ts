import { CanvasTexture, IUniform, Vector3 } from "three";

export interface EarthTextureSet {
  dayMap: CanvasTexture;
  bumpMap: CanvasTexture;
  oceanMask: CanvasTexture;
  nightMap: CanvasTexture;
}

export interface MoonTextureSet {
  map: CanvasTexture;
  bumpMap: CanvasTexture;
}

export interface HyperEarthProps {
  audioName?: "terrestrial";
}

export interface EarthUniforms {
  [uniform: string]: IUniform;
  dayMap: { value: CanvasTexture };
  nightMap: { value: CanvasTexture };
  oceanMask: { value: CanvasTexture };
  cloudMap: { value: CanvasTexture };
  sunDirection: { value: Vector3 };
  cloudOffset: { value: number };
}

export interface AtmoUniforms {
  [uniform: string]: IUniform;
  sunDirection: { value: Vector3 };
}

export interface CloudUniforms {
  [uniform: string]: IUniform;
  cloudMap: { value: CanvasTexture };
  sunDirection: { value: Vector3 };
  cloudAlphaMul: { value: number };
}

export interface MoonUniforms {
  [uniform: string]: IUniform;
  moonMap: { value: CanvasTexture };
  sunDirection: { value: Vector3 };
}
