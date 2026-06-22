import { createOpencode } from "@opencode-ai/sdk";
import { logger } from "./logger.ts";

export const { client: opencode, server } = await createOpencode({
  hostname: "127.0.0.1",
  config: {
    model: "leapmotor_aiworks/glm-5",
    provider: {
      leapmotor_aiworks: {
        npm: "@ai-sdk/openai-compatible",
        name: "leapmotor-aiworks",
        options: {
          baseURL: "https://aimodels.leapmotor.com/v1",
          apiKey: "sk-5ZFcQE1Q1DIwDZpHx86SmRvRJflz3DLHeEmhKJbzzoUIWoPN",
        },
        models: {
          "qwen3.5-plus": {
            name: "qwen3.5-plus",
          },
          "glm-5": {
            name: "glm-5",
          },
          "kimi-k2.5": {
            name: "kimi-k2.5",
          },
        },
      },
    },
  },
});

logger.info(`Opencode Server running at ${server.url}`);
