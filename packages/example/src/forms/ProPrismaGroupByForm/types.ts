import type { WhereGroup, FieldConfig as WhereFieldConfig } from "../../inputs/ProPrismaWhere/types";
import type { OrderByFieldConfig, OrderByValue } from "../../inputs/ProPrismaOrderBy/types";
import type { PaginationFieldConfig, PaginationValue } from "../../inputs/ProPrismaPagination/types";
import type { AggregateFieldConfig, AggregateValue } from "../../inputs/ProPrismaAggregate/types";
import { toPrismaWhere } from "../../inputs/ProPrismaWhere/types";
import { toPrismaOrderBy } from "../../inputs/ProPrismaOrderBy/types";
import { toPrismaPagination } from "../../inputs/ProPrismaPagination/types";
import { toPrismaAggregate } from "../../inputs/ProPrismaAggregate/types";

export interface GroupByFormValue {
  by: string[];
  where: WhereGroup;
  orderBy: OrderByValue;
  pagination: PaginationValue;
  having: string;
  aggregate: AggregateValue;
}

export interface GroupByFormFieldConfig {
  byFieldNames: string[];
  whereFields: WhereFieldConfig[];
  orderByFields: OrderByFieldConfig[];
  paginationFields: PaginationFieldConfig[];
  aggregateFields: AggregateFieldConfig[];
}

export function emptyGroupByFormValue(): GroupByFormValue {
  return {
    by: [],
    where: { type: "AND", children: [] },
    orderBy: [],
    pagination: {},
    having: "",
    aggregate: {},
  };
}

export function toPrismaGroupByForm(
  value: GroupByFormValue,
  fields: GroupByFormFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (value.by.length > 0) {
    result.by = value.by;
  }

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

  const agg = toPrismaAggregate(value.aggregate, fields.aggregateFields);
  Object.assign(result, agg);

  if (value.having && value.having !== "" && value.having !== "{}") {
    try {
      result.having = JSON.parse(value.having);
    } catch {
      result.having = value.having;
    }
  }

  return result;
}
