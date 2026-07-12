export {
  type CreateFieldConfig as UpdateFieldConfig,
  resolveChildren,
  hasChildren,
  isScalarList,
  isRelation,
  isToOne,
  isToMany,
} from "../ProPrismaCreateData/types";

import { toPlaceholderAwareValue } from "../ProPrismaPlaceholder/utils";
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
          const processed = toPrismaUpdateData((r.__item__ ?? {}) as Record<string, unknown>, resolveChildren(field));
          if (Object.keys(processed).length > 0) {
            result[field.name] = { create: { __iter__: true, __item__: processed } };
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
              result[field.name] = { update: nested };
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
      } else if (mode === "connectOrCreate") {
        if (isToOne(field)) {
          const whereId = r.whereId;
          if (whereId !== undefined && whereId !== null && whereId !== "") {
            const data = r.data as Record<string, unknown>;
            const nested = toPrismaUpdateData(data ?? {}, resolveChildren(field));
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
                const nested = toPrismaUpdateData(
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
      } else if (mode === "upsert") {
        if (isToOne(field)) {
          const createData = r.createData as Record<string, unknown>;
          const updateData = r.updateData as Record<string, unknown>;
          const createNested = toPrismaUpdateData(createData ?? {}, resolveChildren(field));
          const updateNested = toPrismaUpdateData(updateData ?? {}, resolveChildren(field));
          if (Object.keys(createNested).length > 0 || Object.keys(updateNested).length > 0) {
            result[field.name] = { upsert: { create: createNested, update: updateNested } };
          }
        } else {
          const items = r.items as {
            whereId?: number;
            createData?: Record<string, unknown>;
            updateData?: Record<string, unknown>;
          }[];
          if (Array.isArray(items) && items.length > 0) {
            const entries = items
              .map((item) => {
                const whereId = item.whereId;
                if (whereId === undefined || whereId === null) return null;
                const createNested = toPrismaUpdateData(
                  item.createData ?? {},
                  resolveChildren(field),
                );
                const updateNested = toPrismaUpdateData(
                  item.updateData ?? {},
                  resolveChildren(field),
                );
                if (
                  Object.keys(createNested).length === 0 &&
                  Object.keys(updateNested).length === 0
                )
                  return null;
                return {
                  where: { id: Number(whereId) },
                  create: createNested,
                  update: updateNested,
                };
              })
              .filter(
                (
                  x,
                ): x is {
                  where: { id: number };
                  create: Record<string, unknown>;
                  update: Record<string, unknown>;
                } => x !== null,
              );
            if (entries.length > 0) {
              result[field.name] = { upsert: entries };
            }
          }
        }
      } else if (mode === "set") {
        if (isToOne(field)) {
          const id = r.id;
          if (id !== undefined && id !== null && id !== "") {
            result[field.name] = { set: { id: Number(id) } };
          }
        } else {
          const ids = r.ids as unknown[];
          if (Array.isArray(ids) && ids.length > 0) {
            result[field.name] = { set: ids.map((id) => ({ id: Number(id) })) };
          }
        }
      } else if (mode === "updateMany") {
        const where = r.where as Record<string, unknown>;
        const data = r.data as Record<string, unknown>;
        const whereFilter = where && typeof where === "object" ? where : {};
        const nested = toPrismaUpdateData(data ?? {}, resolveChildren(field));
        if (Object.keys(nested).length > 0) {
          result[field.name] = { updateMany: { where: whereFilter, data: nested } };
        }
      } else if (mode === "deleteMany") {
        if (r.all === true) {
          result[field.name] = { deleteMany: true };
        } else {
          const where = r.where as Record<string, unknown>;
          const whereFilter = where && typeof where === "object" ? where : {};
          if (Object.keys(whereFilter).length > 0) {
            result[field.name] = { deleteMany: whereFilter };
          }
        }
      }
    } else if (isScalarList(field)) {
      if (Array.isArray(val) && val.length > 0) {
        result[field.name] = val;
      }
    } else {
      // Detect atomic operation: { _atomic: "increment", _value: 1 }
      if (val && typeof val === "object" && "_atomic" in val) {
        const r = val as { _atomic: string; _value: number };
        const numVal = Number(r._value);
        if (!isNaN(numVal)) {
          result[field.name] = { [r._atomic]: numVal };
        }
      } else {
        result[field.name] = toPlaceholderAwareValue(val);
      }
    }
  }
  return result;
}