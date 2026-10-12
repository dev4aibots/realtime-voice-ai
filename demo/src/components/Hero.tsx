import { Aurora } from "./ui/aurora.tsx";

type HeroProps = {
  running: boolean;
  turnLatencyMs: number | null;
  onStart: () => void;
  onStop: () => void;
};

/**
 * Session hero (DESIGN.md §8.1): brand-black -> canvas panel, ONE Aurora
 * anchor at 12% opacity with green colorStops, pulsing live dot, display
 * headline, green pill CTA, live end-to-end latency readout, and the
 * SIMULATED PIPELINE honesty badge.
 */
export function Hero({ running, turnLatencyMs, onStart, onStop }: HeroProps) {
  return (
    <header
      className="relative overflow-hidden rounded-panel"
      style={{
        background: "linear-gradient(180deg, var(--bg-brand-black) 0%, var(--bg-canvas) 100%)",
        border: "1px solid var(--border-hairline)",
        boxShadow: "var(--shadow-panel)",
        // Establish a stacking context so the Aurora anchor (z-bg: -1)
        // paints above this panel's own background, not behind it.
        isolation: "isolate",
      }}
    >
      <Aurora colorStops={["#1ed760", "#1db954", "#191414"]} amplitude={1.1} speed={0.5} opacity={0.12} />

      <div className="relative z-base px-8 md:px-12 py-12 md:py-16" style={{ maxWidth: "var(--container-max)" }}>
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
            Simulated pipeline &mdash; no real audio / models
          </span>
        </div>

        <h1 className="text-display text-primary" style={{ maxWidth: 720 }}>
          A voice assistant, thinking out loud.
        </h1>
        <p className="text-body text-secondary mt-4" style={{ maxWidth: 640 }}>
          Watch a simulated low-latency voice pipeline run its full turn:
          VAD detects speech, the turn-taking state machine yields, the LLM
          streams, and TTS answers &mdash; every event rendered live from the
          real engine frames.
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
            <span className="text-eyebrow">end-to-end turn latency</span>
          </div>
        </div>
      </div>
    </header>
  );
}
