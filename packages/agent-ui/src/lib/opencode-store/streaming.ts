import type { Event, Part, ToolPart } from "@opencode-ai/sdk";

export interface PartDeltaProperties {
  sessionID: string;
  messageID: string;
  partID: string;
  field: string;
  delta: string;
}

export type PartDeltaEvent = {
  type: "message.part.delta";
  properties: PartDeltaProperties;
};

export type StreamEvent = Event | PartDeltaEvent;

export interface AssistantStream {
  readonly messageID: string;
  readonly text: string;
  readonly thinking: string;
  readonly toolCalls: readonly ToolPart[];
  readonly stepFinished: boolean;
  readonly partTypes: ReadonlyMap<string, string>;
}

export interface StreamingState {
  readonly userMessageID?: string;
  readonly assistants: readonly AssistantStream[];
  readonly idle: boolean;
}

export const initialStreamingState: StreamingState = {
  assistants: [],
  idle: false,
};

export function isStreamingDone(state: StreamingState): boolean {
  return state.idle;
}

export function hasStreamContent(state: StreamingState): boolean {
  return state.assistants.some(
    (a) => a.text !== "" || a.thinking !== "" || a.toolCalls.length > 0,
  );
}

function patchAssistant(
  state: StreamingState,
  messageID: string,
  patch: (prev: AssistantStream) => AssistantStream,
): StreamingState {
  const index = state.assistants.findIndex((a) => a.messageID === messageID);
  if (index < 0) return state;
  const assistants = [...state.assistants];
  assistants[index] = patch(assistants[index]!);
  return { ...state, assistants };
}

function handlePartUpdated(state: StreamingState, part: Part): StreamingState {
  const messageID = part.messageID;

  if (part.type === "text") {
    return patchAssistant(state, messageID, (prev) => {
      const partTypes = new Map(prev.partTypes);
      partTypes.set(part.id, "text");
      return { ...prev, partTypes, text: part.text };
    });
  }

  if (part.type === "reasoning") {
    return patchAssistant(state, messageID, (prev) => {
      const partTypes = new Map(prev.partTypes);
      partTypes.set(part.id, "reasoning");
      return { ...prev, partTypes, thinking: part.text };
    });
  }

  if (part.type === "tool") {
    return patchAssistant(state, messageID, (prev) => {
      const idx = prev.toolCalls.findIndex((tc) => tc.callID === part.callID);
      if (idx >= 0) {
        const toolCalls = [...prev.toolCalls];
        toolCalls[idx] = part;
        return { ...prev, toolCalls };
      }
      return { ...prev, toolCalls: [...prev.toolCalls, part] };
    });
  }

  if (part.type === "step-finish") {
    return patchAssistant(state, messageID, (prev) => ({
      ...prev,
      stepFinished: true,
    }));
  }

  return state;
}

function handlePartDelta(
  state: StreamingState,
  props: PartDeltaProperties,
): StreamingState {
  return patchAssistant(state, props.messageID, (prev) => {
    const partType = prev.partTypes.get(props.partID);
    if (partType === "reasoning") {
      return { ...prev, thinking: prev.thinking + props.delta };
    }
    if (partType === "text") {
      return { ...prev, text: prev.text + props.delta };
    }
    return prev;
  });
}

export function reduce(
  state: StreamingState,
  event: StreamEvent,
): StreamingState {
  switch (event.type) {
    case "message.updated": {
      const info = event.properties.info;
      if (info.role === "user") {
        return { ...state, userMessageID: info.id };
      }
      if (info.role === "assistant") {
        const exists = state.assistants.some(
          (a) => a.messageID === info.id,
        );
        if (!exists) {
          return {
            ...state,
            assistants: [
              ...state.assistants,
              {
                messageID: info.id,
                text: "",
                thinking: "",
                toolCalls: [],
                stepFinished: false,
                partTypes: new Map(),
              },
            ],
          };
        }
      }
      return state;
    }

    case "message.part.updated": {
      return handlePartUpdated(state, event.properties.part);
    }

    case "message.part.delta": {
      return handlePartDelta(
        state,
        (event as PartDeltaEvent).properties,
      );
    }

    case "session.idle": {
      return { ...state, idle: true };
    }

    default:
      return state;
  }
}
