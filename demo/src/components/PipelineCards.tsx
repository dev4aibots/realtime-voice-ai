import type { PipelineState, StageStamp } from "../hooks/useSession.ts";

type PipelineCardsProps = {
  pipeline: PipelineState;
  stamps: StageStamp[];
};

const STAGES: {
  state: PipelineState;
  blurb: string;
}[] = [
  { state: "IDLE", blurb: "Awaiting audio" },
  { state: "LISTENING", blurb: "VAD detects speech" },
  { state: "WAITING", blurb: "Turn-end gate (500ms)" },
  { state: "THINKING", blurb: "Tool + LLM stream" },
  { state: "SPEAKING", blurb: "TTS audio-out" },
];

function lastEntered(stamps: StageStamp[], state: PipelineState): number | null {
  for (let i = stamps.length - 1; i >= 0; i--) {
    if (stamps[i].state === state) return stamps[i].simMs;
  }
  return null;
}

/**
 * Pipeline stage cards (DESIGN.md §8.3): the 5 real states
 * IDLE→LISTENING→WAITING→THINKING→SPEAKING. The active stage (derived from
 * the REAL event frames, never invented) gets the green left edge + green
 * stage name; others rest in secondary/muted. Each shows the real sim-time
 * the stage was entered, in mono.
 */
export function PipelineCards({ pipeline, stamps }: PipelineCardsProps) {
  const activeIdx = STAGES.findIndex((s) => s.state === pipeline);
  return (
    <section aria-label="Pipeline stages">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5" style={{ gap: "var(--stack-gap)" }}>
        {STAGES.map((s, i) => {
          const isActive = s.state === pipeline;
          const entered = lastEntered(stamps, s.state);
          const reached = entered !== null;
          return (
            <article
              key={s.state}
              aria-current={isActive ? "true" : undefined}
              className="rounded-card p-4"
              style={{
                background: "var(--bg-card)",
                borderLeft: isActive ? "3px solid var(--accent-functional)" : "3px solid transparent",
                boxShadow: "var(--shadow-card)",
                transition: "border-color var(--motion-duration-short) var(--motion-easing-hover)",
              }}
            >
              <h3
                className="text-h3"
                style={{
                  color: isActive
                    ? "var(--accent-functional)"
                    : reached
                      ? "var(--fg-primary)"
                      : "var(--fg-secondary)",
                  transition: "color var(--motion-duration-short) var(--motion-easing-hover)",
                }}
              >
                {s.state}
              </h3>
              <p className="text-caption mt-1">{s.blurb}</p>
              <p
                className="text-mono mt-3"
                style={{ color: reached ? "var(--fg-secondary)" : "var(--fg-muted)" }}
                aria-label={`${s.state} stage timing`}
              >
                {entered === null ? "\u2014" : `@ ${entered}ms`}
                {i < STAGES.length - 1 && (
                  <span style={{ color: "var(--fg-muted)" }} aria-hidden="true">
                    {" \u2192"}
                  </span>
                )}
              </p>
              {isActive && activeIdx >= 0 && (
                <span className="text-mono-micro mt-2 inline-block" style={{ color: "var(--accent-functional)" }}>
                  active
                </span>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
