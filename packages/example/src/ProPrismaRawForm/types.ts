import { isPlaceholderValue, PLACEHOLDER_SENTINEL } from "../ProPrismaPlaceholder/utils";

export type RawMethod = "findRaw" | "aggregateRaw";

export interface RawFormValue {
  method: RawMethod;
  filter: unknown;
  pipeline: unknown;
  options: unknown;
}

export function emptyRawFormValue(method: RawMethod = "findRaw"): RawFormValue {
  return {
    method,
    filter: "{}",
    pipeline: "[]",
    options: "{}",
  };
}

function processField(field: unknown): unknown {
  if (isPlaceholderValue(field)) return PLACEHOLDER_SENTINEL;
  if (typeof field !== "string") return field;
  try { return JSON.parse(field); }
  catch { return field; }
}

export function toPrismaRawForm(value: RawFormValue): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (value.method === "findRaw") {
    result.filter = processField(value.filter);
  } else {
    result.pipeline = processField(value.pipeline);
  }

  const options = processField(value.options);
  if (typeof options === "object" && options !== null && !Array.isArray(options) && !isPlaceholderValue(options)) {
    if (Object.keys(options).length > 0) {
      result.options = options;
    }
  }

  return result;
}
