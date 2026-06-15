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

export const noise3D = (x: number, y: number, z: number): number => {
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

export const fbm3D = (x: number, y: number, z: number, octaves = 4): number => {
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
