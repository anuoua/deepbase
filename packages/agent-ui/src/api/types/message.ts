export interface UserMessage {
  id: string;
  sessionID: string;
  role: "user";
  text: string;
  time: { created: number };
}

export interface AssistantMessage {
  id: string;
  sessionID: string;
  role: "assistant";
  time: { created: number; completed?: number };
  modelID: string;
  providerID: string;
  agent: string;
  finish?: string;
  error?: unknown;
}

export type Message = UserMessage | AssistantMessage;

export interface TextPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "text";
  text: string;
  synthetic?: boolean;
  ignored?: boolean;
  time?: { start: number; end?: number };
}

export interface ReasoningPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "reasoning";
  text: string;
  time: { start: number; end?: number };
}

export interface ToolPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "tool";
  callID: string;
  tool: string;
  state: ToolState;
  metadata?: Record<string, unknown>;
}

export interface StepStartPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "step_start";
  agent: string;
  model: { id: string; providerID: string; variant?: string };
  snapshot?: string;
}

export interface StepFinishPart {
  id: string;
  sessionID: string;
  messageID: string;
  type: "step_finish";
  finish: string;
  cost: number;
  tokens: TokenUsage;
  snapshot?: string;
}

export interface ToolState {
  status: "pending" | "running" | "completed" | "error";
  ran?: number;
  completed?: number;
  result?: string;
  error?: string;
  output?: string;
  input?: unknown;
}

export interface TokenUsage {
  total?: number;
  input: number;
  output: number;
  reasoning: number;
  cache: { read: number; write: number };
}

export type Part = TextPart | ReasoningPart | ToolPart | StepStartPart | StepFinishPart;

export interface MessageWithParts {
  info: Message;
  parts: Part[];
}

export interface TextPartInput {
  type: "text";
  text: string;
  id?: string;
  synthetic?: boolean;
  ignored?: boolean;
}

export interface SendMessageInput {
  parts: TextPartInput[];
  messageID?: string;
  model?: { providerID: string; modelID: string; variant?: string };
  agent?: string;
  noReply?: boolean;
  tools?: Record<string, boolean>;
  system?: string;
}
