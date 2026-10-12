import { useMemo } from "react";

/**
 * Aurora — animated green aurora hero anchor (TS-TW, owned source).
 * Contract mirrors DavidHDev/react-bits Aurora-TS-TW (MIT + Commons Clause,
 * referenced for the API shape; this is an original implementation written for
 * the token contract): `colorStops` (≥3 greens), `amplitude` (~1.0–1.2),
 * `speed` (~0.5), rendered at `opacity` ≤ 12% over --bg-canvas.
 * Decorative only — frozen under prefers-reduced-motion.
 * NOTE: the anchor parent MUST establish a stacking context (e.g.
 * `isolation: isolate`) or this z-bg:-1 layer will paint behind the
 * parent's own background instead of above it.
 */
export type AuroraProps = {
  colorStops: [string, string, string];
  amplitude?: number;
  speed?: number;
  opacity?: number;
  className?: string;
};

export function Aurora({
  colorStops,
  amplitude = 1.1,
  speed = 0.5,
  opacity = 0.12,
  className = "",
}: AuroraProps) {
  const [c1, c2, c3] = colorStops;
  const clamped = Math.min(opacity, 0.12); // ≤12% hard cap (DESIGN.md)
  const durA = useMemo(() => `${(28 / speed).toFixed(1)}s`, [speed]);
  const durB = useMemo(() => `${(36 / speed).toFixed(1)}s`, [speed]);
  const amp = amplitude;

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        opacity: clamped,
        pointerEvents: "none",
        zIndex: "var(--z-bg)",
      }}
    >
      <div
        className="aurora-animated"
        style={{
          position: "absolute",
          width: `${120 * amp}%`,
          height: `${90 * amp}%`,
          left: "-10%",
          top: "-20%",
          background: `radial-gradient(ellipse 60% 50% at 40% 40%, ${c1} 0%, ${c1}99 35%, transparent 70%)`,
          filter: "blur(60px)",
          animation: `aurora-drift-a ${durA} ease-in-out infinite`,
        }}
      />
      <div
        className="aurora-animated"
        style={{
          position: "absolute",
          width: `${110 * amp}%`,
          height: `${100 * amp}%`,
          right: "-15%",
          top: "10%",
          background: `radial-gradient(ellipse 55% 55% at 60% 50%, ${c2} 0%, ${c2}99 35%, transparent 70%)`,
          filter: "blur(70px)",
          animation: `aurora-drift-b ${durB} ease-in-out infinite`,
        }}
      />
      <div
        className="aurora-animated"
        style={{
          position: "absolute",
          width: `${90 * amp}%`,
          height: `${80 * amp}%`,
          left: "20%",
          bottom: "-30%",
          background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${c3} 0%, ${c3}99 35%, transparent 70%)`,
          filter: "blur(80px)",
          animation: `aurora-drift-a ${(44 / speed).toFixed(1)}s ease-in-out infinite reverse`,
        }}
      />
    </div>
  );
}
