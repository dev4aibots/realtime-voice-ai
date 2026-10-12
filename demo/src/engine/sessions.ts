// Demo sessions ported from dev4aibots/realtime-voice-ai src/index.ts main().
// The original hard-coded two sessions; here they are data (SessionDefinition)
// plus a parameterized runner. All constants, scripts, and the barge-in frame
// injection below are verbatim from the original index.ts. Everything simulated
// stays labeled as simulation (the whole engine is synthetic — see vad.ts).

import type { AudioChunk, SessionDefinition, SessionSummary, StreamParams } from "./types.ts";
import { runSession, summarize } from "./orchestrator.ts";
import { synthCall } from "./vad.ts";

/** Session 1 — clean call with tool use (original index.ts: useTool: true, bargeInAtMs: null). */
export const SESSION_CLEAN: SessionDefinition = {
  id: "clean-call",
  label: "session 1: clean call with tool (weather)",
  script: "what is the weather in tokyo tomorrow",
  useTool: true,
  bargeInAtMs: null,
  injectBargeInFrames: false,
};

export const SESSION_CLEAN_SCRIPT = SESSION_CLEAN.script;

/** Session 2 — barge-in mid-response (original index.ts logic, see below). */
export const SESSION_BARGE_IN: SessionDefinition = {
  id: "barge-in",
  label: "session 2: user barges in mid-response",
  script: "tell me a long story about",
  useTool: false,
  // In the original, bargeInAtMs = anchorFrame.tMs - 60 where
  // anchorFrame = frames[length - 20]. For this script that resolves to 3780ms.
  // It is stored here as a computed value; buildSessionFrames recomputes it the
  // same way the original did so a custom script gets the right anchor.
  bargeInAtMs: null, // set dynamically by buildSessionFrames (see below)
  injectBargeInFrames: true,
};

/**
 * Verbatim port of the original index.ts barge-in setup:
 *   const anchorIdx = Math.max(0, bargeFrames.length - 20);
 *   const anchorFrame = bargeFrames[anchorIdx] ?? bargeFrames[bargeFrames.length - 1];
 *   for (let i = 0; i < 8; i++) { bargeFrames[anchorIdx + i] = { ..., isSpeech: true }; }
 *   bargeInAtMs = anchorFrame.tMs - 60
 */
export function injectBargeInSpeech(frames: AudioChunk[]): number {
  if (frames.length === 0) throw new Error("synthCall returned no frames");
  const anchorIdx = Math.max(0, frames.length - 20);
  const anchorFrame = frames[anchorIdx] ?? frames[frames.length - 1];
  for (let i = 0; i < 8; i++) {
    const idx = anchorIdx + i;
    if (idx >= 0 && idx < frames.length) {
      frames[idx] = {
        tMs: frames[idx].tMs,
        isSpeech: true,
        partial: frames[idx].partial,
      };
    }
  }
  return anchorFrame.tMs - 60;
}

/** Build the frame list for a session definition, exactly as index.ts did. */
export function buildSessionFrames(def: SessionDefinition): { frames: AudioChunk[]; bargeInAtMs: number | null } {
  const frames = synthCall(def.script);
  let bargeInAtMs = def.bargeInAtMs;
  if (def.injectBargeInFrames) {
    bargeInAtMs = injectBargeInSpeech(frames);
  }
  return { frames, bargeInAtMs };
}

/** Parameterized synchronous runner — same call signature semantics as index.ts's inline runs. */
export function runSessionSync(params: StreamParams): { summary: SessionSummary; events: string[] } {
  const frames = synthCall(params.script);
  let bargeInAtMs = params.bargeInAtMs;
  if (params.injectBargeInFrames) {
    bargeInAtMs = injectBargeInSpeech(frames);
  }
  const m = runSession(frames, {
    useTool: params.useTool,
    bargeInAtMs,
    onEvent: undefined,
  });
  return { summary: summarize(m), events: m.events };
}
