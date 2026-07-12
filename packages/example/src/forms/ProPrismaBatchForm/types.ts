import type { CreateFieldConfig } from "../../inputs/ProPrismaCreateData/types";
import type { WhereGroup, FieldConfig as WhereFieldConfig } from "../../inputs/ProPrismaWhere/types";
import type { SelectFieldConfig, SelectValue } from "../../inputs/ProPrismaSelect/types";
import { toPrismaWhere } from "../../inputs/ProPrismaWhere/types";
import { toPrismaSelect } from "../../inputs/ProPrismaSelect/types";

export type BatchMethod = "createMany" | "createManyAndReturn" | "updateMany" | "updateManyAndReturn" | "deleteMany";

export interface BatchFormValue {
  method: BatchMethod;
  rows: Record<string, unknown>[];
  where: WhereGroup;
  select: SelectValue;
  skipDuplicates: boolean;
}

export interface BatchFormFieldConfig {
  createFields: CreateFieldConfig[];
  whereFields: WhereFieldConfig[];
  selectFields: SelectFieldConfig[];
}

export function emptyBatchFormValue(method: BatchMethod = "createMany"): BatchFormValue {
  return {
    method,
    rows: [],
    where: { type: "AND", children: [] },
    select: {},
    skipDuplicates: false,
  };
}

export function toPrismaBatchForm(
  value: BatchFormValue,
  fields: BatchFormFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (value.method === "createMany" || value.method === "createManyAndReturn") {
    result.data = value.rows.map((row) => {
      const cleaned: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(row)) {
        if (val !== null && val !== undefined && val !== "") {
          cleaned[key] = val;
        }
      }
      return cleaned;
    });
    if (value.skipDuplicates) {
      result.skipDuplicates = true;
    }
    if (value.method === "createManyAndReturn") {
      const select = toPrismaSelect(value.select, fields.selectFields);
      if (Object.keys(select).length > 0) {
        result.select = select;
      }
    }
  } else {
    const where = toPrismaWhere(value.where, fields.whereFields);
    if (Object.keys(where).length > 0) {
      result.where = where;
    }
    if (value.method !== "deleteMany") {
      result.data = value.rows.map((row) => {
        const cleaned: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(row)) {
          if (val !== null && val !== undefined && val !== "") {
            cleaned[key] = val;
          }
        }
        return cleaned;
      });
    }
    if (value.method === "updateManyAndReturn") {
      const select = toPrismaSelect(value.select, fields.selectFields);
      if (Object.keys(select).length > 0) {
        result.select = select;
      }
    }
  }

  return result;
}
