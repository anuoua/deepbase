export interface PaginationFieldConfig {
  name: string;
  label: string;
}

export interface PaginationValue {
  take?: number;
  skip?: number;
  cursorField?: string;
  cursorValue?: string | number;
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
  if (
    value.cursorField &&
    value.cursorValue !== undefined &&
    value.cursorValue !== null &&
    value.cursorValue !== ""
  ) {
    const numVal = Number(value.cursorValue);
    result.cursor = {
      [value.cursorField]: isNaN(numVal) ? value.cursorValue : numVal,
    };
  }
  return result;
}

export function emptyPaginationValue(): PaginationValue {
  return {};
}
