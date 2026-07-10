export type FieldType = "string" | "number" | "boolean" | "date" | "enum";

export interface FieldConfig {
  name: string;
  label: string;
  type?: FieldType;
  enums?: { label: string; value: string | number }[];
  isList?: boolean;
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
  type: "AND" | "OR";
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
  { label: "isSet", value: "isSet" },
  { label: "equals", value: "equals" },
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
  switch (field.type) {
    case "string":
      return STRING_OPERATORS;
    case "number":
      return NUMBER_OPERATORS;
    case "boolean":
      return BOOLEAN_OPERATORS;
    case "date":
      return DATE_OPERATORS;
    case "enum":
      return ENUM_OPERATORS;
    default:
      return STRING_OPERATORS;
  }
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
    if (conditions.length === 1) return conditions[0]!;
    return { [node.type === "AND" ? "AND" : "OR"]: conditions };
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
  if (value === undefined || value === null || value === "") return {};

  if (isScalarList(fieldConfig)) {
    if (node.operator === "isEmpty" || node.operator === "isSet") {
      return { [node.field]: { [node.operator]: Boolean(value) } };
    }
    if (node.operator === "equals") {
      if (!Array.isArray(value) || value.length === 0) return {};
      return { [node.field]: { equals: value } };
    }
  }

  if (node.operator === "equals") {
    if (node.mode === "insensitive") {
      return { [node.field]: { equals: value, mode: "insensitive" } };
    }
    return { [node.field]: value };
  }

  if (canBeMultipleValue(node.operator)) {
    if (!Array.isArray(value) || value.length === 0) return {};
    return { [node.field]: { [node.operator]: value } };
  }

  const result: Record<string, unknown> = { [node.operator]: value };
  if (node.mode === "insensitive") {
    result.mode = "insensitive";
  }
  return { [node.field]: result };
}