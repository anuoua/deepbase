import { toPlaceholderAwareValue, PLACEHOLDER_SENTINEL } from "../ProPrismaPlaceholder/utils";

export interface UniqueFieldConfig {
  name: string;
  label: string;
  type: "string" | "number";
}

export interface WhereUniqueValue {
  field: string;
  value?: unknown;
}

export function toPrismaWhereUnique(
  value: WhereUniqueValue,
  fields: UniqueFieldConfig[],
): Record<string, unknown> {
  const fieldConfig = fields.find((f) => f.name === value.field);
  if (!fieldConfig) return {};

  const raw = value.value;
  if (raw === undefined || raw === null || raw === "") return {};

  const processed = toPlaceholderAwareValue(raw);
  if (processed === PLACEHOLDER_SENTINEL) {
    return { [fieldConfig.name]: processed };
  }

  return { [fieldConfig.name]: fieldConfig.type === "number" ? Number(processed) : processed };
}

export function emptyWhereUniqueValue(fields: UniqueFieldConfig[]): WhereUniqueValue {
  return { field: fields[0]?.name ?? "" };
}
