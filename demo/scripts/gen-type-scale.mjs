/**
 * Regenerate the fluid type scale for the redesign.
 * Usage: node scripts/gen-type-scale.mjs   (paste output into tokens.css §2)
 *
 * Ratio 1.250, 5 steps, min viewport 360px, max 1200px (per DESIGN-SYSTEM §2).
 * Families: Sora (geometric display) / Instrument Sans (quiet grotesque body)
 * / JetBrains Mono (numerals) — DESIGN direction §7.5.
 */
import { cssForSteps } from "../src/lib/type-scale.ts";

const steps = [
  { name: "--text-display", minSize: 40, maxSize: 64, leading: 1.02, tracking: -0.03, weight: 700, family: "--font-display" },
  { name: "--text-title", minSize: 24, maxSize: 32, leading: 1.12, tracking: -0.02, weight: 700, family: "--font-display" },
  { name: "--text-h3", minSize: 17, maxSize: 20, leading: 1.3, tracking: -0.01, weight: 600, family: "--font-display" },
  { name: "--text-body", minSize: 15, maxSize: 16.5, leading: 1.6, tracking: 0, weight: 400, family: "--font-ui" },
  { name: "--text-lyric", minSize: 20, maxSize: 28, leading: 1.35, tracking: -0.015, weight: 600, family: "--font-display" },
];

console.log(cssForSteps(steps));
console.log("  --text-mono-xl: 600 clamp(28px, 24.86px + 0.875vw, 35.5px)/1.2 var(--font-mono);");
