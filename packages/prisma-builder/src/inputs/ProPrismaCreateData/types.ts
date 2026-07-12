import { toPlaceholderAwareValue, PLACEHOLDER_SENTINEL, isPlaceholderValue } from "../ProPrismaPlaceholder/utils";

export interface CreateFieldConfig {
  name: string;
  label: string;
  type?: "string" | "number" | "boolean" | "date" | "enum" | "json";
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

    if (isPlaceholderValue(val)) {
      result[field.name] = PLACEHOLDER_SENTINEL;
      continue;
    }

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
      } else if (r.mode === "connectOrCreate") {
        if (isToOne(field)) {
          const whereId = r.whereId;
          if (whereId !== undefined && whereId !== null && whereId !== "") {
            const data = r.data as Record<string, unknown>;
            const nested = toPrismaCreateData(data ?? {}, resolveChildren(field));
            if (Object.keys(nested).length > 0) {
              result[field.name] = {
                connectOrCreate: { where: { id: Number(whereId) }, create: nested },
              };
            }
          }
        } else {
          const items = r.items as {
            whereId?: number;
            data?: Record<string, unknown>;
          }[];
          if (Array.isArray(items) && items.length > 0) {
            const entries = items
              .map((item) => {
                const whereId = item.whereId;
                if (whereId === undefined || whereId === null) return null;
                const nested = toPrismaCreateData(
                  item.data ?? {},
                  resolveChildren(field),
                );
                if (Object.keys(nested).length === 0) return null;
                return { where: { id: Number(whereId) }, create: nested };
              })
              .filter(
                (x): x is { where: { id: number }; create: Record<string, unknown> } =>
                  x !== null,
              );
            if (entries.length > 0) {
              result[field.name] = { connectOrCreate: entries };
            }
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
          const processed = toPrismaCreateData((r.__item__ ?? {}) as Record<string, unknown>, resolveChildren(field));
          if (Object.keys(processed).length > 0) {
            result[field.name] = { create: { __iter__: true, __item__: processed } };
          }
        }
      }
    } else if (isScalarList(field)) {
      if (Array.isArray(val) && val.length > 0) {
        result[field.name] = val;
      }
    } else {
      result[field.name] = toPlaceholderAwareValue(val);
    }
  }
  return result;
}