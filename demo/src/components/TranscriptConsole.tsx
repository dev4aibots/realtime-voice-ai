import { useEffect, useRef } from "react";
import type { TranscriptLine } from "../hooks/useSession.ts";
import { TextAnimate } from "./ui/text-animate.tsx";

type TranscriptConsoleProps = {
  lines: TranscriptLine[];
};

/**
 * Lyric-sheet transcript (redesign 2026-10-12, direction §7.5): lines are
 * built VERBATIM from engine frame content (partial from TURN COMPLETE,
 * filler text, tool result). Set like Spotify lyrics — centered, generous
 * measure, the current line in full white with a word-by-word reveal
 * (text-animate), past lines dimmed. The streaming line carries the caret.
 */
export function TranscriptConsole({ lines }: TranscriptConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines.length]);

  return (
    <section aria-label="Transcript" className="flex flex-col min-h-0">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-title text-primary">Transcript</h2>
        <span className="text-mono-micro hidden sm:inline" style={{ color: "var(--fg-muted)" }}>
          word for word, from the engine
        </span>
      </div>
      <div
        ref={scrollRef}
        className="rounded-card flex-1 overflow-y-auto px-6 py-8 md:px-10"
        style={{
          background: "var(--bg-card)",
          boxShadow: "var(--shadow-card)",
          maxHeight: 460,
          minHeight: 340,
        }}
        role="log"
        aria-live="polite"
        aria-label="Session transcript"
      >
        {lines.length === 0 ? (
          <div className="flex flex-col items-start gap-3 py-8" style={{ maxWidth: "44ch" }}>
            <p className="text-h3 text-primary">Nothing said yet</p>
            <p className="text-caption">
              Press Start session and the conversation appears here, line by
              line, exactly as the engine speaks it.
            </p>
          </div>
        ) : (
          <ol
            className="flex flex-col mx-auto"
            style={{ gap: "var(--space-5)", maxWidth: "44ch" }}
          >
            {lines.map((l) => {
              const active = l.streaming;
              return (
                <li key={l.id} className="lyric-line">
                  <p
                    className="text-mono-micro"
                    style={{
                      marginBottom: 6,
                      color: active ? "var(--accent-functional)" : "var(--fg-muted)",
                    }}
                  >
                    {l.role === "user" ? "You" : "Assistant"}
                  </p>
                  <div
                    style={{
                      color: active
                        ? "var(--fg-primary)"
                        : l.role === "user"
                          ? "var(--fg-tertiary)"
                          : "var(--fg-secondary)",
                      transition:
                        "color var(--motion-duration-medium) var(--motion-easing-hover)",
                    }}
                  >
                    <TextAnimate
                      text={l.text}
                      className={l.role === "user" ? "text-h3" : "text-lyric"}
                      as="p"
                    />
                  </div>
                  {active && (
                    <span
                      className="live-dot inline-block"
                      aria-hidden="true"
                      style={{
                        color: "var(--accent-functional)",
                        fontWeight: 700,
                        marginTop: 4,
                      }}
                    >
                      {"\u258d"}
                    </span>
                  )}
                  <p
                    className="text-mono mt-2"
                    style={{ color: "var(--fg-muted)", fontSize: 11 }}
                  >
                    {l.simMs}ms
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
