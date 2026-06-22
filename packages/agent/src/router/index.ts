import { router } from "../lib/trpc.ts";
import { utils } from "./utils/index.ts";

export const appRouter = router({
  utils,
});

export type AppRouter = typeof appRouter;
