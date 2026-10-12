import { useCallback, useEffect, useRef, useState } from "react";
import {
  runSessionStream,
  type Frame,
  type SessionSummary,
  type StreamParams,
} from "../engine/index.ts";
import { customConfigForPreset } from "../engine/sessions.ts";

export type PipelineState = "IDLE" | "LISTENING" | "WAITING" | "THINKING" | "SPEAKING" | "DONE";

export type SessionPreset = "clean" | "barge-in" | "custom";

export type StageStamp = { state: PipelineState; simMs: number };

export type TimelineEvent = {
  id: number;
  simMs: number;
  wallAtMs: number;
  raw: string;
  name: string;
  payload: string;
  isLive: boolean;
};

export type TranscriptLine = {
  id: number;
  role: "user" | "assistant";
  text: string;
  simMs: number;
  streaming: boolean;
};

export type CustomConfig = {
  script: string;
  useTool: boolean;
  bargeInMs: number; // 0 = off
};

/**
 * Map an emitted event line to the real state-machine transition.
 * Mirrors the transition markers in orchestrator.ts runSession verbatim:
 * LISTENING -> "LISTENING", TURN COMPLETE -> WAITING, "tool call fired" /
 * "LLM call fired" -> THINKING, "LLM first token" -> SPEAKING,
 * "BARGE-IN" -> LISTENING (re-armed). No invented transitions.
 */
function stateForLine(line: string): PipelineState | null {
  // BUG-10: the engine log no longer has a colon ("BARGE-IN cancel TTS…"),
  // so match the bare token, /BARGE-IN:/ would never match and the
  // re-armed LISTENING transition would be lost.
  if (/BARGE-IN/.test(line)) return "LISTENING";
  if (/LLM first token/.test(line)) return "SPEAKING";
  if (/tool call fired/.test(line) || /LLM call fired/.test(line)) return "THINKING";
  if (/TURN COMPLETE/.test(line)) return "WAITING";
  if (/^\d+ms LISTENING$/.test(line.trim())) return "LISTENING";
  return null;
}

function parseLine(line: string): { simMs: number; name: string; payload: string } {
  const m = /^(-?\d+)ms\s+(.*)$/.exec(line);
  const rest = m ? m[2] : line;
  const nameMatch = /^([A-Za-z][A-Za-z0-9._-]*(?::)?)/.exec(rest);
  const name = nameMatch ? nameMatch[1] : rest;
  return { simMs: m ? Number(m[1]) : 0, name, payload: rest };
}

function transcriptForLine(
  line: string,
  simMs: number,
  toolResult: string | null,
): Omit<TranscriptLine, "id" | "streaming"> | null {
  // Transcript is built from VERBATIM frame content only, nothing invented.
  let m = /TURN COMPLETE \(score=[\d.]+\) partial='(.*)'/.exec(line);
  if (m) return { role: "user", text: m[1], simMs };
  m = /filler '(.*)'/.exec(line);
  if (m) return { role: "assistant", text: `\u201c${m[1]}\u201d`, simMs };
  m = /tool result: (.*)$/.exec(line);
  if (m) return { role: "assistant", text: `weather.tokyo_tomorrow \u2192 ${m[1]}`, simMs };
  if (/TTS first audio-out/.test(line)) {
    // BUG-9: "(assistant speaking)" was a static placeholder. The engine
    // never scripts the reply text, so the only verbatim spoken content
    // available is the tool result the assistant just fetched, quote it.
    // With no tool result there is nothing verbatim to quote; say so
    // honestly instead of inventing a reply.
    if (toolResult) return { role: "assistant", text: `\u201c${toolResult}\u201d`, simMs };
    return {
      role: "assistant",
      text: "(simulated speech \u2014 no scripted reply in engine)",
      simMs,
    };
  }
  return null;
}

let idCounter = 0;

