import type { SessionSummary } from "../engine/index.ts";

type MetricsStripProps = {
  summary: SessionSummary | null;
  /**
   * Barge-ins observed so far in the live event stream. Shown while the
   * session is still running (before the summary frame lands), so the
   * INTERRUPTIONS stat reflects interruptions as they happen, not only
   * after the run completes.
   */
  liveBargeIns: number;
};

function Stat({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex-none" style={{ minWidth: 150, paddingInline: "var(--space-6)" }}>
      <p className="text-eyebrow">{label}</p>
      <p
        className="text-mono-xl mt-2"
        style={{ color: highlight ? "var(--accent-functional)" : "var(--fg-primary)" }}
      >
        {value}
        {unit && (
          <span className="text-mono text-secondary" style={{ marginLeft: 6 }}>
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

/**
 * Answer-speed band (redesign 2026-10-12): the latency dashboard rewired to
 * plain language and set as a Spotify-style stat band — hairline dividers,
 * no card grid. Wired to the REAL summary frame ({type:"summary"}).
 * "—" until the summary frame lands.
 */
export function MetricsStrip({ summary, liveBargeIns }: MetricsStripProps) {
  const v = (n: number | undefined) => (n === undefined || n < 0 ? "\u2014" : String(n));
  // Interruptions: the summary frame is authoritative once the run
  // completes; while running, count BARGE-IN events live so the stat
  // updates the moment an interruption fires.
  const interruptions = summary
    ? String(summary.bargeIns)
    : liveBargeIns > 0
      ? String(liveBargeIns)
      : "\u2014";
  return (
    <section aria-label="Answer speed metrics">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-title text-primary">Answer speed</h2>
        <span className="text-mono-micro hidden sm:inline" style={{ color: "var(--fg-muted)" }}>
          measured by the engine, in ms
        </span>
      </div>
      <div
        className="rounded-card overflow-x-auto"
        style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}
      >
        <div className="flex items-stretch py-6">
          <Stat label="You stop talking" value={v(summary?.turnCompleteMs)} unit="ms" />
          <div style={{ width: 1, background: "var(--border-hairline)" }} aria-hidden="true" />
          <Stat label="Starts thinking" value={v(summary?.firstLlmTokenMs)} unit="ms" />
          <div style={{ width: 1, background: "var(--border-hairline)" }} aria-hidden="true" />
          <Stat label="Starts answering" value={v(summary?.firstAudioOutMs)} unit="ms" />
          <div style={{ width: 1, background: "var(--border-hairline)" }} aria-hidden="true" />
          <Stat label="Answer speed" value={v(summary?.turnLatencyMs)} unit="ms" highlight />
          <div style={{ width: 1, background: "var(--border-hairline)" }} aria-hidden="true" />
          <Stat label="Interruptions" value={interruptions} />
        </div>
      </div>
    </section>
  );
}
