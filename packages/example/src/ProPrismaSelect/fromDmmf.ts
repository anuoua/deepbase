import type { SelectFieldConfig } from "../ProPrismaSelect/types";
import type { FieldConfig, FieldType } from "../ProPrismaWhere/types";
import type { OrderByFieldConfig } from "../ProPrismaOrderBy/types";
import type { CreateFieldConfig } from "../ProPrismaCreateData/types";
import type { IncludeFieldConfig } from "../ProPrismaInclude/types";
import type { UniqueFieldConfig } from "../ProPrismaWhereUnique/types";
import type { PaginationFieldConfig } from "../ProPrismaPagination/types";

export interface DmmfField {
  name: string;
  kind: "scalar" | "object" | "enum" | "unsupported";
  type: string;
  isRequired: boolean;
  isList: boolean;
  isReadOnly: boolean;
  isId?: boolean;
  isUnique?: boolean;
  relationName?: string;
}

export interface DmmfModel {
  name: string;
  fields: DmmfField[];
}

export interface DmmfEnumValue {
  name: string;
  dbName: string | null;
}

export interface DmmfEnum {
  name: string;
  values: DmmfEnumValue[];
}

export interface DmmfDocument {
  provider?: string;
  datamodel: {
    models: DmmfModel[];
    enums: DmmfEnum[];
  };
}

function prettify(name: string): string {
  if (name === "id" || name === "ID") return "ID";
  if (name === "url" || name === "URL") return "URL";
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/^./, (s) => s.toUpperCase());
}

function dmmfTypeToFieldType(dmmfType: string): FieldType {
  switch (dmmfType) {
    case "Int":
    case "BigInt":
    case "Float":
    case "Decimal":
      return "number";
    case "String":
      return "string";
    case "Boolean":
      return "boolean";
    case "DateTime":
      return "date";
    default:
      return "string";
  }
}

export function dmmfToWhereFields(
  document: DmmfDocument,
  modelName: string,
): FieldConfig[] {
  const model = document.datamodel.models.find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Model "${modelName}" not found in DMMF document`);
  }

  const enumMap = new Map(
    document.datamodel.enums.map((e) => [
      e.name,
      e.values.map((v) => ({ label: v.name, value: v.name })),
    ]),
  );

  const result: FieldConfig[] = [];

  for (const field of model.fields) {
    if (field.isReadOnly) continue;

    if (field.kind === "object") {
      result.push({
        name: field.name,
        label: prettify(field.name),
        isList: field.isList,
        children: () => dmmfToWhereFields(document, field.type),
      });
    } else if (field.kind === "enum") {
      result.push({
        name: field.name,
        label: prettify(field.name),
        type: "enum",
        ...(enumMap.has(field.type)
          ? { enums: enumMap.get(field.type)! }
          : {}),
      });
    } else {
      result.push({
        name: field.name,
        label: prettify(field.name),
        type: dmmfTypeToFieldType(field.type),
        isRequired: field.isRequired,
        ...(field.isList ? { isList: true } : {}),
      });
    }
  }

  return result;
}

export function dmmfToSelectFields(
  document: DmmfDocument,
  modelName: string,
): SelectFieldConfig[] {
  const model = document.datamodel.models.find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Model "${modelName}" not found in DMMF document`);
  }

  const result: SelectFieldConfig[] = [];

  for (const field of model.fields) {
    if (field.isReadOnly) continue;

    if (field.kind === "object") {
      result.push({
        name: field.name,
        label: prettify(field.name),
        children: () => dmmfToSelectFields(document, field.type),
      });
    } else {
      result.push({
        name: field.name,
        label: prettify(field.name),
      });
    }
  }

  return result;
}

export function dmmfToOrderByFields(
  document: DmmfDocument,
  modelName: string,
): OrderByFieldConfig[] {
  const model = document.datamodel.models.find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Model "${modelName}" not found in DMMF document`);
  }

  const result: OrderByFieldConfig[] = [];

  for (const field of model.fields) {
    if (field.isReadOnly) continue;

    if (field.kind === "object") {
      result.push({
        name: field.name,
        label: prettify(field.name),
        children: () => dmmfToOrderByFields(document, field.type),
      });
    } else {
      result.push({
        name: field.name,
        label: prettify(field.name),
      });
    }
  }

  return result;
}

export function dmmfToCreateFields(
  document: DmmfDocument,
  modelName: string,
): CreateFieldConfig[] {
  const model = document.datamodel.models.find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Model "${modelName}" not found in DMMF document`);
  }

  const enumMap = new Map(
    document.datamodel.enums.map((e) => [
      e.name,
      e.values.map((v) => ({ label: v.name, value: v.name })),
    ]),
  );

  const result: CreateFieldConfig[] = [];

  for (const field of model.fields) {
    if (field.isReadOnly) continue;

    if (field.kind === "object") {
      result.push({
        name: field.name,
        label: prettify(field.name),
        isList: field.isList,
        isRequired: field.isRequired,
        children: () => dmmfToCreateFields(document, field.type),
      });
    } else if (field.kind === "enum") {
      result.push({
        name: field.name,
        label: prettify(field.name),
        type: "enum",
        isRequired: field.isRequired,
        ...(enumMap.has(field.type)
          ? { enums: enumMap.get(field.type)! }
          : {}),
      });
    } else {
      result.push({
        name: field.name,
        label: prettify(field.name),
        type: dmmfTypeToFieldType(field.type),
        isRequired: field.isRequired,
        ...(field.isList ? { isList: true } : {}),
      });
    }
  }

  return result;
}

export function dmmfToIncludeFields(
  document: DmmfDocument,
  modelName: string,
): IncludeFieldConfig[] {
  const model = document.datamodel.models.find((m) => m.name === modelName);
  if (!model) {
    throw new Error(`Model "${modelName}" not found in DMMF document`);
  }

  const result: IncludeFieldConfig[] = [];

  for (const field of model.fields) {
    if (field.isReadOnly) continue;

    if (field.kind === "object") {
      result.push({
        name: field.name,
        label: prettify(field.name),
        isList: field.isList,
        children: () => dmmfToIncludeFields(document, field.type),
      });
    }
  }

  return result;
}

export function dmmfToUniqueFields(
  document: DmmfDocument,
  modelName: string,
): UniqueFieldConfig[] {
  const model = document.datamodel.models.find((m) => m.name === modelName);
  if (!model) throw new Error(`Model "${modelName}" not found in DMMF document`);

  const result: UniqueFieldConfig[] = [];
  for (const field of model.fields) {
    if (field.isReadOnly) continue;
    if (field.kind !== "scalar" && field.kind !== "enum") continue;
    const isUnique = field.isId || field.isUnique;
    if (!isUnique) continue;

    const fieldType = dmmfTypeToFieldType(field.type);
    result.push({
      name: field.name,
      label: prettify(field.name),
      type: fieldType === "number" ? "number" : "string",
    });
  }
  return result;
}

export function dmmfToPaginationFields(
  document: DmmfDocument,
  modelName: string,
): PaginationFieldConfig[] {
  return dmmfToUniqueFields(document, modelName).map((f) => ({
    name: f.name,
    label: f.label,
  }));
}