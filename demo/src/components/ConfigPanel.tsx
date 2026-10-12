import { useMemo } from "react";
import type { CustomConfig } from "../hooks/useSession.ts";
import {
  scriptedBargeInAnchorMs,
  effectiveBargeInFireMs,
  maxBargeInMs,
} from "../engine/sessions.ts";

type ConfigPanelProps = {
  config: CustomConfig;
  running: boolean;
  onChange: (c: CustomConfig) => void;
};

/**
 * Config panel (DESIGN.md §8.7, shadcn-style): prompt-script text input,
 * weather-tool toggle, barge-in time slider (ms). Editing anything routes
 * the next run to the Custom preset. Slider honors the engine's real
 * interruption anchor — the effective window is displayed, not hidden.
 */
export function ConfigPanel({ config, running, onChange }: ConfigPanelProps) {
  // BUG-11: every number here comes from the engine itself — never a
  // duplicated formula. anchorMs is the scripted interruption point,
  // effMs is the REAL time the engine will fire at for this slider value
  // (null = off), and the slider max is clamped to the range the engine
  // can honor exactly (8 injected frames must fit in the session).
  const anchorMs = useMemo(() => scriptedBargeInAnchorMs(config.script), [config.script]);
  const effMs = useMemo(
    () => effectiveBargeInFireMs(config.script, config.bargeInMs),
    [config.script, config.bargeInMs],
  );
  const sliderMax = useMemo(() => maxBargeInMs(config.script), [config.script]);
  const fill = config.bargeInMs > 0 ? Math.min(100, (config.bargeInMs / sliderMax) * 100) : 0;

  const set = (patch: Partial<CustomConfig>) => onChange({ ...config, ...patch });

  return (
    <section aria-label="Session configuration">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-title text-primary">Tune the session</h2>
        <span className="text-mono-micro hidden sm:inline" style={{ color: "var(--fg-muted)" }}>
          changes apply to the next run
        </span>
      </div>
      <div
        className="rounded-card p-6"
        style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="cfg-script" className="text-eyebrow block mb-3">
              What you say to it
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
              The engine builds 20ms frames from these words &mdash; there is no microphone.
            </p>
          </div>

          <div className="flex flex-col" style={{ gap: "var(--space-6)" }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-body-strong text-primary">Check the weather</p>
                <p className="text-caption mt-1">
                  weather.tokyo_tomorrow &middot; answers in 420ms &middot; filler at +300ms
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={config.useTool}
                aria-label="Check the weather tool"
                className="toggle-spotify"
                data-on={config.useTool}
                disabled={running}
                onClick={() => set({ useTool: !config.useTool })}
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between mb-3">
                <label htmlFor="cfg-barge" className="text-eyebrow">
                  Interrupt it at
                </label>
                <span className="text-mono text-secondary">
                  {effMs === null ? "off" : `${effMs}ms`}
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
                aria-label="Interrupt time in milliseconds, 0 for off"
              />
              <p className="text-caption mt-2" style={{ color: "var(--fg-muted)" }}>
                {effMs !== null ? (
                  <>
                    The engine injects 8 speech frames at{" "}
                    <span className="text-mono" style={{ color: "var(--fg-tertiary)" }}>
                      {effMs}ms
                    </span>{" "}
                    (span {effMs}&ndash;{effMs + 140}ms); interruption fires then,
                    but only while the assistant is responding. The real fire
                    time is read from the BARGE-IN event.
                  </>
                ) : (
                  <>
                    Barge-in is <strong>off</strong> &mdash; the session runs
                    uninterrupted. The scripted interruption point for this
                    script is{" "}
                    <span className="text-mono" style={{ color: "var(--fg-tertiary)" }}>
                      {anchorMs}ms
                    </span>
                    ; drag the slider there to interrupt the response.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
