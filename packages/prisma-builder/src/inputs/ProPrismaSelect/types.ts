export interface SelectFieldConfig {
  name: string;
  label: string;
  children?: SelectFieldConfig[] | (() => SelectFieldConfig[]);
}

export function resolveChildren(
  field: SelectFieldConfig,
): SelectFieldConfig[] {
  const c = field.children;
  return typeof c === "function" ? c() : c ?? [];
}

export function hasChildren(field: SelectFieldConfig): boolean {
  return !!field.children;
}

export type SelectValue = {
  [fieldName: string]: boolean | { select: SelectValue };
} & { _count?: boolean | { select: Record<string, boolean> } };

export function toPrismaSelect(
  value: SelectValue,
  fields: SelectFieldConfig[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    const fieldValue = value[field.name];
    if (fieldValue === true) {
      if (hasChildren(field)) {
        result[field.name] = {
          select: toPrismaSelect({}, resolveChildren(field)),
        };
      } else {
        result[field.name] = true;
      }
    } else if (fieldValue && typeof fieldValue === "object" && "select" in fieldValue) {
      result[field.name] = {
        select: toPrismaSelect(fieldValue.select, resolveChildren(field)),
      };
    }
  }

  const val = value as Record<string, unknown>;
  if (val._count) {
    if (val._count === true) {
      result._count = true;
    } else if (typeof val._count === "object" && val._count !== null && "select" in val._count) {
      result._count = { select: (val._count as { select: Record<string, boolean> }).select };
    }
  }

  return result;
}

export function emptySelectValue(fields: SelectFieldConfig[]): SelectValue {
  const result: SelectValue = {};
  for (const field of fields) {
    if (!hasChildren(field)) {
      result[field.name] = true;
    }
  }
  return result;
}