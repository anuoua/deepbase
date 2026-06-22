import type { OpenCodeSession, ToolPart } from "../../api/types/index";

export interface SessionItem {
  key: string;
  label: string;
}

export interface AgentUIMessage {
  role: string;
  content?: string;
  thinking?: string;
  toolCalls?: ToolPart[];
  phase: "thinking" | "answering";
}

export interface BubbleItem {
  key: number | string;
  role: string;
  content: string | AgentUIMessage;
  loading: boolean;
  streaming: boolean;
  time?: number;
  messageID?: string;
}

export interface OpenCodeClientConfig {
  baseurl: string;
}

export interface ClientEvents {
  messagesChanged: [messages: BubbleItem[]];
  sessionChanged: [sessionID: string | undefined];
  requesting: [requesting: boolean];
  error: [error: Error];
  childSessionsChanged: [sessions: OpenCodeSession[]];
  sessionsChanged: [sessions: SessionItem[]];
}

let msgIdCounter = 0;
export function nextId(): number {
  msgIdCounter += 1;
  return msgIdCounter;
}
export function resetIdCounter(): void {
  msgIdCounter = 0;
}