export function useSession() {
  const [preset, setPreset] = useState<SessionPreset>("clean");
  // Seeded from the clean preset so the panel always shows the values the
  // next run will actually use (BUG-8: preset select re-syncs this).
  const [custom, setCustom] = useState<CustomConfig>(() => customConfigForPreset("clean"));
  const [running, setRunning] = useState(false);
  const [pipeline, setPipeline] = useState<PipelineState>("IDLE");
  const [stageStamps, setStageStamps] = useState<StageStamp[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [tick, setTick] = useState(0); // increments per delivered frame -> waveform
  const [elapsedMs, setElapsedMs] = useState(0);
  const startWall = useRef(0);
  const runId = useRef(0);
  const timerRef = useRef<number | null>(null);
  const lastEventId = useRef(-1);
  // Latest verbatim tool result in this run, quoted as the assistant's
  // spoken line at TTS first audio-out (BUG-9). Reset on every start.
  const toolResultRef = useRef<string | null>(null);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const reset = useCallback(() => {
    runId.current += 1;
    stopTimer();
    setRunning(false);
    setPipeline("IDLE");
    setStageStamps([]);
    setEvents([]);
    setTranscript([]);
    setSummary(null);
    setTick(0);
    setElapsedMs(0);
    lastEventId.current = -1;
  }, []);

  const start = useCallback(
    (which?: SessionPreset) => {
      const active = which ?? preset;
      runId.current += 1;
      const myRun = runId.current;

      // The engine always runs from ONE config. The Custom preset uses the
      // panel's live values; clean/barge-in use the preset's synced values
      // (customConfigForPreset), computed synchronously so ?autostart= and
      // programmatic starts can never run stale panel state.
      // BUG-7: the barge-in slider (bargeInMs) IS the barge-in schedule for
      // every preset, >0 interrupts at that exact ms (the engine injects
      // speech there), 0 suppresses barge-in entirely.
      const cfg = active === "custom" ? custom : customConfigForPreset(active);
      const params: StreamParams = {
        script: cfg.script,
        useTool: cfg.useTool,
        bargeInAtMs: cfg.bargeInMs > 0 ? cfg.bargeInMs : null,
        injectBargeInFrames: cfg.bargeInMs > 0,
      };

      setRunning(true);
      setPipeline("IDLE");
      setStageStamps([{ state: "IDLE", simMs: 0 }]);
      setEvents([]);
      setTranscript([]);
      setSummary(null);
      setTick(0);
      setElapsedMs(0);
      lastEventId.current = -1;
      toolResultRef.current = null;
      startWall.current = performance.now();
      stopTimer();
      timerRef.current = window.setInterval(() => {
        setElapsedMs(performance.now() - startWall.current);
      }, 50);

      void runSessionStream({ ...params, speed: 1 }, (frame: Frame) => {
        if (myRun !== runId.current) return; // superseded run
        setTick((t) => t + 1);
        if (frame.type === "event") {
          const { simMs, name, payload } = parseLine(frame.line);
          const id = idCounter++;
          setEvents((evts) => [
            ...evts.map((e) => ({ ...e, isLive: false })),
            {
              id,
              simMs,
              wallAtMs: performance.now() - startWall.current,
              raw: frame.line,
              name,
              payload,
              isLive: true,
            },
          ]);
          lastEventId.current = id;
          const next = stateForLine(frame.line);
          if (next) {
            setPipeline(next);
            setStageStamps((st) => [...st, { state: next, simMs }]);
          }
          // Capture the verbatim tool result so the TTS line can quote it.
          const trm = /tool result: (.*)$/.exec(frame.line);
          if (trm) toolResultRef.current = trm[1];
          const tl = transcriptForLine(frame.line, simMs, toolResultRef.current);
          if (tl) {
            setTranscript((ts) => {
              const cleared = ts.map((t) => ({ ...t, streaming: false }));
              return [...cleared, { ...tl, id: idCounter++, streaming: true }];
            });
          }
        } else {
          // Summary frame: session complete.
          const s: SessionSummary = {
            turnCompleteMs: frame.turnCompleteMs,
            firstLlmTokenMs: frame.firstLlmTokenMs,
            firstAudioOutMs: frame.firstAudioOutMs,
            turnLatencyMs: frame.turnLatencyMs,
            bargeIns: frame.bargeIns,
          };
          setSummary(s);
          setPipeline("DONE");
          setRunning(false);
          stopTimer();
          setTranscript((ts) => ts.map((t) => ({ ...t, streaming: false })));
        }
      });
    },
    [preset, custom],
  );

  const stop = useCallback(() => {
    runId.current += 1; // cancels pending frame delivery for this run
    setRunning(false);
    stopTimer();
    setPipeline("IDLE");
    setTranscript((ts) => ts.map((t) => ({ ...t, streaming: false })));
  }, []);

  useEffect(() => () => stopTimer(), []);

  return {
    preset,
    setPreset,
    stageStamps,
    custom,
    setCustom,
    running,
    pipeline,
    events,
    transcript,
    summary,
    tick,
    elapsedMs,
    start,
    stop,
    reset,
  };
}
