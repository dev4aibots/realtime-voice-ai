import { Aurora } from "./ui/aurora.tsx";
import { WaveformStage } from "./Waveform.tsx";
import type { PipelineState } from "../hooks/useSession.ts";

type HeroProps = {
  running: boolean;
  turnLatencyMs: number | null;
  tick: number;
  pipeline: PipelineState;
  onStart: () => void;
  onStop: () => void;
};

/**
 * Session hero (redesign 2026-10-12, direction §7.5): the waveform STAGE is
 * the hero moment — one Aurora anchor at ≤12% opacity, Sora display headline
 * "Talk to it. It talks back — instantly.", a 10-second story up top, and the
 * live answer-speed readout. The SIMULATED PIPELINE honesty badge stays.
 */
export function Hero({ running, turnLatencyMs, tick, pipeline, onStart, onStop }: HeroProps) {
  return (
    <header
      className="relative overflow-hidden rounded-panel"
      style={{
        background: "var(--bg-brand-black)",
        border: "1px solid var(--border-hairline)",
        boxShadow: "var(--shadow-panel)",
        // Stacking context so the Aurora anchor (z-bg: -1) paints above this
        // panel's own background, not behind it.
        isolation: "isolate",
      }}
    >
      <Aurora colorStops={["#1db954", "#1ed760", "#191414"]} amplitude={1.1} speed={0.5} opacity={0.12} />

      <div className="relative z-base px-6 md:px-12 pt-10 md:pt-14 pb-8" style={{ maxWidth: "var(--container-max)" }}>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="flex items-center gap-2">
            <span
              className="live-dot inline-block rounded-circle"
              style={{ width: 8, height: 8, background: "var(--accent-functional)" }}
              aria-hidden="true"
            />
            <span className="text-eyebrow">Live voice session</span>
          </span>
          <span
            className="text-mono-micro rounded-sm px-2 py-1"
            style={{
              border: "1px solid var(--border-hairline)",
              color: "var(--fg-secondary)",
              background: "var(--bg-pure)",
            }}
          >
            Simulated pipeline &mdash; no real audio or models
          </span>
        </div>

        <h1 className="text-display text-primary" style={{ maxWidth: "22ch" }}>
          Talk to it. It talks back &mdash; instantly.
        </h1>
        <p className="text-body text-secondary mt-4" style={{ maxWidth: "58ch" }}>
          A pretend voice assistant that runs a whole conversation turn right
          in your browser. Press Start session: it listens to you, thinks out
          loud, and answers in about 200 milliseconds. Every number below
          comes straight from the engine.
        </p>

        <div className="flex flex-wrap items-center gap-6 mt-8">
          {running ? (
            <button type="button" className="btn-primary" onClick={onStop} aria-label="End session">
              End session
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={onStart} aria-label="Start session">
              Start session
            </button>
          )}
          <div className="flex items-baseline gap-3">
            <span className="text-mono-xl text-primary" style={{ fontVariantNumeric: "tabular-nums" }}>
              {turnLatencyMs === null ? "\u2014" : `${turnLatencyMs}ms`}
            </span>
            <span className="text-eyebrow">answer speed</span>
          </div>
        </div>
      </div>

      <div className="relative z-base px-6 md:px-12 pb-10 md:pb-12">
        <WaveformStage tick={tick} pipeline={pipeline} running={running} />
      </div>
    </header>
  );
}
