import type { Part, TokenUsage } from "./message";

export interface ToolContent {
  type: "text";
  text: string;
}

export interface BaseEvent {
  id: string;
  type: string;
  properties: {
    timestamp: number;
    sessionID: string;
  };
}

export interface EventSessionNextPrompted extends BaseEvent {
  type: "session.next.prompted";
  properties: BaseEvent["properties"] & {
    messageID: string;
    prompt: { text: string };
  };
}

export interface EventSessionNextStepStarted extends BaseEvent {
  type: "session.next.step.started";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    agent: string;
    model: { id: string; providerID: string; variant?: string };
    snapshot?: string;
  };
}

export interface EventSessionNextStepEnded extends BaseEvent {
  type: "session.next.step.ended";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    finish: string;
    cost: number;
    tokens: TokenUsage;
    snapshot?: string;
  };
}

export interface EventSessionNextReasoningStarted extends BaseEvent {
  type: "session.next.reasoning.started";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    reasoningID: string;
    providerMetadata?: Record<string, unknown>;
  };
}

export interface EventSessionNextReasoningDelta extends BaseEvent {
  type: "session.next.reasoning.delta";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    reasoningID: string;
    delta: string;
  };
}

export interface EventSessionNextReasoningEnded extends BaseEvent {
  type: "session.next.reasoning.ended";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    reasoningID: string;
    text: string;
    providerMetadata?: Record<string, unknown>;
  };
}

export interface EventSessionNextTextStarted extends BaseEvent {
  type: "session.next.text.started";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    textID: string;
  };
}

export interface EventSessionNextTextDelta extends BaseEvent {
  type: "session.next.text.delta";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    textID: string;
    delta: string;
  };
}

export interface EventSessionNextTextEnded extends BaseEvent {
  type: "session.next.text.ended";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    textID: string;
    text: string;
  };
}

export interface EventSessionNextToolInputStarted extends BaseEvent {
  type: "session.next.tool.input.started";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    callID: string;
    name: string;
  };
}

export interface EventSessionNextToolInputDelta extends BaseEvent {
  type: "session.next.tool.input.delta";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    callID: string;
    delta: string;
  };
}

export interface EventSessionNextToolInputEnded extends BaseEvent {
  type: "session.next.tool.input.ended";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    callID: string;
    text: string;
  };
}

export interface EventSessionNextToolCalled extends BaseEvent {
  type: "session.next.tool.called";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    callID: string;
    tool: string;
    input: Record<string, unknown>;
    provider: { executed: boolean; metadata?: Record<string, unknown> };
  };
}

export interface EventSessionNextToolProgress extends BaseEvent {
  type: "session.next.tool.progress";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    callID: string;
    structured: Record<string, unknown>;
    content: ToolContent[];
  };
}

export interface EventSessionNextToolSuccess extends BaseEvent {
  type: "session.next.tool.success";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    callID: string;
    structured: Record<string, unknown>;
    content: ToolContent[];
    result?: unknown;
    provider: { executed: boolean; metadata?: Record<string, unknown> };
  };
}

export interface EventSessionNextToolFailed extends BaseEvent {
  type: "session.next.tool.failed";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    callID: string;
    error: unknown;
    result?: unknown;
    provider: { executed: boolean; metadata?: Record<string, unknown> };
  };
}

export interface EventSessionNextRetried extends BaseEvent {
  type: "session.next.retried";
  properties: BaseEvent["properties"] & { assistantMessageID: string };
}

export interface EventMessageUpdated extends BaseEvent {
  type: "message.updated";
  properties: BaseEvent["properties"] & {
    messageID: string;
    assistantMessageID: string;
    info?: { role: string; id: string };
  };
}

export interface EventSessionCreated extends BaseEvent {
  type: "session.created";
  properties: BaseEvent["properties"] & {};
}

export interface EventSessionError extends BaseEvent {
  type: "session.error";
  properties: BaseEvent["properties"] & {
    assistantMessageID: string;
    error: unknown;
  };
}

export interface EventSessionStatus extends BaseEvent {
  type: "session.status";
  properties: BaseEvent["properties"] & { status: string };
}

export interface EventSessionIdle extends BaseEvent {
  type: "session.idle";
  properties: BaseEvent["properties"] & {};
}

export interface EventMessagePartDeltaEvent {
  id: string;
  type: "message.part.delta";
  properties: {
    sessionID: string;
    messageID: string;
    partID: string;
    field: string;
    delta: string;
  };
}

export interface EventMessagePartUpdatedEvent {
  id: string;
  type: "message.part.updated";
  properties: {
    sessionID: string;
    part: Part;
    time: number;
  };
}

export type StreamEvent =
  | EventSessionNextPrompted
  | EventSessionNextStepStarted
  | EventSessionNextStepEnded
  | EventSessionNextReasoningStarted
  | EventSessionNextReasoningDelta
  | EventSessionNextReasoningEnded
  | EventSessionNextTextStarted
  | EventSessionNextTextDelta
  | EventSessionNextTextEnded
  | EventSessionNextToolInputStarted
  | EventSessionNextToolInputDelta
  | EventSessionNextToolInputEnded
  | EventSessionNextToolCalled
  | EventSessionNextToolProgress
  | EventSessionNextToolSuccess
  | EventSessionNextToolFailed
  | EventSessionNextRetried
  | EventMessageUpdated
  | EventSessionCreated
  | EventSessionError
  | EventSessionStatus
  | EventSessionIdle
  | EventMessagePartDeltaEvent
  | EventMessagePartUpdatedEvent;
