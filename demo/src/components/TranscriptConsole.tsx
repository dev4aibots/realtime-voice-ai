import type { TranscriptLine } from "../hooks/useSession.ts";

type TranscriptConsoleProps = {
  lines: TranscriptLine[];
};

/**
 * Transcript console (DESIGN.md §8.8): user/assistant turns built VERBATIM
 * from engine frame content (partial from TURN COMPLETE, filler text, tool
 * result). The streaming line carries the caret; the active turn gets the
 * green left border.
 */
export function TranscriptConsole({ lines }: TranscriptConsoleProps) {
  return (
    <section aria-label="Transcript" className="flex flex-col min-h-0">
      <h2 className="text-title text-primary mb-4">Transcript</h2>
      <div
        className="rounded-card flex-1 overflow-y-auto p-4"
        style={{
          background: "var(--bg-card)",
          boxShadow: "var(--shadow-card)",
          maxHeight: 420,
          minHeight: 320,
        }}
        role="log"
        aria-live="polite"
        aria-label="Session transcript"
      >
        {lines.length === 0 ? (
          <p className="text-caption" style={{ color: "var(--fg-muted)" }}>
            The growing partial transcript appears here as the session runs.
          </p>
        ) : (
          <ol className="flex flex-col" style={{ gap: "var(--space-3)" }}>
            {lines.map((l) => (
              <li
                key={l.id}
                className="px-3 py-2"
                style={{
                  borderLeft: l.streaming
                    ? "3px solid var(--accent-functional)"
                    : "3px solid transparent",
                  transition: "border-color var(--motion-duration-short) var(--motion-easing-hover)",
                }}
              >
                <p className="text-eyebrow" style={{ marginBottom: 4 }}>
                  {l.role === "user" ? "You" : "Assistant"}
                </p>
                <p className="text-body" style={{ color: "var(--fg-primary)" }}>
                  {l.text}
                  {l.streaming && (
                    <span
                      className="live-dot"
                      aria-hidden="true"
                      style={{ color: "var(--accent-functional)", fontWeight: 700 }}
                    >
                      {" \u258d"}
                    </span>
                  )}
                </p>
                <p className="text-mono mt-1" style={{ color: "var(--fg-muted)", fontSize: 11 }}>
                  {l.simMs}ms
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
