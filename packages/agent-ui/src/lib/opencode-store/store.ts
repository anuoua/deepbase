import type { Event, OpencodeClient, Provider, Session } from "@opencode-ai/sdk";
import { createOpencodeClient } from "@opencode-ai/sdk";
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
  ClientSnapshot,
  OpencodeStoreConfig,
  RevertStatus,
  SessionRef,
  StreamPhase,
} from "./types";

type Listener = () => void;

interface StoreState {
  sessionID: string | undefined;
  sessions: SessionRef[];
  baseMessages: Bubble[];
  childSessions: Session[];
  childMessages: Map<string, readonly Bubble[]>;
  childLoading: Set<string>;
  watchedChildren: Set<string>;
  childStreams: Map<string, StreamingState>;
  requesting: boolean;
  streaming: StreamingState | null;
  pendingUserBubble: Bubble | null;
  revert: RevertStatus;
  originalFullLength: number;
  error: OpencodeError | undefined;
  providers: Provider[];
  providersLoading: boolean;
}

const emptyRevert: RevertStatus = { canRestore: false, hiddenCount: 0 };

const initialState: StoreState = {
  sessionID: undefined,
  sessions: [],
  baseMessages: [],
  childSessions: [],
  childMessages: new Map(),
  childLoading: new Set(),
  watchedChildren: new Set(),
  childStreams: new Map(),
  requesting: false,
  streaming: null,
  pendingUserBubble: null,
  revert: emptyRevert,
  originalFullLength: 0,
  error: undefined,
  providers: [],
  providersLoading: false,
};

function toSessionRef(s: Session): SessionRef {
  return { id: s.id, title: s.title || s.id.slice(0, 8) };
}

function extractSessionID(event: Event): string | undefined {
  const p = event.properties as Record<string, unknown>;
  if (typeof p.sessionID === "string") return p.sessionID;
  const info = p.info as { sessionID?: string } | undefined;
  if (typeof info?.sessionID === "string") return info.sessionID;
  const part = p.part as { sessionID?: string } | undefined;
  if (typeof part?.sessionID === "string") return part.sessionID;
  return undefined;
}

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
  allBubbles: Bubble[],
  revertMessageID: string | undefined,
): { visible: Bubble[]; revert: RevertStatus; originalFullLength: number } {
  if (!revertMessageID) {
    return {
      visible: allBubbles,
      revert: emptyRevert,
      originalFullLength: allBubbles.length,
    };
  }
  const idx = allBubbles.findIndex((b) => b.messageID === revertMessageID);
  if (idx < 0) {
    return {
      visible: allBubbles,
      revert: emptyRevert,
      originalFullLength: allBubbles.length,
    };
  }
  return {
    visible: allBubbles.slice(0, idx),
    revert: { canRestore: true, hiddenCount: allBubbles.length - idx },
    originalFullLength: allBubbles.length,
  };
}

export class OpencodeStore {
  private readonly sdk: OpencodeClient;
  private state: StoreState = { ...initialState };
  private listeners = new Set<Listener>();
  private abortController: AbortController | null = null;
  private snapshotCache: ClientSnapshot | null = null;

  constructor(config: OpencodeStoreConfig = {}) {
    this.sdk = createOpencodeClient({
      baseUrl: config.baseUrl ?? "/opencode-api",
      ...(config.directory ? { directory: config.directory } : {}),
    });
  }

  static create(config?: OpencodeStoreConfig): OpencodeStore {
    return new OpencodeStore(config ?? {});
  }

  get sdkClient(): OpencodeClient {
    return this.sdk;
  }

  getSnapshot(): ClientSnapshot {
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
    this.abortSSE();
    this.listeners.clear();
    this.state = { ...initialState };
    this.snapshotCache = null;
  }

