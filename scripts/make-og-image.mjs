// One-off generator for public/og-image.png (1200×630 Open Graph card).
// Run: node scripts/make-og-image.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og-image.png');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- subtle gold hairline frame -->
  <rect x="40" y="40" width="1120" height="550" rx="28" fill="none" stroke="#FBBF24" stroke-opacity="0.25" stroke-width="2"/>
  <!-- soccer-ball star accent, echoing the favicon -->
  <g transform="translate(600 145)">
    <circle r="52" fill="none" stroke="#FBBF24" stroke-opacity="0.4" stroke-width="4"/>
    <path d="M0 -36 L9.5 -11 L36 -11 L15 6 L23 33 L0 16 L-23 33 L-15 6 L-36 -11 L-9.5 -11 Z" fill="#DC2626"/>
  </g>
  <text x="600" y="385" text-anchor="middle" font-family="Arial Black, Helvetica, Arial, sans-serif"
        font-size="168" font-weight="800" letter-spacing="6" fill="#FBBF24">WC 2026</text>
  <text x="600" y="470" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="46" font-weight="600" letter-spacing="2" fill="#F8FAFC">Your World Cup companion</text>
  <text x="600" y="565" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="28" font-weight="500" letter-spacing="1" fill="#64748B">fifa-world-cup-2026-one.vercel.app</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(out);
console.log('Wrote', out);
