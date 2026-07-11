import type { WhereUniqueValue, UniqueFieldConfig } from "../ProPrismaWhereUnique/types";
import type { WhereGroup, FieldConfig as WhereFieldConfig } from "../ProPrismaWhere/types";
import type { SelectFieldConfig, SelectValue } from "../ProPrismaSelect/types";
import type { IncludeFieldConfig, IncludeValue } from "../ProPrismaInclude/types";
import type { OmitFieldConfig, OmitValue } from "../ProPrismaOmit/types";
import type { OrderByFieldConfig, OrderByValue } from "../ProPrismaOrderBy/types";
import type { PaginationFieldConfig, PaginationValue } from "../ProPrismaPagination/types";
import type { DistinctFieldConfig, DistinctValue } from "../ProPrismaDistinct/types";
import { toPrismaWhereUnique } from "../ProPrismaWhereUnique/types";
import { toPrismaWhere } from "../ProPrismaWhere/types";
import { toPrismaOrderBy } from "../ProPrismaOrderBy/types";
import { toPrismaPagination } from "../ProPrismaPagination/types";
import { toPrismaDistinct } from "../ProPrismaDistinct/types";
import { toPrismaSelect } from "../ProPrismaSelect/types";
import { toPrismaInclude } from "../ProPrismaInclude/types";
import { toPrismaOmit } from "../ProPrismaOmit/types";

export type FindMethod = "findUnique" | "findFirst" | "findMany";
export type QueryShape = "none" | "select" | "include" | "omit";

export interface FindFormValue {
  method: FindMethod;
  where: WhereGroup;
  whereUnique: WhereUniqueValue;
  orderBy: OrderByValue;
  pagination: PaginationValue;
  distinct: DistinctValue;
  queryShape: QueryShape;
  select: SelectValue;
  include: IncludeValue;
  omit: OmitValue;
}

export interface FindFormFieldConfig {
  whereFields: WhereFieldConfig[];
  whereUniqueFields: UniqueFieldConfig[];
  orderByFields: OrderByFieldConfig[];
  paginationFields: PaginationFieldConfig[];
  distinctFields: DistinctFieldConfig[];
  selectFields: SelectFieldConfig[];
  includeFields: IncludeFieldConfig[];
  omitFields: OmitFieldConfig[];
}

export function emptyFindFormValue(method: FindMethod = "findMany"): FindFormValue {
  return {
    method,
    where: { type: "AND", children: [] },
    whereUnique: { field: "id" },
    orderBy: [],
    pagination: {},
    distinct: [],
    queryShape: "none",
    select: {},
    include: {},
    omit: {},
  };
}

export function toPrismaFindForm(
  value: FindFormValue,
  fields: FindFormFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (value.method === "findUnique") {
    const where = toPrismaWhereUnique(value.whereUnique, fields.whereUniqueFields);
    if (Object.keys(where).length > 0) {
      result.where = where;
    }
  } else {
    const where = toPrismaWhere(value.where, fields.whereFields);
    if (Object.keys(where).length > 0) {
      result.where = where;
    }
    const orderBy = toPrismaOrderBy(value.orderBy, fields.orderByFields);
    if (orderBy.length > 0) {
      result.orderBy = orderBy;
    }
    const pagination = toPrismaPagination(value.pagination, fields.paginationFields);
    Object.assign(result, pagination);
    const distinct = toPrismaDistinct(value.distinct);
    if (distinct.length > 0) {
      result.distinct = distinct;
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
