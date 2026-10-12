// Public API for the browser demo.
// ADAPTATION (a/c): the original src/server.ts pushed frames over a WebSocket
// (driveSession -> ws.send per event, then summary, then close). Vercel
// serverless cannot hold WebSockets, so the engine runs client-side here and
// this module delivers the SAME frame objects ({type:"event",line} /
// {type:"summary",...}) through an in-browser callback. The protocol is
// unchanged; frames are byte-identical to what the WS server would send.
//
// Real-time delivery (adaptation c): the original server emitted frames as
// fast as the loop ran (no wall-clock relation). Here each frame is delivered
// on its simulated schedule, 1 simulated ms = 1/speed wall-clock ms, so the
// UI timeline animates truthfully. Simulation itself is instant and
// deterministic (verbatim runSession); only delivery is paced.
// SIMULATION: everything generated is synthetic, no mic, no real ASR/LLM/TTS.

import type { AudioChunk, SessionSummary, StreamParams } from "./types.ts";
import { runSession, summarize } from "./orchestrator.ts";
import { synthCall } from "./vad.ts";
import { resolveBargeIn } from "./sessions.ts";
import { encodeFrame, decodeFrame } from "./protocol.ts";
import type { Frame } from "./protocol.ts";

function simMsOfEventLine(line: string): number {
  const m = /^(-?\d+)ms\b/.exec(line);
  return m ? Number(m[1]) : 0;
}

type TimedFrame = { frame: Frame; atSimMs: number };

function buildTimedFrames(params: StreamParams): { timed: TimedFrame[]; summary: SessionSummary } {
  const frames: AudioChunk[] = synthCall(params.script);
  // BUG-7: an explicit bargeInAtMs override is honored (injected at that
  // time); it is no longer overwritten by the scripted anchor.
  const bargeInAtMs = resolveBargeIn(frames, params);
  const m = runSession(frames, {
    useTool: params.useTool,
    bargeInAtMs,
  });
  const summary = summarize(m);
  const timed: TimedFrame[] = m.events.map((line) => ({
    frame: { type: "event", line },
    atSimMs: simMsOfEventLine(line),
  }));
  // The original server sent the summary immediately after the last event
  // frame, then closed. Here it lands one frame tick later on the simulated
  // schedule.
  const lastAt = timed.length > 0 ? timed[timed.length - 1].atSimMs : 0;
  timed.push({ frame: { type: "summary", ...summary }, atSimMs: lastAt + 20 });
  return { timed, summary };
}

/**
 * Run a simulated session and stream its frames in real time.
 * Returns a promise resolving to the session summary once the final
 * (summary) frame has been delivered. Mirrors driveSession()'s contract:
 * event frames -> one summary frame -> done (instead of ws.close()).
 */
export function runSessionStream(
  params: StreamParams,
  onFrame: (frame: Frame) => void,
): Promise<SessionSummary> {
  const { timed, summary } = buildTimedFrames(params);
  const speed = params.speed ?? 1;
  if (speed <= 0) {
    // Synchronous burst: all frames in order, no timers (used by tests).
    for (const t of timed) onFrame(t.frame);
    return Promise.resolve(summary);
  }
  return new Promise<SessionSummary>((resolve) => {
    let delivered = 0;
    for (const t of timed) {
      const delayMs = Math.max(0, t.atSimMs / speed);
      setTimeout(() => {
        onFrame(t.frame);
        delivered += 1;
        if (delivered === timed.length) resolve(summary);
      }, delayMs);
    }
    if (timed.length === 0) resolve(summary);
  });
}

// Re-exports for the UI and for byte-compatibility checks against the
// original WS client (index.ts's probeWs used decodeFrame on ws messages).
export { encodeFrame, decodeFrame };
export type { Frame, StreamParams, SessionSummary };
