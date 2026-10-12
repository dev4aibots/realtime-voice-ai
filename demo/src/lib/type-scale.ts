/**
 * Vendored fluid type-scale generator (MIT:
 * AleksandrHovhannisyan/fluid-type-scale-calculator).
 *
 * Standard fluid-type math: linear interpolation between a min and max
 * viewport width, emitted as CSS clamp(). Kept as code (not magic numbers)
 * so the scale can be regenerated: `node scripts/gen-type-scale.mjs`.
 */

export type TypeStep = {
  /** token name, e.g. "--text-display" */
  name: string;
  /** px size at minViewport */
  minSize: number;
  /** px size at maxViewport */
  maxSize: number;
  /** line-height (unitless) */
  leading: number;
  /** letter-spacing (em) */
  tracking: number;
  /** font-weight */
  weight: number;
  /** which --font-* family token to use */
  family: "--font-display" | "--font-ui" | "--font-mono";
};

export function clampFor(
  minSize: number,
  maxSize: number,
  minViewport = 360,
  maxViewport = 1200,
): string {
  const slope = (maxSize - minSize) / (maxViewport - minViewport);
  const intercept = minSize - slope * minViewport;
  const vw = (slope * 100).toFixed(3).replace(/\.?0+$/, "");
  const y = intercept.toFixed(2).replace(/\.?0+$/, "");
  const min = minSize.toFixed(2).replace(/\.?0+$/, "");
  const max = maxSize.toFixed(2).replace(/\.?0+$/, "");
  return `clamp(${min}px, ${y}px + ${vw}vw, ${max}px)`;
}

export function cssForSteps(steps: TypeStep[]): string {
  return steps
    .map(
      (s) =>
        `  ${s.name}: ${s.weight} ${clampFor(s.minSize, s.maxSize)}/${s.leading} var(${s.family});`,
    )
    .join("\n");
}
