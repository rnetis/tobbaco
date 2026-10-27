// Generates PWA icons (192, 512, maskable, apple-touch 180) from an inline SVG
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const svg = (maskable = false) => {
  // maskable: safe zone — content within inner 80%
  const scale = maskable ? 0.72 : 0.86;
  const cx = 512, cy = 512;
  return `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
  </defs>
  ${maskable
    ? `<rect width="512" height="512" fill="url(#bg)"/>`
    : `<rect width="512" height="512" rx="112" fill="url(#bg)"/>`}
  <g transform="translate(${cx * (1 - scale) / 2}, ${cy * (1 - scale) / 2}) scale(${scale})">
    <!-- open box / package icon -->
    <path d="M256 96 L416 176 L256 256 L96 176 Z" fill="#ffffff" opacity="0.95"/>
    <path d="M96 176 L256 256 L256 416 L96 336 Z" fill="#ffffff" opacity="0.75"/>
    <path d="M416 176 L256 256 L256 416 L416 336 Z" fill="#ffffff" opacity="0.55"/>
    <path d="M176 136 L336 216 L296 236 L136 156 Z" fill="#d1fae5"/>
  </g>
</svg>`;
};

async function main() {
  const outDir = path.join(__dirname, "..", "public", "icons");
  fs.mkdirSync(outDir, { recursive: true });

  const jobs = [
    { file: "icon-192.png", svg: svg(false), size: 192 },
    { file: "icon-512.png", svg: svg(false), size: 512 },
    { file: "icon-maskable-192.png", svg: svg(true), size: 192 },
    { file: "icon-maskable-512.png", svg: svg(true), size: 512 },
    { file: "apple-touch-icon.png", svg: svg(false), size: 180 },
  ];

  for (const job of jobs) {
    await sharp(Buffer.from(job.svg))
      .resize(job.size, job.size)
      .png()
      .toFile(path.join(outDir, job.file));
    console.log("created", job.file);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
