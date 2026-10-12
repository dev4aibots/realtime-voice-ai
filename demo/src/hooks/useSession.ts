import { useCallback, useEffect, useRef, useState } from "react";
import {
  runSessionStream,
  type Frame,
  type SessionSummary,
  type StreamParams,
} from "../engine/index.ts";
import { SESSION_CLEAN, SESSION_BARGE_IN } from "../engine/sessions.ts";

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

const PRESET_PARAMS: Record<"clean" | "barge-in", StreamParams> = {
  clean: {
    script: SESSION_CLEAN.script,
    useTool: SESSION_CLEAN.useTool,
    bargeInAtMs: SESSION_CLEAN.bargeInAtMs,
    injectBargeInFrames: SESSION_CLEAN.injectBargeInFrames,
  },
  "barge-in": {
    script: SESSION_BARGE_IN.script,
    useTool: SESSION_BARGE_IN.useTool,
    bargeInAtMs: SESSION_BARGE_IN.bargeInAtMs,
    injectBargeInFrames: SESSION_BARGE_IN.injectBargeInFrames,
  },
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
  if (/BARGE-IN:/.test(line)) return "LISTENING";
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
): Omit<TranscriptLine, "id" | "streaming"> | null {
  // Transcript is built from VERBATIM frame content only — nothing invented.
  let m = /TURN COMPLETE \(score=[\d.]+\) partial='(.*)'/.exec(line);
  if (m) return { role: "user", text: m[1], simMs };
  m = /filler '(.*)'/.exec(line);
  if (m) return { role: "assistant", text: `\u201c${m[1]}\u201d`, simMs };
  m = /tool result: (.*)$/.exec(line);
  if (m) return { role: "assistant", text: `weather.tokyo_tomorrow \u2192 ${m[1]}`, simMs };
  if (/TTS first audio-out/.test(line))
    return { role: "assistant", text: "(assistant speaking)", simMs };
  return null;
}

let idCounter = 0;

export function useSession() {
  const [preset, setPreset] = useState<SessionPreset>("clean");
  const [custom, setCustom] = useState<CustomConfig>({
    script: "what is the weather in tokyo tomorrow",
    useTool: true,
    bargeInMs: 0,
  });
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

      let params: StreamParams;
      if (active === "custom") {
        params = {
          script: custom.script,
          useTool: custom.useTool,
          bargeInAtMs: custom.bargeInMs > 0 ? custom.bargeInMs : null,
          // The original barge-in trick (8 speech frames injected so the
          // interruption actually fires) is the engine's own verbatim
          // behavior, recomputed per script by injectBargeInSpeech.
          injectBargeInFrames: custom.bargeInMs > 0,
        };
      } else {
        params = PRESET_PARAMS[active];
      }

      setRunning(true);
      setPipeline("IDLE");
      setStageStamps([{ state: "IDLE", simMs: 0 }]);
      setEvents([]);
      setTranscript([]);
      setSummary(null);
      setTick(0);
      setElapsedMs(0);
      lastEventId.current = -1;
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
          const tl = transcriptForLine(frame.line, simMs);
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
