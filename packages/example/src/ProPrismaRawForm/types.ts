export type RawMethod = "findRaw" | "aggregateRaw";

export interface RawFormValue {
  method: RawMethod;
  filter: string;
  pipeline: string;
  options: string;
}

export function emptyRawFormValue(method: RawMethod = "findRaw"): RawFormValue {
  return {
    method,
    filter: "{}",
    pipeline: "[]",
    options: "{}",
  };
}

export function toPrismaRawForm(value: RawFormValue): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (value.method === "findRaw") {
    try {
      const filter = JSON.parse(value.filter);
      result.filter = filter;
    } catch {
      result.filter = value.filter;
    }
  } else {
    try {
      const pipeline = JSON.parse(value.pipeline);
      result.pipeline = pipeline;
    } catch {
      result.pipeline = value.pipeline;
    }
  }

  try {
    const options = JSON.parse(value.options);
    if (Object.keys(options).length > 0) {
      result.options = options;
    }
  } catch {
    // ignore malformed options
  }

  return result;
}
