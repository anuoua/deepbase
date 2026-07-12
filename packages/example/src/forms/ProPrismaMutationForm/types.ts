import type { WhereUniqueValue, UniqueFieldConfig } from "../../inputs/ProPrismaWhereUnique/types";
import type { SelectFieldConfig, SelectValue } from "../../inputs/ProPrismaSelect/types";
import type { IncludeFieldConfig, IncludeValue } from "../../inputs/ProPrismaInclude/types";
import type { OmitFieldConfig, OmitValue } from "../../inputs/ProPrismaOmit/types";
import type { CreateFieldConfig } from "../../inputs/ProPrismaCreateData/types";
import { toPrismaWhereUnique } from "../../inputs/ProPrismaWhereUnique/types";
import { toPrismaUpdateData } from "../../inputs/ProPrismaUpdateData/types";
import { toPrismaSelect } from "../../inputs/ProPrismaSelect/types";
import { toPrismaInclude } from "../../inputs/ProPrismaInclude/types";
import { toPrismaOmit } from "../../inputs/ProPrismaOmit/types";

export type MutationMethod = "update" | "delete";
export type QueryShape = "none" | "select" | "include" | "omit";

export interface MutationFormValue {
  method: MutationMethod;
  whereUnique: WhereUniqueValue;
  data: Record<string, unknown>;
  queryShape: QueryShape;
  select: SelectValue;
  include: IncludeValue;
  omit: OmitValue;
}

export interface MutationFormFieldConfig {
  uniqueFields: UniqueFieldConfig[];
  dataFields: CreateFieldConfig[];
  selectFields: SelectFieldConfig[];
  includeFields: IncludeFieldConfig[];
  omitFields: OmitFieldConfig[];
}

export function emptyMutationFormValue(method: MutationMethod = "update"): MutationFormValue {
  return {
    method,
    whereUnique: { field: "id" },
    data: {},
    queryShape: "none",
    select: {},
    include: {},
    omit: {},
  };
}

export function toPrismaMutationForm(
  value: MutationFormValue,
  fields: MutationFormFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const where = toPrismaWhereUnique(value.whereUnique, fields.uniqueFields);
  if (Object.keys(where).length > 0) {
    result.where = where;
  }

  if (value.method === "update") {
    const data = toPrismaUpdateData(value.data, fields.dataFields);
    if (Object.keys(data).length > 0) {
      result.data = data;
    }
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
