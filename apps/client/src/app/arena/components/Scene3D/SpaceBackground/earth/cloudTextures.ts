import { CanvasTexture, LinearMipmapLinearFilter } from "three";
import { IS_MOBILE } from "../constants";
import { fbm3D } from "../noise";
import { TEXTURE_WIDTH, TEXTURE_HEIGHT } from "./constants";

// ---------------------------------------------------------------------------
// PROCEDURAL CLOUD COVER GENERATOR (Realistic Swirling Storms & ITCZ)
// ---------------------------------------------------------------------------
export const createEarthCloudTexture = (isUpper = false): CanvasTexture => {
  const W = TEXTURE_WIDTH;
  const H = TEXTURE_HEIGHT;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(W, H);

  const octaves = isUpper ? 3 : 5;
  const freq = isUpper ? 3.8 : 2.6;

  for (let y = 0; y < H; y++) {
    const v = y / H;
    const lat = (0.5 - v) * Math.PI;
    const cosLat = Math.cos(lat);
    const absLatNorm = Math.abs(lat) / (Math.PI * 0.5);

    // Tropical ITCZ convective cloud band (equator) + mid-latitude storm tracks
    const itcz = Math.exp(-Math.pow(absLatNorm / 0.12, 2.0)) * 0.35;
    const stormTracks = Math.exp(-Math.pow((absLatNorm - 0.45) / 0.16, 2.0)) * 0.28;

    for (let x = 0; x < W; x++) {
      const u = x / W;
      const lon = (u - 0.5) * Math.PI * 2.0;

      const sx = cosLat * Math.sin(lon);
      const sy = Math.sin(lat);
      const sz = cosLat * Math.cos(lon);

      // Swirling cyclone domain warping
      const swirlX = fbm3D(sx * 1.8, sy * 1.8, sz * 1.8, 3) * 0.35;
      const swirlY = fbm3D(sx * 1.8 + 3.1, sy * 1.8 + 1.2, sz * 1.8 + 4.5, 3) * 0.35;
      const swirlZ = fbm3D(sx * 1.8 + 6.2, sy * 1.8 + 5.3, sz * 1.8 + 2.1, 3) * 0.35;

      const wx = sx + swirlX;
      const wy = sy + swirlY;
      const wz = sz + swirlZ;

      const n = fbm3D(wx * freq, wy * freq, wz * freq, octaves);
      const cloudThreshold = isUpper ? 0.62 : 0.52;
      const cloudValue = n * 0.88 + itcz * 0.3 + stormTracks * 0.24 - cloudThreshold;

      let alpha = 0;
      if (cloudValue > 0) {
        // Smooth exponential cloud density with wispy fringes
        alpha = Math.min(235, Math.round(Math.pow(cloudValue / 0.46, 1.5) * 235));
      }

      const idx = (y * W + x) * 4;
      imgData.data[idx]     = 255;
      imgData.data[idx + 1] = 255;
      imgData.data[idx + 2] = 255;
      imgData.data[idx + 3] = isUpper ? Math.round(alpha * 0.40) : alpha;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  const tex = new CanvasTexture(canvas);
  tex.generateMipmaps = true;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.anisotropy = IS_MOBILE ? 2 : 8;
  return tex;
};
