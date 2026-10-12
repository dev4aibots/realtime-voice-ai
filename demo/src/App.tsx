import { useEffect } from "react";
import { useSession, type SessionPreset } from "./hooks/useSession.ts";
import { Hero } from "./components/Hero.tsx";
import { MetricsStrip } from "./components/MetricsStrip.tsx";
import { PipelineCards } from "./components/PipelineCards.tsx";
import { EventTimeline } from "./components/EventTimeline.tsx";
import { TranscriptConsole } from "./components/TranscriptConsole.tsx";
import { Waveform } from "./components/Waveform.tsx";
import { ConfigPanel } from "./components/ConfigPanel.tsx";
import { TransportBar } from "./components/TransportBar.tsx";
import { Footer } from "./components/Footer.tsx";
import { customConfigForPreset } from "./engine/sessions.ts";

/**
 * realtime-voice-ai demo — Spotify-exact, single page.
 * The engine (src/engine) is the ONLY data source: every visual state is
 * derived from runSessionStream's real {type:"event"} / {type:"summary"}
 * frames. Layout follows DESIGN.md §8: hero → metrics → pipeline →
 * timeline/console → waveform → config → footer, transport bar pinned.
 */
export default function App() {
  const session = useSession();

  // Deep-link: ?autostart=clean|barge-in|custom — used by the visual QA loop
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

  const handlePreset = (p: SessionPreset) => {
    session.setPreset(p);
    // BUG-8: the Configure panel must show the values the next run will
    // actually use — sync it from the preset (Custom keeps the user's edits).
    if (p !== "custom") session.setCustom(customConfigForPreset(p));
    session.reset();
  };

  const handleConfigChange = (c: typeof session.custom) => {
    session.setCustom(c);
    if (session.preset !== "custom") session.setPreset("custom");
  };

  return (
    <div className="min-h-screen bg-canvas text-primary font-ui">
      {/* Skip link */}
      <a
        href="#main"
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
          <span className="text-caption hidden sm:inline">simulated voice pipeline</span>
          <div className="flex-1" />
          <span className="text-mono-micro" style={{ color: "var(--fg-muted)" }}>
            portfolio demo
          </span>
        </div>
      </div>

      <main
        id="main"
        className="mx-auto px-4 md:px-8 pt-8 flex flex-col"
        style={{
          maxWidth: "var(--container-max)",
          gap: "var(--section-gap)",
          paddingBottom: 140, // clear the sticky transport bar
        }}
      >
        <Hero
          running={session.running}
          turnLatencyMs={session.summary?.turnLatencyMs ?? null}
          onStart={() => session.start()}
          onStop={session.stop}
        />

        <MetricsStrip summary={session.summary} />

        <div>
          <h2 className="text-title text-primary mb-4">Pipeline</h2>
          <PipelineCards pipeline={session.pipeline} stamps={session.stageStamps} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: "var(--section-gap)" }}>
          <EventTimeline events={session.events} />
          <TranscriptConsole lines={session.transcript} />
        </div>

        <Waveform tick={session.tick} pipeline={session.pipeline} running={session.running} />

        <ConfigPanel config={session.custom} running={session.running} onChange={handleConfigChange} />
      </main>

      <Footer />

      <TransportBar
        running={session.running}
        preset={session.preset}
        elapsedMs={session.elapsedMs}
        onToggle={handleToggle}
        onPreset={handlePreset}
        onReset={session.reset}
      />
    </div>
  );
}
