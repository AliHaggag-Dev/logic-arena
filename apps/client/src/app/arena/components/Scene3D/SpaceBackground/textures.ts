import { Color, CanvasTexture, LinearMipmapLinearFilter } from "three";
import { IS_MOBILE } from "./constants";
import { noise3D, fbm3D } from "./noise";

interface ProceduralPlanetTextures {
  map: CanvasTexture;
  bumpMap?: CanvasTexture;
}

export const createProceduralPlanetTexture = (type: string, colorIn: Color, colorOut: Color): ProceduralPlanetTextures => {
  const size = (type === "terrestrial" || type === "desert") ? 1024 : 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { map: new CanvasTexture(canvas) };

  const inHex = "#" + colorIn.getHexString();
  const outHex = "#" + colorOut.getHexString();

  const hasBumpMap = type === "lava" || type === "terrestrial" || type === "desert" || type === "ice";
  let bumpCanvas: HTMLCanvasElement | null = null;
  let bumpCtx: CanvasRenderingContext2D | null = null;
  let bumpImgData: ImageData | null = null;

  if (hasBumpMap) {
    bumpCanvas = document.createElement("canvas");
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    bumpCtx = bumpCanvas.getContext("2d");
    if (bumpCtx) {
      bumpImgData = bumpCtx.createImageData(size, size);
    }
  }

  if (type === "gas") {
    // Draw horizontal banded structure with noise
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, outHex);
    grad.addColorStop(0.25, inHex);
    grad.addColorStop(0.5, "#221100");
    grad.addColorStop(0.75, inHex);
    grad.addColorStop(1, outHex);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Add wavy lines/bands (storms)
    ctx.fillStyle = inHex;
    ctx.globalAlpha = 0.18;
    for (let y = 60; y < size - 60; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= size; x += 10) {
        const wave = Math.sin(x * 0.05 + y) * 10 + Math.cos(x * 0.02) * 6;
        ctx.lineTo(x, y + wave);
      }
      ctx.lineTo(size, size);
      ctx.lineTo(0, size);
      ctx.fill();
    }
  }
  else if (type === "lava") {
    // 1. Create a pixel-level heightmap and write it into ImageData
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    // Seeding offset to make each load unique but self-consistent
    const offsetX = Math.random() * 3000;
    const offsetY = Math.random() * 3000;
    const offsetZ = Math.random() * 3000;

    // Volcanic color palette (rich basalt plateaus, orange-red lava canals, bright yellow core highlights)
    const basaltDark = { r: 15, g: 12, b: 12 };
    const basaltMedium = { r: 35, g: 25, b: 25 };
    const coolingCrust = { r: 75, g: 25, b: 10 };
    const lavaRed = { r: 185, g: 30, b: 0 };
    const lavaOrange = { r: 245, g: 90, b: 0 };
    const lavaYellow = { r: 255, g: 190, b: 0 };

    const lerpColor = (c1: typeof basaltDark, c2: typeof basaltDark, t: number) => ({
      r: c1.r + (c2.r - c1.r) * t,
      g: c1.g + (c2.g - c1.g) * t,
      b: c1.b + (c2.b - c1.b) * t,
    });

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Cylindrical mapping for 100% seamless wrap
        const angle = (x / size) * Math.PI * 2;
        const R = 0.85;
        const nx = offsetX + Math.cos(angle) * R;
        const nz = offsetZ + Math.sin(angle) * R;
        const ny = offsetY + (y / size) * 2.2;

        // Fluid domain warping to simulate flowing lava channels
        const warpX = fbm3D(nx * 1.5, ny * 1.5, nz * 1.5, 3) * 0.35;
        const warpY = fbm3D(nx * 1.5 + 4.1, ny * 1.5 + 2.7, nz * 1.5 + 1.8, 3) * 0.35;
        const warpZ = fbm3D(nx * 1.5 + 8.2, ny * 1.5 + 0.5, nz * 1.5 + 6.3, 3) * 0.35;

        const wx = nx + warpX;
        const wy = ny + warpY;
        const wz = nz + warpZ;

        // Base tectonic rock heightmap
        const h = fbm3D(wx * 2.4, wy * 2.4, wz * 2.4, 5);

        // Volcanic cracks (high frequency ridge noise)
        const crackNoise = 1.0 - Math.abs(noise3D(wx * 7.5, wy * 7.5, wz * 7.5) - 0.5) * 2.0;

        // Combine heightmap and cracks for the thermal map
        const temp = h * 0.55 + crackNoise * 0.45;

        let r = 0, g = 0, b = 0;
        let bumpVal = 128;

        if (temp < 0.48) {
          // Dark basalt rock plates
          const t = temp / 0.48;
          const c = lerpColor(basaltDark, basaltMedium, t);
          r = c.r; g = c.g; b = c.b;

          const grain = noise3D(wx * 35.0, wy * 35.0, wz * 35.0) * 15;
          bumpVal = Math.round(200 + grain);
        } else if (temp < 0.56) {
          // Cooling rock crust margins
          const t = (temp - 0.48) / 0.08;
          const tSmooth = t * t * (3 - 2 * t);
          const c = lerpColor(basaltMedium, coolingCrust, tSmooth);
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(200 - tSmooth * 100);
        } else if (temp < 0.63) {
          // Deep glowing red lava veins
          const t = (temp - 0.56) / 0.07;
          const tSmooth = t * t * (3 - 2 * t);
          const c = lerpColor(coolingCrust, lavaRed, tSmooth);
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(100 - tSmooth * 30);
        } else if (temp < 0.76) {
          // Molten orange lava flows
          const t = (temp - 0.63) / 0.13;
          const tSmooth = t * t * (3 - 2 * t);
          const c = lerpColor(lavaRed, lavaOrange, tSmooth);
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(70 - tSmooth * 40);
        } else {
          // Bright yellow-orange magma cores
          const t = Math.min(1.0, (temp - 0.76) / 0.24);
          const tSmooth = Math.pow(t, 1.8);
          const c = lerpColor(lavaOrange, lavaYellow, tSmooth);
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(30 - tSmooth * 20);
        }

        // Add subtle rock grain details to the basalt plates
        if (temp < 0.52) {
          const grain = noise3D(wx * 35.0, wy * 35.0, wz * 35.0) * 12;
          r = Math.max(0, Math.min(255, r + grain - 6));
          g = Math.max(0, Math.min(255, g + grain - 6));
          b = Math.max(0, Math.min(255, b + grain - 6));
        }

        // Set pixel data
        const idx = (y * size + x) * 4;
        data[idx] = Math.round(r);
        data[idx + 1] = Math.round(g);
        data[idx + 2] = Math.round(b);
        data[idx + 3] = 255;

        if (bumpImgData) {
          bumpImgData.data[idx] = bumpVal;
          bumpImgData.data[idx + 1] = bumpVal;
          bumpImgData.data[idx + 2] = bumpVal;
          bumpImgData.data[idx + 3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  else if (type === "ice") {
    // Crystalline blue/white base
    const grad = ctx.createRadialGradient(size/2, size/2, 10, size/2, size/2, size/2);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.55, inHex);
    grad.addColorStop(1, outHex);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    if (bumpCtx) {
      bumpCtx.fillStyle = "#b4b4b4";
      bumpCtx.fillRect(0, 0, size, size);
    }

    // Frost fracture lines
    ctx.strokeStyle = "#f0fdfa";
    ctx.lineWidth = 1.8;
    ctx.globalAlpha = 0.75;

    if (bumpCtx) {
      bumpCtx.strokeStyle = "#404040"; // deep recessed cracks
      bumpCtx.lineWidth = 2.2;
      bumpCtx.globalAlpha = 0.6;
    }

    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      if (bumpCtx) bumpCtx.beginPath();
      let x = Math.random() * size;
      let y = Math.random() * size;
      ctx.moveTo(x, y);
      if (bumpCtx) bumpCtx.moveTo(x, y);
      for (let j = 0; j < 7; j++) {
        x += (Math.random() - 0.5) * 85;
        y += (Math.random() - 0.5) * 85;
        ctx.lineTo(x, y);
        if (bumpCtx) bumpCtx.lineTo(x, y);
      }
      ctx.stroke();
      if (bumpCtx) bumpCtx.stroke();
    }
  }
  else if (type === "terrestrial") {
    // 1. Create a pixel-level heightmap and write it into ImageData
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    // Seeding offset to make each load unique but self-consistent
    const offsetX = Math.random() * 2000;
    const offsetY = Math.random() * 2000;
    const offsetZ = Math.random() * 2000;

    // Define color stops (RGB) - curated premium palette
    const oceanDeep = { r: 6, g: 18, b: 54 };
    const oceanShallow = { r: 12, g: 45, b: 96 };
    const shelf = { r: 25, g: 125, b: 165 };
    const sand = { r: 210, g: 180, b: 125 };
    const grass = { r: 34, g: 139, b: 34 };
    const forest = { r: 18, g: 94, b: 40 };
    const mountain = { r: 105, g: 90, b: 80 };
    const snow = { r: 248, g: 248, b: 255 };

    const lerpColor = (c1: typeof oceanDeep, c2: typeof oceanDeep, t: number) => ({
      r: c1.r + (c2.r - c1.r) * t,
      g: c1.g + (c2.g - c1.g) * t,
      b: c1.b + (c2.b - c1.b) * t,
    });

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Map horizontal x to circle coordinates in 3D space to guarantee 100% seamless wrapping
        const angle = (x / size) * Math.PI * 2;
        const R = 0.85; // Cylinder radius for noise space
        const nx = offsetX + Math.cos(angle) * R;
        const nz = offsetZ + Math.sin(angle) * R;
        const ny = offsetY + (y / size) * 2.2; // Vertical coordinate remains linear

        // 6 octaves of noise for extremely crisp continental details
        const h = fbm3D(nx * 2.8, ny * 2.8, nz * 2.8, 6);

        // Add a high-frequency micro-noise perturbation to create jagged, realistic coastlines and biomes
        const hPerturbed = h + noise3D(nx * 16.0, ny * 16.0, nz * 16.0) * 0.012;

        let r = 0, g = 0, b = 0;
        let bumpVal = 128;

        if (hPerturbed < 0.45) {
          const t = hPerturbed / 0.45;
          const c = lerpColor(oceanDeep, oceanShallow, Math.pow(t, 1.8)); // darker deep oceans
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(hPerturbed * 100);
        } else if (hPerturbed < 0.48) {
          const t = (hPerturbed - 0.45) / 0.03;
          const c = lerpColor(oceanShallow, shelf, t);
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(hPerturbed * 100);
        } else if (hPerturbed < 0.50) {
          const t = (hPerturbed - 0.48) / 0.02;
          const c = lerpColor(shelf, sand, t);
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(100 + t * 10);
        } else if (hPerturbed < 0.52) {
          const t = (hPerturbed - 0.50) / 0.02;
          const c = lerpColor(sand, grass, t);
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(110 + t * 10);
        } else if (hPerturbed < 0.65) {
          const t = (hPerturbed - 0.52) / 0.13;
          const c = lerpColor(grass, forest, t);
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(120 + t * 20);
        } else if (hPerturbed < 0.78) {
          const t = (hPerturbed - 0.65) / 0.13;
          const c = lerpColor(forest, mountain, t);
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(140 + t * 70);
        } else {
          const t = Math.min(1.0, (hPerturbed - 0.78) / 0.22);
          const c = lerpColor(mountain, snow, t);
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(210 + t * 45);
        }

        // Polar cap blending with fractal borders using 3D noise (seamless wrapping)
        const iceNoise = noise3D(nx * 3.5, ny * 3.5, nz * 3.5) * 0.03;
        const latitude = Math.abs(y - size / 2) / (size / 2) + iceNoise;
        if (latitude > 0.78) {
          const iceBlend = Math.min(1.0, (latitude - 0.78) / 0.15);
          r = r * (1 - iceBlend) + 252 * iceBlend;
          g = g * (1 - iceBlend) + 252 * iceBlend;
          b = b * (1 - iceBlend) + 252 * iceBlend;

          bumpVal = Math.round(bumpVal * (1 - iceBlend) + 180 * iceBlend);
        }

        // Set pixel data
        const idx = (y * size + x) * 4;
        data[idx] = Math.round(r);
        data[idx + 1] = Math.round(g);
        data[idx + 2] = Math.round(b);
        data[idx + 3] = 255;

        if (bumpImgData) {
          bumpImgData.data[idx] = bumpVal;
          bumpImgData.data[idx + 1] = bumpVal;
          bumpImgData.data[idx + 2] = bumpVal;
          bumpImgData.data[idx + 3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  else if (type === "desert") {
    // 1. Create a pixel-level heightmap and write it into ImageData
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    // Seeding offset to make each load unique but self-consistent
    const offsetX = Math.random() * 2000;
    const offsetY = Math.random() * 2000;
    const offsetZ = Math.random() * 2000;

    // Define desert color palette (terracotta canyons, bright golden dunes, wind-swept sand)
    const canyonDark = { r: 90, g: 38, b: 12 };
    const terracotta = { r: 165, g: 70, b: 20 };
    const duneOrange = { r: 215, g: 105, b: 20 };
    const sandGold = { r: 235, g: 170, b: 40 };
    const sandLight = { r: 245, g: 208, b: 105 };
    const dustStorm = { r: 250, g: 232, b: 175 };

    const lerpColor = (c1: typeof canyonDark, c2: typeof canyonDark, t: number) => ({
      r: c1.r + (c2.r - c1.r) * t,
      g: c1.g + (c2.g - c1.g) * t,
      b: c1.b + (c2.b - c1.b) * t,
    });

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Cylindrical mapping for 100% seamless wrap
        const angle = (x / size) * Math.PI * 2;
        const R = 0.85;
        const nx = offsetX + Math.cos(angle) * R;
        const nz = offsetZ + Math.sin(angle) * R;
        const ny = offsetY + (y / size) * 2.2;

        // Domain warping: warp coords using low-frequency FBM to create giant swirling wind streams / cyclones
        const warpX = fbm3D(nx * 2.2, ny * 2.2, nz * 2.2, 4) * 0.40;
        const warpY = fbm3D(nx * 2.2 + 5.2, ny * 2.2 + 1.3, nz * 2.2 + 2.7, 4) * 0.40;
        const warpZ = fbm3D(nx * 2.2 + 1.1, ny * 2.2 + 4.8, nz * 2.2 + 9.1, 4) * 0.40;

        const wx = nx + warpX;
        const wy = ny + warpY;
        const wz = nz + warpZ;

        // Primary landscape height map using warped coordinates (6 octaves for 2K-like resolution detail)
        const h = fbm3D(wx * 3.5, wy * 3.5, wz * 3.5, 6);

        // Add fine-grained high-frequency wind ripples (sharp ridges using 1.0 - abs(sin) pattern)
        const ripples = (1.0 - Math.abs(Math.sin(wx * 60 + wy * 24 + wz * 16))) * 0.12;
        const hFinal = h + ripples;

        // High contrast contrast-shaping on the color ramps
        let r = 0, g = 0, b = 0;
        let bumpVal = 128;

        if (hFinal < 0.32) {
          const t = hFinal / 0.32;
          const tSmooth = Math.pow(t, 2.2); // sharp drop-off to dark canyon
          const c = lerpColor(canyonDark, terracotta, tSmooth);
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(hFinal * 120);
        } else if (hFinal < 0.48) {
          const t = (hFinal - 0.32) / 0.16;
          const tSmooth = t * t * (3 - 2 * t);
          const c = lerpColor(terracotta, duneOrange, tSmooth);
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(60 + tSmooth * 60);
        } else if (hFinal < 0.62) {
          const t = (hFinal - 0.48) / 0.14;
          const tSmooth = t * t * (3 - 2 * t);
          const c = lerpColor(duneOrange, sandGold, tSmooth);
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(120 + tSmooth * 40);
        } else if (hFinal < 0.78) {
          const t = (hFinal - 0.62) / 0.16;
          const tSmooth = t * t * (3 - 2 * t);
          const c = lerpColor(sandGold, sandLight, tSmooth);
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(160 + tSmooth * 40);
        } else {
          const t = Math.min(1.0, (hFinal - 0.78) / 0.22);
          const tSmooth = Math.pow(t, 1.5);
          const c = lerpColor(sandLight, dustStorm, tSmooth);
          r = c.r; g = c.g; b = c.b;

          bumpVal = Math.round(200 + tSmooth * 40);
        }

        // Gritty sand texture overlay for 2K fidelity
        const grit = noise3D(wx * 28.0, wy * 28.0, wz * 28.0) * 22; // 0 to 22 gray scale offset
        r = Math.max(0, Math.min(255, r + grit - 11));
        g = Math.max(0, Math.min(255, g + grit - 11));
        b = Math.max(0, Math.min(255, b + grit - 11));

        // Set pixel data
        const idx = (y * size + x) * 4;
        data[idx] = Math.round(r);
        data[idx + 1] = Math.round(g);
        data[idx + 2] = Math.round(b);
        data[idx + 3] = 255;

        if (bumpImgData) {
          bumpImgData.data[idx] = bumpVal;
          bumpImgData.data[idx + 1] = bumpVal;
          bumpImgData.data[idx + 2] = bumpVal;
          bumpImgData.data[idx + 3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }
  else { // plasma/energy
    ctx.fillStyle = "#04000b";
    ctx.fillRect(0, 0, size, size);

    // Filament flares
    const grad = ctx.createRadialGradient(size/2, size/2, 5, size/2, size/2, size/2);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.3, inHex);
    grad.addColorStop(0.7, outHex);
    grad.addColorStop(1, "#04000b");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Solar flares/sparks
    ctx.fillStyle = inHex;
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 35; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * size, Math.random() * size, Math.random() * 9 + 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.anisotropy = IS_MOBILE ? 2 : 8;

  let bumpTexture: CanvasTexture | undefined = undefined;
  if (bumpCanvas && bumpCtx && bumpImgData) {
    bumpCtx.putImageData(bumpImgData, 0, 0);
    bumpTexture = new CanvasTexture(bumpCanvas);
    bumpTexture.generateMipmaps = true;
    bumpTexture.minFilter = LinearMipmapLinearFilter;
    bumpTexture.anisotropy = IS_MOBILE ? 2 : 8;
  }

  return { map: texture, bumpMap: bumpTexture };
};

export const createProceduralCloudTexture = (): CanvasTexture => {
  const isMobile = typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);
  const size = isMobile ? 256 : 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new CanvasTexture(canvas);

  ctx.clearRect(0, 0, size, size);

  // Set blur for wispy clouds (scaled for resolution)
  ctx.filter = `blur(${isMobile ? 9 : 18}px)`;
  ctx.fillStyle = "#ffffff";
  
  // Helper to draw a horizontally wrapped circle to keep it 100% seamless
  const drawWrappedCloud = (cx: number, cy: number, r: number, alpha: number) => {
    const draws = [cx, cx - size, cx + size];
    draws.forEach(dx => {
      if (dx + r < 0 || dx - r > size) return;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(dx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Swirling tails (wrapped as well)
      for (let k = 0; k < 5; k++) {
        const tx = dx + (k + 1) * r * 0.7;
        const ty = cy + (Math.random() - 0.5) * (isMobile ? 12 : 25);
        const tr = r * (1 - k * 0.18);
        
        const tailDraws = [tx, tx - size, tx + size];
        tailDraws.forEach(tdx => {
          if (tdx + tr < 0 || tdx - tr > size) return;
          ctx.beginPath();
          ctx.arc(tdx, ty, tr, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    });
  };

  // Draw 18 cloud clusters (slightly reduced from 20 for better earth feature visibility)
  for (let i = 0; i < 18; i++) {
    const alpha = 0.08 + Math.random() * 0.22;
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = (isMobile ? 18 : 35) + Math.random() * (isMobile ? 28 : 55); // scaled for size
    drawWrappedCloud(x, y, r, alpha);
  }

  // Restore global alpha
  ctx.globalAlpha = 1.0;

  const texture = new CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.anisotropy = 8;
  return texture;
};

export interface ProceduralMoonTextures {
  map: CanvasTexture;
  bumpMap: CanvasTexture;
}

export const createProceduralMoonTextureColored = (
  planetType: string,
  moonIndex: number,
  baseColorStr: string
): ProceduralMoonTextures => {
  const isMobile = typeof window !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);
  const size = 256; // 256 is perfect for moon textures
  
  const mapCanvas = document.createElement("canvas");
  mapCanvas.width = size;
  mapCanvas.height = size;
  const mapCtx = mapCanvas.getContext("2d");

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext("2d");

  if (!mapCtx || !bumpCtx) {
    const fallbackMap = new CanvasTexture(mapCanvas);
    const fallbackBump = new CanvasTexture(bumpCanvas);
    return { map: fallbackMap, bumpMap: fallbackBump };
  }

  const heights = new Float32Array(size * size);
  const mapImgData = mapCtx.createImageData(size, size);
  const bumpImgData = bumpCtx.createImageData(size, size);

  // Seed offset based on moon index so they have unique layouts
  const seedOffset = moonIndex * 1500;
  const offsetX = Math.random() * 4000 + seedOffset;
  const offsetY = Math.random() * 4000 + seedOffset;
  const offsetZ = Math.random() * 4000 + seedOffset;

  // Determine if it is a volcanic moon (Lava planet second moon)
  const isVolcanic = planetType === "lava" && moonIndex === 1;

  const lerpColor = (c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }, t: number) => ({
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t,
  });

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const angle = (x / size) * Math.PI * 2;
      const R = 0.8;
      const nx = offsetX + Math.cos(angle) * R;
      const nz = offsetZ + Math.sin(angle) * R;
      const ny = offsetY + (y / size) * 2.0;

      // 5 octaves of FBM for detailed lunar crust
      const n = fbm3D(nx * 2.2, ny * 2.2, nz * 2.2, 5);
      heights[y * size + x] = n;

      let r = 0, g = 0, b = 0;
      let bump = 0.5;

      if (isVolcanic) {
        // Volcanic moon (Io-like) with sulfurous colors
        const nSulfur = fbm3D(nx * 2.8, ny * 2.8, nz * 2.8, 4);
        
        // Colors: warm cream, bright sulfur yellow, peach orange, and dark volcanic rock
        const cream = { r: 245, g: 242, b: 228 };
        const sulfurYellow = { r: 218, g: 188, b: 38 };
        const orangePeach = { r: 220, g: 120, b: 50 };
        const darkBasalt = { r: 35, g: 30, b: 25 };

        if (nSulfur < 0.38) {
          const t = nSulfur / 0.38;
          const c = lerpColor(cream, sulfurYellow, t);
          r = c.r; g = c.g; b = c.b;
        } else if (nSulfur < 0.72) {
          const t = (nSulfur - 0.38) / 0.34;
          const c = lerpColor(sulfurYellow, orangePeach, t);
          r = c.r; g = c.g; b = c.b;
        } else {
          const t = Math.min(1.0, (nSulfur - 0.72) / 0.28);
          const c = lerpColor(orangePeach, darkBasalt, t);
          r = c.r; g = c.g; b = c.b;
        }

        // Add small sulfur/green chemical color patches
        const greenNoise = noise3D(nx * 5.0, ny * 5.0, nz * 5.0);
        if (greenNoise > 0.68) {
          r = Math.max(0, r - 35);
          g = Math.min(255, g + 25);
          b = Math.max(0, b - 20);
        }

        bump = n * 0.7;
      } else {
        // Standard cratered/dusty moon (grey or custom base color)
        const baseColor = new Color(baseColorStr);
        const rBase = baseColor.r * 255;
        const gBase = baseColor.g * 255;
        const bBase = baseColor.b * 255;

        if (n < 0.45) {
          // Dark maria plains
          const t = n / 0.45;
          const factor = 0.45 + t * 0.25;
          r = rBase * factor;
          g = gBase * factor;
          b = bBase * factor;
          bump = 0.25 + t * 0.2;
        } else {
          // Bright highlands
          const t = (n - 0.45) / 0.55;
          const factor = 0.7 + t * 0.4;
          r = Math.min(255, rBase * factor);
          g = Math.min(255, gBase * factor);
          b = Math.min(255, bBase * factor);
          bump = 0.45 + t * 0.4;
        }
      }

      // Fine-grained dust noise
      const grain = (Math.random() - 0.5) * 6;
      r = Math.max(0, Math.min(255, r + grain));
      g = Math.max(0, Math.min(255, g + grain));
      b = Math.max(0, Math.min(255, b + grain));

      const idx = (y * size + x) * 4;
      mapImgData.data[idx] = Math.round(r);
      mapImgData.data[idx + 1] = Math.round(g);
      mapImgData.data[idx + 2] = Math.round(b);
      mapImgData.data[idx + 3] = 255;

      const bumpVal = Math.max(0, Math.min(255, Math.round(bump * 255)));
      bumpImgData.data[idx] = bumpVal;
      bumpImgData.data[idx + 1] = bumpVal;
      bumpImgData.data[idx + 2] = bumpVal;
      bumpImgData.data[idx + 3] = 255;
    }
  }

  mapCtx.putImageData(mapImgData, 0, 0);
  bumpCtx.putImageData(bumpImgData, 0, 0);

  // 2. Draw craters/calderas
  const craterCount = isMobile ? 12 : 24;
  for (let i = 0; i < craterCount; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;

    // Prioritize highlands for cratered moons (maria are smoother)
    if (!isVolcanic) {
      const xIdx = Math.floor(cx) % size;
      const yIdx = Math.floor(cy) % size;
      const h = heights[yIdx * size + xIdx];
      if (h < 0.45 && Math.random() > 0.15) {
        continue;
      }
    }

    const r = (isMobile ? 2.5 : 4.0) + Math.random() * (isMobile ? 7.0 : 12.0);

    const draws = [cx, cx - size, cx + size];
    draws.forEach(dx => {
      if (dx + r < 0 || dx - r > size) return;

      if (isVolcanic) {
        // Volcanic moon caldera: dark red/black venting center
        const grad = mapCtx.createRadialGradient(dx, cy, r * 0.25, dx, cy, r);
        grad.addColorStop(0, "#0c0a08"); // deep black core
        grad.addColorStop(0.3, "#3d140b"); // deep volcanic red/brown
        grad.addColorStop(0.75, "#80220d"); // burnt orange margin
        grad.addColorStop(1, "rgba(220, 120, 50, 0)"); // fade to surface

        mapCtx.fillStyle = grad;
        mapCtx.globalAlpha = 0.9;
        mapCtx.beginPath();
        mapCtx.arc(dx, cy, r, 0, Math.PI * 2);
        mapCtx.fill();

        // Sulfur venting halo ring
        mapCtx.strokeStyle = "#d1ad1c";
        mapCtx.lineWidth = r * 0.28;
        mapCtx.globalAlpha = 0.55;
        mapCtx.beginPath();
        mapCtx.arc(dx, cy, r * 1.15, 0, Math.PI * 2);
        mapCtx.stroke();

        // Caldera depression on bump map
        const bumpGrad = bumpCtx.createRadialGradient(dx, cy, 0, dx, cy, r * 1.35);
        bumpGrad.addColorStop(0, "rgba(0, 0, 0, 0.8)"); // deep crater bowl
        bumpGrad.addColorStop(0.85, "rgba(60, 60, 60, 0.2)");
        bumpGrad.addColorStop(0.95, "rgba(255, 255, 255, 0.45)"); // raised caldera rim
        bumpGrad.addColorStop(1.0, "rgba(128, 128, 128, 0)");

        bumpCtx.fillStyle = bumpGrad;
        bumpCtx.globalAlpha = 0.75;
        bumpCtx.beginPath();
        bumpCtx.arc(dx, cy, r * 1.35, 0, Math.PI * 2);
        bumpCtx.fill();
      } else {
        // Standard crater with shadow/highlight depth
        const grad = mapCtx.createLinearGradient(dx - r, cy - r, dx + r, cy + r);
        grad.addColorStop(0, "rgba(10, 10, 10, 0.7)");
        grad.addColorStop(0.5, "rgba(40, 40, 40, 0.15)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0.3)");

        mapCtx.fillStyle = grad;
        mapCtx.globalAlpha = 0.8;
        mapCtx.beginPath();
        mapCtx.arc(dx, cy, r, 0, Math.PI * 2);
        mapCtx.fill();

        const shadowOffset = r * 0.05;
        // Shadow rim (top-left)
        mapCtx.strokeStyle = "#000000";
        mapCtx.lineWidth = Math.max(0.6, r * 0.12);
        mapCtx.globalAlpha = 0.55;
        mapCtx.beginPath();
        mapCtx.arc(dx - shadowOffset, cy - shadowOffset, r, Math.PI * 0.75, Math.PI * 1.75);
        mapCtx.stroke();

        // Highlight rim (bottom-right)
        mapCtx.strokeStyle = "#ffffff";
        mapCtx.lineWidth = Math.max(0.6, r * 0.12);
        mapCtx.globalAlpha = 0.65;
        mapCtx.beginPath();
        mapCtx.arc(dx + shadowOffset, cy + shadowOffset, r, Math.PI * 1.75, Math.PI * 0.75);
        mapCtx.stroke();

        // Crater depression on bump map
        const bumpGrad = bumpCtx.createRadialGradient(dx, cy, 0, dx, cy, r * 1.3);
        bumpGrad.addColorStop(0, "rgba(15, 15, 15, 0.75)"); // crater floor
        bumpGrad.addColorStop(0.75, "rgba(40, 40, 40, 0.15)");
        bumpGrad.addColorStop(0.92, "rgba(245, 245, 245, 0.6)"); // raised rim
        bumpGrad.addColorStop(1.0, "rgba(128, 128, 128, 0)");

        bumpCtx.fillStyle = bumpGrad;
        bumpCtx.globalAlpha = 0.7;
        bumpCtx.beginPath();
        bumpCtx.arc(dx, cy, r * 1.3, 0, Math.PI * 2);
        bumpCtx.fill();

        // Impact rays for larger craters
        if (r > 6.5 && Math.random() > 0.4) {
          mapCtx.strokeStyle = "#ffffff";
          mapCtx.lineWidth = 0.5;
          mapCtx.globalAlpha = 0.28;
          const rayCount = 6 + Math.floor(Math.random() * 6);
          for (let j = 0; j < rayCount; j++) {
            const angle = (j / rayCount) * Math.PI * 2 + Math.random() * 0.3;
            const length = r * (2.0 + Math.random() * 2.2);
            mapCtx.beginPath();
            mapCtx.moveTo(dx, cy);
            mapCtx.lineTo(dx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
            mapCtx.stroke();

            // Bump map ray
            bumpCtx.strokeStyle = "#ffffff";
            bumpCtx.lineWidth = 0.3;
            bumpCtx.globalAlpha = 0.12;
            bumpCtx.beginPath();
            bumpCtx.moveTo(dx, cy);
            bumpCtx.lineTo(dx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
            bumpCtx.stroke();
          }
        }
      }
    });
  }

  // Restore canvas properties
  mapCtx.globalAlpha = 1.0;
  bumpCtx.globalAlpha = 1.0;

  const mapTex = new CanvasTexture(mapCanvas);
  mapTex.generateMipmaps = true;
  mapTex.minFilter = LinearMipmapLinearFilter;
  mapTex.anisotropy = 4;

  const bumpTex = new CanvasTexture(bumpCanvas);
  bumpTex.generateMipmaps = true;
  bumpTex.minFilter = LinearMipmapLinearFilter;
  bumpTex.anisotropy = 4;

  return { map: mapTex, bumpMap: bumpTex };
};

export const createProceduralRingTexture = (color: Color): CanvasTexture => {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new CanvasTexture(canvas);

  ctx.clearRect(0, 0, size, size);

  const hex = "#" + color.getHexString();
  const cx = size / 2;
  const cy = size / 2;

  // Draw concentric rings from radius 45 to 120 (aligned to planar projected UV map)
  for (let r = 45; r < 120; r++) {
    let alpha = 0;
    
    // Cassini division gap
    if (r >= 80 && r <= 85) {
      alpha = 0.01 + Math.random() * 0.015;
    } else {
      // Create organic banding using sine waves and noise
      const bandPattern = Math.sin(r * 0.45) * Math.cos(r * 0.15) * 0.5 + 0.5; // range 0 to 1
      alpha = 0.05 + bandPattern * 0.28;
      
      // Add fine sub-bands/lines
      if (Math.sin(r * 1.8) > 0.7) {
        alpha += 0.12;
      }
      // Random gaps
      if (r === 65 || r === 72 || r === 98 || r === 108) {
        alpha = 0.02;
      }
    }

    // Clip alpha
    alpha = Math.max(0.0, Math.min(0.55, alpha));

    ctx.strokeStyle = hex;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Restore global alpha
  ctx.globalAlpha = 1.0;

  const texture = new CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.anisotropy = IS_MOBILE ? 2 : 8;
  return texture;
};
