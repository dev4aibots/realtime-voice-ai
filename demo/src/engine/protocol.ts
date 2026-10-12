// Frame protocol ported from dev4aibots/realtime-voice-ai src/protocol.ts.
// ADAPTATION: the original used zod (EventFrame / SummaryFrame / Frame,
// encodeFrame, decodeFrame). For the browser bundle this port re-implements
// the SAME validation by hand — zero dependencies — replicating zod's
// semantics exactly: required fields, literal `type` discrimination,
// per-field type checks, and stripping of unknown keys (z.object default).
// The wire shape {type:"event",line} / {type:"summary",...} is unchanged, so
// frames produced here are byte-compatible with what the original WS server
// sent (see PROTOCOL.md).

export type EventFrame = {
  type: "event";
  line: string;
};

export type SummaryFrame = {
  type: "summary";
  turnCompleteMs: number;
  firstLlmTokenMs: number;
  firstAudioOutMs: number;
  turnLatencyMs: number;
  bargeIns: number;
};

export type Frame = EventFrame | SummaryFrame;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function validateEventFrame(raw: Record<string, unknown>): EventFrame {
  if (raw.type !== "event") throw new Error(`invalid event frame type: ${String(raw.type)}`);
  if (typeof raw.line !== "string") throw new Error("event frame: 'line' must be a string");
  return { type: "event", line: raw.line }; // unknown keys stripped, like z.object
}

function num(raw: Record<string, unknown>, field: string): number {
  const v = raw[field];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(`summary frame: '${field}' must be a finite number`);
  }
  return v;
}

function validateSummaryFrame(raw: Record<string, unknown>): SummaryFrame {
  if (raw.type !== "summary") throw new Error(`invalid summary frame type: ${String(raw.type)}`);
  return {
    type: "summary",
    turnCompleteMs: num(raw, "turnCompleteMs"),
    firstLlmTokenMs: num(raw, "firstLlmTokenMs"),
    firstAudioOutMs: num(raw, "firstAudioOutMs"),
    turnLatencyMs: num(raw, "turnLatencyMs"),
    bargeIns: num(raw, "bargeIns"),
  }; // unknown keys stripped, like z.object
}

export function encodeFrame(f: Frame): string {
  return JSON.stringify(f);
}

export function decodeFrame(raw: string): Frame {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("decodeFrame: not valid JSON");
  }
  if (!isRecord(parsed)) throw new Error("decodeFrame: frame must be an object");
  if (parsed.type === "event") return validateEventFrame(parsed);
  if (parsed.type === "summary") return validateSummaryFrame(parsed);
  throw new Error(`decodeFrame: unknown frame type: ${String(parsed.type)}`);
}
