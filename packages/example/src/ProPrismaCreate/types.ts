import type { CreateFieldConfig } from "../ProPrismaCreateData/types";
import type { SelectFieldConfig, SelectValue } from "../ProPrismaSelect/types";
import type { IncludeFieldConfig, IncludeValue } from "../ProPrismaInclude/types";
import type { OmitFieldConfig, OmitValue } from "../ProPrismaOmit/types";
import { toPrismaCreateData } from "../ProPrismaCreateData/types";
import { toPrismaSelect } from "../ProPrismaSelect/types";
import { toPrismaInclude } from "../ProPrismaInclude/types";
import { toPrismaOmit } from "../ProPrismaOmit/types";

export type QueryShape = "none" | "select" | "include" | "omit";

export interface CreateMethodValue {
  data: Record<string, unknown>;
  queryShape: QueryShape;
  select: SelectValue;
  include: IncludeValue;
  omit: OmitValue;
}

export interface CreateMethodFieldConfig {
  dataFields: CreateFieldConfig[];
  selectFields: SelectFieldConfig[];
  includeFields: IncludeFieldConfig[];
  omitFields: OmitFieldConfig[];
}

export function toPrismaCreateMethod(
  value: CreateMethodValue,
  fields: CreateMethodFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const data = toPrismaCreateData(value.data, fields.dataFields);
  if (Object.keys(data).length > 0) {
    result.data = data;
  }

  if (value.queryShape === "select") {
    const select = toPrismaSelect(value.select, fields.selectFields);
    if (Object.keys(select).length > 0) {
      result.select = select;
    }
  } else if (value.queryShape === "include") {
    const include = toPrismaInclude(value.include, fields.includeFields);
    if (Object.keys(include).length > 0) {
      result.include = include;
    }
  } else if (value.queryShape === "omit") {
    const omit = toPrismaOmit(value.omit);
    if (Object.keys(omit).length > 0) {
      result.omit = omit;
    }
  }

  return result;
}

export function emptyCreateMethodValue(): CreateMethodValue {
  return {
    data: {},
    queryShape: "none",
    select: {},
    include: {},
    omit: {},
  };
}
