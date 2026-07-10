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

export type SelectValue = Record<string, boolean | { select: SelectValue }>;

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