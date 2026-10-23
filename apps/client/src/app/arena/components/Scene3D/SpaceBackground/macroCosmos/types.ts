import { Color, IUniform } from "three";
import { MapTheme } from "../../../../types";

export interface MacroCosmosProps {
  mapTheme: MapTheme;
  graphicsQuality?: string;
}

export interface MacroCosmosPalette {
  cometCore: Color;
  cometTail: Color;
}

export interface MacroUniforms {
  uZoom: IUniform<number>;
  uTime: IUniform<number>;
  [uniform: string]: IUniform<unknown>;
}
