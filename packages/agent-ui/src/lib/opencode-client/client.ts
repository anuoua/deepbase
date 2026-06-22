import type { MessageWithParts, OpenCodeSession, StreamEvent, ToolPart } from "../../api/types/index";
import { opencode } from "../../api/client";
import { connectEventStream } from "../../api/sse";
import { EventEmitter } from "./event-emitter";
import { nextId, type BubbleItem, type ClientEvents, type SessionItem } from "./types";

interface StreamState {
  thinking: string;
  answer: string;
  toolCalls: ToolPart[];
  partTypes: Record<string, string>;
  assistantMsgIDs: string[];
  currentMessageID?: string;
}

function partsToBubbleItems(msgs: MessageWithParts[]): BubbleItem[] {
  const items: BubbleItem[] = [];
  for (const msg of msgs) {
    if (msg.info.role === "user") {
      const textPart = msg.parts.find((p) => p.type === "text");
      items.push({
        key: nextId(),
        role: "user",
        content: (textPart as { text?: string } | undefined)?.text ?? "",
        loading: false,
        streaming: false,
        time: msg.info.time.created,
        messageID: msg.info.id,
      });
    } else if (msg.info.role === "assistant") {
      const textPart = msg.parts.find((p) => p.type === "text");
      const reasoningPart = msg.parts.find((p) => p.type === "reasoning");
      const toolParts = msg.parts.filter((p) => p.type === "tool");
      const hasContent = textPart || reasoningPart || toolParts.length > 0;
      if (!hasContent) continue;
      items.push({
        key: nextId(),
        role: "assistant",
        content: {
          role: "assistant",
          content: (textPart as { text?: string } | undefined)?.text ?? "",
          thinking: (reasoningPart as { text?: string } | undefined)?.text ?? "",
          toolCalls: toolParts as ToolPart[],
          phase: "answering",
        },
        loading: false,
        streaming: false,
        time: msg.info.time.created,
        messageID: msg.info.id,
      });
    }
  }
  return items;
}

export class OpencodeClient extends EventEmitter<ClientEvents> {
  private _sessionID: string | undefined;
  private _messages: BubbleItem[] = [];
  private _requesting = false;
  private _originalFullLength = 0;
  private sseController: AbortController | null = null;
  private streamingState = new Map<string, StreamState>();
  private bubbleKeyMap = new Map<string, number | string>();
  private userKeyMap = new Map<string, number | string>();
  private _childSessions: OpenCodeSession[] = [];
  private _sessions: SessionItem[] = [];

  static create(): OpencodeClient {
    return new OpencodeClient();
  }

  get sessionID(): string | undefined {
    return this._sessionID;
  }

  get sessions(): SessionItem[] {
    return this._sessions;
  }

  get messages(): BubbleItem[] {
    return this._messages;
  }

  get requesting(): boolean {
    return this._requesting;
  }

  get hiddenCount(): number {
    return this._originalFullLength - this._messages.length;
  }

  get childSessions(): OpenCodeSession[] {
    return this._childSessions;
  }

  // Session list management
  async refreshSessions(): Promise<void> {
    try {
      const sessions = await opencode.listSessions({ limit: 50 });
      this._sessions = sessions
        .filter((s) => !s.parentID)
        .map((s) => ({ key: s.id, label: s.title || s.id.slice(0, 8) }));
      this.emit("sessionsChanged", this._sessions);
    } catch (err) {
      this.emit("error", err instanceof Error ? err : new Error(String(err)));
    }
  }

  async createSession(title: string): Promise<string> {
    const session = await opencode.createSession({ title });
    if (!session.parentID) {
      this._sessions = [
        { key: session.id, label: session.title || title },
        ...this._sessions,
      ];
      this.emit("sessionsChanged", this._sessions);
    }
    return session.id;
  }

  async deleteSession(sessionID: string): Promise<void> {
    await opencode.deleteSession(sessionID);
    this._sessions = this._sessions.filter((s) => s.key !== sessionID);
    this.emit("sessionsChanged", this._sessions);
    if (this._sessionID === sessionID) {
      this.disconnectSSE();
      this._sessionID = undefined;
      this._messages = [];
      this._originalFullLength = 0;
      this._childSessions = [];
      this.emit("sessionChanged", undefined);
      this.emit("messagesChanged", []);
      this.emit("childSessionsChanged", []);
    }
  }

  async renameSession(sessionID: string, title: string): Promise<void> {
    await opencode.updateSession(sessionID, { title });
    this._sessions = this._sessions.map((s) =>
      s.key === sessionID ? { ...s, label: title } : s,
    );
    this.emit("sessionsChanged", this._sessions);
  }

