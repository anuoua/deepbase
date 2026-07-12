import type { WhereUniqueValue, UniqueFieldConfig } from "../../inputs/ProPrismaWhereUnique/types";
import type { CreateFieldConfig } from "../../inputs/ProPrismaCreateData/types";
import type { SelectFieldConfig, SelectValue } from "../../inputs/ProPrismaSelect/types";
import type { IncludeFieldConfig, IncludeValue } from "../../inputs/ProPrismaInclude/types";
import type { OmitFieldConfig, OmitValue } from "../../inputs/ProPrismaOmit/types";
import { toPrismaWhereUnique } from "../../inputs/ProPrismaWhereUnique/types";
import { toPrismaCreateData } from "../../inputs/ProPrismaCreateData/types";
import { toPrismaUpdateData } from "../../inputs/ProPrismaUpdateData/types";
import { toPrismaSelect } from "../../inputs/ProPrismaSelect/types";
import { toPrismaInclude } from "../../inputs/ProPrismaInclude/types";
import { toPrismaOmit } from "../../inputs/ProPrismaOmit/types";

export type QueryShape = "none" | "select" | "include" | "omit";

export interface UpsertValue {
  where: WhereUniqueValue;
  create: Record<string, unknown>;
  update: Record<string, unknown>;
  queryShape: QueryShape;
  select: SelectValue;
  include: IncludeValue;
  omit: OmitValue;
}

export interface UpsertFieldConfig {
  uniqueFields: UniqueFieldConfig[];
  createFields: CreateFieldConfig[];
  updateFields: CreateFieldConfig[];
  selectFields: SelectFieldConfig[];
  includeFields: IncludeFieldConfig[];
  omitFields: OmitFieldConfig[];
}

export function emptyUpsertValue(): UpsertValue {
  return {
    where: { field: "id" },
    create: {},
    update: {},
    queryShape: "none",
    select: {},
    include: {},
    omit: {},
  };
}

export function toPrismaUpsert(
  value: UpsertValue,
  fields: UpsertFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const where = toPrismaWhereUnique(value.where, fields.uniqueFields);
  if (Object.keys(where).length > 0) {
    result.where = where;
  }

  const create = toPrismaCreateData(value.create, fields.createFields);
  if (Object.keys(create).length > 0) {
    result.create = create;
  }

  const update = toPrismaUpdateData(value.update, fields.updateFields);
  if (Object.keys(update).length > 0) {
    result.update = update;
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

export { toPrismaWhereUnique } from "../../inputs/ProPrismaWhereUnique/types";
export { toPrismaCreateData } from "../../inputs/ProPrismaCreateData/types";
export { toPrismaUpdateData } from "../../inputs/ProPrismaUpdateData/types";
