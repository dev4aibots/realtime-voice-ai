import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSession, type SessionPreset } from "./hooks/useSession.ts";
import { Hero } from "./components/Hero.tsx";
import { PresetRail } from "./components/PresetRail.tsx";
import { MetricsStrip } from "./components/MetricsStrip.tsx";
import { PipelineCards } from "./components/PipelineCards.tsx";
import { EventTimeline } from "./components/EventTimeline.tsx";
import { TranscriptConsole } from "./components/TranscriptConsole.tsx";
import { ConfigPanel } from "./components/ConfigPanel.tsx";
import { TransportBar } from "./components/TransportBar.tsx";
import { Footer } from "./components/Footer.tsx";
import { customConfigForPreset } from "./engine/sessions.ts";

/**
 * Quiet section reveal: one 300ms rise per section via IntersectionObserver,
 * pure CSS animation. Under prefers-reduced-motion the content renders
 * immediately (see the .reveal rules in tokens.css).
 */
function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // Browser-only app (no SSR): reading matchMedia in the initializer is safe.
  const [seen, setSeen] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "-64px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={seen ? "reveal-in" : "reveal"}>
      {children}
    </div>
  );
}

/**
 * realtime-voice-ai demo, Spotify-exact, single page (redesign 2026-10-12).
 * The engine (src/engine) is the ONLY data source: every visual state is
 * derived from runSessionStream's real {type:"event"} / {type:"summary"}
 * frames. Layout follows direction §7.5: waveform-stage hero → preset snap
 * rail → answer-speed band → pipeline stepper rail → event stream + lyric
 * transcript → tune panel → footer, transport bar pinned.
 */
export default function App() {
  const session = useSession();

  // Deep-link: ?autostart=clean|barge-in|custom: used by the visual QA loop
  // to capture deterministic mid-session screenshots.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("autostart");
    if (q === "clean" || q === "barge-in" || q === "custom") {
      session.setPreset(q);
      const t = window.setTimeout(() => session.start(q), 400);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = () => {
    if (session.running) session.stop();
    else session.start();
  };

  // The user's own tune-panel edits, kept aside so that selecting the
  // Custom mix preset restores what THEY typed — not whatever preset values
  // a different preset left behind in the shared custom slot.
  const customEditsRef = useRef<typeof session.custom | null>(null);

  const handlePreset = (p: SessionPreset) => {
    session.setPreset(p);
    // BUG-8: the Tune panel must show the values the next run will
    // actually use: sync it from the preset (Custom restores the user's
    // last edits instead of stale preset values).
    if (p === "custom") {
      if (customEditsRef.current) session.setCustom(customEditsRef.current);
    } else {
      session.setCustom(customConfigForPreset(p));
    }
    session.reset();
  };

  const handleConfigChange = (c: typeof session.custom) => {
    customEditsRef.current = c;
    session.setCustom(c);
    if (session.preset !== "custom") session.setPreset("custom");
  };

  // Interruptions observed live in the event stream, so the metrics strip
  // can show the count while the session is still running (the summary
  // frame only lands at the end).
  const liveBargeIns = session.events.reduce((n, e) => n + (/BARGE-IN/.test(e.raw) ? 1 : 0), 0);

  return (
      <div className="min-h-screen bg-canvas text-primary font-ui">
        {/* Skip link */}
        <a
          href="#main"
          onClick={() => {
            // Move keyboard focus into main content, not just the hash/scroll.
            document.getElementById("main")?.focus();
          }}
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-modal focus:px-4 focus:py-2 focus:rounded-sm"
          style={{ background: "var(--accent-functional)", color: "var(--accent-on)" }}
        >
          Skip to content
        </a>

        {/* Top brand strip (Spotify web-player idiom) */}
        <div
          className="border-b"
          style={{ background: "var(--bg-pure)", borderColor: "var(--border-hairline)" }}
        >
          <div
            className="mx-auto flex items-center gap-3 px-4 md:px-8 py-3"
            style={{ maxWidth: "var(--container-max)" }}
          >
            <span
              className="rounded-circle inline-block"
              style={{ width: 28, height: 28, background: "var(--accent-functional)" }}
              aria-hidden="true"
            />
            <span className="text-body-strong text-primary">realtime-voice-ai</span>
            <span className="text-caption hidden sm:inline">a pretend voice assistant</span>
            <div className="flex-1" />
            <span className="text-mono-micro" style={{ color: "var(--fg-muted)" }}>
              portfolio demo
            </span>
          </div>
        </div>

        <main
          id="main"
          tabIndex={-1}
          className="mx-auto px-4 md:px-8 pt-8 flex flex-col outline-none"
          style={{
            maxWidth: "var(--container-max)",
            gap: "var(--section-gap)",
            paddingBottom: 140, // clear the sticky transport bar
          }}
        >
          <Hero
            running={session.running}
            turnLatencyMs={session.summary?.turnLatencyMs ?? null}
            tick={session.tick}
            pipeline={session.pipeline}
            onStart={() => session.start()}
            onStop={session.stop}
          />

          <Reveal>
            <PresetRail preset={session.preset} running={session.running} onPreset={handlePreset} />
          </Reveal>

          <Reveal>
            <MetricsStrip summary={session.summary} liveBargeIns={liveBargeIns} />
          </Reveal>

          <Reveal>
            <PipelineCards pipeline={session.pipeline} stamps={session.stageStamps} />
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "var(--section-gap)" }}>
            <Reveal>
              <EventTimeline events={session.events} />
            </Reveal>
            <Reveal>
              <TranscriptConsole lines={session.transcript} />
            </Reveal>
          </div>

          <Reveal>
            <ConfigPanel config={session.custom} running={session.running} onChange={handleConfigChange} />
          </Reveal>
        </main>

        <Footer />

        <TransportBar
          running={session.running}
          elapsedMs={session.elapsedMs}
          onToggle={handleToggle}
          onReset={session.reset}
        />
      </div>
  );
}
