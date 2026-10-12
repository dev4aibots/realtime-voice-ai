// Ported verbatim from dev4aibots/realtime-voice-ai src/types.ts (SHA 07aa2a7b).
// Everything in this engine is a SIMULATION: synthetic 20ms "audio" frames,
// heuristic turn scoring, constant latencies. No real ASR/LLM/TTS anywhere.
// Additions beyond the original are marked ADDED; all originals are verbatim.

export type State = "IDLE" | "LISTENING" | "WAITING" | "THINKING" | "SPEAKING";

export type AudioChunk = {
  tMs: number;
  isSpeech: boolean;
  partial: string;
};

export type Tool = { name: string; latencyMs: number; result: string };

export type Metrics = {
  events: string[];
  turnCompleteMs: number;
  firstLlmTokenMs: number;
  firstAudioOutMs: number;
  bargeIns: number;
};

export type SessionOptions = {
  useTool: boolean;
  bargeInAtMs: number | null;
  onEvent?: (line: string) => void;
};

export type SessionSummary = {
  turnCompleteMs: number;
  firstLlmTokenMs: number;
  firstAudioOutMs: number;
  turnLatencyMs: number;
  bargeIns: number;
};

// ADDED (adaptation b): the two demo sessions were hard-coded in the original
// src/index.ts. Here the script text, tool flag, and barge-in schedule are
// runtime parameters.
export type StreamParams = {
  /** spoken prompt text; replaces the hard-coded synthCall(...) script. */
  script: string;
  useTool: boolean;
  /** simulated ms at which user speech may interrupt THINKING/SPEAKING; null = no barge-in. */
  bargeInAtMs: number | null;
  /**
   * When true, applies the original index.ts barge-in trick: force-marks 8
   * synthetic frames as speech 60ms before the anchor frame so a barge-in
   * actually fires against the scripted session.
   */
  injectBargeInFrames?: boolean;
  /**
   * Wall-clock delivery speed for runSessionStream. 1 = real-time
   * (1 simulated ms = 1 wall-clock ms). <=0 = synchronous burst
   * (all frames delivered immediately, in order; used by tests).
   */
  speed?: number;
};

export type SessionDefinition = {
  id: "clean-call" | "barge-in";
  label: string;
  script: string;
  useTool: boolean;
  bargeInAtMs: number | null;
  injectBargeInFrames: boolean;
};
