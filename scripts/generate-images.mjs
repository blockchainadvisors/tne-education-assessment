#!/usr/bin/env node
/**
 * Generates all graphic assets for the TNE Assessment Platform
 * using Google Gemini's image generation API (gemini-2.5-flash-image).
 *
 * Prerequisites: Enable billing at aistudio.google.com/api-keys
 * Usage: GEMINI_API_KEY=<key> node scripts/generate-images.mjs
 *
 * After running, also run: node scripts/generate-favicons.mjs
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "../frontend/public");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY env variable is required");
  console.error("Get one at: https://aistudio.google.com/api-keys");
  console.error("Billing must be enabled for image generation.");
  process.exit(1);
}

const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

const images = [
  // Logomark
  {
    path: "logo/logomark.png",
    prompt:
      "Professional logomark icon for TNE Assessment (Transnational Education Quality Assessment Platform). Geometric minimalist globe formed by clean arcs and meridian lines with a subtle integrated checkmark or quality shield element. Primary color indigo #4f46e5, accent lighter indigo #818cf8. Slight isometric perspective tilt. Clean vector style, minimal, professional, no gradients. White background. Must be recognizable at small sizes. Square composition, centered.",
  },
  // White logo variant
  {
    path: "logo/logomark-white.png",
    prompt:
      "Professional logomark icon for TNE Assessment. Geometric minimalist globe formed by clean arcs and meridian lines with a subtle integrated checkmark. ALL elements are pure white color only. Transparent background (use checkerboard or very dark background to show white elements). Clean vector style, minimal. Square composition, centered. The logo must be entirely white colored.",
  },
  // OG Image
  {
    path: "og-image.png",
    prompt:
      "Professional social media card 1200x630 pixels for TNE Assessment Platform. Gradient background from indigo #4f46e5 to dark indigo #312e81. Large semi-transparent globe watermark on right. Left side shows TNE Assessment in bold white text, Transnational Education Quality Assessment Platform in lighter text below. Subtle isometric geometric shapes in background. Clean corporate professional.",
  },
  // Twitter Card
  {
    path: "twitter-card.png",
    prompt:
      "Professional social media card 1200x600 pixels for TNE Assessment Platform. Gradient background from indigo #4f46e5 to dark indigo #312e81. Large semi-transparent globe watermark on right. Left side shows TNE Assessment in bold white text, Transnational Education Quality Assessment Platform in lighter text below. Subtle isometric geometric shapes in background. Clean corporate professional.",
  },
  // Auth Illustrations
  {
    path: "illustrations/auth-login.png",
    prompt:
      "Professional isometric 3D illustration for login page. Isometric laptop with lock shield symbol, person approaching to sign in, subtle education elements like books and graduation cap. Primary indigo #4f46e5, secondary light indigo #c7d2fe and slate #94a3b8. Clean isometric 3D modern SaaS style. White background. No text. Square composition.",
  },
  {
    path: "illustrations/auth-register.png",
    prompt:
      "Professional isometric 3D illustration for institution registration. University building, globe element suggesting transnational, person at desk creating account, clipboard checklist for assessment. Primary indigo #4f46e5. Clean isometric 3D professional. White background. No text.",
  },
  {
    path: "illustrations/auth-email-sent.png",
    prompt:
      "Professional isometric 3D illustration for check your email page. Envelope flying from laptop screen toward mailbox inbox tray, checkmark confirmation element. Primary indigo #4f46e5. Clean isometric 3D professional SaaS. White background. No text.",
  },
  {
    path: "illustrations/auth-magic-link.png",
    prompt:
      "Professional isometric 3D illustration for magic link passwordless sign in. Magic wand with sparkles touching link chain icon, laptop nearby showing login. Primary indigo #4f46e5. Clean isometric 3D. White background. No text.",
  },
  // Dashboard & UI Illustrations
  {
    path: "illustrations/empty-assessments.png",
    prompt:
      "Professional isometric 3D illustration for no assessments empty state. Isometric clipboard with large plus symbol dotted outline, pen desk. Inviting action-oriented feel. Primary indigo #4f46e5. White background. No text.",
  },
  {
    path: "illustrations/empty-no-results.png",
    prompt:
      "Professional isometric 3D illustration for no results found. Magnifying glass over empty document folder, subtle question mark. Neutral not discouraging. Primary indigo #4f46e5. White background. No text.",
  },
  {
    path: "illustrations/404.png",
    prompt:
      "Professional isometric 3D 404 page not found illustration. Broken disconnected road, signpost pointing different directions, confused compass map element. 404 on the signpost. Primary indigo #4f46e5, amber #f59e0b warning accent. White background.",
  },
  {
    path: "illustrations/error.png",
    prompt:
      "Professional isometric 3D server error illustration. Server rack with warning symbols sparks wrench for maintenance. Caution triangle. Temporary issue feeling. Primary indigo #4f46e5, red #ef4444. White background.",
  },
  {
    path: "illustrations/welcome.png",
    prompt:
      "Professional isometric 3D welcome getting started illustration for education assessment platform. Person at desk with laptop, globe books charts showing improvement checkmark. Optimistic forward-looking. Primary indigo #4f46e5, emerald #10b981. White background. No text.",
  },
];

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateImage(prompt, retries = 3) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429) {
      const wait = attempt * 30;
      console.log(` (rate limited, waiting ${wait}s)...`);
      await sleep(wait * 1000);
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status}: ${text.substring(0, 300)}`);
    }

    const data = await res.json();

    for (const candidate of data.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          return Buffer.from(part.inlineData.data, "base64");
        }
      }
    }

    throw new Error("No image data in response");
  }

  throw new Error("Max retries exceeded (rate limited)");
}

async function main() {
  // Ensure directories exist
  mkdirSync(resolve(publicDir, "logo"), { recursive: true });
  mkdirSync(resolve(publicDir, "illustrations"), { recursive: true });

  // Check which images already exist (skip if regenerate not requested)
  const skipExisting = !process.argv.includes("--force");
  const toGenerate = skipExisting
    ? images.filter((img) => !existsSync(resolve(publicDir, img.path)))
    : images;

  if (toGenerate.length === 0) {
    console.log("All images already exist. Use --force to regenerate.");
    return;
  }

  console.log(
    `Generating ${toGenerate.length} of ${images.length} images...\n`
  );

  let success = 0;
  let failed = 0;

  for (const img of toGenerate) {
    const outPath = resolve(publicDir, img.path);
    process.stdout.write(`  ${img.path}...`);

    try {
      const buffer = await generateImage(img.prompt);
      writeFileSync(outPath, buffer);
      console.log(` done (${(buffer.length / 1024).toFixed(0)} KB)`);
      success++;
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
      failed++;
    }

    // Rate limit delay between requests
    await sleep(3000);
  }

  console.log(`\n${success} generated, ${failed} failed.`);

  if (failed > 0) {
    console.log("Re-run to retry failed images (existing ones are skipped).");
  }

  if (success > 0) {
    console.log("\nNext: node scripts/generate-favicons.mjs");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
