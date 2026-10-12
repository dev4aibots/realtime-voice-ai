import type { SessionPreset } from "../hooks/useSession.ts";

type TransportBarProps = {
  running: boolean;
  preset: SessionPreset;
  elapsedMs: number;
  onToggle: () => void;
  onPreset: (p: SessionPreset) => void;
  onReset: () => void;
};

const PRESET_OPTIONS: { value: SessionPreset; label: string }[] = [
  { value: "clean", label: "Session 1 \u00b7 clean call" },
  { value: "barge-in", label: "Session 2 \u00b7 barge-in" },
  { value: "custom", label: "Custom" },
];

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${String(s).padStart(2, "0")}.${tenths}`;
}

/**
 * Transport bar (DESIGN.md §8.2 — Spotify Now Playing idiom): sticky bottom
 * bar, --bg-elevated, circular green push-to-talk, session select, timer.
 * The mic button drives the REAL pipeline states via the engine stream.
 */
export function TransportBar({ running, preset, elapsedMs, onToggle, onPreset, onReset }: TransportBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-overlay"
      style={{
        background: "var(--bg-elevated)",
        borderTop: "1px solid var(--border-hairline)",
        boxShadow: "var(--shadow-float)",
      }}
      role="region"
      aria-label="Session transport"
    >
      <div
        className="mx-auto flex items-center gap-4 px-4 md:px-8"
        style={{ maxWidth: "var(--container-max)", height: 76 }}
      >
        {/* Circular green push-to-talk (play/pause idiom) */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={running ? "Stop session" : "Start session (push to talk)"}
          aria-pressed={running}
          className="rounded-circle flex items-center justify-center flex-none"
          style={{
            width: 52,
            height: 52,
            background: "var(--accent-functional)",
            color: "var(--accent-on)",
            border: "none",
            cursor: "pointer",
            transition: "background-color var(--motion-transition-hover), transform var(--motion-transition-hover)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-hover)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--accent-functional)")}
        >
          {running ? (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <rect x="4" y="4" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <rect x="7" y="2" width="6" height="11" rx="3" />
              <path d="M4.5 9.5a5.5 5.5 0 0 0 11 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              <line x1="10" y1="15" x2="10" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* Session select */}
        <label className="text-eyebrow hidden sm:block" htmlFor="session-select">
          Session
        </label>
        <select
          id="session-select"
          className="select-spotify"
          value={preset}
          onChange={(e) => onPreset(e.target.value as SessionPreset)}
          disabled={running}
          aria-label="Session preset"
        >
          {PRESET_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} style={{ background: "var(--bg-elevated)" }}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="btn-ghost hidden md:block"
          style={{ paddingBlock: 8, paddingInline: 20 }}
          onClick={onReset}
          aria-label="Reset session"
        >
          Reset
        </button>

        <div className="flex-1" />

        {/* Session timer (mono, tabular-nums) */}
        <span className="text-mono text-secondary" aria-label="Session elapsed time">
          {fmt(elapsedMs)}
        </span>
        <span
          className="text-mono-micro rounded-sm px-2 py-1"
          style={{ border: "1px solid var(--border-hairline)", color: "var(--fg-tertiary)" }}
        >
          {running ? "live" : "idle"}
        </span>
      </div>
    </div>
  );
}
