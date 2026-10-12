import type { SessionSummary } from "../engine/index.ts";

type MetricsStripProps = {
  summary: SessionSummary | null;
};

function MetricCard({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div
      className="rounded-card p-5"
      style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}
    >
      <p className="text-eyebrow">{label}</p>
      <p className="text-mono-xl text-primary mt-2">
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
 * Metrics strip (DESIGN.md §8.5): latency dashboard wired to the REAL
 * summary frame ({type:"summary"}) — turn-complete, first-LLM-token,
 * first-audio-out, turn latency, barge-in count. JetBrains Mono,
 * tabular-nums, per DESIGN.md. "—" until the summary frame lands.
 */
export function MetricsStrip({ summary }: MetricsStripProps) {
  const v = (n: number | undefined) => (n === undefined || n < 0 ? "\u2014" : String(n));
  return (
    <section aria-label="Latency metrics">
      <h2 className="text-title text-primary mb-4">Latency</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5" style={{ gap: "var(--stack-gap)" }}>
        <MetricCard label="Turn complete" value={v(summary?.turnCompleteMs)} unit="ms" />
        <MetricCard label="First LLM token" value={v(summary?.firstLlmTokenMs)} unit="ms" />
        <MetricCard label="First audio out" value={v(summary?.firstAudioOutMs)} unit="ms" />
        <MetricCard label="Turn latency" value={v(summary?.turnLatencyMs)} unit="ms" />
        <MetricCard label="Barge-ins" value={summary ? String(summary.bargeIns) : "\u2014"} />
      </div>
    </section>
  );
}
