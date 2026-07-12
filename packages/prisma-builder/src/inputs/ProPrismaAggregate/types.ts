export interface AggregateFieldConfig {
  name: string;
  label: string;
  type: "string" | "number" | "boolean" | "date" | "enum" | "json";
}

export type AggregateOp = "_sum" | "_avg" | "_min" | "_max" | "_count";

// value[fieldName] = array of selected ops for that field
export type AggregateValue = Record<string, AggregateOp[]>;

export function toPrismaAggregate(
  value: AggregateValue,
  fields: AggregateFieldConfig[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [fieldName, ops] of Object.entries(value)) {
    if (!Array.isArray(ops) || ops.length === 0) continue;
    const fieldConfig = fields.find((f) => f.name === fieldName);
    if (!fieldConfig) continue;

    for (const op of ops) {
      if (!result[op]) {
        result[op] = {};
      }
      (result[op] as Record<string, boolean>)[fieldName] = true;
    }
  }

  return result;
}

export function emptyAggregateValue(): AggregateValue {
  return {};
}
