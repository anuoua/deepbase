export interface OmitFieldConfig {
  name: string;
  label: string;
  children?: OmitFieldConfig[] | (() => OmitFieldConfig[]);
}

export function resolveChildren(field: OmitFieldConfig): OmitFieldConfig[] {
  const c = field.children;
  return typeof c === "function" ? c() : c ?? [];
}

export function hasChildren(field: OmitFieldConfig): boolean {
  return !!field.children;
}

export type OmitValue = Record<string, boolean>;

export function toPrismaOmit(value: OmitValue): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    if (val === true) result[key] = true;
  }
  return result;
}

export function emptyOmitValue(): OmitValue {
  return {};
}
