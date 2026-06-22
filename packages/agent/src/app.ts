import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createContext } from "./lib/trpc.ts";
import { appRouter, type AppRouter } from "./router/index.ts";
import { loggerMiddleware } from "./middlewares/pino.ts";
// import { middlewares } from "@deepbase/agent-ui/vite.middleware.ts";

import "./lib/opencode.ts";

const app: express.Express = express();

// logger
app.use(loggerMiddleware);

// agent ui
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use("/", express.static(resolve(__dirname, "../../agent-ui/dist")));
// app.use("/", middlewares);

// trpc api
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

export { app, appRouter, type AppRouter };
