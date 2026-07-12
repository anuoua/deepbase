import { isPlaceholderValue, PLACEHOLDER_SENTINEL } from "../ProPrismaPlaceholder/utils";

export type FieldType = "string" | "number" | "boolean" | "date" | "enum" | "json";

export interface FieldConfig {
  name: string;
  label: string;
  type?: FieldType;
  enums?: { label: string; value: string | number }[];
  isList?: boolean;
  isRequired?: boolean;
  children?: FieldConfig[] | (() => FieldConfig[]);
}

export function resolveChildren(field: FieldConfig): FieldConfig[] {
  const c = field.children;
  return typeof c === "function" ? c() : c ?? [];
}

export function hasChildren(field: FieldConfig): boolean {
  return !!field.children;
}

export interface WhereCondition {
  field: string;
  operator: string;
  value: unknown;
  mode?: "insensitive";
}

export interface WhereGroup {
  type: "AND" | "OR" | "NOT";
  children: (WhereCondition | WhereGroup)[];
}

export type WhereNode = WhereCondition | WhereGroup;

export type StringOperator =
  | "equals"
  | "not"
  | "in"
  | "notIn"
  | "contains"
  | "startsWith"
  | "endsWith";

export type NumberOperator =
  | "equals"
  | "not"
  | "in"
  | "notIn"
  | "gt"
  | "gte"
  | "lt"
  | "lte";

export type DateOperator =
  | "equals"
  | "not"
  | "in"
  | "notIn"
  | "gt"
  | "gte"
  | "lt"
  | "lte";

export type BooleanOperator = "equals";

export type EnumOperator = "equals" | "not" | "in" | "notIn";

export type ToManyOperator = "some" | "every" | "none";

export type ScalarListOperator = "has" | "hasEvery" | "hasSome" | "isEmpty" | "isSet";

export const STRING_OPERATORS: { label: string; value: string }[] = [
  { label: "equals", value: "equals" },
  { label: "not", value: "not" },
  { label: "in", value: "in" },
  { label: "notIn", value: "notIn" },
  { label: "contains", value: "contains" },
  { label: "startsWith", value: "startsWith" },
  { label: "endsWith", value: "endsWith" },
];

export const NUMBER_OPERATORS: { label: string; value: string }[] = [
  { label: "equals", value: "equals" },
  { label: "not", value: "not" },
  { label: "in", value: "in" },
  { label: "notIn", value: "notIn" },
  { label: "gt", value: "gt" },
  { label: "gte", value: "gte" },
  { label: "lt", value: "lt" },
  { label: "lte", value: "lte" },
];

export const BOOLEAN_OPERATORS: { label: string; value: string }[] = [
  { label: "equals", value: "equals" },
];

export const DATE_OPERATORS: { label: string; value: string }[] = [
  { label: "equals", value: "equals" },
  { label: "not", value: "not" },
  { label: "in", value: "in" },
  { label: "notIn", value: "notIn" },
  { label: "gt (after)", value: "gt" },
  { label: "gte (on/after)", value: "gte" },
  { label: "lt (before)", value: "lt" },
  { label: "lte (on/before)", value: "lte" },
];

export const ENUM_OPERATORS: { label: string; value: string }[] = [
  { label: "equals", value: "equals" },
  { label: "not", value: "not" },
  { label: "in", value: "in" },
  { label: "notIn", value: "notIn" },
];

export const JSON_OPERATORS: { label: string; value: string }[] = [
  { label: "path (equals)", value: "path_equals" },
  { label: "string_contains", value: "string_contains" },
];

export const FULLTEXT_OPERATORS: { label: string; value: string }[] = [
  { label: "search", value: "search" },
];

export const TO_MANY_OPERATORS: { label: string; value: string }[] = [
  { label: "some (at least one)", value: "some" },
  { label: "every (all)", value: "every" },
  { label: "none (zero)", value: "none" },
];

export const TO_ONE_OPERATORS: { label: string; value: string }[] = [
  { label: "is", value: "is" },
  { label: "isNot", value: "isNot" },
];

export const SCALAR_LIST_OPERATORS: { label: string; value: string }[] = [
  { label: "has", value: "has" },
  { label: "hasEvery", value: "hasEvery" },
  { label: "hasSome", value: "hasSome" },
  { label: "isEmpty", value: "isEmpty" },
  { label: "equals", value: "equals" },
];

export const OPTIONAL_SCALAR_OPERATORS: { label: string; value: string }[] = [
  { label: "isSet", value: "isSet" },
];

const RELATION_OPERATORS = new Set(["some", "every", "none", "is", "isNot"]);

export function isRelationOperator(operator: string): boolean {
  return RELATION_OPERATORS.has(operator);
}

export function isScalarList(field: FieldConfig): boolean {
  return field.isList === true && !hasChildren(field);
}

export function getOperatorsByType(field: FieldConfig): { label: string; value: string }[] {
  if (hasChildren(field)) {
    return field.isList === false ? TO_ONE_OPERATORS : TO_MANY_OPERATORS;
  }
  if (isScalarList(field)) {
    return SCALAR_LIST_OPERATORS;
  }
  let ops: { label: string; value: string }[];
  switch (field.type) {
    case "string":
      ops = STRING_OPERATORS;
      break;
    case "number":
      ops = NUMBER_OPERATORS;
      break;
    case "boolean":
      ops = BOOLEAN_OPERATORS;
      break;
    case "date":
      ops = DATE_OPERATORS;
      break;
    case "enum":
      ops = ENUM_OPERATORS;
      break;
    case "json":
      ops = JSON_OPERATORS;
      break;
    default:
      ops = STRING_OPERATORS;
  }
  if (field.type === "string") {
    ops = [...ops, ...FULLTEXT_OPERATORS];
  }
  if (field.isRequired === false) {
    ops = [...ops, ...OPTIONAL_SCALAR_OPERATORS];
  }
  return ops;
}

