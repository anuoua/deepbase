import type { Event, OpencodeClient, Provider, Session as SessionInfo } from "@opencode-ai/sdk";
import { createOpencodeClient } from "@opencode-ai/sdk";
import { Session } from "./session";
import { OpencodeError } from "./types";
import type {
  ManagerSnapshot,
  OpencodeConfig,
  SessionRef,
} from "./types";

type Listener = () => void;

function toSessionRef(s: SessionInfo): SessionRef {
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

interface ManagerState {
  sessions: SessionRef[];
  activeID: string | undefined;
  providers: Provider[];
  providersLoading: boolean;
  error: OpencodeError | undefined;
}

const initialState: ManagerState = {
  sessions: [],
  activeID: undefined,
  providers: [],
  providersLoading: false,
  error: undefined,
};

export class SessionManager {
  private readonly sdk: OpencodeClient;
  private state: ManagerState = { ...initialState };
  private listeners = new Set<Listener>();
  private registry = new Map<string, Session>();
  private snapshotCache: ManagerSnapshot | null = null;
  private abortController: AbortController | null = null;

  constructor(config: OpencodeConfig = {}) {
    this.sdk = createOpencodeClient({
      baseUrl: config.baseUrl ?? "/opencode-api",
      ...(config.directory ? { directory: config.directory } : {}),
    });
  }

  static create(config?: OpencodeConfig): SessionManager {
    return new SessionManager(config ?? {});
  }

  get sdkClient(): OpencodeClient {
    return this.sdk;
  }

  getSnapshot(): ManagerSnapshot {
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

  private buildSnapshot(): ManagerSnapshot {
    return {
      sessions: this.state.sessions,
      ...(this.state.activeID ? { activeID: this.state.activeID } : {}),
      providers: this.state.providers,
      providersLoading: this.state.providersLoading,
      ...(this.state.error ? { error: this.state.error } : {}),
    };
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

  get(sessionID: string): Session {
    let session = this.registry.get(sessionID);
    if (!session) {
      session = new Session(sessionID, this.sdk);
      this.registry.set(sessionID, session);
      void session.load();
    }
    return session;
  }

  getActive(): Session | null {
    if (!this.state.activeID) return null;
    return this.get(this.state.activeID);
  }

  async refresh(): Promise<void> {
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

  async create(opts?: { title?: string }): Promise<string | undefined> {
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
      return session.id;
    } catch (err) {
      this.setError(err);
      return undefined;
    }
  }

  async delete(sessionID: string): Promise<void> {
    try {
      const r = await this.sdk.session.delete({ path: { id: sessionID } });
      if (r.error) throw r.error;
      this.state = {
        ...this.state,
        sessions: this.state.sessions.filter((s) => s.id !== sessionID),
      };
      const session = this.registry.get(sessionID);
      if (session) {
        session.destroy();
        this.registry.delete(sessionID);
      }
      if (this.state.activeID === sessionID) {
        this.state = { ...this.state, activeID: undefined };
      }
      this.commit();
    } catch (err) {
      this.setError(err);
    }
  }

  async rename(sessionID: string, title: string): Promise<void> {
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

  async setActive(sessionID: string): Promise<void> {
    this.state = { ...this.state, activeID: sessionID };
    this.commit();
    this.get(sessionID);
    this.ensurePump();
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

  private ensurePump(): void {
    if (this.abortController) return;
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
      const info = (event.properties as { info: SessionInfo }).info;
      if (info.parentID) {
        const parent = this.registry.get(info.parentID);
        parent?.handleChildCreated(info);
      }
      return;
    }

    if (event.type === "session.deleted") {
      const info = (event.properties as { info: SessionInfo }).info;
      this.state = {
        ...this.state,
        sessions: this.state.sessions.filter((s) => s.id !== info.id),
      };
      const session = this.registry.get(info.id);
      if (session) {
        session.destroy();
        this.registry.delete(info.id);
      }
      if (this.state.activeID === info.id) {
        this.state = { ...this.state, activeID: undefined };
      }
      this.commit();
      return;
    }

    const sid = extractSessionID(event);
    if (!sid) return;
    const session = this.registry.get(sid);
    session?.handleEvent(event);
  }

  destroy(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    for (const session of this.registry.values()) session.destroy();
    this.registry.clear();
    this.listeners.clear();
    this.state = { ...initialState };
    this.snapshotCache = null;
  }
}
