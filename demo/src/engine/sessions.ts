// Demo sessions ported from dev4aibots/realtime-voice-ai src/index.ts main().
// The original hard-coded two sessions; here they are data (SessionDefinition)
// plus a parameterized runner. All constants, scripts, and the barge-in frame
// injection below are verbatim from the original index.ts. Everything simulated
// stays labeled as simulation (the whole engine is synthetic, see vad.ts).

import type { AudioChunk, SessionDefinition, SessionSummary, StreamParams } from "./types.ts";
import { runSession, summarize } from "./orchestrator.ts";
import { synthCall } from "./vad.ts";

/** Session 1, clean call with tool use (original index.ts: useTool: true, bargeInAtMs: null). */
export const SESSION_CLEAN: SessionDefinition = {
  id: "clean-call",
  label: "session 1: clean call with tool (weather)",
  script: "what is the weather in tokyo tomorrow",
  useTool: true,
  bargeInAtMs: null,
  injectBargeInFrames: false,
};

export const SESSION_CLEAN_SCRIPT = SESSION_CLEAN.script;

/** Session 2, barge-in mid-response (original index.ts logic, see below). */
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

/** First frame index that can host an 8-frame injection at/after atMs. */
function bargeInInjectStart(frames: AudioChunk[], atMs: number): number {
  let idx = frames.findIndex((f) => f.tMs >= atMs);
  if (idx < 0) idx = frames.length - 1;
  return Math.max(0, Math.min(idx, frames.length - 8));
}

/**
 * BUG-7 fix, explicit barge-in time override (the Configure slider).
 * Same 8-frame speech injection as the original trick, but anchored at the
 * requested time instead of the scripted anchor. Returns the frame's tMs —
 * the exact time the BARGE-IN event fires (the engine fires at the first
 * isSpeech frame with tMs >= bargeInAtMs while THINKING/SPEAKING).
 */
export function injectBargeInSpeechAt(frames: AudioChunk[], atMs: number): number {
  if (frames.length === 0) throw new Error("synthCall returned no frames");
  const start = bargeInInjectStart(frames, atMs);
  for (let i = 0; i < 8; i++) {
    const j = start + i;
    frames[j] = {
      tMs: frames[j].tMs,
      isSpeech: true,
      partial: frames[j].partial,
    };
  }
  return frames[start].tMs;
}

/**
 * The scripted interruption point for a script: the tMs of the anchor frame
 * (frames.length - 20), the time the BARGE-IN event is observed at under the
 * original index.ts anchor math. Computed from the same values the engine
 * uses (never a duplicated formula in the UI).
 */
export function scriptedBargeInAnchorMs(script: string): number {
  const frames = synthCall(script);
  const anchorIdx = Math.max(0, frames.length - 20);
  return frames[anchorIdx].tMs;
}

/**
 * The exact barge-in fire time the engine will use for a script + slider
 * value, or null when barge-in is off (bargeInMs <= 0). Mirrors
 * injectBargeInSpeechAt's index math against fresh frames, so the Configure
 * panel can display the real effective time before the run starts.
 */
export function effectiveBargeInFireMs(script: string, bargeInMs: number): number | null {
  if (bargeInMs <= 0) return null;
  const frames = synthCall(script);
  return frames[bargeInInjectStart(frames, bargeInMs)].tMs;
}

/** Largest slider value the engine can honor exactly (8 injected frames must fit). */
export function maxBargeInMs(script: string): number {
  const frames = synthCall(script);
  const j = Math.max(0, frames.length - 8);
  return frames[j].tMs;
}

/**
 * Resolve the effective barge-in time for a run. An explicit bargeInAtMs
 * (the slider override) is honored by injecting at that time; a null
 * bargeInAtMs with injectBargeInFrames falls back to the legacy scripted
 * anchor (verbatim original behavior, kept for parity); otherwise there is
 * no barge-in. Previously the explicit override was silently overwritten by
 * the scripted anchor, the slider had no effect.
 */
export function resolveBargeIn(
  frames: AudioChunk[],
  params: { bargeInAtMs: number | null; injectBargeInFrames?: boolean },
): number | null {
  if (params.injectBargeInFrames) {
    if (params.bargeInAtMs != null) return injectBargeInSpeechAt(frames, params.bargeInAtMs);
    return injectBargeInSpeech(frames);
  }
  return params.bargeInAtMs ?? null;
}

/**
 * BUG-8 fix, the Configure panel values a preset stands for, so selecting a
 * preset syncs the panel instead of leaving stale custom values. The barge-in
 * preset seeds the slider with the real scripted fire time, which reproduces
 * the original session-2 timeline exactly through the override path.
 */
export function customConfigForPreset(p: "clean" | "barge-in"): {
  script: string;
  useTool: boolean;
  bargeInMs: number; // 0 = off
} {
  const def = p === "clean" ? SESSION_CLEAN : SESSION_BARGE_IN;
  return {
    script: def.script,
    useTool: def.useTool,
    bargeInMs: def.injectBargeInFrames ? scriptedBargeInAnchorMs(def.script) : 0,
  };
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

/** Parameterized synchronous runner, same call signature semantics as index.ts's inline runs. */
export function runSessionSync(params: StreamParams): { summary: SessionSummary; events: string[] } {
  const frames = synthCall(params.script);
  // BUG-7: an explicit bargeInAtMs override is honored (injected at that
  // time); it is no longer overwritten by the scripted anchor.
  const bargeInAtMs = resolveBargeIn(frames, params);
  const m = runSession(frames, {
    useTool: params.useTool,
    bargeInAtMs,
    onEvent: undefined,
  });
  return { summary: summarize(m), events: m.events };
}
