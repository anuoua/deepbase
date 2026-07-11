export interface UniqueFieldConfig {
  name: string;
  label: string;
  type: "string" | "number";
}

export interface WhereUniqueValue {
  field: string;
  value?: string | number;
}

export function toPrismaWhereUnique(
  value: WhereUniqueValue,
  fields: UniqueFieldConfig[],
): Record<string, unknown> {
  const fieldConfig = fields.find((f) => f.name === value.field);
  if (!fieldConfig) return {};

  if (value.value === undefined || value.value === null || value.value === "") return {};
  const numVal = Number(value.value);
  return { [fieldConfig.name]: fieldConfig.type === "number" ? numVal : value.value };
}

export function emptyWhereUniqueValue(fields: UniqueFieldConfig[]): WhereUniqueValue {
  return { field: fields[0]?.name ?? "" };
}
