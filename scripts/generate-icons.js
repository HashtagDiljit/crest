const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUT_DIR = path.join(__dirname, "..", "public", "icons");

fs.mkdirSync(OUT_DIR, { recursive: true });

// Builds an SVG: dark rounded-square background with the Kairos K mark.
// The K mark is built from 5 lines forming a stylised K.
// `padding` shrinks the safe area (used for the maskable 512px icon).
function buildSvg(size, padding = 0) {
  const scale = size / 44;
  const inset = size * padding;
  const innerSize = size - inset * 2;
  const innerScale = innerSize / 44;

  const radius = 12 * scale;
  const sw = Math.max(1, 1.8 * innerScale);

  // K mark coordinates scaled from 44x44 reference, offset by inset
  const p = (v) => inset + v * innerScale;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#1a1a24" />
  <line x1="${p(16)}" y1="${p(12)}" x2="${p(16)}" y2="${p(32)}" stroke="#64b4a0" stroke-width="${sw}" stroke-linecap="round"/>
  <line x1="${p(16)}" y1="${p(22)}" x2="${p(28)}" y2="${p(12)}" stroke="#64b4a0" stroke-width="${sw}" stroke-linecap="round"/>
  <line x1="${p(16)}" y1="${p(22)}" x2="${p(28)}" y2="${p(32)}" stroke="#64b4a0" stroke-width="${sw}" stroke-linecap="round"/>
  <line x1="${p(23)}" y1="${p(17)}" x2="${p(32)}" y2="${p(12)}" stroke="#64b4a0" stroke-width="${sw}" stroke-linecap="round"/>
  <line x1="${p(23)}" y1="${p(27)}" x2="${p(32)}" y2="${p(32)}" stroke="#64b4a0" stroke-width="${sw}" stroke-linecap="round"/>
</svg>`;
}

async function main() {
  for (const size of SIZES) {
    const padding = size === 512 ? 0.1 : 0;
    const svg = buildSvg(size, padding);
    const outPath = path.join(OUT_DIR, `icon-${size}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`Wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
