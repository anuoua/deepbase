import type { Provider, Session, ToolPart } from "@opencode-ai/sdk";

export type BubbleStatus = "pending" | "streaming" | "done" | "error";

export type AssistantPhase = "thinking" | "answering";

export interface SubtaskRef {
  readonly id: string;
  readonly agent: string;
  readonly description: string;
  readonly prompt: string;
  readonly childSessionID?: string;
}

export interface UserBubble {
  readonly kind: "user";
  readonly id: string;
  readonly messageID?: string;
  readonly text: string;
  readonly time: number;
}

export interface AssistantBubble {
  readonly kind: "assistant";
  readonly id: string;
  readonly messageID?: string;
  readonly time: number;
  readonly status: BubbleStatus;
  readonly phase: AssistantPhase;
  readonly text: string;
  readonly thinking: string;
  readonly toolCalls: readonly ToolPart[];
  readonly subtasks: readonly SubtaskRef[];
  readonly error?: string;
}

export type Bubble = UserBubble | AssistantBubble;

export interface SessionRef {
  readonly id: string;
  readonly title: string;
}

export type StreamPhase = "idle" | "sending" | "streaming" | "finishing";

export interface RevertStatus {
  readonly canRestore: boolean;
  readonly hiddenCount: number;
}

export interface ClientSnapshot {
  readonly sessionID?: string;
  readonly sessions: readonly SessionRef[];
  readonly messages: readonly Bubble[];
  readonly childSessions: readonly Session[];
  readonly childMessages: ReadonlyMap<string, readonly Bubble[]>;
  readonly childLoading: ReadonlySet<string>;
  readonly requesting: boolean;
  readonly streamPhase: StreamPhase;
  readonly revert: RevertStatus;
  readonly providers: readonly Provider[];
  readonly providersLoading: boolean;
  readonly error?: OpencodeError;
}

export type OpencodeErrorCode =
  | "network"
  | "auth"
  | "not_found"
  | "aborted"
  | "server"
  | "unknown";

export class OpencodeError extends Error {
  constructor(
    readonly code: OpencodeErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "OpencodeError";
  }
}

export interface OpencodeStoreConfig {
  readonly baseUrl?: string;
  readonly directory?: string;
}
