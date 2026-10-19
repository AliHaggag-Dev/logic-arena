import { CanvasTexture, LinearMipmapLinearFilter } from "three";
import { IS_MOBILE } from "../constants";
import { noise3D, fbm3D } from "../noise";
import {
  TEXTURE_WIDTH,
  TEXTURE_HEIGHT,
  CONTINENT_CENTROIDS,
} from "./constants";
import { EarthTextureSet } from "./types";

// ---------------------------------------------------------------------------
// PROCEDURAL EARTH TEXTURES (Photorealistic Continents, Oceans, Bump & Cities)
// ---------------------------------------------------------------------------
export const createEarthTextures = (): EarthTextureSet => {
  const W = TEXTURE_WIDTH;
  const H = TEXTURE_HEIGHT;

  const dayCanvas = document.createElement("canvas");
  dayCanvas.width = W; dayCanvas.height = H;
  const dayCtx = dayCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = W; bumpCanvas.height = H;
  const bumpCtx = bumpCanvas.getContext("2d")!;

  const oceanCanvas = document.createElement("canvas");
  oceanCanvas.width = W; oceanCanvas.height = H;
  const oceanCtx = oceanCanvas.getContext("2d")!;

  const nightCanvas = document.createElement("canvas");
  nightCanvas.width = W; nightCanvas.height = H;
  const nightCtx = nightCanvas.getContext("2d")!;

  const dayData = dayCtx.createImageData(W, H);
  const bumpData = bumpCtx.createImageData(W, H);
  const oceanData = oceanCtx.createImageData(W, H);
  const nightData = nightCtx.createImageData(W, H);

  // Palettes for photorealistic terrestrial rendering
  const cAbyss      = [2, 9, 28];       // Deep ocean trench (pitch navy)
  const cDeepOcean  = [5, 24, 68];      // Deep open ocean (royal sapphire)
  const cMidOcean   = [10, 52, 115];    // Mid-depth sea
  const cCoastal    = [18, 92, 155];    // Coastal shelf
  const cReef       = [24, 158, 178];   // Vibrant turquoise shallow water / reefs
  const cBeach      = [218, 192, 138];  // Golden sand / coast
  const cRainforest = [18, 64, 22];     // Dense tropical canopy
  const cLowGrass   = [45, 105, 36];    // Fertile lowlands
  const cHighGrass  = [92, 118, 52];    // Savanna / temperate grassland
  const cDesert     = [198, 142, 68];   // Arid desert sands (Sahara/Arabian gold)
  const cDuneRed    = [175, 102, 45];   // Red desert rock / canyon
  const cMountain   = [90, 84, 76];     // Jagged slate rock
  const cHighPeak   = [135, 128, 120];  // Alpine crag
  const cSnow       = [250, 252, 255];  // Pure snowcap / glacier

  const lerp = (a: number[], b: number[], t: number) => [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];

  for (let y = 0; y < H; y++) {
    const v = y / H;
    const lat = (0.5 - v) * Math.PI; // -PI/2 to PI/2
    const cosLat = Math.cos(lat);
    const absLatNorm = Math.abs(lat) / (Math.PI * 0.5);

    for (let x = 0; x < W; x++) {
      const u = x / W;
      const lon = (u - 0.5) * Math.PI * 2.0;

      // 3D coordinates on unit sphere (zero polar distortion)
      const sx = cosLat * Math.sin(lon);
      const sy = Math.sin(lat);
      const sz = cosLat * Math.cos(lon);

      // 1. Continental macro-shape attractor field
      let landPull = 0;
      for (let i = 0; i < CONTINENT_CENTROIDS.length; i++) {
        const c = CONTINENT_CENTROIDS[i];
        const clat = c.lat;
        const clon = c.lon;
        const cx = Math.cos(clat) * Math.sin(clon);
        const cy = Math.sin(clat);
        const cz = Math.cos(clat) * Math.cos(clon);
        const dist = Math.acos(Math.max(-1, Math.min(1, sx * cx + sy * cy + sz * cz)));
        if (dist < c.r) {
          const factor = Math.cos((dist / c.r) * Math.PI * 0.5);
          landPull = Math.max(landPull, factor * c.weight);
        }
      }

      // 2. Domain-warped 3D Fractal Tectonic Noise
      const qx = fbm3D(sx * 2.2 + 1.2, sy * 2.2 + 0.4, sz * 2.2 + 3.1, 3);
      const qy = fbm3D(sx * 2.2 + 4.5, sy * 2.2 + 2.8, sz * 2.2 + 1.6, 3);
      const qz = fbm3D(sx * 2.2 + 7.8, sy * 2.2 + 5.1, sz * 2.2 + 8.2, 3);

      const wx = sx + (qx - 0.5) * 0.42;
      const wy = sy + (qy - 0.5) * 0.42;
      const wz = sz + (qz - 0.5) * 0.42;

      const macroNoise = fbm3D(wx * 2.8, wy * 2.8, wz * 2.8, 5);
      const detailNoise = noise3D(sx * 14.0, sy * 14.0, sz * 14.0) * 0.06;

      // Combined elevation (0.0 = deep trench, 0.48 = sea level, 1.0 = peak)
      let elevation = macroNoise * 0.65 + landPull * 0.52 + detailNoise - 0.16;

      // Polar ice sheets override
      if (absLatNorm > 0.82) {
        elevation = Math.max(elevation, 0.52 + (absLatNorm - 0.82) * 1.8);
      }

      // Moisture / climate variation
      const moisture = fbm3D(sx * 3.4 + 12.0, sy * 3.4 + 4.0, sz * 3.4 + 9.0, 3);

      let col = cDeepOcean;
      let bump = 20;
      let oceanSpec = 255; // 255 = 100% specular water, 0 = matte land
      let cityLight = 0;

      const idx = (y * W + x) * 4;

      if (elevation < 0.48) {
        // ─── OCEAN BATHYMETRY ───
        if (elevation < 0.32) {
          const t = elevation / 0.32;
          col = lerp(cAbyss, cDeepOcean, t);
          bump = Math.round(15 + t * 25);
        } else if (elevation < 0.42) {
          const t = (elevation - 0.32) / 0.10;
          col = lerp(cDeepOcean, cMidOcean, t);
          bump = Math.round(40 + t * 25);
        } else if (elevation < 0.46) {
          const t = (elevation - 0.42) / 0.04;
          col = lerp(cMidOcean, cCoastal, t);
          bump = Math.round(65 + t * 20);
        } else {
          const t = (elevation - 0.46) / 0.02;
          col = lerp(cCoastal, cReef, t);
          bump = Math.round(85 + t * 25);
        }
        oceanSpec = 255;
      } else {
        // ─── TERRESTRIAL LANDMASSES ───
        oceanSpec = 0;

        // Organic subtropical desert belt with smooth noise blending
        const desertBelt = Math.exp(-Math.pow((absLatNorm - 0.28) / 0.11, 2.0));
        const aridityNoise = noise3D(sx * 6.0, sy * 6.0, sz * 6.0) * 0.18;
        const aridity = Math.max(0, Math.min(1.0, (desertBelt - 0.2) / 0.4 + aridityNoise - (moisture - 0.45) * 0.8));

        if (elevation < 0.50) {
          const t = (elevation - 0.48) / 0.02;
          col = lerp(cReef, cBeach, t);
          bump = Math.round(110 + t * 15);
        } else if (elevation < 0.62) {
          const t = (elevation - 0.50) / 0.12;
          const isTropics = absLatNorm < 0.16 && moisture > 0.42;
          const vegCol = isTropics ? lerp(cLowGrass, cRainforest, t) : lerp(cLowGrass, cHighGrass, t);
          const desertCol = lerp(cBeach, cDesert, t);
          col = lerp(vegCol, desertCol, aridity);
          bump = Math.round(125 + t * 30);
          cityLight = 0.85 * (1.0 - aridity * 0.4);
        } else if (elevation < 0.76) {
          const t = (elevation - 0.62) / 0.14;
          const vegCol = lerp(cHighGrass, cMountain, t);
          const desertCol = lerp(cDesert, cDuneRed, t);
          col = lerp(vegCol, desertCol, aridity);
          bump = Math.round(155 + t * 45);
          cityLight = 0.35 * (1.0 - aridity * 0.5);
        } else if (elevation < 0.86) {
          const t = (elevation - 0.76) / 0.10;
          col = lerp(cMountain, cHighPeak, t);
          bump = Math.round(200 + t * 35);
          cityLight = 0.05;
        } else {
          const t = Math.min(1.0, (elevation - 0.86) / 0.14);
          col = lerp(cHighPeak, cSnow, t);
          bump = Math.round(235 + t * 20);
          oceanSpec = Math.round(t * 70);
          cityLight = 0;
        }

        // Polar ice cap override
        if (absLatNorm > 0.78) {
          const iceT = Math.min(1.0, (absLatNorm - 0.78) / 0.16);
          col = lerp(col, cSnow, iceT);
          bump = Math.round(bump * (1 - iceT) + 240 * iceT);
          oceanSpec = Math.round(iceT * 90);
          cityLight = 0;
        }
      }

      dayData.data[idx]     = col[0];
      dayData.data[idx + 1] = col[1];
      dayData.data[idx + 2] = col[2];
      dayData.data[idx + 3] = 255;

      bumpData.data[idx]     = bump;
      bumpData.data[idx + 1] = bump;
      bumpData.data[idx + 2] = bump;
      bumpData.data[idx + 3] = 255;

      oceanData.data[idx]     = oceanSpec;
      oceanData.data[idx + 1] = oceanSpec;
      oceanData.data[idx + 2] = oceanSpec;
      oceanData.data[idx + 3] = 255;

      // ─── NIGHTSIDE CITY LIGHTS ───
      let cityR = 0, cityG = 0, cityB = 0;
      if (cityLight > 0) {
        const cityNoise = fbm3D(sx * 36.0, sy * 36.0, sz * 36.0, 3);
        const metroHub = noise3D(sx * 9.0, sy * 9.0, sz * 9.0);

        if (cityNoise > 0.62 && absLatNorm < 0.72) {
          const intensity = Math.pow((cityNoise - 0.62) / 0.38, 1.8) * cityLight;
          const isMegaCity = metroHub > 0.68;
          const mult = isMegaCity ? 2.4 : 1.2;

          cityR = Math.min(255, Math.round(255 * intensity * mult));
          cityG = Math.min(255, Math.round(185 * intensity * mult));
          cityB = Math.min(255, Math.round(85 * intensity * mult));
        }
      }

      nightData.data[idx]     = cityR;
      nightData.data[idx + 1] = cityG;
      nightData.data[idx + 2] = cityB;
      nightData.data[idx + 3] = 255;
    }
  }

  dayCtx.putImageData(dayData, 0, 0);
  bumpCtx.putImageData(bumpData, 0, 0);
  oceanCtx.putImageData(oceanData, 0, 0);
  nightCtx.putImageData(nightData, 0, 0);

  const dayMap = new CanvasTexture(dayCanvas);
  dayMap.generateMipmaps = true;
  dayMap.minFilter = LinearMipmapLinearFilter;
  dayMap.anisotropy = IS_MOBILE ? 2 : 8;

  const bumpMap = new CanvasTexture(bumpCanvas);
  bumpMap.generateMipmaps = true;
  bumpMap.minFilter = LinearMipmapLinearFilter;
  bumpMap.anisotropy = IS_MOBILE ? 2 : 8;

  const oceanMask = new CanvasTexture(oceanCanvas);
  oceanMask.generateMipmaps = true;
  oceanMask.minFilter = LinearMipmapLinearFilter;
  oceanMask.anisotropy = IS_MOBILE ? 2 : 4;

  const nightMap = new CanvasTexture(nightCanvas);
  nightMap.generateMipmaps = true;
  nightMap.minFilter = LinearMipmapLinearFilter;
  nightMap.anisotropy = IS_MOBILE ? 2 : 8;

  return { dayMap, bumpMap, oceanMask, nightMap };
};
