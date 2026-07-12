import type { WhereGroup, FieldConfig as WhereFieldConfig } from "../../inputs/ProPrismaWhere/types";
import type { OrderByFieldConfig, OrderByValue } from "../../inputs/ProPrismaOrderBy/types";
import type { PaginationFieldConfig, PaginationValue } from "../../inputs/ProPrismaPagination/types";
import type { AggregateFieldConfig, AggregateValue } from "../../inputs/ProPrismaAggregate/types";
import { toPrismaWhere } from "../../inputs/ProPrismaWhere/types";
import { toPrismaOrderBy } from "../../inputs/ProPrismaOrderBy/types";
import { toPrismaPagination } from "../../inputs/ProPrismaPagination/types";
import { toPrismaAggregate } from "../../inputs/ProPrismaAggregate/types";

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