  async abortSession(): Promise<void> {
    if (!this._sessionID) return;
    await opencode.abortSession(this._sessionID);
    this._requesting = false;
    this.emit("requesting", false);
  }

  async switchSession(sessionID: string): Promise<void> {
    this.disconnectSSE();
    this._sessionID = sessionID;
    this._originalFullLength = 0;
    this._childSessions = [];
    this.emit("sessionChanged", sessionID);

    try {
      const [session, msgs, children] = await Promise.all([
        opencode.getSession(sessionID),
        opencode.getMessages(sessionID),
        opencode.getChildSessions(sessionID),
      ]);
      this._childSessions = children;
      this.emit("childSessionsChanged", children);
      const items = partsToBubbleItems(msgs);
      const revert = (session as unknown as Record<string, unknown>).revert as
        { messageID: string } | undefined;
      if (revert?.messageID) {
        const revertIdx = items.findIndex((i) => i.messageID === revert.messageID);
        if (revertIdx >= 0) {
          this._originalFullLength = items.length;
          this._messages = items.slice(0, revertIdx);
        } else {
          this._messages = items;
        }
      } else {
        this._messages = items;
      }
      this.emit("messagesChanged", this.messages);

      this.connectSSE();
    } catch (err) {
      this.emit("error", err instanceof Error ? err : new Error(String(err)));
    }
  }

  async sendMessage(text: string): Promise<void> {
    if (this._requesting || !this._sessionID) return;

    this._requesting = true;
    this._originalFullLength = 0;
    this.emit("requesting", true);

    const userKey = nextId();
    const assistantKey = nextId();
    const now = Date.now();

    this._messages = [
      ...this._messages,
      {
        key: userKey,
        role: "user",
        content: text,
        loading: false,
        streaming: false,
        time: now,
      },
      {
        key: assistantKey,
        role: "assistant",
        content: {
          role: "assistant",
          content: "",
          thinking: "",
          phase: "thinking",
        },
        loading: true,
        streaming: false,
        time: now + 1,
} as BubbleItem,
                ];
              this.emit("messagesChanged", this.messages);

    this.userKeyMap.set(this._sessionID, userKey);
    this.bubbleKeyMap.set(this._sessionID, assistantKey);
    this.streamingState.set(this._sessionID, {
      thinking: "",
      answer: "",
      toolCalls: [],
      partTypes: {},
      assistantMsgIDs: [],
    });

    try {
      await opencode.sendMessageAsync(this._sessionID, {
        parts: [{ type: "text", text }],
      });
    } catch (err) {
      this._messages = this._messages.map((b) =>
        b.key === assistantKey
          ? {
              ...b,
              content: {
                role: "assistant",
                content: `请求失败: ${err instanceof Error ? err.message : String(err)}`,
                phase: "answering" as const,
              },
              loading: false,
              streaming: false,
            }
          : b,
      );
      this.emit("messagesChanged", this.messages);
      this._requesting = false;
      this.emit("requesting", false);
    }
  }

  async revertMessage(messageID: string): Promise<string> {
    if (!this._sessionID) return "";
    try {
      await opencode.revertMessage(this._sessionID, messageID);
      const msgs = await opencode.getMessages(this._sessionID);
      const items = partsToBubbleItems(msgs);
      const revertIdx = items.findIndex((i) => i.messageID === messageID);
      if (revertIdx >= 0) {
        const reverted = items[revertIdx];
        const text = typeof reverted?.content === "string" ? reverted.content : "";
        this._originalFullLength = items.length;
        this._messages = items.slice(0, revertIdx);
        this.emit("messagesChanged", this.messages);
        return text;
      }
    } catch (err) {
      this.emit("error", err instanceof Error ? err : new Error(String(err)));
    }
    return "";
  }

  async unrevertMessages(): Promise<void> {
    if (!this._sessionID) return;
    try {
      await opencode.unrevertMessages(this._sessionID);
      this._originalFullLength = 0;
      const msgs = await opencode.getMessages(this._sessionID);
      this._messages = partsToBubbleItems(msgs);
      this.emit("messagesChanged", this.messages);
    } catch (err) {
      this.emit("error", err instanceof Error ? err : new Error(String(err)));
    }
  }

  getSession(sessionID: string): Promise<OpenCodeSession> {
    return opencode.getSession(sessionID);
  }

  getMessages(sessionID: string): Promise<MessageWithParts[]> {
    return opencode.getMessages(sessionID);
  }

