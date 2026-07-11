import type { WhereGroup, FieldConfig as WhereFieldConfig } from "../ProPrismaWhere/types";
import type { OrderByFieldConfig, OrderByValue } from "../ProPrismaOrderBy/types";
import type { PaginationFieldConfig, PaginationValue } from "../ProPrismaPagination/types";
import { toPrismaWhere } from "../ProPrismaWhere/types";
import { toPrismaOrderBy } from "../ProPrismaOrderBy/types";
import { toPrismaPagination } from "../ProPrismaPagination/types";

export interface CountFormValue {
  where: WhereGroup;
  orderBy: OrderByValue;
  pagination: PaginationValue;
  selectAll: boolean;
  selectFields: string[];
}

export interface CountFormFieldConfig {
  whereFields: WhereFieldConfig[];
  orderByFields: OrderByFieldConfig[];
  paginationFields: PaginationFieldConfig[];
  allFieldNames: string[];
}

export function emptyCountFormValue(): CountFormValue {
  return {
    where: { type: "AND", children: [] },
    orderBy: [],
    pagination: {},
    selectAll: true,
    selectFields: [],
  };
}

export function toPrismaCountForm(
  value: CountFormValue,
  _fields: CountFormFieldConfig,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const where = toPrismaWhere(value.where, _fields.whereFields);
  if (Object.keys(where).length > 0) {
    result.where = where;
  }

  const orderBy = toPrismaOrderBy(value.orderBy, _fields.orderByFields);
  if (orderBy.length > 0) {
    result.orderBy = orderBy;
  }

  const pagination = toPrismaPagination(value.pagination, _fields.paginationFields);
  Object.assign(result, pagination);

  if (value.selectAll) {
    result.select = { _all: true };
  } else if (value.selectFields.length > 0) {
    const select: Record<string, boolean> = {};
    for (const f of value.selectFields) {
      select[f] = true;
    }
    result.select = select;
  }

  return result;
}
