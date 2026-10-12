import { useEffect, useRef } from "react";
import type { PipelineState } from "../hooks/useSession.ts";

type WaveformStageProps = {
  tick: number;
  pipeline: PipelineState;
  running: boolean;
};

const BARS = 96;

/**
 * Waveform STAGE (redesign 2026-10-12, direction §7.5): the hero moment —
 * a large canvas of accent-green bars on near-black. Decorative but synced:
 * each delivered engine frame advances one tick and the amplitude envelope
 * follows the REAL pipeline state (tall while LISTENING/SPEAKING, low
 * otherwise). Labeled as a visualization. Frozen under
 * prefers-reduced-motion.
 */
export function WaveformStage({ tick, pipeline, running }: WaveformStageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelsRef = useRef<number[]>(new Array(BARS).fill(0.04));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Deterministic pseudo-random from the tick so motion is stable & synced.
    const seeded = (seed: number) => {
      let x = (seed * 2654435761) >>> 0;
      return () => {
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        return ((x >>> 0) % 1000) / 1000;
      };
    };

    const active = running && (pipeline === "LISTENING" || pipeline === "SPEAKING");
    const rand = seeded(tick + 1);
    const levels = levelsRef.current;
    levels.shift();
    const target = reduced ? 0.04 : active ? 0.35 + rand() * 0.65 : 0.03 + rand() * 0.08;
    levels.push(target);

    ctx.clearRect(0, 0, w, h);
    const barW = w / BARS;
    for (let i = 0; i < BARS; i++) {
      const lvl = levels[i];
      const bh = Math.max(2, lvl * h);
      const x = i * barW + barW * 0.22;
      const y = (h - bh) / 2;
      const isHot = active && i === BARS - 1;
      ctx.fillStyle = isHot ? "#1db954" : "rgba(29, 185, 84, 0.5)";
      if (typeof ctx.roundRect === "function") {
        ctx.beginPath();
        ctx.roundRect(x, y, barW * 0.56, bh, barW * 0.28);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, barW * 0.56, bh);
      }
    }
  }, [tick, pipeline, running]);

  return (
    <div
      className="rounded-card px-4 py-4 md:px-6"
      style={{ background: "var(--bg-pure)", boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-baseline justify-between mb-2 px-1">
        <p className="text-eyebrow">Live audio</p>
        <span className="text-mono-micro" style={{ color: "var(--fg-muted)" }}>
          visualization &mdash; driven by engine frames
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ height: 148, display: "block" }}
        role="img"
        aria-label={`Audio level visualization, pipeline state ${pipeline.toLowerCase()}`}
      />
    </div>
  );
}
