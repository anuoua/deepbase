export interface BatchDataValue {
  rows: Record<string, unknown>[];
}

export interface BatchDataFieldConfig {
  fields: { name: string; label: string; type: "string" | "number" | "boolean" | "enum"; enums?: { label: string; value: string }[] }[];
}

export function emptyBatchDataValue(): BatchDataValue {
  return { rows: [] };
}

import { toPlaceholderAwareValue } from "../ProPrismaPlaceholder/utils";

export function toPrismaBatchData(value: BatchDataValue): Record<string, unknown>[] {
  return value.rows.map((row) => {
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(row)) {
      if (val !== null && val !== undefined && val !== "") {
        cleaned[key] = toPlaceholderAwareValue(val);
      }
    }
    return cleaned;
  });
}
