import type { Event, OpencodeClient, Session as SessionInfo } from "@opencode-ai/sdk";
import {
  createAssistantBubbleLocal,
  createUserBubbleLocal,
  messagesToBubbles,
  partitionTools,
  type MessageWithParts,
} from "./bubble";
import {
  initialStreamingState,
  reduce,
  type AssistantStream,
  type StreamingState,
  type StreamEvent,
} from "./streaming";
import { OpencodeError } from "./types";
import type {
  Bubble,
  RevertStatus,
  SessionSnapshot,
  StreamPhase,
} from "./types";

type Listener = () => void;

const emptyRevert: RevertStatus = { canRestore: false, hiddenCount: 0 };

interface SessionState {
  loading: boolean;
  baseMessages: readonly Bubble[];
  childSessions: SessionInfo[];
  requesting: boolean;
  streaming: StreamingState | null;
  pendingUserBubble: Bubble | null;
  revert: RevertStatus;
  error: OpencodeError | undefined;
}

const initialState: SessionState = {
  loading: true,
  baseMessages: [],
  childSessions: [],
  requesting: false,
  streaming: null,
  pendingUserBubble: null,
  revert: emptyRevert,
  error: undefined,
};

function deriveAssistantBubble(stream: AssistantStream, idle: boolean): Bubble {
  const hasContent =
    stream.text !== "" ||
    stream.thinking !== "" ||
    stream.toolCalls.length > 0;
  const { regularTools, subtasks } = partitionTools(stream.toolCalls);
  return {
    kind: "assistant",
    id: `stream-${stream.messageID}`,
    messageID: stream.messageID,
    time: Date.now(),
    status: idle ? "done" : hasContent ? "streaming" : "pending",
    phase: stream.stepFinished || stream.text ? "answering" : "thinking",
    text: stream.text,
    thinking: stream.thinking,
    toolCalls: regularTools.map((tc) => ({ ...tc, state: { ...tc.state } })),
    subtasks,
  };
}

function applyRevert(
  allBubbles: readonly Bubble[],
  revertMessageID: string | undefined,
): { visible: readonly Bubble[]; revert: RevertStatus } {
  if (!revertMessageID) {
    return { visible: allBubbles, revert: emptyRevert };
  }
  const idx = allBubbles.findIndex((b) => b.messageID === revertMessageID);
  if (idx < 0) {
    return { visible: allBubbles, revert: emptyRevert };
  }
  return {
    visible: allBubbles.slice(0, idx),
    revert: { canRestore: true, hiddenCount: allBubbles.length - idx },
  };
}

export class Session {
  readonly id: string;
  private readonly sdk: OpencodeClient;
  private state: SessionState = { ...initialState };
  private listeners = new Set<Listener>();
  private snapshotCache: SessionSnapshot | null = null;

  constructor(id: string, sdk: OpencodeClient) {
    this.id = id;
    this.sdk = sdk;
  }

