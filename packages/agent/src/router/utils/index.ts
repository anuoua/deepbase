import { router } from "../../lib/trpc.ts";
import { getConfig } from "./methods/getConfig.ts";

export const utils = router({
  getConfig,
});
