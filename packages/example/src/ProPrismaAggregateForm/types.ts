import type { WhereGroup, FieldConfig as WhereFieldConfig } from "../ProPrismaWhere/types";
import type { OrderByFieldConfig, OrderByValue } from "../ProPrismaOrderBy/types";
import type { PaginationFieldConfig, PaginationValue } from "../ProPrismaPagination/types";
import type { AggregateFieldConfig, AggregateValue } from "../ProPrismaAggregate/types";
import { toPrismaWhere } from "../ProPrismaWhere/types";
import { toPrismaOrderBy } from "../ProPrismaOrderBy/types";
import { toPrismaPagination } from "../ProPrismaPagination/types";
import { toPrismaAggregate } from "../ProPrismaAggregate/types";

export interface AggregateFormValue {
  where: WhereGroup;
  orderBy: OrderByValue;
  pagination: PaginationValue;
  aggregate: AggregateValue;
}

export interface AggregateFormFieldConfig {
  whereFields: WhereFieldConfig[];
  orderByFields: OrderByFieldConfig[];
  paginationFields: PaginationFieldConfig[];
  aggregateFields: AggregateFieldConfig[];
}

export function emptyAggregateFormValue(): AggregateFormValue {
  return {
    where: { type: "AND", children: [] },
    orderBy: [],
    pagination: {},
    aggregate: {},
  };
}

export function toPrismaAggregateForm(
  value: AggregateFormValue,
  fields: AggregateFormFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

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

  return result;
}
