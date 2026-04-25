/**
 * PWA Icon Generator — Logic Arena
 * Generates all required icon sizes using only built-in Node.js modules.
 * Produces valid PNG files with a cyberpunk hex design.
 * Run: node generate-icons-builtin.mjs
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'apps', 'client', 'public', 'icons');

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// ── PNG helpers (pure JS) ─────────────────────────────────────

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const combined = Buffer.concat([t, data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(combined));
  return Buffer.concat([len, t, data, c]);
}

function adler32(data) {
  let s1 = 1, s2 = 0;
  for (const b of data) { s1 = (s1 + b) % 65521; s2 = (s2 + s1) % 65521; }
  return ((s2 << 16) | s1) >>> 0;
}

function deflateRaw(data) {
  // Minimal inflate: store method (no compression) for simplicity
  const chunks = [];
  const BSIZE = 65535;
  for (let i = 0; i < data.length; i += BSIZE) {
    const block = data.slice(i, i + BSIZE);
    const last = (i + BSIZE >= data.length) ? 1 : 0;
    const header = Buffer.from([last, block.length & 0xff, (block.length >> 8) & 0xff,
      (~block.length) & 0xff, ((~block.length) >> 8) & 0xff]);
    chunks.push(header, block);
  }
  return Buffer.concat(chunks);
}

function zlib(data) {
  const raw = deflateRaw(data);
  const hdr = Buffer.from([0x78, 0x01]); // zlib header: deflate, default compression
  const ad = Buffer.alloc(4); ad.writeUInt32BE(adler32(data));
  return Buffer.concat([hdr, raw, ad]);
}

/** Write a PNG from an RGBA Uint8Array (width × height × 4) */
function makePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // colour type: RGB
  // bytes 10-12: compression=0, filter=0, interlace=0

  // Build raw scanlines (filter byte 0 = None, then RGB)
  const raw = [];
  for (let y = 0; y < height; y++) {
    raw.push(0); // filter none
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = rgba[i + 3] / 255;
      // Composite onto black (for PNG RGB with no alpha)
      raw.push(Math.round(rgba[i] * a), Math.round(rgba[i + 1] * a), Math.round(rgba[i + 2] * a));
    }
  }

  const rawBuf = Buffer.from(raw);
  const idat = zlib(rawBuf);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Icon rendering ────────────────────────────────────────────

const BG   = [3, 7, 18];       // #030712
const ACNT = [34, 211, 238];   // #22d3ee

function hexVertices(cx, cy, r, sides = 6, rotation = -Math.PI / 6) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = (2 * Math.PI * i / sides) + rotation;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

/** Point-in-convex-polygon test */
function inPoly(px, py, poly) {
  let inside = true;
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i];
    const [bx, by] = poly[(i + 1) % poly.length];
    const cross = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
    if (cross > 0) { inside = false; break; }
  }
  return inside;
}

function mix(a, b, t) {
  return a.map((v, i) => Math.round(v * (1 - t) + b[i] * t));
}

function renderIcon(size) {
  const rgba = new Uint8Array(size * size * 4);
  const cx = size / 2, cy = size / 2;
  const rOuter = size * 0.42;
  const rInner = size * 0.27;
  const rCore  = size * 0.08;
  const borderW = size * 0.025;

  const outerPoly = hexVertices(cx, cy, rOuter);
  const innerPoly = hexVertices(cx, cy, rInner);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let r = BG[0], g = BG[1], b = BG[2], a = 255;

      if (inPoly(x, y, outerPoly)) {
        // Background fill inside outer hex
        r = BG[0]; g = BG[1]; b = BG[2];

        // Glow: radial gradient around centre
        const glowT = Math.max(0, 1 - dist / (size * 0.45));
        const glow = mix(BG, ACNT.map(v => Math.min(255, v + 30)), glowT * 0.12);
        r = glow[0]; g = glow[1]; b = glow[2];

        // Border ring on outer hex
        const borderPoly = hexVertices(cx, cy, rOuter - borderW);
        if (!inPoly(x, y, borderPoly)) {
          // On the border: blend accent
          const t = 0.85 + 0.15 * Math.random(); // slight shimmer
          r = Math.round(ACNT[0] * t);
          g = Math.round(ACNT[1] * t);
          b = Math.round(ACNT[2] * t);
        }

        // Filled inner hex
        if (inPoly(x, y, innerPoly)) {
          r = ACNT[0]; g = ACNT[1]; b = ACNT[2];

          // Core circle cutout
          if (dist < rCore) {
            r = BG[0]; g = BG[1]; b = BG[2];
          }
        }
      } else {
        a = 0; // transparent outside outer hex
        r = 0; g = 0; b = 0;
      }

      rgba[idx]     = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = a;
    }
  }
  return rgba;
}

// ── Generate all sizes ────────────────────────────────────────

for (const size of SIZES) {
  const rgba = renderIcon(size);
  const png = makePNG(size, size, rgba);
  const out = join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(out, png);
  console.log(`✓ icon-${size}.png  (${png.length} bytes)`);
}

console.log('\n✅ All Logic Arena PWA icons generated!');
