import type { PluginOption } from "vite";
import { app } from "./app.ts";

export const agent = (): any => {
  return {
    name: "agent-server",

    async configureServer(server) {
      server.middlewares.use("/__agent", app);
    },

    transformIndexHtml(html) {
      return html.replace(
        "</head>",
        `<script type="module">
          console.warn("Agent-Vite-Plugin injected")
        </script></head>`,
      );
    },
  } satisfies PluginOption;
};
