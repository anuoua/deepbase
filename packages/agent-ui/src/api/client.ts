import type {
  CreateSessionInput,
  MessageWithParts,
  OpenCodeSession,
  ProvidersResponse,
  SendMessageInput,
} from "./types/index";

const BASE = "/opencode-api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenCode API error ${res.status}: ${body}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [
    string,
    string,
  ][];
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(entries).toString();
}

export const opencode = {
  createSession(
    input: CreateSessionInput,
    directory?: string,
    workspace?: string,
  ) {
    const qs = buildQuery({ directory, workspace });
    return request<OpenCodeSession>(`/session${qs}`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getSession(sessionID: string) {
    return request<OpenCodeSession>(`/session/${sessionID}`);
  },

  listSessions(params?: {
    directory?: string;
    workspace?: string;
    search?: string;
    limit?: number;
    start?: number;
    archived?: string;
  }) {
    const qs = buildQuery(params ?? {});
    return request<OpenCodeSession[]>(`/session${qs}`);
  },

  deleteSession(sessionID: string, directory?: string, workspace?: string) {
    const qs = buildQuery({ directory, workspace });
    return request<boolean>(`/session/${sessionID}${qs}`, {
      method: "DELETE",
    });
  },

  updateSession(
    sessionID: string,
    body: { title?: string; metadata?: Record<string, unknown> },
    directory?: string,
    workspace?: string,
  ) {
    const qs = buildQuery({ directory, workspace });
    return request<OpenCodeSession>(`/session/${sessionID}${qs}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  sendMessage(
    sessionID: string,
    input: SendMessageInput,
    directory?: string,
    workspace?: string,
  ) {
    const qs = buildQuery({ directory, workspace });
    return request<MessageWithParts>(`/session/${sessionID}/message${qs}`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  sendMessageAsync(
    sessionID: string,
    input: SendMessageInput,
    directory?: string,
    workspace?: string,
  ) {
    const qs = buildQuery({ directory, workspace });
    return request<void>(`/session/${sessionID}/prompt_async${qs}`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  getMessages(sessionID: string, params?: { limit?: number; before?: string }) {
    const qs = buildQuery(params ?? {});
    return request<MessageWithParts[]>(`/session/${sessionID}/message${qs}`);
  },

  getChildSessions(sessionID: string, directory?: string, workspace?: string) {
    const qs = buildQuery({ directory, workspace });
    return request<OpenCodeSession[]>(`/session/${sessionID}/children${qs}`);
  },

  getProviders(directory?: string, workspace?: string) {
    const qs = buildQuery({ directory, workspace });
    return request<ProvidersResponse>(`/config/providers${qs}`);
  },

  getConfig(directory?: string, workspace?: string) {
    const qs = buildQuery({ directory, workspace });
    return request<Record<string, unknown>>(`/config${qs}`);
  },

  updateConfig(
    body: Record<string, unknown>,
    directory?: string,
    workspace?: string,
  ) {
    const qs = buildQuery({ directory, workspace });
    return request<Record<string, unknown>>(`/config${qs}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  getGlobalConfig() {
    return request<Record<string, unknown>>("/global/config");
  },

  updateGlobalConfig(body: Record<string, unknown>) {
    return request<Record<string, unknown>>("/global/config", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  getHealth() {
    return request<{ healthy: true; version: string }>("/global/health");
  },

  abortSession(sessionID: string, directory?: string, workspace?: string) {
    const qs = buildQuery({ directory, workspace });
    return request<boolean>(`/session/${sessionID}/abort${qs}`, {
      method: "POST",
    });
  },

  revertMessage(
    sessionID: string,
    messageID: string,
    directory?: string,
    workspace?: string,
  ) {
    const qs = buildQuery({ directory, workspace });
    return request<OpenCodeSession>(`/session/${sessionID}/revert${qs}`, {
      method: "POST",
      body: JSON.stringify({ messageID }),
    });
  },

  unrevertMessages(sessionID: string, directory?: string, workspace?: string) {
    const qs = buildQuery({ directory, workspace });
    return request<OpenCodeSession>(`/session/${sessionID}/unrevert${qs}`, {
      method: "POST",
    });
  },
};
