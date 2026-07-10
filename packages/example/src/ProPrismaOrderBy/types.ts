export interface OrderByFieldConfig {
  name: string;
  label: string;
  children?: OrderByFieldConfig[] | (() => OrderByFieldConfig[]);
}

export function resolveChildren(field: OrderByFieldConfig): OrderByFieldConfig[] {
  const c = field.children;
  return typeof c === "function" ? c() : c ?? [];
}

export function hasChildren(field: OrderByFieldConfig): boolean {
  return !!field.children;
}

export interface OrderByEntry {
  field: string;
  direction: "asc" | "desc";
  children?: OrderByEntry[];
}

export type OrderByValue = OrderByEntry[];

export function toPrismaOrderBy(
  value: OrderByValue,
  fields: OrderByFieldConfig[],
): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];
  for (const entry of value) {
    const fieldConfig = fields.find((f) => f.name === entry.field);
    if (!fieldConfig) continue;

    if (hasChildren(fieldConfig) && entry.children && entry.children.length > 0) {
      const nested: Record<string, unknown> = {};
      for (const child of entry.children) {
        nested[child.field] = child.direction;
      }
      result.push({ [entry.field]: nested });
    } else {
      result.push({ [entry.field]: entry.direction });
    }
  }
  return result;
}

export function createEmptyEntry(
  fields: OrderByFieldConfig[],
): OrderByEntry {
  const firstField = fields[0];
  return {
    field: firstField?.name ?? "",
    direction: "asc",
  };
}