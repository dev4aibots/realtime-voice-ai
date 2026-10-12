/**
 * Footer — brand-black zone. Honest provenance: simulated engine port,
 * licenses flagged per the playbook.
 */
export function Footer() {
  return (
    <footer
      className="mt-16"
      style={{ background: "var(--bg-brand-black)", borderTop: "1px solid var(--border-hairline)" }}
    >
      <div
        className="mx-auto px-4 md:px-8 py-10 flex flex-col md:flex-row gap-6 md:items-center md:justify-between"
        style={{ maxWidth: "var(--container-max)" }}
      >
        <div>
          <p className="text-body-strong text-primary">realtime-voice-ai</p>
          <p className="text-caption mt-2" style={{ maxWidth: "58ch" }}>
            A fully pretend voice pipeline: synthetic 20ms frames, heuristic
            turn scoring, fixed timings. No audio is captured, no network
            calls are made, no models run. The &ldquo;session&rdquo; is the
            engine&rsquo;s event stream, drawn frame by frame.
          </p>
        </div>
        <div className="flex flex-col gap-2 md:items-end">
          <a
            href="https://github.com/dev4aibots/realtime-voice-ai"
            target="_blank"
            rel="noreferrer"
            className="text-caption"
            style={{ color: "var(--fg-secondary)", textDecoration: "none" }}
          >
            dev4aibots/realtime-voice-ai
          </a>
          <p className="text-mono-micro" style={{ color: "var(--fg-muted)" }}>
            hero motion: original code; react-bits (MIT + Commons Clause) as API reference
          </p>
        </div>
      </div>
    </footer>
  );
}
