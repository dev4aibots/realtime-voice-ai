type TransportBarProps = {
  running: boolean;
  elapsedMs: number;
  onToggle: () => void;
  onReset: () => void;
};

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${String(s).padStart(2, "0")}.${tenths}`;
}

/**
 * Transport bar (redesign 2026-10-12, Spotify Now Playing idiom): sticky
 * bottom bar, --bg-elevated, circular green session button, reset, session
 * timer in mono. The preset picker now lives in the "Pick a session" snap
 * rail above; this bar is pure transport. The circular button starts/stops
 * the simulated session on click (it is NOT a press-and-hold push-to-talk:
 * there is no microphone); the label says so.
 */
export function TransportBar({ running, elapsedMs, onToggle, onReset }: TransportBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-overlay du-transport-hairline"
      data-du-playing={running ? "true" : "false"}
      style={{
        background: "var(--bg-elevated)",
        boxShadow: "var(--shadow-float)",
      }}
      role="region"
      aria-label="Session transport"
    >
      <div
        className="mx-auto flex items-center gap-4 px-4 md:px-8"
        style={{ maxWidth: "var(--container-max)", height: 76 }}
      >
        {/* Circular green session button (play/stop idiom). Click to
            start/stop, not press-and-hold; the label is honest about it. */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={running ? "Stop session" : "Start session"}
          title={running ? "Stop session" : "Start session"}
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
