const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// width x height, used for the <link rel="apple-touch-startup-image"> media queries
const SPLASH_SIZES = [
  { width: 2048, height: 2732, name: "splash-2048x2732.png" }, // iPad Pro 12.9"
  { width: 1668, height: 2388, name: "splash-1668x2388.png" }, // iPad Pro 11"
  { width: 1290, height: 2796, name: "splash-1290x2796.png" }, // iPhone 14 Pro Max
  { width: 1179, height: 2556, name: "splash-1179x2556.png" }, // iPhone 14 Pro
  { width: 1170, height: 2532, name: "splash-1170x2532.png" }, // iPhone 13
  { width: 750, height: 1334, name: "splash-750x1334.png" },   // iPhone SE
];

const OUT_DIR = path.join(__dirname, "..", "public", "splash");
fs.mkdirSync(OUT_DIR, { recursive: true });

// Dark background with the Arc icon (white upward arc) centred.
function buildSvg(width, height) {
  const iconSize = Math.min(width, height) * 0.22;
  const cx = width / 2;
  const cy = height / 2;
  const half = iconSize / 2;
  const radius = iconSize * 0.22;
  const strokeWidth = Math.max(2, iconSize * 0.085);

  const x0 = cx - half + iconSize * 0.16;
  const x1 = cx;
  const x2 = cx + half - iconSize * 0.16;
  const yBase = cy + half * 0.44;
  const yPeak = cy - half * 0.56;

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#0D0D12" />
  <rect x="${cx - half}" y="${cy - half}" width="${iconSize}" height="${iconSize}" rx="${radius}" fill="#16161E" />
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
  for (const { width, height, name } of SPLASH_SIZES) {
    const svg = buildSvg(width, height);
    const outPath = path.join(OUT_DIR, name);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    console.log(`Wrote ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
