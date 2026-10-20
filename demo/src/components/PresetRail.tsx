import type { SessionPreset } from "../hooks/useSession.ts";

type PresetRailProps = {
  preset: SessionPreset;
  running: boolean;
  onPreset: (p: SessionPreset) => void;
};

const PRESET_OPTIONS: { value: SessionPreset; title: string; blurb: string; meta: string }[] = [
  {
    value: "clean",
    title: "Clean call",
    blurb: "One smooth turn, start to finish. Nobody interrupts.",
    meta: "scripted weather question",
  },
  {
    value: "barge-in",
    title: "Barge-in",
    blurb: "You cut in while it answers, and it has to recover.",
    meta: "interrupts at 3840ms",
  },
  {
    value: "custom",
    title: "Custom mix",
    blurb: "Your script and your settings from the panel below.",
    meta: "edited below",
  },
];

/**
 * Preset rail (redesign 2026-10-12, direction §7.5): session presets as a
 * horizontal snap-scroll rail — NOT cards, NOT a dropdown. Buttons keep the
 * exact same behavior as the old select (choose preset, sync config, reset).
 * Disabled while a session runs, like the old select was.
 */
export function PresetRail({ preset, running, onPreset }: PresetRailProps) {
  return (
    <section aria-label="Session presets">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-title text-primary">Pick a session</h2>
        <span className="text-mono-micro hidden sm:inline" style={{ color: "var(--fg-muted)" }}>
          swipe or scroll
        </span>
      </div>
      <div className="rail du-rail-fade" role="group" aria-label="Session preset options">
        {PRESET_OPTIONS.map((o) => {
          const isActive = preset === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onPreset(o.value)}
              disabled={running}
              aria-pressed={isActive}
              className="text-left rounded-card p-5"
              style={{
                background: isActive ? "var(--bg-interactive)" : "var(--bg-card)",
                border: isActive
                  ? "1px solid var(--accent-functional)"
                  : "1px solid var(--border-hairline)",
                boxShadow: "var(--shadow-card)",
                cursor: running ? "not-allowed" : "pointer",
                opacity: running && !isActive ? 0.55 : 1,
                transition:
                  "border-color var(--motion-duration-short) var(--motion-easing-hover), background-color var(--motion-duration-short) var(--motion-easing-hover)",
              }}
            >
              <span className="flex items-center gap-2">
                <span
                  className="inline-block rounded-circle"
                  style={{
                    width: 8,
                    height: 8,
                    background: isActive ? "var(--accent-functional)" : "var(--fg-muted)",
                  }}
                  aria-hidden="true"
                />
                <span
                  className="text-h3"
                  style={{ color: isActive ? "var(--accent-functional)" : "var(--fg-primary)" }}
                >
                  {o.title}
                </span>
              </span>
              <span className="text-caption block mt-2">{o.blurb}</span>
              <span className="text-mono-micro block mt-3" style={{ color: "var(--fg-muted)" }}>
                {o.meta}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