  private setAssistantContent(
    bubbleKey: number | string,
    content: Partial<{
      content: string;
      thinking: string;
      toolCalls: ToolPart[];
      phase: "thinking" | "answering";
      loading: boolean;
      streaming: boolean;
    }>,
  ) {
    this._messages = this._messages.map((b) =>
      b.key === bubbleKey
        ? {
            ...b,
            content: {
              role: "assistant",
              content: "",
              phase: "thinking" as const,
              ...(typeof b.content === "object" ? (b.content as unknown as Record<string, unknown>) : {}),
              ...content,
            },
            loading: content.loading ?? b.loading,
            streaming: content.streaming ?? false,
          }
        : b,
    );
    this.emit("messagesChanged", this.messages);
  }

  private handleSSEEvent(event: StreamEvent): void {
    if (event.type === "session.created") {
      const rawProps = event.properties as Record<string, unknown>;
      const info = rawProps.info as OpenCodeSession | undefined;
      if (info?.parentID && info.parentID === this._sessionID) {
        if (!this._childSessions.find((s) => s.id === info.id)) {
          this._childSessions = [...this._childSessions, info];
          this.emit("childSessionsChanged", this._childSessions);
        }
      }
      return;
    }

    const props = event.properties as Record<string, unknown>;
    const sessionID = props.sessionID as string | undefined;
    if (!sessionID || sessionID !== this._sessionID) return;
    const bubbleKey = this.bubbleKeyMap.get(sessionID);
    if (bubbleKey === undefined) return;

    const state = this.streamingState.get(sessionID);
    if (!state) return;

    const noRender = new Set([
      "server.connected",
      "server.heartbeat",
      "session.status",
      "session.updated",
      "session.diff",
      "message.updated",
      "session.next.prompted",
    ]);
    const doneEvents = new Set(["session.idle"]);

    let isStepFinish = false;

    switch (event.type) {
      case "session.next.prompted": {
        const userKey = this.userKeyMap.get(sessionID);
        if (userKey !== undefined) {
          this._messages = this._messages.map((b) =>
            b.key === userKey
              ? { ...b, messageID: props.messageID as string }
              : b,
          );
          this.emit("messagesChanged", this.messages);
        }
        break;
      }
      case "message.updated": {
        const info = props.info as { role?: string; id?: string } | undefined;
        if (info?.role === "user" && info?.id) {
          const userKeyMU = this.userKeyMap.get(sessionID);
          if (userKeyMU !== undefined) {
            const prev = this._messages.find((b) => b.key === userKeyMU);
            if (prev && !prev.messageID) {
              this._messages = this._messages.map((b) =>
                b.key === userKeyMU
                  ? { ...b, messageID: info.id } as BubbleItem
                  : b,
              );
              this.emit("messagesChanged", this.messages);
            }
          }
          break;
        }
        if (info?.role === "assistant" && info?.id) {
          if (!state.assistantMsgIDs.includes(info.id)) {
            state.assistantMsgIDs.push(info.id);
            state.currentMessageID = info.id;
            const isFirstStep = state.assistantMsgIDs.length === 1;

            if (isFirstStep) {
              this._messages = this._messages.map((b) =>
                b.key === bubbleKey
                  ? { ...b, ...(info?.id ? { messageID: info.id } : {}) } as BubbleItem
                  : b,
              );
              this.emit("messagesChanged", this.messages);
            } else {
              const oldBubbleKey = this.bubbleKeyMap.get(sessionID);
              if (oldBubbleKey !== undefined) {
                this.setAssistantContent(oldBubbleKey, { streaming: false });
              }
              const newKey = nextId();
              this.bubbleKeyMap.set(sessionID, newKey);
              state.thinking = "";
              state.answer = "";
              state.toolCalls = [];
              state.partTypes = {};
              this._messages = [
                ...this._messages,
                {
                  key: newKey,
                  role: "assistant",
                  content: {
                    role: "assistant",
                    content: "",
                    thinking: "",
                    phase: "thinking",
                  },
                  loading: false,
                  streaming: false,
                  time: Date.now(),
                  ...(info?.id ? { messageID: info.id } : {}),
                },
              ];
              this.emit("messagesChanged", this.messages);
            }
          }
        }
        break;
      }
      case "message.part.updated": {
        const part = props.part as {
          type: string; id: string; text?: string; messageID?: string;
          callID?: string; tool?: string;
          state?: { status: string; output?: string; [key: string]: unknown };
          [key: string]: unknown;
        };
        if (part.type === "reasoning") {
          state.partTypes[part.id] = "reasoning";
          state.thinking = part.text ?? "";
        } else if (part.type === "text") {
          state.partTypes[part.id] = "text";
          if (part.messageID && state.assistantMsgIDs.includes(part.messageID)) {
            state.answer = part.text ?? "";
          }
        } else if (part.type === "tool") {
          const existing = state.toolCalls.find(
            (tc) => tc.callID === part.callID,
          );
          if (existing) {
            if (part.id) existing.id = part.id;
            existing.sessionID = sessionID;
            if (part.messageID) existing.messageID = part.messageID;
            if (part.state?.status === "running") {
              existing.state = { ...existing.state, ...part.state, status: "running" as const };
            } else if (part.state?.status === "completed") {
              existing.state = { ...existing.state, ...part.state, status: "completed" as const, result: part.state.output ?? "" };
            }
          } else if (part.state?.status === "pending") {
            state.toolCalls.push(part as unknown as ToolPart);
          }
        } else if (part.type === "step-finish") {
          isStepFinish = true;
        }
        break;
      }
      case "message.part.delta": {
        const dp = props as { partID: string; field: string; delta: string };
        if (dp.field === "reasoning") {
          state.thinking += dp.delta;
        } else if (dp.field === "text") {
          const partType = state.partTypes[dp.partID];
          if (partType === "reasoning") {
            state.thinking += dp.delta;
          } else if (partType === "text") {
            state.answer += dp.delta;
          }
        }
        break;
      }
      case "session.next.tool.called": {
        const tp = props as { callID: string; tool: string; input: unknown; sessionID: string; assistantMessageID: string };
        if (!state.toolCalls.find((tc) => tc.callID === tp.callID)) {
          state.toolCalls.push({
            type: "tool" as const,
            callID: tp.callID,
            tool: tp.tool,
            state: { status: "pending" as const, input: tp.input },
            sessionID: tp.sessionID,
            messageID: tp.assistantMessageID,
          } as ToolPart);
        }
        break;
      }
      case "session.next.tool.success": {
        const sp = props as { callID: string; content?: { type: string; text: string }[] };
        const tc = state.toolCalls.find((t) => t.callID === sp.callID);
        if (tc) {
          const textContent = sp.content?.find((c) => c.type === "text");
          tc.state = { ...tc.state, status: "completed" as const, result: textContent?.text ?? "" };
        }
        break;
      }
      case "session.next.tool.failed": {
        const fp = props as { callID: string; error: unknown };
        const tcf = state.toolCalls.find((t) => t.callID === fp.callID);
        if (tcf) {
          tcf.state = { ...tcf.state, status: "error" as const, error: `Error: ${JSON.stringify(fp.error)}` };
        }
        break;
      }
      case "session.next.step.ended":
      case "session.idle":
        this._requesting = false;
        this.emit("requesting", false);
        if (event.type === "session.idle") {
          this.reloadSession();
        }
        break;
      default:
        break;
    }

    this.streamingState.set(sessionID, state);
    if (noRender.has(event.type)) return;

    const hasContent = state.thinking || state.answer || state.toolCalls.length > 0;
    const toolCalls =
      state.toolCalls.length > 0
        ? state.toolCalls.map((tc) => ({ ...tc, state: { ...tc.state } }))
        : undefined;
    this.setAssistantContent(bubbleKey, {
      ...(state.thinking ? { thinking: state.thinking } : {}),
      ...(state.answer ? { content: state.answer } : {}),
      ...(toolCalls ? { toolCalls } : {}),
      ...(hasContent ? { loading: false } : {}),
      phase: state.answer ? "answering" : isStepFinish ? "answering" : "thinking",
      streaming: isStepFinish
        ? false
        : !doneEvents.has(event.type),
    });
  }

  private async reloadSession(): Promise<void> {
    if (!this._sessionID) return;
    try {
      const session = await opencode.getSession(this._sessionID);
      const revert = (session as unknown as Record<string, unknown>).revert as
        { messageID: string } | undefined;
      if (!revert?.messageID) {
        this._originalFullLength = 0;
      }
    } catch {
      // silent
    }
  }

  private connectSSE(): void {
    this.disconnectSSE();
    const controller = connectEventStream((event: StreamEvent) => {
      this.handleSSEEvent(event);
    });
    this.sseController = controller;
  }

  private disconnectSSE(): void {
    if (this.sseController) {
      this.sseController.abort();
      this.sseController = null;
    }
    this.streamingState.clear();
  }

  destroy(): void {
    this.disconnectSSE();
    this.removeAll();
    this._messages = [];
    this._originalFullLength = 0;
    this.bubbleKeyMap.clear();
    this.userKeyMap.clear();
    this._childSessions = [];
  }
}