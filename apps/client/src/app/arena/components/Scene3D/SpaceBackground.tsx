"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, Group, Mesh, AdditiveBlending, DoubleSide, Vector3, MeshBasicMaterial, PointsMaterial, Points, CanvasTexture, MeshStandardMaterial, BackSide, LinearMipmapLinearFilter } from "three";
import { Billboard, Stars } from "@react-three/drei";
import { MapTheme } from "../../types";
import { getGlobalAudioContext } from "../../../../context/SoundContext";

// ---------------------------------------------------------------------------
// AUDIO WEB AUDIO API PROCEDURAL GENERATORS (ASTEROID & SATELLITE PING)
// ---------------------------------------------------------------------------

const playExplosionSound = (distance: number) => {
  const ctx = getGlobalAudioContext();
  if (!ctx || ctx.state !== "running") return;

  // Simulate speed of sound delay (distance / speed)
  const speedOfSound = 220; // Units per second
  const delay = distance / speedOfSound;
  const playTime = ctx.currentTime + delay;

  // 1. Deep Sub-bass Impact Thump (low frequency sine sweep)
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, playTime);
  osc.frequency.exponentialRampToValueAtTime(10, playTime + 0.8);

  // 2. Volumetric noise explosion rumble/crackle
  const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    channelData[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(250, playTime);
  filter.frequency.exponentialRampToValueAtTime(30, playTime + 1.2);
  filter.Q.setValueAtTime(2.0, playTime);

  // Gain Node with distance attenuation
  const gainNode = ctx.createGain();
  const maxAudibleDist = 950;
  let vol = 1.0 - Math.min(distance / maxAudibleDist, 1.0);
  vol = Math.pow(vol, 1.5) * 0.95; // realistic sound attenuation curve

  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.setValueAtTime(vol, playTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, playTime + 1.4);

  // Connections
  osc.connect(gainNode);
  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(playTime);
  osc.stop(playTime + 1.5);
  noise.start(playTime);
  noise.stop(playTime + 1.5);
};

const playSatellitePing = (distance: number) => {
  const ctx = getGlobalAudioContext();
  if (!ctx || ctx.state !== "running") return;

  const now = ctx.currentTime;
  
  // 1. Deep, warm frequency (instead of high-pitch meow)
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(240, now); // Warm, deep sonar-like frequency (240Hz)

  // 2. Soft sub-harmonics for warmth
  const osc2 = ctx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(120, now); // Sub-bass octave (120Hz)

  // Biquad lowpass filter to muffle high-frequency transients and make it deep
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(350, now); // Cut off any buzz

  // Gain node with distance attenuation
  const gainNode = ctx.createGain();
  const maxAudibleDist = 380; // Highly localized (silent at the arena which is ~566 units away)
  
  let vol = 1.0 - Math.min(distance / maxAudibleDist, 1.0);
  vol = Math.pow(vol, 2.5) * 0.14; // Soft volume curve

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(vol, now + 0.05); // slightly slower attack (50ms) for soft hum
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8); // Fades over 0.8s (longer, smoother decay)

  // Soft echo loop to give space vacuum depth
  const delay = ctx.createDelay();
  delay.delayTime.value = 0.22; // 220ms echo

  const feedback = ctx.createGain();
  feedback.gain.value = 0.25; // quieter echo feedback loop

  gainNode.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);

  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gainNode);
  
  gainNode.connect(ctx.destination);
  delay.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.9);
  osc2.start(now);
  osc2.stop(now + 0.9);
};

interface SpaceBackgroundProps {
  mapTheme: MapTheme;
  graphicsQuality?: string;
}

// ---------------------------------------------------------------------------
// DETERMINISTIC 3D NOISE GENERATOR UTILITIES
// ---------------------------------------------------------------------------
const pTable = new Uint8Array(512);
const rTable = new Float32Array(256);

for (let i = 0; i < 256; i++) {
  pTable[i] = i;
  rTable[i] = Math.random();
}
for (let i = 255; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  const temp = pTable[i];
  pTable[i] = pTable[j];
  pTable[j] = temp;
}
for (let i = 0; i < 256; i++) {
  pTable[256 + i] = pTable[i];
}

const noise3D = (x: number, y: number, z: number): number => {
  const ix = Math.floor(x) & 255;
  const iy = Math.floor(y) & 255;
  const iz = Math.floor(z) & 255;

  const fx = x - Math.floor(x);
  const fy = y - Math.floor(y);
  const fz = z - Math.floor(z);

  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);
  const uz = fz * fz * (3.0 - 2.0 * fz);

  const ixf = (ix + 1) & 255;
  const iyf = (iy + 1) & 255;
  const izf = (iz + 1) & 255;

  const a = rTable[pTable[(pTable[(pTable[ix] + iy) & 255] + iz) & 255]];
  const b = rTable[pTable[(pTable[(pTable[ixf] + iy) & 255] + iz) & 255]];
  const c = rTable[pTable[(pTable[(pTable[ix] + iyf) & 255] + iz) & 255]];
  const d = rTable[pTable[(pTable[(pTable[ixf] + iyf) & 255] + iz) & 255]];

  const a2 = rTable[pTable[(pTable[(pTable[ix] + iy) & 255] + izf) & 255]];
  const b2 = rTable[pTable[(pTable[(pTable[ixf] + iy) & 255] + izf) & 255]];
  const c2 = rTable[pTable[(pTable[(pTable[ix] + iyf) & 255] + izf) & 255]];
  const d2 = rTable[pTable[(pTable[(pTable[ixf] + iyf) & 255] + izf) & 255]];

  const x00 = a + (b - a) * ux;
  const x10 = c + (d - c) * ux;
  const x01 = a2 + (b2 - a2) * ux;
  const x11 = c2 + (d2 - c2) * ux;

  const y0 = x00 + (x10 - x00) * uy;
  const y1 = x01 + (x11 - x01) * uy;

  return y0 + (y1 - y0) * uz;
};

const fbm3D = (x: number, y: number, z: number, octaves = 4): number => {
  let value = 0.0;
  let amplitude = 0.5;
  let frequency = 1.0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise3D(x * frequency, y * frequency, z * frequency);
    frequency *= 2.1;
    amplitude *= 0.5;
  }
  return value;
};

interface ProceduralPlanetTextures {
  map: CanvasTexture;
  bumpMap?: CanvasTexture;
}

const createProceduralPlanetTexture = (type: string, colorIn: Color, colorOut: Color): ProceduralPlanetTextures => {
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
  texture.anisotropy = 8;

  let bumpTexture: CanvasTexture | undefined = undefined;
  if (bumpCanvas && bumpCtx && bumpImgData) {
    bumpCtx.putImageData(bumpImgData, 0, 0);
    bumpTexture = new CanvasTexture(bumpCanvas);
    bumpTexture.generateMipmaps = true;
    bumpTexture.minFilter = LinearMipmapLinearFilter;
    bumpTexture.anisotropy = 8;
  }

  return { map: texture, bumpMap: bumpTexture };
};