  private buildSnapshot(): ClientSnapshot {
    const messages = this.deriveMessages();
    return {
      ...(this.state.sessionID ? { sessionID: this.state.sessionID } : {}),
      sessions: this.state.sessions,
      messages,
      childSessions: this.state.childSessions,
      childMessages: this.buildChildMessagesSnapshot(),
      childLoading: this.state.childLoading,
      requesting: this.state.requesting,
      streamPhase: this.derivePhase(),
      revert: this.state.revert,
      providers: this.state.providers,
      providersLoading: this.state.providersLoading,
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

  private deriveChildMessages(
    base: readonly Bubble[],
    stream: StreamingState,
  ): readonly Bubble[] {
    if (stream.assistants.length === 0) return base;
    const streamingIDs = new Set(
      stream.assistants.map((a) => a.messageID),
    );
    const filteredBase = base.filter(
      (b) => !b.messageID || !streamingIDs.has(b.messageID),
    );
    const assistants = stream.assistants.map((s) =>
      deriveAssistantBubble(s, stream.idle),
    );
    return [...filteredBase, ...assistants];
  }

  private buildChildMessagesSnapshot(): ReadonlyMap<string, readonly Bubble[]> {
    const result = new Map<string, readonly Bubble[]>(
      this.state.childMessages,
    );
    for (const [sessionID, stream] of this.state.childStreams) {
      const base = this.state.childMessages.get(sessionID);
      if (base && stream.assistants.length > 0) {
        result.set(sessionID, this.deriveChildMessages(base, stream));
      }
    }
    return result;
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

  async refreshSessions(): Promise<void> {
    try {
      const r = await this.sdk.session.list();
      if (r.error) throw r.error;
      this.state = {
        ...this.state,
        sessions: (r.data ?? []).filter((s) => !s.parentID).map(toSessionRef),
      };
      this.commit();
    } catch (err) {
      this.setError(err);
    }
  }

  async createSession(opts?: { title?: string; switch?: boolean }): Promise<string | undefined> {
    try {
      const r = await this.sdk.session.create({
        body: { ...(opts?.title ? { title: opts.title } : {}) },
      });
      if (r.error) throw r.error;
      const session = r.data;
      if (!session) return undefined;
      if (!session.parentID) {
        this.state = {
          ...this.state,
          sessions: [toSessionRef(session), ...this.state.sessions],
        };
        this.commit();
      }
      if (opts?.switch) {
        await this.switchTo(session.id);
      }
      return session.id;
    } catch (err) {
      this.setError(err);
      return undefined;
    }
  }

  async deleteSession(sessionID: string): Promise<void> {
    try {
      const r = await this.sdk.session.delete({ path: { id: sessionID } });
      if (r.error) throw r.error;
      this.state = {
        ...this.state,
        sessions: this.state.sessions.filter((s) => s.id !== sessionID),
      };
      if (this.state.sessionID === sessionID) {
        this.abortSSE();
        this.state = {
          ...this.state,
          sessionID: undefined,
          baseMessages: [],
          childSessions: [],
          childMessages: new Map(),
          childLoading: new Set(),
          watchedChildren: new Set(),
          childStreams: new Map(),
          revert: emptyRevert,
          originalFullLength: 0,
          streaming: null,
          pendingUserBubble: null,
        };
      }
      this.commit();
    } catch (err) {
      this.setError(err);
    }
  }

  async renameSession(sessionID: string, title: string): Promise<void> {
    try {
      const r = await this.sdk.session.update({
        path: { id: sessionID },
        body: { title },
      });
      if (r.error) throw r.error;
      this.state = {
        ...this.state,
        sessions: this.state.sessions.map((s) =>
          s.id === sessionID ? { ...s, title } : s,
        ),
      };
      this.commit();
    } catch (err) {
      this.setError(err);
    }
  }

  async switchTo(sessionID: string): Promise<void> {
    this.abortSSE();
    this.state = {
      ...this.state,
      sessionID,
      streaming: null,
      pendingUserBubble: null,
      revert: emptyRevert,
      originalFullLength: 0,
      childMessages: new Map(),
      childLoading: new Set(),
      watchedChildren: new Set(),
      childStreams: new Map(),
    };
    this.commit();

    try {
      const [sessionR, msgsR, childrenR] = await Promise.all([
        this.sdk.session.get({ path: { id: sessionID } }),
        this.sdk.session.messages({ path: { id: sessionID } }),
        this.sdk.session.children({ path: { id: sessionID } }),
      ]);

      if (sessionR.error) throw sessionR.error;
      if (msgsR.error) throw msgsR.error;
      if (childrenR.error) throw childrenR.error;

      const session = sessionR.data;
      const msgs = msgsR.data ?? [];
      const children = childrenR.data ?? [];

      const allBubbles = messagesToBubbles(msgs as readonly MessageWithParts[]);
      const { visible, revert, originalFullLength } = applyRevert(
        allBubbles,
        session?.revert?.messageID,
      );

      this.state = {
        ...this.state,
        baseMessages: visible,
        childSessions: children,
        revert,
        originalFullLength,
      };
      this.commit();

      this.startPump();
    } catch (err) {
      this.setError(err);
    }
  }

  async send(text: string): Promise<void> {
    if (this.state.requesting || !this.state.sessionID) return;
    const sessionID = this.state.sessionID;

    const userBubble = createUserBubbleLocal(text, Date.now());

    this.state = {
      ...this.state,
      requesting: true,
      streaming: { ...initialStreamingState },
      pendingUserBubble: userBubble,
      revert: emptyRevert,
      originalFullLength: 0,
    };
    this.commit();

    try {
      const r = await this.sdk.session.promptAsync({
        path: { id: sessionID },
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
    if (!this.state.sessionID) return;
    try {
      const r = await this.sdk.session.abort({
        path: { id: this.state.sessionID },
      });
      if (r.error) throw r.error;
      this.state = { ...this.state, requesting: false };
      this.commit();
    } catch (err) {
      this.setError(err);
    }
  }

  async revertTo(messageID: string): Promise<string> {
    if (!this.state.sessionID) return "";
    try {
      const r = await this.sdk.session.revert({
        path: { id: this.state.sessionID },
        body: { messageID },
      });
      if (r.error) throw r.error;

      const msgsR = await this.sdk.session.messages({
        path: { id: this.state.sessionID },
      });
      if (msgsR.error) throw msgsR.error;

      const allBubbles = messagesToBubbles(
        (msgsR.data ?? []) as readonly MessageWithParts[],
      );
      const idx = allBubbles.findIndex((b) => b.messageID === messageID);
      if (idx >= 0) {
        const reverted = allBubbles[idx];
        const text = reverted?.kind === "user" ? reverted.text : "";
        const { visible, revert, originalFullLength } = applyRevert(
          allBubbles,
          messageID,
        );
        this.state = {
          ...this.state,
          baseMessages: visible,
          revert,
          originalFullLength,
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
    if (!this.state.sessionID) return;
    try {
      const r = await this.sdk.session.unrevert({
        path: { id: this.state.sessionID },
      });
      if (r.error) throw r.error;

      const msgsR = await this.sdk.session.messages({
        path: { id: this.state.sessionID },
      });
      if (msgsR.error) throw msgsR.error;

      this.state = {
        ...this.state,
        baseMessages: messagesToBubbles(
          (msgsR.data ?? []) as readonly MessageWithParts[],
        ),
        revert: emptyRevert,
        originalFullLength: 0,
      };
      this.commit();
    } catch (err) {
      this.setError(err);
    }
  }

  async loadChildMessages(sessionID: string): Promise<readonly Bubble[]> {
    const r = await this.sdk.session.messages({ path: { id: sessionID } });
    if (r.error) throw r.error;
    return messagesToBubbles((r.data ?? []) as readonly MessageWithParts[]);
  }

  ensureChildMessages(sessionID: string): void {
    if (this.state.childMessages.has(sessionID)) return;
    if (this.state.childLoading.has(sessionID)) return;
    this.state = {
      ...this.state,
      childLoading: new Set(this.state.childLoading).add(sessionID),
    };
    this.commit();
    void this.loadChildMessages(sessionID)
      .then((msgs) => {
        const childMessages = new Map(this.state.childMessages);
        childMessages.set(sessionID, msgs);
        const childLoading = new Set(this.state.childLoading);
        childLoading.delete(sessionID);
        this.state = { ...this.state, childMessages, childLoading };
        this.commit();
      })
      .catch((err) => {
        const childLoading = new Set(this.state.childLoading);
        childLoading.delete(sessionID);
        this.state = { ...this.state, childLoading };
        this.setError(err);
      });
  }

  watchChild(sessionID: string): void {
    if (this.state.watchedChildren.has(sessionID)) return;
    const watchedChildren = new Set(this.state.watchedChildren).add(sessionID);
    const childStreams = new Map(this.state.childStreams);
    childStreams.set(sessionID, { ...initialStreamingState });
    this.state = { ...this.state, watchedChildren, childStreams };
    this.commit();
    this.ensureChildMessages(sessionID);
  }

  unwatchChild(sessionID: string): void {
    if (!this.state.watchedChildren.has(sessionID)) return;
    const watchedChildren = new Set(this.state.watchedChildren);
    watchedChildren.delete(sessionID);
    const childStreams = new Map(this.state.childStreams);
    childStreams.delete(sessionID);
    this.state = { ...this.state, watchedChildren, childStreams };
    this.commit();
  }

  private handleChildEvent(sessionID: string, event: Event): void {
    if (event.type === "session.idle") {
      const childStreams = new Map(this.state.childStreams);
      childStreams.delete(sessionID);
      this.state = { ...this.state, childStreams };
      this.commit();
      void this.reloadChildMessages(sessionID);
      return;
    }

    const stream = this.state.childStreams.get(sessionID);
    if (!stream) return;

    const next = reduce(stream, event as StreamEvent);
    if (next === stream) return;

    const childStreams = new Map(this.state.childStreams);
    childStreams.set(sessionID, next);
    this.state = { ...this.state, childStreams };
    this.commit();
  }

  private async reloadChildMessages(sessionID: string): Promise<void> {
    try {
      const r = await this.sdk.session.messages({ path: { id: sessionID } });
      if (r.error) throw r.error;
      const msgs = messagesToBubbles(
        (r.data ?? []) as readonly MessageWithParts[],
      );
      const childMessages = new Map(this.state.childMessages);
      childMessages.set(sessionID, msgs);
      this.state = { ...this.state, childMessages };
      this.commit();
    } catch {
      // keep cached messages
    }
  }

  async loadProviders(): Promise<void> {
    if (this.state.providersLoading) return;
    this.state = { ...this.state, providersLoading: true };
    this.commit();
    try {
      const r = await this.sdk.config.providers();
      if (r.error) throw r.error;
      this.state = {
        ...this.state,
        providers: r.data?.providers ?? [],
        providersLoading: false,
      };
      this.commit();
    } catch (err) {
      this.state = { ...this.state, providersLoading: false };
      this.setError(err);
    }
  }

  private startPump(): void {
    this.abortSSE();
    this.abortController = new AbortController();
    void this.pump(this.abortController);
  }

  private async pump(controller: AbortController): Promise<void> {
    try {
      const result = await this.sdk.event.subscribe({
        signal: controller.signal,
      });
      for await (const event of result.stream) {
        if (controller.signal.aborted) break;
        this.handleEvent(event);
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      this.setError(err);
    }
  }

  private handleEvent(event: Event): void {
    if (event.type === "session.created") {
      const session = (event.properties as { info: Session }).info;
      if (
        session.parentID &&
        session.parentID === this.state.sessionID &&
        !this.state.childSessions.some((s) => s.id === session.id)
      ) {
        this.state = {
          ...this.state,
          childSessions: [...this.state.childSessions, session],
        };
        this.commit();
      }
      return;
    }

    if (event.type === "session.error") {
      const props = event.properties as {
        sessionID?: string;
        error?: { data?: { message?: string }; name?: string };
      };
      if (props.sessionID && props.sessionID !== this.state.sessionID) return;
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

    const sid = extractSessionID(event);
    if (!sid) return;

    if (sid !== this.state.sessionID) {
      if (this.state.watchedChildren.has(sid)) {
        this.handleChildEvent(sid, event);
      }
      return;
    }
    if (!this.state.streaming) return;

    const prev = this.state.streaming;
    const next = reduce(prev, event as StreamEvent);
    if (next === prev) return;

    if (next.idle && !prev.idle) {
      this.state = { ...this.state, streaming: next, requesting: false };
      this.commit();
      void this.reloadAfterIdle();
    } else {
      this.state = { ...this.state, streaming: next };
      this.commit();
    }
  }

  private async reloadAfterIdle(): Promise<void> {
    if (!this.state.sessionID) return;
    try {
      const [sessionR, msgsR] = await Promise.all([
        this.sdk.session.get({ path: { id: this.state.sessionID } }),
        this.sdk.session.messages({ path: { id: this.state.sessionID } }),
      ]);

      if (sessionR.error || msgsR.error) return;

      const allBubbles = messagesToBubbles(
        (msgsR.data ?? []) as readonly MessageWithParts[],
      );
      const revertMsgID = sessionR.data?.revert?.messageID;
      const { visible, revert, originalFullLength } = revertMsgID
        ? applyRevert(allBubbles, revertMsgID)
        : { visible: allBubbles, revert: emptyRevert, originalFullLength: 0 };

      this.state = {
        ...this.state,
        baseMessages: visible,
        revert,
        originalFullLength,
        streaming: null,
        pendingUserBubble: null,
      };
      this.commit();
    } catch {
      // Keep streaming state as fallback
    }
  }

  private abortSSE(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
