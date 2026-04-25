/**
 * Icon Generator for Logic Arena PWA
 * Generates hex-shaped PNG icons in all required sizes
 * Run once: node generate-icons.mjs
 */

import { createCanvas } from 'canvas';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUT_DIR = join(__dirname, 'apps', 'client', 'public', 'icons');

const BG = '#030712';
const ACCENT = '#22d3ee';
const GLOW = 'rgba(34, 211, 238, 0.35)';

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

function drawHexIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, size, size);

  // Hex shape clip path
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();

  // Glow fill
  ctx.shadowColor = ACCENT;
  ctx.shadowBlur = size * 0.1;
  ctx.fillStyle = 'rgba(34, 211, 238, 0.08)';
  ctx.fill();

  // Hex border
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = size * 0.022;
  ctx.shadowBlur = size * 0.12;
  ctx.stroke();

  // Inner hex (smaller, filled)
  const r2 = size * 0.28;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + r2 * Math.cos(angle);
    const y = cy + r2 * Math.sin(angle);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = ACCENT;
  ctx.shadowBlur = size * 0.2;
  ctx.shadowColor = ACCENT;
  ctx.fill();

  // Center dot accent
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = BG;
  ctx.shadowBlur = 0;
  ctx.fill();

  return canvas.toBuffer('image/png');
}

for (const size of SIZES) {
  const buf = drawHexIcon(size);
  const out = join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(out, buf);
  console.log(`✓ Generated icon-${size}.png`);
}

console.log('\n✅ All PWA icons generated successfully!');
