import { useMemo } from "react";
import type { CustomConfig } from "../hooks/useSession.ts";

type ConfigPanelProps = {
  config: CustomConfig;
  running: boolean;
  onChange: (c: CustomConfig) => void;
};

/**
 * Deterministic frame math from engine/vad.ts synthCall (noise=0, as the
 * engine calls it): frames.length = 6 + 16*words + 110, one frame = 20ms.
 * The engine's injectBargeInSpeech anchors interruption speech 8 frames from
 * the end, firing at anchorT. Shown honestly so the slider is meaningful.
 */
function anchorWindow(script: string): { anchorMs: number; windowEndMs: number } {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  const anchorIdx = 6 + 16 * words + 110 - 20;
  const anchorMs = anchorIdx * 20;
  return { anchorMs, windowEndMs: anchorMs + 140 };
}

/**
 * Config panel (DESIGN.md §8.7, shadcn-style): prompt-script text input,
 * weather-tool toggle, barge-in time slider (ms). Editing anything routes
 * the next run to the Custom preset. Slider honors the engine's real
 * interruption anchor — the effective window is displayed, not hidden.
 */
export function ConfigPanel({ config, running, onChange }: ConfigPanelProps) {
  const { anchorMs, windowEndMs } = useMemo(() => anchorWindow(config.script), [config.script]);
  const sliderMax = anchorMs + 1000;
  const fill = config.bargeInMs > 0 ? Math.min(100, (config.bargeInMs / sliderMax) * 100) : 0;

  const set = (patch: Partial<CustomConfig>) => onChange({ ...config, ...patch });

  return (
    <section aria-label="Session configuration">
      <h2 className="text-title text-primary mb-4">Configure</h2>
      <div
        className="rounded-card p-6"
        style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="cfg-script" className="text-eyebrow block mb-3">
              Say to the assistant
            </label>
            <input
              id="cfg-script"
              type="text"
              className="input-spotify"
              value={config.script}
              disabled={running}
              onChange={(e) => set({ script: e.target.value })}
              placeholder="what is the weather in tokyo tomorrow"
              aria-label="Prompt script"
            />
            <p className="text-caption mt-2" style={{ color: "var(--fg-muted)" }}>
              The engine synthesizes 20ms frames for this script &mdash; no microphone.
            </p>
          </div>

          <div className="flex flex-col" style={{ gap: "var(--space-6)" }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-body-strong text-primary">Weather tool</p>
                <p className="text-caption mt-1">
                  weather.tokyo_tomorrow &middot; 420ms latency &middot; filler at +300ms
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.useTool}
                aria-label="Weather tool"
                className="toggle-spotify"
                data-on={config.useTool}
                disabled={running}
                onClick={() => set({ useTool: !config.useTool })}
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-3">
                <label htmlFor="cfg-barge" className="text-eyebrow">
                  Barge-in at
                </label>
                <span className="text-mono text-secondary">
                  {config.bargeInMs === 0 ? "off" : `${config.bargeInMs}ms`}
                </span>
              </div>
              <input
                id="cfg-barge"
                type="range"
                className="slider-spotify"
                min={0}
                max={sliderMax}
                step={20}
                value={config.bargeInMs}
                disabled={running}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  set({ bargeInMs: v === 0 ? 0 : v });
                }}
                style={{ ["--fill" as string]: `${fill}%` }}
                aria-label="Barge-in time in milliseconds, 0 for off"
              />
              <p className="text-caption mt-2" style={{ color: "var(--fg-muted)" }}>
                The engine injects 8 speech frames near the session end; interruption
                fires inside{" "}
                <span className="text-mono" style={{ color: "var(--fg-tertiary)" }}>
                  {anchorMs}&ndash;{windowEndMs}ms
                </span>{" "}
                for this script. The real fire time is read from the BARGE-IN event.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