  getSnapshot(): SessionSnapshot {
    if (this.snapshotCache === null) {
      this.snapshotCache = this.buildSnapshot();
    }
    return this.snapshotCache;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  destroy(): void {
    this.listeners.clear();
    this.state = { ...initialState };
    this.snapshotCache = null;
  }

  private buildSnapshot(): SessionSnapshot {
    return {
      id: this.id,
      loading: this.state.loading,
      messages: this.deriveMessages(),
      childSessions: this.state.childSessions,
      requesting: this.state.requesting,
      streamPhase: this.derivePhase(),
      revert: this.state.revert,
      ...(this.state.error ? { error: this.state.error } : {}),
    };
  }

  private deriveMessages(): readonly Bubble[] {
    const { baseMessages, streaming, pendingUserBubble } = this.state;
    if (!streaming) return baseMessages;

    const user: Bubble | null = pendingUserBubble
      ? streaming.userMessageID
        ? { ...pendingUserBubble, messageID: streaming.userMessageID }
        : pendingUserBubble
      : null;

    if (streaming.assistants.length === 0) {
      const placeholder = createAssistantBubbleLocal(Date.now(), "stream-placeholder");
      return user ? [...baseMessages, user, placeholder] : [...baseMessages, placeholder];
    }

    const assistants = streaming.assistants.map((s) =>
      deriveAssistantBubble(s, streaming.idle),
    );
    return user
      ? [...baseMessages, user, ...assistants]
      : [...baseMessages, ...assistants];
  }

  private derivePhase(): StreamPhase {
    if (!this.state.streaming) return "idle";
    if (this.state.streaming.idle) return "idle";
    if (this.state.streaming.assistants.length === 0) return "sending";
    return "streaming";
  }

  private commit(): void {
    this.snapshotCache = null;
    for (const listener of this.listeners) listener();
  }

  private setError(err: unknown): void {
    this.state = {
      ...this.state,
      error:
        err instanceof OpencodeError
          ? err
          : err instanceof Error
            ? new OpencodeError("unknown", err.message, err)
            : new OpencodeError("unknown", String(err)),
    };
    this.commit();
  }

  clearError(): void {
    if (!this.state.error) return;
    this.state = { ...this.state, error: undefined };
    this.commit();
  }

  handleChildCreated(child: SessionInfo): void {
    if (this.state.childSessions.some((s) => s.id === child.id)) return;
    this.state = {
      ...this.state,
      childSessions: [...this.state.childSessions, child],
    };
    this.commit();
  }

  handleEvent(event: Event): void {
    if (event.type === "session.error") {
      const props = event.properties as {
        error?: { data?: { message?: string }; name?: string };
      };
      const msg =
        props.error?.data?.message ?? props.error?.name ?? "Unknown error";
      this.state = {
        ...this.state,
        requesting: false,
        error: new OpencodeError("server", msg),
      };
      this.commit();
      return;
    }

    if (event.type === "session.idle") {
      if (this.state.streaming && !this.state.streaming.idle) {
        this.state = {
          ...this.state,
          streaming: { ...this.state.streaming, idle: true },
          requesting: false,
        };
        this.commit();
        void this.reloadAfterIdle();
      }
      return;
    }

    if (!this.state.streaming) return;

    const prev = this.state.streaming;
    const next = reduce(prev, event as StreamEvent);
    if (next === prev) return;

    this.state = { ...this.state, streaming: next };
    this.commit();
  }

  async load(): Promise<void> {
    try {
      const [sessionR, msgsR, childrenR] = await Promise.all([
        this.sdk.session.get({ path: { id: this.id } }),
        this.sdk.session.messages({ path: { id: this.id } }),
        this.sdk.session.children({ path: { id: this.id } }),
      ]);

      if (sessionR.error) throw sessionR.error;
      if (msgsR.error) throw msgsR.error;
      if (childrenR.error) throw childrenR.error;

      const allBubbles = messagesToBubbles(
        (msgsR.data ?? []) as readonly MessageWithParts[],
      );
      const { visible, revert } = applyRevert(
        allBubbles,
        sessionR.data?.revert?.messageID,
      );

      this.state = {
        ...this.state,
        loading: false,
        baseMessages: visible,
        childSessions: childrenR.data ?? [],
        revert,
      };
      this.commit();
    } catch (err) {
      this.state = { ...this.state, loading: false };
      this.setError(err);
    }
  }

  private async reloadAfterIdle(): Promise<void> {
    try {
      const [sessionR, msgsR] = await Promise.all([
        this.sdk.session.get({ path: { id: this.id } }),
        this.sdk.session.messages({ path: { id: this.id } }),
      ]);

      if (sessionR.error || msgsR.error) return;

      const allBubbles = messagesToBubbles(
        (msgsR.data ?? []) as readonly MessageWithParts[],
      );
      const revertMsgID = sessionR.data?.revert?.messageID;
      const { visible, revert } = revertMsgID
        ? applyRevert(allBubbles, revertMsgID)
        : { visible: allBubbles, revert: emptyRevert };

      this.state = {
        ...this.state,
        baseMessages: visible,
        revert,
        streaming: null,
        pendingUserBubble: null,
      };
      this.commit();
    } catch {
      // Keep streaming state as fallback
    }
  }

  async send(text: string): Promise<void> {
    if (this.state.requesting) return;

    const userBubble = createUserBubbleLocal(text, Date.now());

    this.state = {
      ...this.state,
      requesting: true,
      streaming: { ...initialStreamingState },
      pendingUserBubble: userBubble,
      revert: emptyRevert,
    };
    this.commit();

    try {
      const r = await this.sdk.session.promptAsync({
        path: { id: this.id },
        body: { parts: [{ type: "text", text }] },
      });
      if (r.error) throw r.error;
    } catch (err) {
      this.state = {
        ...this.state,
        requesting: false,
        streaming: null,
        pendingUserBubble: null,
        baseMessages: [
          ...this.state.baseMessages,
          {
            kind: "assistant",
            id: `err-${Date.now()}`,
            time: Date.now(),
            status: "error",
            phase: "answering",
            text: `请求失败: ${err instanceof Error ? err.message : String(err)}`,
            thinking: "",
            toolCalls: [],
            subtasks: [],
          },
        ],
      };
      this.commit();
    }
  }

  async abort(): Promise<void> {
    try {
      const r = await this.sdk.session.abort({
        path: { id: this.id },
      });
      if (r.error) throw r.error;
      this.state = { ...this.state, requesting: false };
      this.commit();
    } catch (err) {
      this.setError(err);
    }
  }

  async revertTo(messageID: string): Promise<string> {
    try {
      const r = await this.sdk.session.revert({
        path: { id: this.id },
        body: { messageID },
      });
      if (r.error) throw r.error;

      const msgsR = await this.sdk.session.messages({
        path: { id: this.id },
      });
      if (msgsR.error) throw msgsR.error;

      const allBubbles = messagesToBubbles(
        (msgsR.data ?? []) as readonly MessageWithParts[],
      );
      const idx = allBubbles.findIndex((b) => b.messageID === messageID);
      if (idx >= 0) {
        const reverted = allBubbles[idx];
        const text = reverted?.kind === "user" ? reverted.text : "";
        const { visible, revert } = applyRevert(allBubbles, messageID);
        this.state = {
          ...this.state,
          baseMessages: visible,
          revert,
        };
        this.commit();
        return text;
      }
    } catch (err) {
      this.setError(err);
    }
    return "";
  }

  async clearRevert(): Promise<void> {
    try {
      const r = await this.sdk.session.unrevert({
        path: { id: this.id },
      });
      if (r.error) throw r.error;

      const msgsR = await this.sdk.session.messages({
        path: { id: this.id },
      });
      if (msgsR.error) throw msgsR.error;

      this.state = {
        ...this.state,
        baseMessages: messagesToBubbles(
          (msgsR.data ?? []) as readonly MessageWithParts[],
        ),
        revert: emptyRevert,
      };
      this.commit();
    } catch (err) {
      this.setError(err);
    }
  }
}
