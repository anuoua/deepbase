export interface DistinctFieldConfig {
  name: string;
  label: string;
}

export type DistinctValue = string[];

export function toPrismaDistinct(value: DistinctValue): string[] {
  return value;
}
