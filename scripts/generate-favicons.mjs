#!/usr/bin/env node
/**
 * Generates favicon and PWA icon variants from the logomark source image.
 * Run: node scripts/generate-favicons.mjs
 */
import sharp from "sharp";
import toIco from "to-ico";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../frontend/public");
const source = resolve(publicDir, "logo/logomark.png");

const sizes = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "mstile-150x150.png", size: 150 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
];

async function main() {
  console.log(`Source: ${source}`);

  // Resize for each target size
  for (const { name, size } of sizes) {
    const out = resolve(publicDir, name);
    await sharp(source).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(out);
    console.log(`  ✓ ${name} (${size}x${size})`);
  }

  // Apple touch icon: 180x180 with white background and padding
  const applePath = resolve(publicDir, "apple-touch-icon.png");
  const padded = await sharp(source)
    .resize(152, 152, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({
    create: { width: 180, height: 180, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: padded, gravity: "centre" }])
    .png()
    .toFile(applePath);
  console.log("  ✓ apple-touch-icon.png (180x180, white bg, padded)");

  // Generate favicon.ico from 16x16 and 32x32
  const png16 = readFileSync(resolve(publicDir, "favicon-16x16.png"));
  const png32 = readFileSync(resolve(publicDir, "favicon-32x32.png"));
  const ico = await toIco([png16, png32]);
  writeFileSync(resolve(publicDir, "favicon.ico"), ico);
  console.log("  ✓ favicon.ico");

  console.log("\nDone! All favicons generated.");
}

main().catch((err) => {
  console.error("Error generating favicons:", err);
  process.exit(1);
});
