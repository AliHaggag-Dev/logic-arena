import { CanvasTexture, LinearMipmapLinearFilter } from "three";
import { IS_MOBILE } from "../constants";
import { noise3D, fbm3D } from "../noise";
import { MOON_TEX_SIZE, LUNAR_BASINS, RAY_CRATERS } from "./constants";
import { MoonTextureSet } from "./types";

// ---------------------------------------------------------------------------
// PROCEDURAL MOON GENERATOR (High-Contrast Maria, Craters & Ejecta Blankets)
// ---------------------------------------------------------------------------
export const createLunarTextures = (): MoonTextureSet => {
  const size = MOON_TEX_SIZE;
  const mapCanvas = document.createElement("canvas");
  mapCanvas.width = size; mapCanvas.height = size;
  const mapCtx = mapCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size; bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext("2d")!;

  const mapData = mapCtx.createImageData(size, size);
  const bumpData = bumpCtx.createImageData(size, size);

  // Stark lunar colors (dark basalt maria vs bright anorthosite highlands)
  const cMariaDeep     = [38, 36, 34];    // Deep basaltic plains (Oceanus Procellarum)
  const cMariaDark     = [58, 55, 52];    // Standard lunar mare
  const cMariaBorder   = [82, 79, 75];    // Transition shelf
  const cHighlandLow   = [125, 122, 118]; // Intermediate highland
  const cHighlandBright= [175, 172, 168]; // Bright lunar terrae
  const cCraterPeak    = [225, 222, 218]; // Blinding white impact rim / central peak

  const lerp = (a: number[], b: number[], t: number) => [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];

  for (let y = 0; y < size; y++) {
    const v = y / size;
    const lat = (0.5 - v) * Math.PI;
    const cosLat = Math.cos(lat);

    for (let x = 0; x < size; x++) {
      const u = x / size;
      const lon = (u - 0.5) * Math.PI * 2.0;

      const sx = cosLat * Math.sin(lon);
      const sy = Math.sin(lat);
      const sz = cosLat * Math.cos(lon);

      // Check distance to maria basins
      let basinFactor = 0;
      for (let i = 0; i < LUNAR_BASINS.length; i++) {
        const b = LUNAR_BASINS[i];
        const bx = Math.cos(b.lat) * Math.sin(b.lon);
        const by = Math.sin(b.lat);
        const bz = Math.cos(b.lat) * Math.cos(b.lon);
        const dist = Math.acos(Math.max(-1, Math.min(1, sx * bx + sy * by + sz * bz)));
        if (dist < b.r) {
          const f = Math.cos((dist / b.r) * Math.PI * 0.5);
          basinFactor = Math.max(basinFactor, f);
        }
      }

      // Multi-octave regolith fractal noise
      const highlandNoise = fbm3D(sx * 4.5, sy * 4.5, sz * 4.5, 6);
      const microDust = noise3D(sx * 48.0, sy * 48.0, sz * 48.0) * 0.08;

      let albedo = highlandNoise + microDust - basinFactor * 0.45;

      let col = cHighlandLow;
      let bump = 128;

      if (albedo < 0.30) {
        // Darkest Maria Basalt
        const t = Math.max(0, albedo / 0.30);
        col = lerp(cMariaDeep, cMariaDark, t);
        bump = Math.round(50 + t * 30);
      } else if (albedo < 0.48) {
        // Outer Maria Plains
        const t = (albedo - 0.30) / 0.18;
        col = lerp(cMariaDark, cMariaBorder, t);
        bump = Math.round(80 + t * 35);
      } else if (albedo < 0.68) {
        // Highlands
        const t = (albedo - 0.48) / 0.20;
        col = lerp(cHighlandLow, cHighlandBright, t);
        bump = Math.round(115 + t * 65);
      } else {
        // Bright Ridge Peaks
        const t = Math.min(1.0, (albedo - 0.68) / 0.32);
        col = lerp(cHighlandBright, cCraterPeak, t);
        bump = Math.round(180 + t * 75);
      }

      // ─── ORGANIC CRATER EJECTA BLANKETS (No geometric spokes/asterisks) ───
      for (let i = 0; i < RAY_CRATERS.length; i++) {
        const rc = RAY_CRATERS[i];
        const rcx = Math.cos(rc.lat) * Math.sin(rc.lon);
        const rcy = Math.sin(rc.lat);
        const rcz = Math.cos(rc.lat) * Math.cos(rc.lon);
        const dist = Math.acos(Math.max(-1, Math.min(1, sx * rcx + sy * rcy + sz * rcz)));

        if (dist < 0.55) {
          // Asymmetric organic ejecta splash with continuous apron near rim
          const angle = Math.atan2(sy - rcy, sx - rcx);
          // 3D fractal noise completely warps angular direction to eliminate straight spoke lines
          const warp = fbm3D(sx * 14.0, sy * 14.0, sz * 14.0, 3) * 1.5;
          const streamer = Math.sin(angle * 5.0 + warp) * 0.45 + Math.sin(angle * 11.0 - warp * 1.8) * 0.25;
          const streamFactor = Math.max(0, streamer + 0.35);

          const innerApron = Math.exp(-dist * 14.0) * 0.7; // Bright continuous ring right around crater
          const outerRays = Math.exp(-dist * 4.5) * Math.pow(streamFactor, 2.5) * 0.35;
          const regolithNoise = noise3D(sx * 36.0, sy * 36.0, sz * 36.0) * 0.12;

          const ejectaBrightness = Math.min(0.65, innerApron + outerRays + regolithNoise);

          if (ejectaBrightness > 0.04) {
            col = lerp(col, cCraterPeak, ejectaBrightness);
            bump = Math.min(255, Math.round(bump + ejectaBrightness * 30));
          }
        }
      }

      const idx = (y * size + x) * 4;
      mapData.data[idx]     = col[0];
      mapData.data[idx + 1] = col[1];
      mapData.data[idx + 2] = col[2];
      mapData.data[idx + 3] = 255;

      bumpData.data[idx]     = bump;
      bumpData.data[idx + 1] = bump;
      bumpData.data[idx + 2] = bump;
      bumpData.data[idx + 3] = 255;
    }
  }

  // Draw 40+ crisp circular impact crater rims with shadows into the bump and albedo maps
  for (let c = 0; c < 50; c++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const cr = 4 + Math.pow(Math.random(), 2.5) * 28;

    // Draw crater into mapCtx
    const grad = mapCtx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    grad.addColorStop(0, "rgba(25, 23, 21, 0.45)");
    grad.addColorStop(0.75, "rgba(50, 48, 45, 0.15)");
    grad.addColorStop(0.88, "rgba(230, 225, 220, 0.75)");
    grad.addColorStop(1.0, "rgba(160, 155, 150, 0)");

    mapCtx.fillStyle = grad;
    mapCtx.beginPath();
    mapCtx.arc(cx, cy, cr, 0, Math.PI * 2);
    mapCtx.fill();
  }

  mapCtx.putImageData(mapData, 0, 0);
  bumpCtx.putImageData(bumpData, 0, 0);

  const map = new CanvasTexture(mapCanvas);
  map.generateMipmaps = true;
  map.minFilter = LinearMipmapLinearFilter;
  map.anisotropy = IS_MOBILE ? 2 : 8;

  const bumpMap = new CanvasTexture(bumpCanvas);
  bumpMap.generateMipmaps = true;
  bumpMap.minFilter = LinearMipmapLinearFilter;
  bumpMap.anisotropy = IS_MOBILE ? 2 : 8;

  return { map, bumpMap };
};
