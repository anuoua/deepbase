import { isPlaceholderValue, PLACEHOLDER_SENTINEL } from "../ProPrismaPlaceholder/utils";

export interface IncludeFieldConfig {
  name: string;
  label: string;
  isList?: boolean;
  children?: IncludeFieldConfig[] | (() => IncludeFieldConfig[]);
}

export function resolveChildren(field: IncludeFieldConfig): IncludeFieldConfig[] {
  const c = field.children;
  return typeof c === "function" ? c() : c ?? [];
}

export function hasChildren(field: IncludeFieldConfig): boolean {
  return !!field.children;
}

export interface IncludeRelationOptions {
  where?: Record<string, unknown>;
  orderBy?: Record<string, unknown>[];
  take?: number;
  skip?: number;
  include?: IncludeValue;
}

export type IncludeValue = {
  [fieldName: string]: boolean | IncludeRelationOptions;
};

export function toPrismaInclude(
  value: IncludeValue,
  fields: IncludeFieldConfig[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    if (!hasChildren(field)) continue;

    const val = value[field.name];
    if (val === true) {
      result[field.name] = true;
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      const opts = val as IncludeRelationOptions;
      const nested: Record<string, unknown> = {};

      if (isPlaceholderValue(opts.where)) {
        nested.where = PLACEHOLDER_SENTINEL;
      } else if (opts.where && Object.keys(opts.where).length > 0) {
        nested.where = opts.where;
      }
      if (isPlaceholderValue(opts.orderBy)) {
        nested.orderBy = PLACEHOLDER_SENTINEL;
      } else if (opts.orderBy && Array.isArray(opts.orderBy) && opts.orderBy.length > 0) {
        nested.orderBy = opts.orderBy;
      }
      if (isPlaceholderValue(opts.take)) {
        nested.take = PLACEHOLDER_SENTINEL;
      } else if (opts.take !== undefined && opts.take !== null) {
        nested.take = opts.take;
      }
      if (isPlaceholderValue(opts.skip)) {
        nested.skip = PLACEHOLDER_SENTINEL;
      } else if (opts.skip !== undefined && opts.skip !== null) {
        nested.skip = opts.skip;
      }
      if (opts.include) {
        const nestedInclude = toPrismaInclude(opts.include, resolveChildren(field));
        if (Object.keys(nestedInclude).length > 0) {
          nested.include = nestedInclude;
        }
      }

      result[field.name] = Object.keys(nested).length > 0 ? nested : true;
    }
  }

  return result;
}

export function emptyIncludeValue(): IncludeValue {
  return {};
}
