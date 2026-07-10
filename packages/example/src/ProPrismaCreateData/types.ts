export interface CreateFieldConfig {
  name: string;
  label: string;
  type?: "string" | "number" | "boolean" | "date" | "enum";
  enums?: { label: string; value: string | number }[];
  isList?: boolean;
  isRequired?: boolean;
  children?: CreateFieldConfig[] | (() => CreateFieldConfig[]);
}

export function resolveChildren(field: CreateFieldConfig): CreateFieldConfig[] {
  const c = field.children;
  return typeof c === "function" ? c() : c ?? [];
}

export function hasChildren(field: CreateFieldConfig): boolean {
  return !!field.children;
}

export function isScalarList(field: CreateFieldConfig): boolean {
  return field.isList === true && !hasChildren(field);
}

export function isRelation(field: CreateFieldConfig): boolean {
  return hasChildren(field);
}

export function isToOne(field: CreateFieldConfig): boolean {
  return isRelation(field) && field.isList === false;
}

export function isToMany(field: CreateFieldConfig): boolean {
  return isRelation(field) && field.isList === true;
}

export function toPrismaCreateData(
  value: Record<string, unknown>,
  fields: CreateFieldConfig[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const val = value[field.name];
    if (val === undefined || val === null) continue;

    if (isRelation(field)) {
      const r = val as Record<string, unknown>;
      if (r.mode === "connect") {
        if (isToOne(field)) {
          const id = r.id;
          if (id !== undefined && id !== null && id !== "") {
            result[field.name] = { connect: { id: Number(id) } };
          }
        } else {
          const ids = r.ids as unknown[];
          if (Array.isArray(ids) && ids.length > 0) {
            result[field.name] = { connect: ids.map((id) => ({ id: Number(id) })) };
          }
        }
      } else {
        if (isToOne(field)) {
          const data = r.data as Record<string, unknown>;
          if (data && typeof data === "object") {
            const nested = toPrismaCreateData(data, resolveChildren(field));
            if (Object.keys(nested).length > 0) {
              result[field.name] = { create: nested };
            }
          }
        } else {
          const items = r.items as Record<string, unknown>[];
          if (Array.isArray(items) && items.length > 0) {
            const creates = items
              .map((item) => toPrismaCreateData(item, resolveChildren(field)))
              .filter((o) => Object.keys(o).length > 0);
            if (creates.length > 0) {
              result[field.name] = { create: creates };
            }
          }
        }
      }
    } else if (isScalarList(field)) {
      if (Array.isArray(val) && val.length > 0) {
        result[field.name] = val;
      }
    } else {
      result[field.name] = val;
    }
  }
  return result;
}