import type { Message, Part, ToolPart } from "@opencode-ai/sdk";
import type { AssistantBubble, Bubble, UserBubble } from "./types";

export interface MessageWithParts {
  readonly info: Message;
  readonly parts: readonly Part[];
}

const createIdGenerator = () => {
  let n = 0;
  return () => `b${++n}`;
};

export const newBubbleId = createIdGenerator();

const isText = (p: Part): p is Part & { type: "text"; text: string } =>
  p.type === "text";

const isReasoning = (p: Part): p is Part & { type: "reasoning"; text: string } =>
  p.type === "reasoning";

const isTool = (p: Part): p is ToolPart => p.type === "tool";

const textOf = (part: (Part & { text?: string }) | undefined): string =>
  part?.text ?? "";

export function userBubbleFromMessage(
  msg: MessageWithParts,
  id: string = newBubbleId(),
): UserBubble {
  const textPart = msg.parts.find(isText);
  return {
    kind: "user",
    id,
    messageID: msg.info.id,
    text: textOf(textPart),
    time: msg.info.time.created,
  };
}

export function assistantBubbleFromMessage(
  msg: MessageWithParts,
  id: string = newBubbleId(),
): AssistantBubble | null {
  const textPart = msg.parts.find(isText);
  const reasoningPart = msg.parts.find(isReasoning);
  const toolParts = msg.parts.filter(isTool);
  if (!textPart && !reasoningPart && toolParts.length === 0) return null;

  return {
    kind: "assistant",
    id,
    messageID: msg.info.id,
    time: msg.info.time.created,
    status: "done",
    phase: "answering",
    text: textOf(textPart),
    thinking: textOf(reasoningPart),
    toolCalls: toolParts,
  };
}

export function messagesToBubbles(msgs: readonly MessageWithParts[]): Bubble[] {
  const bubbles: Bubble[] = [];
  for (const msg of msgs) {
    if (msg.info.role === "user") {
      bubbles.push(userBubbleFromMessage(msg));
    } else {
      const b = assistantBubbleFromMessage(msg);
      if (b) bubbles.push(b);
    }
  }
  return bubbles;
}

export function createUserBubbleLocal(
  text: string,
  time: number,
  id: string = newBubbleId(),
): UserBubble {
  return { kind: "user", id, text, time };
}

export function createAssistantBubbleLocal(
  time: number,
  id: string = newBubbleId(),
): AssistantBubble {
  return {
    kind: "assistant",
    id,
    time,
    status: "pending",
    phase: "thinking",
    text: "",
    thinking: "",
    toolCalls: [],
  };
}
