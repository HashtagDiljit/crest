const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const OUT_DIR = path.join(__dirname, "..", "public", "icons");

fs.mkdirSync(OUT_DIR, { recursive: true });

// Builds an SVG: dark rounded-square background with a white upward arc
// stroke centred in the icon. `padding` shrinks the safe area (used for
// the maskable 512px icon so the arc isn't clipped by the OS mask).
function buildSvg(size, padding = 0) {
  const inset = size * padding;
  const inner = size - inset * 2;
  const radius = size * 0.22;
  const strokeWidth = Math.max(2, inner * 0.085);

  // Upward arc: starts low-left, curves up to a peak, down to low-right.
  const x0 = inset + inner * 0.16;
  const x1 = inset + inner * 0.5;
  const x2 = inset + inner * 0.84;
  const yBase = inset + inner * 0.72;
  const yPeak = inset + inner * 0.22;

  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#0D0D12" />
  <path
    d="M ${x0} ${yBase} Q ${x1} ${yPeak} ${x2} ${yBase}"
    fill="none"
    stroke="#FFFFFF"
    stroke-width="${strokeWidth}"
    stroke-linecap="round"
  />
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
