import { Color } from "three";
import { MapTheme } from "../../../../types";

export interface GalaxyThemePalette {
  coreColor: Color;
  coreHighlight: Color;
  armColorInner: Color;
  armColorOuter: Color;
  starburstColor: Color;
  dustColor: Color;
  nebulaColorInner: Color;
  nebulaColorOuter: Color;
}

export interface GalaxyBuffers {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  alphas: Float32Array;
  twinkles: Float32Array;
}

export interface DustBuffers {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  alphas: Float32Array;
}

export interface SpiralGalaxyProps {
  mapTheme: MapTheme;
  graphicsQuality?: string;
}
