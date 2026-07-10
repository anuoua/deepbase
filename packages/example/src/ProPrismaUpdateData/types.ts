export {
  type CreateFieldConfig as UpdateFieldConfig,
  resolveChildren,
  hasChildren,
  isScalarList,
  isRelation,
  isToOne,
  isToMany,
} from "../ProPrismaCreateData/types";

import type { CreateFieldConfig } from "../ProPrismaCreateData/types";
import {
  resolveChildren,
  isScalarList,
  isRelation,
  isToOne,
  isToMany,
} from "../ProPrismaCreateData/types";

export function toPrismaUpdateData(
  value: Record<string, unknown>,
  fields: CreateFieldConfig[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const val = value[field.name];
    if (val === undefined || val === null) continue;

    if (isRelation(field)) {
      const r = val as Record<string, unknown>;
      const mode = r.mode as string;

      if (mode === "create") {
        const addCreate = (nested: Record<string, unknown>) => {
          if (Object.keys(nested).length > 0) {
            result[field.name] = { create: nested };
          }
        };
        if (isToOne(field)) {
          const data = r.data as Record<string, unknown>;
          if (data && typeof data === "object") {
            addCreate(toPrismaUpdateData(data, resolveChildren(field)));
          }
        } else {
          const items = r.items as Record<string, unknown>[];
          if (Array.isArray(items) && items.length > 0) {
            const creates = items
              .map((item) => toPrismaUpdateData(item, resolveChildren(field)))
              .filter((o) => Object.keys(o).length > 0);
            if (creates.length > 0) {
              result[field.name] = { create: creates };
            }
          }
        }
      } else if (mode === "connect") {
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
      } else if (mode === "disconnect") {
        if (isToOne(field)) {
          result[field.name] = { disconnect: true };
        } else {
          const ids = r.ids as unknown[];
          if (Array.isArray(ids) && ids.length > 0) {
            result[field.name] = { disconnect: ids.map((id) => ({ id: Number(id) })) };
          }
        }
      } else if (mode === "delete") {
        if (isToOne(field)) {
          result[field.name] = { delete: true };
        } else {
          const ids = r.ids as unknown[];
          if (Array.isArray(ids) && ids.length > 0) {
            result[field.name] = { delete: ids.map((id) => ({ id: Number(id) })) };
          }
        }
      } else if (mode === "update") {
        if (isToOne(field)) {
          const data = r.data as Record<string, unknown>;
          if (data && typeof data === "object") {
            const nested = toPrismaUpdateData(data, resolveChildren(field));
            if (Object.keys(nested).length > 0) {
              result[field.name] = { update: { data: nested } };
            }
          }
        } else {
          const items = r.items as {
            whereId?: number;
            data?: Record<string, unknown>;
          }[];
          if (Array.isArray(items) && items.length > 0) {
            const updates = items
              .map((item) => {
                const whereId = item.whereId;
                if (whereId === undefined || whereId === null) return null;
                const nested = toPrismaUpdateData(
                  item.data ?? {},
                  resolveChildren(field),
                );
                if (Object.keys(nested).length === 0) return null;
                return { where: { id: Number(whereId) }, data: nested };
              })
              .filter(
                (
                  x,
                ): x is {
                  where: { id: number };
                  data: Record<string, unknown>;
                } => x !== null,
              );
            if (updates.length > 0) {
              result[field.name] = { update: updates };
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