import type { StreamEvent } from "./types/index";

export type StreamEventCallback = (event: StreamEvent) => void;

export function connectEventStream(
  onEvent: StreamEventCallback,
  directory?: string,
  workspace?: string,
): AbortController {
  const controller = new AbortController();

  let params = "";
  if (directory || workspace) {
    const p = new URLSearchParams();
    if (directory) p.set("directory", directory);
    if (workspace) p.set("workspace", workspace);
    params = "?" + p.toString();
  }

  (async () => {
    try {
      const response = await fetch(`/opencode-api/event${params}`, {
        signal: controller.signal,
        headers: { Accept: "text/event-stream" },
      });

      if (!response.ok) {
        console.error("SSE connection failed:", response.status);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        console.error("SSE: no response body");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const event = parseSSEEvent(part);
          if (event) onEvent(event);
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("SSE error:", err);
    }
  })();

  return controller;
}

function parseSSEEvent(chunk: string): StreamEvent | null {
  const lines = chunk.split("\n");
  let data = "";

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      data += line.slice(6);
    }
  }

  if (!data) return null;

  try {
    const parsed = JSON.parse(data);
    return parsed as StreamEvent;
  } catch {
    return null;
  }
}