export function getDefaultOperator(field: FieldConfig): string {
  if (hasChildren(field)) {
    return field.isList === false ? "is" : "some";
  }
  if (isScalarList(field)) {
    return "has";
  }
  switch (field.type) {
    case "string":
      return "contains";
    case "number":
      return "equals";
    case "boolean":
      return "equals";
    case "date":
      return "equals";
    case "enum":
      return "equals";
    case "json":
      return "path_equals";
    default:
      return "equals";
  }
}

const SCALAR_LIST_ARRAY_OPS = new Set(["hasEvery", "hasSome"]);

export function canBeMultipleValue(operator: string): boolean {
  return operator === "in" || operator === "notIn" || SCALAR_LIST_ARRAY_OPS.has(operator);
}

export function toPrismaWhere(node: WhereNode, fields: FieldConfig[]): Record<string, unknown> {
  return nodeToPrisma(node, fields);
}

function nodeToPrisma(node: WhereNode, fields: FieldConfig[]): Record<string, unknown> {
  if ("children" in node) {
    const conditions = node.children
      .map((child) => nodeToPrisma(child, fields))
      .filter((c): c is Record<string, unknown> => Object.keys(c).length > 0);
    if (conditions.length === 0) return {};
    if (node.type === "NOT") {
      if (conditions.length === 1) return { NOT: conditions[0]! };
      return { NOT: conditions };
    }
    if (conditions.length === 1) return conditions[0]!;
    return { [node.type]: conditions };
  }

  const fieldConfig = fields.find((f) => f.name === node.field);
  if (!fieldConfig) return {};

  if (hasChildren(fieldConfig) && isRelationOperator(node.operator)) {
    if (!node.value || typeof node.value !== "object" || !("children" in (node.value as any))) {
      return {};
    }
    const nestedFields = resolveChildren(fieldConfig);
    const nestedWhere = nodeToPrisma(node.value as WhereGroup, nestedFields);
    if (Object.keys(nestedWhere).length === 0) return {};
    return { [node.field]: { [node.operator]: nestedWhere } };
  }

  const value = node.value;
  if (value === undefined || value === "") return {};

  const isPH = isPlaceholderValue(value);

  // isSet operator
  if (node.operator === "isSet") {
    return { [node.field]: { isSet: isPH ? PLACEHOLDER_SENTINEL : Boolean(value) } };
  }

  // null is a valid filter value for equals/not operators
  if (value === null) {
    if (node.operator === "equals" || node.operator === "not") {
      return { [node.field]: { [node.operator]: null } };
    }
    return {};
  }

  // Scalar list: isEmpty
  if (isScalarList(fieldConfig) && node.operator === "isEmpty") {
    return { [node.field]: { isEmpty: isPH ? PLACEHOLDER_SENTINEL : Boolean(value) } };
  }

  // JSON path filters (compound objects — skip placeholder since the UI
  // doesn't support marking sub-fields individually)
  if (node.operator === "path_equals") {
    if (isPH) return {};
    const v = value as { path?: string[]; equals?: unknown };
    if (v && Array.isArray(v.path) && v.equals !== undefined) {
      return { [node.field]: { path: v.path, equals: v.equals } };
    }
    return {};
  }
  if (node.operator === "string_contains") {
    if (isPH) return {};
    const v = value as { path?: string[]; string_contains?: string };
    if (v && Array.isArray(v.path) && typeof v.string_contains === "string") {
      return { [node.field]: { path: v.path, string_contains: v.string_contains } };
    }
    return {};
  }

  // Full-text search
  if (node.operator === "search") {
    return { [node.field]: { search: isPH ? PLACEHOLDER_SENTINEL : value } };
  }

  // Scalar list equals (array-based)
  if (isScalarList(fieldConfig) && node.operator === "equals") {
    if (!isPH && (!Array.isArray(value) || value.length === 0)) return {};
    return { [node.field]: { equals: isPH ? PLACEHOLDER_SENTINEL : value } };
  }

  // equals shorthand
  if (node.operator === "equals") {
    if (node.mode === "insensitive") {
      return { [node.field]: { equals: isPH ? PLACEHOLDER_SENTINEL : value, mode: "insensitive" } };
    }
    return { [node.field]: isPH ? PLACEHOLDER_SENTINEL : value };
  }

  // in / notIn / hasEvery / hasSome (array-based)
  if (canBeMultipleValue(node.operator)) {
    if (!isPH && (!Array.isArray(value) || value.length === 0)) return {};
    return { [node.field]: { [node.operator]: isPH ? PLACEHOLDER_SENTINEL : value } };
  }

  // Default: wrap with operator key
  const result: Record<string, unknown> = { [node.operator]: isPH ? PLACEHOLDER_SENTINEL : value };
  if (node.mode === "insensitive") {
    result.mode = "insensitive";
  }
  return { [node.field]: result };
}