import { CanvasTexture, LinearMipmapLinearFilter } from "three";
import { noise3D, fbm3D } from "../noise";
import { IS_MOBILE } from "../constants";

export interface MoonTextureResult {
  map: CanvasTexture;
  bumpMap: CanvasTexture;
}

/**
 * Creates photorealistic procedural textures for the two moons:
 * - "sulfur" (Pyralis): Io-style volcanic sulfur moon with smooth sulfur plains,
 *   warm orange volcanic deposits, and dark caldera vents.
 * - "lunar" (Umbrix): Authentic lunar cratered moon with basalt maria plains,
 *   silvery anorthosite highlands, and radial ejecta impact craters.
 */
export const createVolcanicMoonTexture = (type: "sulfur" | "lunar"): MoonTextureResult => {
  const size = IS_MOBILE ? 256 : 512;

  const mapCanvas = document.createElement("canvas");
  mapCanvas.width = size;
  mapCanvas.height = size;
  const mapCtx = mapCanvas.getContext("2d")!;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bumpCtx = bumpCanvas.getContext("2d")!;

  const mapData = mapCtx.createImageData(size, size);
  const bumpData = bumpCtx.createImageData(size, size);

  const lerp = (c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] => [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ];

  if (type === "sulfur") {
    // ═══════════════════════════════════════════════════════════════════════
    // MOON 1: PYRALIS — IO-STYLE VOLCANIC SULFUR MOON
    // Natural, creamy sulfur yellow, warm peach/orange deposits, dark vents
    // ═══════════════════════════════════════════════════════════════════════
    const cCream: [number, number, number]       = [238, 228, 195]; // Pale sulfur frost
    const cSulfurYellow: [number, number, number]= [218, 172, 45];  // Pure sulfur plains
    const cWarmTerracotta: [number, number, number] = [185, 95, 32]; // Volcanic pyroclastic deposits
    const cDarkBasalt: [number, number, number]  = [42, 30, 22];    // Cooled silicate rock
    const cCalderaCore: [number, number, number] = [20, 14, 10];    // Active caldera pit

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

        // Smooth multi-octave fractal sulfur terrain
        const n1 = fbm3D(sx * 2.5 + 1.2, sy * 2.5 + 3.4, sz * 2.5 + 5.1, 4);
        const n2 = fbm3D(sx * 5.0 + 7.8, sy * 5.0 + 2.1, sz * 5.0 + 4.6, 3);
        const blend = n1 * 0.7 + n2 * 0.3;

        let col: [number, number, number];
        let bump = 128;

        if (blend < 0.35) {
          const t = blend / 0.35;
          col = lerp(cCream, cSulfurYellow, t);
          bump = Math.round(100 + t * 25);
        } else if (blend < 0.65) {
          const t = (blend - 0.35) / 0.30;
          col = lerp(cSulfurYellow, cWarmTerracotta, t);
          bump = Math.round(125 + t * 30);
        } else {
          const t = Math.min(1.0, (blend - 0.65) / 0.35);
          col = lerp(cWarmTerracotta, cDarkBasalt, t);
          bump = Math.round(155 + t * 40);
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

    mapCtx.putImageData(mapData, 0, 0);
    bumpCtx.putImageData(bumpData, 0, 0);

    // Calderas & volcanic vents
    const calderas = [
      { x: size * 0.25, y: size * 0.40, r: size * 0.06 },
      { x: size * 0.70, y: size * 0.35, r: size * 0.08 },
      { x: size * 0.45, y: size * 0.65, r: size * 0.05 },
      { x: size * 0.82, y: size * 0.72, r: size * 0.06 },
      { x: size * 0.15, y: size * 0.78, r: size * 0.04 },
    ];

    calderas.forEach(({ x, y, r }) => {
      // Dark caldera floor with burnt orange halo
      const grad = mapCtx.createRadialGradient(x, y, 0, x, y, r * 1.6);
      grad.addColorStop(0, "rgba(22, 14, 10, 0.95)");
      grad.addColorStop(0.45, "rgba(45, 25, 15, 0.90)");
      grad.addColorStop(0.75, "rgba(180, 85, 25, 0.65)");
      grad.addColorStop(1.0, "rgba(218, 172, 45, 0.0)");

      mapCtx.fillStyle = grad;
      mapCtx.beginPath();
      mapCtx.arc(x, y, r * 1.6, 0, Math.PI * 2);
      mapCtx.fill();

      // Bump depression
      const bumpGrad = bumpCtx.createRadialGradient(x, y, 0, x, y, r * 1.4);
      bumpGrad.addColorStop(0, "rgba(40, 40, 40, 0.8)");
      bumpGrad.addColorStop(0.7, "rgba(90, 90, 90, 0.3)");
      bumpGrad.addColorStop(1.0, "rgba(128, 128, 128, 0)");

      bumpCtx.fillStyle = bumpGrad;
      bumpCtx.beginPath();
      bumpCtx.arc(x, y, r * 1.4, 0, Math.PI * 2);
      bumpCtx.fill();
    });

  } else {
    // ═══════════════════════════════════════════════════════════════════════
    // MOON 2: UMBRIX — CRATERED LUNAR-GREY MOON
    // Basalt maria plains, silvery-grey highlands, bright crater ejecta
    // ═══════════════════════════════════════════════════════════════════════
    const cMariaDark: [number, number, number]     = [48, 46, 45];    // Dark basalt plains
    const cMariaMedium: [number, number, number]   = [72, 70, 68];    // Transition maria
    const cHighlandLow: [number, number, number]   = [120, 118, 116]; // Intermediate highlands
    const cHighlandBright: [number, number, number]= [168, 166, 164]; // Bright anorthosite
    const cCraterRim: [number, number, number]     = [220, 218, 216]; // Radiant crater rim & ejecta

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

        // Multi-octave lunar regolith
        const n1 = fbm3D(sx * 3.0, sy * 3.0, sz * 3.0, 5);
        const n2 = noise3D(sx * 16.0, sy * 16.0, sz * 16.0) * 0.12;
        const albedo = n1 + n2;

        let col: [number, number, number];
        let bump = 128;

        if (albedo < 0.38) {
          const t = albedo / 0.38;
          col = lerp(cMariaDark, cMariaMedium, t);
          bump = Math.round(65 + t * 35);
        } else if (albedo < 0.65) {
          const t = (albedo - 0.38) / 0.27;
          col = lerp(cMariaMedium, cHighlandLow, t);
          bump = Math.round(100 + t * 45);
        } else {
          const t = Math.min(1.0, (albedo - 0.65) / 0.35);
          col = lerp(cHighlandLow, cHighlandBright, t);
          bump = Math.round(145 + t * 65);
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

    mapCtx.putImageData(mapData, 0, 0);
    bumpCtx.putImageData(bumpData, 0, 0);

    // Impact craters with raised bright rims and radial ejecta
    const craters = [
      { x: size * 0.30, y: size * 0.35, r: size * 0.07, rays: true },
      { x: size * 0.68, y: size * 0.55, r: size * 0.09, rays: true },
      { x: size * 0.45, y: size * 0.75, r: size * 0.05, rays: false },
      { x: size * 0.85, y: size * 0.28, r: size * 0.06, rays: false },
      { x: size * 0.18, y: size * 0.68, r: size * 0.04, rays: false },
      { x: size * 0.52, y: size * 0.20, r: size * 0.05, rays: false },
    ];

    craters.forEach(({ x, y, r, rays }) => {
      // Crater bowl + raised bright rim
      const grad = mapCtx.createRadialGradient(x, y, r * 0.15, x, y, r * 1.2);
      grad.addColorStop(0, "rgba(35, 33, 32, 0.90)");   // shadow bowl
      grad.addColorStop(0.7, "rgba(85, 82, 80, 0.40)");
      grad.addColorStop(0.88, "rgba(235, 232, 230, 0.85)"); // bright crater rim
      grad.addColorStop(1.0, "rgba(168, 166, 164, 0.0)");

      mapCtx.fillStyle = grad;
      mapCtx.beginPath();
      mapCtx.arc(x, y, r * 1.2, 0, Math.PI * 2);
      mapCtx.fill();

      // Bump map crater depression and ridge
      const bumpGrad = bumpCtx.createRadialGradient(x, y, r * 0.2, x, y, r * 1.2);
      bumpGrad.addColorStop(0, "rgba(30, 30, 30, 0.85)");
      bumpGrad.addColorStop(0.75, "rgba(60, 60, 60, 0.2)");
      bumpGrad.addColorStop(0.90, "rgba(240, 240, 240, 0.7)");
      bumpGrad.addColorStop(1.0, "rgba(128, 128, 128, 0)");

      bumpCtx.fillStyle = bumpGrad;
      bumpCtx.beginPath();
      bumpCtx.arc(x, y, r * 1.2, 0, Math.PI * 2);
      bumpCtx.fill();

      // Organic radial ejecta rays for major craters
      if (rays) {
        mapCtx.strokeStyle = "rgba(225, 222, 220, 0.35)";
        mapCtx.lineWidth = 1.0;
        const rayCount = 8;
        for (let j = 0; j < rayCount; j++) {
          const angle = (j / rayCount) * Math.PI * 2 + (j % 2) * 0.2;
          const length = r * (2.2 + (j % 3) * 0.6);
          mapCtx.beginPath();
          mapCtx.moveTo(x, y);
          mapCtx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
          mapCtx.stroke();
        }
      }
    });
  }

  const map = new CanvasTexture(mapCanvas);
  map.generateMipmaps = true;
  map.minFilter = LinearMipmapLinearFilter;
  map.anisotropy = 4;

  const bumpMap = new CanvasTexture(bumpCanvas);
  bumpMap.generateMipmaps = true;
  bumpMap.minFilter = LinearMipmapLinearFilter;
  bumpMap.anisotropy = 4;

  return { map, bumpMap };
};
