import { pino as _pino } from "pino";

export const logger = _pino({
  transport: {
    target: "pino-pretty",
  },
});
