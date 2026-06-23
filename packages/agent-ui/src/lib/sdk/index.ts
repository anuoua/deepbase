import { createOpencodeClient } from "@opencode-ai/sdk/client";

const client = createOpencodeClient({
  baseUrl: "http://localhost:44093",
});

const ss = await client.event.subscribe({});

for await (const e of ss.stream) {
  if (e.type === "session.created") {
    console.log(e.properties);
  }
}
