import { useEffect, useRef } from "react";
import type { TimelineEvent } from "../hooks/useSession.ts";

type EventTimelineProps = {
  events: TimelineEvent[];
};

/**
 * Streaming event timeline (DESIGN.md §8.4): live scrolling feed of the REAL
 * {type:"event"} frames in arrival order. Rows fade-slide in 200ms; event
 * names in mono-micro, payloads in mono, green tint on the live row.
 * Timestamps are the engine's simulated ms (verbatim from each line).
 */
export function EventTimeline({ events }: EventTimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);

  return (
    <section aria-label="Session events" className="flex flex-col min-h-0">
      <h2 className="text-title text-primary mb-4">Event stream</h2>
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Session event feed"
        className="rounded-card flex-1 overflow-y-auto p-4"
        style={{
          background: "var(--bg-card)",
          boxShadow: "var(--shadow-card)",
          maxHeight: 420,
          minHeight: 320,
        }}
      >
        {events.length === 0 ? (
          <p className="text-caption" style={{ color: "var(--fg-muted)" }}>
            No events yet &mdash; start a session to watch the pipeline emit.
          </p>
        ) : (
          <ol className="flex flex-col" style={{ gap: "var(--space-2)" }}>
            {events.map((e) => (
              <li
                key={e.id}
                className="event-row rounded-card px-3 py-2"
                style={{
                  background: e.isLive ? "var(--aurora-wash)" : "var(--bg-interactive)",
                  border: "1px solid var(--border-hairline)",
                  transition: "background-color var(--motion-duration-short) var(--motion-easing-hover)",
                }}
              >
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-mono text-secondary" style={{ minWidth: 72 }}>
                    {e.simMs}ms
                  </span>
                  <span
                    className="text-mono-micro"
                    style={{ color: e.isLive ? "var(--accent-functional)" : "var(--fg-tertiary)" }}
                  >
                    {e.name}
                  </span>
                </div>
                <p className="text-mono mt-1 break-words" style={{ color: "var(--fg-secondary)" }}>
                  {e.payload}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
