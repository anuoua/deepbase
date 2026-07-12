export interface PaginationFieldConfig {
  name: string;
  label: string;
}

import { toPlaceholderAwareValue } from "../ProPrismaPlaceholder/utils";

export interface PaginationValue {
  take?: number;
  skip?: number;
  cursorField?: string;
  cursorValue?: string | number | Record<string, true>;
}

export function toPrismaPagination(
  value: PaginationValue,
  fields: PaginationFieldConfig[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (value.take !== undefined && value.take !== null) {
    result.take = value.take;
  }
  if (value.skip !== undefined && value.skip !== null) {
    result.skip = value.skip;
  }
  if (value.cursorField) {
    const cv = toPlaceholderAwareValue(value.cursorValue);
    if (cv !== undefined && cv !== null && cv !== "") {
      const numVal = Number(cv);
      result.cursor = {
        [value.cursorField]: isNaN(numVal) ? cv : numVal,
      };
    }
  }
  return result;
}

export function emptyPaginationValue(): PaginationValue {
  return {};
}