const createProceduralCloudTexture = (): CanvasTexture => {
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

interface ProceduralMoonTextures {
  map: CanvasTexture;
  bumpMap: CanvasTexture;
}

const createProceduralMoonTextureColored = (
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

const createProceduralRingTexture = (color: Color): CanvasTexture => {
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
  texture.anisotropy = 8;
  return texture;
};

// ---------------------------------------------------------------------------
// UNIFIED PROCEDURAL PLANET ITEM COMPONENT
// ---------------------------------------------------------------------------

interface MoonConfig {
  scale: number;
  orbitRadius: number;
  orbitSpeed: number;
  color: string;
  ref: React.RefObject<Mesh | null>;
}

interface RockConfig {
  radius: number;
  speed: number;
  angle: number;
  yOffset: number;
  sizeScale: number;
  ref: React.RefObject<Mesh | null>;
}

interface ProceduralPlanetItemProps {
  pos: [number, number, number];
  scale: number;
  type: "gas" | "lava" | "ice" | "terrestrial" | "desert" | "plasma";
  color1: Color;
  color2: Color;
  rotationSpeed?: number;
  hasRings?: boolean;
  hasRockRings?: boolean;
  hasClouds?: boolean;
  moonsCount?: number;
  audioName?: "lava" | "ice" | "gas" | "desert" | "plasma" | "ocean" | "terrestrial";
}

const ProceduralPlanetItem = ({
  pos,
  scale,
  type,
  color1,
  color2,
  rotationSpeed = 0.02,
  hasRings = false,
  hasRockRings = false,
  hasClouds = false,
  moonsCount = 0,
  audioName,
}: ProceduralPlanetItemProps) => {
  const { camera } = useThree();
  const planetRef = useRef<Group>(null);
  const cloudRef = useRef<Mesh>(null);
  const innerStormRef1 = useRef<Mesh>(null);
  const innerStormRef2 = useRef<Mesh>(null);
  const audioNodesRef = useRef<{
    gainNode: GainNode;
    nodes: any[];
  } | null>(null);

  // Orbiting moons config
  const moons = useMemo<MoonConfig[]>(() => {
    const arr: MoonConfig[] = [];
    // Custom moon color palettes: volcanic orange-peach and dusty grey for Lava planet; bright silver-grey for others
    const moonColors = type === "lava"
      ? ["#b0b0b0", "#e59866", "#9e7a7a", "#dfa842"]
      : ["#ffffff", "#e5e5e5", "#d4d4d4", "#cc5533"];
    for (let i = 0; i < moonsCount; i++) {
      arr.push({
        scale: 0.22 + Math.random() * 0.05,       // Larger moon size (realistic relative to planet)
        orbitRadius: 2.6 + i * 0.8,               // Pushed out to avoid clipping
        orbitSpeed: 0.06 + Math.random() * 0.06,  // Slower, majestic orbital speed
        color: moonColors[i % moonColors.length],
        ref: React.createRef<Mesh>(),
      });
    }
    return arr;
  }, [moonsCount, type]);

  // Generate unique canvas textures
  const textures = useMemo(() => createProceduralPlanetTexture(type, color1, color2), [type, color1, color2]);
  const cloudTexture = useMemo(() => (hasClouds ? createProceduralCloudTexture() : null), [hasClouds]);
  const moonTextures = useMemo(() => {
    if (moonsCount <= 0) return [];
    return moons.map((moon, index) => createProceduralMoonTextureColored(type, index, moon.color));
  }, [moons, type, moonsCount]);
  const ringTexture = useMemo(() => (hasRings ? createProceduralRingTexture(color1) : null), [hasRings, color1]);

  // Dispose of old textures to prevent GPU memory leaks and WebGL context loss
  useEffect(() => {
    return () => {
      textures.map.dispose();
      if (textures.bumpMap) textures.bumpMap.dispose();
    };
  }, [textures]);

  useEffect(() => {
    return () => {
      if (cloudTexture) cloudTexture.dispose();
    };
  }, [cloudTexture]);

  useEffect(() => {
    return () => {
      moonTextures.forEach((texs) => {
        texs.map.dispose();
        texs.bumpMap.dispose();
      });
    };
  }, [moonTextures]);

  useEffect(() => {
    return () => {
      if (ringTexture) ringTexture.dispose();
    };
  }, [ringTexture]);

  // Orbiting rock ring particles config
  const rockRing = useMemo<RockConfig[]>(() => {
    if (!hasRockRings) return [];
    const count = 48;
    const arr: RockConfig[] = [];
    for (let i = 0; i < count; i++) {
      const radius = 2.0 + Math.random() * 0.95;
      const speed = 0.03 + Math.random() * 0.04;
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.12;
      const yOffset = (Math.random() - 0.5) * 0.06;
      const sizeScale = 0.02 + Math.random() * 0.03;
      arr.push({
        radius,
        speed,
        angle,
        yOffset,
        sizeScale,
        ref: React.createRef<Mesh>(),
      });
    }
    return arr;
  }, [hasRockRings]);

  // Dynamic sound loops
  useEffect(() => {
    if (!audioName) return;

    const ctx = getGlobalAudioContext();
    if (!ctx) return;

    const gainNode = ctx.createGain();
    gainNode.gain.value = 0; // Start silent
    gainNode.connect(ctx.destination);

    const nodes: any[] = [];

    try {
      if (audioName === "lava") {
        // 1. Base tectonic/magma rumble
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(55, ctx.currentTime);
        
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(120, ctx.currentTime);
        
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(1.5, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 35;
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        osc.connect(filter);
        filter.connect(gainNode);
        
        osc.start();
        lfo.start();
        nodes.push(osc, lfo, filter, lfoGain);

        // 2. Volcanic Moon (Io-like) electromagnetic sweeping hum
        const moonOsc = ctx.createOscillator();
        moonOsc.type = "sine";
        moonOsc.frequency.setValueAtTime(180, ctx.currentTime);

        const moonFilter = ctx.createBiquadFilter();
        moonFilter.type = "bandpass";
        moonFilter.frequency.setValueAtTime(450, ctx.currentTime);
        moonFilter.Q.setValueAtTime(4.0, ctx.currentTime);

        const moonSweepLfo = ctx.createOscillator();
        moonSweepLfo.frequency.setValueAtTime(0.08, ctx.currentTime); // slow orbital sweep (12s cycle)
        const moonSweepGain = ctx.createGain();
        moonSweepGain.gain.value = 150;

        const moonVolLfo = ctx.createOscillator();
        moonVolLfo.frequency.setValueAtTime(0.08, ctx.currentTime);
        const moonVolGain = ctx.createGain();
        moonVolGain.gain.value = 0.04; // quiet sweep overlay

        moonSweepLfo.connect(moonSweepGain);
        moonSweepGain.connect(moonOsc.frequency);
        moonVolLfo.connect(moonVolGain.gain);
        
        moonOsc.connect(moonFilter);
        moonFilter.connect(moonVolGain);
        moonVolGain.connect(gainNode);

        moonOsc.start();
        moonSweepLfo.start();
        moonVolLfo.start();
        nodes.push(moonOsc, moonFilter, moonSweepLfo, moonSweepGain, moonVolLfo, moonVolGain);
      }
      else if (audioName === "plasma") {
        // 1. Base solar hum
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.4, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 18;
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        const humGain = ctx.createGain();
        humGain.gain.value = 0.05;

        osc.connect(humGain);
        humGain.connect(gainNode);
        osc.start();
        lfo.start();
        nodes.push(osc, lfo, lfoGain, humGain);

        // 2. Solar static discharge crackles (rapid pulses)
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          channelData[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const hpFilter = ctx.createBiquadFilter();
        hpFilter.type = "highpass";
        hpFilter.frequency.setValueAtTime(1800, ctx.currentTime);

        const crackleLfo = ctx.createOscillator();
        crackleLfo.frequency.setValueAtTime(6.5, ctx.currentTime); // 6.5Hz crackle pulse
        const crackleGain = ctx.createGain();
        crackleGain.gain.value = 0;

        const lfoDepth = ctx.createGain();
        lfoDepth.gain.value = 0.015;

        crackleLfo.connect(lfoDepth.gain);
        noise.connect(hpFilter);
        hpFilter.connect(crackleGain);
        crackleGain.connect(gainNode);

        // Slow solar flare swells
        const swellLfo = ctx.createOscillator();
        swellLfo.frequency.setValueAtTime(0.12, ctx.currentTime);
        const swellGain = ctx.createGain();
        swellGain.gain.value = 0.012;

        swellLfo.connect(swellGain.gain);
        hpFilter.connect(swellGain);
        swellGain.connect(gainNode);

        noise.start();
        crackleLfo.start();
        swellLfo.start();
        nodes.push(noise, hpFilter, crackleLfo, crackleGain, lfoDepth, swellLfo, swellGain);
      }
      else if (audioName === "desert") {
        // 1. Dune rumble (low noise)
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          channelData[i] = Math.random() * 2 - 1;
        }
        const noise1 = ctx.createBufferSource();
        noise1.buffer = buffer;
        noise1.loop = true;

        const lowpass = ctx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.setValueAtTime(100, ctx.currentTime);

        const lowGain = ctx.createGain();
        lowGain.gain.value = 0.06;

        noise1.connect(lowpass);
        lowpass.connect(lowGain);
        lowGain.connect(gainNode);
        noise1.start();
        nodes.push(noise1, lowpass, lowGain);

        // 2. Whistling wind gusts (modulated high-Q bandpass noise)
        const noise2 = ctx.createBufferSource();
        noise2.buffer = buffer;
        noise2.loop = true;

        const windFilter = ctx.createBiquadFilter();
        windFilter.type = "bandpass";
        windFilter.frequency.setValueAtTime(450, ctx.currentTime);
        windFilter.Q.setValueAtTime(9.0, ctx.currentTime); // sharp resonance for whistling

        const windLfo = ctx.createOscillator();
        windLfo.frequency.setValueAtTime(0.18, ctx.currentTime); // wind gust cycles
        const windLfoGain = ctx.createGain();
        windLfoGain.gain.value = 220; // sweep whistling between 230Hz and 670Hz

        const windGain = ctx.createGain();
        windGain.gain.value = 0.04;

        windLfo.connect(windLfoGain);
        windLfoGain.connect(windFilter.frequency);
        noise2.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(gainNode);

        noise2.start();
        windLfo.start();
        nodes.push(noise2, windFilter, windLfo, windLfoGain, windGain);
      }
      else if (audioName === "terrestrial") {
        // 1. Ocean wave wash (lowpass white noise modulated by slow LFO)
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          channelData[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const waveFilter = ctx.createBiquadFilter();
        waveFilter.type = "lowpass";
        waveFilter.frequency.setValueAtTime(350, ctx.currentTime);

        const waveLfo = ctx.createOscillator();
        waveLfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 8-second wave swell
        const waveLfoGain = ctx.createGain();
        waveLfoGain.gain.value = 180;

        const waveGain = ctx.createGain();
        waveGain.gain.value = 0.05;

        waveLfo.connect(waveLfoGain);
        waveLfoGain.connect(waveFilter.frequency);
        noise.connect(waveFilter);
        waveFilter.connect(waveGain);
        waveGain.connect(gainNode);

        noise.start();
        waveLfo.start();
        nodes.push(noise, waveFilter, waveLfo, waveLfoGain, waveGain);

        // 2. Schumann planet hum (low G/D notes)
        const hum1 = ctx.createOscillator();
        hum1.type = "sine";
        hum1.frequency.setValueAtTime(73.42, ctx.currentTime); // D2 note
        
        const hum2 = ctx.createOscillator();
        hum2.type = "sine";
        hum2.frequency.setValueAtTime(110.00, ctx.currentTime); // A2 note

        const humGain = ctx.createGain();
        humGain.gain.value = 0.025; // soft hum

        hum1.connect(humGain);
        hum2.connect(humGain);
        humGain.connect(gainNode);

        hum1.start();
        hum2.start();
        nodes.push(hum1, hum2, humGain);

        // 3. Moon aurora chime/sweep
        const moonChime = ctx.createOscillator();
        moonChime.type = "sine";
        moonChime.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 celestial note

        const chimeFilter = ctx.createBiquadFilter();
        chimeFilter.type = "bandpass";
        chimeFilter.frequency.setValueAtTime(1046.50, ctx.currentTime);
        chimeFilter.Q.setValueAtTime(6.0, ctx.currentTime);

        const chimeLfo = ctx.createOscillator();
        chimeLfo.frequency.setValueAtTime(0.07, ctx.currentTime); // 14s cycle
        const chimeLfoGain = ctx.createGain();
        chimeLfoGain.gain.value = 250;

        const chimeVolLfo = ctx.createOscillator();
        chimeVolLfo.frequency.setValueAtTime(0.07, ctx.currentTime);
        const chimeVolGain = ctx.createGain();
        chimeVolGain.gain.value = 0.025;

        chimeLfo.connect(chimeLfoGain);
        chimeLfoGain.connect(moonChime.frequency);
        chimeVolLfo.connect(chimeVolGain.gain);

        moonChime.connect(chimeFilter);
        chimeFilter.connect(chimeVolGain);
        chimeVolGain.connect(gainNode);

        moonChime.start();
        chimeLfo.start();
        chimeVolLfo.start();
        nodes.push(moonChime, chimeFilter, chimeLfo, chimeLfoGain, chimeVolLfo, chimeVolGain);
      }
      else if (audioName === "gas") {
        const bufferSize = ctx.sampleRate * 2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          channelData[i] = Math.random() * 2 - 1;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;
        
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(320, ctx.currentTime);
        filter.Q.setValueAtTime(1.8, ctx.currentTime);
        
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.25, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 100;
        
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        noise.connect(filter);
        filter.connect(gainNode);
        noise.start();
        lfo.start();
        nodes.push(noise, filter, lfo, lfoGain);
      }
      else if (audioName === "ice") {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(640, ctx.currentTime);
        
        const delay = ctx.createDelay();
        delay.delayTime.value = 0.35;
        
        const fb = ctx.createGain();
        fb.gain.value = 0.35;
        
        osc.connect(delay);
        delay.connect(fb);
        fb.connect(delay);
        
        delay.connect(gainNode);
        osc.start();
        nodes.push(osc, delay, fb);
      }
      else if (audioName === "ocean") {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.4;
        
        lfo.connect(lfoGain);
        const tideGain = ctx.createGain();
        tideGain.gain.value = 0.6;
        lfoGain.connect(tideGain.gain);
        
        osc.connect(tideGain);
        tideGain.connect(gainNode);
        osc.start();
        lfo.start();
        nodes.push(osc, lfo, lfoGain, tideGain);
      }
    } catch (e) {
      console.error("Error creating planet synthesizer:", e);
    }

    audioNodesRef.current = { gainNode, nodes };

    return () => {
      if (audioNodesRef.current) {
        try {
          audioNodesRef.current.gainNode.disconnect();
          audioNodesRef.current.nodes.forEach((node) => {
            try {
              if ("stop" in node) {
                node.stop();
              }
            } catch (e) {}
          });
        } catch (e) {
          console.error("Error cleaning up planet sound:", e);
        }
        audioNodesRef.current = null;
      }
    };
  }, [audioName]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Rotate planet mesh
    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed * delta;
    }
    // Rotate clouds at different speed
    if (cloudRef.current) {
      cloudRef.current.rotation.y += (rotationSpeed * 1.35) * delta;
    }
    // Rotate inner storm shells for desert planet
    if (innerStormRef1.current) {
      innerStormRef1.current.rotation.y -= (rotationSpeed * 3.5) * delta;
      innerStormRef1.current.rotation.x += (rotationSpeed * 1.2) * delta;
    }
    if (innerStormRef2.current) {
      innerStormRef2.current.rotation.y += (rotationSpeed * 5.0) * delta;
      innerStormRef2.current.rotation.z -= (rotationSpeed * 1.8) * delta;
    }

    // Orbit moons
    moons.forEach((moon, idx) => {
      if (moon.ref.current) {
        const angle = time * moon.orbitSpeed + idx * Math.PI;
        moon.ref.current.position.set(
          Math.cos(angle) * moon.orbitRadius,
          Math.sin(angle) * 0.18 * moon.orbitRadius,
          Math.sin(angle) * moon.orbitRadius
        );
        moon.ref.current.rotation.y += 0.15 * delta;
      }
    });

    // Orbit rock ring particles
    if (hasRockRings) {
      rockRing.forEach((rock) => {
        if (rock.ref.current) {
          const currentAngle = time * rock.speed + rock.angle;
          rock.ref.current.position.set(
            Math.cos(currentAngle) * rock.radius,
            rock.yOffset,
            Math.sin(currentAngle) * rock.radius
          );
          rock.ref.current.rotation.y += 0.5 * delta;
          rock.ref.current.rotation.x += 0.2 * delta;
        }
      });
    }

    // Modulate spatial audio based on distance + direction
    if (audioNodesRef.current && audioName) {
      const ctx = getGlobalAudioContext();
      if (!ctx) return;

      const planetWorldPos = new Vector3(...pos);
      const camPos = camera.position;
      const dist = camPos.distanceTo(planetWorldPos);

      // Proximity check (audible range scales dynamically based on planet size)
      const maxAudibleDist = scale * 22.0;
      let distVol = 0;
      if (dist < maxAudibleDist) {
        distVol = 1.0 - dist / maxAudibleDist; // 1.0 at center, 0.0 at max distance
      }

      // Look-at direction check
      const camDir = new Vector3();
      camera.getWorldDirection(camDir);
      const toPlanet = planetWorldPos.clone().sub(camPos).normalize();
      const dot = camDir.dot(toPlanet);

      let targetVol = 0;
      if (dot > 0.82 && distVol > 0) {
        const facingFactor = (dot - 0.82) / 0.18;
        targetVol = Math.pow(facingFactor, 2.0) * distVol * 0.14; // max volume 0.14
      }

      audioNodesRef.current.gainNode.gain.setTargetAtTime(targetVol, ctx.currentTime, 0.15);
    }
  });

  return (
    <group position={pos} scale={scale}>
      {/* Rotatable body */}
      <group ref={planetRef}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial
            map={textures.map}
            side={DoubleSide}
            roughness={type === "ice" ? 0.3 : 0.8}
            metalness={type === "ice" ? 0.8 : 0.1}
            emissive={type === "plasma" ? color1 : type === "lava" ? new Color("#ff3300") : new Color("#000000")}
            emissiveMap={type === "lava" ? textures.map : undefined}
            emissiveIntensity={type === "plasma" ? 1.4 : type === "lava" ? 1.8 : 0.0}
            bumpMap={textures.bumpMap}
            bumpScale={type === "lava" ? 0.045 : type === "desert" ? 0.035 : type === "terrestrial" ? 0.03 : type === "ice" ? 0.025 : 0.0}
          />
        </mesh>

        {/* Volumetric stormy interior for desert planet */}
        {type === "desert" && (
          <>
            <mesh scale={0.97}>
              <sphereGeometry args={[1, 32, 32]} />
              <meshBasicMaterial
                map={textures.map}
                transparent
                opacity={0.65}
                side={DoubleSide}
                depthWrite={false}
                blending={AdditiveBlending}
              />
            </mesh>
            <mesh scale={0.93} ref={innerStormRef1 as any}>
              <sphereGeometry args={[1, 32, 32]} />
              <meshBasicMaterial
                map={textures.map}
                transparent
                opacity={0.8}
                side={DoubleSide}
                depthWrite={false}
              />
            </mesh>
            <mesh scale={0.85} ref={innerStormRef2 as any}>
              <sphereGeometry args={[1, 32, 32]} />
              <meshBasicMaterial
                map={textures.map}
                transparent
                opacity={0.9}
                side={DoubleSide}
                depthWrite={false}
              />
            </mesh>
          </>
        )}

        {/* Habitable/Gas Clouds */}
        {hasClouds && cloudTexture && (
          <mesh scale={1.02} ref={cloudRef}>
            <sphereGeometry args={[1, 64, 64]} />
            <meshStandardMaterial
              map={cloudTexture}
              transparent
              opacity={0.65}
              depthWrite={false}
            />
          </mesh>
        )}

        {/* Orbiting moons meshes */}
        {moons.map((moon, index) => (
          <mesh key={index} ref={moon.ref as any} scale={moon.scale}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial
              map={moonTextures[index]?.map}
              bumpMap={moonTextures[index]?.bumpMap}
              bumpScale={0.06}
              roughness={0.9}
              metalness={0.1}
            />
          </mesh>
        ))}
      </group>

      {/* Tilted Ring System */}
      {hasRings && ringTexture && (
        <mesh rotation={[Math.PI / 2.5, Math.PI / 12, 0]}>
          <ringGeometry args={[1.4, 2.4, 128]} />
          <meshBasicMaterial
            map={ringTexture}
            side={DoubleSide}
            transparent
            opacity={1.0}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Tilted Asteroid Ring Belt */}
      {hasRockRings && (
        <group rotation={[0.15, 0, 0]}>
          {rockRing.map((rock, index) => (
            <mesh key={`rock-${index}`} ref={rock.ref as any} scale={rock.sizeScale}>
              <dodecahedronGeometry args={[1, 0]} />
              <meshStandardMaterial
                color={color1.clone().lerp(new Color("#332b3d"), 0.55)}
                roughness={0.9}
                metalness={0.2}
                flatShading
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Outer atmosphere halo (Concentric 2D Billboarded GlowingDisk, starting exactly at the planet's edge) */}
      <Billboard>
        <GlowingDisk
          minRadius={0.98}
          maxRadius={1.38}
          opacityMultiplier={type === "plasma" ? 1.3 : type === "terrestrial" ? 0.95 : 0.8}
          colorIn={type === "terrestrial" ? new Color("#38bdf8") : color1}
          colorOut={new Color("#000000")}
        />
      </Billboard>
    </group>
  );
};

// ---------------------------------------------------------------------------
// PROCEDURAL PLANETS DEPTH WRAPPERS
// ---------------------------------------------------------------------------

interface BackgroundProceduralPlanetsProps {
  mapTheme: MapTheme;
}

const BackgroundProceduralPlanets = ({ mapTheme }: BackgroundProceduralPlanetsProps) => {
  const planets = useMemo(() => {
    // 3 static backdrop planets
    return [
      {
        pos: [-1250, 320, -1150] as [number, number, number],
        scale: 75,
        type: "gas" as const,
        color1: new Color("#a855f7"),
        color2: new Color("#3b82f6"),
        rotationSpeed: 0.04,
        hasRockRings: true,
      },
      {
        pos: [3500, -500, 1200] as [number, number, number],
        scale: 100,
        type: "lava" as const,
        color1: new Color("#ef4444"),
        color2: new Color("#f97316"),
        rotationSpeed: -0.06,
      },
      {
        pos: [-1050, -520, 1150] as [number, number, number],
        scale: 70,
        type: "ice" as const,
        color1: new Color("#bae6fd"),
        color2: new Color("#0284c7"),
        rotationSpeed: 0.03,
        hasRings: true,
      },
    ];
  }, [mapTheme]);

  return (
    <>
      {planets.map((p, i) => (
        <ProceduralPlanetItem
          key={`bg-planet-${i}`}
          pos={p.pos}
          scale={p.scale}
          type={p.type}
          color1={p.color1}
          color2={p.color2}
          rotationSpeed={p.rotationSpeed}
          hasRings={p.hasRings}
          hasRockRings={p.hasRockRings}
        />
      ))}
    </>
  );
};

interface ActiveProceduralPlanetsProps {
  mapTheme: MapTheme;
}

const ActiveProceduralPlanets = ({ mapTheme }: ActiveProceduralPlanetsProps) => {
  const planets = useMemo(() => {
    // 2 Mid-ground (distant zoomable) + 2 Foreground (near zoomable with audio)
    return [
      // --- Mid-ground ---
      {
        pos: [-600, 200, -700] as [number, number, number],
        scale: 45,
        type: "desert" as const,
        color1: new Color("#eab308"),
        color2: new Color("#78350f"),
        rotationSpeed: 0.03,
        audioName: "desert" as const,
      },
      {
        pos: [700, -250, 500] as [number, number, number],
        scale: 40,
        type: "terrestrial" as const,
        color1: new Color("#10b981"),
        color2: new Color("#2563eb"),
        rotationSpeed: 0.05,
        hasClouds: true,
        moonsCount: 1,
        audioName: "terrestrial" as const,
      },
      // --- Foreground (closer to arena, with sound!) ---
      {
        pos: [-280, 150, -250] as [number, number, number],
        scale: 24,
        type: "lava" as const,
        color1: new Color("#f97316"),
        color2: new Color("#ff2200"),
        rotationSpeed: 0.02,
        moonsCount: 2,
        audioName: "lava" as const,
      },
      {
        pos: [420, 180, -350] as [number, number, number],
        scale: 22,
        type: "plasma" as const,
        color1: new Color("#ec4899"),
        color2: new Color("#8b5cf6"),
        rotationSpeed: 0.06,
        hasRings: true,
        audioName: "plasma" as const,
      },
    ];
  }, [mapTheme]);

  return (
    <>
      {planets.map((p, i) => (
        <ProceduralPlanetItem
          key={`active-planet-${i}`}
          pos={p.pos}
          scale={p.scale}
          type={p.type}
          color1={p.color1}
          color2={p.color2}
          rotationSpeed={p.rotationSpeed}
          hasRings={p.hasRings}
          hasClouds={p.hasClouds}
          moonsCount={p.moonsCount}
          audioName={p.audioName}
        />
      ))}
    </>
  );
};

// ---------------------------------------------------------------------------
// GALAXY CENTRAL BLACK HOLE SHADER & COMPONENT
// ---------------------------------------------------------------------------

const DISK_VERT = `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DISK_FRAG = `
  uniform vec3 colorIn;
  uniform vec3 colorOut;
  uniform float minR;
  uniform float maxR;
  uniform float mult;
  varying vec2 vPos;
  void main() {
    float dist = length(vPos);
    float t = clamp((dist - minR) / (maxR - minR), 0.0, 1.0);
    float alpha = pow(1.0 - t, 2.0) * mult;
    vec3 color = mix(colorIn, colorOut, t);
    gl_FragColor = vec4(color, alpha);
  }
`;

interface GlowingDiskProps {
  minRadius: number;
  maxRadius: number;
  opacityMultiplier?: number;
  rot?: [number, number, number];
  colorIn: Color;
  colorOut: Color;
}

const GlowingDisk = ({
  minRadius,
  maxRadius,
  opacityMultiplier = 1,
  rot = [0, 0, 0],
  colorIn,
  colorOut,
}: GlowingDiskProps) => {
  const uniforms = useMemo(
    () => ({
      colorIn: { value: colorIn },
      colorOut: { value: colorOut },
      minR: { value: minRadius },
      maxR: { value: maxRadius },
      mult: { value: opacityMultiplier },
    }),
    [minRadius, maxRadius, opacityMultiplier, colorIn, colorOut]
  );

  return (
    <mesh rotation={rot}>
      <ringGeometry args={[minRadius, maxRadius, 64]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={DoubleSide}
        uniforms={uniforms}
        vertexShader={DISK_VERT}
        fragmentShader={DISK_FRAG}
      />
    </mesh>
  );
};

interface GalaxyBlackHoleProps {
  mapTheme: MapTheme;
}

const GalaxyBlackHole = ({ mapTheme }: GalaxyBlackHoleProps) => {
  const ringsInnerRef = useRef<Group>(null);
  const ringsOuterRef = useRef<Group>(null);
  const haloRef = useRef<Group>(null);

  useFrame((state, delta) => {
    // 1. Counter-Rotating Accretion Disk loops for complex plasma shear effect
    if (ringsInnerRef.current) {
      ringsInnerRef.current.rotation.z -= delta * 0.35;
    }
    if (ringsOuterRef.current) {
      ringsOuterRef.current.rotation.z += delta * 0.12;
    }

    // 2. Gravitational lensing pulsation (Event Horizon "breathing" gravity waves)
    if (haloRef.current) {
      const time = state.clock.getElapsedTime();
      const pulse = 1.0 + Math.sin(time * 1.4) * 0.05;
      haloRef.current.scale.setScalar(pulse);
    }
  });

  const { colorIn, colorOut, colorCore } = useMemo(() => {
    if (mapTheme === "LAVA") {
      return {
        colorIn: new Color("#ffaa00"),
        colorOut: new Color("#440000"),
        colorCore: new Color("#ff2200"),
      };
    }
    if (mapTheme === "ICE") {
      return {
        colorIn: new Color("#ffffff"),
        colorOut: new Color("#002255"),
        colorCore: new Color("#00aaff"),
      };
    }
    // CYBER Theme
    return {
      colorIn: new Color("#00ffff"),
      colorOut: new Color("#220044"),
      colorCore: new Color("#ff00ff"),
    };
  }, [mapTheme]);

  return (
    <group scale={2.2}>
      {/* Event Horizon (Pure Black Sphere) */}
      <mesh renderOrder={1}>
        <sphereGeometry args={[14, 16, 16]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Gravitational Lensing Halo (Billboarded to mimic curved light path) */}
      <group ref={haloRef}>
        <Billboard>
          <GlowingDisk
            minRadius={14}
            maxRadius={32}
            opacityMultiplier={0.85}
            colorIn={colorIn}
            colorOut={colorOut}
          />
        </Billboard>
      </group>

      {/* Accretion Disk (Equatorial & Tilted) */}
      <group rotation={[0.25, 0.1, -0.15]}>
        {/* Inner Counter-Clockwise Accretion rings */}
        <group ref={ringsInnerRef}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[15.5, 1.2, 16, 100]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.85}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        </group>

        {/* Outer Clockwise Accretion rings */}
        <group ref={ringsOuterRef}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[18, 2.2, 16, 100]} />
            <meshBasicMaterial
              color={colorCore}
              transparent
              opacity={0.5}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Outer accretion gradient */}
          <GlowingDisk
            minRadius={15}
            maxRadius={65}
            opacityMultiplier={0.95}
            rot={[-Math.PI / 2, 0, 0]}
            colorIn={colorIn}
            colorOut={colorOut}
          />
        </group>
      </group>
    </group>
  );
};

// ---------------------------------------------------------------------------
// COSMIC NEUTRON STAR (PULSAR) VOLUMETRIC LIGHTHOUSE SHADERS
// ---------------------------------------------------------------------------

const BEAM_VERT = `
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const BEAM_FRAG = `
  uniform vec3 color;
  varying vec3 vNormal;
  varying vec2 vUv;
  void main() {
    // 3D Volumetric Softness: brightest in center, fades out at the round edges
    float edge = pow(abs(vNormal.z), 1.6);
    // Smooth length falloff: brightest near core (vUv.y=1.0 at tip), fades to black in space (vUv.y=0.0 at base)
    float lengthFade = pow(vUv.y, 1.6);
    gl_FragColor = vec4(color, edge * lengthFade * 0.45);
  }
`;





interface SpacePulsarProps {
  position: [number, number, number];
  color: Color;
  beamColor: Color;
}

const SpacePulsar = ({ position, color, beamColor }: SpacePulsarProps) => {
  const pulsarRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (pulsarRef.current) {
      // Rotates the relativistic jet beams like a cosmic lighthouse
      pulsarRef.current.rotation.y += 0.35 * delta;
      pulsarRef.current.rotation.z += 0.08 * delta;
    }
    if (coreRef.current) {
      // Extremely rapid twinkling of the pulsar core (simulating high rotation frequency)
      const time = state.clock.getElapsedTime();
      const pulse = 1.0 + Math.sin(time * 18.0) * 0.18;
      coreRef.current.scale.setScalar(pulse);
    }
  });

  const beamUniformsA = useMemo(() => ({ color: { value: beamColor } }), [beamColor]);
  const beamUniformsB = useMemo(() => ({ color: { value: beamColor } }), [beamColor]);

  return (
    <group position={position}>
      {/* Soft Volumetric Pulsar Core Glow (No sharp borders) */}
      <Billboard>
        <GlowingDisk
          minRadius={0}
          maxRadius={22}
          opacityMultiplier={1.0}
          colorIn={color}
          colorOut={beamColor}
        />
      </Billboard>

      {/* Rotating relativistic energy jets */}
      <group ref={pulsarRef}>
        {/* Jet Beam A (pointing along positive Y, rotated to point along positive Z) */}
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh position={[0, -300, 0]}>
            <coneGeometry args={[25, 600, 16, 1, true]} />
            <shaderMaterial
              transparent
              depthWrite={false}
              blending={AdditiveBlending}
              side={DoubleSide}
              uniforms={beamUniformsA}
              vertexShader={BEAM_VERT}
              fragmentShader={BEAM_FRAG}
            />
          </mesh>
        </group>

        {/* Jet Beam B (pointing along positive Y, rotated to point along negative Z) */}
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <mesh position={[0, -300, 0]}>
            <coneGeometry args={[25, 600, 16, 1, true]} />
            <shaderMaterial
              transparent
              depthWrite={false}
              blending={AdditiveBlending}
              side={DoubleSide}
              uniforms={beamUniformsB}
              vertexShader={BEAM_VERT}
              fragmentShader={BEAM_FRAG}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
};

// ---------------------------------------------------------------------------
// PROCEDURAL SPACE NEBULA (FILAMENT STRUCTURE)
// ---------------------------------------------------------------------------

interface SpaceNebulaProps {
  position: [number, number, number];
  mapTheme: MapTheme;
  graphicsQuality?: string;
}

const SpaceNebula = ({ position, mapTheme, graphicsQuality = "medium" }: SpaceNebulaProps) => {
  const nebulaRef = useRef<Group>(null);
  
  useFrame((_, delta) => {
    if (nebulaRef.current) {
      // Slow organic rotation
      nebulaRef.current.rotation.y += 0.003 * delta;
      nebulaRef.current.rotation.z += 0.001 * delta;
    }
  });

  // Programmatically generate a soft radial cloud puff texture
  // This is highly compatible, completely eliminates the cross/grid pixelation artifacts,
  // and renders beautiful smooth overlapping gas clouds on all devices!
  const cloudTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.75)");
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    return new CanvasTexture(canvas);
  }, []);

  const nebulaData = useMemo(() => {
    // Increased particle density slightly for the larger spread
    const count = graphicsQuality === "high" ? 4500 : graphicsQuality === "low" ? 1200 : 2800;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Setup theme color roles (soft, distributed hues inspired by "Stellar Nursery")
    let colBase = new Color("#7f1d1d");      // Deep ruby red
    let colRose = new Color("#e879f9");      // Bright violet-rose / pink
    let colBlue = new Color("#2563eb");      // Deep space blue
    let colCyan = new Color("#06b6d4");      // Vibrant turquoise/cyan
    let colPurple = new Color("#6d28d9");    // Deep purple
    let colGold = new Color("#f59e0b");      // Warm amber/gold highlight

    if (mapTheme === "LAVA") {
      colBase = new Color("#450a0a");
      colRose = new Color("#ea580c");
      colBlue = new Color("#f97316");
      colCyan = new Color("#eab308");
      colPurple = new Color("#7c2d12");
      colGold = new Color("#facc15");
    } else if (mapTheme === "ICE") {
      colBase = new Color("#1e3b8a");
      colRose = new Color("#0284c7");
      colBlue = new Color("#0369a1");
      colCyan = new Color("#06b6d4");
      colPurple = new Color("#312e81");
      colGold = new Color("#a5f3fc");
    }

    for (let i = 0; i < count; i++) {
      // Expanded size: radius up to 270 (was 125)
      const r = Math.pow(Math.random(), 1.4) * 270;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(Math.random() * 2 - 1);

      // Low frequency sine billows for organic cloud lumpiness
      const lump = 1.0 + Math.sin(theta * 3.0) * Math.cos(phi * 2.0) * 0.22;
      const finalR = r * lump;

      // Ellipsoid flattening (slightly flatter along Y axis for cosmic disk feel)
      const x = finalR * Math.sin(phi) * Math.cos(theta);
      const y = finalR * Math.cos(phi) * 0.75;
      const z = finalR * Math.sin(phi) * Math.sin(theta);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // --- Rich Multi-Color Blending Math ---
      // We combine different coordinates to make independent color lanes/zones
      const factorX = (Math.sin(x * 0.008) + 1.0) / 2.0;
      const factorY = (Math.cos(y * 0.010) + 1.0) / 2.0;
      const factorZ = (Math.sin(z * 0.007) + 1.0) / 2.0;

      let c = colBase.clone();

      // Mix 1: Base colors (Red, Purple, Blue) along X/Z wave
      const mixXZ = (factorX + factorZ) / 2.0;
      if (mixXZ < 0.35) {
        c.lerp(colPurple, mixXZ / 0.35);
      } else if (mixXZ < 0.7) {
        c.copy(colPurple).lerp(colBlue, (mixXZ - 0.35) / 0.35);
      } else {
        c.copy(colBlue).lerp(colRose, (mixXZ - 0.7) / 0.3);
      }

      // Mix 2: Add turquoise/cyan lanes in specific wave intersections
      const mixCyan = Math.sin(x * 0.005 + y * 0.006) * Math.cos(z * 0.005);
      if (mixCyan > 0.4) {
        c.lerp(colCyan, (mixCyan - 0.4) * 1.2);
      }

      // Mix 3: Add warm amber/gold dust highlights in other regions
      const mixGold = Math.cos(x * 0.007 - z * 0.007) * Math.sin(y * 0.008);
      if (mixGold > 0.55) {
        c.lerp(colGold, (mixGold - 0.55) * 1.5);
      }

      // Mix 4: Center light glow (soft white-cyan glow in center)
      const distToCenter = Math.sqrt(x*x + y*y + z*z);
      if (distToCenter < 160) {
        const centerFactor = (160 - distToCenter) / 160;
        const glowCol = mapTheme === "LAVA" ? new Color("#ffea00") : mapTheme === "ICE" ? new Color("#e0ffff") : new Color("#dbeafe");
        c.lerp(glowCol, centerFactor * 0.35); // soft 35% center lighting
      }

      // Add small color variation
      colors[i * 3] = Math.max(0, Math.min(1, c.r + (Math.random() - 0.5) * 0.03));
      colors[i * 3 + 1] = Math.max(0, Math.min(1, c.g + (Math.random() - 0.5) * 0.03));
      colors[i * 3 + 2] = Math.max(0, Math.min(1, c.b + (Math.random() - 0.5) * 0.03));
    }

    return { positions, colors };
  }, [mapTheme, graphicsQuality]);

  return (
    <group position={position} ref={nebulaRef}>
      {/* Volumetric gas cloud */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[nebulaData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[nebulaData.colors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={graphicsQuality === "high" ? 75 : 55}
          sizeAttenuation={true}
          map={cloudTexture}
          transparent={true}
          opacity={0.3} // soft opacity for beautiful overlapping volume
          depthWrite={false}
          blending={AdditiveBlending}
          vertexColors={true}
        />
      </points>
    </group>
  );
};

// ---------------------------------------------------------------------------
// EASTER EGG: ABANDONED SATELLITE (VANGUARD-IX)
// ---------------------------------------------------------------------------

interface AbandonedSatelliteProps {
  mapTheme: MapTheme;
}

const AbandonedSatellite = ({ mapTheme }: AbandonedSatelliteProps) => {
  const groupRef = useRef<Group>(null);
  const beaconRef = useRef<Mesh>(null);
  const pingRef = useRef<Mesh>(null);
  const pingScaleRef = useRef(0);
  const { camera } = useThree();

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Slow tumbling
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.08 * delta;
      groupRef.current.rotation.x += 0.04 * delta;
      // Soft floating drift
      groupRef.current.position.y = 120 + Math.sin(time * 0.4) * 6;
    }

    // 2. Blinking beacon (swapping red and green colors directly on the material)
    if (beaconRef.current) {
      const blink = Math.sin(time * 5.0) > 0;
      const material = beaconRef.current.material as MeshBasicMaterial;
      if (blink) {
        material.color.set("#ef4444"); // bright red
      } else {
        material.color.set("#22c55e"); // bright green
      }
    }

    // 3. Expanding signal radar pings
    if (pingRef.current) {
      pingScaleRef.current += 25 * delta;
      if (pingScaleRef.current > 110) {
        pingScaleRef.current = 0;
        // Trigger soft satellite telemetry beep
        const satellitePos = groupRef.current ? groupRef.current.position : new Vector3(-420, 120, 360);
        const dist = camera.position.distanceTo(satellitePos);
        playSatellitePing(dist);
      }
      pingRef.current.scale.setScalar(pingScaleRef.current);
      const material = pingRef.current.material as MeshBasicMaterial;
      material.opacity = Math.max(0, 1 - (pingScaleRef.current / 110)) * 0.22;
    }
  });

  const wireColor = useMemo(() => {
    return mapTheme === "CYBER" ? "#00ffff" : mapTheme === "LAVA" ? "#ffaa00" : "#ffffff";
  }, [mapTheme]);

  return (
    <group position={[-420, 120, 360]} ref={groupRef}>
      {/* Central Cylinder Body */}
      <mesh>
        <cylinderGeometry args={[5, 5, 18, 8]} />
        <meshBasicMaterial color="#0b0b1a" wireframe />
      </mesh>
      
      {/* Solar Panel array wing - Left */}
      <mesh position={[-16, 0, 0]}>
        <boxGeometry args={[14, 7, 0.8]} />
        <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.25} />
      </mesh>

      {/* Solar Panel array wing - Right */}
      <mesh position={[16, 0, 0]}>
        <boxGeometry args={[14, 7, 0.8]} />
        <meshBasicMaterial color={wireColor} wireframe transparent opacity={0.25} />
      </mesh>

      {/* Dish Antenna on top */}
      <mesh position={[0, 11, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[4.5, 3.5, 8, 1, true]} />
        <meshBasicMaterial color={wireColor} wireframe />
      </mesh>

      {/* Blinking Beacon light tip */}
      <mesh position={[0, 13.5, 0]} ref={beaconRef}>
        <sphereGeometry args={[1.0, 8, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {/* Expanding signal ring */}
      <mesh position={[0, 11, 0]} rotation={[Math.PI / 2, 0, 0]} ref={pingRef}>
        <ringGeometry args={[0.9, 1.0, 32]} />
        <meshBasicMaterial
          color={wireColor}
          transparent
          opacity={0}
          side={DoubleSide}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------------------
// EASTER EGG: COSMIC MONOLITH (UNKNOWN ORIGIN)
// ---------------------------------------------------------------------------

interface CosmicMonolithProps {
  mapTheme: MapTheme;
}

const CosmicMonolith = ({ mapTheme }: CosmicMonolithProps) => {
  const groupRef = useRef<Group>(null);
  const glowMaterialRef = useRef<MeshBasicMaterial>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // 1. Slow cosmic drift and Y-axis rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.06 * delta;
      groupRef.current.position.y = -90 + Math.sin(time * 0.3) * 5;
    }

    // 2. Slow breathing glow effect on wireframe outline
    if (glowMaterialRef.current) {
      glowMaterialRef.current.opacity = 0.2 + Math.abs(Math.sin(time * 0.7)) * 0.5;
    }
  });

  const glowColor = useMemo(() => {
    return mapTheme === "CYBER" ? "#ff00ff" : mapTheme === "LAVA" ? "#ff2200" : "#aaddff";
  }, [mapTheme]);

  return (
    <group position={[430, -90, -380]} ref={groupRef}>
      {/* Pure black monolith block */}
      <mesh>
        <boxGeometry args={[9, 23, 2.5]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Holographic glowing neon outline */}
      <mesh scale={1.035}>
        <boxGeometry args={[9, 23, 2.5]} />
        <meshBasicMaterial
          ref={glowMaterialRef}
          color={glowColor}
          wireframe
          transparent
          opacity={0.5}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// ---------------------------------------------------------------------------
// DYNAMIC EVENT: EXPLODING ASTEROID (DETONATING EVENTS)
// ---------------------------------------------------------------------------

interface ExplodingAsteroidProps {
  startPos: [number, number, number];
  size: number;
  mapTheme: MapTheme;
}

const ExplodingAsteroid = ({ startPos, size, mapTheme }: ExplodingAsteroidProps) => {
  const groupRef = useRef<Group>(null);
  const rockRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const particlesRef = useRef<Points>(null);
  const { camera } = useThree();

  const stateRef = useRef({
    phase: "drift", // drift -> charge -> burst -> cooldown
    timer: Math.random() * 20, // random stagger start offset
    scale: size,
    glow: 0,
    particleProgress: 0,
  });

  const particleCount = 30;

  // Precomputed direction vectors for debris
  const particleDirs = useMemo(() => {
    const dirs = [];
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      dirs.push([
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta),
        Math.cos(phi),
      ]);
    }
    return dirs;
  }, []);

  const particlePos = useMemo(() => new Float32Array(particleCount * 3), []);

  useFrame((state, delta) => {
    const data = stateRef.current;
    data.timer += delta;

    // 1. Slow background drift and rotation
    if (groupRef.current && data.phase !== "burst") {
      groupRef.current.rotation.y += 0.06 * delta;
      groupRef.current.rotation.x += 0.03 * delta;
      groupRef.current.position.y =
        startPos[1] + Math.sin(state.clock.getElapsedTime() * 0.35 + startPos[0]) * 7;
    }

    if (data.phase === "drift") {
      // Drift for 25 to 45 seconds before charging
      if (data.timer > 30.0 + Math.sin(startPos[2]) * 8) {
        data.phase = "charge";
        data.timer = 0;
      }
      if (rockRef.current) rockRef.current.scale.setScalar(size);
      if (glowRef.current) glowRef.current.scale.setScalar(0);
    } 
    else if (data.phase === "charge") {
      // Charge / Build up for 3.5 seconds
      const progress = Math.min(1.0, data.timer / 3.5);
      data.glow = progress * 1.5;

      // Unstable shaking/vibration effect as it charges up
      const shake = 1.0 + Math.sin(data.timer * 45.0) * 0.06 * progress;
      if (rockRef.current) rockRef.current.scale.setScalar(size * shake);
      
      if (glowRef.current) {
        glowRef.current.scale.setScalar(size * 1.15 * shake);
        const material = glowRef.current.material as MeshBasicMaterial;
        material.opacity = progress * 0.85;
      }

      if (data.timer > 3.5) {
        data.phase = "burst";
        data.timer = 0;
        
        // Trigger simulated speed-of-sound explosion audio
        const asteroidPos = groupRef.current ? groupRef.current.position : new Vector3(...startPos);
        const dist = camera.position.distanceTo(asteroidPos);
        playExplosionSound(dist);

        // Reset debris particles to center point
        for (let i = 0; i < particleCount; i++) {
          particlePos[i * 3] = 0;
          particlePos[i * 3 + 1] = 0;
          particlePos[i * 3 + 2] = 0;
        }
        if (particlesRef.current) {
          particlesRef.current.geometry.attributes.position.needsUpdate = true;
        }
      }
    } 
    else if (data.phase === "burst") {
      // Exploding burst animation lasts 1.6 seconds
      const progress = Math.min(1.0, data.timer / 1.6);

      // Shrink core rock instantly to 0
      if (rockRef.current) rockRef.current.scale.setScalar(size * Math.max(0, 1 - progress * 4.0));
      
      // Blast wave shell expands and fades out
      if (glowRef.current) {
        glowRef.current.scale.setScalar(size * 2.8 * progress);
        const material = glowRef.current.material as MeshBasicMaterial;
        material.opacity = Math.max(0, 1 - progress) * 0.95;
      }

      // Fly out particles along random dirs
      const speed = 130 * delta;
      for (let i = 0; i < particleCount; i++) {
        particlePos[i * 3] += particleDirs[i][0] * speed;
        particlePos[i * 3 + 1] += particleDirs[i][1] * speed;
        particlePos[i * 3 + 2] += particleDirs[i][2] * speed;
      }
      if (particlesRef.current) {
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        const material = particlesRef.current.material as PointsMaterial;
        material.opacity = Math.max(0, 1 - progress) * 0.95;
      }

      if (data.timer > 1.6) {
        data.phase = "cooldown";
        data.timer = 0;
      }
    } 
    else if (data.phase === "cooldown") {
      // Cooldown for 15 seconds before asteroid reforms
      if (glowRef.current) glowRef.current.scale.setScalar(0);
      if (particlesRef.current) {
        const material = particlesRef.current.material as PointsMaterial;
        material.opacity = 0;
      }

      if (data.timer > 15.0) {
        data.phase = "drift";
        data.timer = 0;
      }
    }
  });

  const rockColor = "#221810";
  const glowColor = useMemo(() => {
    return mapTheme === "CYBER" ? "#00ffff" : mapTheme === "LAVA" ? "#ff3300" : "#bae6fd";
  }, [mapTheme]);

  return (
    <group position={startPos} ref={groupRef}>
      {/* Solid Asteroid Body */}
      <mesh ref={rockRef}>
        <dodecahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color={rockColor} roughness={0.9} flatShading />
      </mesh>

      {/* Energy core charging sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Glowing fragment particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePos, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={7.5}
          color={glowColor}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

// ---------------------------------------------------------------------------
// MAIN SPACE BACKGROUND COMPONENT
// ---------------------------------------------------------------------------

export const SpaceBackground = ({ mapTheme, graphicsQuality = "medium" }: SpaceBackgroundProps) => {
  const backgroundRef = useRef<Group>(null);
  const galaxyRef = useRef<Group>(null);
  const { camera } = useThree();

  // Keep the background centered on the camera at all times (Infinite Parallax effect)
  useFrame((_, delta) => {
    if (backgroundRef.current) {
      backgroundRef.current.position.copy(camera.position);
    }
    if (galaxyRef.current) {
      // Slowly rotate the galaxy for a living universe feel
      galaxyRef.current.rotation.y += 0.005 * delta;
    }
  });

  // Procedural Spiral Galaxy Generation
  const galaxyData = useMemo(() => {
    // Quality-based star density - increased for a lush, premium celestial cloud
    const count = graphicsQuality === "high" ? 6000 : graphicsQuality === "low" ? 1200 : 3000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    // Dynamic coloring based on active map theme
    let colorInStr = "#ff00ff"; // magenta
    let colorOutStr = "#00ffff"; // cyan

    if (mapTheme === "LAVA") {
      colorInStr = "#ff2200"; // hot red
      colorOutStr = "#ffaa00"; // bright orange
    } else if (mapTheme === "ICE") {
      colorInStr = "#ffffff"; // pure white
      colorOutStr = "#00aaff"; // deep ice blue
    }

    const colorInside = new Color(colorInStr);
    const colorOutside = new Color(colorOutStr);

    for (let i = 0; i < count; i++) {
      const randType = Math.random();

      if (randType < 0.30) {
        // 1. Central Bulge (Ellipsoid Core) - 30% of stars
        // Highly concentrated at the center, spherical/ellipsoid shape
        const r = Math.pow(Math.random(), 1.5) * 160;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        
        // Ellipsoid flattening (Y-axis is thin, X and Z are wider)
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi) * 0.45; // flattened core
        const z = r * Math.sin(phi) * Math.sin(theta);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        // Core is brighter, shifting towards white/yellow/cyan depending on theme
        const centerGlow = colorInside.clone().lerp(new Color("#ffffff"), 0.5 - (r / 160) * 0.4);
        
        // Subtle star temperature variation
        colors[i * 3] = Math.max(0, Math.min(1, centerGlow.r + (Math.random() - 0.5) * 0.05));
        colors[i * 3 + 1] = Math.max(0, Math.min(1, centerGlow.g + (Math.random() - 0.5) * 0.05));
        colors[i * 3 + 2] = Math.max(0, Math.min(1, centerGlow.b + (Math.random() - 0.5) * 0.05));

      } else if (randType < 0.85) {
        // 2. Spiral Arms - 55% of stars
        // Distribute radius from 80 to 920 units
        const r = 80 + Math.pow(Math.random(), 1.2) * 840;
        
        // 2 main spiral arms
        const armIndex = i % 2;
        const armAngle = (armIndex * 2 * Math.PI) / 2;
        
        // Spiral curve wrapping factor
        const spiralFactor = 0.0055;
        const spiralAngle = r * spiralFactor;

        // Arm thickness (angular spread) - wider near the core, tapering at outer edges
        // Using an average of 3 random numbers to approximate a Gaussian bell curve (central focus)
        const armSpread = ((Math.random() + Math.random() + Math.random()) / 3 - 0.5) * 0.7;
        const angle = spiralAngle + armAngle + armSpread;

        // Add small radial offset for fluffiness and organic boundary blending
        const radialOffset = (Math.random() - 0.5) * 45;
        const finalR = Math.max(0, r + radialOffset);

        // Flatter disk at outer edges (Y thickness tapers exponentially)
        const yThickness = 28 * Math.exp(-finalR / 450);
        const y = (Math.random() - 0.5) * yThickness;

        positions[i * 3] = Math.cos(angle) * finalR;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(angle) * finalR;

        // Arm colors interpolate from inside to outside
        const mixedColor = colorInside.clone().lerp(colorOutside, finalR / 920);
        
        // Star color temperature variance
        colors[i * 3] = Math.max(0, Math.min(1, mixedColor.r + (Math.random() - 0.5) * 0.08));
        colors[i * 3 + 1] = Math.max(0, Math.min(1, mixedColor.g + (Math.random() - 0.5) * 0.08));
        colors[i * 3 + 2] = Math.max(0, Math.min(1, mixedColor.b + (Math.random() - 0.5) * 0.08));

      } else {
        // 3. Ambient Galactic Disk (Background Stars between arms) - 15% of stars
        // Uniformly distributed across the disk to make it look full and organic
        const r = Math.pow(Math.random(), 1.5) * 920;
        const angle = Math.random() * Math.PI * 2;
        
        // Vertical thickness also tapers exponentially
        const yThickness = 32 * Math.exp(-r / 350);
        const y = (Math.random() - 0.5) * yThickness;

        positions[i * 3] = Math.cos(angle) * r;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = Math.sin(angle) * r;

        // Ambient disk stars are slightly fainter and merge with outside color
        const mixedColor = colorInside.clone().lerp(colorOutside, r / 920).multiplyScalar(0.7);
        
        colors[i * 3] = Math.max(0, Math.min(1, mixedColor.r + (Math.random() - 0.5) * 0.05));
        colors[i * 3 + 1] = Math.max(0, Math.min(1, mixedColor.g + (Math.random() - 0.5) * 0.05));
        colors[i * 3 + 2] = Math.max(0, Math.min(1, mixedColor.b + (Math.random() - 0.5) * 0.05));
      }
    }

    return { positions, colors };
  }, [mapTheme, graphicsQuality]);



  // Dynamic Theme-based Pulsar configs
  const pulsarConfig = useMemo(() => {
    let colorStr = "#ffffff";
    let beamColorStr = "#00ffff"; // cyan

    if (mapTheme === "LAVA") {
      beamColorStr = "#ff3300"; // red
    } else if (mapTheme === "ICE") {
      beamColorStr = "#80ccff"; // light ice blue
    }

    return {
      position: [-1400, -200, 1400] as [number, number, number],
      color: new Color(colorStr),
      beamColor: new Color(beamColorStr),
    };
  }, [mapTheme]);

  const starCount = useMemo(() => {
    return graphicsQuality === "high" ? 5000 : graphicsQuality === "low" ? 400 : 1500;
  }, [graphicsQuality]);

  // Position of galaxy: far away and tilted
  const galaxyTransform = useMemo(() => {
    return {
      position: [1600, -500, -1600] as [number, number, number],
      rotation: [0.6, 0.4, -0.5] as [number, number, number],
    };
  }, []);

  return (
    <>
      {/* ----------------- INFINITE PARALLAX SKYBOX LAYER ----------------- */}
      <group ref={backgroundRef}>
        {/* 🌟 Infinite Parallax Starfield */}
        <Stars
          radius={350}
          depth={80}
          count={starCount}
          factor={7}
          saturation={0}
          fade
          speed={1.2}
        />

        {/* 🌌 Procedural Spiral Galaxy */}
        <group
          ref={galaxyRef}
          position={galaxyTransform.position}
          rotation={galaxyTransform.rotation}
        >
          {/* 🕳️ Scary Massive Black Hole in the center of the galaxy */}
          <GalaxyBlackHole mapTheme={mapTheme} />

          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[galaxyData.positions, 3]}
              />
              <bufferAttribute
                attach="attributes-color"
                args={[galaxyData.colors, 3]}
              />
            </bufferGeometry>
            <pointsMaterial
              size={graphicsQuality === "high" ? 5.5 : graphicsQuality === "low" ? 3.0 : 4.5}
              sizeAttenuation={true}
              vertexColors={true}
              transparent={true}
              opacity={graphicsQuality === "low" ? 0.5 : 0.7}
              depthWrite={false}
              blending={AdditiveBlending}
            />
          </points>
        </group>

        {/* 🚨 Neutron Star (Pulsar) Lighthouse */}
        {graphicsQuality !== "low" && (
          <SpacePulsar
            position={pulsarConfig.position}
            color={pulsarConfig.color}
            beamColor={pulsarConfig.beamColor}
          />
        )}

        {/* 🌌 Separate Volumetric Filament Space Nebula (gaseous filament detail) */}
        {graphicsQuality !== "low" && (
          <SpaceNebula
            position={[1300, 500, 1300]}
            mapTheme={mapTheme}
            graphicsQuality={graphicsQuality}
          />
        )}

        {/* 🪐 Distant Static Background Procedural Planets */}
        {graphicsQuality !== "low" && (
          <BackgroundProceduralPlanets mapTheme={mapTheme} />
        )}
      </group>

      {/* ----------------- REACHABLE WORLD-SPACE EASTER EGGS ----------------- */}
      {graphicsQuality !== "low" && (
        <>
          {/* 🪐 Zoomable Active Procedural Planets */}
          <ActiveProceduralPlanets mapTheme={mapTheme} />

          {/* 📡 Abandoned Satellite (Vanguard-IX) */}
          <AbandonedSatellite mapTheme={mapTheme} />

          {/* 🕋 Cosmic Monolith (Unknown Origin) */}
          <CosmicMonolith mapTheme={mapTheme} />

          {/* ☄️ Distant Exploding Asteroids (Drifting & Periodic Detonation) */}
          <ExplodingAsteroid startPos={[-320, -100, -350]} size={6} mapTheme={mapTheme} />
          <ExplodingAsteroid startPos={[350, 150, 280]} size={9} mapTheme={mapTheme} />
        </>
      )}
    </>
  );
};
