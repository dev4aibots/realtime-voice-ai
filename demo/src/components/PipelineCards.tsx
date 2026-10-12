import type { PipelineState, StageStamp } from "../hooks/useSession.ts";

type PipelineCardsProps = {
  pipeline: PipelineState;
  stamps: StageStamp[];
};

const STAGES: {
  state: PipelineState;
  blurb: string;
}[] = [
  { state: "IDLE", blurb: "Waiting for you" },
  { state: "LISTENING", blurb: "Hears you start talking" },
  { state: "WAITING", blurb: "Waits for you to finish" },
  { state: "THINKING", blurb: "Drafts the answer" },
  { state: "SPEAKING", blurb: "Speaks it back" },
];

function lastEntered(stamps: StageStamp[], state: PipelineState): number | null {
  for (let i = stamps.length - 1; i >= 0; i--) {
    if (stamps[i].state === state) return stamps[i].simMs;
  }
  return null;
}

/**
 * Pipeline rail (redesign 2026-10-12, direction §7.5): the 5 real states
 * IDLE→LISTENING→WAITING→THINKING→SPEAKING as a horizontal snap-scroll
 * stepper — NOT an identical card grid. The active stage (derived from the
 * REAL event frames, never invented) gets the green node + green stage name;
 * reached stages light up; each shows the real sim-time the stage was
 * entered, in mono.
 */
export function PipelineCards({ pipeline, stamps }: PipelineCardsProps) {
  return (
    <section aria-label="Pipeline stages">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-title text-primary">Pipeline</h2>
        <span className="text-mono-micro hidden sm:inline" style={{ color: "var(--fg-muted)" }}>
          five steps, every turn
        </span>
      </div>
      <div
        className="rail rounded-card px-5 pt-5"
        style={{ background: "var(--bg-card)", boxShadow: "var(--shadow-card)" }}
        role="list"
        aria-label="Pipeline stage stepper"
      >
        {STAGES.map((s, i) => {
          const isActive = s.state === pipeline;
          const entered = lastEntered(stamps, s.state);
          const reached = entered !== null;
          const last = i === STAGES.length - 1;
          return (
            <div
              key={s.state}
              role="listitem"
              aria-current={isActive ? "true" : undefined}
              className="pb-5"
              style={{ minWidth: 180 }}
            >
              <div className="flex items-center" aria-hidden="true">
                <span
                  className="rounded-circle flex-none"
                  style={{
                    width: 12,
                    height: 12,
                    background: isActive
                      ? "var(--accent-functional)"
                      : reached
                        ? "var(--fg-primary)"
                        : "var(--fg-disabled)",
                    boxShadow: isActive ? "var(--shadow-green-glow)" : "none",
                    transition:
                      "background-color var(--motion-duration-short) var(--motion-easing-hover)",
                  }}
                />
                {!last && (
                  <span
                    className="flex-1"
                    style={{
                      height: 2,
                      background: reached ? "var(--fg-disabled)" : "var(--bg-elevated)",
                      marginInline: 4,
                    }}
                  />
                )}
              </div>
              <h3
                className="text-h3 mt-3"
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
                className="text-mono mt-2"
                style={{ color: reached ? "var(--fg-secondary)" : "var(--fg-muted)" }}
                aria-label={`${s.state} stage timing`}
              >
                {entered === null ? "\u2014" : `@ ${entered}ms`}
              </p>
              {isActive && (
                <span
                  className="text-mono-micro mt-2 inline-block"
                  style={{ color: "var(--accent-functional)" }}
                >
                  active
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
